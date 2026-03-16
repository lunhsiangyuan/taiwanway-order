import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('缺少必要環境變數: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ============ 分類資料 ============
const CATEGORIES_SEED = [
  { id: 'main-dishes',        name: { zh: '主食',       en: 'Main Dishes' },         sort_order: 1  },
  { id: 'combo',              name: { zh: '套餐',       en: 'Combo Deals' },          sort_order: 2  },
  { id: 'taiwanese-black-tea',name: { zh: '台灣紅茶',   en: 'Taiwanese Black Tea' },  sort_order: 3  },
  { id: 'caffeine-free',      name: { zh: '無咖啡因',   en: 'Caffeine Free' },        sort_order: 4  },
  { id: 'jasmine-green-tea',  name: { zh: '茉莉綠茶',   en: 'Jasmine Green Tea' },    sort_order: 5  },
  { id: 'oolong',             name: { zh: '台灣烏龍茶', en: 'Oolong Tea' },           sort_order: 6  },
  { id: 'matcha',             name: { zh: '京都抹茶',   en: 'Kyoto Matcha' },         sort_order: 7  },
  { id: 'fruit-tea',          name: { zh: '水果茶',     en: 'Fruit Tea' },            sort_order: 8  },
  { id: 'coffee',             name: { zh: '咖啡',       en: 'Coffee' },               sort_order: 9  },
  { id: 'pot-brewed',         name: { zh: '現沖高山茶', en: 'Pot-Brewed Tea' },       sort_order: 10 },
  { id: 'desserts',           name: { zh: '自製甜點',   en: 'Desserts' },             sort_order: 11 },
]

// ============ 產品資料 ============
const PRODUCTS_SEED = [
  // ---- 主食 ----
  {
    id: 'braised-pork-rice',
    category_id: 'main-dishes',
    name: { zh: '滷肉飯', en: 'Braised Pork Rice' },
    description: { zh: '入味滷肉，搭配香Q白飯（M/L）', en: 'Savory braised pork over fragrant rice (M/L)' },
    price: 10.99,
    image: '/images/products/braised-pork-rice.webp',
    available: true,
    tags: ['熱食'],
    sort_order: 1,
  },
  {
    id: 'chicken-rice',
    category_id: 'main-dishes',
    name: { zh: '嘉義雞肉飯', en: 'Chiayi Chicken Rice' },
    description: { zh: '嫩煎雞腿肉，搭配特製醬汁（M/L）', en: 'Tender chicken thigh with special sauce (M/L)' },
    price: 10.99,
    image: '/images/products/chicken-rice.webp',
    available: true,
    tags: ['熱食'],
    sort_order: 2,
  },
  {
    id: 'beef-noodle-soup',
    category_id: 'main-dishes',
    name: { zh: '牛肉麵', en: 'Beef Noodle Soup' },
    description: { zh: '香濃湯頭，嫩滑牛肉，手工麵條（M/L）', en: 'Rich broth, tender beef, handmade noodles (M/L)' },
    price: 13.50,
    image: '/images/products/beef-noodle-soup.webp',
    available: true,
    tags: ['熱食', '招牌'],
    sort_order: 3,
  },
  {
    id: 'sakura-shrimp-sticky-rice',
    category_id: 'main-dishes',
    name: { zh: '櫻花蝦油飯', en: 'Sakura Shrimp Sticky Rice' },
    description: { zh: '台灣櫻花蝦搭配油飯', en: 'Taiwanese sakura shrimp with sticky rice' },
    price: 12.00,
    image: '/images/products/sakura-shrimp-sticky-rice.webp',
    available: true,
    tags: ['熱食'],
    sort_order: 4,
  },

  // ---- 套餐 ----
  {
    id: 'combo-pork-bubble',
    category_id: 'combo',
    name: { zh: '滷肉飯 + 珍珠奶茶', en: 'Pork Rice + Bubble Tea' },
    description: { zh: '滷肉飯搭配任選珍珠奶茶（M/L）', en: 'Braised pork rice with bubble tea of your choice (M/L)' },
    price: 15.99,
    image: '/images/products/combo-pork-bubble.webp',
    available: true,
    tags: ['套餐', '熱食'],
    sort_order: 1,
  },
  {
    id: 'combo-chicken-bubble',
    category_id: 'combo',
    name: { zh: '嘉義雞肉飯 + 珍珠奶茶', en: 'Chicken Rice + Bubble Tea' },
    description: { zh: '嘉義雞肉飯搭配任選珍珠奶茶（M/L）', en: 'Chiayi chicken rice with bubble tea of your choice (M/L)' },
    price: 15.99,
    image: '/images/products/combo-chicken-bubble.webp',
    available: true,
    tags: ['套餐', '熱食'],
    sort_order: 2,
  },
  {
    id: 'combo-noodle-bubble',
    category_id: 'combo',
    name: { zh: '牛肉麵 + 珍珠奶茶', en: 'Noodles + Bubble Tea' },
    description: { zh: '牛肉麵搭配珍珠奶茶（M/L）', en: 'Beef noodle soup with bubble tea (M/L)' },
    price: 18.49,
    image: '/images/products/combo-noodle-bubble.webp',
    available: true,
    tags: ['套餐', '熱食'],
    sort_order: 3,
  },
  {
    id: 'combo-pork-tea',
    category_id: 'combo',
    name: { zh: '滷肉飯 + 台灣熱茶', en: 'Pork Rice + Floral Taiwan Tea' },
    description: { zh: '滷肉飯搭配現沖台灣高山茶（M/L）', en: 'Braised pork rice with pot-brewed Taiwan tea (M/L)' },
    price: 13.99,
    image: '/images/products/combo-pork-tea.webp',
    available: true,
    tags: ['套餐', '熱食'],
    sort_order: 4,
  },
  {
    id: 'combo-chicken-tea',
    category_id: 'combo',
    name: { zh: '嘉義雞肉飯 + 台灣熱茶', en: 'Chicken Rice + Floral Taiwan Tea' },
    description: { zh: '嘉義雞肉飯搭配現沖台灣高山茶（M/L）', en: 'Chiayi chicken rice with pot-brewed Taiwan tea (M/L)' },
    price: 13.99,
    image: '/images/products/combo-chicken-tea.webp',
    available: true,
    tags: ['套餐', '熱食'],
    sort_order: 5,
  },
  {
    id: 'combo-noodle-tea',
    category_id: 'combo',
    name: { zh: '牛肉麵 + 台灣熱茶', en: 'Noodles + Floral Taiwan Tea' },
    description: { zh: '牛肉麵搭配現沖台灣高山茶（M/L）', en: 'Beef noodle soup with pot-brewed Taiwan tea (M/L)' },
    price: 16.49,
    image: '/images/products/combo-noodle-tea.webp',
    available: true,
    tags: ['套餐', '熱食'],
    sort_order: 6,
  },

  // ---- 台灣紅茶 ----
  {
    id: 'honey-black-tea',
    category_id: 'taiwanese-black-tea',
    name: { zh: '台灣蜜香紅茶', en: 'Alishan Honey Black Tea' },
    description: { zh: '天然蜜香，台灣阿里山特有風味', en: 'Natural honey flavor, Alishan mountain tea' },
    price: 5.00,
    image: '/images/products/honey-black-tea.webp',
    available: true,
    tags: ['熱飲', '冷飲'],
    sort_order: 1,
  },
  {
    id: 'signature-bubble-tea',
    category_id: 'taiwanese-black-tea',
    name: { zh: '招牌珍珠奶茶', en: 'Taiwanese Bubble Tea' },
    description: { zh: '台灣經典，Q彈珍珠搭配香醇奶茶', en: 'Classic Taiwanese bubble tea with chewy tapioca pearls' },
    price: 6.45,
    image: '/images/products/bubble-tea.webp',
    available: true,
    tags: ['熱飲', '冷飲', '招牌'],
    sort_order: 2,
  },
  {
    id: 'honey-milk-tea',
    category_id: 'taiwanese-black-tea',
    name: { zh: '蜜香奶茶', en: 'Taiwanese Milk Tea' },
    description: { zh: '蜜香紅茶搭配鮮奶', en: 'Honey-flavored black tea with fresh milk' },
    price: 5.65,
    image: '/images/products/honey-milk-tea.webp',
    available: true,
    tags: ['熱飲', '冷飲'],
    sort_order: 3,
  },

  // ---- 無咖啡因 ----
  {
    id: 'brown-sugar-bubble-milk',
    category_id: 'caffeine-free',
    name: { zh: '黑糖珍珠鮮奶', en: 'Brown Sugar Bubble Milk' },
    description: { zh: '香醇黑糖漿配手工珍珠與鮮奶', en: 'Rich brown sugar syrup with handcrafted pearls and fresh milk' },
    price: 6.45,
    image: '/images/products/brown-sugar-bubble-milk.webp',
    available: true,
    tags: ['冷飲', '無咖啡因'],
    sort_order: 1,
  },
  {
    id: 'taro-latte',
    category_id: 'caffeine-free',
    name: { zh: '芋香拿鐵', en: 'Taro Latte' },
    description: { zh: '濃郁芋頭搭配鮮奶', en: 'Rich taro with fresh milk' },
    price: 5.25,
    image: '/images/products/taro-latte.webp',
    available: true,
    tags: ['熱飲', '冷飲', '無咖啡因'],
    sort_order: 2,
  },
  {
    id: 'wintermelon-milk',
    category_id: 'caffeine-free',
    name: { zh: '冬瓜鮮奶', en: 'Wintermelon Milk' },
    description: { zh: '古早味冬瓜茶搭配鮮奶', en: 'Traditional wintermelon tea with fresh milk' },
    price: 5.35,
    image: '/images/products/wintermelon-milk.webp',
    available: true,
    tags: ['冷飲', '無咖啡因'],
    sort_order: 3,
  },
  {
    id: 'wintermelon-lemonade',
    category_id: 'caffeine-free',
    name: { zh: '冬瓜檸檬', en: 'Wintermelon Lemonade' },
    description: { zh: '冬瓜茶搭配新鮮檸檬', en: 'Wintermelon tea with fresh lemon' },
    price: 5.85,
    image: '/images/products/wintermelon-lemonade.webp',
    available: true,
    tags: ['冷飲', '無咖啡因'],
    sort_order: 4,
  },
  {
    id: 'ginger-milk-tea',
    category_id: 'caffeine-free',
    name: { zh: '薑汁奶茶', en: 'Ginger Milk Tea' },
    description: { zh: '暖身薑汁搭配香醇奶茶', en: 'Warming ginger with rich milk tea' },
    price: 5.85,
    image: '/images/products/ginger-milk-tea.webp',
    available: true,
    tags: ['熱飲', '無咖啡因'],
    sort_order: 5,
  },

  // ---- 茉莉綠茶 ----
  {
    id: 'honey-jasmine-green-tea',
    category_id: 'jasmine-green-tea',
    name: { zh: '茉莉蜂蜜綠茶', en: 'Honey Jasmine Green Tea' },
    description: { zh: '茉莉綠茶加天然蜂蜜，清香甘甜', en: 'Jasmine green tea with natural honey' },
    price: 4.85,
    image: '/images/products/honey-jasmine-green-tea.webp',
    available: true,
    tags: ['冷飲'],
    sort_order: 1,
  },
  {
    id: 'jasmine-bubble-milk-green',
    category_id: 'jasmine-green-tea',
    name: { zh: '茉莉珍珠奶綠', en: 'Jasmine Green Bubble Tea' },
    description: { zh: '茉莉綠茶搭配珍珠與鮮奶', en: 'Jasmine green tea with pearls and milk' },
    price: 6.45,
    image: '/images/products/jasmine-bubble-milk-green.webp',
    available: true,
    tags: ['熱飲', '冷飲'],
    sort_order: 2,
  },
  {
    id: 'jasmine-milk-green',
    category_id: 'jasmine-green-tea',
    name: { zh: '茉莉奶綠', en: 'Jasmine Green Milk Tea' },
    description: { zh: '茉莉綠茶搭配鮮奶', en: 'Jasmine green tea with fresh milk' },
    price: 5.65,
    image: '/images/products/jasmine-milk-green.webp',
    available: true,
    tags: ['熱飲', '冷飲'],
    sort_order: 3,
  },

  // ---- 台灣烏龍茶 ----
  {
    id: 'honey-oolong-bubble-tea',
    category_id: 'oolong',
    name: { zh: '蜂蜜烏龍珍珠奶茶', en: 'Honey Oolong Bubble Tea' },
    description: { zh: '蜂蜜烏龍搭配珍珠，層次豐富', en: 'Honey oolong with tapioca pearls, rich and layered' },
    price: 6.65,
    image: '/images/products/honey-oolong-bubble-tea.webp',
    available: true,
    tags: ['熱飲', '冷飲'],
    sort_order: 1,
  },
  {
    id: 'honey-oolong-milk-tea',
    category_id: 'oolong',
    name: { zh: '蜂蜜烏龍奶茶', en: 'Honey Oolong Milk Tea' },
    description: { zh: '烏龍茶蜜香搭配鮮奶', en: 'Honey oolong tea with fresh milk' },
    price: 5.85,
    image: '/images/products/honey-oolong-milk-tea.webp',
    available: true,
    tags: ['熱飲', '冷飲'],
    sort_order: 2,
  },

  // ---- 京都抹茶 ----
  {
    id: 'matcha-latte',
    category_id: 'matcha',
    name: { zh: '抹茶拿鐵', en: 'Matcha Latte' },
    description: { zh: '京都一保堂抹茶，濃郁抹茶香', en: 'Kyoto Ippodo matcha, rich and fragrant' },
    price: 5.95,
    image: '/images/products/matcha-latte.webp',
    available: true,
    tags: ['熱飲', '冷飲'],
    sort_order: 1,
  },
  {
    id: 'bubble-matcha-latte',
    category_id: 'matcha',
    name: { zh: '珍珠抹茶拿鐵', en: 'Bubble Matcha Latte' },
    description: { zh: '抹茶拿鐵加Q彈珍珠', en: 'Matcha latte with chewy tapioca pearls' },
    price: 7.15,
    image: '/images/products/bubble-matcha-latte.webp',
    available: true,
    tags: ['熱飲', '冷飲'],
    sort_order: 2,
  },

  // ---- 水果茶 ----
  {
    id: 'passion-fruit-green-tea',
    category_id: 'fruit-tea',
    name: { zh: '百香綠茶', en: 'Passion Fruit Green Tea' },
    description: { zh: '新鮮百香果搭配綠茶，酸甜清爽', en: 'Fresh passion fruit with green tea, sweet and tangy' },
    price: 5.85,
    image: '/images/products/passion-fruit-green-tea.webp',
    available: true,
    tags: ['冷飲'],
    sort_order: 1,
  },
  {
    id: 'lychee-jelly-black-tea',
    category_id: 'fruit-tea',
    name: { zh: '荔枝紅茶', en: 'Lychee Jelly Black Tea' },
    description: { zh: '荔枝果凍搭配紅茶，清甜芬芳', en: 'Lychee jelly with black tea, refreshing and fragrant' },
    price: 5.85,
    image: '/images/products/lychee-jelly-black-tea.webp',
    available: true,
    tags: ['冷飲'],
    sort_order: 2,
  },
  {
    id: 'apple-jade-dew',
    category_id: 'fruit-tea',
    name: { zh: '蘋果玉露青', en: 'Apple Jade Dew' },
    description: { zh: '蘋果搭配玉露青茶，清新回甘', en: 'Apple with jade dew green tea, crisp and refreshing' },
    price: 6.45,
    image: '/images/products/apple-jade-dew.webp',
    available: true,
    tags: ['冷飲'],
    sort_order: 3,
  },

  // ---- 咖啡 ----
  {
    id: 'americano',
    category_id: 'coffee',
    name: { zh: '美式咖啡', en: 'Americano' },
    description: { zh: '經典美式黑咖啡', en: 'Classic American black coffee' },
    price: 3.85,
    image: '/images/products/americano.webp',
    available: true,
    tags: ['熱飲', '冷飲'],
    sort_order: 1,
  },
  {
    id: 'cafe-latte',
    category_id: 'coffee',
    name: { zh: '拿鐵', en: 'Cafe Latte' },
    description: { zh: '濃縮咖啡搭配綿密奶泡', en: 'Espresso with steamed milk foam' },
    price: 4.65,
    image: '/images/products/cafe-latte.webp',
    available: true,
    tags: ['熱飲', '冷飲'],
    sort_order: 2,
  },

  // ---- 現沖高山茶 ----
  {
    id: 'winter-oolong',
    category_id: 'pot-brewed',
    name: { zh: '冬片', en: 'Winter Leaves Oolong' },
    description: { zh: '現沖高山茶，無糖', en: 'Pot-brewed high mountain tea, sugar free' },
    price: 5.00,
    image: '/images/products/winter-oolong.webp',
    available: true,
    tags: ['熱飲', '無糖'],
    sort_order: 1,
  },
  {
    id: 'spring-oolong',
    category_id: 'pot-brewed',
    name: { zh: '春茶', en: 'Spring Leaves Oolong' },
    description: { zh: '現沖高山春茶，無糖', en: 'Pot-brewed spring oolong, sugar free' },
    price: 5.00,
    image: '/images/products/spring-oolong.webp',
    available: true,
    tags: ['熱飲', '無糖'],
    sort_order: 2,
  },
  {
    id: 'no12-oolong',
    category_id: 'pot-brewed',
    name: { zh: '金萱', en: 'No.12 Oolong (Jin Xuan)' },
    description: { zh: '金萱烏龍，奶香自然回甘', en: 'Jin Xuan oolong, natural milky sweet aftertaste' },
    price: 5.00,
    image: '/images/products/jinxuan-oolong.webp',
    available: true,
    tags: ['熱飲', '無糖'],
    sort_order: 3,
  },
  {
    id: 'iron-goddess',
    category_id: 'pot-brewed',
    name: { zh: '鐵觀音', en: 'Iron Goddess Oolong' },
    description: { zh: '傳統鐵觀音，焙火韻味', en: 'Traditional Tieguanyin, roasted flavor' },
    price: 6.00,
    image: '/images/products/iron-goddess.webp',
    available: true,
    tags: ['熱飲', '無糖'],
    sort_order: 4,
  },
  {
    id: 'alishan-black-tea',
    category_id: 'pot-brewed',
    name: { zh: '阿里山紅茶', en: 'A-Li Shan Black Tea' },
    description: { zh: '阿里山高山紅茶，無糖', en: 'Ali Shan high mountain black tea, sugar free' },
    price: 5.00,
    image: '/images/products/alishan-black-tea.webp',
    available: true,
    tags: ['熱飲', '無糖'],
    sort_order: 5,
  },
  {
    id: 'four-season-oolong',
    category_id: 'pot-brewed',
    name: { zh: '四季春', en: 'Four Season Oolong' },
    description: { zh: '四季皆宜的春茶，清香回甘', en: 'Year-round spring tea, light and refreshing' },
    price: 5.00,
    image: '/images/products/four-season-oolong.webp',
    available: true,
    tags: ['熱飲', '無糖'],
    sort_order: 6,
  },

  // ---- 自製甜點 ----
  {
    id: 'pineapple-cake',
    category_id: 'desserts',
    name: { zh: '台灣鳳梨酥', en: 'Taiwan Pineapple Cake' },
    description: { zh: '每日現作，酥脆外皮搭配鳳梨內餡', en: 'Made fresh daily, flaky crust with pineapple filling' },
    price: 3.25,
    image: '/images/products/pineapple-cake.webp',
    available: true,
    tags: ['甜點', '手工烘焙'],
    sort_order: 1,
  },
  {
    id: 'creme-brulee',
    category_id: 'desserts',
    name: { zh: '焦糖布丁', en: 'Crème Brûlée' },
    description: { zh: '法式經典焦糖布丁', en: 'Classic French crème brûlée' },
    price: 4.35,
    image: '/images/products/creme-brulee.webp',
    available: true,
    tags: ['甜點'],
    sort_order: 2,
  },
  {
    id: 'matcha-basque-cheesecake',
    category_id: 'desserts',
    name: { zh: '抹茶巴斯克蛋糕', en: 'Matcha Basque Cheese Cake' },
    description: { zh: '濃郁抹茶搭配巴斯克起司蛋糕', en: 'Rich matcha with Basque-style cheesecake' },
    price: 5.45,
    image: '/images/products/matcha-basque-cheesecake.webp',
    available: true,
    tags: ['甜點'],
    sort_order: 3,
  },
  {
    id: 'taro-panna-cotta',
    category_id: 'desserts',
    name: { zh: '芋泥奶酪', en: 'Taro Panna Cotta' },
    description: { zh: '濃郁芋泥搭配義式奶酪', en: 'Rich taro with Italian panna cotta' },
    price: 4.85,
    image: '/images/products/taro-panna-cotta.webp',
    available: true,
    tags: ['甜點'],
    sort_order: 4,
  },
  {
    id: 'mille-crepe-cake',
    category_id: 'desserts',
    name: { zh: '千層蛋糕', en: 'Mille Crêpe Cake' },
    description: { zh: '多層法式薄餅搭配奶油', en: 'Multi-layered French crêpes with cream' },
    price: 7.99,
    image: '/images/products/mille-crepe-cake.webp',
    available: true,
    tags: ['甜點'],
    sort_order: 5,
  },
  {
    id: 'matcha-swiss-roll',
    category_id: 'desserts',
    name: { zh: '抹茶生乳捲', en: 'Matcha Swiss Roll' },
    description: { zh: '抹茶蛋糕捲搭配鮮奶油', en: 'Matcha cake roll with fresh cream' },
    price: 5.65,
    image: '/images/products/matcha-swiss-roll.webp',
    available: true,
    tags: ['甜點'],
    sort_order: 6,
  },
]

async function seedCategories() {
  console.log(`正在寫入 ${CATEGORIES_SEED.length} 個分類...`)
  const { error } = await supabase
    .from('categories')
    .upsert(CATEGORIES_SEED, { onConflict: 'id' })
  if (error) throw new Error(`分類寫入失敗: ${error.message}`)
  console.log(`✓ 分類寫入完成 (${CATEGORIES_SEED.length} 筆)`)
}

async function seedProducts() {
  console.log(`正在寫入 ${PRODUCTS_SEED.length} 個產品...`)
  const { error } = await supabase
    .from('products')
    .upsert(PRODUCTS_SEED, { onConflict: 'id' })
  if (error) throw new Error(`產品寫入失敗: ${error.message}`)
  console.log(`✓ 產品寫入完成 (${PRODUCTS_SEED.length} 筆)`)
}

async function main() {
  console.log('=== TaiwanWay 菜單資料播種開始 ===')
  await seedCategories()
  await seedProducts()
  console.log('=== 播種完成 ===')
}

main().catch((err) => {
  console.error('播種失敗:', err)
  process.exit(1)
})
