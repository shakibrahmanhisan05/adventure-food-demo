/* =========================================================
   Adventure Food · storefront logic
   ========================================================= */
(() => {
  "use strict";

  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = n => "৳" + Math.round(n).toLocaleString("en-IN");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icon = (id, cls = "ic") => `<svg class="${cls}"><use href="#i-${id}"/></svg>`;

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
  };

  const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
  const catById = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
  const kitchenCats = CATEGORIES.filter(c => c.group === "kitchen");
  const groceryCats = CATEGORIES.filter(c => c.group === "grocery");

  const EMOJI = {
    c3: "🍟", f1: "🍛", f2: "🍜", f3: "🍕", d1: "🧋", d2: "🍋", d3: "🧃",
    g1: "🍅", g2: "🥔", g3: "🧅", g4: "🥕", g5: "🥬", g6: "🍌", g7: "🍎", g8: "🥭", g9: "🍊",
    g10: "🍗", g11: "🥩", g12: "🐟", g13: "🦐", g14: "🥛", g15: "🥚", g16: "🍨", g17: "🍞",
    g18: "🍚", g19: "🫒", g20: "🫘", g21: "🌶️", g22: "🍯", g23: "🍵", g24: "🍪", g25: "🥔",
    g26: "🍫", g27: "💧", g28: "🥤", g29: "🧺", g30: "🧼", g31: "🧴", g32: "🪥"
  };

  /* ---------- images: try each source, then draw our own ---------- */
  const IMG = {};
  const regImg = (key, srcs, fb) => { IMG[key] = { srcs, fb, ok: null }; };

  function fallbackURI(fb = {}) {
    const [c1, c2] = fb.color || ["#e3f7e6", "#4cc16a"];
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient>
      <pattern id='p' width='36' height='36' patternUnits='userSpaceOnUse'><circle cx='18' cy='18' r='2.2' fill='#fff' fill-opacity='.4'/></pattern></defs>
      <rect width='400' height='400' fill='url(#g)'/><rect width='400' height='400' fill='url(#p)'/>
      <circle cx='200' cy='182' r='102' fill='#fff' fill-opacity='.38'/>
      <text x='200' y='226' font-size='118' text-anchor='middle'>${fb.emoji || "🛒"}</text>
      <text x='200' y='318' font-family='Arial,sans-serif' font-weight='700' font-size='17' letter-spacing='3' fill='#06692f' fill-opacity='.6' text-anchor='middle'>ADVENTURE FOOD</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function imgTag(key, alt, cls = "", eager = false) {
    const e = IMG[key];
    const src = e.ok || e.srcs[0] || fallbackURI(e.fb);
    if (e.ok === "hidden") return "";
    const loading = e.ok ? "" : " is-loading";
    return `<img src="${esc(src)}" data-img="${key}" data-i="0" alt="${esc(alt)}" class="${cls}${loading}"` +
      (eager ? ` fetchpriority="high"` : ` loading="lazy"`) +
      ` decoding="async" onload="afImgLoad(this)" onerror="afImgFail(this)">`;
  }

  window.afImgLoad = img => {
    img.classList.remove("is-loading");
    const e = IMG[img.dataset.img];
    if (e && !e.ok) e.ok = img.currentSrc || img.src;
  };
  window.afImgFail = img => {
    const e = IMG[img.dataset.img];
    const i = +img.dataset.i + 1;
    if (e && i < e.srcs.length) { img.dataset.i = i; img.src = e.srcs[i]; return; }
    img.onerror = null;
    if (e && e.fb && e.fb.hide) { e.ok = "hidden"; img.style.display = "none"; return; }
    const fb = fallbackURI(e && e.fb);
    if (e) e.ok = fb;
    img.src = fb;
    img.classList.remove("is-loading");
  };

  // register everything
  PRODUCTS.forEach(p => {
    const c = catById[p.cat];
    regImg(p.id, p.img, { emoji: EMOJI[p.id] || c.emoji, color: c.color });
  });
  HERO_SLIDES.forEach((s, i) => regImg("hero" + i, s.img, { hide: true }));
  regImg("sorma-side", byId.s1.img, { emoji: "🌯", color: ["#ffb199", "#ff6a3d"] });
  regImg("veg-side", byId.g5.img, { emoji: "🥬", color: ["#9be7b0", "#2fbf63"] });
  regImg("promo-burger", byId.b3.img, { emoji: "🍔", color: ["#ffcf6b", "#ff8a3d"] });
  regImg("promo-grocery", [U("photo-1604719312566-8912e9227c6a", 700), U("photo-1542838132-92c53300491e", 700)], { emoji: "🛍️", color: ["#bff0cc", "#4cc16a"] });
  regImg("about", [U("photo-1542838132-92c53300491e", 1000), U("photo-1555396273-367ea4eb4db5", 1000), U("photo-1578916171728-46686eac8d58", 1000)], { emoji: "🏪", color: ["#dff3e5", "#14a74f"] });

  /* ---------- state ---------- */
  let cart = store.get("af_cart", []);           // [{key,id,variant,qty}]
  let wish = new Set(store.get("af_wish", []));
  let coupon = store.get("af_coupon", null);
  let area = store.get("af_area", "Patiya Sadar");
  let user = store.get("af_user", null);
  let kitchenTab = "popular";
  let shopCat = "all";
  let shopSort = "pop";

  const lineKey = (id, v) => id + "|" + (v || "");
  const extraOf = v => { const m = /\+৳(\d+)/.exec(v || ""); return m ? +m[1] : 0; };
  const unitPrice = (p, v) => p.price + extraOf(v);
  const cleanVariant = v => (v || "").replace(/\s*\(\+৳\d+\)/, "");
  const saveCart = () => store.set("af_cart", cart);
  const saveWish = () => store.set("af_wish", [...wish]);

  function totals() {
    const sub = cart.reduce((s, l) => s + unitPrice(byId[l.id], l.variant) * l.qty, 0);
    const count = cart.reduce((s, l) => s + l.qty, 0);
    const mrp = cart.reduce((s, l) => { const p = byId[l.id]; return s + ((p.old || p.price) + extraOf(l.variant)) * l.qty; }, 0);
    let discount = 0, freeShip = false;
    const c = coupon && STORE.coupons[coupon];
    if (c && sub > 0) {
      if (c.type === "percent") discount = Math.round(sub * c.value / 100);
      if (c.type === "flat") discount = Math.min(c.value, sub);
      if (c.type === "ship") freeShip = true;
    }
    const ship = sub === 0 || freeShip || sub >= STORE.freeDeliveryOver ? 0 : STORE.deliveryFee;
    return { sub, count, discount, ship, total: Math.max(0, sub - discount + ship), saved: mrp - sub + discount };
  }

  /* ---------- store info ---------- */
  function fillStoreInfo() {
    $$("[data-store]").forEach(el => { el.textContent = STORE[el.dataset.store]; });
    $$("[data-phone]").forEach(el => { el.href = "tel:" + STORE.phoneHref; });
    const wa = "https://wa.me/" + STORE.phoneHref.replace("+", "") + "?text=" + encodeURIComponent("Hi Adventure Food! I'd like to place an order.");
    $$("[data-whatsapp]").forEach(el => { el.href = wa; el.target = "_blank"; el.rel = "noopener"; });
    $("#year").textContent = new Date().getFullYear();
    $("#deliverArea").textContent = area;
  }

  /* ---------- product card ---------- */
  function ctaHTML(p) {
    const key = lineKey(p.id, p.variants && p.variants[0]);
    const line = cart.find(l => l.key === key);
    if (line) {
      return `<div class="qty"><button data-dec="${key}" aria-label="Decrease">${icon("minus")}</button><span>${line.qty}</span><button data-inc="${key}" aria-label="Increase">${icon("plus")}</button></div>`;
    }
    return `<button class="add-btn" data-add="${p.id}" aria-label="Add ${esc(p.name)} to bag">${icon("plus")}Add</button>`;
  }

  function cardHTML(p, opts = {}) {
    const off = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
    const on = wish.has(p.id);
    let dealBar = "";
    if (opts.deal) {
      const sold = 55 + ((p.id.charCodeAt(1) * 7 + p.reviews) % 35);
      dealBar = `<div class="deal-bar"><i style="width:${sold}%"></i></div><span class="deal-left">🔥 ${sold}% claimed</span>`;
    }
    return `<article class="card" data-id="${p.id}" style="animation-delay:${(opts.i || 0) * 40}ms">
      <div class="card__media" data-qv="${p.id}">
        ${imgTag(p.id, p.name)}
        <div class="card__badges">${off ? `<span class="tag-off">-${off}%</span>` : ""}${p.tag ? `<span class="tag-label">${esc(p.tag)}</span>` : ""}</div>
      </div>
      <button class="card__wish${on ? " is-on" : ""}" data-wish="${p.id}" aria-label="${on ? "Remove from" : "Add to"} wishlist">${icon(on ? "heart-fill" : "heart")}</button>
      <div class="card__body">
        <div class="card__rating">${icon("star")}<b>${p.rating}</b> (${p.reviews})</div>
        <h3 class="card__name" data-qv="${p.id}">${esc(p.name)}</h3>
        <span class="card__unit">${esc(p.unit)}</span>
        ${dealBar}
        <div class="card__foot">
          <div class="price">${fmt(p.price)}${p.old ? `<s>${fmt(p.old)}</s>` : ""}</div>
          <div data-cta="${p.id}">${ctaHTML(p)}</div>
        </div>
      </div>
    </article>`;
  }

  function refreshCTAs() {
    $$("[data-cta]").forEach(el => { el.innerHTML = ctaHTML(byId[el.dataset.cta]); });
  }
  function refreshWishButtons() {
    $$("[data-wish]").forEach(b => {
      const on = wish.has(b.dataset.wish);
      b.classList.toggle("is-on", on);
      b.innerHTML = icon(on ? "heart-fill" : "heart");
    });
  }

  /* ---------- render: nav & categories ---------- */
  function renderNav() {
    $("#catnavLinks").innerHTML = CATEGORIES.map(c =>
      `<a href="#${c.group === "kitchen" ? "kitchen" : "shop"}" data-jump="${c.id}">${c.emoji} ${esc(c.name)}</a>`).join("");

    const item = c => `<li><a href="#${c.group === "kitchen" ? "kitchen" : "shop"}" data-jump="${c.id}" data-close-nav><span>${c.emoji}</span>${esc(c.name)}<small>${c.bn}</small></a></li>`;
    $("#menuKitchen").innerHTML = kitchenCats.map(item).join("");
    $("#menuGrocery").innerHTML = groceryCats.map(item).join("");

    $("#catGrid").innerHTML = CATEGORIES.map(c => {
      const rep = PRODUCTS.find(p => p.cat === c.id);
      return `<a href="#${c.group === "kitchen" ? "kitchen" : "shop"}" class="cat" data-jump="${c.id}">
        <span class="cat__ic" style="background:linear-gradient(135deg,${c.color[0]},${c.color[1]})"><span>${c.emoji}</span>${imgTag(rep.id, c.name)}</span>
        <span>${esc(c.name)}<small>${c.bn}</small></span>
      </a>`;
    }).join("");
  }

  /* ---------- render: hero ---------- */
  let slideIdx = 0, slideTimer = null;
  function renderHero() {
    $("#heroTrack").innerHTML = HERO_SLIDES.map((s, i) => `
      <div class="slide${i === 0 ? " is-active" : ""}" style="background:${s.bg}" aria-roledescription="slide" aria-label="${i + 1} of ${HERO_SLIDES.length}">
        ${imgTag("hero" + i, s.kicker, "slide__img", i === 0)}
        <div class="slide__body">
          <span class="slide__kicker">${s.kicker}</span>
          ${i === 0 ? `<h1>${s.title}</h1>` : `<h2>${s.title}</h2>`}
          <p>${s.text}</p>
          <div class="slide__actions">
            <a href="#${s.target === "grocery" ? "shop" : "kitchen"}" class="btn btn--yellow" data-jump="${s.target === "grocery" ? "all" : s.target}">${s.cta} ${icon("arrow")}</a>
            <span class="slide__price">${s.price}</span>
          </div>
        </div>
      </div>`).join("");
    $("#heroDots").innerHTML = HERO_SLIDES.map((_, i) => `<button aria-label="Go to slide ${i + 1}"${i === 0 ? ' class="is-active"' : ""}></button>`).join("");

    $$(".side-card__img, .promo__img, .about__img").forEach(el => {
      const key = el.dataset.srcList;
      el.outerHTML = imgTag(key, el.alt, el.className);
    });
    $$("[data-src-list]").forEach(el => el.removeAttribute("data-src-list"));

    const slider = $("#heroSlider");
    $(".hero__nav--prev").onclick = () => goSlide(slideIdx - 1, true);
    $(".hero__nav--next").onclick = () => goSlide(slideIdx + 1, true);
    $$("#heroDots button").forEach((b, i) => b.onclick = () => goSlide(i, true));

    // swipe
    let x0 = null, y0 = null;
    slider.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; stopAuto(); }, { passive: true });
    slider.addEventListener("touchend", e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) goSlide(slideIdx + (dx < 0 ? 1 : -1));
      x0 = null; startAuto();
    });
    slider.addEventListener("mouseenter", stopAuto);
    slider.addEventListener("mouseleave", startAuto);
    startAuto();
  }
  function goSlide(i, user) {
    const n = HERO_SLIDES.length;
    slideIdx = (i + n) % n;
    $("#heroTrack").style.transform = `translateX(-${slideIdx * 100}%)`;
    $$(".slide").forEach((s, k) => s.classList.toggle("is-active", k === slideIdx));
    $$("#heroDots button").forEach((b, k) => b.classList.toggle("is-active", k === slideIdx));
    if (user) { stopAuto(); startAuto(); }
  }
  function startAuto() { stopAuto(); slideTimer = setInterval(() => goSlide(slideIdx + 1), 5500); }
  function stopAuto() { clearInterval(slideTimer); }

  /* ---------- render: kitchen ---------- */
  function renderKitchenTabs() {
    const tabs = [{ id: "popular", name: "Popular", emoji: "⭐" }, ...kitchenCats];
    $("#kitchenTabs").innerHTML = tabs.map(t =>
      `<button class="tab${t.id === kitchenTab ? " is-active" : ""}" role="tab" aria-selected="${t.id === kitchenTab}" data-ktab="${t.id}"><span>${t.emoji}</span>${esc(t.name)}</button>`).join("");
  }
  function renderKitchen() {
    const list = kitchenTab === "popular"
      ? PRODUCTS.filter(p => catById[p.cat].group === "kitchen" && p.tag)
      : PRODUCTS.filter(p => p.cat === kitchenTab);
    $("#kitchenGrid").innerHTML = list.map((p, i) => cardHTML(p, { i })).join("");
  }

  /* ---------- render: deals ---------- */
  function renderDeals() {
    $("#dealsRow").innerHTML = FLASH_DEALS.map((id, i) => cardHTML(byId[id], { deal: true, i })).join("");
  }
  function tickCountdown() {
    const now = new Date(), end = new Date(now); end.setHours(23, 59, 59, 999);
    let s = Math.max(0, Math.floor((end - now) / 1000));
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    $("#cdH").textContent = String(h).padStart(2, "0");
    $("#cdM").textContent = String(m).padStart(2, "0");
    $("#cdS").textContent = String(s).padStart(2, "0");
  }

  /* ---------- render: shop ---------- */
  function renderShopChips() {
    const chips = [{ id: "all", name: "All items", emoji: "🛒" }, ...groceryCats];
    $("#shopChips").innerHTML = chips.map(c =>
      `<button class="chip${c.id === shopCat ? " is-active" : ""}" data-chip="${c.id}"><span>${c.emoji}</span>${esc(c.name)}</button>`).join("");
  }
  function renderShop() {
    let list = PRODUCTS.filter(p => catById[p.cat].group === "grocery" && (shopCat === "all" || p.cat === shopCat));
    const off = p => p.old ? 1 - p.price / p.old : 0;
    if (shopSort === "low") list.sort((a, b) => a.price - b.price);
    if (shopSort === "high") list.sort((a, b) => b.price - a.price);
    if (shopSort === "off") list.sort((a, b) => off(b) - off(a));
    if (shopSort === "pop") list.sort((a, b) => b.reviews - a.reviews);
    $("#shopGrid").innerHTML = list.map((p, i) => cardHTML(p, { i })).join("");
  }

  /* ---------- render: reviews ---------- */
  function renderReviews() {
    const colors = ["#0a8a3e", "#e3262f", "#f39c3d", "#4a90e2"];
    $("#reviewsRow").innerHTML = TESTIMONIALS.map((t, i) => `
      <figure class="review" style="margin:0">
        <div class="review__stars">${[1, 2, 3, 4, 5].map(n => `<svg class="ic${n > t.stars ? " off" : ""}"><use href="#i-star"/></svg>`).join("")}</div>
        <p>${esc(t.text)}</p>
        <figcaption class="review__who"><span class="review__av" style="background:${colors[i % 4]}">${t.name.split(" ").map(w => w[0]).join("")}</span>
          <div><b>${esc(t.name)}</b><small>${esc(t.place)}</small></div></figcaption>
      </figure>`).join("");
  }

  /* ---------- cart ---------- */
  function addToCart(id, variant, qty = 1, fromEl) {
    const p = byId[id];
    const v = variant !== undefined ? variant : (p.variants ? p.variants[0] : "");
    const key = lineKey(id, v);
    const line = cart.find(l => l.key === key);
    if (line) line.qty += qty; else cart.push({ key, id, variant: v, qty });
    saveCart();
    updateCartUI();
    if (fromEl) flyToCart(fromEl);
    toast({ img: id, title: `${p.name} added`, sub: `${v ? cleanVariant(v) + " · " : ""}${fmt(unitPrice(p, v))}`, action: "View bag", onAction: () => openPanel("cart") });
  }
  function changeQty(key, d) {
    const line = cart.find(l => l.key === key);
    if (!line) return;
    line.qty += d;
    if (line.qty <= 0) cart = cart.filter(l => l !== line);
    saveCart();
    updateCartUI();
  }

  function updateCartUI() {
    const t = totals();
    $$('[data-count="cart"]').forEach(b => {
      const changed = b.textContent !== String(t.count);
      b.textContent = t.count;
      b.dataset.zero = t.count === 0;
      if (changed && t.count > 0) { b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); }
    });
    $$('[data-total="cart"]').forEach(b => { b.textContent = t.count ? `${t.count} item${t.count > 1 ? "s" : ""} · ${fmt(t.total)}` : "Start your order"; });
    refreshCTAs();
    renderCart();
  }

  function renderCart() {
    const t = totals();
    $("#cartCountText").textContent = t.count ? `(${t.count} item${t.count > 1 ? "s" : ""})` : "";

    const need = STORE.freeDeliveryOver - t.sub;
    const pct = Math.min(100, (t.sub / STORE.freeDeliveryOver) * 100);
    $("#shipProgress").innerHTML = t.count === 0 ? `🚚 Free delivery on orders over ${fmt(STORE.freeDeliveryOver)}`
      : need > 0 ? `Add <b>${fmt(need)}</b> more for <b>FREE delivery</b> 🚚<div class="bar"><i style="width:${pct}%"></i></div>`
      : `🎉 Yay! You've unlocked <b>FREE delivery</b><div class="bar"><i style="width:100%"></i></div>`;

    if (!cart.length) {
      $("#cartItems").innerHTML = `<div class="empty"><div class="empty__ic">🛍️</div><b>Your bag is empty</b>Hungry? Try our famous chicken momo!<br><button class="btn btn--green" data-qv="m1">Try Chicken Momo</button></div>`;
      $("#cartSummary").innerHTML = "";
      $("#cartSummary").style.display = "none";
      return;
    }
    $("#cartSummary").style.display = "";
    $("#cartItems").innerHTML = cart.map(l => {
      const p = byId[l.id];
      return `<div class="line">
        ${imgTag(l.id, p.name)}
        <div>
          <div class="line__name">${esc(p.name)}</div>
          <div class="line__meta">${esc(l.variant ? cleanVariant(l.variant) : p.unit)}</div>
          <div class="line__price">${fmt(unitPrice(p, l.variant) * l.qty)}</div>
        </div>
        <div class="line__right">
          <button class="line__rm" data-rm="${l.key}" aria-label="Remove">${icon("trash")}</button>
          <div class="qty qty--light"><button data-dec="${l.key}" aria-label="Decrease">${icon("minus")}</button><span>${l.qty}</span><button data-inc="${l.key}" aria-label="Increase">${icon("plus")}</button></div>
        </div>
      </div>`;
    }).join("");

    const c = coupon && STORE.coupons[coupon];
    $("#cartSummary").innerHTML = `
      <form class="coupon" id="couponForm">
        <input id="couponInput" placeholder="Promo code" value="${coupon || ""}" aria-label="Promo code">
        <button type="submit">${coupon ? "Change" : "Apply"}</button>
      </form>
      ${c ? `<p class="coupon-hint">✅ <b style="border:0;cursor:default">${coupon}</b> applied: ${c.label}</p>` : `<p class="coupon-hint">Try <b data-coupon="ADVENTURE10">ADVENTURE10</b> or <b data-coupon="FARUQ50">FARUQ50</b></p>`}
      <div class="sum-row"><span>Subtotal</span><span>${fmt(t.sub)}</span></div>
      ${t.discount ? `<div class="sum-row sum-row--save"><span>Promo discount</span><span>−${fmt(t.discount)}</span></div>` : ""}
      <div class="sum-row"><span>Delivery</span><span>${t.ship ? fmt(t.ship) : '<b style="color:var(--green-600)">FREE</b>'}</span></div>
      ${t.saved > 0 ? `<div class="sum-row sum-row--save"><span>You save</span><span>${fmt(t.saved)}</span></div>` : ""}
      <div class="sum-row sum-row--total"><span>Total</span><span>${fmt(t.total)}</span></div>
      <button class="btn btn--green btn--block" data-checkout>Proceed to Checkout ${icon("arrow")}</button>`;
  }

  function applyCoupon(code) {
    code = (code || "").trim().toUpperCase();
    if (!code) { coupon = null; store.set("af_coupon", null); renderCart(); updateCartUI(); return; }
    if (STORE.coupons[code]) {
      coupon = code; store.set("af_coupon", code);
      updateCartUI();
      toast({ emoji: "🎉", title: "Promo applied!", sub: STORE.coupons[code].label });
    } else {
      toast({ emoji: "⚠️", title: "Invalid promo code", sub: "Please check the code and try again" });
    }
  }

  /* ---------- wishlist ---------- */
  function toggleWish(id) {
    if (wish.has(id)) { wish.delete(id); toast({ img: id, title: "Removed from wishlist" }); }
    else { wish.add(id); toast({ img: id, title: "Saved to wishlist ❤️", sub: byId[id].name }); }
    saveWish(); updateWishUI();
  }
  function updateWishUI() {
    $$('[data-count="wish"]').forEach(b => { b.textContent = wish.size; b.dataset.zero = wish.size === 0; });
    refreshWishButtons();
    const items = [...wish].map(id => byId[id]).filter(Boolean);
    $("#wishItems").innerHTML = items.length ? items.map(p => `
      <div class="line">
        ${imgTag(p.id, p.name)}
        <div><div class="line__name">${esc(p.name)}</div><div class="line__meta">${esc(p.unit)}</div><div class="line__price">${fmt(p.price)}</div></div>
        <div class="line__right">
          <button class="line__rm" data-wish="${p.id}" aria-label="Remove">${icon("trash")}</button>
          <button class="add-btn" data-add="${p.id}">${icon("plus")}Add</button>
        </div>
      </div>`).join("")
      : `<div class="empty"><div class="empty__ic">💚</div><b>No favourites yet</b>Tap the heart on any product to save it here.</div>`;
  }

  /* ---------- panels, modal ---------- */
  const scrim = $("#scrim");
  let openEl = null;
  function openPanel(name, data) {
    closeAll(true);
    $("#toasts").innerHTML = "";
    if (name === "menu") openEl = $("#menuDrawer");
    else if (name === "cart") openEl = $("#cartDrawer");
    else if (name === "wishlist") openEl = $("#wishDrawer");
    else return openModal(name, data);
    openEl.classList.add("is-open");
    openEl.setAttribute("aria-hidden", "false");
    scrim.classList.add("is-on");
    document.body.classList.add("lock");
  }
  function closeAll(silent) {
    stopPoll();
    $$(".drawer.is-open").forEach(d => { d.classList.remove("is-open"); d.setAttribute("aria-hidden", "true"); });
    const m = $("#modal");
    if (m.classList.contains("is-open")) { m.classList.remove("is-open"); m.setAttribute("aria-hidden", "true"); }
    scrim.classList.remove("is-on");
    document.body.classList.remove("lock");
    openEl = null;
  }
  function showModal(html) {
    $("#modalContent").innerHTML = html;
    const m = $("#modal");
    m.classList.add("is-open");
    m.setAttribute("aria-hidden", "false");
    scrim.classList.add("is-on");
    document.body.classList.add("lock");
    $("#modalBox").scrollTop = 0;
  }
  function openModal(name, data) {
    if (name === "qv") return quickView(data);
    if (name === "checkout") return checkout();
    if (name === "location") return locationModal();
    if (name === "account") return accountModal();
    if (name === "track") return trackModal(data);
    if (name === "info") return infoModal(data);
  }

  /* quick view */
  function quickView(id) {
    const p = byId[id], c = catById[p.cat];
    const off = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
    let variant = p.variants ? p.variants[0] : "";
    let qty = 1;
    const desc = p.desc || `Handpicked ${c.name.toLowerCase()} from trusted suppliers. Quality-checked at our Patiya store and delivered fresh to your door.`;
    showModal(`<div class="qv">
      <div class="qv__media">${imgTag(p.id, p.name)}<div class="card__badges">${off ? `<span class="tag-off">-${off}%</span>` : ""}${p.tag ? `<span class="tag-label">${esc(p.tag)}</span>` : ""}</div></div>
      <div class="qv__body">
        <span class="qv__cat">${c.emoji} ${esc(c.name)}</span>
        <h2>${esc(p.name)}</h2>
        <div class="card__rating">${icon("star")}<b>${p.rating}</b> · ${p.reviews} reviews · ${esc(p.unit)}</div>
        <p class="qv__desc">${esc(desc)}</p>
        <div class="qv__price"><b id="qvPrice">${fmt(unitPrice(p, variant))}</b>${p.old ? `<s>${fmt(p.old)}</s>` : ""}</div>
        ${p.variants ? `<p class="qv__label">Choose option</p><div class="variants">${p.variants.map((v, i) => `<button class="variant${i === 0 ? " is-active" : ""}" data-variant="${esc(v)}">${esc(v)}</button>`).join("")}</div>` : ""}
        <div class="qv__actions">
          <div class="qty qty--light"><button id="qvDec" aria-label="Decrease">${icon("minus")}</button><span id="qvQty">1</span><button id="qvInc" aria-label="Increase">${icon("plus")}</button></div>
          <button class="btn btn--green" id="qvAdd">${icon("bag")}Add to Bag</button>
        </div>
        <div class="qv__perks">
          <span>${icon("truck")}${c.group === "kitchen" ? "Hot in 30–45 min" : "Delivery in 60 min"}</span>
          <span>${icon("shield")}Quality guaranteed</span>
          <span>${icon("wallet")}Cash on delivery</span>
        </div>
      </div></div>`);
    const upd = () => { $("#qvQty").textContent = qty; $("#qvPrice").textContent = fmt(unitPrice(p, variant) * qty); };
    $$("[data-variant]").forEach(b => b.onclick = () => {
      variant = b.dataset.variant;
      $$("[data-variant]").forEach(x => x.classList.toggle("is-active", x === b));
      upd();
    });
    $("#qvDec").onclick = () => { qty = Math.max(1, qty - 1); upd(); };
    $("#qvInc").onclick = () => { qty = Math.min(20, qty + 1); upd(); };
    $("#qvAdd").onclick = () => { const img = $(".qv__media img"); addToCart(p.id, variant, qty, img); closeAll(); };
  }

  /* checkout */
  const AREAS = ["Patiya Sadar", "Patiya Bazar", "Kolagaon", "Haidgaon", "Kusumpura", "Jiri", "Dhalghat", "Chattogram City"];
  function checkout() {
    if (!cart.length) { toast({ emoji: "🛍️", title: "Your bag is empty" }); return; }
    const t = totals();
    showModal(`<div class="sheet">
      <h2>Checkout</h2><p>Delivering to <b>${esc(area)}</b>, ${esc(STORE.location)}</p>
      <div class="steps"><span class="is-done"></span><span></span><span></span></div>
      <form id="coForm" novalidate>
        <div class="field"><label for="coName">Full name</label><input id="coName" required value="${esc(user ? user.name : "")}" placeholder="e.g. Rahim Uddin" autocomplete="name"></div>
        <div class="field"><label for="coPhone">Mobile number</label><input id="coPhone" type="tel" inputmode="tel" required value="${esc(user ? user.phone : "")}" placeholder="01XXXXXXXXX" autocomplete="tel"></div>
        <div class="field--row">
          <div class="field"><label for="coArea">Area</label><select id="coArea">${AREAS.map(a => `<option${a === area ? " selected" : ""}>${a}</option>`).join("")}</select></div>
          <div class="field"><label for="coTime">Delivery time</label><select id="coTime"><option>As soon as possible</option><option>Today, 6–8 PM</option><option>Today, 8–10 PM</option><option>Tomorrow morning</option></select></div>
        </div>
        <div class="field" style="margin-top:12px"><label for="coAddr">Full address</label><textarea id="coAddr" required placeholder="House, road, landmark">${esc(user && user.addr ? user.addr : "")}</textarea></div>
        <p class="qv__label">Payment method</p>
        <div class="pay-options">
          <label class="pay"><input type="radio" name="pay" value="Cash on Delivery" checked><span class="pay__logo" style="background:#0a8a3e">COD</span><div><b>Cash on Delivery</b><small>Pay when your order arrives</small></div></label>
          <label class="pay"><input type="radio" name="pay" value="bKash"><span class="pay__logo" style="background:#e2136e">bKash</span><div><b>bKash</b><small>Instant mobile payment</small></div></label>
          <label class="pay"><input type="radio" name="pay" value="Nagad"><span class="pay__logo" style="background:#f6921e">Nagad</span><div><b>Nagad</b><small>Instant mobile payment</small></div></label>
          <label class="pay"><input type="radio" name="pay" value="Card"><span class="pay__logo" style="background:#1a1f71">VISA</span><div><b>Debit / Credit Card</b><small>Visa, Mastercard, Amex</small></div></label>
        </div>
        <div class="order-box">
          <div class="sum-row"><span>Items (${t.count})</span><span>${fmt(t.sub)}</span></div>
          ${t.discount ? `<div class="sum-row sum-row--save"><span>Promo (${coupon})</span><span>−${fmt(t.discount)}</span></div>` : ""}
          <div class="sum-row"><span>Delivery</span><span>${t.ship ? fmt(t.ship) : "FREE"}</span></div>
          <div class="sum-row sum-row--total" style="margin-bottom:0"><span>Total</span><span>${fmt(t.total)}</span></div>
        </div>
        <button class="btn btn--green btn--block" type="submit" id="coSubmit">Place Order · ${fmt(t.total)}</button>
      </form></div>`);

    $("#coForm").onsubmit = async e => {
      e.preventDefault();
      const name = $("#coName").value.trim();
      const phone = $("#coPhone").value.replace(/[\s-]/g, "");
      const addr = $("#coAddr").value.trim();
      const bad = [];
      if (name.length < 2) bad.push($("#coName"));
      if (!/^(\+?88)?01[3-9]\d{8}$/.test(phone)) bad.push($("#coPhone"));
      if (addr.length < 4) bad.push($("#coAddr"));
      $$("#coForm input, #coForm textarea").forEach(i => i.style.borderColor = "");
      if (bad.length) {
        bad.forEach(i => i.style.borderColor = "var(--red-500)");
        bad[0].focus();
        toast({ emoji: "✍️", title: "Please check your details", sub: bad.includes($("#coPhone")) ? "Enter a valid 11-digit mobile number" : "Name and address are required" });
        return;
      }
      const pay = $('input[name="pay"]:checked').value;
      const chosenArea = $("#coArea").value;
      const btn = $("#coSubmit");
      const btnHTML = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = pay === "Cash on Delivery" ? "Placing your order…" : `Connecting to ${pay}…`;
      $$(".steps span")[1].classList.add("is-done");

      const t = totals();
      const payload = {
        name, phone, address: addr, area: chosenArea, deliveryTime: $("#coTime").value, payment: pay, coupon: coupon || "",
        items: cart.map(l => ({ id: l.id, name: byId[l.id].name, variant: cleanVariant(l.variant), qty: l.qty, price: unitPrice(byId[l.id], l.variant) })),
        subtotal: t.sub, discount: t.discount, deliveryFee: t.ship, total: t.total
      };
      try {
        const [order] = await Promise.all([Orders.create(payload), new Promise(r => setTimeout(r, 900))]);
        myOrders = [{ id: order.id, token: order.token }, ...myOrders.filter(o => o.id !== order.id)].slice(0, 20);
        store.set("af_my_orders", myOrders);
        user = { name, phone, addr };
        store.set("af_user", user);
        area = chosenArea; store.set("af_area", area); $("#deliverArea").textContent = area;
        cart = []; saveCart();
        coupon = null; store.set("af_coupon", null);
        updateCartUI();
        success(order);
      } catch (err) {
        btn.disabled = false;
        btn.innerHTML = btnHTML;
        $$(".steps span")[1].classList.remove("is-done");
        toast({ emoji: "⚠️", title: "Couldn't place the order", sub: err.message || "Please check your connection and try again" });
      }
    };
  }

  /* ---------- live order status ---------- */
  let myOrders = store.get("af_my_orders", []);
  let pollTimer = null;
  let trackReq = 0;
  const stopPoll = () => { clearInterval(pollTimer); pollTimer = null; };
  const timeOf = ts => new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const tokenOf = id => (myOrders.find(o => o.id === id) || {}).token;

  function timelineHTML(order) {
    const at = s => (order.history || []).filter(h => h.status === s).map(h => h.at).pop();
    if (order.status === "cancelled") {
      const h = (order.history || []).filter(x => x.status === "cancelled").pop() || {};
      return `<ul class="timeline">
        <li class="is-done"><b>Order placed</b><small>${timeOf(order.createdAt)}</small></li>
        <li class="is-cancel"><b>Order cancelled</b><small>${h.at ? timeOf(h.at) + " · " : ""}${h.by === "customer" ? "Cancelled by you" : esc(h.reason || "Cancelled by the store")}</small></li></ul>`;
    }
    const idx = Orders.FLOW.indexOf(order.status);
    const sub = {
      placed: "We've received your order",
      confirmed: "Adventure Food has accepted your order",
      preparing: "Fresh, hot and carefully packed",
      on_the_way: `Our rider is heading to ${order.customer.area || "you"}`,
      delivered: "Enjoy! Thank you for ordering"
    };
    return `<ul class="timeline">${Orders.FLOW.map((s, i) => {
      const cls = i <= idx ? "is-done" : i === idx + 1 ? "is-now" : "";
      const when = at(s);
      return `<li class="${cls}"><b>${Orders.STATUS[s].label}</b><small>${when ? timeOf(when) + " · " : ""}${sub[s]}</small></li>`;
    }).join("")}</ul>`;
  }

  function liveHTML(order) {
    const st = Orders.STATUS[order.status];
    const canCancel = Orders.CUSTOMER_CANCELLABLE.includes(order.status) && tokenOf(order.id);
    const final = ["delivered", "cancelled"].includes(order.status);
    return `<div class="live-status${final ? " is-final" : ""}" style="--st:${st.color};--st-bg:${st.bg}">
        <span class="live-status__dot"></span><b>${st.emoji} ${st.label}</b><small>${final ? "Updated " + timeOf(order.updatedAt) : "Live · updates automatically"}</small>
      </div>
      ${timelineHTML(order)}
      ${canCancel ? `<button class="btn btn--outline btn--block btn--danger" data-cancel-order="${order.id}">Cancel this order</button>` : ""}`;
  }

  function watchOrder(order, onChange) {
    stopPoll();
    const token = tokenOf(order.id);
    if (!token || ["delivered", "cancelled"].includes(order.status)) return;
    let last = order.status;
    pollTimer = setInterval(async () => {
      try {
        const fresh = await Orders.get(order.id, token);
        if (fresh.status !== last) {
          last = fresh.status;
          onChange(fresh);
          toast({ emoji: Orders.STATUS[fresh.status].emoji, title: `Order #${fresh.id}: ${Orders.STATUS[fresh.status].label}` });
          if (["delivered", "cancelled"].includes(fresh.status)) stopPoll();
        }
      } catch { /* try again next tick */ }
    }, 4000);
  }

  function success(order) {
    const eta = timeOf(order.createdAt + 45 * 60000);
    showModal(`<div class="success">
      <div class="success__tick">${icon("check")}</div>
      <h2>Thank you, ${esc(order.customer.name.split(" ")[0])}! 🎉</h2>
      <p>Your order has been sent to Adventure Food. We'll call you on <b>${esc(order.customer.phone)}</b> to confirm.</p>
      <span class="order-id">Order #${order.id}</span>
      <div class="order-box" style="text-align:left;max-width:360px;margin:0 auto 12px">
        <div class="sum-row"><span>Payment</span><b>${esc(order.payment)}</b></div>
        <div class="sum-row"><span>Estimated arrival</span><b>${eta}</b></div>
        <div class="sum-row" style="margin:0"><span>Amount</span><b>${fmt(order.total)}</b></div>
      </div>
      <div class="live-wrap" id="liveOrder">${liveHTML(order)}</div>
      <div style="display:grid;gap:10px;max-width:360px;margin:10px auto 0">
        <button class="btn btn--green btn--block" data-close>Continue Shopping</button>
        <a class="btn btn--outline btn--block" data-whatsapp-order>${icon("whatsapp")}Share order on WhatsApp</a>
      </div>
    </div>`);
    const lines = order.items.map(l => `• ${l.name}${l.variant ? " (" + l.variant + ")" : ""} × ${l.qty}`).join("\n");
    const msg = `Hi Adventure Food! My order #${order.id}\n${lines}\nTotal: ${fmt(order.total)} (${order.payment})\nDeliver to: ${order.customer.address}, ${order.customer.area}\nName: ${order.customer.name}, ${order.customer.phone}`;
    const a = $("[data-whatsapp-order]");
    a.href = "https://wa.me/" + STORE.phoneHref.replace("+", "") + "?text=" + encodeURIComponent(msg);
    a.target = "_blank"; a.rel = "noopener";
    watchOrder(order, fresh => { const box = $("#liveOrder"); if (box) box.innerHTML = liveHTML(fresh); });
  }

  async function trackModal(id) {
    if (!myOrders.length) {
      showModal(`<div class="sheet"><h2>Track your order</h2>
        <div class="empty" style="padding:24px 0"><div class="empty__ic">📦</div><b>No orders yet</b>Orders you place on this phone will appear here with live status.<br>
        <a href="#kitchen" class="btn btn--green" data-close>Start Ordering</a></div></div>`);
      return;
    }
    const current = id || myOrders[0].id;
    const req = ++trackReq;
    showModal(`<div class="sheet"><h2>My Orders</h2>
      ${myOrders.length > 1 ? `<div class="chips" style="margin:10px 0 4px;padding:0">${myOrders.slice(0, 8).map(o => `<button class="chip${o.id === current ? " is-active" : ""}" data-track="${o.id}">#${o.id}</button>`).join("")}</div>` : ""}
      <div id="trackBody"><div class="empty" style="padding:30px 0">Loading your order…</div></div></div>`);
    try {
      const order = await Orders.get(current, tokenOf(current));
      const body = $("#trackBody");
      if (!body || req !== trackReq) return;
      const render = o => {
        body.innerHTML = `<p style="color:var(--muted);margin:6px 0 14px"><b style="color:var(--ink)">#${o.id}</b> · ${o.items.reduce((s, l) => s + l.qty, 0)} items · ${fmt(o.total)} · ${esc(o.payment)}</p>
          <div id="liveOrder">${liveHTML(o)}</div>
          <a href="tel:${STORE.phoneHref}" class="btn btn--ghost btn--block" style="margin-top:10px">${icon("phone")}Call the store</a>`;
      };
      render(order);
      watchOrder(order, render);
    } catch (err) {
      const body = $("#trackBody");
      if (body) body.innerHTML = `<div class="empty" style="padding:24px 0"><div class="empty__ic">🔎</div><b>We couldn't load this order</b>${esc(err.message || "")}<br>Please call us and we'll help right away.</div>`;
    }
  }

  function orderNow() {
    if (cart.length) { openPanel("cart"); return; }
    closeAll();
    kitchenTab = "popular"; renderKitchenTabs(); renderKitchen();
    $("#kitchen").scrollIntoView({ behavior: "smooth" });
    toast({ emoji: "😋", title: "What would you like today?", sub: "Tap Add on any item, then Order Now" });
  }

  async function cancelOrder(btn) {
    const id = btn.dataset.cancelOrder;
    if (btn.dataset.confirm !== "1") {
      btn.dataset.confirm = "1";
      btn.textContent = "Tap again to confirm cancellation";
      setTimeout(() => { if (btn.isConnected) { btn.dataset.confirm = ""; btn.textContent = "Cancel this order"; } }, 4000);
      return;
    }
    btn.disabled = true;
    btn.textContent = "Cancelling…";
    try {
      const o = await Orders.cancel(id, tokenOf(id));
      const box = $("#liveOrder");
      if (box) box.innerHTML = liveHTML(o);
      stopPoll();
      toast({ emoji: "✖️", title: `Order #${id} cancelled`, sub: "The store has been notified" });
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "Cancel this order";
      toast({ emoji: "⚠️", title: "Couldn't cancel", sub: err.message });
    }
  }

  function locationModal() {
    showModal(`<div class="sheet"><h2>Where should we deliver?</h2><p>We deliver across Patiya Upazila and nearby Chattogram areas.</p>
      <div class="area-list">${AREAS.map(a => `<button class="${a === area ? "is-active" : ""}" data-area="${a}">📍 ${a}</button>`).join("")}</div></div>`);
  }

  function accountModal() {
    if (user) {
      const o = myOrders[0];
      showModal(`<div class="sheet">
        <div class="owner" style="border:0;padding:0;margin-bottom:18px"><span class="owner__avatar">${esc(user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase())}</span><div><b>${esc(user.name)}</b><small>${esc(user.phone)}</small></div></div>
        <ul class="menu-list">
          <li><a href="#" data-open="track"><span>📦</span>My orders ${o ? `<small>#${o.id}</small>` : ""}</a></li>
          <li><a href="#" data-open="wishlist"><span>💚</span>Wishlist <small>${wish.size} items</small></a></li>
          <li><a href="#" data-open="location"><span>📍</span>Delivery area <small>${esc(area)}</small></a></li>
          <li><a href="#" data-signout><span>🚪</span>Sign out</a></li>
        </ul></div>`);
      return;
    }
    showModal(`<div class="sheet"><h2>Welcome to Adventure Food</h2><p>Sign in with your mobile number to track orders and save addresses.</p>
      <form id="loginForm">
        <div class="field"><label for="lgName">Your name</label><input id="lgName" required placeholder="e.g. Rahim Uddin"></div>
        <div class="field"><label for="lgPhone">Mobile number</label><input id="lgPhone" type="tel" inputmode="tel" required placeholder="01XXXXXXXXX"></div>
        <div class="field" id="otpField" hidden><label for="lgOtp">Verification code</label><input id="lgOtp" inputmode="numeric" maxlength="4" placeholder="4-digit code sent by SMS"></div>
        <button class="btn btn--green btn--block" id="lgBtn">Send Code</button>
      </form></div>`);
    let step = 1;
    $("#loginForm").onsubmit = e => {
      e.preventDefault();
      const name = $("#lgName").value.trim(), phone = $("#lgPhone").value.replace(/[\s-]/g, "");
      if (name.length < 2 || !/^(\+?88)?01[3-9]\d{8}$/.test(phone)) { toast({ emoji: "✍️", title: "Enter your name and a valid mobile number" }); return; }
      if (step === 1) {
        step = 2; $("#otpField").hidden = false; $("#lgOtp").focus(); $("#lgBtn").textContent = "Verify & Sign In";
        toast({ emoji: "📩", title: "Code sent!", sub: "Check your SMS inbox" });
        return;
      }
      if (!/^\d{4}$/.test($("#lgOtp").value)) { toast({ emoji: "🔢", title: "Enter the 4-digit code" }); return; }
      user = { name, phone, addr: "" }; store.set("af_user", user);
      closeAll(); toast({ emoji: "👋", title: `Welcome, ${name.split(" ")[0]}!`, sub: "You're signed in" });
    };
  }

  const INFO = {
    delivery: ["Delivery Policy", ["Kitchen orders arrive hot within 30–45 minutes across Patiya.", "Grocery orders are delivered within 60 minutes, 8 AM – 11 PM.", `FREE delivery on orders above ${fmt(STORE.freeDeliveryOver)}; otherwise ${fmt(STORE.deliveryFee)}.`, "Scheduled delivery is available for bulk and monthly bazar orders.", "Delivery to Chattogram City is available for orders above ৳1,500."]],
    returns: ["Returns & Refunds", ["Not satisfied with freshness? Tell the rider and we will replace it on the spot.", "Packaged items can be returned unopened within 3 days.", "Refunds for bKash/Nagad payments are processed within 24 hours.", "Hot food issues? Call us within 1 hour of delivery."]],
    privacy: ["Privacy Policy", ["We only use your name, phone and address to deliver your orders.", "We never sell or share your personal information.", "Payments are processed securely by bKash, Nagad and card partners.", "You can ask us to delete your data at any time."]]
  };
  function infoModal(key) {
    const [title, items] = INFO[key] || INFO.delivery;
    showModal(`<div class="sheet"><h2>${title}</h2><p>Adventure Food · ${esc(STORE.location)}</p><ul class="info-list">${items.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>`);
  }

  /* ---------- toast ---------- */
  function toast({ img, emoji, title, sub, action, onAction }) {
    const wrap = $("#toasts");
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `${img ? imgTag(img, "") : `<span class="toast__ic">${emoji || "✓"}</span>`}
      <div><div>${esc(title)}</div>${sub ? `<small>${esc(sub)}</small>` : ""}</div>${action ? `<button>${action}</button>` : ""}`;
    if (action) el.querySelector("button").onclick = () => { onAction(); dismiss(); };
    const max = matchMedia("(min-width: 900px)").matches ? 2 : 0;
    while (wrap.children.length > max) wrap.firstChild.remove();
    wrap.appendChild(el);
    const dismiss = () => { el.classList.add("out"); setTimeout(() => el.remove(), 300); };
    setTimeout(dismiss, 2800);
  }

  /* ---------- fly to cart ---------- */
  function flyToCart(fromEl) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const src = fromEl.tagName === "IMG" ? fromEl : fromEl.closest(".card, .line")?.querySelector("img");
    const target = [...$$(".bottom-nav__bag, .order-btn__icon")].find(e => e.offsetParent !== null);
    if (!src || !target) return;
    const a = src.getBoundingClientRect(), b = target.getBoundingClientRect();
    const fly = document.createElement("img");
    fly.src = src.currentSrc || src.src; fly.className = "fly"; fly.alt = "";
    fly.style.left = a.left + a.width / 2 - 28 + "px";
    fly.style.top = a.top + a.height / 2 - 28 + "px";
    document.body.appendChild(fly);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fly.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(.3)`;
      fly.style.opacity = ".6";
    }));
    setTimeout(() => fly.remove(), 800);
  }

  /* ---------- search ---------- */
  function setupSearch() {
    const input = $("#searchInput"), box = $("#searchResults");
    const run = () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { box.hidden = true; return; }
      const hits = PRODUCTS.filter(p => {
        const c = catById[p.cat];
        return (p.name + " " + c.name + " " + c.bn + " " + (p.tag || "")).toLowerCase().includes(q);
      }).slice(0, 8);
      box.innerHTML = hits.length ? hits.map(p => `
        <button type="button" class="search__item" data-qv="${p.id}">${imgTag(p.id, p.name)}
          <div><b>${esc(p.name)}</b><small>${esc(catById[p.cat].name)} · ${esc(p.unit)}</small></div>
          <span class="price">${fmt(p.price)}</span></button>`).join("")
        : `<div class="search__empty">No results for "<b>${esc(q)}</b>".<br>Try "momo", "burger" or "rice".</div>`;
      box.hidden = false;
    };
    input.addEventListener("input", run);
    input.addEventListener("focus", run);
    $("#searchForm").addEventListener("submit", e => { e.preventDefault(); run(); input.blur(); });
    document.addEventListener("click", e => { if (!e.target.closest("#searchForm")) box.hidden = true; });
  }

  /* ---------- jump to category ---------- */
  function jumpTo(catId) {
    if (catId === "all") { shopCat = "all"; renderShopChips(); renderShop(); return; }
    const c = catById[catId];
    if (!c) return;
    if (c.group === "kitchen") { kitchenTab = catId; renderKitchenTabs(); renderKitchen(); scrollTabIntoView(); }
    else { shopCat = catId; renderShopChips(); renderShop(); }
  }
  function scrollTabIntoView() {
    const t = $("#kitchenTabs .tab.is-active");
    if (t) t.scrollIntoView({ block: "nearest", inline: "center" });
  }

  /* ---------- global click handling ---------- */
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-cancel-order],[data-track],[data-order-now],[data-add],[data-inc],[data-dec],[data-rm],[data-wish],[data-qv],[data-open],[data-close],[data-jump],[data-ktab],[data-chip],[data-checkout],[data-coupon],[data-area],[data-signout],[data-close-nav]");
    if (!t) return;
    const d = t.dataset;

    if (d.cancelOrder) { cancelOrder(t); return; }
    if (d.track) { trackModal(d.track); return; }
    if (d.orderNow !== undefined) { e.preventDefault(); orderNow(); return; }
    if (d.add) { e.preventDefault(); addToCart(d.add, undefined, 1, t); return; }
    if (d.inc) { changeQty(d.inc, 1); return; }
    if (d.dec) { changeQty(d.dec, -1); return; }
    if (d.rm) { changeQty(d.rm, -Infinity); return; }
    if (d.wish) { e.preventDefault(); toggleWish(d.wish); return; }
    if (d.qv) { $("#searchResults").hidden = true; openPanel("qv", d.qv); return; }
    if (d.checkout !== undefined) { openPanel("checkout"); return; }
    if (d.coupon) { applyCoupon(d.coupon); return; }
    if (d.area) { area = d.area; store.set("af_area", area); $("#deliverArea").textContent = area; closeAll(); toast({ emoji: "📍", title: "Delivering to " + area }); return; }
    if (d.signout !== undefined) { e.preventDefault(); user = null; store.set("af_user", null); closeAll(); toast({ emoji: "👋", title: "Signed out" }); return; }
    if (d.open) { e.preventDefault(); openPanel(d.open, d.info); return; }
    if (d.close !== undefined) { closeAll(); return; }
    if (d.ktab) { kitchenTab = d.ktab; renderKitchenTabs(); renderKitchen(); scrollTabIntoView(); return; }
    if (d.chip) { shopCat = d.chip; renderShopChips(); renderShop(); return; }
    if (d.jump) { jumpTo(d.jump); if (t.hasAttribute("data-close-nav")) closeAll(); return; }
    if (d.closeNav !== undefined) closeAll();
  });

  document.addEventListener("submit", e => {
    if (e.target.id === "couponForm") { e.preventDefault(); applyCoupon($("#couponInput").value); }
  });
  scrim.addEventListener("click", () => closeAll());
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeAll(); });
  $("#sortSelect").addEventListener("change", e => { shopSort = e.target.value; renderShop(); });

  $("#newsForm").addEventListener("submit", e => {
    e.preventDefault();
    STORE.coupons.FIRST100 = { type: "flat", value: 100, label: "৳100 off your first order" };
    e.target.reset();
    toast({ emoji: "🎁", title: "Welcome to the family!", sub: "Use code FIRST100 at checkout for ৳100 off" });
  });

  /* ---------- scroll effects ---------- */
  function setupScroll() {
    const header = $("#header");
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 10);
      if (Math.abs(y - lastY) > 6) {
        header.classList.toggle("is-hidden", y > lastY && y > 260 && !$("#searchInput").matches(":focus"));
        lastY = y;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add("is-in");
      io.unobserve(en.target);
    }), { threshold: .12 });
    $$(".section__head, .promos, .deals, .about__inner, .newsletter, .contact").forEach(el => { el.classList.add("reveal"); io.observe(el); });

    const co = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, end = parseFloat(el.dataset.counter), dec = +(el.dataset.decimals || 0);
      const t0 = performance.now();
      const step = now => {
        const k = Math.min(1, (now - t0) / 1400), v = end * (1 - Math.pow(1 - k, 3));
        el.textContent = dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-IN");
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      co.unobserve(el);
    }), { threshold: .5 });
    $$("[data-counter]").forEach(el => co.observe(el));
  }

  /* ---------- boot ---------- */
  fillStoreInfo();
  renderNav();
  renderHero();
  renderKitchenTabs();
  renderKitchen();
  renderDeals();
  renderShopChips();
  renderShop();
  renderReviews();
  updateCartUI();
  updateWishUI();
  setupSearch();
  setupScroll();
  tickCountdown();
  setInterval(tickCountdown, 1000);
})();
