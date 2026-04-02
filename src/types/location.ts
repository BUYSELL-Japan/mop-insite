export interface Location {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    id: string;
    title: string;
    title_zh_tw?: string;
    description: string;
    description_ja?: string;
    description_en?: string;
    description_zh_tw?: string;
    description_ko?: string;
    address: string;
    'address_zh-tw'?: string;
    map_id: string;
    pic: string;
    category: string;
    category_id?: string;
    pin_id?: string;
    item_id?: string;
    affiliate_link?: string;
    affiliate_link_tw?: string;
    guidebook_url_en?: string;
    guidebook_url_tw?: string;
    original_data?: {
      category: string;
      [key: string]: any;
    };
  };
}

export interface GeoJSONData {
  type: 'FeatureCollection';
  features: Location[];
}

export const CATEGORIES: Record<string, {
  name: string;
  nameKey: string;
  color: string;
  markerUrl: string;
}> = {
  "1": {
    name: "Tourist Attractions",
    nameKey: "category.touristAttractions",
    color: "#ff0000",
    markerUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png"
  },
  "2": {
    name: "Activity",
    nameKey: "category.activity",
    color: "#00ff00",
    markerUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png"
  },
  "3": {
    name: "Hotels",
    nameKey: "category.hotels",
    color: "#e3f26f",
    markerUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png"
  },
  "4": {
    name: "Restaurant",
    nameKey: "category.restaurant",
    color: "#ff9933",
    markerUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png"
  },
  "5": {
    name: "Beaches",
    nameKey: "category.beaches",
    color: "#00ffff",
    markerUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png"
  },
  "6": {
    name: "Hospitals",
    nameKey: "category.hospitals",
    color: "#ffffff",
    markerUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png"
  },
  "9": {
    name: "Naha Airport",
    nameKey: "category.nahaAirport",
    color: "#8000ff",
    markerUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png"
  }
};