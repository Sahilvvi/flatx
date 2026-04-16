import type { FeatureCollection, LineString } from 'geojson';

/**
 * Mumbai transit lines as approximate polylines for map overlay.
 * Sourced from publicly-available station coordinates (OpenStreetMap / public info).
 * These are visualisation-grade polylines (station-to-station straight segments),
 * not surveyed alignments.
 */

type LineProps = {
  name: string;
  mode: 'metro' | 'local' | 'monorail';
  color: string;
  label: string;
};

const line = (coords: [number, number][], props: LineProps) => ({
  type: 'Feature' as const,
  properties: props,
  geometry: { type: 'LineString' as const, coordinates: coords },
});

// --- Western Line (Churchgate → Virar) ---
const WESTERN_LINE: [number, number][] = [
  [72.8275, 18.9320], // Churchgate
  [72.8234, 18.9437], // Marine Lines
  [72.8197, 18.9509], // Charni Road
  [72.8159, 18.9603], // Grant Road
  [72.8195, 18.9712], // Mumbai Central
  [72.8214, 18.9821], // Mahalaxmi
  [72.8305, 18.9967], // Lower Parel
  [72.8349, 19.0054], // Prabhadevi
  [72.8430, 19.0186], // Dadar
  [72.8476, 19.0271], // Matunga Road
  [72.8429, 19.0416], // Mahim
  [72.8401, 19.0545], // Bandra
  [72.8370, 19.0700], // Khar
  [72.8410, 19.0810], // Santacruz
  [72.8445, 19.0998], // Vile Parle
  [72.8465, 19.1197], // Andheri
  [72.8496, 19.1350], // Jogeshwari
  [72.8530, 19.1436], // Ram Mandir
  [72.8490, 19.1649], // Goregaon
  [72.8488, 19.1876], // Malad
  [72.8536, 19.2042], // Kandivali
  [72.8568, 19.2290], // Borivali
  [72.8594, 19.2500], // Dahisar
  [72.8590, 19.2860], // Mira Road
  [72.8510, 19.3020], // Bhayandar
  [72.8480, 19.3480], // Naigaon
  [72.8357, 19.3825], // Vasai Road
  [72.8238, 19.4185], // Nallasopara
  [72.8114, 19.4559], // Virar
];

// --- Central Main Line (CSMT → Kalyan) ---
const CENTRAL_LINE: [number, number][] = [
  [72.8355, 18.9398], // CSMT
  [72.8380, 18.9486], // Masjid
  [72.8411, 18.9584], // Sandhurst Road
  [72.8330, 18.9755], // Byculla
  [72.8322, 18.9890], // Chinchpokli
  [72.8318, 18.9960], // Currey Road
  [72.8350, 19.0080], // Parel
  [72.8430, 19.0186], // Dadar
  [72.8525, 19.0272], // Matunga
  [72.8598, 19.0416], // Sion
  [72.8826, 19.0728], // Kurla
  [72.8963, 19.0799], // Vidyavihar
  [72.9081, 19.0862], // Ghatkopar
  [72.9210, 19.1090], // Vikhroli
  [72.9292, 19.1303], // Kanjurmarg
  [72.9387, 19.1476], // Bhandup
  [72.9450, 19.1595], // Nahur
  [72.9573, 19.1726], // Mulund
  [72.9759, 19.1868], // Thane
  [73.0005, 19.1970], // Kalwa
  [73.0220, 19.1970], // Mumbra
  [73.0470, 19.2020], // Diva
  [73.0800, 19.2176], // Kopar
  [73.0897, 19.2179], // Dombivli
  [73.1090, 19.2320], // Thakurli
  [73.1355, 19.2437], // Kalyan
];

// --- Harbour Line (CSMT → Panvel) ---
const HARBOUR_LINE: [number, number][] = [
  [72.8355, 18.9398], // CSMT
  [72.8380, 18.9486], // Masjid
  [72.8411, 18.9584], // Sandhurst Road
  [72.8434, 18.9678], // Dockyard Road
  [72.8461, 18.9770], // Reay Road
  [72.8493, 18.9892], // Cotton Green
  [72.8545, 19.0018], // Sewri
  [72.8628, 19.0170], // Vadala Road
  [72.8700, 19.0290], // GTB Nagar
  [72.8790, 19.0435], // Chunabhatti
  [72.8826, 19.0728], // Kurla
  [72.8903, 19.0688], // Tilak Nagar
  [72.8998, 19.0626], // Chembur
  [72.9209, 19.0545], // Govandi
  [72.9350, 19.0503], // Mankhurd
  [72.9983, 19.0754], // Vashi
  [73.0100, 19.0683], // Sanpada
  [73.0147, 19.0540], // Juinagar
  [73.0214, 19.0330], // Nerul
  [73.0236, 19.0193], // Seawoods
  [73.0378, 19.0169], // Belapur
  [73.0650, 19.0265], // Kharghar
  [73.0940, 19.0170], // Mansarovar
  [73.1020, 19.0060], // Khandeshwar
  [73.1175, 18.9894], // Panvel
];

// --- Metro Line 1: Versova – Ghatkopar (Blue) ---
const METRO_1: [number, number][] = [
  [72.8140, 19.1311], // Versova
  [72.8240, 19.1275], // D N Nagar
  [72.8360, 19.1240], // Azad Nagar
  [72.8465, 19.1197], // Andheri
  [72.8589, 19.1145], // WEH
  [72.8680, 19.1101], // Chakala
  [72.8755, 19.1090], // Airport Road
  [72.8830, 19.1080], // Marol Naka
  [72.8940, 19.1040], // Saki Naka
  [72.9000, 19.1000], // Asalpha
  [72.9050, 19.0950], // Jagruti Nagar
  [72.9081, 19.0862], // Ghatkopar
];

// --- Metro Line 2A: Dahisar (E) – D N Nagar (Yellow) ---
const METRO_2A: [number, number][] = [
  [72.8594, 19.2500], // Dahisar East
  [72.8620, 19.2330], // Ovaripada
  [72.8670, 19.2170], // Rashtriya Udyan
  [72.8680, 19.2040], // Devipada
  [72.8600, 19.1940], // Magathane
  [72.8540, 19.1876], // Kandivali Mahavir Nagar
  [72.8520, 19.1760], // Dahanukarwadi
  [72.8500, 19.1649], // Valnai
  [72.8489, 19.1540], // Malad
  [72.8492, 19.1436], // Kasturi Park
  [72.8500, 19.1350], // Bangur Nagar
  [72.8520, 19.1275], // Goregaon Metro
  [72.8450, 19.1240], // Pahadi Goregaon
  [72.8390, 19.1250], // Lower Oshiwara
  [72.8340, 19.1295], // Oshiwara
  [72.8280, 19.1280], // Shastri Nagar
  [72.8240, 19.1275], // D N Nagar
];

// --- Metro Line 7: Andheri (E) – Dahisar (E) (Red) ---
const METRO_7: [number, number][] = [
  [72.8640, 19.1150], // Andheri East
  [72.8680, 19.1260], // Shankarwadi
  [72.8700, 19.1380], // Mahanand
  [72.8720, 19.1476], // Gundavali
  [72.8720, 19.1595], // Aarey
  [72.8730, 19.1720], // Dindoshi
  [72.8720, 19.1876], // Kurar
  [72.8710, 19.2042], // Akurli
  [72.8700, 19.2180], // Poisar
  [72.8700, 19.2290], // Devipada / Borivali E
  [72.8660, 19.2400], // Magathane
  [72.8620, 19.2500], // Dahisar East
];

// --- Metro Line 3: Aarey – BKC (Aqua, partially operational 2024) ---
const METRO_3: [number, number][] = [
  [72.8780, 19.1550], // Aarey JVLR
  [72.8740, 19.1450], // SEEPZ
  [72.8680, 19.1280], // MIDC
  [72.8620, 19.1197], // Marol Naka
  [72.8540, 19.1150], // CSMIA T2
  [72.8530, 19.1070], // Sahar Road
  [72.8530, 19.1000], // CSMIA T1
  [72.8510, 19.0920], // Santacruz Metro
  [72.8490, 19.0810], // Bandra Colony
  [72.8450, 19.0720], // Vidyanagari
  [72.8540, 19.0654], // BKC
];

// --- Monorail (Chembur – Wadala – Jacob Circle) ---
const MONORAIL: [number, number][] = [
  [72.8998, 19.0626], // Chembur
  [72.8920, 19.0554], // V N Purav Marg
  [72.8860, 19.0500], // Fertilizer Township
  [72.8780, 19.0470], // Bharat Petroleum
  [72.8700, 19.0360], // Mysore Colony
  [72.8660, 19.0290], // Bhakti Park
  [72.8600, 19.0240], // Wadala
  [72.8460, 19.0060], // Dadar East
  [72.8390, 18.9970], // GTB Nagar / Acharya Atre
  [72.8320, 18.9880], // Antop Hill
  [72.8260, 18.9770], // Wadala Bridge
  [72.8260, 18.9700], // Currey Rd
  [72.8275, 18.9600], // Chinchpokli
  [72.8305, 18.9560], // Lower Parel Monorail
  [72.8315, 18.9530], // Mint Colony
  [72.8328, 18.9510], // Sant Gadge Maharaj Chowk (Jacob Circle)
];

export const MUMBAI_TRANSIT: FeatureCollection<LineString, LineProps> = {
  type: 'FeatureCollection',
  features: [
    line(WESTERN_LINE, { name: 'Western Line', mode: 'local', color: '#0EA5E9', label: 'WR' }),
    line(CENTRAL_LINE, { name: 'Central Main Line', mode: 'local', color: '#DC2626', label: 'CR' }),
    line(HARBOUR_LINE, { name: 'Harbour Line', mode: 'local', color: '#16A34A', label: 'Harbour' }),
    line(METRO_1, { name: 'Metro Line 1', mode: 'metro', color: '#1D4ED8', label: 'M1' }),
    line(METRO_2A, { name: 'Metro Line 2A', mode: 'metro', color: '#EAB308', label: 'M2A' }),
    line(METRO_7, { name: 'Metro Line 7', mode: 'metro', color: '#B91C1C', label: 'M7' }),
    line(METRO_3, { name: 'Metro Line 3', mode: 'metro', color: '#0891B2', label: 'M3' }),
    line(MONORAIL, { name: 'Mumbai Monorail', mode: 'monorail', color: '#7C3AED', label: 'Mono' }),
  ],
};

export const TRANSIT_LEGEND = [
  { label: 'Western Line', color: '#0EA5E9' },
  { label: 'Central Line', color: '#DC2626' },
  { label: 'Harbour Line', color: '#16A34A' },
  { label: 'Metro 1', color: '#1D4ED8' },
  { label: 'Metro 2A', color: '#EAB308' },
  { label: 'Metro 3', color: '#0891B2' },
  { label: 'Metro 7', color: '#B91C1C' },
  { label: 'Monorail', color: '#7C3AED' },
];
