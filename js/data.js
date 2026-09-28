/* =========================================================
   Adventure Food — store data
   Edit this file to change business info, products & prices.
   ========================================================= */

const STORE = {
  name: "Adventure Food",
  tagline: "Super Shop & Kitchen",
  owner: "Md Faruq",
  location: "Patiya, Chattogram",
  address: "Main Road, Patiya Sadar, Chattogram 4370, Bangladesh",
  phone: "+880 1800-123456",       // replace with the owner's real number
  phoneHref: "+8801800123456",
  email: "hello@adventurefood.com.bd",
  hours: "Open daily · 8:00 AM – 11:00 PM",
  freeDeliveryOver: 999,
  deliveryFee: 40,
  coupons: {
    ADVENTURE10: { type: "percent", value: 10, label: "10% off your order" },
    FARUQ50: { type: "flat", value: 50, label: "৳50 off, owner's special" },
    PATIYA: { type: "ship", value: 0, label: "Free delivery in Patiya" }
  }
};

/* Image helpers: several sources per product, tried in order.
   If none load, the site draws its own styled image instead. */
const U = (id, w = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${w}&q=70`;
const D = (id, w = 640) =>
  `https://unsplash.com/photos/${id}/download?force=true&w=${w}`;

const CATEGORIES = [
  { id: "momo",      name: "Momo",               bn: "মোমো",          emoji: "🥟", group: "kitchen", color: ["#ffe7c2", "#ffb65c"] },
  { id: "sorma",     name: "Sorma & Rolls",      bn: "শর্মা",          emoji: "🌯", group: "kitchen", color: ["#ffe1d6", "#ff8a5c"] },
  { id: "burger",    name: "Burgers",            bn: "বার্গার",        emoji: "🍔", group: "kitchen", color: ["#fff0c9", "#ffc233"] },
  { id: "chicken",   name: "Fried Chicken",      bn: "ফ্রাইড চিকেন",   emoji: "🍗", group: "kitchen", color: ["#ffe4c4", "#f39c3d"] },
  { id: "fastfood",  name: "Rice, Noodles & Pizza", bn: "ফাস্ট ফুড",   emoji: "🍕", group: "kitchen", color: ["#ffe0e0", "#ff6b6b"] },
  { id: "drinks",    name: "Shakes & Drinks",    bn: "পানীয়",          emoji: "🥤", group: "kitchen", color: ["#dff4ff", "#5cc2ff"] },
  { id: "veg",       name: "Fresh Vegetables",   bn: "তাজা সবজি",     emoji: "🥦", group: "grocery", color: ["#e3f7e6", "#4cc16a"] },
  { id: "fruits",    name: "Fresh Fruits",       bn: "ফলমূল",         emoji: "🍎", group: "grocery", color: ["#ffe6e6", "#ff6961"] },
  { id: "meat",      name: "Meat & Fish",        bn: "মাছ ও মাংস",     emoji: "🐟", group: "grocery", color: ["#ffe8ec", "#e8526b"] },
  { id: "dairy",     name: "Dairy, Eggs & Bakery", bn: "দুধ ও ডিম",    emoji: "🥚", group: "grocery", color: ["#fff8e1", "#f2c14e"] },
  { id: "staples",   name: "Rice, Oil & Staples", bn: "চাল, ডাল, তেল", emoji: "🌾", group: "grocery", color: ["#f4f0e0", "#c9a54a"] },
  { id: "snacks",    name: "Snacks & Beverages", bn: "স্ন্যাকস",       emoji: "🍪", group: "grocery", color: ["#f3e6ff", "#a36bff"] },
  { id: "household", name: "Home & Personal Care", bn: "গৃহস্থালি",    emoji: "🧴", group: "grocery", color: ["#e3f2ff", "#4a90e2"] }
];

const PRODUCTS = [
  /* ---------------- ADVENTURE KITCHEN ---------------- */
  { id: "m1", cat: "momo", name: "Chicken Steam Momo", unit: "8 pcs", price: 180, old: 220, rating: 4.9, reviews: 412, tag: "Bestseller",
    desc: "Our signature momo: thin hand-folded wrappers, juicy spiced chicken, steamed fresh on order. Served with fiery tomato-sesame achar.",
    variants: ["8 pcs", "12 pcs (+৳80)"], img: [D("LR559Dcst70"), U("photo-1625220194771-7ebdea0b70b9"), U("photo-1496116218417-1a781b1c416c")] },
  { id: "m2", cat: "momo", name: "Crispy Fried Momo", unit: "8 pcs", price: 200, old: 240, rating: 4.8, reviews: 298, tag: "Hot",
    desc: "Golden pan-fried momo with a crunchy base and a soft top, loaded with chicken and spring onion.",
    variants: ["8 pcs", "12 pcs (+৳90)"], img: [U("photo-1534422298391-e4f8c172dddb"), U("photo-1563245372-f21724e3856d"), D("LR559Dcst70")] },
  { id: "m3", cat: "momo", name: "Jhol Momo (Spicy Soup)", unit: "8 pcs", price: 230, rating: 4.7, reviews: 156, tag: "Chef's pick",
    desc: "Steamed momo in a tangy, spicy sesame-tomato broth. Perfect for rainy Chattogram evenings.",
    variants: ["Medium spicy", "Extra spicy"], img: [U("photo-1563245372-f21724e3856d"), U("photo-1496116218417-1a781b1c416c")] },
  { id: "m4", cat: "momo", name: "Vegetable Momo", unit: "8 pcs", price: 150, rating: 4.6, reviews: 121,
    desc: "Cabbage, carrot, onion and fresh coriander, lightly seasoned and steamed.",
    variants: ["Steamed", "Fried (+৳20)"], img: [U("photo-1496116218417-1a781b1c416c"), D("LR559Dcst70")] },

  { id: "s1", cat: "sorma", name: "Chicken Sorma Roll", unit: "1 roll", price: 150, old: 180, rating: 4.9, reviews: 536, tag: "Bestseller",
    desc: "Slow-roasted chicken shawarma shaved off the spit, garlic toum, pickles and fries wrapped in soft pita.",
    variants: ["Regular", "Jumbo (+৳60)"], img: [D("SNLfVYmL8os"), D("kYi1eN--guM"), U("photo-1529006557810-274b9b2fc783")] },
  { id: "s2", cat: "sorma", name: "Beef Sorma Roll", unit: "1 roll", price: 190, rating: 4.8, reviews: 244,
    desc: "Tender marinated beef, tahini sauce, onion and tomato in a toasted wrap.",
    variants: ["Regular", "Jumbo (+৳70)"], img: [D("SNLfVYmL8os"), U("photo-1529006557810-274b9b2fc783")] },
  { id: "s3", cat: "sorma", name: "Sorma Platter", unit: "serves 1", price: 320, old: 360, rating: 4.8, reviews: 131, tag: "Combo",
    desc: "Open chicken sorma over fries with pita, garlic sauce, salad and a soft drink.",
    variants: ["Chicken", "Beef (+৳40)"], img: [D("kYi1eN--guM"), D("SNLfVYmL8os")] },

  { id: "b1", cat: "burger", name: "Classic Chicken Burger", unit: "1 pc", price: 220, old: 260, rating: 4.9, reviews: 603, tag: "Bestseller",
    desc: "Crispy fried chicken fillet, cheddar, lettuce, tomato and our house mayo in a toasted brioche bun.",
    variants: ["Single", "Double patty (+৳110)"], img: [D("pLKgCsBOiw4"), D("xn2DIp6Z8Jk"), U("photo-1606755962773-d324e0a13086"), U("photo-1568901346375-23c9450c58cd")] },
  { id: "b2", cat: "burger", name: "Vegetable Burger", unit: "1 pc", price: 160, rating: 4.7, reviews: 188, tag: "Veg",
    desc: "Crunchy mixed-vegetable patty with fresh greens, onion and tangy sauce.",
    variants: ["Regular", "With cheese (+৳30)"], img: [D("yE9Rq_KGrLI"), D("5poC5yyVUNY"), U("photo-1520072959219-c595dc870360")] },
  { id: "b3", cat: "burger", name: "Adventure Beef Burger", unit: "1 pc", price: 290, old: 320, rating: 4.8, reviews: 342, tag: "New",
    desc: "Juicy grilled beef patty, caramelised onions, cheese and smoky BBQ sauce.",
    variants: ["Single", "Double patty (+৳140)"], img: [U("photo-1568901346375-23c9450c58cd"), U("photo-1553979459-d2229ba7433b"), U("photo-1550547660-d9450f859349")] },
  { id: "b4", cat: "burger", name: "Spicy Zinger Burger", unit: "1 pc", price: 240, rating: 4.8, reviews: 277,
    desc: "Hot and crunchy chicken fillet with jalapeño mayo and slaw.",
    variants: ["Regular", "Meal with fries & drink (+৳120)"], img: [D("xn2DIp6Z8Jk"), U("photo-1550547660-d9450f859349"), U("photo-1571091718767-18b5b1457add")] },

  { id: "c1", cat: "chicken", name: "Crispy Fried Chicken", unit: "2 pcs", price: 240, old: 280, rating: 4.8, reviews: 389, tag: "Hot",
    desc: "Marinated for 12 hours, double-coated and fried golden. Crunchy outside, juicy inside.",
    variants: ["2 pcs", "4 pcs (+৳220)", "Bucket 8 pcs (+৳640)"], img: [D("c6J2thg8k04"), D("gE28aTnlqJA"), U("photo-1626645738196-c2a7c87a8f58")] },
  { id: "c2", cat: "chicken", name: "Hot Wings", unit: "6 pcs", price: 260, rating: 4.7, reviews: 164,
    desc: "Crispy wings tossed in our spicy glaze.",
    variants: ["Spicy", "BBQ"], img: [D("gE28aTnlqJA"), D("c6J2thg8k04")] },
  { id: "c3", cat: "chicken", name: "French Fries", unit: "regular", price: 110, rating: 4.6, reviews: 220,
    desc: "Crispy golden fries with our special masala seasoning.",
    variants: ["Regular", "Large (+৳50)"], img: [U("photo-1573080496219-bb080dd4f877"), U("photo-1541592106381-b31e9677c0e5")] },

  { id: "f1", cat: "fastfood", name: "Chicken Fried Rice", unit: "1 plate", price: 220, rating: 4.7, reviews: 176,
    desc: "Wok-tossed fragrant rice with chicken, egg and vegetables.",
    variants: ["Regular", "Family (+৳200)"], img: [U("photo-1512058564366-18510be2db19"), U("photo-1603133872878-684f208fb84b")] },
  { id: "f2", cat: "fastfood", name: "Chicken Chowmein", unit: "1 plate", price: 200, rating: 4.6, reviews: 143,
    desc: "Stir-fried noodles with chicken, capsicum and soy.",
    variants: ["Regular", "Family (+৳180)"], img: [U("photo-1585032226651-759b368d7246"), U("photo-1569718212165-3a8278d5f624")] },
  { id: "f3", cat: "fastfood", name: "Chicken Supreme Pizza", unit: '10"', price: 550, old: 650, rating: 4.8, reviews: 198, tag: "Deal",
    desc: "Hand-stretched dough, mozzarella, BBQ chicken, capsicum and olives.",
    variants: ['10"', '12" (+৳200)'], img: [U("photo-1565299624946-b28f40a0ae38"), U("photo-1513104890138-7c749659a591")] },

  { id: "d1", cat: "drinks", name: "Cold Coffee", unit: "400 ml", price: 160, rating: 4.8, reviews: 211,
    desc: "Creamy iced coffee blended with ice cream.",
    variants: ["Regular", "With extra ice cream (+৳40)"], img: [U("photo-1461023058943-07fcbe16d735"), U("photo-1517701604599-bb29b565090c")] },
  { id: "d2", cat: "drinks", name: "Mint Lemonade", unit: "400 ml", price: 110, rating: 4.7, reviews: 187,
    desc: "Freshly squeezed lemon, mint and a hint of black salt.",
    variants: ["Regular", "Large (+৳40)"], img: [U("photo-1544145945-f90425340c7e"), U("photo-1621263764928-df1444c5e859")] },
  { id: "d3", cat: "drinks", name: "Fresh Orange Juice", unit: "400 ml", price: 150, rating: 4.6, reviews: 98,
    desc: "100% fresh orange juice, no added sugar.",
    variants: ["Regular"], img: [U("photo-1600271886742-f049cd451bba")] },

  /* ---------------- SUPER SHOP ---------------- */
  { id: "g1", cat: "veg", name: "Fresh Tomato", unit: "1 kg", price: 80, old: 95, rating: 4.6, reviews: 87,
    img: [U("photo-1546094096-0df4bcaaa337"), U("photo-1592924357228-91a4daadcfea")] },
  { id: "g2", cat: "veg", name: "Potato (Diamond)", unit: "1 kg", price: 45, rating: 4.7, reviews: 131,
    img: [U("photo-1518977676601-b53f82aba655")] },
  { id: "g3", cat: "veg", name: "Deshi Onion", unit: "1 kg", price: 90, old: 105, rating: 4.5, reviews: 102,
    img: [U("photo-1618512496248-a07fe83aa8cb"), U("photo-1508747703725-719777637510")] },
  { id: "g4", cat: "veg", name: "Fresh Carrot", unit: "500 g", price: 55, rating: 4.6, reviews: 64,
    img: [U("photo-1598170845058-32b9d6a5da37"), U("photo-1447175008436-054170c2e979")] },
  { id: "g5", cat: "veg", name: "Mixed Vegetable Basket", unit: "3 kg", price: 320, old: 380, rating: 4.8, reviews: 58, tag: "Farm fresh",
    img: [U("photo-1540420773420-3366772f4999"), U("photo-1518843875459-f738682238a6")] },

  { id: "g6", cat: "fruits", name: "Sagor Banana", unit: "12 pcs", price: 120, rating: 4.7, reviews: 143,
    img: [U("photo-1571771894821-ce9b6c11b08e"), U("photo-1603833665858-e61d17a86224")] },
  { id: "g7", cat: "fruits", name: "Red Apple (Fuji)", unit: "1 kg", price: 320, old: 360, rating: 4.6, reviews: 91,
    img: [U("photo-1567306226416-28f0efdc88ce"), U("photo-1560806887-1e4cd0b6cbd6")] },
  { id: "g8", cat: "fruits", name: "Himsagar Mango", unit: "1 kg", price: 160, rating: 4.9, reviews: 212, tag: "Seasonal",
    img: [U("photo-1553279768-865429fa0078"), U("photo-1601493700631-2b16ec4b4716")] },
  { id: "g9", cat: "fruits", name: "Malta (Orange)", unit: "1 kg", price: 260, rating: 4.5, reviews: 57,
    img: [U("photo-1547514701-42782101795e"), U("photo-1582979512210-99b6a53386f9")] },

  { id: "g10", cat: "meat", name: "Broiler Chicken (Cleaned)", unit: "1 kg", price: 210, rating: 4.6, reviews: 176,
    img: [U("photo-1604503468506-a8da13d82791"), U("photo-1587593810167-a84920ea0781")] },
  { id: "g11", cat: "meat", name: "Premium Beef (Boneless)", unit: "1 kg", price: 780, old: 820, rating: 4.7, reviews: 119,
    img: [U("photo-1603048297172-c92544798d5a"), U("photo-1607623814075-e51df1bdc82f")] },
  { id: "g12", cat: "meat", name: "Rui Fish (Whole)", unit: "1 kg", price: 380, rating: 4.6, reviews: 84,
    img: [U("photo-1534043464124-3be32fe000c9"), U("photo-1510130387422-82bed34b37e9")] },
  { id: "g13", cat: "meat", name: "Bagda Chingri (Prawn)", unit: "500 g", price: 450, rating: 4.7, reviews: 66, tag: "Fresh catch",
    img: [U("photo-1565680018434-b513d5e5fd47"), U("photo-1559737558-2f5a35f4523b")] },

  { id: "g14", cat: "dairy", name: "Pasteurised Fresh Milk", unit: "1 L", price: 95, rating: 4.7, reviews: 204,
    img: [U("photo-1563636619-e9143da7973b"), U("photo-1550583724-b2692b85b150")] },
  { id: "g15", cat: "dairy", name: "Farm Eggs (Brown)", unit: "12 pcs", price: 150, old: 165, rating: 4.8, reviews: 231,
    img: [U("photo-1582722872445-44dc5f7e3c8f"), U("photo-1506976785307-8732e854ad03")] },
  { id: "g16", cat: "dairy", name: "Bogura Sweet Doi", unit: "500 g", price: 140, rating: 4.9, reviews: 122, tag: "Local fav",
    img: [U("photo-1488477181946-6428a0291777")] },
  { id: "g17", cat: "dairy", name: "Fresh Sandwich Bread", unit: "400 g", price: 75, rating: 4.5, reviews: 88,
    img: [U("photo-1509440159596-0249088772ff"), U("photo-1549931319-a545dcf3bc73")] },

  { id: "g18", cat: "staples", name: "Premium Miniket Rice", unit: "5 kg", price: 420, old: 450, rating: 4.7, reviews: 318,
    img: [U("photo-1586201375761-83865001e31c"), U("photo-1536304993881-ff6e9eefa2a6")] },
  { id: "g19", cat: "staples", name: "Fortified Soybean Oil", unit: "2 L", price: 360, rating: 4.6, reviews: 207,
    img: [U("photo-1474979266404-7eaacbcd87c5")] },
  { id: "g20", cat: "staples", name: "Masoor Dal (Red Lentil)", unit: "1 kg", price: 135, rating: 4.6, reviews: 144,
    img: [U("photo-1515543904379-3d757afe72e4"), U("photo-1612257416648-ee7a6c533b4f")] },
  { id: "g21", cat: "staples", name: "Spice Combo Pack", unit: "5 items", price: 290, old: 340, rating: 4.8, reviews: 76, tag: "Combo",
    img: [U("photo-1596040033229-a9821ebd058d"), U("photo-1532336414038-cf19250c5757")] },
  { id: "g22", cat: "staples", name: "Pure Sundarban Honey", unit: "500 g", price: 450, rating: 4.9, reviews: 95,
    img: [U("photo-1587049352846-4a222e784d38"), U("photo-1558642452-9d2a7deb7f62")] },

  { id: "g23", cat: "snacks", name: "Premium Black Tea", unit: "400 g", price: 220, rating: 4.7, reviews: 133,
    img: [U("photo-1564890369478-c89ca6d9cde9"), U("photo-1556679343-c7306c1976bc")] },
  { id: "g24", cat: "snacks", name: "Butter Cookies", unit: "350 g", price: 180, old: 210, rating: 4.6, reviews: 72,
    img: [U("photo-1558961363-fa8fdf82db35"), U("photo-1499636136210-6f4ee915583e")] },
  { id: "g25", cat: "snacks", name: "Potato Chips (Salted)", unit: "150 g", price: 90, rating: 4.4, reviews: 61,
    img: [U("photo-1566478989037-eec170784d0b"), U("photo-1621939514649-280e2ee25f60")] },
  { id: "g26", cat: "snacks", name: "Dark Chocolate Bar", unit: "100 g", price: 250, rating: 4.8, reviews: 49,
    img: [U("photo-1511381939415-e44015466834")] },
  { id: "g27", cat: "snacks", name: "Mineral Water", unit: "1.5 L", price: 30, rating: 4.7, reviews: 188,
    img: [U("photo-1548839140-29a749e1cf4d")] },
  { id: "g28", cat: "snacks", name: "Cola Soft Drink", unit: "1.25 L", price: 90, rating: 4.5, reviews: 96,
    img: [U("photo-1622483767028-3f66f32aef97"), U("photo-1581006852262-e4307cf6283a")] },

  { id: "g29", cat: "household", name: "Laundry Detergent", unit: "1 kg", price: 150, old: 170, rating: 4.6, reviews: 142,
    img: [U("photo-1583947215259-38e31be8751f"), U("photo-1563453392212-326f5e854473")] },
  { id: "g30", cat: "household", name: "Herbal Hand Wash", unit: "250 ml", price: 120, rating: 4.7, reviews: 83,
    img: [U("photo-1584305574647-0cc949a2bb9f"), U("photo-1600857062241-98e5dba7f214")] },
  { id: "g31", cat: "household", name: "Natural Care Shampoo", unit: "340 ml", price: 390, rating: 4.5, reviews: 58,
    img: [U("photo-1556228720-195a672e8a03"), U("photo-1571781926291-c477ebfd024b")] },
  { id: "g32", cat: "household", name: "Bamboo Toothbrush Set", unit: "4 pcs", price: 180, rating: 4.6, reviews: 40,
    img: [U("photo-1607613009820-a29f7bb81c04")] }
];

/* Products shown in the Flash Deals strip */
const FLASH_DEALS = ["m1", "b1", "s1", "c1", "g18", "g15", "g7", "g21"];

const HERO_SLIDES = [
  {
    kicker: "Adventure Kitchen · Freshly steamed",
    title: "Momo that makes<br><em>Patiya</em> smile.",
    text: "Hand-folded every morning, steamed to order. Chicken, veg, fried or jhol, delivered hot to your door.",
    cta: "Order Momo", target: "momo", price: "from ৳150",
    img: [D("LR559Dcst70", 1080), U("photo-1496116218417-1a781b1c416c", 1000)],
    bg: "linear-gradient(120deg,#063b1c 0%,#0a6b33 55%,#0e8a40 100%)"
  },
  {
    kicker: "Burger Week · Up to 20% off",
    title: "Juicy burgers,<br><em>crispy</em> sorma.",
    text: "Chicken, beef and vegetable burgers, plus our famous sorma rolls. Made fresh, never frozen.",
    cta: "Grab a Burger", target: "burger", price: "from ৳160",
    img: [U("photo-1568901346375-23c9450c58cd", 1000), D("pLKgCsBOiw4", 1080)],
    bg: "linear-gradient(120deg,#4a0d0f 0%,#9e1b22 55%,#e3262f 100%)"
  },
  {
    kicker: "Super Shop · Daily fresh groceries",
    title: "Your whole bazar,<br><em>one tap</em> away.",
    text: "Vegetables, fish, meat, rice, oil and home care at fair prices, delivered within 60 minutes in Patiya.",
    cta: "Shop Groceries", target: "grocery", price: "Free delivery over ৳999",
    img: [U("photo-1542838132-92c53300491e", 1000), U("photo-1488459716781-31db52582fe9", 1000)],
    bg: "linear-gradient(120deg,#0b3d2a 0%,#136b3f 55%,#2a9d52 100%)"
  }
];

const TESTIMONIALS = [
  { name: "Tanvir Hossain", place: "Patiya Sadar", text: "Best momo in the whole of Patiya, no doubt. The achar is on another level. I order every Friday!", stars: 5 },
  { name: "Nusrat Jahan", place: "Kolagaon", text: "I buy my weekly groceries here. Vegetables are always fresh and the delivery boy is always on time.", stars: 5 },
  { name: "Arif Chowdhury", place: "Chattogram City", text: "The chicken sorma is exactly like the ones in Dubai. Faruq bhai really knows his food.", stars: 5 },
  { name: "Sadia Rahman", place: "Patiya Bazar", text: "Clean shop, fair prices and the website is super easy. Paying with bKash takes seconds.", stars: 4 }
];
