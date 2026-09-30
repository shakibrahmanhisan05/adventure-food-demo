/* =========================================================
   Adventure Food · orders API (Netlify Function + Netlify Blobs)

   POST /api/orders                      place an order (customer)
   GET  /api/orders?id=..&token=..       order status (customer)
   POST /api/orders?action=cancel        cancel own order (customer)
   POST /api/orders?action=login         check admin login
   GET  /api/orders?admin=1              list all orders (admin)
   POST /api/orders?action=status        change an order's status (admin)

   Admin login comes from the ADMIN_USER / ADMIN_PASSWORD environment
   variables (set them in Netlify → Site configuration → Environment
   variables). The defaults below are the demo login.
   ========================================================= */
import { getStore } from "@netlify/blobs";
import { randomBytes, timingSafeEqual } from "node:crypto";

const ADMIN_USER = process.env.ADMIN_USER || "faruq";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "adventure123";

const STATUSES = ["placed", "confirmed", "preparing", "on_the_way", "delivered", "cancelled"];
const CUSTOMER_CANCELLABLE = ["placed", "confirmed"];
const MAX_LIST = 200;

const store = () => getStore({ name: "orders", consistency: "strong" });

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });

const str = (v, max) => String(v ?? "").trim().slice(0, max);
const num = (v, min = 0, max = 1e6) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
};

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

function isAdmin(req) {
  const h = req.headers.get("authorization") || "";
  if (!h.startsWith("Basic ")) return false;
  let decoded = "";
  try { decoded = Buffer.from(h.slice(6), "base64").toString("utf8"); } catch { return false; }
  const i = decoded.indexOf(":");
  if (i < 0) return false;
  return safeEqual(decoded.slice(0, i).toLowerCase(), ADMIN_USER.toLowerCase()) && safeEqual(decoded.slice(i + 1), ADMIN_PASSWORD);
}

const publicView = ({ token, ...order }) => order;

async function readBody(req) {
  try { return await req.json(); } catch { return {}; }
}

async function newId(s) {
  for (let i = 0; i < 5; i++) {
    const id = "AF-" + String(100000 + Math.floor(Math.random() * 900000));
    if (!(await s.get(id))) return id;
  }
  return "AF-" + Date.now().toString().slice(-8);
}

async function createOrder(req, s) {
  const b = await readBody(req);
  const items = (Array.isArray(b.items) ? b.items : []).slice(0, 60).map(it => ({
    id: str(it.id, 20),
    name: str(it.name, 80),
    variant: str(it.variant, 60),
    qty: num(it.qty, 1, 99),
    price: num(it.price, 0, 100000)
  })).filter(it => it.name);

  const name = str(b.name, 60), phone = str(b.phone, 20), address = str(b.address, 240);
  if (!items.length) return json({ error: "Your bag is empty" }, 400);
  if (name.length < 2 || !/^(\+?88)?01[3-9]\d{8}$/.test(phone) || address.length < 4) {
    return json({ error: "Please check your name, phone and address" }, 400);
  }

  const now = Date.now();
  const order = {
    id: await newId(s),
    token: randomBytes(16).toString("hex"),
    createdAt: now,
    updatedAt: now,
    status: "placed",
    history: [{ status: "placed", at: now, by: "customer" }],
    customer: { name, phone, address, area: str(b.area, 40) },
    deliveryTime: str(b.deliveryTime, 40),
    payment: str(b.payment, 30),
    note: str(b.note, 200),
    coupon: str(b.coupon, 20),
    items,
    subtotal: num(b.subtotal),
    discount: num(b.discount),
    deliveryFee: num(b.deliveryFee),
    total: num(b.total)
  };
  await s.setJSON(order.id, order);
  return json({ order }, 201);
}

async function setStatus(s, id, status, by, reason) {
  const order = await s.get(id, { type: "json" });
  if (!order) return null;
  if (order.status !== status) {
    const now = Date.now();
    order.status = status;
    order.updatedAt = now;
    order.history = [...(order.history || []), { status, at: now, by, ...(reason ? { reason } : {}) }];
    await s.setJSON(id, order);
  }
  return order;
}

export default async (req) => {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const s = store();

  try {
    if (req.method === "GET") {
      if (url.searchParams.has("ping")) return json({ ok: true });

      if (url.searchParams.has("admin")) {
        if (!isAdmin(req)) return json({ error: "Unauthorised" }, 401);
        const { blobs } = await s.list();
        const orders = (await Promise.all(blobs.map(b => s.get(b.key, { type: "json" }))))
          .filter(Boolean)
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, MAX_LIST)
          .map(publicView);
        return json({ orders, serverTime: Date.now() });
      }

      const id = str(url.searchParams.get("id"), 20), token = str(url.searchParams.get("token"), 64);
      const order = id && (await s.get(id, { type: "json" }));
      if (!order || !token || !safeEqual(order.token, token)) return json({ error: "Order not found" }, 404);
      return json({ order: publicView(order) });
    }

    if (req.method === "POST") {
      if (!action) return createOrder(req, s);

      if (action === "login") return isAdmin(req) ? json({ ok: true }) : json({ error: "Wrong ID or password" }, 401);

      const b = await readBody(req);
      const id = str(b.id, 20);

      if (action === "cancel") {
        const order = id && (await s.get(id, { type: "json" }));
        if (!order || !safeEqual(order.token, str(b.token, 64))) return json({ error: "Order not found" }, 404);
        if (!CUSTOMER_CANCELLABLE.includes(order.status)) return json({ error: "This order can no longer be cancelled" }, 409);
        const updated = await setStatus(s, id, "cancelled", "customer", str(b.reason, 120) || "Cancelled by customer");
        return json({ order: publicView(updated) });
      }

      if (action === "status") {
        if (!isAdmin(req)) return json({ error: "Unauthorised" }, 401);
        const status = str(b.status, 20);
        if (!STATUSES.includes(status)) return json({ error: "Unknown status" }, 400);
        const updated = await setStatus(s, id, status, "admin", str(b.reason, 120));
        return updated ? json({ order: publicView(updated) }) : json({ error: "Order not found" }, 404);
      }
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    console.error(err);
    return json({ error: "Server error, please try again" }, 500);
  }
};

export const config = { path: "/api/orders" };
