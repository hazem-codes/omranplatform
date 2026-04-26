import { SERVICE_CATEGORIES_DATA, type ServiceCategory } from '@/types';

export const SERVICE_CATALOG_CATEGORIES = SERVICE_CATEGORIES_DATA;

export function getCategoryLabel(key: ServiceCategory, lang: 'ar' | 'en'): string {
  return SERVICE_CATEGORIES_DATA[key]?.[lang] || key;
}

export function getSubcategoryLabel(categoryKey: ServiceCategory, subKey: string, lang: 'ar' | 'en'): string {
  const cat = SERVICE_CATEGORIES_DATA[categoryKey];
  if (!cat) return subKey;
  const sub = cat.subcategories.find(s => s.key === subKey);
  return sub ? sub[lang] : subKey;
}
