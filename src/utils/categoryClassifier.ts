import { Location } from '../types/location';

const CATEGORY_RULES = {
  HOTELS: {
    id: "3",
    keywords: [
      'ホテル', '旅館', '民宿', 'hotel', 'resort', 'inn', 'lodge',
      '宿', '泊', 'stay', 'ステイ', '宿泊', 'コテージ', 'cottage',
      'villa', 'ヴィラ', 'リゾート'
    ]
  },
  RESTAURANTS: {
    id: "4",
    keywords: [
      'レストラン', 'restaurant', 'カフェ', 'cafe', '食堂', 'dining',
      '料理', '居酒屋', 'バー', 'bar', '焼肉', '寿司', 'sushi',
      'うどん', 'そば', '定食', '食事', 'ダイニング', '軽食',
      'キッチン', 'kitchen', '屋台', '食事処', '茶屋'
    ]
  },
  ACTIVITIES: {
    id: "2",
    keywords: [
      'アクティビティ', 'activity', 'ツアー', 'tour', 'スポーツ',
      '体験', 'experience', 'アドベンチャー', 'adventure',
      'ダイビング', 'diving', 'シュノーケル', 'snorkel',
      'サーフィン', 'surf', 'カヤック', 'kayak', '釣り', 'fishing',
      'クルーズ', 'cruise', '遊覧', 'レンタル', 'rental',
      'マリン', 'marine', 'スクール', 'school', 'レッスン', 'lesson'
    ]
  }
};

const containsKeywords = (text: string, keywords: string[]): boolean => {
  const normalizedText = text.toLowerCase();
  return keywords.some(keyword => 
    normalizedText.includes(keyword.toLowerCase())
  );
};

export const classifyLocation = (location: Location): string => {
  const { title, description, address } = location.properties;
  const searchText = `${title} ${description} ${address}`;

  if (containsKeywords(searchText, CATEGORY_RULES.HOTELS.keywords)) {
    return CATEGORY_RULES.HOTELS.id;
  }

  if (containsKeywords(searchText, CATEGORY_RULES.RESTAURANTS.keywords)) {
    return CATEGORY_RULES.RESTAURANTS.id;
  }

  if (containsKeywords(searchText, CATEGORY_RULES.ACTIVITIES.keywords)) {
    return CATEGORY_RULES.ACTIVITIES.id;
  }

  return "1";
};