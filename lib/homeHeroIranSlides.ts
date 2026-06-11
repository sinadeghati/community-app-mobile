/**
 * Iranian heritage hero library — each slide: matched title + image.
 */

export type IranHeroSlideSeed = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
};

const IMG = {
  persepolis:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Pers%C3%A9polis%2C_Ir%C3%A1n%2C_2016-09-24%2C_DD_53.jpg/1280px-Pers%C3%A9polis%2C_Ir%C3%A1n%2C_2016-09-24%2C_DD_53.jpg",
  persepolisColumns:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Pers%C3%A9polis%2C_Ir%C3%A1n%2C_2016-09-24%2C_DD_56.jpg/1280px-Pers%C3%A9polis%2C_Ir%C3%A1n%2C_2016-09-24%2C_DD_56.jpg",
  pasargadae:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Tomb_of_Cyrus_the_Great.jpg/1280px-Tomb_of_Cyrus_the_Great.jpg",
  saadieh:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Tomb_of_Saadi%2C_Shiraz_02.jpg/1280px-Tomb_of_Saadi%2C_Shiraz_02.jpg",
  hafezieh:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Mausoleo_de_Hafez%2C_Shiraz%2C_Ir%C3%A1n%2C_2016-09-24%2C_DD_12-14_HDR.jpg/1280px-Mausoleo_de_Hafez%2C_Shiraz%2C_Ir%C3%A1n%2C_2016-09-24%2C_DD_12-14_HDR.jpg",
  eramGarden:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Eram_Garden_Shiraz.jpg/1280px-Eram_Garden_Shiraz.jpg",
  nasirMolk:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Nasir-ol-Molk_Mosque.jpg/1280px-Nasir-ol-Molk_Mosque.jpg",
  naqshEJahan:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Naghshe_Jahan_Square_Isfahan_modified.jpg/1280px-Naghshe_Jahan_Square_Isfahan_modified.jpg",
  imamMosque:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Mezquita_Shah%2C_Isfah%C3%A1n%2C_Ir%C3%A1n%2C_2016-09-20%2C_DD_71-73_HDR.jpg/1280px-Mezquita_Shah%2C_Isfah%C3%A1n%2C_Ir%C3%A1n%2C_2016-09-20%2C_DD_71-73_HDR.jpg",
  sheikhLotfollah:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Sheikh_Lotf_Allah_Mosque.jpg/1280px-Sheikh_Lotf_Allah_Mosque.jpg",
  siOSePol:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Si-o-se-Pol.jpg/1280px-Si-o-se-Pol.jpg",
  khajuBridge:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Khaju_Bridge%2C_Isfahan_04.jpg/1280px-Khaju_Bridge%2C_Isfahan_04.jpg",
  chehelSotoun:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Chehel_Sotoun_ceiling.jpg/1280px-Chehel_Sotoun_ceiling.jpg",
  jamehYazd:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Jameh_Mosque_of_Yazd.jpg/1280px-Jameh_Mosque_of_Yazd.jpg",
  golestan:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Golestan_Palace_Tehran.jpg/1280px-Golestan_Palace_Tehran.jpg",
  tehranMilad:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Tehran_Milad_Tower.jpg/1280px-Tehran_Milad_Tower.jpg",
  masuleh:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Masuleh_2018_2.jpg/1280px-Masuleh_2018_2.jpg",
  choghaZanbil:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Chogha_Zanbil.jpg/1280px-Chogha_Zanbil.jpg",
  nowruz:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Haft-Seen.jpg/1280px-Haft-Seen.jpg",
} as const;

export const IRAN_HERO_SLIDE_SEEDS: IranHeroSlideSeed[] = [
  { id: "persepolis-apadana", title: "Persepolis", subtitle: "The ceremonial capital of the Achaemenid Empire.", image: IMG.persepolis },
  { id: "persepolis-columns", title: "Persepolis", subtitle: "Ancient stone columns beneath the Iranian sky.", image: IMG.persepolisColumns },
  { id: "pasargadae-cyrus", title: "Pasargadae", subtitle: "Tomb of Cyrus the Great — cradle of Persian kingship.", image: IMG.pasargadae },
  { id: "naqsh-e-jahan", title: "Naqsh-e Jahan", subtitle: "Isfahan — one of the world's grandest public squares.", image: IMG.naqshEJahan },
  { id: "sheikh-lotfollah", title: "Sheikh Lotfollah Mosque", subtitle: "Isfahan — intimate dome of light and geometry.", image: IMG.sheikhLotfollah },
  { id: "imam-mosque", title: "Imam Mosque", subtitle: "Isfahan — turquoise domes and Safavid masterwork.", image: IMG.imamMosque },
  { id: "nasir-ol-molk", title: "Nasir al-Mulk Mosque", subtitle: "Shiraz — stained glass and the Pink Mosque.", image: IMG.nasirMolk },
  { id: "hafezieh", title: "Hafezieh", subtitle: "Shiraz — garden of poetry and the spirit of Hafez.", image: IMG.hafezieh },
  { id: "saadieh", title: "Saadieh", subtitle: "Shiraz — resting place of Saadi, voice of Persian wisdom.", image: IMG.saadieh },
  { id: "eram-garden", title: "Eram Garden", subtitle: "Shiraz — Persian garden design at its most serene.", image: IMG.eramGarden },
  { id: "chehel-sotoun", title: "Chehel Sotoun", subtitle: "Isfahan — palace of forty columns and mirrored halls.", image: IMG.chehelSotoun },
  { id: "si-o-se-pol", title: "Si-o-se-pol", subtitle: "Isfahan — the Bridge of Thirty-Three Arches.", image: IMG.siOSePol },
  { id: "khaju-bridge", title: "Khaju Bridge", subtitle: "Isfahan — bridge, dam, and gathering place.", image: IMG.khajuBridge },
  { id: "jameh-yazd", title: "Jameh Mosque of Yazd", subtitle: "Yazd — towering portal and desert light.", image: IMG.jamehYazd },
  { id: "yazd-old-city", title: "Yazd Old City", subtitle: "Yazd — mud-brick lanes and living heritage.", image: IMG.jamehYazd },
  { id: "masuleh", title: "Masuleh", subtitle: "Gilan — stepped village in the green mountains.", image: IMG.masuleh },
  { id: "tehran-skyline", title: "Tehran Skyline", subtitle: "Capital horizons above the modern Persian metropolis.", image: IMG.tehranMilad },
  { id: "tehran-alborz", title: "Tehran & Alborz", subtitle: "Capital horizons beneath the snow-capped mountains.", image: IMG.tehranMilad },
  { id: "golestan-palace", title: "Golestan Palace", subtitle: "Tehran — Qajar splendor at the heart of the capital.", image: IMG.golestan },
  { id: "chogha-zanbil", title: "Chogha Zanbil", subtitle: "Khuzestan — Elamite ziggurat of the ancient world.", image: IMG.choghaZanbil },
  { id: "shiraz-gardens", title: "Shiraz", subtitle: "City of poets, gardens, and Persian grace.", image: IMG.eramGarden },
  { id: "isfahan-bridges", title: "Isfahan", subtitle: "Half the world — domes, bridges, and Safavid light.", image: IMG.siOSePol },
  { id: "spring-nowruz", title: "Nowruz Spirit", subtitle: "Spring renewal across the Persian world.", image: IMG.nowruz },
  { id: "welcome-persianmap", title: "Welcome to PersianMap", subtitle: "Persian culture, community, and connection — wherever you are.", image: IMG.persepolis },
];

/** Lookup for runtime image resolution by slide id */
export const HERO_IMAGE_BY_SLIDE_ID: Record<string, string> = Object.fromEntries(
  IRAN_HERO_SLIDE_SEEDS.map((slide) => [slide.id, slide.image])
);
