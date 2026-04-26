import { SERVICE_CATEGORIES_DATA, type ServiceCategory } from '@/types';

/**
 * Strips a raw sub-category enum key from a request title.
 * Client submit-request.tsx builds title as: `${form.title} — ${form.sub_category}`
 * e.g. "Villa project — residential_plans" → "Villa project"
 */
export function cleanRequestTitle(rawTitle: string | null | undefined): string {
  if (!rawTitle) return '';
  const parts = rawTitle.split(' — ');
  if (parts.length < 2) return rawTitle.trim();
  const tail = parts[parts.length - 1].trim();
  // If the trailing fragment looks like a snake_case enum key, drop it.
  if (/^[a-z][a-z0-9_]*$/.test(tail)) {
    return parts.slice(0, -1).join(' — ').trim();
  }
  return rawTitle.trim();
}

/**
 * Parses the structured engineering details that submit-request.tsx appends
 * to the description as plain key/value lines. We extract only the high-value
 * fields needed for the card UI; the rest stays in the description text.
 */
export interface ParsedRequestMeta {
  categoryKey?: string;
  subCategoryKey?: string;
  area?: string;
  timeline?: string;
  cleanDescription: string;
}

const KEY_LABELS = {
  category: ['الفئة', 'Category'],
  subCategory: ['التخصص الفرعي', 'Sub-category'],
  area: ['المساحة', 'Area'],
  timeline: ['المدة المطلوبة', 'Timeline'],
};

function matchLine(line: string, labels: string[]): string | null {
  for (const label of labels) {
    const re = new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, 'i');
    const m = line.match(re);
    if (m) return m[1].trim();
  }
  return null;
}

export function parseRequestMeta(description: string | null | undefined): ParsedRequestMeta {
  if (!description) return { cleanDescription: '' };

  const result: ParsedRequestMeta = { cleanDescription: '' };
  const keptLines: string[] = [];

  for (const rawLine of description.split('\n')) {
    const line = rawLine.trimEnd();

    const cat = matchLine(line, KEY_LABELS.category);
    if (cat && !result.categoryKey) { result.categoryKey = cat; continue; }

    const sub = matchLine(line, KEY_LABELS.subCategory);
    if (sub && !result.subCategoryKey) { result.subCategoryKey = sub; continue; }

    const area = matchLine(line, KEY_LABELS.area);
    if (area && !result.area) { result.area = area; continue; }

    const tl = matchLine(line, KEY_LABELS.timeline);
    if (tl && !result.timeline) { result.timeline = tl; continue; }

    keptLines.push(rawLine);
  }

  // Drop the now-empty "Engineering Details:" header block if everything inside was extracted.
  result.cleanDescription = keptLines
    .join('\n')
    .replace(/\n*\s*(تفاصيل هندسية|Engineering Details)\s*:\s*\n*/g, '\n')
    .trim();

  return result;
}

export function getCategoryLabel(key: string | undefined, lang: 'ar' | 'en'): string | null {
  if (!key) return null;
  const cat = SERVICE_CATEGORIES_DATA[key as ServiceCategory];
  return cat ? cat[lang] : null;
}

export function getSubCategoryLabel(
  categoryKey: string | undefined,
  subKey: string | undefined,
  lang: 'ar' | 'en',
): string | null {
  if (!subKey) return null;
  if (categoryKey) {
    const cat = SERVICE_CATEGORIES_DATA[categoryKey as ServiceCategory];
    const sub = cat?.subcategories.find(s => s.key === subKey);
    if (sub) return sub[lang];
  }
  // Fallback: search every category in case categoryKey is missing.
  for (const cat of Object.values(SERVICE_CATEGORIES_DATA)) {
    const sub = cat.subcategories.find(s => s.key === subKey);
    if (sub) return sub[lang];
  }
  return null;
}
