# Adventure Food · Super Shop & Kitchen

Online store for **Adventure Food**, Patiya, Chattogram. Owned by **Md Faruq**.

Built with plain HTML, CSS and JavaScript. No build step and no dependencies.

## Features
- Mobile-first design with an app-style bottom navigation bar
- Hero slider (swipe on mobile), category strip, flash deals with a live countdown
- Adventure Kitchen menu: momo, sorma, burgers, fried chicken, fast food, drinks
- Super shop: vegetables, fruits, meat and fish, dairy, staples, snacks, home care
- Product quick view with options (size, spice level) and quantity
- Bag with quantity controls, promo codes, a free-delivery progress bar and delivery fee
- Checkout with Cash on Delivery, bKash, Nagad and card, order confirmation and tracking
- Wishlist, live search, delivery-area picker, sign-in, WhatsApp ordering
- Big "Order Now" buttons in the header and the mobile bottom bar
- Live order status for customers, plus a password-protected owner dashboard (see below)
- Bag, wishlist and the customer's orders are remembered on their device

## Owner dashboard (live orders)
Open **`/admin/`** on the deployed site (there's also an "Owner login" link in the footer).

- Demo login: **ID `faruq`**, **password `adventure123`**
- New orders appear within a few seconds with a sound, vibration and banner alert
- Accept, prepare, send for delivery, mark delivered or cancel with one tap
- Customers see every status change live on their order screen, and can cancel while
  the order is still new or confirmed; the dashboard alerts the owner when they do
- Today's sales, orders in progress, delivered and cancelled counts, filters and search

To change the login, add `ADMIN_USER` and `ADMIN_PASSWORD` in Netlify → Site configuration →
Environment variables, then redeploy. (Also update `LOCAL_ADMIN` in `js/orders.js`, used only
when the site runs without Netlify.)

Orders are stored with **Netlify Blobs** through the function in `netlify/functions/orders.mjs`,
so orders from any phone reach the dashboard. If the site is opened without Netlify (as local
files or a drag-and-drop deploy), orders are kept in the browser instead and only show on the
same device.

Promo codes: `ADVENTURE10` (10% off), `FARUQ50` (৳50 off), `PATIYA` (free delivery).
Signing up for the newsletter unlocks `FIRST100`.

## Editing content
- **Business info, phone, products, prices, categories, slides, reviews:** `js/data.js`
- **Colours and fonts:** the `:root` variables at the top of `css/style.css`
- **Logo:** `assets/logo-mark.svg`
- **Dashboard:** `admin/index.html`, `css/admin.css`, `js/admin.js`; order logic in `js/orders.js`

## Deploy to Netlify
1. On Netlify, choose **Add new site → Import an existing project** and pick this repository
   (branch `main`).
2. Leave the build command empty. The publish directory and functions folder are already set in
   `netlify.toml`, and Netlify installs `@netlify/blobs` from `package.json` automatically.
3. Deploy. Use the Git import, not drag and drop, so the live order function is included.
