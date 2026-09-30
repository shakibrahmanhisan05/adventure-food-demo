/* =========================================================
   Adventure Food · order service
   Talks to the /api/orders function when the site runs on Netlify.
   If that isn't available (e.g. opened as local files), it keeps
   orders in this browser so everything still works on one device.
   ========================================================= */
const Orders = (() => {
  const API = "/api/orders";
  const LS_KEY = "af_orders";
  const LOCAL_ADMIN = { user: "faruq", pass: "adventure123" };

  const STATUS = {
    placed:     { label: "Order placed",      short: "New",        emoji: "🆕", color: "#2563eb", bg: "#e8efff" },
    confirmed:  { label: "Confirmed",         short: "Confirmed",  emoji: "✅", color: "#0a8a3e", bg: "#e3f6ea" },
    preparing:  { label: "Being prepared",    short: "Preparing",  emoji: "👨‍🍳", color: "#b45309", bg: "#fff3dc" },
    on_the_way: { label: "Out for delivery",  short: "On the way", emoji: "🛵", color: "#7c3aed", bg: "#f1e9ff" },
    delivered:  { label: "Delivered",         short: "Delivered",  emoji: "📦", color: "#047857", bg: "#d9f7ea" },
    cancelled:  { label: "Cancelled",         short: "Cancelled",  emoji: "✖️", color: "#d51f28", bg: "#fdecec" }
  };
  const FLOW = ["placed", "confirmed", "preparing", "on_the_way", "delivered"];
  const CUSTOMER_CANCELLABLE = ["placed", "confirmed"];

  let mode = null; // "cloud" | "local"
  let detecting = null;

  /* ---------- helpers ---------- */
  const local = {
    read() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; } },
    write(list) { try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch { /* storage unavailable */ } }
  };
  const encodeAuth = (u, p) => btoa(unescape(encodeURIComponent(u + ":" + p)));
  const stripToken = ({ token, ...o }) => o;
  const fail = (msg, status) => Object.assign(new Error(msg), { status });

  function detect() {
    if (mode) return Promise.resolve(mode);
    if (!detecting) {
      detecting = fetch(API + "?ping=1", { cache: "no-store" })
        .then(r => r.ok ? r.json() : null)
        .then(j => (mode = j && j.ok ? "cloud" : "local"))
        .catch(() => (mode = "local"));
    }
    return detecting;
  }

  async function call(method, qs, body, auth) {
    const res = await fetch(API + (qs || ""), {
      method,
      cache: "no-store",
      headers: { "content-type": "application/json", ...(auth ? { authorization: "Basic " + auth } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    let data = {};
    try { data = await res.json(); } catch { /* empty body */ }
    if (!res.ok) throw fail(data.error || "Something went wrong, please try again", res.status);
    return data;
  }

  function localUpdate(id, fn) {
    const list = local.read();
    const o = list.find(x => x.id === id);
    if (!o) throw fail("Order not found", 404);
    fn(o);
    local.write(list);
    return o;
  }
  function pushStatus(o, status, by, reason) {
    if (o.status === status) return;
    const now = Date.now();
    o.status = status;
    o.updatedAt = now;
    o.history = [...(o.history || []), { status, at: now, by, ...(reason ? { reason } : {}) }];
  }

  /* ---------- customer ---------- */
  async function create(payload) {
    if ((await detect()) === "cloud") return (await call("POST", "", payload)).order;
    const now = Date.now();
    const list = local.read();
    let id;
    do { id = "AF-" + String(100000 + Math.floor(Math.random() * 900000)); } while (list.some(o => o.id === id));
    const order = {
      id,
      token: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
      createdAt: now, updatedAt: now, status: "placed",
      history: [{ status: "placed", at: now, by: "customer" }],
      customer: { name: payload.name, phone: payload.phone, address: payload.address, area: payload.area },
      deliveryTime: payload.deliveryTime, payment: payload.payment, note: payload.note || "", coupon: payload.coupon || "",
      items: payload.items, subtotal: payload.subtotal, discount: payload.discount, deliveryFee: payload.deliveryFee, total: payload.total
    };
    list.unshift(order);
    local.write(list);
    return order;
  }

  async function get(id, token) {
    if ((await detect()) === "cloud") return (await call("GET", `?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`)).order;
    const o = local.read().find(x => x.id === id && x.token === token);
    if (!o) throw fail("Order not found", 404);
    return stripToken(o);
  }

  async function cancel(id, token, reason) {
    if ((await detect()) === "cloud") return (await call("POST", "?action=cancel", { id, token, reason })).order;
    const o = local.read().find(x => x.id === id && x.token === token);
    if (!o) throw fail("Order not found", 404);
    if (!CUSTOMER_CANCELLABLE.includes(o.status)) throw fail("This order can no longer be cancelled", 409);
    return stripToken(localUpdate(id, x => pushStatus(x, "cancelled", "customer", reason || "Cancelled by customer")));
  }

  /* ---------- admin ---------- */
  async function login(user, pass) {
    const auth = encodeAuth(user.trim(), pass);
    if ((await detect()) === "cloud") { await call("POST", "?action=login", null, auth); return auth; }
    if (user.trim().toLowerCase() !== LOCAL_ADMIN.user || pass !== LOCAL_ADMIN.pass) throw fail("Wrong ID or password", 401);
    return auth;
  }

  async function list(auth) {
    if ((await detect()) === "cloud") return (await call("GET", "?admin=1", null, auth)).orders;
    if (auth !== encodeAuth(LOCAL_ADMIN.user, LOCAL_ADMIN.pass)) throw fail("Unauthorised", 401);
    return local.read().sort((a, b) => b.createdAt - a.createdAt).map(stripToken);
  }

  async function setStatus(auth, id, status, reason) {
    if ((await detect()) === "cloud") return (await call("POST", "?action=status", { id, status, reason }, auth)).order;
    if (auth !== encodeAuth(LOCAL_ADMIN.user, LOCAL_ADMIN.pass)) throw fail("Unauthorised", 401);
    return stripToken(localUpdate(id, o => pushStatus(o, status, "admin", reason)));
  }

  return {
    STATUS, FLOW, CUSTOMER_CANCELLABLE, LS_KEY,
    detect, create, get, cancel, login, list, setStatus,
    get mode() { return mode; }
  };
})();
