# Square POS Integration — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Square POS with TaiwanWay order system — database-driven menu, online payments, order push to POS/KDS, and webhook real-time sync.

**Architecture:** Migrate from hardcoded menu (`lib/menu-data.ts`) to Supabase-driven menu seeded from current data. Add Square SDK for online payments (Web Payments SDK) and order push (Orders API). Webhook endpoint receives Square events for real-time sync. Supabase remains SSOT; Square is a sync target.

**Tech Stack:** Next.js 16 (App Router), Supabase (PostgreSQL + RLS), Square Node.js SDK (`square`), `react-square-web-payments-sdk`, Tailwind v4, bun

---

## File Structure

### New files

| File | Responsibility |
|------|---------------|
| `lib/square/client.ts` | Square SDK client singleton (env-based config) |
| `lib/square/catalog.ts` | Catalog sync logic: seed from current data, future Square API sync |
| `lib/square/payments.ts` | Create Square payment from nonce + order |
| `lib/square/orders.ts` | Create/update Square orders with fulfillment |
| `lib/square/webhooks.ts` | Webhook signature verification + event dispatch |
| `lib/square/types.ts` | Square-specific TypeScript types |
| `lib/menu-service.ts` | DB-driven menu queries (replaces direct `menu-data.ts` imports) |
| `components/square-payment-form.tsx` | Credit card form using `react-square-web-payments-sdk` |
| `app/api/webhooks/square/route.ts` | Webhook endpoint for Square events |
| `app/api/admin/sync-catalog/route.ts` | Admin-triggered catalog sync endpoint |
| `supabase/migrations/002_menu_tables.sql` | New menu_items + categories tables |
| `supabase/migrations/003_square_fields.sql` | Add square_order_id, square_payment_id to orders |
| `scripts/seed-menu.ts` | One-time script: migrate hardcoded PRODUCTS → Supabase |

### Modified files

| File | Changes |
|------|---------|
| `lib/types.ts` | Add `square_order_id`, `square_payment_id`, `payment_method` expansion |
| `components/menu-grid.tsx` | Accept products + categories as props instead of static import |
| `components/menu-item-card.tsx` | Fix emoji category mapping to match actual category IDs |
| `components/order-form.tsx` | Add payment method selection (card vs cash); integrate `SquarePaymentForm` |
| `components/payment-info.tsx` | Replace static info with `PaymentMethodSelector` component |
| `app/api/orders/route.ts` | Validate from DB menu, create Square order + payment |
| `app/order/page.tsx` | Server Component fetches menu, passes to client `MenuGrid` |
| `package.json` | Add `square`, `react-square-web-payments-sdk` |

### Removed files (after migration verified)

| File | Reason |
|------|--------|
| `lib/menu-data.ts` | Replaced by DB-driven `menu-service.ts`; kept as `menu-data.legacy.ts` until verified |

---

## Chunk 1: Database Schema + Menu Migration (M1)

### Task 1: Create menu database tables

**Files:**
- Create: `supabase/migrations/002_menu_tables.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- 002_menu_tables.sql
-- Database-driven menu system (replaces hardcoded menu-data.ts)

CREATE TABLE categories (
  id TEXT PRIMARY KEY,                    -- e.g. 'main-dishes' (matches current CATEGORIES keys)
  name JSONB NOT NULL DEFAULT '{}',       -- { zh: '主食', en: 'Main Dishes' }
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE menu_items (
  id TEXT PRIMARY KEY,                    -- e.g. 'braised-pork-rice' (matches current product ids)
  category_id TEXT NOT NULL REFERENCES categories(id),
  name JSONB NOT NULL DEFAULT '{}',       -- { zh: '滷肉飯', en: 'Braised Pork Rice' }
  description JSONB NOT NULL DEFAULT '{}',
  price NUMERIC(10, 2) NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  available BOOLEAN NOT NULL DEFAULT true,
  tags TEXT[] NOT NULL DEFAULT '{}',
  square_catalog_id TEXT,                 -- Square CatalogObject ID (nullable, for future sync)
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_menu_items_category ON menu_items (category_id);
CREATE INDEX idx_menu_items_available ON menu_items (available);
CREATE INDEX idx_menu_items_square ON menu_items (square_catalog_id) WHERE square_catalog_id IS NOT NULL;

-- RLS: anyone can read menu
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_categories" ON categories FOR SELECT TO anon USING (true);
CREATE POLICY "public_read_menu_items" ON menu_items FOR SELECT TO anon USING (true);
```

- [ ] **Step 2: Apply migration to Supabase**

Run: `cd ~/Projects/taiwanway-order && npx supabase db push` (or apply via Supabase Dashboard SQL editor)
Expected: Tables `categories` and `menu_items` created.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/002_menu_tables.sql
git commit -m "feat(db): add categories and menu_items tables for DB-driven menu"
```

---

### Task 2: Create seed script to migrate hardcoded menu to DB

**Files:**
- Create: `scripts/seed-menu.ts`

- [ ] **Step 1: Write the seed script**

```typescript
// scripts/seed-menu.ts
// One-time migration: hardcoded PRODUCTS → Supabase menu_items + categories
// Run: bun run scripts/seed-menu.ts

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Category definitions with display names (matches CATEGORIES from menu-data.ts)
const CATEGORIES_SEED = [
  { id: 'main-dishes', name: { zh: '主食', en: 'Main Dishes' }, sort_order: 0 },
  { id: 'combo', name: { zh: '套餐', en: 'Combo Deals' }, sort_order: 1 },
  { id: 'taiwanese-black-tea', name: { zh: '台灣紅茶', en: 'Taiwanese Black Tea' }, sort_order: 2 },
  { id: 'caffeine-free', name: { zh: '無咖啡因', en: 'Caffeine Free' }, sort_order: 3 },
  { id: 'jasmine-green-tea', name: { zh: '茉莉綠茶', en: 'Jasmine Green Tea' }, sort_order: 4 },
  { id: 'oolong', name: { zh: '台灣烏龍茶', en: 'Oolong Tea' }, sort_order: 5 },
  { id: 'matcha', name: { zh: '京都抹茶', en: 'Kyoto Matcha' }, sort_order: 6 },
  { id: 'fruit-tea', name: { zh: '水果茶', en: 'Fruit Tea' }, sort_order: 7 },
  { id: 'coffee', name: { zh: '咖啡', en: 'Coffee' }, sort_order: 8 },
  { id: 'pot-brewed', name: { zh: '現沖高山茶', en: 'Pot-Brewed Tea' }, sort_order: 9 },
  { id: 'desserts', name: { zh: '自製甜點', en: 'Desserts' }, sort_order: 10 },
]

// All 42 products from menu-data.ts (exact same data)
const PRODUCTS_SEED = [
  { id: 'braised-pork-rice', category_id: 'main-dishes', name: { zh: '滷肉飯', en: 'Braised Pork Rice' }, description: { zh: '入味滷肉，搭配香Q白飯（M/L）', en: 'Savory braised pork over fragrant rice (M/L)' }, price: 10.99, image: '/images/products/braised-pork-rice.webp', available: true, tags: ['熱食'], sort_order: 0 },
  { id: 'chicken-rice', category_id: 'main-dishes', name: { zh: '嘉義雞肉飯', en: 'Chiayi Chicken Rice' }, description: { zh: '嫩煎雞腿肉，搭配特製醬汁（M/L）', en: 'Tender chicken thigh with special sauce (M/L)' }, price: 10.99, image: '/images/products/chicken-rice.webp', available: true, tags: ['熱食'], sort_order: 1 },
  { id: 'beef-noodle-soup', category_id: 'main-dishes', name: { zh: '牛肉麵', en: 'Beef Noodle Soup' }, description: { zh: '香濃湯頭，嫩滑牛肉，手工麵條（M/L）', en: 'Rich broth, tender beef, handmade noodles (M/L)' }, price: 13.50, image: '/images/products/beef-noodle-soup.webp', available: true, tags: ['熱食', '招牌'], sort_order: 2 },
  { id: 'sakura-shrimp-sticky-rice', category_id: 'main-dishes', name: { zh: '櫻花蝦油飯', en: 'Sakura Shrimp Sticky Rice' }, description: { zh: '台灣櫻花蝦搭配油飯', en: 'Taiwanese sakura shrimp with sticky rice' }, price: 12.00, image: '/images/products/sakura-shrimp-sticky-rice.webp', available: true, tags: ['熱食'], sort_order: 3 },
  // Combos
  { id: 'combo-pork-bubble', category_id: 'combo', name: { zh: '滷肉飯 + 珍珠奶茶', en: 'Pork Rice + Bubble Tea' }, description: { zh: '滷肉飯搭配任選珍珠奶茶（M/L）', en: 'Braised pork rice with bubble tea of your choice (M/L)' }, price: 15.99, image: '/images/products/combo-pork-bubble.webp', available: true, tags: ['套餐', '熱食'], sort_order: 0 },
  { id: 'combo-chicken-bubble', category_id: 'combo', name: { zh: '嘉義雞肉飯 + 珍珠奶茶', en: 'Chicken Rice + Bubble Tea' }, description: { zh: '嘉義雞肉飯搭配任選珍珠奶茶（M/L）', en: 'Chiayi chicken rice with bubble tea of your choice (M/L)' }, price: 15.99, image: '/images/products/combo-chicken-bubble.webp', available: true, tags: ['套餐', '熱食'], sort_order: 1 },
  { id: 'combo-noodle-bubble', category_id: 'combo', name: { zh: '牛肉麵 + 珍珠奶茶', en: 'Noodles + Bubble Tea' }, description: { zh: '牛肉麵搭配珍珠奶茶（M/L）', en: 'Beef noodle soup with bubble tea (M/L)' }, price: 18.49, image: '/images/products/combo-noodle-bubble.webp', available: true, tags: ['套餐', '熱食'], sort_order: 2 },
  { id: 'combo-pork-tea', category_id: 'combo', name: { zh: '滷肉飯 + 台灣熱茶', en: 'Pork Rice + Floral Taiwan Tea' }, description: { zh: '滷肉飯搭配現沖台灣高山茶（M/L）', en: 'Braised pork rice with pot-brewed Taiwan tea (M/L)' }, price: 13.99, image: '/images/products/combo-pork-tea.webp', available: true, tags: ['套餐', '熱食'], sort_order: 3 },
  { id: 'combo-chicken-tea', category_id: 'combo', name: { zh: '嘉義雞肉飯 + 台灣熱茶', en: 'Chicken Rice + Floral Taiwan Tea' }, description: { zh: '嘉義雞肉飯搭配現沖台灣高山茶（M/L）', en: 'Chiayi chicken rice with pot-brewed Taiwan tea (M/L)' }, price: 13.99, image: '/images/products/combo-chicken-tea.webp', available: true, tags: ['套餐', '熱食'], sort_order: 4 },
  { id: 'combo-noodle-tea', category_id: 'combo', name: { zh: '牛肉麵 + 台灣熱茶', en: 'Noodles + Floral Taiwan Tea' }, description: { zh: '牛肉麵搭配現沖台灣高山茶（M/L）', en: 'Beef noodle soup with pot-brewed Taiwan tea (M/L)' }, price: 16.49, image: '/images/products/combo-noodle-tea.webp', available: true, tags: ['套餐', '熱食'], sort_order: 5 },
  // Taiwanese Black Tea
  { id: 'honey-black-tea', category_id: 'taiwanese-black-tea', name: { zh: '台灣蜜香紅茶', en: 'Alishan Honey Black Tea' }, description: { zh: '天然蜜香，台灣阿里山特有風味', en: 'Natural honey flavor, Alishan mountain tea' }, price: 5.00, image: '/images/products/honey-black-tea.webp', available: true, tags: ['熱飲', '冷飲'], sort_order: 0 },
  { id: 'signature-bubble-tea', category_id: 'taiwanese-black-tea', name: { zh: '招牌珍珠奶茶', en: 'Taiwanese Bubble Tea' }, description: { zh: '台灣經典，Q彈珍珠搭配香醇奶茶', en: 'Classic Taiwanese bubble tea with chewy tapioca pearls' }, price: 6.45, image: '/images/products/bubble-tea.webp', available: true, tags: ['熱飲', '冷飲', '招牌'], sort_order: 1 },
  { id: 'honey-milk-tea', category_id: 'taiwanese-black-tea', name: { zh: '蜜香奶茶', en: 'Taiwanese Milk Tea' }, description: { zh: '蜜香紅茶搭配鮮奶', en: 'Honey-flavored black tea with fresh milk' }, price: 5.65, image: '/images/products/honey-milk-tea.webp', available: true, tags: ['熱飲', '冷飲'], sort_order: 2 },
  // Caffeine Free
  { id: 'brown-sugar-bubble-milk', category_id: 'caffeine-free', name: { zh: '黑糖珍珠鮮奶', en: 'Brown Sugar Bubble Milk' }, description: { zh: '香醇黑糖漿配手工珍珠與鮮奶', en: 'Rich brown sugar syrup with handcrafted pearls and fresh milk' }, price: 6.45, image: '/images/products/brown-sugar-bubble-milk.webp', available: true, tags: ['冷飲', '無咖啡因'], sort_order: 0 },
  { id: 'taro-latte', category_id: 'caffeine-free', name: { zh: '芋香拿鐵', en: 'Taro Latte' }, description: { zh: '濃郁芋頭搭配鮮奶', en: 'Rich taro with fresh milk' }, price: 5.25, image: '/images/products/taro-latte.webp', available: true, tags: ['熱飲', '冷飲', '無咖啡因'], sort_order: 1 },
  { id: 'wintermelon-milk', category_id: 'caffeine-free', name: { zh: '冬瓜鮮奶', en: 'Wintermelon Milk' }, description: { zh: '古早味冬瓜茶搭配鮮奶', en: 'Traditional wintermelon tea with fresh milk' }, price: 5.35, image: '/images/products/wintermelon-milk.webp', available: true, tags: ['冷飲', '無咖啡因'], sort_order: 2 },
  { id: 'wintermelon-lemonade', category_id: 'caffeine-free', name: { zh: '冬瓜檸檬', en: 'Wintermelon Lemonade' }, description: { zh: '冬瓜茶搭配新鮮檸檬', en: 'Wintermelon tea with fresh lemon' }, price: 5.85, image: '/images/products/wintermelon-lemonade.webp', available: true, tags: ['冷飲', '無咖啡因'], sort_order: 3 },
  { id: 'ginger-milk-tea', category_id: 'caffeine-free', name: { zh: '薑汁奶茶', en: 'Ginger Milk Tea' }, description: { zh: '暖身薑汁搭配香醇奶茶', en: 'Warming ginger with rich milk tea' }, price: 5.85, image: '/images/products/ginger-milk-tea.webp', available: true, tags: ['熱飲', '無咖啡因'], sort_order: 4 },
  // Jasmine Green Tea
  { id: 'honey-jasmine-green-tea', category_id: 'jasmine-green-tea', name: { zh: '茉莉蜂蜜綠茶', en: 'Honey Jasmine Green Tea' }, description: { zh: '茉莉綠茶加天然蜂蜜，清香甘甜', en: 'Jasmine green tea with natural honey' }, price: 4.85, image: '/images/products/honey-jasmine-green-tea.webp', available: true, tags: ['冷飲'], sort_order: 0 },
  { id: 'jasmine-bubble-milk-green', category_id: 'jasmine-green-tea', name: { zh: '茉莉珍珠奶綠', en: 'Jasmine Green Bubble Tea' }, description: { zh: '茉莉綠茶搭配珍珠與鮮奶', en: 'Jasmine green tea with pearls and milk' }, price: 6.45, image: '/images/products/jasmine-bubble-milk-green.webp', available: true, tags: ['熱飲', '冷飲'], sort_order: 1 },
  { id: 'jasmine-milk-green', category_id: 'jasmine-green-tea', name: { zh: '茉莉奶綠', en: 'Jasmine Green Milk Tea' }, description: { zh: '茉莉綠茶搭配鮮奶', en: 'Jasmine green tea with fresh milk' }, price: 5.65, image: '/images/products/jasmine-milk-green.webp', available: true, tags: ['熱飲', '冷飲'], sort_order: 2 },
  // Oolong
  { id: 'honey-oolong-bubble-tea', category_id: 'oolong', name: { zh: '蜂蜜烏龍珍珠奶茶', en: 'Honey Oolong Bubble Tea' }, description: { zh: '蜂蜜烏龍搭配珍珠，層次豐富', en: 'Honey oolong with tapioca pearls, rich and layered' }, price: 6.65, image: '/images/products/honey-oolong-bubble-tea.webp', available: true, tags: ['熱飲', '冷飲'], sort_order: 0 },
  { id: 'honey-oolong-milk-tea', category_id: 'oolong', name: { zh: '蜂蜜烏龍奶茶', en: 'Honey Oolong Milk Tea' }, description: { zh: '烏龍茶蜜香搭配鮮奶', en: 'Honey oolong tea with fresh milk' }, price: 5.85, image: '/images/products/honey-oolong-milk-tea.webp', available: true, tags: ['熱飲', '冷飲'], sort_order: 1 },
  // Matcha
  { id: 'matcha-latte', category_id: 'matcha', name: { zh: '抹茶拿鐵', en: 'Matcha Latte' }, description: { zh: '京都一保堂抹茶，濃郁抹茶香', en: 'Kyoto Ippodo matcha, rich and fragrant' }, price: 5.95, image: '/images/products/matcha-latte.webp', available: true, tags: ['熱飲', '冷飲'], sort_order: 0 },
  { id: 'bubble-matcha-latte', category_id: 'matcha', name: { zh: '珍珠抹茶拿鐵', en: 'Bubble Matcha Latte' }, description: { zh: '抹茶拿鐵加Q彈珍珠', en: 'Matcha latte with chewy tapioca pearls' }, price: 7.15, image: '/images/products/bubble-matcha-latte.webp', available: true, tags: ['熱飲', '冷飲'], sort_order: 1 },
  // Fruit Tea
  { id: 'passion-fruit-green-tea', category_id: 'fruit-tea', name: { zh: '百香綠茶', en: 'Passion Fruit Green Tea' }, description: { zh: '新鮮百香果搭配綠茶，酸甜清爽', en: 'Fresh passion fruit with green tea, sweet and tangy' }, price: 5.85, image: '/images/products/passion-fruit-green-tea.webp', available: true, tags: ['冷飲'], sort_order: 0 },
  { id: 'lychee-jelly-black-tea', category_id: 'fruit-tea', name: { zh: '荔枝紅茶', en: 'Lychee Jelly Black Tea' }, description: { zh: '荔枝果凍搭配紅茶，清甜芬芳', en: 'Lychee jelly with black tea, refreshing and fragrant' }, price: 5.85, image: '/images/products/lychee-jelly-black-tea.webp', available: true, tags: ['冷飲'], sort_order: 1 },
  { id: 'apple-jade-dew', category_id: 'fruit-tea', name: { zh: '蘋果玉露青', en: 'Apple Jade Dew' }, description: { zh: '蘋果搭配玉露青茶，清新回甘', en: 'Apple with jade dew green tea, crisp and refreshing' }, price: 6.45, image: '/images/products/apple-jade-dew.webp', available: true, tags: ['冷飲'], sort_order: 2 },
  // Coffee
  { id: 'americano', category_id: 'coffee', name: { zh: '美式咖啡', en: 'Americano' }, description: { zh: '經典美式黑咖啡', en: 'Classic American black coffee' }, price: 3.85, image: '/images/products/americano.webp', available: true, tags: ['熱飲', '冷飲'], sort_order: 0 },
  { id: 'cafe-latte', category_id: 'coffee', name: { zh: '拿鐵', en: 'Cafe Latte' }, description: { zh: '濃縮咖啡搭配綿密奶泡', en: 'Espresso with steamed milk foam' }, price: 4.65, image: '/images/products/cafe-latte.webp', available: true, tags: ['熱飲', '冷飲'], sort_order: 1 },
  // Pot-Brewed
  { id: 'winter-oolong', category_id: 'pot-brewed', name: { zh: '冬片', en: 'Winter Leaves Oolong' }, description: { zh: '現沖高山茶，無糖', en: 'Pot-brewed high mountain tea, sugar free' }, price: 5.00, image: '/images/products/winter-oolong.webp', available: true, tags: ['熱飲', '無糖'], sort_order: 0 },
  { id: 'spring-oolong', category_id: 'pot-brewed', name: { zh: '春茶', en: 'Spring Leaves Oolong' }, description: { zh: '現沖高山春茶，無糖', en: 'Pot-brewed spring oolong, sugar free' }, price: 5.00, image: '/images/products/spring-oolong.webp', available: true, tags: ['熱飲', '無糖'], sort_order: 1 },
  { id: 'no12-oolong', category_id: 'pot-brewed', name: { zh: '金萱', en: 'No.12 Oolong (Jin Xuan)' }, description: { zh: '金萱烏龍，奶香自然回甘', en: 'Jin Xuan oolong, natural milky sweet aftertaste' }, price: 5.00, image: '/images/products/jinxuan-oolong.webp', available: true, tags: ['熱飲', '無糖'], sort_order: 2 },
  { id: 'iron-goddess', category_id: 'pot-brewed', name: { zh: '鐵觀音', en: 'Iron Goddess Oolong' }, description: { zh: '傳統鐵觀音，焙火韻味', en: 'Traditional Tieguanyin, roasted flavor' }, price: 6.00, image: '/images/products/iron-goddess.webp', available: true, tags: ['熱飲', '無糖'], sort_order: 3 },
  { id: 'alishan-black-tea', category_id: 'pot-brewed', name: { zh: '阿里山紅茶', en: 'A-Li Shan Black Tea' }, description: { zh: '阿里山高山紅茶，無糖', en: 'Ali Shan high mountain black tea, sugar free' }, price: 5.00, image: '/images/products/alishan-black-tea.webp', available: true, tags: ['熱飲', '無糖'], sort_order: 4 },
  { id: 'four-season-oolong', category_id: 'pot-brewed', name: { zh: '四季春', en: 'Four Season Oolong' }, description: { zh: '四季皆宜的春茶，清香回甘', en: 'Year-round spring tea, light and refreshing' }, price: 5.00, image: '/images/products/four-season-oolong.webp', available: true, tags: ['熱飲', '無糖'], sort_order: 5 },
  // Desserts
  { id: 'pineapple-cake', category_id: 'desserts', name: { zh: '台灣鳳梨酥', en: 'Taiwan Pineapple Cake' }, description: { zh: '每日現作，酥脆外皮搭配鳳梨內餡', en: 'Made fresh daily, flaky crust with pineapple filling' }, price: 3.25, image: '/images/products/pineapple-cake.webp', available: true, tags: ['甜點', '手工烘焙'], sort_order: 0 },
  { id: 'creme-brulee', category_id: 'desserts', name: { zh: '焦糖布丁', en: 'Crème Brûlée' }, description: { zh: '法式經典焦糖布丁', en: 'Classic French crème brûlée' }, price: 4.35, image: '/images/products/creme-brulee.webp', available: true, tags: ['甜點'], sort_order: 1 },
  { id: 'matcha-basque-cheesecake', category_id: 'desserts', name: { zh: '抹茶巴斯克蛋糕', en: 'Matcha Basque Cheese Cake' }, description: { zh: '濃郁抹茶搭配巴斯克起司蛋糕', en: 'Rich matcha with Basque-style cheesecake' }, price: 5.45, image: '/images/products/matcha-basque-cheesecake.webp', available: true, tags: ['甜點'], sort_order: 2 },
  { id: 'taro-panna-cotta', category_id: 'desserts', name: { zh: '芋泥奶酪', en: 'Taro Panna Cotta' }, description: { zh: '濃郁芋泥搭配義式奶酪', en: 'Rich taro with Italian panna cotta' }, price: 4.85, image: '/images/products/taro-panna-cotta.webp', available: true, tags: ['甜點'], sort_order: 3 },
  { id: 'mille-crepe-cake', category_id: 'desserts', name: { zh: '千層蛋糕', en: 'Mille Crêpe Cake' }, description: { zh: '多層法式薄餅搭配奶油', en: 'Multi-layered French crêpes with cream' }, price: 7.99, image: '/images/products/mille-crepe-cake.webp', available: true, tags: ['甜點'], sort_order: 4 },
  { id: 'matcha-swiss-roll', category_id: 'desserts', name: { zh: '抹茶生乳捲', en: 'Matcha Swiss Roll' }, description: { zh: '抹茶蛋糕捲搭配鮮奶油', en: 'Matcha cake roll with fresh cream' }, price: 5.65, image: '/images/products/matcha-swiss-roll.webp', available: true, tags: ['甜點'], sort_order: 5 },
]

async function seed() {
  console.log('Seeding categories...')
  const { error: catError } = await supabase.from('categories').upsert(CATEGORIES_SEED, { onConflict: 'id' })
  if (catError) throw catError
  console.log(`✓ ${CATEGORIES_SEED.length} categories`)

  console.log('Seeding menu items...')
  const { error: itemError } = await supabase.from('menu_items').upsert(PRODUCTS_SEED, { onConflict: 'id' })
  if (itemError) throw itemError
  console.log(`✓ ${PRODUCTS_SEED.length} menu items`)

  console.log('Done!')
}

seed().catch(console.error)
```

- [ ] **Step 2: Run the seed script**

Run: `cd ~/Projects/taiwanway-order && bun run scripts/seed-menu.ts`
Expected: `✓ 11 categories` and `✓ 42 menu items`

- [ ] **Step 3: Verify data in Supabase**

Run: `curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/menu_items?select=id,price&limit=3" -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" | python3 -m json.tool`
Expected: JSON array with menu items

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-menu.ts
git commit -m "feat(db): add menu seed script — migrate 42 products + 11 categories to Supabase"
```

---

### Task 3: Create menu service (DB queries replacing static import)

**Files:**
- Create: `lib/menu-service.ts`

- [ ] **Step 1: Write the menu service**

```typescript
// lib/menu-service.ts
// DB-driven menu queries — replaces direct imports from menu-data.ts
import { createServerClient, createBrowserClient } from './supabase'
import type { OrderableProduct } from './types'

interface CategoryRow {
  id: string
  name: { zh: string; en: string }
  sort_order: number
}

interface MenuItemRow {
  id: string
  category_id: string
  name: { zh: string; en: string }
  description: { zh: string; en: string }
  price: number
  image: string
  available: boolean
  tags: string[]
  sort_order: number
}

// Convert DB row to existing OrderableProduct interface (zero breaking changes)
function toOrderableProduct(row: MenuItemRow): OrderableProduct {
  return {
    id: row.id,
    category: row.category_id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    image: row.image,
    available: row.available,
    tags: row.tags,
  }
}

// Server-side: fetch all available products
export async function getProducts(): Promise<OrderableProduct[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return (data as MenuItemRow[]).map(toOrderableProduct)
}

// Server-side: fetch product by ID (for order validation)
export async function getProductById(id: string): Promise<OrderableProduct | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return toOrderableProduct(data as MenuItemRow)
}

// Server-side: fetch all categories
export async function getCategories(): Promise<CategoryRow[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data as CategoryRow[]
}

// Client-side: fetch menu for display
export async function fetchMenuClient(): Promise<{ products: OrderableProduct[]; categories: CategoryRow[] }> {
  const supabase = createBrowserClient()
  const [productsRes, categoriesRes] = await Promise.all([
    supabase.from('menu_items').select('*').eq('available', true).order('sort_order'),
    supabase.from('categories').select('*').order('sort_order'),
  ])
  if (productsRes.error) throw productsRes.error
  if (categoriesRes.error) throw categoriesRes.error
  return {
    products: (productsRes.data as MenuItemRow[]).map(toOrderableProduct),
    categories: categoriesRes.data as CategoryRow[],
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/menu-service.ts
git commit -m "feat: add DB-driven menu-service replacing static menu-data imports"
```

---

### Task 4: Update menu-grid and order page to use DB menu

**Files:**
- Modify: `components/menu-grid.tsx`
- Modify: `app/order/page.tsx`

- [ ] **Step 1: Update menu-grid.tsx to accept data as props**

Replace the static import pattern. `MenuGrid` receives products + categories as props instead of importing from `menu-data.ts`.

```typescript
// components/menu-grid.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/language-context'
import { MenuItemCard } from './menu-item-card'
import type { OrderableProduct } from '@/lib/types'

interface MenuGridProps {
  products: OrderableProduct[]
  categories: { id: string; name: { zh: string; en: string } }[]
}

export function MenuGrid({ products, categories }: MenuGridProps) {
  const { language } = useLanguage()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = activeCategory
    ? products.filter(p => p.category === activeCategory)
    : products

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={activeCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveCategory(null)}
        >
          {language === 'zh' ? '全部' : 'All'}
        </Button>
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name[language]}
          </Button>
        ))}
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(product => (
          <MenuItemCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update order page — Server Component fetches data, passes to client MenuGrid**

The current `app/order/page.tsx` is a Client Component using `useLanguage()` for the title.
We convert it to a **Server Component** that fetches menu data, and move the title into `MenuGrid`
(which is already a Client Component with `useLanguage()` access).

```typescript
// app/order/page.tsx
// Server Component — fetches menu from DB, passes to client MenuGrid
import { getProducts, getCategories } from '@/lib/menu-service'
import { MenuGrid } from '@/components/menu-grid'

export default async function OrderPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ])

  const available = products.filter(p => p.available)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <MenuGrid products={available} categories={categories} />
    </div>
  )
}
```

Also update `MenuGrid` to include the page title (add before the category filters):
```typescript
// At the top of MenuGrid's return JSX, add:
<h1 className="mb-6 font-heading text-3xl font-bold">
  {language === 'zh' ? '菜單' : 'Menu'}
</h1>
```

This avoids the issue of using `useLanguage()` in a Server Component.

- [ ] **Step 3: Update order API to validate from DB**

In `app/api/orders/route.ts`, replace `import { PRODUCTS } from '@/lib/menu-data'` with DB lookup:

```typescript
// At top of file, replace:
// import { PRODUCTS } from '@/lib/menu-data'
// With:
import { createServerClient } from '@/lib/supabase'

// In POST handler, replace PRODUCTS.find() with DB query:
const supabase = createServerClient()
// ... (existing validation code) ...

// Replace server-side price validation loop:
let serverSubtotal = 0
for (const item of items) {
  const { data: product, error: prodErr } = await supabase
    .from('menu_items')
    .select('id, price, available')
    .eq('id', item.product_id)
    .single()
  if (prodErr || !product) {
    return NextResponse.json({ error: `Product not found: ${item.product_id}` }, { status: 400 })
  }
  if (!product.available) {
    return NextResponse.json({ error: `Product unavailable: ${item.product_id}` }, { status: 400 })
  }
  serverSubtotal += Number(product.price) * item.quantity
  item.unit_price = Number(product.price)
}
```

- [ ] **Step 4: Verify build**

Run: `cd ~/Projects/taiwanway-order && bun run build`
Expected: Build succeeds with no errors

- [ ] **Step 5: Rename legacy file**

```bash
mv lib/menu-data.ts lib/menu-data.legacy.ts
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(M1): migrate menu from hardcoded to DB-driven — MenuGrid, order API, order page"
```

---

## Chunk 2: Square SDK Setup + Payments (M2)

### Task 5: Install Square dependencies and create client

**Files:**
- Modify: `package.json`
- Create: `lib/square/client.ts`
- Create: `lib/square/types.ts`

- [ ] **Step 1: Install Square SDK**

Run: `cd ~/Projects/taiwanway-order && bun add square`

Note: `react-square-web-payments-sdk` is installed in Task 7 (client-side component).

- [ ] **Step 2: Create Square client singleton**

```typescript
// lib/square/client.ts
import { Client, Environment } from 'square'

// Square SDK uses BigInt internally; ensure JSON serialization works
if (typeof BigInt !== 'undefined') {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString()
  }
}

let _client: Client | null = null

// Check if Square is configured (call before any Square operation)
export function isSquareConfigured(): boolean {
  return !!(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID)
}

export function getSquareClient(): Client {
  if (_client) return _client

  const accessToken = process.env.SQUARE_ACCESS_TOKEN
  if (!accessToken) throw new Error('SQUARE_ACCESS_TOKEN is not set')

  _client = new Client({
    accessToken,
    environment:
      process.env.SQUARE_ENVIRONMENT === 'production'
        ? Environment.Production
        : Environment.Sandbox,
  })

  return _client
}

export function getLocationId(): string {
  const id = process.env.SQUARE_LOCATION_ID
  if (!id) throw new Error('SQUARE_LOCATION_ID is not set')
  return id
}
```

- [ ] **Step 3: Create Square types**

```typescript
// lib/square/types.ts
export interface SquarePaymentResult {
  paymentId: string
  orderId: string
  status: string
  receiptUrl?: string
  totalMoney: { amount: number; currency: string }
}

export interface CreateSquareOrderParams {
  lineItems: {
    name: string
    quantity: number
    basePriceMoney: { amount: bigint; currency: string }
  }[]
  pickupTime: string // ISO 8601
  customerName: string
  customerPhone: string
  note?: string
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/square/client.ts lib/square/types.ts package.json bun.lock
git commit -m "feat(M2): add Square SDK client + types"
```

---

### Task 6: Create Square orders + payments server logic

**Files:**
- Create: `lib/square/orders.ts`
- Create: `lib/square/payments.ts`

- [ ] **Step 1: Write Square orders module**

```typescript
// lib/square/orders.ts
import { getSquareClient, getLocationId } from './client'
import type { CreateSquareOrderParams } from './types'
import { randomUUID } from 'crypto'

export async function createSquareOrder(params: CreateSquareOrderParams) {
  const client = getSquareClient()
  const locationId = getLocationId()

  // Convert pickup time string (HH:MM) to ISO 8601 for today
  const today = new Date()
  const [hh, mm] = params.pickupTime.split(':')
  today.setHours(Number(hh), Number(mm), 0, 0)
  const pickupAt = today.toISOString()

  const idempotencyKey = randomUUID()
  const response = await client.ordersApi.createOrder({
    order: {
      locationId,
      lineItems: params.lineItems.map(item => ({
        name: item.name,
        quantity: String(item.quantity),
        basePriceMoney: {
          amount: item.basePriceMoney.amount,
          currency: 'USD',
        },
      })),
      fulfillments: [
        {
          type: 'PICKUP',
          state: 'PROPOSED',
          pickupDetails: {
            recipient: {
              displayName: params.customerName,
              phoneNumber: params.customerPhone,
            },
            pickupAt,
            note: params.note || undefined,
          },
        },
      ],
    },
    idempotencyKey, // only at request level, NOT inside order object
  })

  return {
    orderId: response.result.order?.id,
    version: response.result.order?.version,
  }
}

export async function updateSquareOrderFulfillment(
  orderId: string,
  fulfillmentUid: string,
  state: 'RESERVED' | 'PREPARED' | 'COMPLETED',
  version: number,
) {
  const client = getSquareClient()
  // Square SDK v40+: first arg is orderId, second is request body
  await client.ordersApi.updateOrder(orderId, {
    order: {
      locationId: getLocationId(),
      fulfillments: [{ uid: fulfillmentUid, state }],
      version: BigInt(version),
    },
    idempotencyKey: randomUUID(),
  })
}
```

- [ ] **Step 2: Write Square payments module**

```typescript
// lib/square/payments.ts
import { getSquareClient, getLocationId } from './client'
import type { SquarePaymentResult } from './types'
import { randomUUID } from 'crypto'

// Process payment using a nonce from Web Payments SDK
export async function processPayment(
  sourceId: string, // payment nonce from client
  squareOrderId: string,
  amountCents: bigint, // total in cents (e.g. 1599n for $15.99)
): Promise<SquarePaymentResult> {
  const client = getSquareClient()

  const response = await client.paymentsApi.createPayment({
    sourceId,
    idempotencyKey: randomUUID(),
    amountMoney: {
      amount: amountCents,
      currency: 'USD',
    },
    orderId: squareOrderId,
    locationId: getLocationId(),
    autocomplete: true,
  })

  const payment = response.result.payment!
  return {
    paymentId: payment.id!,
    orderId: payment.orderId!,
    status: payment.status!,
    receiptUrl: payment.receiptUrl,
    totalMoney: {
      amount: Number(payment.totalMoney!.amount!),
      currency: payment.totalMoney!.currency!,
    },
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/square/orders.ts lib/square/payments.ts
git commit -m "feat(M2): add Square orders + payments server modules"
```

---

### Task 7: Create client-side payment form component

**Files:**
- Create: `components/square-payment-form.tsx`
- Modify: `components/payment-info.tsx`

- [ ] **Step 1: Install React Square Web Payments SDK**

Run: `cd ~/Projects/taiwanway-order && bun add react-square-web-payments-sdk`

- [ ] **Step 2: Create Square payment form component**

```typescript
// components/square-payment-form.tsx
'use client'

import { CreditCard, PaymentForm } from 'react-square-web-payments-sdk'
import { useLanguage } from '@/lib/i18n/language-context'
import { useState } from 'react'

interface SquarePaymentFormProps {
  applicationId: string
  locationId: string
  onPaymentNonce: (nonce: string) => void
  onError: (error: string) => void
  disabled?: boolean
  amount: number // for display only
}

export function SquarePaymentForm({
  applicationId,
  locationId,
  onPaymentNonce,
  onError,
  disabled,
  amount,
}: SquarePaymentFormProps) {
  const { language } = useLanguage()
  const [processing, setProcessing] = useState(false)

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <h3 className="mb-3 font-semibold">
        {language === 'zh' ? '信用卡付款' : 'Credit Card Payment'}
      </h3>
      <p className="mb-3 text-sm text-muted-foreground">
        {language === 'zh'
          ? `將收取 $${amount.toFixed(2)}（含稅）`
          : `You will be charged $${amount.toFixed(2)} (tax included)`}
      </p>
      <PaymentForm
        applicationId={applicationId}
        locationId={locationId}
        cardTokenizeResponseReceived={(token) => {
          if (token.errors) {
            onError(token.errors.map(e => e.message).join(', '))
            setProcessing(false)
          } else if (token.token) {
            onPaymentNonce(token.token)
          }
        }}
        createPaymentRequest={() => ({
          countryCode: 'US',
          currencyCode: 'USD',
          total: { amount: String(amount), label: 'TaiwanWay Order' },
        })}
      >
        <CreditCard
          buttonProps={{
            isLoading: processing || disabled,
            css: {
              backgroundColor: '#16a34a',
              '&:hover': { backgroundColor: '#15803d' },
              fontSize: '14px',
            },
          }}
          style={{
            input: { fontSize: '14px' },
            'input::placeholder': { color: '#9ca3af' },
          }}
        />
      </PaymentForm>
    </div>
  )
}
```

- [ ] **Step 3: Update payment-info.tsx to be a payment method selector**

```typescript
// components/payment-info.tsx
'use client'

import { CreditCard, Banknote } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { Button } from '@/components/ui/button'

export type PaymentMethod = 'card' | 'cash'

interface PaymentMethodSelectorProps {
  selected: PaymentMethod
  onSelect: (method: PaymentMethod) => void
}

export function PaymentMethodSelector({ selected, onSelect }: PaymentMethodSelectorProps) {
  const { language } = useLanguage()

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">
        {language === 'zh' ? '付款方式' : 'Payment Method'}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant={selected === 'card' ? 'default' : 'outline'}
          className="h-auto flex-col gap-1 py-3"
          onClick={() => onSelect('card')}
        >
          <CreditCard className="h-5 w-5" />
          <span className="text-xs">{language === 'zh' ? '信用卡' : 'Credit Card'}</span>
        </Button>
        <Button
          type="button"
          variant={selected === 'cash' ? 'default' : 'outline'}
          className="h-auto flex-col gap-1 py-3"
          onClick={() => onSelect('cash')}
        >
          <Banknote className="h-5 w-5" />
          <span className="text-xs">{language === 'zh' ? '到店付現' : 'Pay Cash'}</span>
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/square-payment-form.tsx components/payment-info.tsx package.json bun.lock
git commit -m "feat(M2): add SquarePaymentForm component + PaymentMethodSelector"
```

---

### Task 8: Integrate payment into order flow

**Files:**
- Modify: `components/order-form.tsx`
- Modify: `app/api/orders/route.ts`
- Create: `supabase/migrations/003_square_fields.sql`

- [ ] **Step 1: Add Square fields to orders table**

```sql
-- supabase/migrations/003_square_fields.sql
-- Add Square integration fields to orders table

ALTER TABLE orders
  ADD COLUMN square_order_id TEXT,
  ADD COLUMN square_payment_id TEXT,
  ADD COLUMN receipt_url TEXT;

-- Expand payment_method to include 'card'
-- Note: anonymous CHECK constraints get auto-generated names; find + drop by query
DO $$
DECLARE c_name TEXT;
BEGIN
  SELECT conname INTO c_name FROM pg_constraint
    WHERE conrelid = 'orders'::regclass AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%payment_method%';
  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE orders DROP CONSTRAINT %I', c_name);
  END IF;
END $$;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IS NULL OR payment_method IN ('card', 'cash', 'zelle', 'venmo'));

CREATE INDEX idx_orders_square ON orders (square_order_id) WHERE square_order_id IS NOT NULL;
```

- [ ] **Step 2: Update order API to handle card + cash**

Replace `app/api/orders/route.ts` with unified flow:

```typescript
// app/api/orders/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createSquareOrder } from '@/lib/square/orders'
import { processPayment } from '@/lib/square/payments'

const TAX_RATE = 0.08125

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      customer_name, customer_phone, pickup_time, note, items,
      payment_method, // 'card' | 'cash'
      payment_nonce,  // only when payment_method === 'card'
    } = body

    // --- Validation (same as before) ---
    if (!customer_name || !customer_phone || !pickup_time || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const digitsOnly = customer_phone.replace(/\D/g, '')
    if (digitsOnly.length < 10) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }
    if (!/^\d{2}:\d{2}$/.test(pickup_time) || pickup_time < '11:00' || pickup_time > '19:00') {
      return NextResponse.json({ error: 'Pickup time must be between 11:00 and 19:00' }, { status: 400 })
    }
    const today = new Date().getDay()
    if (![1, 2, 5, 6].includes(today)) {
      return NextResponse.json({ error: 'Store is closed today' }, { status: 400 })
    }
    if (payment_method === 'card' && !payment_nonce) {
      return NextResponse.json({ error: 'Payment nonce required for card payment' }, { status: 400 })
    }

    // --- Server-side price validation from DB ---
    const supabase = createServerClient()
    let serverSubtotal = 0
    for (const item of items) {
      const { data: product } = await supabase
        .from('menu_items')
        .select('id, price, available')
        .eq('id', item.product_id)
        .single()
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.product_id}` }, { status: 400 })
      }
      if (!product.available) {
        return NextResponse.json({ error: `Product unavailable: ${item.product_id}` }, { status: 400 })
      }
      serverSubtotal += Number(product.price) * item.quantity
      item.unit_price = Number(product.price)
    }
    const serverTax = Math.round(serverSubtotal * TAX_RATE * 100) / 100
    const serverTotal = Math.round((serverSubtotal + serverTax) * 100) / 100

    // --- Square integration (only if env vars are set) ---
    let squareOrderId: string | null = null
    let squarePaymentId: string | null = null
    let receiptUrl: string | null = null

    const hasSquare = !!process.env.SQUARE_ACCESS_TOKEN

    if (hasSquare) {
      // Create Square order
      const squareOrder = await createSquareOrder({
        lineItems: items.map((item: any) => ({
          name: item.product_name,
          quantity: item.quantity,
          basePriceMoney: {
            amount: BigInt(Math.round(item.unit_price * 100)),
            currency: 'USD',
          },
        })),
        pickupTime: pickup_time,
        customerName: customer_name,
        customerPhone: customer_phone,
        note,
      })
      squareOrderId = squareOrder.orderId || null

      // Process card payment
      if (payment_method === 'card' && squareOrderId) {
        const totalCents = BigInt(Math.round(serverTotal * 100))
        const paymentResult = await processPayment(payment_nonce, squareOrderId, totalCents)
        squarePaymentId = paymentResult.paymentId
        receiptUrl = paymentResult.receiptUrl || null
      }
    }

    // --- Save to Supabase ---
    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_name,
        customer_phone,
        pickup_time,
        note: note || null,
        items,
        total_amount: serverTotal,
        status: 'pending',
        payment_method: payment_method || 'cash',
        square_order_id: squareOrderId,
        square_payment_id: squarePaymentId,
        receipt_url: receiptUrl,
      })
      .select('id')
      .single()

    if (error) throw error

    // Non-blocking email notification
    sendNotificationEmail(data.id, customer_name, customer_phone, pickup_time, items, serverTotal).catch(console.error)

    return NextResponse.json({
      id: data.id,
      square_order_id: squareOrderId,
      receipt_url: receiptUrl,
    })
  } catch (err: any) {
    console.error('Order creation error:', err)
    const message = err?.errors?.[0]?.detail || err?.message || 'Failed to create order'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function sendNotificationEmail(
  orderId: string, name: string, phone: string, pickupTime: string,
  items: Array<{ product_name: string; quantity: number; unit_price: number }>, total: number,
) {
  const apiKey = process.env.RESEND_API_KEY
  const storeEmail = process.env.STORE_EMAIL
  if (!apiKey || !storeEmail) return
  const itemList = items.map(i => `${i.product_name} x${i.quantity} — $${(i.unit_price * i.quantity).toFixed(2)}`).join('\n')
  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)
  await resend.emails.send({
    from: 'TaiwanWay Orders <orders@taiwanway.com>',
    to: storeEmail,
    subject: `New Order #${orderId.slice(0, 8).toUpperCase()} — ${name}`,
    text: `New order!\n\nCustomer: ${name}\nPhone: ${phone}\nPickup: ${pickupTime}\n\nItems:\n${itemList}\n\nTotal: $${total.toFixed(2)}`,
  })
}
```

- [ ] **Step 3: Replace order-form.tsx with complete payment-integrated version**

Full replacement for `components/order-form.tsx`. Key changes:
- Imports `PaymentMethodSelector` (renamed from `PaymentInfo`) and `SquarePaymentForm`
- Adds `paymentMethod` + `nonce` state
- Card flow: user fills form → selects "Credit Card" → enters card in `SquarePaymentForm` → gets nonce → auto-submits
- Cash flow: user fills form → selects "Cash" → clicks submit button
- Graceful degradation: if `NEXT_PUBLIC_SQUARE_APPLICATION_ID` not set, only shows cash option

```typescript
// components/order-form.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { useLanguage } from '@/lib/i18n/language-context'
import { PaymentMethodSelector, type PaymentMethod } from './payment-info'
import { SquarePaymentForm } from './square-payment-form'

// Square env vars (NEXT_PUBLIC_ prefix auto-exposed to client by Next.js)
const SQUARE_APP_ID = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || ''
const SQUARE_LOC_ID = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || ''
const HAS_SQUARE = !!(SQUARE_APP_ID && SQUARE_LOC_ID)

function getMinPickupTime(totalItems: number): { minTime: string; prepMinutes: number } {
  const prepMinutes = totalItems > 5 ? 60 : 30
  const now = new Date()
  now.setMinutes(now.getMinutes() + prepMinutes)
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return { minTime: `${hh}:${mm}`, prepMinutes }
}

const OPEN_DAYS = new Set([1, 2, 5, 6])
function isStoreOpen(): boolean {
  return OPEN_DAYS.has(new Date().getDay())
}

export function OrderForm() {
  const { items, totalItems, subtotal, taxAmount, totalAmount, clearCart } = useCart()
  const { language, t } = useLanguage()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeError, setTimeError] = useState('')
  const [pickupLimits, setPickupLimits] = useState(() => getMinPickupTime(totalItems))
  const [storeOpen, setStoreOpen] = useState(() => isStoreOpen())
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(HAS_SQUARE ? 'card' : 'cash')
  const [paymentNonce, setPaymentNonce] = useState<string | null>(null)

  useEffect(() => {
    setPickupLimits(getMinPickupTime(totalItems))
    setStoreOpen(isStoreOpen())
    const timer = setInterval(() => {
      setPickupLimits(getMinPickupTime(totalItems))
      setStoreOpen(isStoreOpen())
    }, 60_000)
    return () => clearInterval(timer)
  }, [totalItems])

  const { minTime, prepMinutes } = pickupLimits

  const validatePickupTime = useCallback((time: string): boolean => {
    const { minTime: currentMin, prepMinutes: currentPrep } = getMinPickupTime(totalItems)
    if (time < currentMin) {
      setTimeError(
        t('order.pickupTimeTooEarly')
          .replace('{time}', currentMin)
          .replace('{minutes}', String(currentPrep))
      )
      return false
    }
    setTimeError('')
    return true
  }, [totalItems, t])

  // When card nonce received, auto-submit the order
  useEffect(() => {
    if (paymentNonce && formRef.current) {
      submitOrder(new FormData(formRef.current), paymentNonce)
    }
  }, [paymentNonce]) // eslint-disable-line react-hooks/exhaustive-deps

  async function submitOrder(formData: FormData, nonce?: string | null) {
    setLoading(true)
    setError('')

    const pickupTime = formData.get('pickup_time') as string
    if (!validatePickupTime(pickupTime)) {
      setLoading(false)
      return
    }

    const payload = {
      customer_name: formData.get('name') as string,
      customer_phone: formData.get('phone') as string,
      pickup_time: pickupTime,
      note: (formData.get('note') as string) || undefined,
      items: items.map(i => ({
        product_id: i.product.id,
        product_name: i.product.name[language],
        quantity: i.quantity,
        unit_price: i.product.price,
      })),
      total_amount: totalAmount,
      payment_method: paymentMethod,
      payment_nonce: nonce || undefined,
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      router.push(`/success?type=order&id=${data.id}`)
      setTimeout(() => clearCart(), 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
      setPaymentNonce(null) // allow retry
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (paymentMethod === 'cash') {
      submitOrder(new FormData(e.currentTarget))
    }
    // Card flow: user clicks SquarePaymentForm button → nonce → useEffect auto-submits
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t('cart.empty')}
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* Order summary */}
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.product.id} className="flex justify-between text-sm">
            <span>{item.product.name[language]} x{item.quantity}</span>
            <span>${(item.product.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <Separator />
        <div className="flex justify-between text-sm">
          <span>{t('cart.subtotal')}</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{t('cart.tax')}</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>{t('cart.total')}</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <Separator />

      {/* Customer info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">{t('order.name')} *</Label>
          <Input id="name" name="name" required placeholder={t('order.namePlaceholder')} />
        </div>
        <div>
          <Label htmlFor="phone">{t('order.phone')} *</Label>
          <Input
            id="phone" name="phone" type="tel" required
            pattern=".*\d.*\d.*\d.*\d.*\d.*\d.*\d.*\d.*\d.*\d.*"
            title={t('order.phoneValidation')}
            placeholder={t('order.phonePlaceholder')}
          />
        </div>
        <div>
          <Label htmlFor="pickup_time">{t('order.pickupTime')} *</Label>
          {!storeOpen ? (
            <p className="mt-1 text-sm text-destructive font-medium">{t('order.closedToday')}</p>
          ) : minTime > '19:00' ? (
            <p className="mt-1 text-sm text-destructive font-medium">
              {language === 'zh'
                ? `準備時間需 ${prepMinutes} 分鐘，已超過今日營業時間（7PM），請明日再訂`
                : `${prepMinutes} min prep needed, past today's closing (7PM). Please order tomorrow.`}
            </p>
          ) : (
            <>
              <Input
                id="pickup_time" name="pickup_time" type="time" required
                min={minTime > '11:00' ? minTime : '11:00'} max="19:00"
                onChange={(e) => validatePickupTime(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t('order.pickupTimeHint')}: {minTime} ({prepMinutes} {language === 'zh' ? '分鐘' : 'min'})
              </p>
              {timeError && <p className="mt-1 text-xs text-destructive">{timeError}</p>}
            </>
          )}
        </div>
        <div>
          <Label htmlFor="note">{t('order.note')}</Label>
          <Textarea id="note" name="note" placeholder={t('order.notePlaceholder')} rows={3} />
        </div>
      </div>

      {/* Payment method — only show selector if Square is configured */}
      {HAS_SQUARE ? (
        <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />
      ) : (
        <div className="rounded-lg border bg-muted/50 p-4">
          <h3 className="mb-2 font-semibold">{language === 'zh' ? '付款方式' : 'Payment'}</h3>
          <p className="text-sm text-muted-foreground">
            {language === 'zh' ? '到店付現' : 'Pay cash at pickup'}
          </p>
        </div>
      )}

      {/* Square credit card form — only when card selected */}
      {paymentMethod === 'card' && HAS_SQUARE && (
        <SquarePaymentForm
          applicationId={SQUARE_APP_ID}
          locationId={SQUARE_LOC_ID}
          amount={totalAmount}
          disabled={loading}
          onPaymentNonce={(nonce) => setPaymentNonce(nonce)}
          onError={(msg) => setError(msg)}
        />
      )}

      {/* Confirmation warning */}
      <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{t('order.confirmWarning')}</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Submit button — only visible for cash; card uses SquarePaymentForm's built-in button */}
      {paymentMethod === 'cash' && (
        <Button type="submit" className="w-full" size="lg" disabled={loading || !storeOpen || minTime > '19:00'}>
          {loading ? t('common.loading') : t('order.submit')}
        </Button>
      )}
    </form>
  )
}
```

Note: `next.config.ts` does NOT need modification — `NEXT_PUBLIC_` prefixed env vars are automatically exposed to the client by Next.js.

- [ ] **Step 4: Verify build**

Run: `cd ~/Projects/taiwanway-order && bun run build`
Expected: Build succeeds (Square env vars not required at build time, gracefully handled)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(M2): integrate Square payments — card + cash checkout flow"
```

---

## Chunk 3: Order Push to POS (M3) + Webhooks (M6)

### Task 9: Square webhook endpoint

**Files:**
- Create: `lib/square/webhooks.ts`
- Create: `app/api/webhooks/square/route.ts`

- [ ] **Step 1: Create webhook signature verification**

```typescript
// lib/square/webhooks.ts
import crypto from 'crypto'

const WEBHOOK_SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || ''
const WEBHOOK_URL = process.env.SQUARE_WEBHOOK_URL || '' // your notification URL

export function verifyWebhookSignature(
  body: string,
  signature: string,
): boolean {
  if (!WEBHOOK_SIGNATURE_KEY) return false
  const hmac = crypto.createHmac('sha256', WEBHOOK_SIGNATURE_KEY)
  hmac.update(WEBHOOK_URL + body)
  const expected = hmac.digest('base64')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

export type SquareWebhookEvent = {
  merchant_id: string
  type: string
  event_id: string
  created_at: string
  data: {
    type: string
    id: string
    object: Record<string, any>
  }
}
```

- [ ] **Step 2: Create webhook API route**

```typescript
// app/api/webhooks/square/route.ts
import { NextResponse } from 'next/server'
import { verifyWebhookSignature, type SquareWebhookEvent } from '@/lib/square/webhooks'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-square-hmacsha256-signature') || ''

  // Verify signature (skip in development if no key configured)
  if (process.env.SQUARE_WEBHOOK_SIGNATURE_KEY) {
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }
  }

  const event: SquareWebhookEvent = JSON.parse(body)
  const supabase = createServerClient()

  switch (event.type) {
    case 'order.fulfillment.updated': {
      // Sync fulfillment state back to Supabase
      const squareOrderId = event.data.id
      const fulfillments = event.data.object?.order_fulfillment_updated?.fulfillment_update || []

      for (const f of fulfillments) {
        const stateMap: Record<string, string> = {
          PROPOSED: 'pending',
          RESERVED: 'confirmed',
          PREPARED: 'ready',
          COMPLETED: 'completed',
        }
        const newStatus = stateMap[f.new_state]
        if (newStatus) {
          await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('square_order_id', squareOrderId)
        }
      }
      break
    }

    case 'catalog.version.updated': {
      // Log catalog change — future: trigger menu sync
      console.log('[webhook] Catalog updated:', event.data.id)
      break
    }

    case 'payment.updated': {
      // Update payment status if needed
      const paymentId = event.data.id
      const status = event.data.object?.payment?.status
      if (status === 'COMPLETED') {
        await supabase
          .from('orders')
          .update({ status: 'confirmed' })
          .eq('square_payment_id', paymentId)
      }
      break
    }

    default:
      console.log(`[webhook] Unhandled event: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/square/webhooks.ts app/api/webhooks/square/route.ts
git commit -m "feat(M6): add Square webhook endpoint — order sync, payment status, catalog updates"
```

---

### Task 10: Admin catalog sync endpoint

**Files:**
- Create: `lib/square/catalog.ts`
- Create: `app/api/admin/sync-catalog/route.ts`

- [ ] **Step 1: Create catalog sync module**

```typescript
// lib/square/catalog.ts
import { getSquareClient } from './client'
import { createServerClient } from '@/lib/supabase'

// Sync Square catalog → Supabase menu_items
// For now: update prices + availability for items that have square_catalog_id
export async function syncCatalogFromSquare() {
  const client = getSquareClient()
  const supabase = createServerClient()

  // Fetch all ITEM type objects from Square
  const response = await client.catalogApi.searchCatalogObjects({
    objectTypes: ['ITEM'],
    includeRelatedObjects: true,
    includeDeletedObjects: false,
  })

  const items = response.result.objects || []
  const relatedObjects = response.result.relatedObjects || []
  let updated = 0

  for (const item of items) {
    const catalogId = item.id
    const variation = item.itemData?.variations?.[0]
    if (!variation?.itemVariationData?.priceMoney) continue

    const priceCents = Number(variation.itemVariationData.priceMoney.amount)
    const price = priceCents / 100

    // Update Supabase menu_items where square_catalog_id matches
    const { data } = await supabase
      .from('menu_items')
      .update({
        price,
        available: !item.itemData?.isArchived,
        updated_at: new Date().toISOString(),
      })
      .eq('square_catalog_id', catalogId)
      .select('id')

    if (data && data.length > 0) updated++
  }

  return { total: items.length, updated }
}
```

- [ ] **Step 2: Create admin sync endpoint**

```typescript
// app/api/admin/sync-catalog/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/admin-auth'
import { syncCatalogFromSquare } from '@/lib/square/catalog'

export async function POST() {
  // Verify admin auth
  const cookieStore = await cookies()
  const token = cookieStore.get('tw-admin-token')?.value
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.SQUARE_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'Square not configured' }, { status: 400 })
  }

  try {
    const result = await syncCatalogFromSquare()
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Catalog sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/square/catalog.ts app/api/admin/sync-catalog/route.ts
git commit -m "feat(M1+M3): add Square catalog sync + admin sync endpoint"
```

---

### Task 11: Update types and add environment variable documentation

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Update Order type with Square fields**

```typescript
// Add to lib/types.ts, update the Order interface:
export interface Order {
  id: string
  items: OrderItem[]
  customer_name: string
  customer_phone: string
  pickup_time: string
  note?: string
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'
  total_amount: number
  payment_method?: 'card' | 'cash' | 'zelle' | 'venmo'
  square_order_id?: string
  square_payment_id?: string
  receipt_url?: string
  created_at: string
}
```

- [ ] **Step 2: Create .env.example**

```bash
# .env.example
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Admin
ADMIN_PASSWORD=

# Email (Resend)
RESEND_API_KEY=
STORE_EMAIL=

# Square POS (optional — system works without these, falls back to cash-only)
SQUARE_ACCESS_TOKEN=                     # Server-side: Square Developer Console → Credentials
SQUARE_LOCATION_ID=                      # Server-side: Square Developer Console → Locations
NEXT_PUBLIC_SQUARE_APPLICATION_ID=       # Client-side: same as Application ID from Square Console
NEXT_PUBLIC_SQUARE_LOCATION_ID=          # Client-side: same as Location ID
SQUARE_ENVIRONMENT=sandbox               # 'sandbox' or 'production'
SQUARE_WEBHOOK_SIGNATURE_KEY=            # Square Developer Console → Webhooks → Signature Key
SQUARE_WEBHOOK_URL=                      # e.g. https://order.taiwanwayny.com/api/webhooks/square
```

- [ ] **Step 3: Verify full build**

Run: `cd ~/Projects/taiwanway-order && bun run build`
Expected: Clean build (all Square features gracefully degrade when env vars absent)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Square POS integration — M1 (DB menu) + M2 (payments) + M3 (order push) + M6 (webhooks)"
```

---

## Environment Setup (Post-Implementation)

After code is deployed, configure these in Vercel environment variables:

| Variable | Source | Required |
|----------|--------|----------|
| `SQUARE_ACCESS_TOKEN` | Square Developer Console → Credentials | Yes for Square |
| `SQUARE_LOCATION_ID` | Square Developer Console → Locations | Yes for Square |
| `NEXT_PUBLIC_SQUARE_APPLICATION_ID` | Square Developer Console → Application ID (client-side) | Yes for card payments |
| `NEXT_PUBLIC_SQUARE_LOCATION_ID` | Same as `SQUARE_LOCATION_ID` (client-side) | Yes for card payments |
| `SQUARE_ENVIRONMENT` | `sandbox` or `production` | Yes |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | Square Developer Console → Webhooks | For webhooks |
| `SQUARE_WEBHOOK_URL` | `https://order.taiwanwayny.com/api/webhooks/square` | For webhooks |

Square Dashboard webhook configuration:
1. Go to Square Developer Console → Webhooks
2. Add endpoint: `https://order.taiwanwayny.com/api/webhooks/square`
3. Subscribe to: `order.fulfillment.updated`, `payment.updated`, `catalog.version.updated`
