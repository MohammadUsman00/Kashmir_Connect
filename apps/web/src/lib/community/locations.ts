export const JK_DISTRICTS = [
  "Srinagar",
  "Baramulla",
  "Anantnag",
  "Pulwama",
  "Budgam",
  "Kupwara",
  "Bandipora",
  "Ganderbal",
  "Kulgam",
  "Shopian",
  "Jammu",
  "Udhampur",
  "Kathua",
  "Rajouri",
  "Poonch",
  "Doda",
  "Ramban",
  "Kishtwar",
  "Reasi",
  "Samba"
] as const;

export const TEHSILS_BY_DISTRICT: Record<string, string[]> = {
  Srinagar: ["North Srinagar", "South Srinagar", "Eidgah", "Khanyar"],
  Baramulla: ["Sopore", "Uri", "Pattan", "Baramulla"],
  Anantnag: ["Anantnag", "Bijbehara", "Pahalgam", "Dooru"],
  Pulwama: ["Pulwama", "Tral", "Pampore", "Awantipora"],
  Budgam: ["Budgam", "Beerwah", "Chadoora", "Khansahib"],
  Kupwara: ["Kupwara", "Handwara", "Karnah", "Tangdar"],
  Bandipora: ["Bandipora", "Sumbal", "Ajas", "Gurez"],
  Ganderbal: ["Ganderbal", "Kangan", "Lar", "Wakoora"],
  Kulgam: ["Kulgam", "Qaimoh", "Devsar", "D H Pora"],
  Shopian: ["Shopian", "Zainapora", "Keegam", "Harmain"],
  Jammu: ["Jammu", "Akhnoor", "Bishnah", "Marh"],
  Udhampur: ["Udhampur", "Ramnagar", "Chenani", "Majalta"],
  Kathua: ["Kathua", "Bani", "Hiranagar", "Billawar"],
  Rajouri: ["Rajouri", "Nowshera", "Thanamandi", "Budhal"],
  Poonch: ["Poonch", "Mendhar", "Surankote", "Mandi"],
  Doda: ["Doda", "Gandoh", "Thathri", "Bhaderwah"],
  Ramban: ["Ramban", "Banihal", "Gool", "Batote"],
  Kishtwar: ["Kishtwar", "Drabshalla", "Paddar", "Nagseni"],
  Reasi: ["Reasi", "Katra", "Pouni", "Arnas"],
  Samba: ["Samba", "Vijaypur", "Ghagwal", "Ramgarh"]
};

export const QUICK_DISTRICTS = ["Srinagar", "Baramulla", "Anantnag", "Pulwama", "Budgam", "Kupwara"] as const;
