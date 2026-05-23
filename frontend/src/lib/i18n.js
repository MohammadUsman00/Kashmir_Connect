const STRINGS = {
  en: {
    dashboard: "Dashboard",
    profile: "Profile",
    storefront: "Storefront",
    products: "Products",
    leads: "Leads",
    orders: "Orders",
    reviews: "Reviews",
    advisor: "AI Advisor",
    badges: "Badges",
    analytics: "Analytics",
    settings: "Settings",
    admin: "Admin",
    logout: "Logout",
    save: "Save",
    explore: "Explore",
    inquire: "Inquire on WhatsApp",
    placeOrder: "Request order",
    leaveReview: "Leave a review",
    submit: "Submit",
    notifications: "Notifications",
    shareKit: "Share kit",
    lowStock: "Low stock",
  },
  ur: {
    dashboard: "ڈیش بورڈ",
    profile: "پروفائل",
    storefront: "اسٹورفرنٹ",
    products: "مصنوعات",
    leads: "استفسارات",
    orders: "آرڈرز",
    reviews: "جائزے",
    advisor: "AI مشیر",
    badges: "بیج",
    analytics: "اعداد و شمار",
    settings: "ترتیبات",
    admin: "ایڈمن",
    logout: "لاگ آؤٹ",
    save: "محفوظ کریں",
    explore: "دریافت کریں",
    inquire: "واٹس ایپ پر پوچھیں",
    placeOrder: "آرڈر کی درخواست",
    leaveReview: "جائزہ لکھیں",
    submit: "جمع کریں",
    notifications: "اطلاعات",
    shareKit: "شیئر کٹ",
    lowStock: "کم اسٹاک",
  },
};

export function getLang() {
  return localStorage.getItem("kc-lang") || "en";
}

export function setLang(lang) {
  localStorage.setItem("kc-lang", lang === "ur" ? "ur" : "en");
}

export function t(key) {
  const lang = getLang();
  return STRINGS[lang]?.[key] || STRINGS.en[key] || key;
}
