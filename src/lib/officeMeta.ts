// Pack / unpack extended office and template metadata.
// Used as a graceful fallback when the underlying Supabase tables don't yet have
// dedicated columns (city, office_type, years_of_experience, license_document_url,
// template category / sub_category / file_url). The block is appended to the
// existing `description` text column with a clear marker so it stays human-readable.

const START = '<<<META';
const END = 'META>>>';

export function packMeta<T extends Record<string, any>>(
  baseDescription: string | null | undefined,
  meta: T,
): string {
  const cleanBase = stripMeta(baseDescription || '').trim();
  const filtered: Record<string, any> = {};
  Object.entries(meta).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') filtered[k] = v;
  });
  if (Object.keys(filtered).length === 0) return cleanBase;
  const block = `${START}${JSON.stringify(filtered)}${END}`;
  return cleanBase ? `${cleanBase}\n\n${block}` : block;
}

export function unpackMeta(description: string | null | undefined): {
  description: string;
  meta: Record<string, any>;
} {
  if (!description) return { description: '', meta: {} };
  const start = description.indexOf(START);
  const end = description.indexOf(END);
  if (start === -1 || end === -1 || end <= start) {
    return { description, meta: {} };
  }
  const json = description.substring(start + START.length, end);
  let meta: Record<string, any> = {};
  try { meta = JSON.parse(json); } catch { meta = {}; }
  const cleaned = (description.slice(0, start) + description.slice(end + END.length)).trim();
  return { description: cleaned, meta };
}

export function stripMeta(description: string | null | undefined): string {
  return unpackMeta(description).description;
}

export type OfficeMeta = {
  phone?: string;
  city?: string;
  office_type?: string;
  years_of_experience?: string;
  license_document_url?: string;
  coverage_areas?: string[];
};

export type TemplateMeta = {
  category?: string;
  sub_category?: string;
  file_url?: string;
};
