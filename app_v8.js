// ── CONFIGURATION CLOUD (SUPABASE — API REST directe, sans SDK externe) ────────
const SUPABASE_URL = "https://wilukbpvjfdyxahasmmt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_P9MiaaGJqJ2f6zAFvHwXZA_jYHlF830";
const DB_BASE = SUPABASE_URL + "/rest/v1/";
const DB_HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": "Bearer " + SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
};
const isCloudMode = SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";

// ── HELPERS REST API (fetch direct, aucune dépendance externe) ────────────────
async function dbGet(table) {
    try {
        const r = await fetch(DB_BASE + table + "?select=*", { headers: DB_HEADERS });
        return r.ok ? await r.json() : null;
    } catch(e) { console.warn("dbGet", table, e.message); return null; }
}
async function dbInsert(table, data) {
    try {
        await fetch(DB_BASE + table, { method:"POST", headers: DB_HEADERS, body: JSON.stringify(data) });
    } catch(e) { console.warn("dbInsert", table, e.message); }
}
async function dbUpdate(table, key, val, data) {
    try {
        await fetch(DB_BASE + table + "?" + key + "=eq." + encodeURIComponent(val),
            { method:"PATCH", headers: DB_HEADERS, body: JSON.stringify(data) });
    } catch(e) { console.warn("dbUpdate", table, e.message); }
}
async function dbDelete(table, key, val) {
    try {
        await fetch(DB_BASE + table + "?" + key + "=eq." + encodeURIComponent(val),
            { method:"DELETE", headers: DB_HEADERS });
    } catch(e) { console.warn("dbDelete", table, e.message); }
}
async function dbDeleteAll(table) {
    try {
        await fetch(DB_BASE + table + "?id=gte.0", { method:"DELETE", headers: DB_HEADERS });
    } catch(e) { console.warn("dbDeleteAll", table, e.message); }
}

// ── DATA VERSION ──────────────────────────────────────────────────────────────
const DATA_VERSION = "5"; // bumped to reload employee list from Excel
if (localStorage.getItem("paprec_data_version") !== DATA_VERSION) {
    localStorage.removeItem("paprec_epi_list");
    localStorage.setItem("paprec_data_version", DATA_VERSION);
}

// ─── INVENTAIRE RÉEL PAPREC — Saisi le 2026-07-17 ───────────────────────────
// Sources : inventaire terrain + photos références EPI
const DEFAULT_EPI = [
    { name: "Veste de pluie fluo (ART033 Paprec)", sizes: [{name: "M", stock: 2}], minStock: 2, lifespan: null, notes: "Réf. ART033 Pantalon de pluie orange HV", expirationDate: "", unitPrice: 42.50 },
    { name: "Pantalon de pluie orange HV (ART033)", sizes: [{name: "L", stock: 1}, {name: "XL", stock: 1}, {name: "XXL", stock: 1}, {name: "XXXL", stock: 1}, {name: "Standard", stock: 2}], minStock: 2, lifespan: null, notes: "Réf. O4748.P00", expirationDate: "", unitPrice: 38.00 },
    { name: "Blouson fluo boutons (ART028 Paprec)", sizes: [{name: "L", stock: 2}, {name: "XL", stock: 1}], minStock: 2, lifespan: null, notes: "Réf. O4743.P01 Blouson orange HV Paprec Recyclage", expirationDate: "", unitPrice: 48.00 },
    { name: "Blouson fluo fermeture éclair", sizes: [{name: "S", stock: 1}], minStock: 2, lifespan: null, notes: "⚠️ ALERTE : stock sous seuil minimum", expirationDate: "", unitPrice: 52.00 },
    { name: "Veste froid fluo marine phospho", sizes: [{name: "L", stock: 2}, {name: "XL", stock: 3}], minStock: 2, lifespan: null, notes: "", expirationDate: "", unitPrice: 65.00 },
    { name: "Tee-shirt fluo orange phosphorescent", sizes: [{name: "L", stock: 2}, {name: "XXL", stock: 2}], minStock: 4, lifespan: null, notes: "", expirationDate: "", unitPrice: 14.50 },
    { name: "Polo orange fluo phospho (ART036 Paprec)", sizes: [{name: "L", stock: 2}], minStock: 3, lifespan: null, notes: "Réf. O4751 P01 ART036 Polo MC orange HV Paprec Recyclage — ⚠️ ALERTE", expirationDate: "", unitPrice: 22.00 },
    { name: "Polo Paprec (bleu marine)", sizes: [{name: "M", stock: 4}], minStock: 2, lifespan: null, notes: "", expirationDate: "", unitPrice: 19.50 },
    { name: "Pull Paprec bleu marine (ART022 Sweat Marine)", sizes: [{name: "M", stock: 3}, {name: "L", stock: 5}], minStock: 2, lifespan: null, notes: "Réf. ART022 Sweat Marine Paprec Recyclage (lot 12/2025)", expirationDate: "", unitPrice: 34.00 },
    { name: "Veste fermeture bleu marine", sizes: [{name: "L", stock: 4}], minStock: 2, lifespan: null, notes: "", expirationDate: "", unitPrice: 39.00 },
    { name: "Veste polaire marine (ART013 Paprec)", sizes: [{name: "XXXL", stock: 4}], minStock: 2, lifespan: null, notes: "Réf. ART013 Veste polaire marine Paprec Recyclage (lot 04/2025)", expirationDate: "", unitPrice: 41.00 },
    { name: "Casquette Paprec", sizes: [{name: "Standard", stock: 2}], minStock: 2, lifespan: null, notes: "2 unités", expirationDate: "", unitPrice: 8.50 },
    { name: "Casquette de protection (anti-choc)", sizes: [{name: "Standard", stock: 2}], minStock: 2, lifespan: 48, notes: "Casque de protection", expirationDate: "", unitPrice: 18.00 },
    { name: "Pantalon HV orange/bleu phospho (ART025)", sizes: [{name: "T36", stock: 4}, {name: "T38", stock: 5}, {name: "T40", stock: 3}, {name: "T42", stock: 1}, {name: "T44", stock: 2}], minStock: 4, lifespan: null, notes: "Réf. O4740.P87 ART025 Pant H orange HV", expirationDate: "", unitPrice: 46.00 },
    { name: "Chaussures de sécurité", sizes: [{name: "T35", stock: 1}, {name: "T37", stock: 1}, {name: "T45", stock: 1}], minStock: 4, lifespan: null, notes: "⚠️ ALERTE : stock faible", expirationDate: "", unitPrice: 58.00 },
    { name: "Gants gris/rouge (ERGOS 343002)", sizes: [{name: "Taille 10", stock: 15}], minStock: 6, lifespan: null, notes: "Réf. ERGOS 343002, lot 05/2025", expirationDate: "", unitPrice: 4.50 },
    { name: "Gants bleu/gris (Sécuritop)", sizes: [{name: "Standard", stock: 1}], minStock: 6, lifespan: null, notes: "⚠️ ALERTE CRITIQUE : stock très faible", expirationDate: "", unitPrice: 3.80 },
    { name: "Gants latex TEGERA (Modèle 612)", sizes: [{name: "Taille 10", stock: 4}], minStock: 6, lifespan: null, notes: "Réf. TEGERA 612", expirationDate: "", unitPrice: 5.20 },
    { name: "Gants SINGER latex (Standard 100)", sizes: [{name: "Standard", stock: 2}], minStock: 6, lifespan: null, notes: "Réf. Singer Oeko-Tex Standard 100", expirationDate: "", unitPrice: 4.90 },
    { name: "Gants isolants multi-marques", sizes: [{name: "Standard", stock: 12}], minStock: 6, lifespan: null, notes: "12 unités", expirationDate: "", unitPrice: 12.00 },
    { name: "Gants vinyle blanc (ERGOS 435002)", sizes: [{name: "Taille 8", stock: 700}], minStock: 100, lifespan: null, notes: "Réf. ERGOS 435002, non stériles", expirationDate: "", unitPrice: 0.25 },
    { name: "Lunettes de sécurité (Lux Optical)", sizes: [{name: "Standard", stock: 10}], minStock: 5, lifespan: null, notes: "Réf. Lux Optical", expirationDate: "", unitPrice: 6.50 },
    { name: "Combinaison jetable", sizes: [{name: "L", stock: 7}, {name: "XL", stock: 8}], minStock: 5, lifespan: null, notes: "", expirationDate: "", unitPrice: 7.20 },
    { name: "Filtre masque à cartouche (ABEK1P3)", sizes: [{name: "Standard", stock: 8}], minStock: 4, lifespan: 6, notes: "Réf. Filtre Combi ABEK1P3", expirationDate: "2026-11-30", unitPrice: 16.00 },
    { name: "Masque FFP2 (Würth CM2000V FFP3)", sizes: [{name: "Standard", stock: 0}], minStock: 10, lifespan: 36, notes: "Durée de vie 3 ans armoire", expirationDate: "", unitPrice: 2.80 },
    { name: "Casque antibruit 3M Peltor Optime II (H520A)", sizes: [{name: "Standard", stock: 1}], minStock: 2, lifespan: 60, notes: "Réf. 3M Peltor Optime II", expirationDate: "2022-08-01", unitPrice: 32.00 }
];

// ─── LISTE DU PERSONNEL PAPREC (importée depuis LISTE PERSONNEL.xlsx) ──────────
const MOCK_EMPLOYEES = [
    {
        "id": "emp_balazard_tywan",
        "name": "BALAZARD TYWAN",
        "role": "Ouvrier DALE (CDI)",
        "entryDate": "2026-07-20"
    },
    {
        "id": "emp_baudeigne_deborah",
        "name": "BAUDEIGNE DEBORAH",
        "role": "Assistante d'Exploitation (INTERIM)",
        "entryDate": "2026-07-20"
    },
    {
        "id": "emp_bellaoui_yasine",
        "name": "BELLAOUI YASINE",
        "role": "Ouvrier DALE (CDI)",
        "entryDate": "2026-07-20"
    },
    {
        "id": "emp_bernardh_marieamelie",
        "name": "BERNARDH MARIE-AMELIE",
        "role": "Assistante d'Exploitation (CDI)",
        "entryDate": "2026-07-20"
    },
    {
        "id": "emp_campedel_philippe",
        "name": "CAMPEDEL PHILIPPE",
        "role": "Chauffeur (CDI)",
        "entryDate": "2026-07-20"
    },
    {
        "id": "emp_cleret_julien",
        "name": "CLERET JULIEN",
        "role": "Rippeur (INTERIM)",
        "entryDate": "2026-07-20"
    },
    {
        "id": "emp_verge_fabrice",
        "name": "VERGE FABRICE",
        "role": "Chauffeur (INTERIM)",
        "entryDate": "2026-07-20"
    },
    {
        "id": "emp_jayat_emilie",
        "name": "JAYAT EMILIE",
        "role": "Responsable d'Exploitation (CDI)",
        "entryDate": "2026-07-20"
    },
    {
        "id": "emp_leroux_christian",
        "name": "LEROUX CHRISTIAN",
        "role": "Chauffeur (CDI)",
        "entryDate": "2026-07-20"
    },
    {
        "id": "emp_marechal_laurent",
        "name": "MARECHAL LAURENT",
        "role": "Responsable DALE (CDI)",
        "entryDate": "2026-07-20"
    },
    {
        "id": "emp_marty_didier",
        "name": "MARTY DIDIER",
        "role": "Chauffeur (INTERIM)",
        "entryDate": "2026-07-20"
    },
    {
        "id": "emp_pierre_jeanfrancois",
        "name": "PIERRE JEAN-FRANCOIS",
        "role": "Chauffeur (CDI)",
        "entryDate": "2026-07-20"
    },
    {
        "id": "emp_rauzy_remy",
        "name": "RAUZY REMY",
        "role": "Chauffeur (CDI)",
        "entryDate": "2026-07-20"
    },
    {
        "id": "emp_verge_valentin",
        "name": "VERGE VALENTIN",
        "role": "Chauffeur (INTERIM)",
        "entryDate": "2026-07-20"
    },
    {
        "id": "emp_vidal_thomas",
        "name": "VIDAL THOMAS",
        "role": "Ouvrier DALE (INTERIM)",
        "entryDate": "2026-07-20"
    }
];

const DEFAULT_INVOICES = [
    {
        id: "fac_2025_001",
        invoiceNumber: "FAC-2025-1048",
        supplier: "ERGOS Equipment",
        date: "2025-05-12",
        epiName: "Gants gris/rouge (ERGOS 343002)",
        size: "Taille 10",
        quantity: 50,
        unitPrice: 4.20,
        totalPrice: 210.00,
        notes: "Commande lot de printemps ERGOS"
    },
    {
        id: "fac_2025_002",
        invoiceNumber: "FAC-2025-1190",
        supplier: "Paprec Centrales Appros",
        date: "2025-06-20",
        epiName: "Veste de pluie fluo (ART033 Paprec)",
        size: "M",
        quantity: 10,
        unitPrice: 39.90,
        totalPrice: 399.00,
        notes: "Réf. ART033 Paprec Recyclage"
    },
    {
        id: "fac_2025_003",
        invoiceNumber: "FAC-2025-1430",
        supplier: "Würth France",
        date: "2025-09-15",
        epiName: "Chaussures de sécurité",
        size: "T42",
        quantity: 12,
        unitPrice: 54.00,
        totalPrice: 648.00,
        notes: "Chaussures haute sécurité S3"
    },
    {
        id: "fac_2026_001",
        invoiceNumber: "FAC-2026-0214",
        supplier: "ERGOS Equipment",
        date: "2026-01-14",
        epiName: "Gants gris/rouge (ERGOS 343002)",
        size: "Taille 10",
        quantity: 30,
        unitPrice: 4.50,
        totalPrice: 135.00,
        notes: "Reconduction tarif ERGOS 2026 (+7.1%)"
    },
    {
        id: "fac_2026_002",
        invoiceNumber: "FAC-2026-0388",
        supplier: "Paprec Centrales Appros",
        date: "2026-03-02",
        epiName: "Veste de pluie fluo (ART033 Paprec)",
        size: "M",
        quantity: 5,
        unitPrice: 42.50,
        totalPrice: 212.50,
        notes: "Réajustement catalogue 2026"
    },
    {
        id: "fac_2026_003",
        invoiceNumber: "FAC-2026-0512",
        supplier: "Würth France",
        date: "2026-05-10",
        epiName: "Chaussures de sécurité",
        size: "T45",
        quantity: 8,
        unitPrice: 58.00,
        totalPrice: 464.00,
        notes: "Lot sécurité 2026"
    },
    {
        id: "fac_2026_004",
        invoiceNumber: "FAC-2026-0690",
        supplier: "Lyreco Safety",
        date: "2026-06-25",
        epiName: "Pantalon HV orange/bleu phospho (ART025)",
        size: "T40",
        quantity: 15,
        unitPrice: 46.00,
        totalPrice: 690.00,
        notes: "Dotations été"
    }
];

const DEFAULT_PRICE_HISTORY = [
    { id: "ph_1", epiName: "Gants gris/rouge (ERGOS 343002)", date: "2024-11-01", unitPrice: 3.90, supplier: "ERGOS Equipment", invoiceNumber: "FAC-2024-998" },
    { id: "ph_2", epiName: "Gants gris/rouge (ERGOS 343002)", date: "2025-05-12", unitPrice: 4.20, supplier: "ERGOS Equipment", invoiceNumber: "FAC-2025-1048" },
    { id: "ph_3", epiName: "Gants gris/rouge (ERGOS 343002)", date: "2026-01-14", unitPrice: 4.50, supplier: "ERGOS Equipment", invoiceNumber: "FAC-2026-0214" },
    
    { id: "ph_4", epiName: "Veste de pluie fluo (ART033 Paprec)", date: "2024-10-15", unitPrice: 37.50, supplier: "Paprec Centrales", invoiceNumber: "FAC-2024-812" },
    { id: "ph_5", epiName: "Veste de pluie fluo (ART033 Paprec)", date: "2025-06-20", unitPrice: 39.90, supplier: "Paprec Centrales", invoiceNumber: "FAC-2025-1190" },
    { id: "ph_6", epiName: "Veste de pluie fluo (ART033 Paprec)", date: "2026-03-02", unitPrice: 42.50, supplier: "Paprec Centrales", invoiceNumber: "FAC-2026-0388" },

    { id: "ph_7", epiName: "Chaussures de sécurité", date: "2024-09-01", unitPrice: 50.00, supplier: "Würth France", invoiceNumber: "FAC-2024-711" },
    { id: "ph_8", epiName: "Chaussures de sécurité", date: "2025-09-15", unitPrice: 54.00, supplier: "Würth France", invoiceNumber: "FAC-2025-1430" },
    { id: "ph_9", epiName: "Chaussures de sécurité", date: "2026-05-10", unitPrice: 58.00, supplier: "Würth France", invoiceNumber: "FAC-2026-0512" },

    { id: "ph_10", epiName: "Pantalon HV orange/bleu phospho (ART025)", date: "2025-02-10", unitPrice: 44.00, supplier: "Lyreco Safety", invoiceNumber: "FAC-2025-014" },
    { id: "ph_11", epiName: "Pantalon HV orange/bleu phospho (ART025)", date: "2026-06-25", unitPrice: 46.00, supplier: "Lyreco Safety", invoiceNumber: "FAC-2026-0690" }
];

const DEFAULT_ATTRIBUTIONS_FINANCE = [
    { id: "attr_1", employeeId: "emp_balazard_tywan", employeeName: "BALAZARD TYWAN", epi: "Chaussures de sécurité", size: "T42", date: "2026-07-20", expirationDate: "", state: "Neuf", unitPrice: 58.00, notes: "Dotation initiale" },
    { id: "attr_2", employeeId: "emp_balazard_tywan", employeeName: "BALAZARD TYWAN", epi: "Veste de pluie fluo (ART033 Paprec)", size: "M", date: "2026-07-20", expirationDate: "", state: "Neuf", unitPrice: 42.50, notes: "Dotation initiale" },
    { id: "attr_3", employeeId: "emp_balazard_tywan", employeeName: "BALAZARD TYWAN", epi: "Gants gris/rouge (ERGOS 343002)", size: "Taille 10", date: "2026-07-20", expirationDate: "", state: "Neuf", unitPrice: 4.50, notes: "Dotation initiale" },

    { id: "attr_4", employeeId: "emp_campedel_philippe", employeeName: "CAMPEDEL PHILIPPE", epi: "Chaussures de sécurité", size: "T45", date: "2026-07-20", expirationDate: "", state: "Neuf", unitPrice: 58.00, notes: "Chauffeur" },
    { id: "attr_5", employeeId: "emp_campedel_philippe", employeeName: "CAMPEDEL PHILIPPE", epi: "Pantalon HV orange/bleu phospho (ART025)", size: "T44", date: "2026-07-20", expirationDate: "", state: "Neuf", unitPrice: 46.00, notes: "Chauffeur" },
    { id: "attr_6", employeeId: "emp_campedel_philippe", employeeName: "CAMPEDEL PHILIPPE", epi: "Casquette de protection (anti-choc)", size: "Standard", date: "2026-07-20", expirationDate: "2030-07-20", state: "Neuf", unitPrice: 18.00, notes: "Casque" },

    { id: "attr_7", employeeId: "emp_cleret_julien", employeeName: "CLERET JULIEN", epi: "Gants gris/rouge (ERGOS 343002)", size: "Taille 10", date: "2026-07-20", expirationDate: "", state: "Neuf", unitPrice: 4.50, notes: "Rippeur" },
    { id: "attr_8", employeeId: "emp_cleret_julien", employeeName: "CLERET JULIEN", epi: "Pantalon HV orange/bleu phospho (ART025)", size: "T40", date: "2026-07-20", expirationDate: "", state: "Neuf", unitPrice: 46.00, notes: "Rippeur" },

    { id: "attr_9", employeeId: "emp_verge_fabrice", employeeName: "VERGE FABRICE", epi: "Blouson fluo fermeture éclair", size: "S", date: "2026-07-20", expirationDate: "", state: "Neuf", unitPrice: 52.00, notes: "" },
    { id: "attr_10", employeeId: "emp_verge_fabrice", employeeName: "VERGE FABRICE", epi: "Chaussures de sécurité", size: "T45", date: "2026-07-20", expirationDate: "", state: "Neuf", unitPrice: 58.00, notes: "" }
];

const MOCK_ATTRIBUTIONS = DEFAULT_ATTRIBUTIONS_FINANCE;
const MOCK_HISTORY = [];

// Initialize State (with bulletproof checks for null/undefined/corrupt storage data)
let rawEpiList = null;
try {
    rawEpiList = JSON.parse(localStorage.getItem("paprec_epi_list"));
} catch(err) { rawEpiList = null; }
let epiList = (rawEpiList || DEFAULT_EPI)
    .filter(e => e !== null && e !== undefined)
    .map(e => {
        let obj = null;
        if (typeof e === "string") {
            const found = DEFAULT_EPI.find(d => d.name === e);
            obj = { name: e, stock: found ? found.stock : 10, minStock: found ? found.minStock : 2, lifespan: found ? found.lifespan : 12, notes: found ? found.notes : "" };
        } else {
            obj = { name: e.name || "Équipement sans nom", stock: typeof e.stock === 'number' ? e.stock : 10, minStock: typeof e.minStock === 'number' ? e.minStock : 2, lifespan: (e.lifespan !== undefined && e.lifespan !== null && e.lifespan !== "") ? parseInt(e.lifespan) : null, notes: e.notes || "", sizes: e.sizes };
        }
        
        // Migration to sizes array
        if (!obj.sizes || !Array.isArray(obj.sizes)) {
            // Try to extract sizes from notes (e.g., "(2)S, (4)M")
            let extractedSizes = [];
            const notes = obj.notes || "";
            const matches = [...notes.matchAll(/\((\d+)\)([A-Za-z0-9]+(?:\s+sans taille)?)/g)];
            let remainingStock = obj.stock;
            for (const match of matches) {
                const qty = parseInt(match[1]);
                const sizeName = match[2].trim();
                extractedSizes.push({ name: sizeName, stock: qty });
                remainingStock -= qty;
            }
            if (extractedSizes.length === 0 || remainingStock < 0 || remainingStock > 0) {
                // If regex failed or doesn't sum up perfectly, fallback to "Standard"
                obj.sizes = [{ name: "Standard", stock: obj.stock }];
            } else {
                obj.sizes = extractedSizes;
            }
        }
        return obj;
    });

let rawEmployees = null;
try { rawEmployees = JSON.parse(localStorage.getItem("paprec_employees")); } catch(err) {}
let employees = (rawEmployees || MOCK_EMPLOYEES).filter(e => e !== null && e !== undefined && e.id && e.name);

let rawAttributions = null;
try { rawAttributions = JSON.parse(localStorage.getItem("paprec_attributions")); } catch(err) {}
let attributions = (rawAttributions || MOCK_ATTRIBUTIONS).filter(a => a !== null && a !== undefined && a.id && a.employeeName && a.epi);

let rawHistory = null;
try { rawHistory = JSON.parse(localStorage.getItem("paprec_history")); } catch(err) {}
let history = (rawHistory || MOCK_HISTORY).filter(h => h !== null && h !== undefined && h.date && h.employeeName);

let rawInvoices = null;
try { rawInvoices = JSON.parse(localStorage.getItem("paprec_epi_invoices")); } catch(err) {}
let invoices = (rawInvoices || DEFAULT_INVOICES).filter(i => i && i.invoiceNumber);

let rawPriceHistory = null;
try { rawPriceHistory = JSON.parse(localStorage.getItem("paprec_epi_price_history")); } catch(err) {}
let priceHistory = (rawPriceHistory || DEFAULT_PRICE_HISTORY).filter(p => p && p.epiName);

// Ensure all epiList items have a unitPrice
epiList.forEach(e => {
    if (e.unitPrice === undefined || e.unitPrice === null) {
        const found = DEFAULT_EPI.find(d => d.name === e.name);
        e.unitPrice = found ? (found.unitPrice || 25.00) : 25.00;
    }
});

// Elements DOM
const tabContents = document.querySelectorAll(".tab-content");
const navItems = document.querySelectorAll(".nav-item");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");

// Modals
const modalAddEmployee = document.getElementById("modal-add-employee");
const modalIncident = document.getElementById("modal-incident");
const modalAddEpi = document.getElementById("modal-add-epi");
const modalEditStock = document.getElementById("modal-edit-stock");

// Chart instance reference
let anomalyChart = null;


// ── FINANCIAL HELPERS & COST CALCULATIONS ──────────────────────────────────────
function getEpiUnitPrice(epiName) {
    if (!epiName) return 25.00;
    const found = epiList.find(e => e.name === epiName);
    if (found && typeof found.unitPrice === 'number') return found.unitPrice;
    const def = DEFAULT_EPI.find(d => d.name === epiName);
    return def ? (def.unitPrice || 25.00) : 25.00;
}

function getEmployeeTotalCost(empId) {
    if (!empId) return 0;
    const empAttributions = attributions.filter(a => a.employeeId === empId);
    return empAttributions.reduce((sum, attr) => {
        const price = (typeof attr.unitPrice === 'number' && attr.unitPrice > 0) 
            ? attr.unitPrice 
            : getEpiUnitPrice(attr.epi);
        return sum + price;
    }, 0);
}

// FUNCTIONS

// EPI Category mapping
function getEpiCategory(epiName) {
    const name = epiName.toLowerCase();
    // Tête
    if (name.includes("casque") || name.includes("casquette")) return "tete";
    // Visage
    if (name.includes("lunette") || name.includes("masque") || name.includes("ffp") || name.includes("filtre")) return "visage";
    // Mains
    if (name.includes("gant")) return "mains";
    // Pieds
    if (name.includes("chaussure") || name.includes("botte")) return "pieds";
    // Corps (default for everything else)
    return "corps";
}

// Lifespan remaining calculator
function getLifespanRemaining(epi) {
    if (!epi.lifespan || !epi.expirationDate) {
        if (!epi.lifespan) return null;
        // If there's a lifespan but no expiration, we compute based on data creation 
        return { months: epi.lifespan, label: epi.lifespan + " mois (durée totale)", color: "#64748b" };
    }
    const now = new Date();
    const exp = new Date(epi.expirationDate);
    const diffMs = exp - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.round(diffDays / 30);
    
    if (diffDays <= 0) return { months: 0, label: "⚠️ PÉRIMÉ", color: "#dc2626" };
    if (diffDays <= 90) return { months: diffMonths, label: diffDays + " jours restants", color: "#f59e0b" };
    return { months: diffMonths, label: diffMonths + " mois restants", color: "#16a34a" };
}



// Load data: immediate render from localStorage, then sync from Supabase in background
async function loadData() {
    // 1. Render immediately from local cache — no freeze, no blank screen
    updateStats();
    renderAll();

    // 2. Sync from Cloud in background (non-blocking)
    if (isCloudMode) {
        try {
            const [cloudEpi, cloudEmp, cloudAttr, cloudHist] = await Promise.all([
                dbGet('epi_list'),
                dbGet('employees'),
                dbGet('attributions'),
                dbGet('history')
            ]);

            let changed = false;

            if (cloudEpi !== null && cloudEpi.length > 0) {
                epiList = cloudEpi.map(e => {
                    let parsedSizes = [];
                    let rawNotes = e.notes || "";
                    let cleanNotes = rawNotes;
                    
                    if (rawNotes.includes("__SIZES_JSON__")) {
                        const parts = rawNotes.split("__SIZES_JSON__");
                        cleanNotes = parts[0].trim();
                        try {
                            parsedSizes = JSON.parse(parts[1]);
                        } catch(err) {
                            parsedSizes = [{name:"Standard", stock: e.stock || 0}];
                        }
                    } else if (typeof e.sizes === 'string') {
                        try { parsedSizes = JSON.parse(e.sizes); } catch(err) { parsedSizes = [{name:"Standard", stock: e.stock || 0}]; }
                    } else if (Array.isArray(e.sizes)) {
                        parsedSizes = e.sizes;
                    } else {
                        parsedSizes = [{name:"Standard", stock: e.stock || 0}];
                    }
                    return {
                        name: e.name,
                        sizes: parsedSizes,
                        minStock: e.min_stock !== undefined ? e.min_stock : (e.minStock || 2),
                        lifespan: e.lifespan_months !== undefined ? e.lifespan_months : e.lifespan,
                        notes: cleanNotes
                    };
                });
                changed = true;
            } else if (cloudEpi !== null && cloudEpi.length === 0) {
                // First run: populate DB with default catalog (single bulk insert)
                const bulk = epiList.map(e => {
                    const tStock = e.sizes.reduce((sum, s) => sum + s.stock, 0);
                    const cloudNotes = `${e.notes || ""}  __SIZES_JSON__${JSON.stringify(e.sizes)}]`.trim();
                    return {
                        name: e.name, stock: tStock,
                        min_stock: e.minStock, lifespan_months: e.lifespan, notes: cloudNotes
                    };
                });
                await dbInsert('epi_list', bulk);
            }

            // Only overwrite local data if cloud has actual records
            // (prevents cloud empty tables from wiping local data on first sync)
            if (cloudEmp !== null && cloudEmp.length > 0) { employees = cloudEmp; changed = true; }
            else if (cloudEmp !== null && cloudEmp.length === 0 && employees.length > 0) {
                // Push local employees to empty cloud DB
                await dbInsert('employees', employees);
            }
            if (cloudAttr !== null) { attributions = cloudAttr; changed = true; }
            
            if (cloudHist !== null && cloudHist.length > 0) { 
                history = cloudHist; 
                changed = true; 
                
                // Reconstruct invoices and priceHistory from cloud history logs
                cloudHist.forEach(h => {
                    if (h.action === "Achat / Appro" && h.notes && h.notes.includes("Facture:")) {
                        // Parse notes: Facture:FAC-XXX | Qté:10 | PU:42.50 | Size:M | ...
                        const matchFac = h.notes.match(/Facture:([^\s\|]+)/);
                        const matchQte = h.notes.match(/Qté:(\d+)/);
                        const matchPU = h.notes.match(/PU:([\d\.]+)/);
                        const matchSize = h.notes.match(/Size:([^\s\|]+)/);
                        const supplierName = h.employeeName ? h.employeeName.replace("Fournisseur:", "").trim() : "Paprec Appros";

                        if (matchFac && matchPU) {
                            const facNum = matchFac[1];
                            const puVal = parseFloat(matchPU[1]);
                            const qteVal = matchQte ? parseInt(matchQte[1]) : 1;
                            const sizeVal = matchSize ? matchSize[1] : "Standard";

                            if (!invoices.some(i => i.invoiceNumber === facNum && i.epiName === h.epi)) {
                                invoices.push({
                                    id: `fac_cloud_${Math.random().toString(36).substr(2,6)}`,
                                    invoiceNumber: facNum,
                                    supplier: supplierName,
                                    date: h.date.split(" ")[0],
                                    epiName: h.epi,
                                    size: sizeVal,
                                    quantity: qteVal,
                                    unitPrice: puVal,
                                    totalPrice: qteVal * puVal,
                                    notes: h.notes
                                });
                            }

                            if (!priceHistory.some(p => p.invoiceNumber === facNum && p.epiName === h.epi)) {
                                priceHistory.push({
                                    id: `ph_cloud_${Math.random().toString(36).substr(2,6)}`,
                                    epiName: h.epi,
                                    date: h.date.split(" ")[0],
                                    unitPrice: puVal,
                                    supplier: supplierName,
                                    invoiceNumber: facNum
                                });
                            }
                        }
                    }
                });
            }


            if (changed) {
                localStorage.setItem("paprec_epi_list", JSON.stringify(epiList));
                localStorage.setItem("paprec_employees", JSON.stringify(employees));
                localStorage.setItem("paprec_attributions", JSON.stringify(attributions));
                localStorage.setItem("paprec_history", JSON.stringify(history));
                updateStats();
                renderAll();
            }
            console.log("Sync Cloud OK");
        } catch(e) {
            console.warn("Sync Cloud échoué, mode local actif :", e.message);
        }
    }
}

// Save state: always locally (instant), cloud in background (non-blocking)
function saveLocalState() {
    localStorage.setItem("paprec_epi_list", JSON.stringify(epiList));
    localStorage.setItem("paprec_employees", JSON.stringify(employees));
    localStorage.setItem("paprec_attributions", JSON.stringify(attributions));
    localStorage.setItem("paprec_history", JSON.stringify(history));
    localStorage.setItem("paprec_epi_invoices", JSON.stringify(invoices));
    localStorage.setItem("paprec_epi_price_history", JSON.stringify(priceHistory));
    updateStats();
    renderAll();
}

// Generate unique ID
function generateId(prefix = "id") {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

// Format date to local readable text
function formatDateTime(dateObj) {
    const d = new Date(dateObj);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// Add months to a date
function addMonths(dateStr, months) {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + parseInt(months));
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
}

// TAB NAVIGATION SWITCHING
function switchTab(targetTabId) {
    tabContents.forEach(tab => {
        tab.classList.remove("active");
    });
    navItems.forEach(item => {
        item.classList.remove("active");
    });

    const activeTab = document.getElementById(`tab-${targetTabId}`);
    if (activeTab) {
        activeTab.classList.add("active");
    }

    const activeBtn = document.getElementById(`btn-tab-${targetTabId}`);
    if (activeBtn) {
        activeBtn.classList.add("active");
    }

    // Header adaptation
    if (targetTabId === "dashboard") {
        pageTitle.innerText = "Tableau de bord";
        pageSubtitle.innerText = "Aperçu global et alertes d'équipements";
    } else if (targetTabId === "personnel") {
        pageTitle.innerText = "Registre du Personnel";
        pageSubtitle.innerText = "Suivi administratif des collaborateurs de l'agence";
    } else if (targetTabId === "attributions") {
        pageTitle.innerText = "Suivi des Attributions";
        pageSubtitle.innerText = "Gérer les dotations en cours et les renouvellements";
    } else if (targetTabId === "equipements") {
        pageTitle.innerText = "Catalogue des EPI";
        pageSubtitle.innerText = "Suivi global de l'utilisation et du cycle de vie de chaque équipement";
    } else if (targetTabId === "historique") {
        pageTitle.innerText = "Journal Historique";
        pageSubtitle.innerText = "Registre des déclarations d'usure, de perte et d'attributions";
    } else if (targetTabId === "finances") {
        pageTitle.innerText = "Gestion Financière & Suivi des Prix";
        pageSubtitle.innerText = "Registre des factures d'achats, coût des dotations et évolution des tarifs EPI";
    }
}

// STATS CALCULATION
function updateStats() {
    document.getElementById("stat-employees").innerText = employees.length;
    document.getElementById("stat-active-epi").innerText = attributions.length;
    
    const anomaliesCount = history.filter(h => ["Usé", "Perdu", "Abîmé"].includes(h.action)).length;
    document.getElementById("stat-lost-damaged").innerText = anomaliesCount;
}

// RENDERING BINDERS

function renderAll() {
    populateEpiSelect();
    renderEmployeesTable();
    renderAttributionsTable();
    renderHistoryTable();
    renderEquipementsTable();
    renderEmployeeSelects();
    renderAlerts();
    renderChart();
    renderFinancesTab();
}

// Populate EPI select dropdown
function populateEpiSelect() {
    const epiSelect = document.getElementById("assign-select-epi");
    if (!epiSelect) return;
    epiSelect.innerHTML = `<option value="">Sélectionner un équipement...</option>`;
    epiList.forEach(epi => {
        const totalStock = epi.sizes ? epi.sizes.reduce((sum, s) => sum + s.stock, 0) : 0;
        const option = document.createElement("option");
        option.value = epi.name;
        option.innerText = `${epi.name} [Stock: ${totalStock}]`;
        epiSelect.appendChild(option);
    });
}

// 1. Employees Table
function renderEmployeesTable() {
    const tbody = document.getElementById("employees-table-body");
    if (!tbody) return;
    const filter = document.getElementById("search-employee").value.toLowerCase();
    tbody.innerHTML = "";

    const filtered = employees.filter(emp => 
        emp.name.toLowerCase().includes(filter) || 
        emp.role.toLowerCase().includes(filter)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-secondary" style="text-align:center;">Aucun collaborateur trouvé.</td></tr>`;
        return;
    }

    filtered.forEach(emp => {
        const empAttributions = attributions.filter(a => a.employeeId === emp.id);
        const lastAttribution = empAttributions.length > 0 
            ? empAttributions.reduce((latest, current) => new Date(latest.date) > new Date(current.date) ? latest : current).date 
            : "Aucune dotation";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${emp.name}</strong></td>
            <td>${emp.role}</td>
            <td>${emp.entryDate}</td>
            <td><span class="badge badge-new">${empAttributions.length} EPI</span></td>
            <td>${lastAttribution}</td>
            <td class="text-right">
                <div class="action-buttons">
                    <button class="btn-icon print-btn" onclick="printReceiptForEmployee('${emp.id}')" title="Générer Fiche de Décharge">
                        <i class="fa-solid fa-file-signature"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteEmployee('${emp.id}')" title="Supprimer Collaborateur">
                        <i class="fa-solid fa-trash-can text-danger"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 2. Attributions Table
function renderAttributionsTable() {
    const tbody = document.getElementById("attributions-table-body");
    if (!tbody) return;
    const filter = document.getElementById("search-attribution").value.toLowerCase();
    tbody.innerHTML = "";

    const filtered = attributions.filter(attr => 
        attr.employeeName.toLowerCase().includes(filter) || 
        attr.epi.toLowerCase().includes(filter)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-secondary" style="text-align:center;">Aucune attribution active trouvée.</td></tr>`;
        return;
    }

    const today = new Date();
    filtered.forEach(attr => {
        const stateBadgeClass = attr.state === "Neuf" ? "badge-new" : "badge-used";
        
        // Expiration check
        let expClass = "";
        if (attr.expirationDate) {
            const expDate = new Date(attr.expirationDate);
            const diffTime = expDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 0) {
                expClass = "text-danger-weight";
            } else if (diffDays <= 30) {
                expClass = "text-warning-weight";
            }
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${attr.employeeName}</strong></td>
            <td>${attr.epi}</td>
            <td>${attr.date}</td>
            <td><span class="${expClass}">${attr.expirationDate || '-'}</span></td>
            <td><span class="text-secondary">${attr.size || '-'}</span></td>
            <td><span class="badge ${stateBadgeClass}">${attr.state}</span></td>
            <td class="text-right">
                <div class="action-buttons">
                    <button class="btn-icon replace-btn" onclick="openIncidentModal('${attr.id}')" title="Signaler Incident / Remplacer">
                        <i class="fa-solid fa-rotate"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteAttribution('${attr.id}')" title="Retirer de la dotation active">
                        <i class="fa-solid fa-square-minus"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 3. Equipements Table
function renderEquipementsTable() {
    const tbody = document.getElementById("equipements-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    const viewFilterSelect = document.getElementById("epi-view-filter");
    const viewFilter = viewFilterSelect ? viewFilterSelect.value : "all";
    const searchInput = document.getElementById("search-epi");
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const categorySelect = document.getElementById("epi-category-filter");
    const categoryFilter = categorySelect ? categorySelect.value : "all";

    epiList.forEach(epi => {
        if (searchTerm) {
            const matchName = epi.name.toLowerCase().includes(searchTerm);
            const matchNotes = epi.notes && epi.notes.toLowerCase().includes(searchTerm);
            const matchSizes = epi.sizes && epi.sizes.some(s => s.name.toLowerCase().includes(searchTerm));
            if (!matchName && !matchNotes && !matchSizes) return;
        }
        if (categoryFilter !== "all" && getEpiCategory(epi.name) !== categoryFilter) return;
        const activeCount = attributions.filter(a => a.epi === epi.name).length;
        const totalStock = (epi.sizes && Array.isArray(epi.sizes)) ? epi.sizes.reduce((sum, s) => sum + s.stock, 0) : (typeof epi.stock === 'number' ? epi.stock : 0);

        if (viewFilter === "available" && totalStock <= 0) return;
        if (viewFilter === "in_service" && activeCount <= 0) return;

        // Check stock warning status
        let statusBadge = `<span class="badge badge-new">OK</span>`;
        if (totalStock === 0) {
            statusBadge = `<span class="badge badge-danger">Rupture</span>`;
        } else if (totalStock <= epi.minStock) {
            statusBadge = `<span class="badge badge-alert">Réappro</span>`;
        }

        const sizesDetails = (epi.sizes || [])
            .map(s => `<span style="display:inline-block; font-size:0.83rem; color:#334155; font-weight:600; margin-right:8px;">${s.name}: ${s.stock}</span>`)
            .join(' ');

        const lifeInfo = getLifespanRemaining(epi);
        let lifespanCell = '<span style="color:#94a3b8">N/A</span>';
        if (lifeInfo) {
            lifespanCell = `<span style="color:${lifeInfo.color}; font-weight:600;">${lifeInfo.label}</span>`;
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${epi.name}</strong></td>
            <td class="text-secondary" style="font-size: 0.88rem; max-width: 280px; word-break: break-word;">
                <div style="margin-bottom:3px;">${sizesDetails || '-'}</div>
                ${epi.notes ? `<div style="color:#64748b; font-style:italic; font-size:0.82rem;">${epi.notes}</div>` : ''}
            </td>
            <td><strong>${totalStock}</strong></td>
            <td>${lifespanCell}</td>
            <td><span class="text-secondary">${activeCount} actif(s)</span></td>
            <td>${statusBadge}</td>
            <td class="text-right">
                <div class="action-buttons">
                    <button class="btn-icon replace-btn" onclick="openEditStockModal('${epi.name.replace(/'/g, "\'")}')" title="Modifier cet EPI">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteEpi('${epi.name.replace(/'/g, "\'")}')" title="Supprimer cet EPI du catalogue">
                        <i class="fa-solid fa-trash-can text-danger"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 4. History Table
function renderHistoryTable() {
    const tbody = document.getElementById("history-table-body");
    if (!tbody) return;
    const filter = document.getElementById("search-history").value.toLowerCase();
    tbody.innerHTML = "";

    const filtered = history.filter(h => 
        h.employeeName.toLowerCase().includes(filter) || 
        h.epi.toLowerCase().includes(filter) ||
        h.action.toLowerCase().includes(filter)
    );

    // Sort history by date descending
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-secondary" style="text-align:center;">Journal d'historique vide.</td></tr>`;
        return;
    }

    filtered.forEach(h => {
        let actionBadgeClass = "badge-new";
        if (h.action === "Usé") actionBadgeClass = "badge-used";
        if (["Perdu", "Abîmé"].includes(h.action)) actionBadgeClass = "badge-lost";
        if (h.action === "Remplacement") actionBadgeClass = "badge-new";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><span class="text-secondary">${h.date}</span></td>
            <td><strong>${h.employeeName}</strong></td>
            <td>${h.epi}</td>
            <td><span class="badge ${actionBadgeClass}">${h.action}</span></td>
            <td>${h.notes || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 5. Employee Select Dropdowns
function renderEmployeeSelects() {
    const select = document.getElementById("assign-select-employee");
    if (!select) return;
    select.innerHTML = `<option value="">Sélectionner un collaborateur...</option>`;
    
    const sortedEmployees = [...employees].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedEmployees.forEach(emp => {
        const option = document.createElement("option");
        option.value = emp.id;
        option.innerText = `${emp.name} (${emp.role})`;
        select.appendChild(option);
    });
}

// 6. Active Alerts on Dashboard (Stock alert + Expiration alert)
function renderAlerts() {
    const container = document.getElementById("alerts-container");
    if (!container) return;
    container.innerHTML = "";

    const alertList = [];
    const today = new Date();

    // Expiration alerts
    attributions.forEach(attr => {
        if (attr.expirationDate) {
            const expDate = new Date(attr.expirationDate);
            const diffTime = expDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                alertList.push({
                    critical: true,
                    title: `${attr.employeeName} : Équipement PÉRIMÉ`,
                    text: `${attr.epi} a expiré le ${attr.expirationDate}`
                });
            } else if (diffDays <= 30) {
                alertList.push({
                    critical: false,
                    title: `${attr.employeeName} : Renouvellement proche`,
                    text: `${attr.epi} expire dans ${diffDays} jours (${attr.expirationDate})`
                });
            }
        }
    });

    // Stock alerts
    epiList.forEach(epi => {
        const totalStock = epi.sizes ? epi.sizes.reduce((sum, s) => sum + s.stock, 0) : 0;
        if (totalStock === 0) {
            alertList.push({
                critical: true,
                title: `Rupture de Stock : ${epi.name}`,
                text: `Le stock global est à 0. Impossible d'attribuer de nouvelles dotations.`
            });
        } else if (totalStock <= epi.minStock) {
            alertList.push({
                critical: false,
                title: `Stock Bas : ${epi.name}`,
                text: `Stock actuel : ${totalStock} unités (Seuil d'alerte : ${epi.minStock})`
            });
        }
    });

    if (alertList.length === 0) {
        container.innerHTML = `
            <div class="alert-empty-state">
                <i class="fa-solid fa-circle-check"></i>
                <p>Toutes les dotations d'EPI sont à jour et le stock est suffisant.</p>
            </div>
        `;
        return;
    }

    alertList.forEach(alert => {
        const div = document.createElement("div");
        div.className = `alert-item ${alert.critical ? 'critical' : ''}`;
        div.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation ${alert.critical ? 'text-danger' : 'text-warning'}"></i>
            <div class="alert-item-body">
                <h5>${alert.title}</h5>
                <p>${alert.text}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

// 7. Chart.js rendering
function renderChart() {
    const canvas = document.getElementById("chart-anomalies");
    if (!canvas) return;

    if (typeof Chart === 'undefined') {
        console.warn("Chart.js n'est pas chargé. Le graphique est désactivé.");
        const chartCard = canvas.closest('.card-chart');
        if (chartCard) {
            const body = chartCard.querySelector('.card-body');
            if (body && !body.querySelector('.chart-fallback-msg')) {
                body.innerHTML = '<div class="chart-fallback-msg text-secondary" style="text-align:center; padding: 2rem 0;"><i class="fa-solid fa-wifi-slash" style="font-size: 2rem; margin-bottom: 0.5rem; display:block;"></i>Mode hors-ligne : Graphique désactivé.</div>';
            }
        }
        return;
    }

    const lostCount = history.filter(h => h.action === "Perdu").length;
    const wornCount = history.filter(h => h.action === "Usé").length;
    const damagedCount = history.filter(h => h.action === "Abîmé").length;

    const data = {
        labels: ['Pertes', 'Usure normale', 'Détériorations'],
        datasets: [{
            data: [lostCount, wornCount, damagedCount],
            backgroundColor: [
                '#ef4444',
                '#f59e0b',
                '#3b82f6'
            ],
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)'
        }]
    };

    if (anomalyChart) {
        anomalyChart.data = data;
        anomalyChart.update();
    } else {
        const ctx = canvas.getContext('2d');
        anomalyChart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            font: { family: 'Plus Jakarta Sans', size: 12 }
                        }
                    }
                }
            }
        });
    }
}


// Dynamic size populator for assignment
document.addEventListener("DOMContentLoaded", () => {
    const assignEpiSelect = document.getElementById("assign-select-epi");
    const assignSizeSelect = document.getElementById("assign-size");
    if (assignEpiSelect && assignSizeSelect) {
        assignEpiSelect.addEventListener("change", function() {
            const epiName = this.value;
            assignSizeSelect.innerHTML = `<option value="">Sélectionner une taille...</option>`;
            if (!epiName) return;
            const epiObj = epiList.find(e => e.name === epiName);
            if (!epiObj || !epiObj.sizes) return;
            
            epiObj.sizes.forEach(s => {
                if (s.stock > 0) {
                    const opt = document.createElement("option");
                    opt.value = s.name;
                    opt.innerText = `${s.name} (Stock: ${s.stock})`;
                    assignSizeSelect.appendChild(opt);
                }
            });
        });
    }
});

// BUSINESS LOGIC ACTIONS

// Add new Employee
document.getElementById("form-add-employee").addEventListener("submit", async function(e) {
    e.preventDefault();
    const name = document.getElementById("emp-name").value.trim();
    const role = document.getElementById("emp-role").value.trim();
    const entryDate = document.getElementById("emp-date-entry").value;

    if (!name || !role || !entryDate) return;

    const newEmp = {
        id: generateId("emp"),
        name,
        role,
        entryDate
    };

    employees.push(newEmp);
    
    const logDate = formatDateTime(new Date());
    const newLog = {
        date: logDate,
        employeeName: name,
        epi: "-",
        action: "Attribution",
        notes: `Création du collaborateur (${role})`
    };
    history.push(newLog);

    if (isCloudMode) {
        await dbInsert('employees', newEmp);
        await dbInsert('history', newLog);
    }

    saveLocalState();
    this.reset();
    modalAddEmployee.classList.remove("active");
});

// Delete Employee
window.deleteEmployee = async function(id) {
    if (confirm("Voulez-vous vraiment supprimer ce collaborateur ?")) {
        employees = employees.filter(emp => emp.id !== id);
        
        if (isCloudMode) {
            await dbDelete('employees', 'id', id);
        }

        saveLocalState();
    }
};

// Assign new EPI (decreases stock if available)
document.getElementById("form-assign-epi").addEventListener("submit", async function(e) {
    e.preventDefault();
    const employeeId = document.getElementById("assign-select-employee").value;
    const epiName = document.getElementById("assign-select-epi").value;
    const size = document.getElementById("assign-size").value;
    const state = document.getElementById("assign-state") ? document.getElementById("assign-state").value : "Neuf";
    const date = document.getElementById("assign-date").value;
    let expirationDate = "";
    const notes = document.getElementById("assign-notes").value.trim();

    if (!employeeId || !epiName || !date || !size) return;

    const employee = employees.find(emp => emp.id === employeeId);
    const epiObj = epiList.find(e => e.name === epiName);
    if (!employee || !epiObj) return;

    const sizeObj = (epiObj.sizes || []).find(s => s.name === size);
    if (!sizeObj || sizeObj.stock <= 0) {
        alert(`Stock insuffisant pour la taille "${size}" de "${epiName}".`);
        return;
    }

    if (!expirationDate) {
        if (epiObj.lifespan) {
            expirationDate = addMonths(date, epiObj.lifespan);
        } else {
            expirationDate = "";
        }
    }

    sizeObj.stock -= 1;

    const newAttr = {
        id: generateId("attr"),
        employeeId,
        employeeName: employee.name,
        epi: epiName,
        size,
        date,
        expirationDate,
        state: state,
        notes
    };

    attributions.push(newAttr);

    const logDate = formatDateTime(new Date());
    const newLog = {
        date: logDate,
        employeeName: employee.name,
        epi: epiName,
        action: "Attribution",
        notes: `Attribution (${state}) (Taille : ${size}) [Stock Restant taille: ${sizeObj.stock}]`
    };
    history.push(newLog);

    if (isCloudMode) {
                    await dbInsert('attributions', newAttr);
            const totalStock = epiObj.sizes ? epiObj.sizes.reduce((sum, s) => sum + s.stock, 0) : 0;
            const cloudNotes = `${epiObj.notes || ""}  __SIZES_JSON__${JSON.stringify(epiObj.sizes)}]`.trim();
            await dbInsert('history', newLog);
            await dbUpdate('epi_list', 'name', epiName, { stock: totalStock, notes: cloudNotes });

    }

    saveLocalState();
    this.reset();
    document.getElementById("assign-date").valueAsDate = new Date();
    alert("L'équipement a été attribué et retiré du stock physique !");
});

// Delete active attribution
window.deleteAttribution = async function(id) {
    const attr = attributions.find(a => a.id === id);
    if (!attr) return;

    if (confirm(`Voulez-vous retirer l'EPI "${attr.epi}" de la dotation active de ${attr.employeeName} ?`)) {
        attributions = attributions.filter(a => a.id !== id);
        
        const logDate = formatDateTime(new Date());
        const newLog = {
            date: logDate,
            employeeName: attr.employeeName,
            epi: attr.epi,
            action: "Restitution",
            notes: "Équipement retiré du service actif"
        };
        history.push(newLog);

        if (isCloudMode) {
                            await dbDelete('attributions', 'id', id);
                await dbInsert('history', newLog);

        }

        saveLocalState();
    }
};

// Open incident/replacement modal
window.openIncidentModal = function(id) {
    const attr = attributions.find(a => a.id === id);
    if (!attr) return;

    document.getElementById("incident-attr-id").value = attr.id;
    document.getElementById("incident-emp-name").innerText = attr.employeeName;
    document.getElementById("incident-epi-name").innerText = `${attr.epi} (Taille actuelle: ${attr.size || 'N/A'})`;
    document.getElementById("incident-reason").value = "Perdu";
    document.getElementById("incident-notes").value = "";

    const cbReplace = document.getElementById("incident-replace-now");
    const container = document.getElementById("incident-replace-size-container");
    const selectSize = document.getElementById("incident-replace-size");

    cbReplace.checked = true;
    if (container) container.style.display = "block";

    // Populate sizes dropdown with sizes currently available in stock
    const epiObj = epiList.find(e => e.name === attr.epi);
    if (selectSize) {
        selectSize.innerHTML = `<option value="">Sélectionner une taille...</option>`;
        if (epiObj && epiObj.sizes) {
            let count = 0;
            epiObj.sizes.forEach(s => {
                if (s.stock > 0) {
                    count++;
                    const opt = document.createElement("option");
                    opt.value = s.name;
                    opt.innerText = `${s.name} (Stock dispo : ${s.stock})`;
                    if (s.name === attr.size) opt.selected = true;
                    selectSize.appendChild(opt);
                }
            });
            if (count === 0) {
                selectSize.innerHTML = `<option value="">⚠️ Aucune taille en stock dispo</option>`;
            }
        } else {
            selectSize.innerHTML = `<option value="">⚠️ Aucun stock dispo</option>`;
        }
    }

    modalIncident.classList.add("active");
};

// Save Incident Report & Auto-replace (decreases stock again)
document.getElementById("form-declare-incident").addEventListener("submit", async function(e) {
    e.preventDefault();
    const attrId = document.getElementById("incident-attr-id").value;
    const reason = document.getElementById("incident-reason").value;
    const replaceNow = document.getElementById("incident-replace-now").checked;
    const notes = document.getElementById("incident-notes").value.trim();

    const attr = attributions.find(a => a.id === attrId);
    if (!attr) return;

    const epiObj = epiList.find(e => e.name === attr.epi);
    const logDate = formatDateTime(new Date());

    const incidentLog = {
        date: logDate,
        employeeName: attr.employeeName,
        epi: attr.epi,
        action: reason,
        notes: `Signalement d'anomalie ${notes ? '- ' + notes : ''}`
    };
    history.push(incidentLog);

    if (replaceNow) {
        const replaceSizeSelect = document.getElementById("incident-replace-size");
        const replaceSize = replaceSizeSelect ? replaceSizeSelect.value : null;

        if (!replaceSize) {
            alert("Veuillez sélectionner une taille de remplacement.");
            return;
        }

        if (!epiObj || !epiObj.sizes) {
            alert("Erreur: Équipement introuvable.");
            return;
        }

        const sizeObj = epiObj.sizes.find(s => s.name === replaceSize);
        if (!sizeObj || sizeObj.stock <= 0) {
            alert(`Stock insuffisant pour la taille "${replaceSize}".`);
            return;
        }

        // Decrement stock for selected size
        sizeObj.stock -= 1;

        const todayStr = new Date().toISOString().split('T')[0];
        const newExpDate = epiObj.lifespan ? addMonths(todayStr, epiObj.lifespan) : "";

        attr.date = todayStr;
        attr.expirationDate = newExpDate;
        attr.size = replaceSize;
        attr.state = "Neuf";
        attr.notes = `Remplacement suite à : ${reason} (${notes || 'sans précision'})`;

        const replaceLog = {
            date: logDate,
            employeeName: attr.employeeName,
            epi: attr.epi,
            action: "Attribution",
            notes: `Remplacement (Neuf - Taille : ${replaceSize}) [Stock Restant taille: ${sizeObj.stock}]`
        };
        history.push(replaceLog);

        if (isCloudMode) {
            await dbUpdate('attributions', 'id', attr.id, { date: todayStr, expirationDate: newExpDate, size: replaceSize, state: "Neuf", notes: attr.notes });
            await dbInsert('history', [incidentLog, replaceLog]);
            const totalStock = epiObj.sizes.reduce((sum, s) => sum + s.stock, 0);
            const cloudNotes = `${epiObj.notes || ""} __SIZES_JSON__${JSON.stringify(epiObj.sizes)}`.trim();
            await dbUpdate('epi_list', 'name', attr.epi, { stock: totalStock, notes: cloudNotes });
        }
    } else {
        // Remove attribution from active list (no longer in service)
        attributions = attributions.filter(a => a.id !== attrId);

        if (isCloudMode) {
            await dbDelete('attributions', 'id', attrId);
            await dbInsert('history', incidentLog);
        }
    }

    saveLocalState();
    modalIncident.classList.remove("active");
});

// Delete EPI from catalog
window.deleteEpi = async function(epiName) {
    const activeCount = attributions.filter(a => a.epi === epiName).length;
    let confirmMsg = `Voulez-vous vraiment supprimer "${epiName}" du catalogue ?`;
    if (activeCount > 0) {
        confirmMsg += `

⚠️ ATTENTION : cet EPI est encore attribué à ${activeCount} collaborateur(s). La suppression retirera aussi ces dotations actives.`;
    }

    if (confirm(confirmMsg)) {
        epiList = epiList.filter(e => e.name !== epiName);
        if (activeCount > 0) {
            attributions = attributions.filter(a => a.epi !== epiName);
        }

        const logDate = formatDateTime(new Date());
        const newLog = {
            date: logDate,
            employeeName: "-",
            epi: epiName,
            action: "Suppression",
            notes: `EPI supprimé du catalogue (${activeCount} dotation(s) retirée(s))`
        };
        history.push(newLog);

        if (isCloudMode) {
            await dbDelete('epi_list', 'name', epiName);
            if (activeCount > 0) await dbDelete('attributions', 'epi', epiName);
            await dbInsert('history', newLog);
        }

        saveLocalState();
    }
};

// Open Stock parameters edit modal
window.openEditStockModal = function(epiName) {
    const epiObj = epiList.find(e => e.name === epiName);
    if (!epiObj) return;

    document.getElementById("stock-epi-name").value = epiObj.name;
    document.getElementById("stock-epi-rename").value = epiObj.name;
    
    const container = document.getElementById("edit-epi-sizes-container");
    if (container) {
        container.innerHTML = "";
        if (epiObj.sizes && epiObj.sizes.length > 0) {
            epiObj.sizes.forEach(s => addSizeRow("edit-epi-sizes-container", s.name, s.stock));
        } else {
            addSizeRow("edit-epi-sizes-container", "Standard", epiObj.stock || 0);
        }
    }
    
    document.getElementById("stock-min").value = epiObj.minStock;
    document.getElementById("stock-lifespan").value = epiObj.lifespan !== null ? epiObj.lifespan : "";
    document.getElementById("stock-notes").value = epiObj.notes || "";

    modalEditStock.classList.add("active");
};

// Save Stock changes
document.getElementById("form-edit-stock").addEventListener("submit", async function(e) {
    e.preventDefault();
    const epiName = document.getElementById("stock-epi-name").value;
    const newName = document.getElementById("stock-epi-rename").value.trim();
    const min = parseInt(document.getElementById("stock-min").value);
    const lifespanVal = document.getElementById("stock-lifespan").value;
    const lifespan = lifespanVal !== "" ? parseInt(lifespanVal) : null;
    const notes = document.getElementById("stock-notes").value.trim();
    
    const sizes = extractSizesFromContainer("edit-epi-sizes-container");
    if (sizes.length === 0) {
        alert("Vous devez définir au moins une taille.");
        return;
    }
    const newTotalStock = sizes.reduce((sum, s) => sum + s.stock, 0);

    const epiObj = epiList.find(e => e.name === epiName);
    if (!epiObj) return;

    // Handle rename: update all attributions and history that reference the old name
    if (newName && newName !== epiName) {
        attributions.forEach(a => { if (a.epi === epiName) a.epi = newName; });
        history.forEach(h => { if (h.epi === epiName) h.epi = newName; });
        epiObj.name = newName;
    }

    const oldTotal = epiObj.sizes ? epiObj.sizes.reduce((sum, s) => sum + s.stock, 0) : epiObj.stock;
    epiObj.sizes = sizes;
    epiObj.minStock = min;
    epiObj.lifespan = lifespan;
    epiObj.notes = notes;

    const logDate = formatDateTime(new Date());
    const newLog = {
        date: logDate,
        employeeName: "-",
        epi: epiName,
        action: "Stock",
        notes: `Ajustement EPI "${newName || epiName}" : Stock Total ${oldTotal} -> ${newTotalStock}, Tailles: ${sizes.map(s => s.name+':'+s.stock).join(', ')}`
    };
    history.push(newLog);

    if (isCloudMode) {
        const cloudNotes = `${notes || ""}  __SIZES_JSON__${JSON.stringify(sizes)}]`.trim();
        await dbUpdate('epi_list', 'name', epiName, { name: newName, stock: newTotalStock, min_stock: min, lifespan_months: lifespan, notes: cloudNotes });
        await dbInsert('history', newLog);
    }

    saveLocalState();
    modalEditStock.classList.remove("active");
    alert("Paramètres de stock enregistrés !");
});

// Clear history log
document.getElementById("btn-clear-history").addEventListener("click", async function() {
    if (confirm("Voulez-vous vraiment effacer tout le journal d'historique ?")) {
        history = [];
        if (isCloudMode) {
            await dbDeleteAll('history');
        }
        saveLocalState();
    }
});

// GENERATE RECEIPT & PRINT
window.printReceiptForEmployee = function(employeeId) {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    const empAttributions = attributions.filter(a => a.employeeId === employeeId);
    
    document.getElementById("print-emp-name").innerText = emp.name;
    document.getElementById("print-emp-role").innerText = emp.role;
    document.getElementById("print-date").innerText = new Date().toLocaleDateString('fr-FR');

    const printTbody = document.getElementById("print-table-body");
    printTbody.innerHTML = "";

    if (empAttributions.length === 0) {
        printTbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Aucun équipement actuellement attribué.</td></tr>`;
    } else {
        empAttributions.forEach(attr => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${attr.epi}</strong></td>
                <td>${attr.size || '-'}</td>
                <td>${attr.date}</td>
                <td>${attr.expirationDate || '-'}</td>
                <td>${attr.state}</td>
                <td>${attr.notes || '-'}</td>
            `;
            printTbody.appendChild(tr);
        });
    }

    window.print();
};


// ── EXPORT EXCEL (natif, sans bibliothèque externe) ─────────────────────────
function escXml(v) {
    if (v === null || v === undefined) return '';
    return String(v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function makeXmlRow(cells) {
    return '<Row>' + cells.map(c => {
        const isNum = typeof c === 'number';
        return `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${escXml(c)}</Data></Cell>`;
    }).join('') + '</Row>';
}

function makeXmlSheet(name, rows) {
    return `<Worksheet ss:Name="${escXml(name)}"><Table>` +
        rows.map(makeXmlRow).join('') +
        '</Table></Worksheet>';
}

function exportToExcel() {
    // Personnel
    const empRows = [["Nom Complet", "Poste / Statut", "Date d'entrée"]];
    employees.forEach(e => empRows.push([e.name, e.role, e.entryDate || '']));

    // Catalogue EPI
    const epiRows = [["Nom de l'EPI", "Tailles et Stock", "Stock Disponible Total", "Seuil Alerte", "Durée de vie (mois)", "Statut", "Remarques"]];
    epiList.forEach(e => {
        const totalStock = e.sizes ? e.sizes.reduce((sum, s) => sum + s.stock, 0) : 0;
        const status = totalStock === 0 ? 'RUPTURE' : totalStock <= e.minStock ? 'ALERTE' : 'OK';
        const sizesStr = (e.sizes || []).map(s => `${s.name}: ${s.stock}`).join(' | ');
        epiRows.push([e.name, sizesStr, totalStock, e.minStock, e.lifespan || 'N/A', status, e.notes || '']);
    });

    // Dotations
    const attrRows = [["Collaborateur", "EPI Attribué", "Taille", "Date Remise", "Date Péremption", "État", "Notes"]];
    attributions.forEach(a => attrRows.push([
        a.employeeName, a.epi, a.size || '', a.date, a.expirationDate || 'N/A', a.state, a.notes || ''
    ]));

    // Historique
    const histRows = [["Date", "Collaborateur", "EPI", "Action", "Détails"]];
    history.forEach(h => histRows.push([h.date, h.employeeName, h.epi, h.action, h.notes || '']));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header"><Font ss:Bold="1"/></Style>
 </Styles>
 ${makeXmlSheet('Personnel', empRows)}
 ${makeXmlSheet('Catalogue EPI', epiRows)}
 ${makeXmlSheet('Dotations', attrRows)}
 ${makeXmlSheet('Historique', histRows)}
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=UTF-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Registre_EPI_Paprec_' + new Date().toISOString().slice(0, 10) + '.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Dynamic sizes logic
function addSizeRow(containerId, name = "", qty = 0) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const row = document.createElement("div");
    row.className = "size-row";
    row.style.cssText = "display:flex; gap:10px; margin-bottom:5px;";
    row.innerHTML = `
        <input type="text" class="size-name" placeholder="Taille (ex: Standard, L)" required style="flex:2;" value="${name}">
        <input type="number" class="size-qty" min="0" placeholder="Qté" required style="flex:1;" value="${qty}">
        <button type="button" class="btn btn-secondary btn-remove-size" style="padding: 0 10px;"><i class="fa-solid fa-trash"></i></button>
    `;
    row.querySelector(".btn-remove-size").addEventListener("click", () => row.remove());
    container.appendChild(row);
}

document.addEventListener("DOMContentLoaded", () => {
    const btnNew = document.getElementById("btn-add-size-row-new");
    if (btnNew) btnNew.addEventListener("click", () => addSizeRow("new-epi-sizes-container"));
    const btnEdit = document.getElementById("btn-add-size-row-edit");
    if (btnEdit) btnEdit.addEventListener("click", () => addSizeRow("edit-epi-sizes-container"));
});

function extractSizesFromContainer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    const rows = container.querySelectorAll(".size-row");
    const sizes = [];
    rows.forEach(row => {
        const name = row.querySelector(".size-name").value.trim();
        const qty = parseInt(row.querySelector(".size-qty").value) || 0;
        if (name) {
            const existing = sizes.find(s => s.name.toLowerCase() === name.toLowerCase());
            if (existing) {
                existing.stock += qty;
            } else {
                sizes.push({ name, stock: qty });
            }
        }
    });
    return sizes;
}

// INITIALIZATION & TAB BINDINGS

document.addEventListener("DOMContentLoaded", () => {
    // Nav Tab switching
    navItems.forEach(item => {
        item.addEventListener("click", function(e) {
            e.preventDefault();
            const tabId = this.getAttribute("data-tab");
            if (tabId) switchTab(tabId);
        });
    });

    // Set today's date in all date fields by default
    const dateInput = document.getElementById("assign-date");
    if (dateInput) dateInput.valueAsDate = new Date();
    const empDateInput = document.getElementById("emp-date-entry");
    if (empDateInput) empDateInput.valueAsDate = new Date();

    // Modal Add Employee triggers
    document.getElementById("btn-add-employee-trigger").addEventListener("click", () => {
        const empDate = document.getElementById("emp-date-entry");
        if (empDate) empDate.valueAsDate = new Date();
        modalAddEmployee.classList.add("active");
    });
    document.getElementById("btn-close-modal-add").addEventListener("click", () => {
        modalAddEmployee.classList.remove("active");
    });
    document.getElementById("btn-cancel-add").addEventListener("click", () => {
        modalAddEmployee.classList.remove("active");
    });

    // Modal Incident triggers

    // Incident modal checkbox toggle
    const cbReplace = document.getElementById("incident-replace-now");
    const containerReplace = document.getElementById("incident-replace-size-container");
    if (cbReplace && containerReplace) {
        cbReplace.addEventListener("change", function() {
            containerReplace.style.display = this.checked ? "block" : "none";
        });
    }

    document.getElementById("btn-close-modal-incident").addEventListener("click", () => {
        modalIncident.classList.remove("active");
    });
    document.getElementById("btn-cancel-incident").addEventListener("click", () => {
        modalIncident.classList.remove("active");
    });

    // Search bar filters
    document.getElementById("search-employee").addEventListener("input", renderEmployeesTable);
    document.getElementById("search-attribution").addEventListener("input", renderAttributionsTable);
    document.getElementById("search-history").addEventListener("input", renderHistoryTable);
    const searchEpiInput = document.getElementById("search-epi");
    if (searchEpiInput) searchEpiInput.addEventListener("input", renderEquipementsTable);

    // Modal Add EPI triggers
    document.getElementById("btn-add-epi-trigger").addEventListener("click", () => {
        modalAddEpi.classList.add("active");
    });
    document.getElementById("btn-close-modal-add-epi").addEventListener("click", () => {
        modalAddEpi.classList.remove("active");
    });
    document.getElementById("btn-cancel-add-epi").addEventListener("click", () => {
        modalAddEpi.classList.remove("active");
    });

    // Modal Edit Stock triggers
    document.getElementById("btn-close-modal-stock").addEventListener("click", () => {
        modalEditStock.classList.remove("active");
    });
    document.getElementById("btn-cancel-stock").addEventListener("click", () => {
        modalEditStock.classList.remove("active");
    });

    // Form Add EPI submit
    document.getElementById("form-add-epi").addEventListener("submit", async function(e) {
        e.preventDefault();
        const newEpiName = document.getElementById("new-epi-name").value.trim();
        const newEpiNotes = document.getElementById("new-epi-notes").value.trim();
        const newEpiMin = parseInt(document.getElementById("new-epi-min").value) || 2;
        const lifespanRaw = document.getElementById("new-epi-lifespan").value;
        const newEpiLifespan = lifespanRaw !== "" ? parseInt(lifespanRaw) : null;

        const sizes = extractSizesFromContainer("new-epi-sizes-container");
        if (sizes.length === 0) {
            alert("Vous devez définir au moins une taille.");
            return;
        }
        const totalStock = sizes.reduce((sum, s) => sum + s.stock, 0);

        if (!newEpiName) return;

        if (epiList.some(e => e.name === newEpiName)) {
            alert("Un EPI avec ce nom existe déjà dans le catalogue !");
            return;
        }

        const newEpiObj = {
            name: newEpiName,
            sizes: sizes,
            minStock: newEpiMin,
            lifespan: newEpiLifespan,
            notes: newEpiNotes
        };
        epiList.push(newEpiObj);

        const logDate = formatDateTime(new Date());
        const newLog = {
            date: logDate,
            employeeName: "-",
            epi: newEpiName,
            action: "Ajout",
            notes: `Nouvel EPI ajouté au catalogue (Stock Total: ${totalStock}, Tailles: ${sizes.map(s => s.name+':'+s.stock).join(', ')})`
        };
        history.push(newLog);

        if (isCloudMode) {
            const cloudNotes = `${newEpiNotes || ""}  __SIZES_JSON__${JSON.stringify(sizes)}]`.trim();
            await dbInsert('epi_list', { name: newEpiName, stock: totalStock, min_stock: newEpiMin, lifespan_months: newEpiLifespan, notes: cloudNotes });
            await dbInsert('history', newLog);
        }

        saveLocalState();
        modalAddEpi.classList.remove("active");
        this.reset();
        const sizesContainer = document.getElementById("new-epi-sizes-container");
        if (sizesContainer) sizesContainer.innerHTML = "";
    });

    // Export Excel button
    const btnExport = document.getElementById("btn-export-excel");
    if (btnExport) btnExport.addEventListener("click", exportToExcel);

    // Initial load from cloud or local
    loadData();
});


// ── FINANCES TAB RENDERING & LOGIC ───────────────────────────────────────────
let priceTrendChart = null;

function renderFinancesTab() {
    // 1. KPI Cards
    const totalBudget = invoices.reduce((sum, inv) => sum + (inv.totalPrice || (inv.quantity * inv.unitPrice)), 0);
    const totalAttributed = attributions.reduce((sum, attr) => {
        const p = (typeof attr.unitPrice === 'number' && attr.unitPrice > 0) ? attr.unitPrice : getEpiUnitPrice(attr.epi);
        return sum + p;
    }, 0);
    const avgCost = employees.length > 0 ? (totalAttributed / employees.length) : 0;

    const elBudget = document.getElementById("stat-budget-total");
    const elAttributed = document.getElementById("stat-attributed-cost");
    const elAvg = document.getElementById("stat-avg-emp-cost");
    const elCount = document.getElementById("stat-invoices-count");

    if (elBudget) elBudget.innerText = `${totalBudget.toFixed(2)} €`;
    if (elAttributed) elAttributed.innerText = `${totalAttributed.toFixed(2)} €`;
    if (elAvg) elAvg.innerText = `${avgCost.toFixed(2)} €`;
    if (elCount) elCount.innerText = invoices.length;

    // 2. Populate invoice EPI & size selects
    populateInvoiceSelects();

    // 3. Render Invoices Table
    renderInvoicesTable();

    // 4. Render Employee Costs Table
    renderEmployeeCostsTable();

    // 5. Render Price Trend Section
    populatePriceTrendEpiSelect();
    renderPriceTrendSection();
}

function populateInvoiceSelects() {
    const selectEpi = document.getElementById("inv-epi");
    const selectSize = document.getElementById("inv-size");
    if (!selectEpi || !selectSize) return;

    const currentEpi = selectEpi.value;
    selectEpi.innerHTML = `<option value="">Sélectionner un EPI...</option>`;
    epiList.forEach(e => {
        const opt = document.createElement("option");
        opt.value = e.name;
        opt.innerText = e.name;
        if (e.name === currentEpi) opt.selected = true;
        selectEpi.appendChild(opt);
    });

    selectEpi.onchange = function() {
        const epiName = this.value;
        selectSize.innerHTML = `<option value="">Sélectionner une taille...</option>`;
        if (!epiName) return;
        const epiObj = epiList.find(e => e.name === epiName);
        if (!epiObj || !epiObj.sizes) return;
        epiObj.sizes.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.name;
            opt.innerText = `${s.name} (Stock actuel: ${s.stock})`;
            selectSize.appendChild(opt);
        });

        // Pre-fill default price
        const priceInput = document.getElementById("inv-unit-price");
        if (priceInput && epiObj) {
            priceInput.value = (typeof epiObj.unitPrice === 'number' ? epiObj.unitPrice : 25.00).toFixed(2);
        }
    };
}

function renderInvoicesTable() {
    const tbody = document.getElementById("invoices-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    const searchInput = document.getElementById("search-invoice");
    const filter = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const filtered = invoices.filter(inv => 
        inv.invoiceNumber.toLowerCase().includes(filter) ||
        inv.supplier.toLowerCase().includes(filter) ||
        inv.epiName.toLowerCase().includes(filter)
    );

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-secondary" style="text-align:center;">Aucune facture enregistrée.</td></tr>`;
        return;
    }

    filtered.forEach(inv => {
        const total = inv.totalPrice || (inv.quantity * inv.unitPrice);
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><span class="text-secondary">${inv.date}</span></td>
            <td><strong>${inv.invoiceNumber}</strong></td>
            <td>${inv.supplier}</td>
            <td>${inv.epiName}</td>
            <td><span class="text-secondary">${inv.size || 'Standard'}</span></td>
            <td><strong>${inv.quantity}</strong></td>
            <td>${inv.unitPrice.toFixed(2)} €</td>
            <td><span class="badge badge-euro">${total.toFixed(2)} €</span></td>
            <td class="text-right">
                <button class="btn-icon" onclick="deleteInvoice('${inv.id}')" title="Supprimer la facture">
                    <i class="fa-solid fa-trash-can text-danger"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.deleteInvoice = function(id) {
    if (confirm("Voulez-vous vraiment supprimer cette facture ?")) {
        invoices = invoices.filter(i => i.id !== id);
        saveLocalState();
    }
};

function renderEmployeeCostsTable() {
    const tbody = document.getElementById("employee-costs-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    const searchInput = document.getElementById("search-employee-cost");
    const filter = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const filtered = employees.filter(emp => 
        emp.name.toLowerCase().includes(filter) ||
        emp.role.toLowerCase().includes(filter)
    );

    // Calculate cost for each employee and sort descending by total cost
    const empCostList = filtered.map(emp => {
        const empAttributions = attributions.filter(a => a.employeeId === emp.id);
        const totalCost = getEmployeeTotalCost(emp.id);
        return { emp, activeCount: empAttributions.length, totalCost };
    });

    empCostList.sort((a, b) => b.totalCost - a.totalCost);

    if (empCostList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-secondary" style="text-align:center;">Aucun collaborateur trouvé.</td></tr>`;
        return;
    }

    empCostList.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${item.emp.name}</strong></td>
            <td class="text-secondary" style="font-size:0.85rem;">${item.emp.role}</td>
            <td><span class="badge badge-new">${item.activeCount} EPI</span></td>
            <td><span class="badge badge-euro" style="font-size:0.9rem; font-weight:700;">${item.totalCost.toFixed(2)} €</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function populatePriceTrendEpiSelect() {
    const select = document.getElementById("select-price-trend-epi");
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = `<option value="">Sélectionner un EPI...</option>`;
    
    epiList.forEach(e => {
        const opt = document.createElement("option");
        opt.value = e.name;
        opt.innerText = e.name;
        if (e.name === currentVal) opt.selected = true;
        select.appendChild(opt);
    });

    // If no value selected, pick the first EPI from catalog
    if (!select.value && epiList.length > 0) {
        select.value = epiList[0].name;
    }
}

function renderPriceTrendSection() {
    const select = document.getElementById("select-price-trend-epi");
    const selectedEpi = select ? select.value : "";
    const badgeEl = document.getElementById("price-trend-summary-badge");
    const tbody = document.getElementById("price-history-table-body");

    if (!selectedEpi) {
        if (badgeEl) badgeEl.innerHTML = `<span class="text-secondary">Veuillez sélectionner un EPI pour voir son évolution tarifaire.</span>`;
        if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-secondary" style="text-align:center;">Aucune donnée.</td></tr>`;
        return;
    }

    // Get historical price points for this EPI from priceHistory and invoices
    let points = priceHistory.filter(p => p.epiName === selectedEpi);
    
    // Also include any invoice record for this EPI
    invoices.forEach(inv => {
        if (inv.epiName === selectedEpi && !points.some(p => p.invoiceNumber === inv.invoiceNumber)) {
            points.push({
                id: inv.id,
                epiName: inv.epiName,
                date: inv.date,
                unitPrice: inv.unitPrice,
                supplier: inv.supplier,
                invoiceNumber: inv.invoiceNumber
            });
        }
    });

    // Sort by date ascending for chart
    points.sort((a, b) => new Date(a.date) - new Date(b.date));

    // If no points, fallback to current price
    if (points.length === 0) {
        const currentPrice = getEpiUnitPrice(selectedEpi);
        points = [{
            date: new Date().toISOString().split('T')[0],
            unitPrice: currentPrice,
            supplier: "Prix actuel",
            invoiceNumber: "Réf. Tarif"
        }];
    }

    // Calculate trend %
    const firstPrice = points[0].unitPrice;
    const lastPrice = points[points.length - 1].unitPrice;
    let trendBadge = "";
    if (points.length > 1 && firstPrice > 0) {
        const pct = ((lastPrice - firstPrice) / firstPrice) * 100;
        if (pct > 0) {
            trendBadge = `<span class="trend-up"><i class="fa-solid fa-arrow-trend-up"></i> +${pct.toFixed(1)}% (${firstPrice.toFixed(2)} € → ${lastPrice.toFixed(2)} €)</span>`;
        } else if (pct < 0) {
            trendBadge = `<span class="trend-down"><i class="fa-solid fa-arrow-trend-down"></i> ${pct.toFixed(1)}% (${firstPrice.toFixed(2)} € → ${lastPrice.toFixed(2)} €)</span>`;
        } else {
            trendBadge = `<span class="trend-flat"><i class="fa-solid fa-minus"></i> Prix stable (${lastPrice.toFixed(2)} €)</span>`;
        }
    } else {
        trendBadge = `<span class="trend-flat"><i class="fa-solid fa-tag"></i> Tarif actuel : ${lastPrice.toFixed(2)} € HT</span>`;
    }

    if (badgeEl) badgeEl.innerHTML = `<strong>Tendances Tarifaires pour ${selectedEpi} :</strong> ${trendBadge}`;

    // Render Table
    if (tbody) {
        tbody.innerHTML = "";
        // Display descending order in table
        const tablePoints = [...points].reverse();
        tablePoints.forEach((pt, idx) => {
            const tr = document.createElement("tr");
            let iconTrend = `<span class="trend-flat">➖</span>`;
            if (idx < tablePoints.length - 1) {
                const prevPrice = tablePoints[idx + 1].unitPrice;
                if (pt.unitPrice > prevPrice) iconTrend = `<span class="trend-up">📈 +${(((pt.unitPrice - prevPrice)/prevPrice)*100).toFixed(1)}%</span>`;
                else if (pt.unitPrice < prevPrice) iconTrend = `<span class="trend-down">📉 ${(((pt.unitPrice - prevPrice)/prevPrice)*100).toFixed(1)}%</span>`;
            }
            tr.innerHTML = `
                <td>${pt.date}</td>
                <td><strong>${pt.invoiceNumber || '-'}</strong></td>
                <td>${pt.supplier || '-'}</td>
                <td><strong>${pt.unitPrice.toFixed(2)} €</strong></td>
                <td>${iconTrend}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Render Chart.js
    renderPriceTrendChart(selectedEpi, points);
}

function renderPriceTrendChart(epiName, points) {
    const canvas = document.getElementById("chart-price-trend");
    if (!canvas) return;

    if (typeof Chart === 'undefined') return;

    const labels = points.map(p => p.date);
    const dataPrices = points.map(p => p.unitPrice);

    const chartData = {
        labels: labels,
        datasets: [{
            label: `Prix unitaire (€ HT) - ${epiName}`,
            data: dataPrices,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            borderWidth: 3,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#0284c7',
            pointRadius: 5
        }]
    };

    if (priceTrendChart) {
        priceTrendChart.data = chartData;
        priceTrendChart.update();
    } else {
        const ctx = canvas.getContext('2d');
        priceTrendChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    },
                    y: {
                        ticks: { 
                            color: '#94a3b8', 
                            font: { family: 'Plus Jakarta Sans', size: 11 },
                            callback: function(val) { return val + ' €'; }
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    }
                }
            }
        });
    }
}

// FORM LISTENER: Add Invoice
document.addEventListener("DOMContentLoaded", () => {
    const formInvoice = document.getElementById("form-add-invoice");
    if (formInvoice) {
        // Set default date to today
        const dateInput = document.getElementById("inv-date");
        if (dateInput) dateInput.valueAsDate = new Date();

        formInvoice.addEventListener("submit", async function(e) {
            e.preventDefault();
            const invoiceNumber = document.getElementById("inv-number").value.trim();
            const supplier = document.getElementById("inv-supplier").value.trim();
            const date = document.getElementById("inv-date").value;
            const epiName = document.getElementById("inv-epi").value;
            const size = document.getElementById("inv-size").value;
            const quantity = parseInt(document.getElementById("inv-qty").value) || 0;
            const unitPrice = parseFloat(document.getElementById("inv-unit-price").value) || 0;
            const updateCatalogPrice = document.getElementById("inv-update-catalog-price").checked;
            const notes = document.getElementById("inv-notes").value.trim();

            if (!invoiceNumber || !supplier || !date || !epiName || !size || quantity <= 0 || unitPrice <= 0) {
                alert("Veuillez remplir correctement tous les champs obligatoires (*).");
                return;
            }

            const epiObj = epiList.find(e => e.name === epiName);
            if (!epiObj) {
                alert("Équipement introuvable.");
                return;
            }

            // Update stock for size
            let sizeObj = (epiObj.sizes || []).find(s => s.name === size);
            if (!sizeObj) {
                sizeObj = { name: size, stock: 0 };
                epiObj.sizes.push(sizeObj);
            }
            sizeObj.stock += quantity;

            // Update catalog unitPrice if checked
            if (updateCatalogPrice) {
                epiObj.unitPrice = unitPrice;
            }

            const totalPrice = quantity * unitPrice;
            const newInvoice = {
                id: generateId("fac"),
                invoiceNumber,
                supplier,
                date,
                epiName,
                size,
                quantity,
                unitPrice,
                totalPrice,
                notes
            };
            invoices.push(newInvoice);

            // Snapshot priceHistory
            priceHistory.push({
                id: generateId("ph"),
                epiName,
                date,
                unitPrice,
                supplier,
                invoiceNumber
            });

            // Log entry in history
            const logDate = formatDateTime(new Date());
            const newLog = {
                date: logDate,
                employeeName: `Fournisseur: ${supplier}`,
                epi: epiName,
                action: "Achat / Appro",
                notes: `Réception de ${quantity} unité(s) (${size}) - Facture N° ${invoiceNumber} (${unitPrice.toFixed(2)} €/u)`
            };
            history.push(newLog);

            saveLocalState();
            this.reset();
            document.getElementById("inv-date").valueAsDate = new Date();
            alert(`Facture ${invoiceNumber} enregistrée avec succès ! Stock de "${epiName}" (+${quantity}) mis à jour.`);
        });
    }
});


// ── REAL-TIME MULTI-DEVICE CLOUD SYNC ENGINE ─────────────────────────────────
let isSyncingInProcess = false;

function updateCloudStatus(status, text) {
    const badge = document.getElementById("cloud-sync-status-badge");
    if (!badge) return;
    if (status === "ok") {
        badge.innerHTML = `<span style="color: #10b981;"><i class="fa-solid fa-cloud-check"></i> ${text || 'Synchronisé (Multi-Appareils)'}</span>`;
    } else if (status === "syncing") {
        badge.innerHTML = `<span style="color: #3b82f6;"><i class="fa-solid fa-rotate fa-spin"></i> ${text || 'Synchro en cours...'}</span>`;
    } else if (status === "offline") {
        badge.innerHTML = `<span style="color: #f59e0b;"><i class="fa-solid fa-cloud"></i> ${text || 'Stockage Local'}</span>`;
    }
}

// Periodic Background Sync (every 10 seconds across all devices)
function initRealtimeCloudSync() {
    // Initial sync
    initRealtimeCloudSync();

    // Auto-poll every 10s
    setInterval(() => {
        if (!isSyncingInProcess) {
            syncCloudWithLocal(true);
        }
    }, 10000);

    // Sync when user re-focuses tab/window
    window.addEventListener('focus', () => {
        syncCloudWithLocal(true);
    });
}
