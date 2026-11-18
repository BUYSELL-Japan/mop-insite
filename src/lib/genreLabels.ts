// Copied from MOP-SSG src/lib/genreLabels.ts (2026-11-18). Keep both files identical when adding genres.
/**
 * Restaurant genre code (restaurants.geojson `genre`, Google Places primary type) -> display label.
 *
 * Covers every code present in restaurants.geojson and the test records as of 2026-11-18
 * (127 codes; checked with pipeline/data/restaurants.geojson). Unknown codes fall back to a
 * title-cased version of the code ("new_type_shop" -> "New Type Shop"), never the raw code.
 * zh = Traditional Chinese (Taiwan).
 */

export type GenreLang = 'en' | 'zh' | 'ko';
type Labels = Record<GenreLang, string>;

const L = (en: string, zh: string, ko: string): Labels => ({ en, zh, ko });

export const GENRE_LABELS: Record<string, Labels> = {
  // Japanese
  japanese_izakaya_restaurant: L('Izakaya', '居酒屋', '이자카야'),
  izakaya: L('Izakaya', '居酒屋', '이자카야'),
  japanese_restaurant: L('Japanese Restaurant', '日本料理', '일식당'),
  yakiniku_restaurant: L('Yakiniku', '燒肉', '야키니쿠'),
  ramen_restaurant: L('Ramen', '拉麵', '라멘'),
  noodle_shop: L('Noodle Shop', '麵店', '면 요리 전문점'),
  okinawa_soba: L('Okinawa Soba', '沖繩麵', '오키나와 소바'),
  sushi_restaurant: L('Sushi', '壽司', '스시'),
  yakitori_restaurant: L('Yakitori', '串燒', '야키토리'),
  japanese_curry_restaurant: L('Japanese Curry', '日式咖哩', '일본식 카레'),
  tonkatsu_restaurant: L('Tonkatsu', '豬排', '돈카츠'),
  snack_bar: L('Snack Bar', '小酒館', '스낵바'),
  taco_rice: L('Taco Rice', '塔可飯', '타코라이스'),
  // General
  restaurant: L('Restaurant', '餐廳', '레스토랑'),
  family_restaurant: L('Family Restaurant', '家庭餐廳', '패밀리 레스토랑'),
  western_restaurant: L('Western Restaurant', '西餐廳', '양식당'),
  fine_dining_restaurant: L('Fine Dining', '高級餐廳', '파인 다이닝'),
  buffet_restaurant: L('Buffet', '自助餐', '뷔페'),
  cafeteria: L('Cafeteria', '自助食堂', '구내식당'),
  diner: L('Diner', '小餐館', '다이너'),
  bistro: L('Bistro', '小酒館餐廳', '비스트로'),
  brunch_restaurant: L('Brunch', '早午餐', '브런치'),
  breakfast_restaurant: L('Breakfast', '早餐', '아침 식사'),
  fusion_restaurant: L('Fusion', '創意料理', '퓨전 요리'),
  food_court: L('Food Court', '美食街', '푸드코트'),
  meal_takeaway: L('Takeout', '外帶', '테이크아웃'),
  meal_delivery: L('Delivery', '外送', '배달 음식'),
  catering_service: L('Catering', '外燴服務', '케이터링'),
  rest_stop: L('Rest Stop', '休息站', '휴게소'),
  soup_restaurant: L('Soup', '湯品', '수프 전문점'),
  salad_shop: L('Salad', '沙拉', '샐러드'),
  vegan_restaurant: L('Vegan', '純素餐廳', '비건 레스토랑'),
  vegetarian_restaurant: L('Vegetarian', '素食餐廳', '채식 레스토랑'),
  hot_pot_restaurant: L('Hot Pot', '火鍋', '훠궈·전골'),
  // Meat, grill, seafood
  steak_house: L('Steak House', '牛排館', '스테이크하우스'),
  barbecue_restaurant: L('Barbecue', '烤肉', '바비큐'),
  bar_and_grill: L('Bar & Grill', '餐酒館燒烤', '바 앤 그릴'),
  chicken_restaurant: L('Chicken', '雞肉料理', '치킨'),
  chicken_wings_restaurant: L('Chicken Wings', '雞翅', '치킨 윙'),
  seafood_restaurant: L('Seafood', '海鮮', '해산물'),
  seafood: L('Seafood', '海鮮', '해산물'),
  oyster_bar_restaurant: L('Oyster Bar', '生蠔吧', '오이스터 바'),
  fish_and_chips_restaurant: L('Fish & Chips', '炸魚薯條', '피시 앤 칩스'),
  butcher_shop: L('Butcher', '肉舖', '정육점'),
  // Fast food, casual
  hamburger_restaurant: L('Burgers', '漢堡', '햄버거'),
  fast_food_restaurant: L('Fast Food', '速食', '패스트푸드'),
  hot_dog_restaurant: L('Hot Dogs', '熱狗', '핫도그'),
  hot_dog_stand: L('Hot Dog Stand', '熱狗攤', '핫도그 가판대'),
  sandwich_shop: L('Sandwiches', '三明治', '샌드위치'),
  deli: L('Deli', '熟食店', '델리'),
  pizza_restaurant: L('Pizza', '披薩', '피자'),
  pizza_delivery: L('Pizza Delivery', '披薩外送', '피자 배달'),
  taco_restaurant: L('Tacos', '塔可', '타코'),
  burrito_restaurant: L('Burritos', '墨西哥捲餅', '부리토'),
  kebab_shop: L('Kebab', '沙威瑪', '케밥'),
  bagel_shop: L('Bagels', '貝果', '베이글'),
  // World cuisines
  italian_restaurant: L('Italian', '義大利料理', '이탈리안'),
  french_restaurant: L('French', '法式料理', '프렌치'),
  spanish_restaurant: L('Spanish', '西班牙料理', '스페인 요리'),
  mediterranean_restaurant: L('Mediterranean', '地中海料理', '지중해 요리'),
  european_restaurant: L('European', '歐式料理', '유럽 요리'),
  fondue_restaurant: L('Fondue', '起司火鍋', '퐁뒤'),
  american_restaurant: L('American', '美式料理', '미국 요리'),
  southwestern_us_restaurant: L('Southwestern', '美國西南料理', '미국 남서부 요리'),
  tex_mex_restaurant: L('Tex-Mex', '德州墨西哥料理', '텍스멕스'),
  cajun_restaurant: L('Cajun', '卡郡料理', '케이준 요리'),
  soul_food_restaurant: L('Soul Food', '美國南方料理', '소울 푸드'),
  hawaiian_restaurant: L('Hawaiian', '夏威夷料理', '하와이 요리'),
  mexican_restaurant: L('Mexican', '墨西哥料理', '멕시코 요리'),
  brazilian_restaurant: L('Brazilian', '巴西料理', '브라질 요리'),
  peruvian_restaurant: L('Peruvian', '秘魯料理', '페루 요리'),
  argentinian_restaurant: L('Argentinian', '阿根廷料理', '아르헨티나 요리'),
  cuban_restaurant: L('Cuban', '古巴料理', '쿠바 요리'),
  chinese_restaurant: L('Chinese', '中式料理', '중식'),
  chinese_noodle_restaurant: L('Chinese Noodles', '中式麵食', '중국식 면 요리'),
  dim_sum_restaurant: L('Dim Sum', '港式點心', '딤섬'),
  taiwanese_restaurant: L('Taiwanese', '台灣料理', '대만 요리'),
  korean_restaurant: L('Korean', '韓式料理', '한식'),
  korean_barbecue_restaurant: L('Korean BBQ', '韓式烤肉', '한국식 바비큐'),
  asian_restaurant: L('Asian', '亞洲料理', '아시아 요리'),
  asian_fusion_restaurant: L('Asian Fusion', '亞洲創意料理', '아시안 퓨전'),
  thai_restaurant: L('Thai', '泰式料理', '태국 요리'),
  vietnamese_restaurant: L('Vietnamese', '越南料理', '베트남 요리'),
  filipino_restaurant: L('Filipino', '菲律賓料理', '필리핀 요리'),
  malaysian_restaurant: L('Malaysian', '馬來西亞料理', '말레이시아 요리'),
  indian_restaurant: L('Indian', '印度料理', '인도 요리'),
  north_indian_restaurant: L('North Indian', '北印度料理', '북인도 요리'),
  south_indian_restaurant: L('South Indian', '南印度料理', '남인도 요리'),
  sri_lankan_restaurant: L('Sri Lankan', '斯里蘭卡料理', '스리랑카 요리'),
  turkish_restaurant: L('Turkish', '土耳其料理', '튀르키예 요리'),
  middle_eastern_restaurant: L('Middle Eastern', '中東料理', '중동 요리'),
  // Cafes, sweets
  cafe: L('Cafe', '咖啡廳', '카페'),
  coffee_shop: L('Coffee Shop', '咖啡店', '커피숍'),
  coffee_stand: L('Coffee Stand', '咖啡攤', '커피 스탠드'),
  coffee_roastery: L('Coffee Roastery', '咖啡烘焙坊', '커피 로스터리'),
  tea_house: L('Tea House', '茶館', '찻집'),
  tea_store: L('Tea Shop', '茶葉店', '차 전문점'),
  juice_shop: L('Juice Bar', '果汁店', '주스 바'),
  acai_shop: L('Acai Bowls', '巴西莓碗', '아사이볼'),
  dog_cafe: L('Dog Cafe', '狗狗咖啡廳', '강아지 카페'),
  cat_cafe: L('Cat Cafe', '貓咪咖啡廳', '고양이 카페'),
  bakery: L('Bakery', '麵包店', '베이커리'),
  pastry_shop: L('Pastry Shop', '甜點麵包店', '페이스트리 숍'),
  cake_shop: L('Cake Shop', '蛋糕店', '케이크 전문점'),
  dessert_restaurant: L('Desserts', '甜點', '디저트'),
  dessert_shop: L('Dessert Shop', '甜點店', '디저트 가게'),
  ice_cream_shop: L('Ice Cream', '冰淇淋', '아이스크림'),
  donut_shop: L('Donuts', '甜甜圈', '도넛'),
  confectionery: L('Sweets', '糕點', '과자점'),
  chocolate_shop: L('Chocolate', '巧克力', '초콜릿'),
  // Bars, nightlife
  bar: L('Bar', '酒吧', '바'),
  pub: L('Pub', '酒館', '펍'),
  irish_pub: L('Irish Pub', '愛爾蘭酒吧', '아이리시 펍'),
  lounge_bar: L('Lounge Bar', '酒廊', '라운지 바'),
  cocktail_bar: L('Cocktail Bar', '調酒吧', '칵테일 바'),
  wine_bar: L('Wine Bar', '葡萄酒吧', '와인 바'),
  sports_bar: L('Sports Bar', '運動酒吧', '스포츠 바'),
  hookah_bar: L('Hookah Bar', '水煙吧', '후카 바'),
  beer_garden: L('Beer Garden', '啤酒花園', '비어가든'),
  brewpub: L('Brewpub', '精釀酒吧', '브루펍'),
  brewery: L('Brewery', '釀酒廠', '양조장'),
  night_club: L('Nightclub', '夜店', '나이트클럽'),
  live_music_venue: L('Live Music', '現場音樂', '라이브 음악'),
  // Shops, markets
  food_store: L('Food Store', '食品店', '식료품점'),
  market: L('Market', '市場', '시장'),
  farmers_market: L("Farmers' Market", '農產市集', '농산물 시장'),
  health_food_store: L('Health Food Store', '健康食品店', '건강식품점'),
};

/** Display label for a genre code; unknown codes become title case, never the raw code. */
export function genreLabel(code: string | null | undefined, lang: GenreLang): string {
  if (!code) return '';
  const labels = GENRE_LABELS[code];
  if (labels) return labels[lang] || labels.en;
  return code
    .split('_')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}
