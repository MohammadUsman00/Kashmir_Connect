import type { HeatPoint, LayerId, LayerState, MapLineFeature, MapPointFeature, PlaceCategory } from "./types";

type Coord = [number, number];

const BASE_COORDS: Coord[] = [
  [74.7973, 34.0837],
  [74.9212, 34.1485],
  [75.0156, 34.1958],
  [75.2311, 34.2819],
  [75.4042, 34.3322],
  [74.6112, 34.0522],
  [74.4531, 33.9985],
  [75.1211, 33.8641],
  [74.2395, 34.421],
  [75.7822, 34.4755]
];

const PHOTO_SEED = [
  "https://images.unsplash.com/photo-1609942864988-2f4f6b31dadd?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1609942864919-b70013f5a302?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1625741184027-7ca35a3317bea?auto=format&fit=crop&w=1200&q=80"
];

const CATEGORY_NAMES: Record<PlaceCategory, string[]> = {
  TOURIST_ATTRACTIONS: [
    "Dal Lake Promenade",
    "Gulmarg Gondola Plaza",
    "Pahalgam Riverfront",
    "Sonmarg Base Camp",
    "Mughal Garden Terrace",
    "Nigeen Lake Walk",
    "Betaab Valley Point",
    "Aru Valley Entry",
    "Yusmarg Meadow",
    "Wular View Deck"
  ],
  HOSPITALS: [
    "Sher-i-Kashmir Medical",
    "SMHS Srinagar",
    "Bone & Joint Barzulla",
    "District Hospital Anantnag",
    "Sub District Pahalgam",
    "District Hospital Baramulla",
    "JLNM Rainawari",
    "District Hospital Kupwara",
    "Sub District Tral",
    "AIIMS Awantipora Wing"
  ],
  MOSQUES: [
    "Jama Masjid Srinagar",
    "Hazratbal Dargah",
    "Shah-i-Hamadan",
    "Masjid Noor Bemina",
    "Masjid Rehmat Rajbagh",
    "Masjid Bilal Anantnag",
    "Masjid Noorabad",
    "Masjid Kanzalwan",
    "Masjid Khanqah Sopore",
    "Masjid Eidgah"
  ],
  HOTELS: [
    "Dal Crown Residency",
    "Gulmarg Peak Hotel",
    "Pahalgam Pine Retreat",
    "Sonmarg Glacier Stay",
    "Srinagar Heritage Suites",
    "Boulevard View Hotel",
    "Lidder Grand",
    "Baramulla Valley Inn",
    "Kupwara Hillside Resort",
    "Anantnag City Hotel"
  ],
  RESTAURANTS: [
    "Wazwan House Rajbagh",
    "Nadru Café Lal Chowk",
    "Kahwa Courtyard",
    "Downtown Tandoor Point",
    "Gulmarg Snowbite",
    "Pahalgam River Café",
    "Harissa Junction",
    "Trout Grill Ganderbal",
    "Saffron Eatery Pampore",
    "Kashmir Street Bowls"
  ],
  SCHOOLS: [
    "Govt Boys High School",
    "Govt Girls School Habba Kadal",
    "Delhi Public School Srinagar",
    "Model School Baramulla",
    "Army Goodwill School",
    "Govt Middle School Pampore",
    "Crescent Public School",
    "Iqbal Memorial School",
    "North Valley School",
    "Himalayan Public School"
  ],
  COLLEGES: [
    "University of Kashmir",
    "NIT Srinagar",
    "Government Medical College Srinagar",
    "Islamia College of Science",
    "Women's College MA Road",
    "Government Degree College Anantnag",
    "SSM College of Engineering",
    "SKUAST Kashmir",
    "Government Degree College Baramulla",
    "Kashmir College of Nursing"
  ],
  GOVERNMENT_OFFICES: [
    "DC Office Srinagar",
    "Tehsil Office Baramulla",
    "SP Office Anantnag",
    "Municipal Office Sopore",
    "Tourism Office Gulmarg",
    "Agriculture Dept Pampore",
    "PHE Office Ganderbal",
    "Power Development Kupwara",
    "Revenue Office Pulwama",
    "Tehsil Office Pahalgam"
  ],
  EMERGENCY_CENTERS: [
    "Fire Station Lal Chowk",
    "Fire & Emergency Baramulla",
    "Ambulance Depot Anantnag",
    "SDRF Unit Ganderbal",
    "Police Control Room Srinagar",
    "Emergency Hub Pulwama",
    "Ambulance Point Pahalgam",
    "Fire Station Sopore",
    "SDRF Base Sonmarg",
    "Rapid Response Kupwara"
  ]
};

export const LAYER_LABELS: Record<LayerId, string> = {
  TOURIST_ATTRACTIONS: "Tourist Attractions",
  HOSPITALS: "Hospitals",
  MOSQUES: "Mosques",
  HOTELS: "Hotels",
  RESTAURANTS: "Restaurants",
  SCHOOLS: "Schools",
  COLLEGES: "Colleges",
  GOVERNMENT_OFFICES: "Government Offices",
  EMERGENCY_CENTERS: "Emergency Centers",
  TREKKING_ROUTES: "Trekking Routes"
};

export const DEFAULT_LAYER_STATE: LayerState = {
  TOURIST_ATTRACTIONS: true,
  HOSPITALS: false,
  MOSQUES: false,
  HOTELS: true,
  RESTAURANTS: true,
  SCHOOLS: false,
  COLLEGES: false,
  GOVERNMENT_OFFICES: false,
  EMERGENCY_CENTERS: true,
  TREKKING_ROUTES: true
};

function jitter([lng, lat]: Coord, index: number): Coord {
  const delta = (index % 5) * 0.03;
  return [lng + (index % 2 === 0 ? delta : -delta), lat + (index % 3 === 0 ? delta / 2 : -delta / 2)];
}

function makePoint(category: PlaceCategory): MapPointFeature[] {
  return CATEGORY_NAMES[category].map((name, index) => {
    const [lng, lat] = jitter(BASE_COORDS[index % BASE_COORDS.length], index);
    return {
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: {
        id: `${category}-${index}`,
        name,
        category,
        rating: Number((3.7 + (index % 5) * 0.25).toFixed(1)),
        phone: `+91 7006${(11000 + index * 73).toString().slice(0, 5)}`,
        address: `${name}, Kashmir`,
        hours: "8:00 AM - 10:00 PM",
        emergency: category === "EMERGENCY_CENTERS" || category === "HOSPITALS",
        beds: category === "HOSPITALS" ? 50 + index * 12 : undefined,
        priceRange: category === "HOTELS" || category === "RESTAURANTS" ? (["budget", "mid", "premium", "luxury"][index % 4] as "budget" | "mid" | "premium" | "luxury") : undefined,
        stars: category === "HOTELS" ? (([3, 4, 5][index % 3] as 3 | 4 | 5)) : undefined,
        medium: category === "SCHOOLS" ? (["Urdu", "English", "Kashmiri", "Mixed"][index % 4] as "Urdu" | "English" | "Kashmiri" | "Mixed") : undefined,
        photos: PHOTO_SEED
      }
    };
  });
}

function makeTrail(index: number): MapLineFeature {
  const [lng, lat] = BASE_COORDS[index % BASE_COORDS.length];
  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: [
        [lng, lat],
        [lng + 0.11, lat + 0.09],
        [lng + 0.16, lat + 0.14]
      ]
    },
    properties: {
      id: `trail-${index}`,
      name: [
        "Tarsar-Marsar Trail",
        "Gulmarg to Alpather",
        "Aru to Lidderwat",
        "Sonmarg Glacier Route",
        "Great Lakes Segment",
        "Yusmarg Pine Walk",
        "Kolahoi Glacier Trail",
        "Naranag to Gangabal",
        "Astanmarg Ridge",
        "Doodhpathri Loop"
      ][index],
      difficulty: (["easy", "moderate", "hard"][index % 3] as "easy" | "moderate" | "hard"),
      category: "TREKKING_ROUTES"
    }
  };
}

export const LAYER_POINT_DATA: Record<PlaceCategory, GeoJSON.FeatureCollection<GeoJSON.Point, MapPointFeature["properties"]>> = {
  TOURIST_ATTRACTIONS: { type: "FeatureCollection", features: makePoint("TOURIST_ATTRACTIONS") },
  HOSPITALS: { type: "FeatureCollection", features: makePoint("HOSPITALS") },
  MOSQUES: { type: "FeatureCollection", features: makePoint("MOSQUES") },
  HOTELS: { type: "FeatureCollection", features: makePoint("HOTELS") },
  RESTAURANTS: { type: "FeatureCollection", features: makePoint("RESTAURANTS") },
  SCHOOLS: { type: "FeatureCollection", features: makePoint("SCHOOLS") },
  COLLEGES: { type: "FeatureCollection", features: makePoint("COLLEGES") },
  GOVERNMENT_OFFICES: { type: "FeatureCollection", features: makePoint("GOVERNMENT_OFFICES") },
  EMERGENCY_CENTERS: { type: "FeatureCollection", features: makePoint("EMERGENCY_CENTERS") }
};

export const TREKKING_DATA: GeoJSON.FeatureCollection<GeoJSON.LineString, MapLineFeature["properties"]> = {
  type: "FeatureCollection",
  features: Array.from({ length: 10 }, (_, index) => makeTrail(index))
};

export const FALLBACK_HEATMAP_DATA: {
  touristDensity: HeatPoint[];
  emergencyIncidents: HeatPoint[];
  businessActivity: HeatPoint[];
} = {
  touristDensity: BASE_COORDS.map(([lng, lat], idx) => ({ lng, lat, weight: 2 + (idx % 4) * 2 })),
  emergencyIncidents: BASE_COORDS.map(([lng, lat], idx) => ({ lng: lng - 0.05, lat: lat + 0.02, weight: 1 + (idx % 3) * 1.5 })),
  businessActivity: BASE_COORDS.map(([lng, lat], idx) => ({ lng: lng + 0.04, lat: lat - 0.03, weight: 2 + (idx % 5) }))
};

export const KASHMIR_CENTER: [number, number] = [74.7973, 34.0837];
