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
- Bag, wishlist and last order are saved on the device (localStorage)

Promo codes: `ADVENTURE10` (10% off), `FARUQ50` (৳50 off), `PATIYA` (free delivery).
Signing up for the newsletter unlocks `FIRST100`.

## Editing content
- **Business info, phone, products, prices, categories, slides, reviews:** `js/data.js`
- **Colours and fonts:** the `:root` variables at the top of `css/style.css`
- **Logo:** `assets/logo-mark.svg`

## Deploy to Netlify
1. On Netlify, choose **Add new site → Import an existing project** and pick this repository.
2. Leave the build command empty. Set the publish directory to `.` (already in `netlify.toml`).
3. Deploy. You can also drag and drop the project folder onto the Netlify dashboard.
