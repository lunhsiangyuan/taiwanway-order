import type { OrderableProduct } from './types'

export const CATEGORIES = {
  RICE_DISHES: 'rice-dishes',
  NOODLE_SOUPS: 'noodle-soups',
  OLD_FASHIONED: 'old-fashioned',
  TAIWANESE_BLACK_TEA: 'taiwanese-black-tea',
  CAFFEINE_FREE: 'caffeine-free',
  JASMINE_GREEN_TEA: 'jasmine-green-tea',
  OOLONG: 'oolong',
  MATCHA: 'matcha',
  POT_BREWED: 'pot-brewed',
  DESSERTS: 'desserts',
} as const

export const PRODUCTS: OrderableProduct[] = [
  // ============ 飯類 ============
  {
    id: 'braised-pork-rice',
    category: CATEGORIES.RICE_DISHES,
    name: { zh: '滷肉飯', en: 'Braised Pork Rice' },
    description: { zh: '入味滷肉，搭配香Q白飯', en: 'Savory braised pork over fragrant rice' },
    price: 8.99,
    image: '/images/products/braised-pork-rice.webp',
    available: true,
    tags: ['熱食'],
  },
  {
    id: 'chicken-rice',
    category: CATEGORIES.RICE_DISHES,
    name: { zh: '雞肉飯', en: 'Chicken Rice' },
    description: { zh: '嫩煎雞腿肉，搭配特製醬汁', en: 'Tender chicken thigh with special sauce' },
    price: 9.99,
    image: '/images/products/chicken-rice.webp',
    available: true,
    tags: ['熱食'],
  },

  // ============ 麵類 ============
  {
    id: 'beef-noodle-soup',
    category: CATEGORIES.NOODLE_SOUPS,
    name: { zh: '牛肉麵', en: 'Beef Noodle Soup' },
    description: { zh: '香濃湯頭，嫩滑牛肉，手工麵條', en: 'Rich broth, tender beef, handmade noodles' },
    price: 12.99,
    image: '/images/products/beef-noodle-soup.webp',
    available: true,
    tags: ['熱食', '招牌'],
  },
  {
    id: 'wonton-noodle-soup',
    category: CATEGORIES.NOODLE_SOUPS,
    name: { zh: '餛飩麵', en: 'Wonton Noodle Soup' },
    description: { zh: '手工餛飩，清甜湯頭', en: 'Handmade wontons in clear sweet broth' },
    price: 10.99,
    image: '/images/products/wonton-noodle-soup.webp',
    available: true,
    tags: ['熱食'],
  },

  // ============ 懷舊古早味 ============
  {
    id: 'classic-black-tea',
    category: CATEGORIES.OLD_FASHIONED,
    name: { zh: '冰紅茶', en: 'Classic Black Tea' },
    description: { zh: '懷舊古早味冰紅茶', en: 'Classic old-fashioned iced black tea' },
    price: 2.99,
    image: '/images/products/classic-black-tea.webp',
    available: true,
    tags: ['冷飲'],
  },
  {
    id: 'classic-milk-tea',
    category: CATEGORIES.OLD_FASHIONED,
    name: { zh: '鮮奶茶', en: 'Classic Milk Tea (Whole Milk)' },
    description: { zh: '鮮奶與紅茶的經典結合', en: 'Classic whole milk and black tea combination' },
    price: 4.35,
    image: '/images/products/classic-milk-tea.webp',
    available: true,
    tags: ['冷飲'],
  },

  // ============ 台灣紅茶 ============
  {
    id: 'honey-black-tea',
    category: CATEGORIES.TAIWANESE_BLACK_TEA,
    name: { zh: '台灣蜜香紅茶', en: 'Nature Honey-flavored Black Tea' },
    description: { zh: '天然蜜香，台灣特有風味', en: 'Natural honey flavor, unique Taiwanese taste' },
    price: 5.95,
    image: '/images/products/honey-black-tea.webp',
    available: true,
    tags: ['熱飲', '冷飲'],
  },
  {
    id: 'signature-bubble-tea',
    category: CATEGORIES.TAIWANESE_BLACK_TEA,
    name: { zh: '招牌珍珠奶茶', en: 'Taiwanese Bubble Tea' },
    description: { zh: '台灣經典，Q彈珍珠搭配香醇奶茶', en: 'Classic Taiwanese bubble tea with chewy tapioca pearls' },
    price: 5.95,
    image: '/images/products/bubble-tea.webp',
    available: true,
    tags: ['熱飲', '冷飲', '招牌'],
  },
  {
    id: 'honey-milk-tea',
    category: CATEGORIES.TAIWANESE_BLACK_TEA,
    name: { zh: '蜜香奶茶', en: 'Taiwanese Milk Tea' },
    description: { zh: '蜜香紅茶搭配鮮奶', en: 'Honey-flavored black tea with fresh milk' },
    price: 4.95,
    image: '/images/products/honey-milk-tea.webp',
    available: true,
    tags: ['熱飲', '冷飲'],
  },

  // ============ 無咖啡因 ============
  {
    id: 'brown-sugar-bubble-milk',
    category: CATEGORIES.CAFFEINE_FREE,
    name: { zh: '黑糖珍珠鮮奶', en: 'Brown Sugar Bubble Milk' },
    description: { zh: '香醇黑糖漿配手工珍珠與鮮奶', en: 'Rich brown sugar syrup with handcrafted pearls and fresh milk' },
    price: 6.45,
    image: '/images/products/brown-sugar-bubble-milk.webp',
    available: true,
    tags: ['熱飲', '冷飲', '無咖啡因'],
  },

  // ============ 茉莉綠茶 ============
  {
    id: 'honey-jasmine-green-tea',
    category: CATEGORIES.JASMINE_GREEN_TEA,
    name: { zh: '茉莉蜂蜜綠茶', en: 'Honey Jasmine Green Tea' },
    description: { zh: '茉莉綠茶加天然蜂蜜，清香甘甜', en: 'Jasmine green tea with natural honey' },
    price: 5.25,
    image: '/images/products/honey-jasmine-green-tea.webp',
    available: true,
    tags: ['冷飲'],
  },
  {
    id: 'jasmine-bubble-milk-green',
    category: CATEGORIES.JASMINE_GREEN_TEA,
    name: { zh: '茉莉珍珠奶綠', en: 'Jasmine Green Bubble Tea' },
    description: { zh: '茉莉綠茶搭配珍珠與鮮奶', en: 'Jasmine green tea with pearls and milk' },
    price: 6.25,
    image: '/images/products/jasmine-bubble-milk-green.webp',
    available: true,
    tags: ['熱飲', '冷飲'],
  },

  // ============ 台灣烏龍茶 ============
  {
    id: 'honey-oolong-bubble-tea',
    category: CATEGORIES.OOLONG,
    name: { zh: '蜂蜜烏龍珍珠奶茶', en: 'Honey Oolong Bubble Tea' },
    description: { zh: '蜂蜜烏龍搭配珍珠，層次豐富', en: 'Honey oolong with tapioca pearls, rich and layered' },
    price: 6.25,
    image: '/images/products/honey-oolong-bubble-tea.webp',
    available: true,
    tags: ['熱飲', '冷飲'],
  },
  {
    id: 'honey-oolong-milk-tea',
    category: CATEGORIES.OOLONG,
    name: { zh: '蜂蜜烏龍奶茶', en: 'Honey Oolong Milk Tea' },
    description: { zh: '烏龍茶蜜香搭配鮮奶', en: 'Honey oolong tea with fresh milk' },
    price: 5.25,
    image: '/images/products/honey-oolong-milk-tea.webp',
    available: true,
    tags: ['熱飲', '冷飲'],
  },

  // ============ 京都一保堂抹茶 ============
  {
    id: 'matcha-latte',
    category: CATEGORIES.MATCHA,
    name: { zh: '抹茶拿鐵', en: 'Matcha Latte' },
    description: { zh: '京都一保堂抹茶，濃郁抹茶香', en: 'Kyoto Ippodo matcha, rich and fragrant' },
    price: 5.65,
    image: '/images/products/matcha-latte.webp',
    available: true,
    tags: ['熱飲', '冷飲'],
  },
  {
    id: 'bubble-matcha-latte',
    category: CATEGORIES.MATCHA,
    name: { zh: '珍珠抹茶拿鐵', en: 'Bubble Matcha Latte' },
    description: { zh: '抹茶拿鐵加Q彈珍珠', en: 'Matcha latte with chewy tapioca pearls' },
    price: 6.85,
    image: '/images/products/bubble-matcha-latte.webp',
    available: true,
    tags: ['熱飲', '冷飲'],
  },

  // ============ 現沖高山茶 (Sugar Free) ============
  {
    id: 'winter-oolong',
    category: CATEGORIES.POT_BREWED,
    name: { zh: '冬片', en: 'Winter Leaves Oolong' },
    description: { zh: '現沖高山茶，無糖', en: 'Pot-brewed high mountain tea, sugar free' },
    price: 5.00,
    image: '/images/products/winter-oolong.webp',
    available: true,
    tags: ['熱飲', '無糖'],
  },
  {
    id: 'spring-oolong',
    category: CATEGORIES.POT_BREWED,
    name: { zh: '春茶', en: 'Spring Leaves Oolong' },
    description: { zh: '現沖高山春茶，無糖', en: 'Pot-brewed spring oolong, sugar free' },
    price: 5.00,
    image: '/images/products/spring-oolong.webp',
    available: true,
    tags: ['熱飲', '無糖'],
  },
  {
    id: 'no12-oolong',
    category: CATEGORIES.POT_BREWED,
    name: { zh: '金萱', en: 'No.12 Oolong (Jin Xuan)' },
    description: { zh: '金萱烏龍，奶香自然回甘', en: 'Jin Xuan oolong, natural milky sweet aftertaste' },
    price: 5.00,
    image: '/images/products/jinxuan-oolong.webp',
    available: true,
    tags: ['熱飲', '無糖'],
  },
  {
    id: 'iron-goddess',
    category: CATEGORIES.POT_BREWED,
    name: { zh: '鐵觀音', en: 'Iron Goddess Oolong' },
    description: { zh: '傳統鐵觀音，焙火韻味', en: 'Traditional Tieguanyin, roasted flavor' },
    price: 6.00,
    image: '/images/products/iron-goddess.webp',
    available: true,
    tags: ['熱飲', '無糖'],
  },
  {
    id: 'alishan-black-tea',
    category: CATEGORIES.POT_BREWED,
    name: { zh: '阿里山紅茶', en: 'A-Li Shan Black Tea' },
    description: { zh: '阿里山高山紅茶，無糖', en: 'Ali Shan high mountain black tea, sugar free' },
    price: 5.00,
    image: '/images/products/alishan-black-tea.webp',
    available: true,
    tags: ['熱飲', '無糖'],
  },

  // ============ 自製甜點 ============
  {
    id: 'pineapple-cake',
    category: CATEGORIES.DESSERTS,
    name: { zh: '台灣鳳梨酥', en: 'Taiwan Pineapple Cake' },
    description: { zh: '每日現作，酥脆外皮搭配鳳梨內餡', en: 'Made fresh daily, flaky crust with pineapple filling' },
    price: 2.85,
    image: '/images/products/pineapple-cake.webp',
    available: true,
    tags: ['甜點', '手工烘焙'],
  },
]

export function getProductsByCategory(category: string): OrderableProduct[] {
  return PRODUCTS.filter(p => p.category === category)
}

export function getProductById(id: string): OrderableProduct | undefined {
  return PRODUCTS.find(p => p.id === id)
}

export function getAllCategories(): string[] {
  return Object.values(CATEGORIES)
}
