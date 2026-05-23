export const SECTOR_TEMPLATES = {
  handicrafts: {
    business_name: "My Kashmir Crafts",
    tagline: "Handmade with heritage",
    description: "Authentic Kashmiri handicrafts — carpets, shawls, and woodwork crafted locally.",
    sector: "handicrafts",
    district: "Srinagar",
    products: [
      { name: "Pashmina Shawl", description: "Handwoven soft shawl", price: 4500, price_unit: "piece", category: "Shawls" },
      { name: "Paper Mache Box", description: "Hand-painted decorative box", price: 1200, price_unit: "piece", category: "Decor" },
    ],
  },
  tourism: {
    business_name: "Kashmir Tours & Stays",
    tagline: "Experience Dal Lake & valleys",
    description: "Houseboats, guided tours, and authentic homestays across Kashmir.",
    sector: "tourism",
    district: "Srinagar",
    products: [
      { name: "Shikara Ride (1 hour)", description: "Dal Lake experience", price: 800, price_unit: "trip", category: "Tours" },
      { name: "Homestay (per night)", description: "Family-run guest room", price: 2500, price_unit: "night", category: "Stay" },
    ],
  },
  agriculture: {
    business_name: "Kashmir Farm Fresh",
    tagline: "From our fields to you",
    description: "Saffron, walnuts, honey and seasonal produce from Kashmir valleys.",
    sector: "agriculture",
    district: "Pampore",
    products: [
      { name: "Kashmiri Saffron (1g)", description: "Premium grade saffron", price: 350, price_unit: "gram", category: "Saffron" },
      { name: "Walnuts (500g)", description: "Shell-free walnuts", price: 450, price_unit: "pack", category: "Dry fruits" },
    ],
  },
  food: {
    business_name: "Kashmir Kitchen",
    tagline: "Traditional flavours",
    description: "Local food products, spices, and homemade delicacies.",
    sector: "food",
    district: "Srinagar",
    products: [
      { name: "Kahwa Mix", description: "Traditional green tea blend", price: 299, price_unit: "pack", category: "Beverages" },
    ],
  },
};

export const SHARE_TEMPLATES = [
  { id: "intro", label: "Introduce business", en: "Check out my storefront on KashmirConnect:", ur: "میرا KashmirConnect اسٹور دیکھیں:" },
  { id: "eid", label: "Eid collection", en: "Our special Eid collection is live on KashmirConnect!", ur: "ہماری عید کی خاص کلیکشن KashmirConnect پر!" },
  { id: "tourist", label: "Tourist season", en: "Visiting Kashmir? See our services here:", ur: "کشمیر آ رہے ہیں؟ ہماری سروسز یہاں دیکھیں:" },
];
