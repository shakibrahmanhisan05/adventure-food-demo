/* =========================================================
   Adventure Food · owner dashboard
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = n => "৳" + Math.round(n || 0).toLocaleString("en-IN");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icon = id => `<svg class="ic"><use href="#i-${id}"/></svg>`;
  const ST = Orders.STATUS;
  const ACTIVE = ["placed", "confirmed", "preparing", "on_the_way"];
  const NEXT = {
    placed: ["confirmed", "Accept order"],
    confirmed: ["preparing", "Start preparing"],
    preparing: ["on_the_way", "Send for delivery"],
    on_the_way: ["delivered", "Mark delivered"]
  };
  const AUTH_KEY = "af_admin_auth";
  const SOUND_KEY = "af_admin_sound";
  const BASE_TITLE = document.title;

  const safe = {
    get(area, k) { try { return window[area].getItem(k); } catch { return null; } },
    set(area, k, v) { try { window[area].setItem(k, v); } catch { /* storage unavailable */ } },
    del(area, k) { try { window[area].removeItem(k); } catch { /* storage unavailable */ } }
  };

  let auth = safe.get("localStorage", AUTH_KEY) || safe.get("sessionStorage", AUTH_KEY);
  let orders = [];
  let known = null;           // id -> status from the previous refresh
  const freshIds = new Map(); // id -> time first seen (for the NEW highlight)
  let filter = "all";
  let query = "";
  let sound = safe.get("localStorage", SOUND_KEY) !== "off";
  let pollTimer = null;
  let openId = null;
  let busy = false;
  let unseen = 0;

  /* ---------- time ---------- */
  function ago(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 45) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " h ago";
    return new Date(ts).toLocaleDateString([], { day: "numeric", month: "short" }) + ", " + clock(ts);
  }
  const clock = ts => new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };

  /* ---------- sound ---------- */
  let audio = null;
  function unlockAudio() {
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === "suspended") audio.resume(); } catch { audio = null; }
  }
  function chime(kind) {
    if (!sound || !audio) return;
    const notes = kind === "cancel" ? [520, 390] : [880, 1175, 1568];
    notes.forEach((f, i) => {
      const o = audio.createOscillator(), g = audio.createGain();
      const t = audio.currentTime + i * 0.16;
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g).connect(audio.destination);
      o.start(t); o.stop(t + 0.4);
    });
  }
  document.addEventListener("pointerdown", unlockAudio, { once: true });

  /* ---------- toast & alert ---------- */
  function toast(emoji, title, sub) {
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<span class="toast__ic">${emoji}</span><div><div>${esc(title)}</div>${sub ? `<small>${esc(sub)}</small>` : ""}</div>`;
    const wrap = $("#toasts");
    while (wrap.children.length > 1) wrap.firstChild.remove();
    wrap.appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 300); }, 2600);
  }

  let alertTimer = null;
  function showAlert(order, kind) {
    const bar = $("#alertBar");
    const cancel = kind === "cancel";
    bar.className = "alert" + (cancel ? " alert--cancel" : "");
    bar.innerHTML = `<span class="alert__ic">${cancel ? "✖️" : "🔔"}</span>
      <div><b>${cancel ? `Order #${esc(order.id)} was cancelled` : `New order #${esc(order.id)}`}</b>
      <small>${esc(order.customer.name)} · ${fmt(order.total)} · ${order.items.reduce((s, i) => s + i.qty, 0)} items</small></div>`;
    bar.onclick = () => { bar.classList.remove("is-on"); openDetail(order.id); };
    requestAnimationFrame(() => bar.classList.add("is-on"));
    clearTimeout(alertTimer);
    alertTimer = setTimeout(() => bar.classList.remove("is-on"), 6000);
    chime(kind);
    if (navigator.vibrate) navigator.vibrate(cancel ? [200] : [200, 100, 200]);
    if (document.hidden) { unseen++; document.title = `(${unseen}) 🔔 New order · Adventure Food`; }
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { unseen = 0; document.title = BASE_TITLE; } });

  /* ---------- views ---------- */
  function showLogin() {
    clearInterval(pollTimer);
    $("#dashView").hidden = true;
    $("#loginView").hidden = false;
    setTimeout(() => $("#lgUser").focus(), 50);
  }

  async function showDash() {
    $("#loginView").hidden = true;
    $("#dashView").hidden = false;
    $("#todayText").textContent = new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
    updateSoundBtn();
    await refresh();
    const mode = await Orders.detect();
    if (mode === "local") {
      const n = $("#modeNotice");
      n.hidden = false;
      n.textContent = "Showing orders placed on this device. Deploy the site on Netlify to receive orders from every customer's phone.";
    }
    clearInterval(pollTimer);
    pollTimer = setInterval(refresh, mode === "cloud" ? 4000 : 2000);
  }

  window.addEventListener("storage", e => { if (e.key === Orders.LS_KEY && auth) refresh(); });

  /* ---------- data ---------- */
  function setLive(ok) {
    $("#liveBadge").classList.toggle("is-off", !ok);
    $("#liveText").textContent = ok ? `Live · ${clock(Date.now())}` : "Reconnecting…";
  }

  async function refresh() {
    if (busy || !auth) return;
    busy = true;
    try {
      const list = await Orders.list(auth);
      if (known) {
        list.slice().reverse().forEach(o => {
          if (!known.has(o.id)) { freshIds.set(o.id, Date.now()); showAlert(o, "new"); }
          else if (o.status === "cancelled" && known.get(o.id) !== "cancelled") {
            const last = (o.history || []).slice(-1)[0];
            if (last && last.by === "customer") showAlert(o, "cancel");
          }
        });
      }
      known = new Map(list.map(o => [o.id, o.status]));
      orders = list;
      render();
      setLive(true);
    } catch (err) {
      if (err.status === 401) { logout(true); return; }
      setLive(false);
    } finally {
      busy = false;
    }
  }

  async function changeStatus(id, status, btn) {
    if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.innerHTML = "Updating…"; }
    try {
      const updated = await Orders.setStatus(auth, id, status, status === "cancelled" ? "Cancelled by the store" : "");
      orders = orders.map(o => o.id === id ? updated : o);
      if (known) known.set(id, updated.status);
      freshIds.delete(id);
      render();
      toast(ST[status].emoji, `#${id} → ${ST[status].label}`, "The customer sees this update instantly");
    } catch (err) {
      if (btn && btn.isConnected) { btn.disabled = false; btn.innerHTML = btn.dataset.label; }
      if (err.status === 401) { logout(true); return; }
      toast("⚠️", "Couldn't update the order", err.message);
    }
  }

  /* ---------- render ---------- */
  function render() {
    renderKpis();
    renderChips();
    renderList();
    if (openId) renderDetail();
  }

  function renderKpis() {
    const t0 = startOfToday();
    const today = orders.filter(o => o.createdAt >= t0);
    const sold = today.filter(o => o.status !== "cancelled");
    const revenue = sold.reduce((s, o) => s + o.total, 0);
    const active = orders.filter(o => ACTIVE.includes(o.status)).length;
    const delivered = today.filter(o => o.status === "delivered").length;
    const cancelled = today.filter(o => o.status === "cancelled").length;
    const bar = today.length ? Object.keys(ST).map(k => {
      const n = today.filter(o => o.status === k).length;
      return n ? `<i style="width:${(n / today.length) * 100}%;background:${ST[k].color}"></i>` : "";
    }).join("") : "";
    $("#kpis").innerHTML = `
      <div class="kpi kpi--hero"><span class="kpi__label">Today's sales</span><div class="kpi__value">${fmt(revenue)}</div>
        <span class="kpi__sub">${today.length} order${today.length === 1 ? "" : "s"} today${sold.length ? ` · avg ${fmt(revenue / sold.length)}` : ""}</span>
        <div class="kpi__bar">${bar}</div></div>
      <div class="kpi"><span class="kpi__label">🔥 In progress</span><div class="kpi__value" style="color:${ST.preparing.color}">${active}</div><span class="kpi__sub">need attention</span></div>
      <div class="kpi"><span class="kpi__label">📦 Delivered</span><div class="kpi__value" style="color:${ST.delivered.color}">${delivered}</div><span class="kpi__sub">today</span></div>
      <div class="kpi"><span class="kpi__label">✖️ Cancelled</span><div class="kpi__value" style="color:${ST.cancelled.color}">${cancelled}</div><span class="kpi__sub">today</span></div>
      <div class="kpi"><span class="kpi__label">🧾 All orders</span><div class="kpi__value">${orders.length}</div><span class="kpi__sub">since launch</span></div>`;
  }

  function renderChips() {
    const count = k => k === "all" ? orders.length : k === "active" ? orders.filter(o => ACTIVE.includes(o.status)).length : orders.filter(o => o.status === k).length;
    const chips = [["all", "All"], ["active", "In progress"], ...Object.keys(ST).map(k => [k, ST[k].short])];
    $("#statusChips").innerHTML = chips.map(([k, label]) =>
      `<button class="chip${filter === k ? " is-active" : ""}" data-filter="${k}">${k in ST ? ST[k].emoji + " " : ""}${label} <b>${count(k)}</b></button>`).join("");
  }

  function visible() {
    const q = query.trim().toLowerCase();
    return orders.filter(o =>
      (filter === "all" || (filter === "active" ? ACTIVE.includes(o.status) : o.status === filter)) &&
      (!q || [o.id, o.customer.name, o.customer.phone, o.customer.area].join(" ").toLowerCase().includes(q)));
  }

  function itemsLine(o) {
    const parts = o.items.slice(0, 3).map(i => `${i.qty}× ${esc(i.name)}`);
    if (o.items.length > 3) parts.push(`+${o.items.length - 3} more`);
    return parts.join(", ");
  }

  function renderList() {
    const list = visible();
    if (!orders.length) {
      $("#orderList").innerHTML = `<div class="dash-empty" style="grid-column:1/-1"><div class="dash-empty__ic">🛎️</div><b>Waiting for your first order</b>
        New orders will pop up here instantly with a sound alert.<br><a class="btn btn--green" href="../" target="_blank" rel="noopener">Open the shop</a></div>`;
      return;
    }
    if (!list.length) {
      $("#orderList").innerHTML = `<div class="dash-empty" style="grid-column:1/-1"><div class="dash-empty__ic">🔎</div><b>No orders here</b>Try another filter or search.</div>`;
      return;
    }
    const now = Date.now();
    $("#orderList").innerHTML = list.map(o => {
      const st = ST[o.status];
      const isNew = freshIds.has(o.id) && now - freshIds.get(o.id) < 90000 && o.status === "placed";
      const next = NEXT[o.status];
      const initials = o.customer.name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
      return `<article class="ocard${isNew ? " is-new" : ""}" style="--st:${st.color};--st-bg:${st.bg}">
        <div class="ocard__head">
          <div><span class="ocard__id">#${esc(o.id)}</span>${isNew ? '<span class="new-tag">NEW</span>' : ""}<div class="ocard__time">${ago(o.createdAt)} · ${clock(o.createdAt)}</div></div>
          <span class="spill">${st.emoji} ${st.short}</span>
        </div>
        <div class="ocard__body" data-detail="${esc(o.id)}">
          <div class="ocard__cust"><span class="ocard__av">${esc(initials)}</span><div><b>${esc(o.customer.name)}</b><small>${esc(o.customer.phone)} · ${esc(o.customer.area)}</small></div></div>
          <div class="ocard__items">${itemsLine(o)}</div>
          <div class="ocard__meta"><span class="ocard__total">${fmt(o.total)}</span><span class="ocard__pay">${esc(o.payment)}</span></div>
        </div>
        <div class="ocard__actions">
          ${next ? `<button class="btn btn--green" data-set="${esc(o.id)}" data-to="${next[0]}">${ST[next[0]].emoji} ${next[1]}</button>` : `<button class="btn btn--light" style="flex:1 !important" data-detail="${esc(o.id)}">View details</button>`}
          ${ACTIVE.includes(o.status) ? `<button class="btn btn--cancel" data-cancel="${esc(o.id)}">Cancel</button>` : ""}
          ${next ? `<button class="btn btn--light" data-detail="${esc(o.id)}">Details</button>` : ""}
        </div>
      </article>`;
    }).join("");
  }

  /* ---------- detail sheet ---------- */
  function openDetail(id) {
    openId = id;
    renderDetail();
    $("#modal").classList.add("is-open");
    $("#modal").setAttribute("aria-hidden", "false");
    $("#scrim").classList.add("is-on");
    document.body.classList.add("lock");
    $("#modalBox").scrollTop = 0;
  }
  function closeDetail() {
    openId = null;
    $("#modal").classList.remove("is-open");
    $("#modal").setAttribute("aria-hidden", "true");
    $("#scrim").classList.remove("is-on");
    document.body.classList.remove("lock");
  }

  function renderDetail() {
    const o = orders.find(x => x.id === openId);
    if (!o) { closeDetail(); return; }
    const st = ST[o.status];
    const phone = o.customer.phone.replace(/^\+?88/, "");
    const wa = "https://wa.me/88" + phone + "?text=" + encodeURIComponent(`Assalamu Alaikum ${o.customer.name}, this is Adventure Food about your order #${o.id}.`);
    const history = (o.history || []).slice().reverse().map(h =>
      `<li class="is-done" style="--st:${ST[h.status].color}"><b>${ST[h.status].emoji} ${ST[h.status].label}</b><small>${clock(h.at)} · ${ago(h.at)} · by ${h.by === "customer" ? "customer" : "store"}${h.reason ? " · " + esc(h.reason) : ""}</small></li>`).join("");
    $("#modalContent").innerHTML = `<div class="detail">
      <div class="detail__head"><h2>#${esc(o.id)}</h2><span class="spill" style="--st:${st.color};--st-bg:${st.bg}">${st.emoji} ${st.label}</span></div>
      <p class="detail__when">Placed ${ago(o.createdAt)} · ${new Date(o.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>

      <div class="dsec"><h4>Customer</h4><div class="dbox">
        <p><b>${esc(o.customer.name)}</b> · ${esc(o.customer.phone)}</p>
        <p>📍 ${esc(o.customer.address)}, ${esc(o.customer.area)}</p>
        <p>🕒 ${esc(o.deliveryTime || "As soon as possible")}</p>
        ${o.note ? `<p>📝 ${esc(o.note)}</p>` : ""}
        <div class="dcontact">
          <a class="btn btn--green" href="tel:${esc(o.customer.phone)}">${icon("phone")}Call</a>
          <a class="btn btn--outline" href="${esc(wa)}" target="_blank" rel="noopener">${icon("whatsapp")}WhatsApp</a>
        </div>
      </div></div>

      <div class="dsec"><h4>Items</h4><div class="dbox">
        ${o.items.map(i => `<div class="ditem"><div>${i.qty}× ${esc(i.name)}${i.variant ? `<small>${esc(i.variant)}</small>` : ""}</div><b>${fmt(i.price * i.qty)}</b></div>`).join("")}
      </div>
      <div class="dbox" style="margin-top:8px">
        <div class="sum-row"><span>Subtotal</span><span>${fmt(o.subtotal)}</span></div>
        ${o.discount ? `<div class="sum-row sum-row--save"><span>Promo ${esc(o.coupon)}</span><span>−${fmt(o.discount)}</span></div>` : ""}
        <div class="sum-row"><span>Delivery</span><span>${o.deliveryFee ? fmt(o.deliveryFee) : "FREE"}</span></div>
        <div class="sum-row sum-row--total" style="margin:6px 0 0"><span>Total · ${esc(o.payment)}</span><span>${fmt(o.total)}</span></div>
      </div></div>

      <div class="dsec"><h4>Update status</h4><div class="status-grid">
        ${Object.keys(ST).map(k => `<button class="sbtn${k === o.status ? " is-current" : ""}" style="--st:${ST[k].color};--st-bg:${ST[k].bg}" data-set="${esc(o.id)}" data-to="${k}"${k === o.status ? " disabled" : ""}>${ST[k].emoji} ${ST[k].label}</button>`).join("")}
      </div></div>

      <div class="dsec"><h4>Status history</h4><ul class="timeline history">${history}</ul></div>
    </div>`;
  }

  /* ---------- events ---------- */
  $("#loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    unlockAudio();
    const btn = $("#loginBtn"), err = $("#loginError");
    err.textContent = "";
    btn.disabled = true; btn.textContent = "Signing in…";
    try {
      auth = await Orders.login($("#lgUser").value, $("#lgPass").value);
      const area = $("#lgRemember").checked ? "localStorage" : "sessionStorage";
      safe.set(area, AUTH_KEY, auth);
      $("#lgPass").value = "";
      known = null;
      await showDash();
      toast("👋", "Welcome back, Faruq bhai", "New orders will ring here automatically");
    } catch (ex) {
      err.textContent = ex.status === 401 ? "Wrong ID or password. Please try again." : (ex.message || "Couldn't sign in");
      const card = $(".login__card");
      card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
    } finally {
      btn.disabled = false; btn.textContent = "Sign In";
    }
  });

  $("#togglePass").addEventListener("click", () => {
    const i = $("#lgPass");
    i.type = i.type === "password" ? "text" : "password";
  });

  function logout(expired) {
    auth = null;
    safe.del("localStorage", AUTH_KEY);
    safe.del("sessionStorage", AUTH_KEY);
    known = null; orders = [];
    closeDetail();
    showLogin();
    if (expired) $("#loginError").textContent = "Please sign in again.";
  }
  $("#logoutBtn").addEventListener("click", () => logout(false));

  function updateSoundBtn() {
    const b = $("#soundBtn");
    b.innerHTML = icon(sound ? "bell" : "bell-off");
    b.classList.toggle("is-muted", !sound);
  }
  $("#soundBtn").addEventListener("click", () => {
    sound = !sound;
    safe.set("localStorage", SOUND_KEY, sound ? "on" : "off");
    updateSoundBtn();
    unlockAudio();
    if (sound) chime("new");
    toast(sound ? "🔔" : "🔕", sound ? "Sound alerts on" : "Sound alerts off");
  });

  $("#refreshBtn").addEventListener("click", async () => {
    const b = $("#refreshBtn");
    b.classList.remove("spin"); void b.offsetWidth; b.classList.add("spin");
    await refresh();
  });

  $("#orderSearch").addEventListener("input", e => { query = e.target.value; renderList(); });

  document.addEventListener("click", e => {
    const t = e.target.closest("[data-filter],[data-set],[data-cancel],[data-detail],[data-close]");
    if (!t) return;
    const d = t.dataset;
    if (d.filter) { filter = d.filter; renderChips(); renderList(); return; }
    if (d.set) { changeStatus(d.set, d.to, t); return; }
    if (d.cancel) {
      if (t.dataset.confirm !== "1") {
        t.dataset.confirm = "1"; t.textContent = "Sure?";
        setTimeout(() => { if (t.isConnected) { t.dataset.confirm = ""; t.textContent = "Cancel"; } }, 3000);
        return;
      }
      changeStatus(d.cancel, "cancelled", t);
      return;
    }
    if (d.detail) { openDetail(d.detail); return; }
    if (d.close !== undefined) closeDetail();
  });
  $("#scrim").addEventListener("click", closeDetail);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeDetail(); });

  // keep "x min ago" labels fresh
  setInterval(() => { if (auth && !$("#dashView").hidden) renderList(); }, 30000);

  /* ---------- boot ---------- */
  if (auth) showDash(); else showLogin();
})();
