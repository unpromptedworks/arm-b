// Cabinet of Clocks: every dial on a page is an element with
// data-clock="<id>". Each reader below turns a Date into what that clock
// shows: a main reading, a line under it, and how far through its current
// unit it is (0 to 1), drawn as the bar along the bottom of the dial.
// Nothing here talks to the network; the only stored values are the
// latitude and longitude a reader may type (on the sidereal and unequal-hours
// pages) and the hemisphere chosen on the moon page, all kept in localStorage.

(function () {
  "use strict";

  const pad = (n, w = 2) => String(n).padStart(w, "0");
  const DAY = 86400;

  // Seconds since local midnight, with fraction.
  function localSeconds(d) {
    return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000;
  }

  function ordinary(d, utc) {
    if (utc) return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} local`;
  }

  const WATCHES = [
    [0, "Middle watch"],
    [4, "Morning watch"],
    [8, "Forenoon watch"],
    [12, "Afternoon watch"],
    [16, "First dog watch"],
    [18, "Last dog watch"],
    [20, "First watch"],
  ];

  function bellCount(d) {
    const half = Math.floor((d.getHours() * 60 + d.getMinutes()) / 30);
    return half % 8 || 8;
  }

  // Strokes in pairs, any odd one last: 5 bells is "●● ●● ●".
  function strokes(n) {
    const parts = [];
    for (let i = 0; i < Math.floor(n / 2); i++) parts.push("●●");
    if (n % 2) parts.push("●");
    return parts.join(" ");
  }

  function longitude() {
    try {
      const v = parseFloat(localStorage.getItem("coc-longitude"));
      return Number.isFinite(v) && v >= -180 && v <= 180 ? v : null;
    } catch (e) {
      return null;
    }
  }

  function hms(hours) {
    const t = Math.floor(hours * 3600);
    return `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}`;
  }


  // The Moon. Elongation (Moon's longitude minus the Sun's) from the mean
  // elements in Meeus, Astronomical Algorithms (2nd ed., ch. 47), seven
  // principal periodic terms from Wikipedia's "Lunar theory", and the
  // USNO's approximate Sun (https://aa.usno.navy.mil/faq/sun_approx).
  // 0° is new moon, 180° full. Good to about twenty minutes in time.
  const SYNODIC = 29.530588861; // mean synodic month, days
  const LN0 = 2451550.26; // Meeus lunation 0: new moon of 6 Jan 2000
  const rad = Math.PI / 180;
  const sin = (x) => Math.sin(x * rad);
  const norm = (a) => ((a % 360) + 360) % 360;
  const wrap = (a) => { a = norm(a); return a > 180 ? a - 360 : a; };

  function elongation(jd) {
    const T = (jd - 2451545) / 36525;
    const n = jd - 2451545;
    const L = 218.3164477 + 481267.88123421 * T; // Moon's mean longitude
    const D = 297.8501921 + 445267.1114034 * T; // mean elongation
    const M = 357.5291092 + 35999.0502909 * T; // Sun's mean anomaly
    const Mp = 134.9633964 + 477198.8675055 * T; // Moon's mean anomaly
    const F = 93.272095 + 483202.0175233 * T; // argument of latitude
    const moon = L + 6.2886 * sin(Mp) + 0.2136 * sin(2 * Mp) + 1.2739 * sin(2 * D - Mp) +
      0.6583 * sin(2 * D) - 0.1856 * sin(M) - 0.1144 * sin(2 * F) - 0.0347 * sin(D);
    const g = 357.529 + 0.98560028 * n;
    const sun = 280.459 + 0.98564736 * n + 1.915 * sin(g) + 0.02 * sin(2 * g);
    return norm(moon - sun);
  }

  // The moment near jd when the elongation equals target, by Newton steps.
  function seek(jd, target) {
    let t = jd;
    for (let i = 0; i < 5; i++) t -= wrap(elongation(t) - target) / (360 / SYNODIC);
    return t;
  }

  function lunation(jd) {
    const e = elongation(jd);
    let last = seek(jd - e / (360 / SYNODIC), 0);
    if (last > jd) last = seek(last - SYNODIC, 0);
    let next = seek(last + SYNODIC, 0);
    if (next <= jd) { last = next; next = seek(last + SYNODIC, 0); }
    let full = seek(last + SYNODIC / 2, 180);
    if (full <= jd) full = null;
    return { e, last, next, full, no: Math.round((last - LN0) / SYNODIC) };
  }

  const PHASES = [[0, "New moon"], [90, "First quarter"], [180, "Full moon"], [270, "Last quarter"]];
  function phaseName(e) {
    for (const [at, name] of PHASES) if (Math.abs(wrap(e - at)) < 6) return name;
    if (e < 90) return "Waxing crescent";
    if (e < 180) return "Waxing gibbous";
    if (e < 270) return "Waning gibbous";
    return "Waning crescent";
  }


  // The Sun, for unequal hours. Position from the USNO's approximate
  // formulas (https://aa.usno.navy.mil/faq/sun_approx); rising and setting
  // from the sunrise equation with the Sun's centre 0.833° below the
  // horizon, for refraction and the Sun's half-width (Wikipedia, "Sunrise
  // equation"). Good to a minute or two away from the polar circles.
  const ROME = { lat: 41.9, lon: 12.5, name: "Rome" };
  const TOKYO = { lat: 35.68, lon: 139.77, name: "Tokyo" };
  const cos = (x) => Math.cos(x * rad);

  function sunAt(jd) {
    const n = jd - 2451545;
    const g = 357.529 + 0.98560028 * n;
    const q = 280.459 + 0.98564736 * n;
    const L = q + 1.915 * sin(g) + 0.02 * sin(2 * g);
    const e = 23.439 - 0.00000036 * n;
    const ra = norm(Math.atan2(cos(e) * sin(L), cos(L)) / rad);
    return { dec: Math.asin(sin(e) * sin(L)) / rad, eqt: wrap(q - ra) / 360 }; // eqt in days
  }

  // Hour angle of rising/setting in days, or +Infinity (never sets) or
  // -Infinity (never rises).
  function halfDay(jd, lat) {
    const { dec } = sunAt(jd);
    const c = (sin(-0.833) - sin(lat) * sin(dec)) / (cos(lat) * cos(dec));
    if (c < -1) return Infinity;
    if (c > 1) return -Infinity;
    return Math.acos(c) / rad / 360;
  }

  // Rising and setting around the solar noon of day number n (days from
  // J2000.0), each refined once with the Sun's place at that moment.
  function sunDay(n, place) {
    let noon = 2451545 + n - place.lon / 360;
    for (let i = 0; i < 2; i++) noon = 2451545 + n - place.lon / 360 - sunAt(noon).eqt;
    const h = halfDay(noon, place.lat);
    if (!Number.isFinite(h)) return { noon, polar: h > 0 ? "day" : "night" };
    const rise = noon - halfDay(noon - h, place.lat);
    const set = noon + halfDay(noon + h, place.lat);
    return { noon, rise: Number.isFinite(rise) ? rise : noon - h, set: Number.isFinite(set) ? set : noon + h };
  }

  function latitude() {
    try {
      const v = parseFloat(localStorage.getItem("coc-latitude"));
      return Number.isFinite(v) && v >= -90 && v <= 90 ? v : null;
    } catch (e) {
      return null;
    }
  }

  // The reader's place if both numbers are set, otherwise the clock's own
  // default (Rome, or Tokyo for the Japanese clock).
  function place(def = ROME) {
    const lat = latitude();
    const lon = longitude();
    return lat !== null && lon !== null ? { lat, lon, own: true } : { ...def, own: false };
  }

  // Which unequal hour holds jd: the last rising or setting before it, the
  // next one after it, and so whether it is day or night.
  // Risings ("day") and settings ("night") over the five days around jd,
  // in order, and whether today has none.
  function sunEvents(jd, where) {
    const n = Math.round(jd - 2451545 + where.lon / 360);
    const events = [];
    let polar = null;
    for (let k = -2; k <= 2; k++) {
      const s = sunDay(n + k, where);
      if (s.polar) { if (k === 0) polar = s.polar; continue; }
      events.push([s.rise, "day"], [s.set, "night"]);
    }
    events.sort((a, b) => a[0] - b[0]);
    return { events, polar };
  }

  // parts: 12 for the unequal hours of antiquity, 6 for the Japanese clock.
  function temporal(jd, where, parts = 12) {
    const { events, polar } = sunEvents(jd, where);
    let i = events.length - 1;
    while (i >= 0 && events[i][0] > jd) i--;
    const from = events[i];
    const to = events[i + 1];
    if (polar || !from || !to || from[1] === to[1]) return { polar: polar || "day" };
    const len = (to[0] - from[0]) / parts;
    const into = (jd - from[0]) / len;
    return { half: from[1], hour: Math.floor(into) + 1, frac: into - Math.floor(into), len, start: from[0], end: to[0] };
  }

  // Italian and Babylonian hours: equal hours counted from the last
  // sunset and the last sunrise. Null if there was none in the last day.
  function since(jd, where, kind) {
    const { events, polar } = sunEvents(jd, where);
    if (polar) return null;
    let last = null;
    for (const [t, k] of events) if (k === kind && t <= jd) last = t;
    return last !== null && jd - last < 1.05 ? (jd - last) * 24 : null;
  }

  function roman(n) {
    return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][n - 1];
  }

  // Japanese temporal hours: six of day from sunrise, six of night from
  // sunset, numbered 6 5 4 9 8 7 and named for the zodiac (Wikipedia,
  // "Japanese clock"; ja.wikipedia, "不定時法").
  const JP_NUM = [6, 5, 4, 9, 8, 7];
  const JP_SIGN = {
    day: [["Rabbit", "卯"], ["Dragon", "辰"], ["Snake", "巳"], ["Horse", "午"], ["Goat", "未"], ["Monkey", "申"]],
    night: [["Rooster", "酉"], ["Dog", "戌"], ["Pig", "亥"], ["Rat", "子"], ["Ox", "丑"], ["Tiger", "寅"]],
  };

  function hourmin(days) {
    const t = Math.round(days * 1440);
    return `${Math.floor(t / 60)}h ${pad(t % 60)}m`;
  }

  function minsec(days) {
    const t = Math.round(days * 86400);
    return `${Math.floor(t / 60)}m ${pad(t % 60)}s`;
  }

  const jdOf = (d) => d.getTime() / 86400000 + 2440587.5;

  // The Maya Long Count. Days since 13.0.0.0.0, 4 Ajaw 8 Kumk'u, taken as
  // Julian Day Number 584283 (the GMT correlation), counted by the reader's
  // local date. Names from Wikipedia, "Maya calendar".
  const GMT = 584283;
  const TZ_NAMES = ["Imix", "Ik’", "Ak’b’al", "K’an", "Chikchan", "Kimi", "Manik’", "Lamat", "Muluk", "Ok",
    "Chuwen", "Eb’", "B’en", "Ix", "Men", "K’ib’", "Kab’an", "Etz’nab’", "Kawak", "Ajaw"];
  const HAAB_NAMES = ["Pop", "Wo’", "Sip", "Sotz’", "Sek", "Xul", "Yaxk’in", "Mol", "Ch’en", "Yax",
    "Sak", "Keh", "Mak", "K’ank’in", "Muwan", "Pax", "K’ayab", "Kumk’u", "Wayeb’"];
  const PLACES = [["b’ak’tun", 144000], ["k’atun", 7200], ["tun", 360], ["winal", 20], ["k’in", 1]];
  const mod = (a, n) => ((a % n) + n) % n;

  // Days since the start of the count, for the local calendar date of d.
  function mayaDays(d) {
    const u = new Date(0);
    u.setUTCFullYear(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.round(u.getTime() / 86400000) + 2440588 - GMT;
  }

  function longCount(n) {
    const out = [];
    let left = n;
    for (const [, size] of PLACES) {
      const v = Math.floor(left / size);
      out.push(v);
      left -= v * size;
    }
    return out;
  }

  function calendarRound(n) {
    const tz = `${mod(n + 3, 13) + 1} ${TZ_NAMES[mod(n + 19, 20)]}`;
    const h = mod(n + 348, 365); // 8 Kumk'u is day 348 of the haab'
    return { tz, haab: `${h % 20} ${HAAB_NAMES[Math.floor(h / 20)]}` };
  }

  const dateOf = (jd) => new Date((jd - 2440587.5) * 86400000);

  // The French Republican calendar. Each year begins at midnight on the
  // day the true autumnal equinox falls at the Paris Observatory (the
  // decree, quoted in Wikipedia, "French Republican calendar"). The
  // equinox comes from Meeus, Astronomical Algorithms, ch. 27 (mean
  // equinox plus 24 periodic terms), with ΔT taken as 69 s, and is put in
  // Paris local apparent time: longitude 2.3371° E plus the equation of
  // time. The day itself turns at the reader's local midnight. Day names
  // from Fabre d'Églantine's rural calendar, as tabled in that article.
  const REP_MONTHS = ["Vendémiaire", "Brumaire", "Frimaire", "Nivôse", "Pluviôse", "Ventôse",
    "Germinal", "Floréal", "Prairial", "Messidor", "Thermidor", "Fructidor"];
  const REP_DAYS = ["Primidi", "Duodi", "Tridi", "Quartidi", "Quintidi", "Sextidi", "Septidi", "Octidi", "Nonidi", "Décadi"];
  const REP_FETES = [["Fête de la Vertu", "Virtue"], ["Fête du Génie", "Talent"], ["Fête du Travail", "Labour"],
    ["Fête de l’Opinion", "Convictions"], ["Fête des Récompenses", "Honours"], ["Fête de la Révolution", "the Revolution"]];
  const REP_NAMES = [
    "Raisin|Grape;Safran|Saffron;Châtaigne|Chestnut;Colchique|Autumn Crocus;Cheval|Horse;Balsamine|Impatiens;Carotte|Carrot;Amaranthe|Amaranth;Panais|Parsnip;Cuve|Vat;Pomme de terre|Potato;Immortelle|Strawflower;Potiron|Winter squash;Réséda|Mignonette;Âne|Donkey;Belle de nuit|Four o’clock flower;Citrouille|Pumpkin;Sarrasin|Buckwheat;Tournesol|Sunflower;Pressoir|Winepress;Chanvre|Hemp;Pêche|Peach;Navet|Turnip;Amaryllis|Amaryllis;Bœuf|Ox;Aubergine|Eggplant;Piment|Chili pepper;Tomate|Tomato;Orge|Barley;Tonneau|Barrel",
    "Pomme|Apple;Céleri|Celery;Poire|Pear;Betterave|Beetroot;Oie|Goose;Héliotrope|Heliotrope;Figue|Common fig;Scorsonère|Black Salsify;Alisier|Chequer Tree;Charrue|Plough;Salsifis|Salsify;Mâcre|Water caltrop;Topinambour|Jerusalem artichoke;Endive|Endive;Dindon|Turkey;Chervis|Skirret;Cresson|Watercress;Dentelaire|Leadworts;Grenade|Pomegranate;Herse|Harrow;Bacchante|Baccharis;Azerole|Azarole;Garance|Madder;Orange|Orange;Faisan|Pheasant;Pistache|Pistachio Nut;Macjonc|Tuberous pea;Coing|Quince;Cormier|Service tree;Rouleau|Roller",
    "Raiponce|Rampion;Turneps|Cattle turnip;Chicorée|Chicory;Nèfle|Medlar;Cochon|Pig;Mâche|Lamb’s lettuce;Chou-fleur|Cauliflower;Miel|Honey;Genièvre|Juniper;Pioche|Pickaxe;Cire|Wax;Raifort|Horseradish;Cèdre|Cedar tree;Sapin|Fir;Chevreuil|Roe deer;Ajonc|Gorse;Cyprès|Cypress Tree;Lierre|Ivy;Sabine|Savin Juniper;Hoyau|Fork hoe;Érable à sucre|Sugar Maple;Bruyère|Heather;Roseau|Reed plant;Oseille|Sorrel;Grillon|Cricket;Pignon|Pine nut;Liège|Cork;Truffe|Truffle;Olive|Olive;Pelle|Shovel",
    "Tourbe|Peat;Houille|Coal;Bitume|Bitumen;Soufre|Sulphur;Chien|Dog;Lave|Lava;Terre végétale|Topsoil;Fumier|Manure;Salpêtre|Saltpeter;Fléau|Flail;Granit|Granite;Argile|Clay;Ardoise|Slate;Grès|Sandstone;Lapin|Rabbit;Silex|Flint;Marne|Marl;Pierre à chaux|Limestone;Marbre|Marble;Van|Winnowing fan;Pierre à plâtre|Gypsum;Sel|Salt;Fer|Iron;Cuivre|Copper;Chat|Cat;Étain|Tin;Plomb|Lead;Zinc|Zinc;Mercure|Mercury;Crible|Sieve",
    "Lauréole|Spurge-laurel;Mousse|Moss;Fragon|Butcher’s Broom;Perce-neige|Snowdrop;Taureau|Bull;Laurier-thym|Laurustinus;Amadouvier|Tinder polypore;Mézéréon|Daphne mezereum;Peuplier|Poplar;Coignée|Axe;Ellébore|Hellebore;Brocoli|Broccoli;Laurier|Bay laurel;Avelinier|Filbert;Vache|Cow;Buis|Box Tree;Lichen|Lichen;If|Yew tree;Pulmonaire|Lungwort;Serpette|Billhook;Thlaspi|Pennycress;Thimelé|Rose Daphne;Chiendent|Couch grass;Trainasse|Common Knotgrass;Lièvre|Hare;Guède|Woad;Noisetier|Hazel;Cyclamen|Cyclamen;Chélidoine|Celandine;Traîneau|Sleigh",
    "Tussilage|Coltsfoot;Cornouiller|Dogwood;Violier|Matthiola;Troène|Privet;Bouc|Billygoat;Asaret|Wild Ginger;Alaterne|Italian Buckthorn;Violette|Violet;Marceau|Goat Willow;Bêche|Spade;Narcisse|Narcissus;Orme|Elm;Fumeterre|Common fumitory;Vélar|Hedge mustard;Chèvre|Goat;Épinard|Spinach;Doronic|Doronicum;Mouron|Pimpernel;Cerfeuil|Chervil;Cordeau|Twine;Mandragore|Mandrake;Persil|Parsley;Cochléaria|Scurvy-grass;Pâquerette|Daisy;Thon|Tuna;Pissenlit|Dandelion;Sylvie|Wood Anemone;Capillaire|Maidenhair fern;Frêne|Ash tree;Plantoir|Dibber",
    "Primevère|Primrose;Platane|Plane Tree;Asperge|Asparagus;Tulipe|Tulip;Poule|Hen;Bette|Chard;Bouleau|Birch;Jonquille|Daffodil;Aulne|Alder;Couvoir|Incubator;Pervenche|Periwinkle;Charme|Hornbeam;Morille|Morel;Hêtre|Beech Tree;Abeille|Bee;Laitue|Lettuce;Mélèze|Larch;Ciguë|Hemlock;Radis|Radish;Ruche|Beehive;Gainier|Judas tree;Romaine|Romaine lettuce;Marronnier|Horse chestnut;Roquette|Arugula or Rocket;Pigeon|Pigeon;Lilas|Lilac;Anémone|Wood Anemone;Pensée|Pansy;Myrtille|Bilberry;Greffoir|Grafting knife",
    "Rose|Rose;Chêne|Oak Tree;Fougère|Fern;Aubépine|Hawthorn;Rossignol|Nightingale;Ancolie|Common Columbine;Muguet|Lily of the valley;Champignon|Button mushroom;Hyacinthe|Hyacinth;Râteau|Rake;Rhubarbe|Rhubarb;Sainfoin|Sainfoin;Bâton d’or|Wallflower;Chamerisier|Fan Palm tree;Ver à soie|Silkworm;Consoude|Comfrey;Pimprenelle|Salad burnet;Corbeille d’or|Basket of Gold;Arroche|Orache;Sarcloir|Weeding hoe;Statice|Sea thrift;Fritillaire|Fritillary;Bourrache|Borage;Valériane|Valerian;Carpe|Carp;Fusain|Euonymus;Civette|Chives;Buglosse|Bugloss;Sénevé|White mustard;Houlette|Shepherd’s crook",
    "Luzerne|Lucerne;Hémérocalle|Daylily;Trèfle|Clover;Angélique|Garden Angelica;Canard|Duck;Mélisse|Lemon balm;Fromental|Oat grass;Martagon|Martagon lily;Serpolet|Wild Thyme;Faux|Scythe;Fraise|Strawberry;Bétoine|Betony;Pois|Pea;Acacia|Acacia;Caille|Quail;Œillet|Carnation;Sureau|Elderberry;Pavot|Poppy plant;Tilleul|Linden or Lime tree;Fourche|Pitchfork;Barbeau|Cornflower;Camomille|Camomile;Chèvrefeuille|Honeysuckle;Caille-lait|Bedstraw;Tanche|Tench;Jasmin|Jasmine;Verveine|Vervain;Thym|Thyme;Pivoine|Peony;Chariot|Handcart",
    "Seigle|Rye;Avoine|Oat;Oignon|Onion;Véronique|Speedwell;Mulet|Mule;Romarin|Rosemary;Concombre|Cucumber;Échalote|Shallot;Absinthe|Wormwood;Faucille|Sickle;Coriandre|Coriander;Artichaut|Artichoke;Girofle|Clove;Lavande|Lavender;Chamois|Chamois;Tabac|Tobacco;Groseille|Redcurrant;Gesse|Hairy Vetchling;Cerise|Cherry;Parc|Livestock pen;Menthe|Mint;Cumin|Cumin;Haricot|Bean;Orcanète|Alkanet;Pintade|Guineafowl;Sauge|Sage;Ail|Garlic;Vesce|Tare;Blé|Wheat;Chalémie|Shawm",
    "Épeautre|Spelt;Bouillon blanc|Common mullein;Melon|Melon;Ivraie|Ryegrass;Bélier|Ram;Prêle|Horsetail;Armoise|Mugwort;Carthame|Safflower;Mûre|Blackberry;Arrosoir|Watering can;Panic|Foxtail millet;Salicorne|Common Glasswort;Abricot|Apricot;Basilic|Basil;Brebis|Ewe;Guimauve|Marshmallow;Lin|Flax;Amande|Almond;Gentiane|Gentian;Écluse|Lock;Carline|Carline thistle;Câprier|Caper;Lentille|Lentil;Aunée|Inula;Loutre|Otter;Myrte|Myrtle;Colza|Rapeseed;Lupin|Lupin;Coton|Cotton;Moulin|Mill",
    "Prune|Plum;Millet|Millet;Lycoperdon|Puffball;Escourgeon|Six-row Barley;Saumon|Salmon;Tubéreuse|Tuberose;Sucrion|Winter Barley;Apocyn|Apocynum;Réglisse|Liquorice;Échelle|Ladder;Pastèque|Watermelon;Fenouil|Fennel;Épine vinette|European Barberry;Noix|Walnut;Truite|Trout;Citron|Lemon;Cardère|Teasel;Nerprun|Buckthorn;Tagette|Mexican Marigold;Hotte|Harvesting basket;Églantier|Wild Rose;Noisette|Hazelnut;Houblon|Hops;Sorgho|Sorghum;Écrevisse|Crayfish;Bigarade|Bitter orange;Verge d’or|Goldenrod;Maïs|Maize or Corn;Marron|Sweet Chestnut;Panier|Pack Basket",
  ].map((m) => m.split(";").map((p) => p.split("|")));
  const EQ_TERMS = [[485, 324.96, 1934.136], [203, 337.23, 32964.467], [199, 342.08, 20.186], [182, 27.85, 445267.112],
    [156, 73.14, 45036.886], [136, 171.52, 22518.443], [77, 222.54, 65928.934], [74, 296.72, 3034.906],
    [70, 243.58, 9037.513], [58, 119.81, 33718.147], [52, 297.17, 150.678], [50, 21.02, 2281.226],
    [45, 247.54, 29929.562], [44, 325.15, 31555.956], [29, 60.93, 4443.417], [18, 155.12, 67555.328],
    [17, 288.79, 4562.452], [16, 198.04, 62894.029], [14, 199.76, 31436.921], [12, 95.39, 14577.848],
    [12, 287.11, 31931.756], [12, 320.81, 34777.259], [9, 227.73, 1222.114], [8, 15.45, 16859.074]];

  // Julian Day (UT) of the September equinox of a Gregorian year.
  function septEquinox(year) {
    const Y = (year - 2000) / 1000;
    const j0 = 2451810.21715 + 365242.01767 * Y - 0.11575 * Y * Y + 0.00337 * Y ** 3 + 0.00078 * Y ** 4;
    const T = (j0 - 2451545) / 36525;
    const W = 35999.373 * T - 2.47;
    const dl = 1 + 0.0334 * cos(W) + 0.0007 * cos(2 * W);
    let S = 0;
    for (const [a, b, c] of EQ_TERMS) S += a * cos(b + c * T);
    return j0 + (0.00001 * S) / dl - 69 / 86400;
  }

  // Julian Day Number of 1 Vendémiaire in the Gregorian year given.
  const vendemiaire = {};
  function yearStart(year) {
    if (!(year in vendemiaire)) {
      const jd = septEquinox(year);
      vendemiaire[year] = Math.floor(jd + 2.3371 / 360 + sunAt(jd).eqt + 0.5);
    }
    return vendemiaire[year];
  }

  function roman(n) {
    const R = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let s = "";
    for (const [v, r] of R) while (n >= v) { s += r; n -= v; }
    return s;
  }

  // The Republican date of the reader's local calendar date of d, or null
  // before 1 Vendémiaire, Year I (22 September 1792).
  function republican(d) {
    const u = new Date(0);
    u.setUTCFullYear(d.getFullYear(), d.getMonth(), d.getDate());
    const jdn = Math.round(u.getTime() / 86400000) + 2440588;
    let y = d.getFullYear();
    if (jdn < yearStart(y)) y -= 1;
    const year = y - 1791;
    if (year < 1) return null;
    const doy = jdn - yearStart(y);
    const len = yearStart(y + 1) - yearStart(y);
    return { year, doy, month: Math.floor(doy / 30), day: (doy % 30) + 1, sextile: len === 366 };
  }

  const readers = {
    decimal(d) {
      const s = localSeconds(d);
      const ds = Math.floor(s / 0.864); // decimal seconds since midnight
      const h = Math.floor(ds / 10000);
      return {
        main: `${h}:${pad(Math.floor(ds / 100) % 100)}:${pad(ds % 100)}`,
        sub: `decimal hour ${h + 1} of 10`,
        frac: s / DAY,
        utc: false,
      };
    },

    ke(d) {
      const k = localSeconds(d) / 864;
      const whole = Math.floor(k);
      const left = Math.ceil((1 - (k - whole)) * 864);
      return {
        main: `${whole} kè`,
        sub: `kè ${whole + 1} of 100 ends in ${Math.floor(left / 60)}m ${pad(left % 60)}s`,
        frac: k - whole,
        utc: false,
      };
    },

    hex(d) {
      const s = localSeconds(d);
      const u = Math.floor((s / DAY) * 65536);
      const x = u.toString(16).toUpperCase().padStart(4, "0");
      return {
        main: `${x[0]}_${x.slice(1, 3)}_${x[3]}`,
        sub: `.${x} of the day`,
        frac: s / DAY,
        utc: false,
      };
    },

    bells(d) {
      const n = bellCount(d);
      const h = d.getHours();
      let watch = WATCHES[0][1];
      for (const [start, name] of WATCHES) if (h >= start) watch = name;
      const into = (d.getMinutes() % 30) * 60 + d.getSeconds() + d.getMilliseconds() / 1000;
      return {
        main: `${n} bell${n === 1 ? "" : "s"}`,
        sub: `${strokes(n)}  ·  ${watch}`,
        frac: into / 1800,
        utc: false,
      };
    },

    julian(d) {
      const jd = d.getTime() / 86400000 + 2440587.5;
      return {
        main: jd.toFixed(5),
        sub: `MJD ${(jd - 2400000.5).toFixed(5)}`,
        frac: jd - Math.floor(jd),
        utc: true,
      };
    },

    unix(d) {
      const ms = d.getTime();
      const t = Math.floor(ms / 1000);
      const left = 2147483648 - t;
      const days = Math.floor(left / DAY);
      return {
        main: String(t),
        sub: left > 0 ? `32-bit overflow in ${days.toLocaleString("en")}d ${hms((left % DAY) / 3600)}` : "past the 32-bit overflow",
        frac: (ms % 1000) / 1000,
        utc: true,
      };
    },

    sidereal(d) {
      // USNO approximate GMST: D0 is days from J2000.0 to the previous
      // 0h UT, H the hours of UT since then. https://aa.usno.navy.mil/faq/GAST
      const jd = d.getTime() / 86400000 + 2440587.5;
      const jd0 = Math.floor(jd - 0.5) + 0.5;
      const h = (jd - jd0) * 24;
      const d0 = jd0 - 2451545.0;
      const t = (jd - 2451545.0) / 36525;
      let gmst = (6.697375 + 0.065709824279 * d0 + 1.0027379 * h + 0.0000258 * t * t) % 24;
      if (gmst < 0) gmst += 24;
      const lon = longitude();
      let st = gmst;
      let label = "Greenwich mean sidereal time";
      if (lon !== null) {
        st = (((gmst + lon / 15) % 24) + 24) % 24;
        label = `local mean sidereal time at ${Math.abs(lon)}° ${lon < 0 ? "W" : "E"}`;
      }
      return { main: hms(st), sub: label, frac: st / 24, utc: true };
    },
    temporal(d) {
      const where = place();
      const t = temporal(jdOf(d), where);
      const at = where.own ? "your place" : "Rome";
      if (t.polar) {
        return {
          main: t.polar === "day" ? "Sun up" : "Sun down",
          sub: `no rising or setting today at ${at}`,
          frac: 0,
          utc: false,
        };
      }
      return {
        main: `${t.half === "day" ? "Day" : "Night"} hour ${roman(t.hour)}`,
        sub: `an hour of ${minsec(t.len)}  ·  at ${at}`,
        frac: t.frac,
        utc: false,
      };
    },

    italian(d) {
      const where = place();
      const jd = jdOf(d);
      const it = since(jd, where, "night");
      const bab = since(jd, where, "day");
      const at = where.own ? "your place" : "Rome";
      if (it === null || bab === null) {
        return { main: "No count", sub: `no rising or setting today at ${at}`, frac: 0, utc: false };
      }
      const hm = (h) => `${Math.floor(h)}:${pad(Math.floor((h * 60) % 60))}`;
      return {
        main: `${hm(it)}:${pad(Math.floor((it * 3600) % 60))}`,
        sub: `hour ${Math.floor(it) + 1} from sunset  ·  Babylonian ${hm(bab)}  ·  ${at}`,
        frac: it - Math.floor(it),
        utc: false,
      };
    },

    japanese(d) {
      const where = place(TOKYO);
      const t = temporal(jdOf(d), where, 6);
      const at = where.own ? "your place" : "Tokyo";
      if (t.polar) {
        return {
          main: t.polar === "day" ? "Sun up" : "Sun down",
          sub: `no rising or setting today at ${at}`,
          frac: 0,
          utc: false,
        };
      }
      const [sign, char] = JP_SIGN[t.half][t.hour - 1];
      const part = Math.floor(t.frac * 4) + 1;
      return {
        main: `${JP_NUM[t.hour - 1]} · ${sign}`,
        sub: `${t.half}  ·  ${char} ${part}/4  ·  ${hourmin(t.len)} each  ·  ${at}`,
        frac: t.frac,
        utc: false,
      };
    },

    // The Roman watches: the night from sunset to sunrise in four equal
    // vigiliae, each three of its twelve unequal hours.
    watches(d) {
      const where = place();
      const t = temporal(jdOf(d), where, 4);
      const at = where.own ? "your place" : "Rome";
      if (t.polar) {
        return {
          main: t.polar === "day" ? "Sun up" : "Sun down",
          sub: `no rising or setting today at ${at}`,
          frac: 0,
          utc: false,
        };
      }
      if (t.half === "day") {
        const left = Math.max(0, Math.round((t.end - jdOf(d)) * 1440));
        return {
          main: "Daylight",
          sub: `first watch in ${Math.floor(left / 60)}h ${pad(left % 60)}m  ·  at ${at}`,
          frac: (jdOf(d) - t.start) / (t.end - t.start),
          utc: false,
        };
      }
      const name = ["prima", "secunda", "tertia", "quarta"][t.hour - 1];
      return {
        main: `Vigilia ${name}`,
        sub: `watch ${["I", "II", "III", "IV"][t.hour - 1]} of IV  ·  ${hourmin(t.len)} each  ·  at ${at}`,
        frac: t.frac,
        utc: false,
      };
    },

    maya(d) {
      const n = mayaDays(d);
      const frac = localSeconds(d) / DAY;
      if (n < 0) return { main: "Before 13.0.0.0.0", sub: "the count had not begun", frac, utc: false };
      const { tz, haab } = calendarRound(n);
      return {
        main: longCount(n).join("."),
        sub: `${tz}  ·  ${haab}  ·  day ${n.toLocaleString("en")}`,
        frac,
        utc: false,
      };
    },

    republican(d) {
      const r = republican(d);
      const t = localSeconds(d) / DAY;
      if (!r) return { main: "Before Year I", sub: "the Republic dates from 22 September 1792", frac: t, utc: false };
      const an = `an ${roman(r.year)}`;
      if (r.month === 12) {
        const n = r.doy - 360;
        return {
          main: REP_FETES[n][0].replace(/^Fête d(e la |u |e l’|es )/, ""),
          sub: `${REP_FETES[n][0]}  ·  day ${n + 1} of ${r.sextile ? 6 : 5}  ·  ${an}`,
          frac: (n + t) / (r.sextile ? 6 : 5),
          utc: false,
        };
      }
      const [fr, en] = REP_NAMES[r.month][r.day - 1];
      return {
        main: `${r.day} ${REP_MONTHS[r.month]}`,
        sub: `${REP_DAYS[(r.day - 1) % 10]}  ·  ${fr}, ${en.toLowerCase()}  ·  ${an}`,
        frac: (((r.day - 1) % 10) + t) / 10,
        utc: false,
      };
    },

    moon(d) {
      const m = lunation(jdOf(d));
      const age = jdOf(d) - m.last;
      const mins = Math.floor(age * 1440);
      const lit = Math.round(((1 - Math.cos(m.e * rad)) / 2) * 100);
      return {
        main: `${Math.floor(mins / 1440)}d ${pad(Math.floor(mins / 60) % 24)}h ${pad(mins % 60)}m`,
        sub: `${phaseName(m.e)}  ·  ${lit}% lit`,
        frac: age / (m.next - m.last),
        utc: true,
      };
    },
  };

  const dials = Array.from(document.querySelectorAll("[data-clock]")).map((el) => ({
    el,
    read: readers[el.dataset.clock],
    main: el.querySelector(".dial-main"),
    sub: el.querySelector(".dial-sub"),
    bar: el.querySelector(".dial-bar span"),
    plain: el.querySelector(".dial-plain"),
  })).filter((x) => x.read);

  // The moment every dial reads: the present, or a fixed Date chosen on
  // the "one moment" page.
  let fixed = null;
  const current = () => (fixed ? new Date(fixed.getTime()) : new Date());

  function tick() {
    const now = current();
    for (const x of dials) {
      const r = x.read(now);
      if (x.main.textContent !== r.main) x.main.textContent = r.main;
      if (x.sub && x.sub.textContent !== r.sub) x.sub.textContent = r.sub;
      if (x.bar) x.bar.style.width = (r.frac * 100).toFixed(2) + "%";
      if (x.plain) x.plain.textContent = "Your clock reads " + ordinary(now, r.utc);
    }
  }

  if (dials.length) {
    tick();
    setInterval(tick, 100);
  }

  // Place boxes (longitude on the sidereal page, latitude and longitude on
  // the unequal-hours page), remembered in this browser only.
  for (const input of document.querySelectorAll("input[data-store]")) {
    const key = input.dataset.store;
    const max = Number(input.max);
    try {
      const saved = parseFloat(localStorage.getItem(key));
      if (Number.isFinite(saved)) input.value = saved;
    } catch (e) { /* blocked */ }
    input.addEventListener("input", () => {
      const v = parseFloat(input.value);
      try {
        if (input.value.trim() === "") localStorage.removeItem(key);
        else if (Number.isFinite(v) && Math.abs(v) <= max) localStorage.setItem(key, String(v));
      } catch (e) {
        /* storage blocked: the clocks keep their defaults */
      }
      tick();
      if (drawSun) drawSun();
      if (drawDay) drawDay();
    });
  }

  // Unequal-hours page: the day's sunrise and sunset, and the place used.
  const sunFacts = document.getElementById("sun-facts");
  // Add half a minute so the shown minute is rounded, not truncated.
  const clockTime = (jd) => dateOf(jd + 30 / 86400).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const japan = sunFacts && sunFacts.dataset.place === "tokyo";
  const watch = sunFacts && sunFacts.dataset.kind === "watches";
  const drawSun = sunFacts && (() => {
    const where = place(japan ? TOKYO : ROME);
    const t = temporal(jdOf(current()), where, japan ? 6 : 12);
    const deg = (v, p, m) => `${Math.abs(v)}° ${v < 0 ? m : p}`;
    const at = `${deg(where.lat, "N", "S")}, ${deg(where.lon, "E", "W")}${where.own ? "" : ` (${where.name})`}`;
    let line;
    if (t.polar) line = `The Sun ${t.polar === "day" ? "stays up" : "stays down"} all day at ${at}, so there are no ${japan ? "Japanese hours" : watch ? "watches" : "unequal hours"}`;
    else {
      const other = t.half === "day" ? "Sunset" : "Sunrise";
      line = `${t.half === "day" ? "Sunrise was" : "Sunset was"} ${clockTime(t.start)}, ${other.toLowerCase()} at ${clockTime(t.end)} by your clock  ·  ${at}`;
    }
    if (sunFacts.textContent !== line) sunFacts.textContent = line;
  });
  if (drawSun) {
    drawSun();
    setInterval(drawSun, 30000);
  }

  // Maya page: the count drawn in bar-and-dot numerals, highest place at
  // the top as on the monuments: a dot is one, a bar five, a shell zero.
  const glyphs = document.getElementById("maya-glyphs");
  if (glyphs) {
    const numeral = (v) => {
      if (v === 0) {
        return '<svg viewBox="0 0 60 40" aria-hidden="true"><ellipse class="g-shell" cx="30" cy="20" rx="24" ry="12"/>' +
          '<path class="g-line" d="M14 18 Q30 10 46 18 M14 24 Q30 30 46 24"/></svg>';
      }
      const bars = Math.floor(v / 5);
      const dots = v % 5;
      const h = (dots ? 12 : 0) + bars * 12 + 4;
      let g = "";
      let y = 4;
      if (dots) {
        const gap = 11;
        const x0 = 30 - ((dots - 1) * gap) / 2;
        for (let i = 0; i < dots; i++) g += `<circle class="g-mark" cx="${x0 + i * gap}" cy="${y + 4}" r="4"/>`;
        y += 12;
      }
      for (let i = 0; i < bars; i++) { g += `<rect class="g-mark" x="6" y="${y}" width="48" height="8" rx="2"/>`; y += 12; }
      return `<svg viewBox="0 0 60 ${h}" aria-hidden="true">${g}</svg>`;
    };
    let shown = null;
    const drawGlyphs = () => {
      const n = mayaDays(current());
      if (n === shown) return;
      shown = n;
      if (n < 0) { glyphs.innerHTML = ""; return; }
      const lc = longCount(n);
      glyphs.innerHTML = PLACES.map(([name, size], i) =>
        `<li><span class="g-num">${numeral(lc[i] % 20)}</span><span class="g-val">${lc[i]}</span>` +
        `<span class="g-name">${name}<small>${size.toLocaleString("en")} day${size === 1 ? "" : "s"}</small></span></li>`).join("");
      glyphs.setAttribute("aria-label", `${lc.join(".")}: ` + PLACES.map(([name], i) => `${lc[i]} ${name}`).join(", "));
    };
    drawGlyphs();
    setInterval(drawGlyphs, 1000);
  }

  // Republican page: the ten days of the current décade with their rural
  // names (or the complementary days), today's marked.
  const decade = document.getElementById("rep-decade");
  if (decade) {
    let shown = null;
    const drawDecade = () => {
      const r = republican(current());
      const key = r ? `${r.year}-${r.doy}` : "none";
      if (key === shown) return;
      shown = key;
      if (!r) { decade.innerHTML = ""; return; }
      let rows;
      if (r.month === 12) {
        rows = REP_FETES.slice(0, r.sextile ? 6 : 5).map(([fr, en], i) =>
          [i + 360 === r.doy, `${i + 1}`, fr, `Celebration of ${en}`]);
      } else {
        const first = Math.floor((r.day - 1) / 10) * 10;
        rows = REP_DAYS.map((name, i) => {
          const [fr, en] = REP_NAMES[r.month][first + i];
          return [first + i + 1 === r.day, `${first + i + 1} · ${name}`, fr, en];
        });
      }
      decade.innerHTML = rows.map(([now, n, fr, en]) =>
        `<li${now ? ' class="today" aria-current="date"' : ""}><span class="d-n">${n}</span><span class="d-fr" lang="fr">${fr}</span><span class="d-en">${en}</span></li>`).join("");
      decade.setAttribute("aria-label", r.month === 12 ? "The complementary days" :
        `Décade ${["I", "II", "III"][Math.floor((r.day - 1) / 10)]} of ${REP_MONTHS[r.month]}`);
    };
    drawDecade();
    setInterval(drawDecade, 1000);
  }

  // Moon page: draw the lit part of the disc and name the next phases.
  // Seen from the north the waxing moon is lit on the right; the button
  // mirrors it for the southern hemisphere, remembered in this browser.
  const moonFace = document.getElementById("moon-lit");
  if (moonFace) {
    const svg = document.getElementById("moon-face");
    const facts = document.getElementById("moon-facts");
    const flip = document.getElementById("moon-flip");
    let south = false;
    try { south = localStorage.getItem("coc-south") === "1"; } catch (e) { /* blocked */ }
    const when = (jd) => dateOf(jd).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const drawMoon = () => {
      const m = lunation(jdOf(current()));
      const r = 50;
      const rx = (r * Math.abs(Math.cos(m.e * rad))).toFixed(2);
      const waxing = m.e < 180;
      const crescent = Math.cos(m.e * rad) > 0;
      // Lit limb as a half circle, then back along the terminator.
      const limb = waxing ? 1 : 0;
      const term = waxing === crescent ? 0 : 1;
      moonFace.setAttribute("d", `M0,${-r} A${r},${r} 0 0 ${limb} 0,${r} A${rx},${r} 0 0 ${term} 0,${-r} Z`);
      svg.style.transform = south ? "scaleX(-1)" : "";
      if (flip) flip.textContent = south ? "Show it as seen from the north" : "Show it as seen from the south";
      const next = (m.full ? `Full moon ${when(m.full)}, new moon ` : "New moon ") + when(m.next);
      const line = `${next}, your time  ·  lunation ${m.no}`;
      if (facts.textContent !== line) facts.textContent = line;
    };
    drawMoon();
    setInterval(drawMoon, 60000);
    if (flip) {
      flip.addEventListener("click", () => {
        south = !south;
        try { localStorage.setItem("coc-south", south ? "1" : "0"); } catch (e) { /* blocked */ }
        drawMoon();
      });
    }
  }

  // One-moment page: stop every dial at a chosen date and time. The
  // moment is kept in the address (#2026-11-03T06:00:00Z) so it can be
  // returned to; nothing is stored or sent.
  const momentInput = document.getElementById("moment");
  if (momentInput) {
    const utcBox = document.getElementById("moment-utc");
    const said = document.getElementById("moment-said");
    const nowButton = document.getElementById("moment-now");
    const fields = (d, utc) => {
      const g = (k) => d[(utc ? "getUTC" : "get") + k]();
      return `${pad(g("FullYear"), 4)}-${pad(g("Month") + 1)}-${pad(g("Date"))}T${pad(g("Hours"))}:${pad(g("Minutes"))}:${pad(g("Seconds"))}`;
    };
    const long = { weekday: "short", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" };
    const show = () => {
      if (!fixed) {
        said.textContent = "Showing the present moment, live.";
        return;
      }
      const u = fixed.toLocaleString("en-GB", { ...long, timeZone: "UTC" });
      const l = fixed.toLocaleString("en-GB", long);
      said.textContent = u === l ? `Stopped at ${u}, UTC and your time.` : `Stopped at ${l} your time, which is ${u} UTC.`;
    };
    const setHash = (h) => {
      try { history.replaceState(null, "", h ? "#" + h : location.pathname); } catch (e) { /* ignore */ }
    };
    const fix = (d, keepInput) => {
      if (!d || Number.isNaN(d.getTime())) return;
      fixed = d;
      if (!keepInput) momentInput.value = fields(d, utcBox.checked);
      setHash(fields(d, true) + "Z");
      show();
      tick();
    };
    const fromInput = () => {
      const v = momentInput.value;
      if (!v) return;
      const full = v.length === 16 ? v + ":00" : v;
      const d = new Date(full + (utcBox.checked ? "Z" : ""));
      fix(d, true);
    };
    momentInput.addEventListener("change", fromInput);
    momentInput.addEventListener("input", fromInput);
    utcBox.addEventListener("change", () => {
      if (fixed) momentInput.value = fields(fixed, utcBox.checked);
    });
    nowButton.addEventListener("click", () => {
      fixed = null;
      momentInput.value = "";
      setHash("");
      show();
      tick();
    });
    for (const b of document.querySelectorAll("button[data-at]")) {
      b.addEventListener("click", () => fix(new Date(b.dataset.at)));
    }
    const fromHash = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z$/.test(h)) fix(new Date(h));
    };
    window.addEventListener("hashchange", fromHash);
    fromHash();
  }

  // One-day page: every Sun clock laid out across one local day, as
  // bands of SVG, for a date kept in the address (#2026-12-21).
  const daySvg = document.getElementById("day-svg");
  const drawDay = daySvg && (() => {
    const dateBox = document.getElementById("day-date");
    const said = document.getElementById("day-said");
    const facts = document.getElementById("day-facts");
    const W = 1000, X0 = 168, X1 = 968, TOP = 30, ROW = 46, GAP = 8;
    const ROWS = [
      ["Your clock", "/"],
      ["Unequal hours", "/clocks/unequal-hours/"],
      ["Japanese hours", "/clocks/japanese-hours/"],
      ["Roman watches", "/clocks/roman-watches/"],
      ["Italian hours", "/clocks/italian-hours/"],
      ["Babylonian hours", "/clocks/italian-hours/"],
    ];
    const H = TOP + ROWS.length * (ROW + GAP) + 26;
    const where = place();
    let day = /^\d{4}-\d{2}-\d{2}$/.test(dateBox.value) ? dateBox.value : null;
    const now = new Date();
    const start = day ? new Date(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (day) start.setFullYear(+day.slice(0, 4)); // years below 100
    const end = new Date(start.getTime());
    end.setDate(end.getDate() + 1);
    const j0 = jdOf(start), j1 = jdOf(end);
    const x = (jd) => X0 + ((jd - j0) / (j1 - j0)) * (X1 - X0);
    const clip = (jd) => Math.min(j1, Math.max(j0, jd));
    const rowY = (i) => TOP + i * (ROW + GAP);
    const out = [];
    const text = (tx, ty, s, cls) => out.push(`<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" class="${cls}">${s}</text>`);

    const { events, polar } = sunEvents((j0 + j1) / 2, where);
    const shadeTo = rowY(ROWS.length) - GAP;
    // The time axis along the bottom, and sunrise and sunset along the top.
    const axisY = rowY(ROWS.length) + 8;
    for (let h = 0; h <= 24; h += 3) {
      const t = new Date(start.getTime()); t.setHours(h, 0, 0, 0);
      const jd = h === 24 ? j1 : jdOf(t);
      if (jd < j0 || jd > j1) continue;
      out.push(`<line class="d-tick" x1="${x(jd).toFixed(1)}" x2="${x(jd).toFixed(1)}" y1="${TOP - 4}" y2="${axisY}"/>`);
      text(x(jd), axisY + 14, `${pad(h % 24 === 0 && h ? 24 : h)}:00`, "d-axis");
    }

    // Row labels.
    ROWS.forEach(([name, href], i) => {
      out.push(`<a href="${href}"><text x="${X0 - 12}" y="${(rowY(i) + ROW / 2 + 5).toFixed(1)}" class="d-row">${name}</text></a>`);
    });

    // A band of segments: [from, to, label] in Julian days.
    const band = (i, segs) => {
      const y = rowY(i);
      segs.forEach(([a, b, label, kind], k) => {
        if (b <= j0 || a >= j1) return;
        const xa = x(clip(a)), xb = x(clip(b));
        out.push(`<rect class="d-seg ${kind || (k % 2 ? "odd" : "even")}" x="${xa.toFixed(1)}" y="${y}" width="${Math.max(0, xb - xa).toFixed(1)}" height="${ROW}"/>`);
        if (label && xb - xa > label.length * 7.2 + 4) text((xa + xb) / 2, y + ROW / 2 + 5, label, "d-lab");
        else if (label && xb - xa > label.length * 5.5 + 2) text((xa + xb) / 2, y + ROW / 2 + 4, label, "d-lab d-small");
      });
    };

    // Your clock: the hours of the day, labelled every third.
    const civil = [];
    for (let h = 0; h < 24; h++) {
      const a = new Date(start.getTime()); a.setHours(h, 0, 0, 0);
      const b = new Date(start.getTime()); b.setHours(h + 1, 0, 0, 0);
      if (a < start || a >= end) continue;
      civil.push([jdOf(a), Math.min(jdOf(b), j1), h % 3 === 0 ? pad(h) : ""]);
    }
    band(0, civil);

    const pairs = [];
    for (let i = 0; i < events.length - 1; i++) if (events[i][1] !== events[i + 1][1]) pairs.push([events[i], events[i + 1]]);
    // Each half (sunrise to sunset, sunset to sunrise) in equal parts;
    // a half named in skip is left blank, as the day is for the watches.
    const split = (parts, label, skip) => {
      const segs = [];
      for (const [[a, k], [b]] of pairs) {
        if (k === skip) { segs.push([a, b, "", "blank"]); continue; }
        const len = (b - a) / parts;
        for (let n = 0; n < parts; n++) segs.push([a + n * len, a + (n + 1) * len, label(k, n), n % 2 ? "odd" : "even"]);
      }
      return segs;
    };
    // From each sunset (or sunrise) to the next: equal hours, the last cut short.
    const count = (kind) => {
      const marks = events.filter(([, k]) => k === kind).map(([t]) => t);
      const segs = [];
      for (let m = 0; m < marks.length - 1; m++) {
        if (marks[m + 1] - marks[m] > 1.5) continue; // a polar gap
        for (let n = 0; marks[m] + n / 24 < marks[m + 1]; n++) {
          segs.push([marks[m] + n / 24, Math.min(marks[m] + (n + 1) / 24, marks[m + 1]), String(n + 1), n % 2 ? "odd" : "even"]);
        }
      }
      return segs;
    };

    if (polar) {
      for (let i = 1; i < ROWS.length; i++) text((X0 + X1) / 2, rowY(i) + ROW / 2 + 5, polar === "day" ? "The Sun stays up: no hours to count" : "The Sun stays down: no hours to count", "d-lab d-none");
    } else {
      band(1, split(12, (k, n) => roman(n + 1)));
      band(2, split(6, (k, n) => `${JP_NUM[n]} ${JP_SIGN[k][n][1]}`));
      band(3, split(4, (k, n) => (k === "night" ? ["I", "II", "III", "IV"][n] : ""), "day"));
      band(4, count("night"));
      band(5, count("day"));
    }

    if (!polar) {
      for (const [t, k] of events) {
        if (t < j0 || t >= j1) continue;
        text(x(t), TOP - 12, `${k === "day" ? "Sunrise" : "Sunset"} ${clockTime(t)}`, "d-sun");
      }
    }

    // Night, shaded over every band.
    if (polar === "night") out.push(`<rect class="d-night" x="${X0}" y="${TOP - 4}" width="${X1 - X0}" height="${shadeTo - TOP + 8}"/>`);
    else if (!polar) {
      for (let i = 0; i < events.length - 1; i++) {
        const [a, ka] = events[i], [b, kb] = events[i + 1];
        if (ka === "night" && kb === "day" && b > j0 && a < j1) {
          out.push(`<rect class="d-night" x="${x(clip(a)).toFixed(1)}" y="${TOP - 4}" width="${(x(clip(b)) - x(clip(a))).toFixed(1)}" height="${shadeTo - TOP + 8}"/>`);
        }
      }
    }

    // The present moment, if it falls on the day shown.
    const jn = jdOf(now);
    if (jn >= j0 && jn < j1) {
      out.push(`<line class="d-now" x1="${x(jn).toFixed(1)}" x2="${x(jn).toFixed(1)}" y1="${TOP - 4}" y2="${shadeTo + 4}"/>`);
    }

    daySvg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    daySvg.innerHTML = out.join("");

    const deg = (v, p, m) => `${Math.abs(v)}° ${v < 0 ? m : p}`;
    const at = `${deg(where.lat, "N", "S")}, ${deg(where.lon, "E", "W")}${where.own ? "" : ` (${where.name})`}`;
    const shown = start.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    said.textContent = `${shown}  ·  ${at}`;
    let line;
    if (polar) line = `The Sun ${polar === "day" ? "stays up" : "stays down"} all day, so none of these clocks has hours to count.`;
    else {
      const p = pairs.find(([[a, k], [b]]) => k === "day" && b > j0 && a < j1) || pairs.find(([[a, k]]) => k === "day");
      const dayLen = p[1][0] - p[0][0];
      const nightLen = 1 - dayLen;
      line = `Daylight ${hourmin(dayLen)}, night about ${hourmin(nightLen)}. ` +
        `An unequal hour of the day lasts ${minsec(dayLen / 12)}, of the night ${minsec(nightLen / 12)}; ` +
        `a Japanese hour of the day ${hourmin(dayLen / 6)}, of the night ${hourmin(nightLen / 6)}; ` +
        `a Roman watch ${hourmin(nightLen / 4)}.`;
    }
    facts.textContent = line;
    daySvg.setAttribute("aria-label", `The Sun clocks' hours on ${shown} at ${at}. ${line}`);
  });
  if (drawDay) {
    const dateBox = document.getElementById("day-date");
    const today = document.getElementById("day-today");
    const setHash = (h) => {
      try { history.replaceState(null, "", h ? "#" + h : location.pathname); } catch (e) { /* ignore */ }
    };
    const fromHash = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      if (/^\d{4}-\d{2}-\d{2}$/.test(h)) dateBox.value = h;
      drawDay();
    };
    dateBox.addEventListener("change", () => {
      setHash(/^\d{4}-\d{2}-\d{2}$/.test(dateBox.value) ? dateBox.value : "");
      drawDay();
    });
    today.addEventListener("click", () => {
      dateBox.value = "";
      setHash("");
      drawDay();
    });
    window.addEventListener("hashchange", fromHash);
    fromHash();
    setInterval(drawDay, 30000);
  }

  // Ship's bells page: strike the current count with Web Audio.
  const bellButton = document.getElementById("strike");
  if (bellButton) {
    bellButton.addEventListener("click", () => {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const n = bellCount(new Date());
      let at = ctx.currentTime + 0.05;
      for (let i = 0; i < n; i++) {
        strike(ctx, at);
        // close within a pair, a longer gap between pairs
        at += i % 2 === 0 ? 0.35 : 1.0;
      }
      setTimeout(() => ctx.close(), (at - ctx.currentTime + 3) * 1000);
    });
  }

  // A bell-like tone: a few inharmonic partials with a fast attack and a
  // long exponential decay.
  function strike(ctx, at) {
    const partials = [[1, 0.5], [2.76, 0.25], [5.4, 0.12], [8.93, 0.06]];
    const base = 523;
    for (const [ratio, gain] of partials) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.value = base * ratio;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(gain * 0.4, at + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 2.5 / ratio + 0.4);
      osc.connect(g).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 3);
    }
  }
})();
