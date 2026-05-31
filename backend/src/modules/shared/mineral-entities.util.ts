/**
 * Shared helpers for deriving companies, provinces, and resource highlights
 * from the heterogeneous project tables (SIACAM uranium + mining pipeline).
 */

export interface CompanyRef {
  name: string;
  slug: string;
  origin_country: string | null;
  ownership_pct: string | null;
}

export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const PLACEHOLDER_NAMES = new Set(['', '-', 'n/a', 'na', 'none', 'null']);

function isPlaceholder(v: string | null | undefined): boolean {
  return !v || PLACEHOLDER_NAMES.has(v.trim().toLowerCase());
}

function cleanName(raw: string): string {
  // Strip markdown image tags the pipeline occasionally leaves in operator strings.
  return raw
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalize the JSONB `controllers` array stored on uranium projects. */
export function controllersFromJson(raw: unknown): CompanyRef[] {
  if (!Array.isArray(raw)) return [];
  const out: CompanyRef[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const name = cleanName(String(e.name ?? ''));
    if (isPlaceholder(name)) continue;
    const origin = e.origin_country == null ? null : String(e.origin_country).trim();
    const pct = e.ownership_pct == null || e.ownership_pct === '' ? null : String(e.ownership_pct).trim();
    out.push({
      name,
      slug: slugify(name),
      origin_country: isPlaceholder(origin) ? null : origin,
      ownership_pct: pct,
    });
  }
  return dedupeBySlug(out);
}

/**
 * Mining-pipeline projects store the controlling entity as a free-text
 * `operator` / `owner_controller` string. These contain joint-venture and
 * subsidiary chains separated by " / ". We take the first (controlling) entity.
 */
export function controllersFromOperator(operator: string | null, ownerController: string | null): CompanyRef[] {
  const raw = cleanName(operator ?? ownerController ?? '');
  if (isPlaceholder(raw)) return [];
  const first = cleanName(raw.split(' / ')[0]);
  if (isPlaceholder(first)) return [];
  return [{ name: first, slug: slugify(first), origin_country: null, ownership_pct: null }];
}

function dedupeBySlug(refs: CompanyRef[]): CompanyRef[] {
  const seen = new Map<string, CompanyRef>();
  for (const r of refs) if (!seen.has(r.slug)) seen.set(r.slug, r);
  return [...seen.values()];
}

// ---------------------------------------------------------------------------
// Province codes
// ---------------------------------------------------------------------------

const PROVINCE_CODES: Record<string, string> = {
  'buenos aires': 'BA',
  caba: 'CABA',
  'ciudad autonoma de buenos aires': 'CABA',
  catamarca: 'CA',
  chaco: 'CC',
  chubut: 'CT',
  cordoba: 'CB',
  corrientes: 'CN',
  'entre rios': 'ER',
  formosa: 'FM',
  jujuy: 'JY',
  'la pampa': 'LP',
  'la rioja': 'LR',
  mendoza: 'MZ',
  misiones: 'MN',
  neuquen: 'NQ',
  'rio negro': 'RN',
  salta: 'SA',
  'san juan': 'SJ',
  'san luis': 'SL',
  'santa cruz': 'SC',
  'santa fe': 'SF',
  'santiago del estero': 'SE',
  tucuman: 'TM',
  'tierra del fuego': 'TF',
};

function normalizeProvinceKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function provinceCode(name: string | null | undefined, fallback?: string | null): string | null {
  if (fallback && !isPlaceholder(fallback)) return fallback;
  if (!name) return null;
  return PROVINCE_CODES[normalizeProvinceKey(name)] ?? null;
}

// ---------------------------------------------------------------------------
// Resource highlights (from mining-pipeline resources JSONB)
// ---------------------------------------------------------------------------

interface ResourceEntry {
  category?: string;
  values?: Record<string, unknown>;
}

function asEntryList(raw: unknown): ResourceEntry[] {
  if (Array.isArray(raw)) return raw as ResourceEntry[];
  if (raw && typeof raw === 'object') {
    const out: ResourceEntry[] = [];
    for (const [category, values] of Object.entries(raw as Record<string, unknown>)) {
      if (Array.isArray(values)) {
        for (const v of values) if (v && typeof v === 'object') out.push({ category, values: v as Record<string, unknown> });
      } else if (values && typeof values === 'object') {
        out.push({ category, values: values as Record<string, unknown> });
      }
    }
    return out;
  }
  return [];
}

function categorySlug(category: string | undefined): string {
  if (!category) return 'unknown';
  return category.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/**
 * Compact per-resource headline numbers for a single project, e.g.
 * { m_and_i_Ag_kOz: 198643, m_and_i_Au_kOz: 1715 }. Returns null when empty.
 */
export function resourcesSummary(raw: unknown): Record<string, number> | null {
  const out: Record<string, number> = {};
  for (const entry of asEntryList(raw)) {
    const cat = categorySlug(entry.category);
    for (const [unit, v] of Object.entries(entry.values ?? {})) {
      const n = Number(v);
      if (!Number.isFinite(n)) continue;
      const key = `${cat}_${unit}`;
      if (out[key] === undefined) out[key] = n;
    }
  }
  return Object.keys(out).length ? out : null;
}

/** Sum resource values across many projects, keyed by category+unit. */
export function accumulateResourceTotals(target: Record<string, number>, raw: unknown): void {
  for (const entry of asEntryList(raw)) {
    const cat = categorySlug(entry.category);
    for (const [unit, v] of Object.entries(entry.values ?? {})) {
      const n = Number(v);
      if (!Number.isFinite(n)) continue;
      const key = `${cat}_${unit}`;
      target[key] = (target[key] ?? 0) + n;
    }
  }
}

// ---------------------------------------------------------------------------
// Status classification (shared by company timeline + province stats)
// ---------------------------------------------------------------------------

export function isOperating(status: string | null | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s.includes('operation') || s.includes('production') || s.includes('producing') || s.includes('construction');
}

export function isExploration(status: string | null | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s.includes('explora') || s.includes('prospec');
}

/** Rough ordering of project stages, earliest → latest, for timeline sorting. */
const STAGE_RANK: Array<{ match: RegExp; rank: number }> = [
  { match: /prospec/i, rank: 0 },
  { match: /(early|inicial)/i, rank: 1 },
  { match: /explora/i, rank: 2 },
  { match: /(pea|preliminary economic|evaluaci)/i, rank: 3 },
  { match: /(pre.?feasibility|prefactib)/i, rank: 4 },
  { match: /(feasibility|factibil)/i, rank: 5 },
  { match: /construction/i, rank: 6 },
  { match: /(operation|production|producing)/i, rank: 7 },
];

export function stageRank(status: string | null | undefined): number {
  if (!status) return 99;
  for (const { match, rank } of STAGE_RANK) if (match.test(status)) return rank;
  return 50;
}
