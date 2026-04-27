/**
 * Run the full seed against the live Supabase project.
 * Usage: node scripts/run-seed.mjs
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY to be set (either in .env or environment).
 * The anon key in .env is not sufficient — we need service_role to bypass RLS.
 */

import { readFileSync, existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// --- Config ---
const SUPABASE_URL = 'https://elrktkqvuintknmvnkkp.supabase.co';
const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscmt0a3F2dWludGtubXZua2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MzQ5MTUsImV4cCI6MjA5MjQxMDkxNX0.sf8Wad2UV5e_uWl-QGCbsy91GKKssU4jbKVSnO95iHg';

// Try to get service_role key from environment or .env file
let SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!SERVICE_ROLE_KEY) {
  try {
    const envPath = new URL('../.env', import.meta.url).pathname;
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf-8');
      const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*"?([^"\n]+)"?/);
      if (match) SERVICE_ROLE_KEY = match[1].trim();
    }
  } catch {}
}

if (!SERVICE_ROLE_KEY) {
  console.error('\n❌  SUPABASE_SERVICE_ROLE_KEY not found.');
  console.error('   Set it in .env or as an environment variable, then re-run.');
  console.error('   You can find it in: Supabase Dashboard → Project Settings → API → service_role\n');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Fixed UUIDs ─────────────────────────────────────────────────────────────
const CLIENT_ID    = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
const OFFICE1_ID   = 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2';
const OFFICE2_ID   = 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3';
const OFFICE3_ID   = 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4';
const SUPER_ID     = 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5';
const ALL_IDS      = [CLIENT_ID, OFFICE1_ID, OFFICE2_ID, OFFICE3_ID, SUPER_ID];

const REQ1_ID      = 'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6';
const REQ2_ID      = '07070707-0707-0707-0707-070707070707';
const REQ3_ID      = '18181818-1818-1818-1818-181818181818';
const BID1_ID      = '29292929-2929-2929-2929-292929292929';
const BID2_ID      = '3a3a3a3a-3a3a-3a3a-3a3a-3a3a3a3a3a3a';
const BID3_ID      = '4b4b4b4b-4b4b-4b4b-4b4b-4b4b4b4b4b4b';
const CONV1_ID     = '5c5c5c5c-5c5c-5c5c-5c5c-5c5c5c5c5c5c';
const CONV2_ID     = '6d6d6d6d-6d6d-6d6d-6d6d-6d6d6d6d6d6d';
const CONTRACT1_ID = '7e7e7e7e-7e7e-7e7e-7e7e-7e7e7e7e7e7e';
const PROJECT1_ID  = '8f8f8f8f-8f8f-8f8f-8f8f-8f8f8f8f8f8f';
const MS1_ID       = '90909090-9090-9090-9090-909090909090';
const MS2_ID       = 'a1b2c3d4-a1b2-a1b2-a1b2-a1b2c3d4e5f6';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

async function step(label, fn) {
  try {
    await fn();
    console.log(`  ✅ ${label}`);
  } catch (err) {
    console.error(`  ❌ ${label}: ${err.message}`);
    throw err;
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
console.log('\n🌱 Omran Platform — Full Reset & Reseed\n');

// 1. CLEAR ALL DATA ───────────────────────────────────────────────────────────
console.log('1) Clearing existing data…');
const clearTables = [
  'notifications', 'reports', 'ratings', 'payments', 'escrow',
  'milestones', 'template_purchases', 'contracts', 'messages',
  'conversations', 'bids', 'project_requests', 'projects',
  'portfolio', 'templates', 'service_catalog',
  'engineering_offices', 'supervisors', 'clients',
];
for (const t of clearTables) {
  await admin.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000').catch(() => {});
  // fallback for tables with different PK names
  try { await admin.from(t).delete().gte('created_at', '1970-01-01'); } catch {}
}
// Delete specific profiles
await admin.from('profiles').delete().in('id', ALL_IDS);
console.log('  ✅ Tables cleared');

// Delete auth users
console.log('2) Deleting old auth users…');
for (const id of ALL_IDS) {
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error && !error.message.includes('not found')) console.warn(`  ⚠ ${id}: ${error.message}`);
}
console.log('  ✅ Auth users deleted');

// 2. CREATE AUTH USERS ────────────────────────────────────────────────────────
console.log('3) Creating auth users…');
const users = [
  { id: CLIENT_ID,  email: 'client@omran.demo',     password: 'Demo@1234', name: 'أحمد العمراني',        role: 'client' },
  { id: OFFICE1_ID, email: 'office@omran.demo',     password: 'Demo@1234', name: 'مكتب عمران الهندسي',   role: 'engineering_office' },
  { id: OFFICE2_ID, email: 'office2@omran.demo',    password: 'Demo@1234', name: 'مكتب البناء الحديث',   role: 'engineering_office' },
  { id: OFFICE3_ID, email: 'office3@omran.demo',    password: 'Demo@1234', name: 'مكتب التميز الإنشائي', role: 'engineering_office' },
  { id: SUPER_ID,   email: 'supervisor@omran.demo', password: 'Demo@1234', name: 'المشرف العام',          role: 'supervisor' },
];

for (const u of users) {
  const { error } = await admin.auth.admin.createUser({
    user_metadata: { name: u.name, role: u.role },
    email: u.email,
    password: u.password,
    email_confirm: true,
  });
  // If already exists from a previous partial run, update instead
  if (error && error.message.includes('already been registered')) {
    console.warn(`  ⚠ ${u.email} already exists, skipping`);
  } else if (error) {
    throw new Error(`createUser(${u.email}): ${error.message}`);
  }
}
console.log('  ✅ Auth users created');

// Re-read the created user IDs (they may differ from our fixed IDs when using createUser without explicit id)
// Use updateUser to set the id OR just query by email
// Actually admin.auth.admin.createUser does not accept a custom id in the JS client.
// We'll fetch and remap.
const createdUsers = {};
for (const u of users) {
  const { data: list } = await admin.auth.admin.listUsers();
  const found = (list?.users ?? []).find(au => au.email === u.email);
  if (found) createdUsers[u.role + '_' + u.email] = found.id;
}

// For simplicity use the actual IDs of the freshly created users
const clientId  = createdUsers['client_client@omran.demo'];
const office1Id = createdUsers['engineering_office_office@omran.demo'];
const office2Id = createdUsers['engineering_office_office2@omran.demo'];
const office3Id = createdUsers['engineering_office_office3@omran.demo'];
const supId     = createdUsers['supervisor_supervisor@omran.demo'];

console.log('  Created IDs:', { clientId, office1Id, office2Id, office3Id, supId });

// 3. PROFILES ─────────────────────────────────────────────────────────────────
console.log('4) Inserting profiles…');
await step('profiles', () => admin.from('profiles').upsert([
  { id: clientId,  name: 'أحمد العمراني',        email: 'client@omran.demo',     role: 'client' },
  { id: office1Id, name: 'مكتب عمران الهندسي',   email: 'office@omran.demo',     role: 'engineering_office' },
  { id: office2Id, name: 'مكتب البناء الحديث',   email: 'office2@omran.demo',    role: 'engineering_office' },
  { id: office3Id, name: 'مكتب التميز الإنشائي', email: 'office3@omran.demo',    role: 'engineering_office' },
  { id: supId,     name: 'المشرف العام',          email: 'supervisor@omran.demo', role: 'supervisor' },
]).throwOnError());

// 4. ROLE-SPECIFIC ROWS ───────────────────────────────────────────────────────
console.log('5) Inserting role-specific rows…');
await step('clients', () => admin.from('clients').upsert({ id: clientId, phone: '0512345678', is_active: true }).throwOnError());

await step('engineering_offices', () => admin.from('engineering_offices').upsert([
  { id: office1Id, license_number: 'SE-10001', license_expiry_date: '2027-12-31',
    coverage_area: 'الرياض، جدة، الدمام',
    description: 'مكتب هندسي متكامل متخصص في التصميم المعماري والإنشائي وإدارة المشاريع.',
    phone: '0501112233', city: 'الرياض', office_type: 'مكتب هندسي متكامل (جميع التخصصات)',
    years_of_experience: 'أكثر من 10 سنوات', is_verified: true, is_active: true },
  { id: office2Id, license_number: 'SE-10002', license_expiry_date: '2026-06-30',
    coverage_area: 'جدة، مكة المكرمة، المدينة المنورة',
    description: 'مكتب البناء الحديث متخصص في الهندسة الإنشائية والإشراف على التشييد.',
    phone: '0502223344', city: 'جدة', office_type: 'مكتب هندسي إنشائي',
    years_of_experience: '5-10 سنوات', is_verified: true, is_active: true },
  { id: office3Id, license_number: 'SE-10003', license_expiry_date: '2026-09-30',
    coverage_area: 'الدمام، الخبر، الظهران',
    description: 'مكتب التميز الإنشائي يقدم خدمات هندسة الميكانيكا والكهرباء والسباكة.',
    phone: '0503334455', city: 'الدمام', office_type: 'مكتب هندسي كهروميكانيكي',
    years_of_experience: '3-5 سنوات', is_verified: true, is_active: true },
]).throwOnError());

await step('supervisors', () => admin.from('supervisors').upsert({ id: supId, phone: '0509998877' }).throwOnError());

// 5. SERVICE CATALOG ──────────────────────────────────────────────────────────
console.log('6) Inserting service catalog (30 services)…');
const services = [
  // التصميم المعماري
  { office_id: office1Id, category: 'architectural_design', sub_category: 'residential_plans',     pricing_model: 'fixed',  price: 8500 },
  { office_id: office1Id, category: 'architectural_design', sub_category: 'commercial_plans',      pricing_model: 'fixed',  price: 14000 },
  { office_id: office1Id, category: 'architectural_design', sub_category: 'architectural_facades', pricing_model: 'fixed',  price: 6000 },
  { office_id: office1Id, category: 'architectural_design', sub_category: 'interior_design',       pricing_model: 'per_m2', price: 120 },
  // الهندسة الإنشائية
  { office_id: office1Id, category: 'structural_engineering', sub_category: 'reinforced_concrete',   pricing_model: 'per_m2', price: 85 },
  { office_id: office2Id, category: 'structural_engineering', sub_category: 'steel_structures',      pricing_model: 'fixed',  price: 22000 },
  { office_id: office2Id, category: 'structural_engineering', sub_category: 'structural_assessment', pricing_model: 'fixed',  price: 7500 },
  { office_id: office2Id, category: 'structural_engineering', sub_category: 'reinforced_concrete',   pricing_model: 'per_m2', price: 90 },
  // MEP
  { office_id: office3Id, category: 'mep_engineering', sub_category: 'electrical_systems', pricing_model: 'fixed',  price: 11000 },
  { office_id: office3Id, category: 'mep_engineering', sub_category: 'hvac_systems',       pricing_model: 'per_m2', price: 95 },
  { office_id: office3Id, category: 'mep_engineering', sub_category: 'plumbing',           pricing_model: 'fixed',  price: 9500 },
  { office_id: office3Id, category: 'mep_engineering', sub_category: 'fire_systems',       pricing_model: 'fixed',  price: 13000 },
  // الاستشارات الهندسية
  { office_id: office1Id, category: 'permits_consulting', sub_category: 'structural_consultations',    pricing_model: 'fixed', price: 4500 },
  { office_id: office1Id, category: 'permits_consulting', sub_category: 'architectural_consultations', pricing_model: 'fixed', price: 4000 },
  { office_id: office3Id, category: 'permits_consulting', sub_category: 'feasibility_studies',         pricing_model: 'fixed', price: 12000 },
  { office_id: office3Id, category: 'permits_consulting', sub_category: 'building_permits',            pricing_model: 'fixed', price: 3500 },
  // الإشراف على التشييد
  { office_id: office2Id, category: 'construction_supervision', sub_category: 'full_supervision', pricing_model: 'per_m2', price: 65 },
  { office_id: office2Id, category: 'construction_supervision', sub_category: 'periodic_visits',  pricing_model: 'fixed',  price: 6000 },
  { office_id: office2Id, category: 'construction_supervision', sub_category: 'progress_reports', pricing_model: 'fixed',  price: 2800 },
  { office_id: office1Id, category: 'construction_supervision', sub_category: 'full_supervision', pricing_model: 'per_m2', price: 70 },
  // إدارة المشاريع
  { office_id: office1Id, category: 'full_construction', sub_category: 'residential_pm',     pricing_model: 'fixed',  price: 18000 },
  { office_id: office1Id, category: 'full_construction', sub_category: 'commercial_pm',      pricing_model: 'fixed',  price: 28000 },
  { office_id: office1Id, category: 'full_construction', sub_category: 'scheduling_planning',pricing_model: 'fixed',  price: 9000 },
  { office_id: office2Id, category: 'full_construction', sub_category: 'concrete_works',     pricing_model: 'per_m2', price: 1400 },
  // أعمال التشطيبات
  { office_id: office1Id, category: 'finishing_works', sub_category: 'standard_finishing',  pricing_model: 'per_m2', price: 750 },
  { office_id: office1Id, category: 'finishing_works', sub_category: 'premium_finishing',   pricing_model: 'per_m2', price: 1350 },
  { office_id: office2Id, category: 'finishing_works', sub_category: 'interior_decoration', pricing_model: 'fixed',  price: 25000 },
  // المساحة والرفع الطبوغرافي
  { office_id: office3Id, category: 'surveying_geomatics', sub_category: 'topographic_survey',     pricing_model: 'fixed', price: 5500 },
  { office_id: office3Id, category: 'surveying_geomatics', sub_category: 'land_survey',            pricing_model: 'fixed', price: 3800 },
  { office_id: office3Id, category: 'surveying_geomatics', sub_category: 'boundary_determination', pricing_model: 'fixed', price: 4200 },
];
await step('service_catalog', () => admin.from('service_catalog').insert(services).throwOnError());

// 6. TEMPLATES ────────────────────────────────────────────────────────────────
console.log('7) Inserting templates (9)…');
await step('templates', () => admin.from('templates').insert([
  { office_id: office1Id, title: 'مخططات فيلا سكنية دور وملحق',
    description: 'مجموعة مخططات كاملة لفيلا سكنية بمساحة 400م² تشمل الدور الأرضي وملحق العمالة مع جميع التفاصيل.',
    price: 2800, category: 'architectural_design', sub_category: 'residential_plans',
    preview_image_url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
    included_files: 'مخططات معمارية PDF، مخططات إنشائية، جداول الكميات، ملفات DWG',
    is_approved: true, is_available: true },
  { office_id: office1Id, title: 'مخططات عمارة شقق سكنية (8 وحدات)',
    description: 'مجموعة مخططات احترافية لعمارة شقق سكنية من 4 أدوار بإجمالي 8 شقق.',
    price: 4500, category: 'architectural_design', sub_category: 'commercial_plans',
    preview_image_url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
    included_files: 'مخططات معمارية PDF، مخططات كهربائية، مخططات صرف صحي، ملفات CAD',
    is_approved: true, is_available: true },
  { office_id: office1Id, title: 'تقرير جدوى إنشائية لمشروع تجاري',
    description: 'نموذج دراسة جدوى إنشائية متكاملة للمشاريع التجارية.',
    price: 1800, category: 'permits_consulting', sub_category: 'feasibility_studies',
    preview_image_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
    included_files: 'تقرير PDF تفصيلي، جداول بيانات Excel، ملاحق فنية',
    is_approved: true, is_available: true },
  { office_id: office2Id, title: 'مخططات إنشائية لفيلا خرسانية',
    description: 'مجموعة مخططات إنشائية متكاملة لفيلا سكنية خرسانية مسلحة.',
    price: 3200, category: 'structural_engineering', sub_category: 'reinforced_concrete',
    preview_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    included_files: 'مخططات إنشائية PDF، مخططات أساسات، جداول حديد التسليح، ملفات DWG',
    is_approved: true, is_available: true },
  { office_id: office2Id, title: 'نموذج خطة إشراف هندسي شامل',
    description: 'خطة إشراف هندسية نموذجية للمشاريع السكنية.',
    price: 1200, category: 'construction_supervision', sub_category: 'full_supervision',
    preview_image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    included_files: 'خطة الإشراف PDF، نماذج تقارير الزيارات، قوائم فحص الجودة',
    is_approved: true, is_available: true },
  { office_id: office2Id, title: 'مخططات إنشائية لعمارة تجارية',
    description: 'حزمة مخططات إنشائية كاملة لمبنى تجاري من 6 أدوار.',
    price: 5500, category: 'structural_engineering', sub_category: 'steel_structures',
    preview_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    included_files: 'مخططات إنشائية PDF، حسابات إنشائية، جداول الكميات، ملفات AutoCAD',
    is_approved: true, is_available: true },
  { office_id: office3Id, title: 'مخططات كهربائية وميكانيكية لفيلا',
    description: 'حزمة مخططات MEP كاملة لفيلا سكنية.',
    price: 2200, category: 'mep_engineering', sub_category: 'electrical_systems',
    preview_image_url: 'https://images.unsplash.com/photo-1621905251189-08b45249ff78?w=800&q=80',
    included_files: 'مخططات كهربائية PDF، مخططات HVAC، مخططات سباكة، ملفات DWG',
    is_approved: true, is_available: true },
  { office_id: office3Id, title: 'تقرير رفع مساحي طبوغرافي',
    description: 'نموذج تقرير رفع مساحي طبوغرافي احترافي.',
    price: 1500, category: 'surveying_geomatics', sub_category: 'topographic_survey',
    preview_image_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80',
    included_files: 'تقرير مساحي PDF، خرائط طبوغرافية، بيانات جيوديزية، ملفات DXF',
    is_approved: true, is_available: true },
  { office_id: office3Id, title: 'حزمة استشارات هندسية للمشاريع الصغيرة',
    description: 'حزمة استشارية متكاملة للمشاريع السكنية الصغيرة.',
    price: 950, category: 'permits_consulting', sub_category: 'building_permits',
    preview_image_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
    included_files: 'قائمة متطلبات الترخيص، نماذج الطلبات، دليل الإجراءات PDF',
    is_approved: true, is_available: true },
]).throwOnError());

// 7. PORTFOLIO ─────────────────────────────────────────────────────────────────
console.log('8) Inserting portfolio items…');
await step('portfolio', () => admin.from('portfolio').insert([
  { office_id: office1Id, project_title: 'فيلا راقية — حي النرجس، الرياض',
    description: 'تصميم معماري وإنشائي متكامل لفيلا فاخرة',
    image_url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80', location: 'الرياض' },
  { office_id: office1Id, project_title: 'مجمع تجاري — جدة الشمالية',
    description: 'تصميم وإشراف على مجمع تجاري متعدد الطوابق',
    image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80', location: 'جدة' },
  { office_id: office1Id, project_title: 'عمارة سكنية — المدينة المنورة',
    description: 'إدارة كاملة لمشروع عمارة شقق سكنية',
    image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', location: 'المدينة المنورة' },
  { office_id: office2Id, project_title: 'برج تجاري — الدمام',
    description: 'تصميم إنشائي لبرج تجاري من 15 طابقاً',
    image_url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80', location: 'الدمام' },
  { office_id: office2Id, project_title: 'مستودعات صناعية — الجبيل',
    description: 'إشراف على إنشاء مجمع مستودعات صناعية',
    image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80', location: 'الجبيل' },
  { office_id: office3Id, project_title: 'مشروع MEP — المنطقة الشرقية',
    description: 'تصميم وتركيب أنظمة MEP كاملة لمجمع سكني',
    image_url: 'https://images.unsplash.com/photo-1621905251189-08b45249ff78?w=800&q=80', location: 'الخبر' },
  { office_id: office3Id, project_title: 'رفع مساحي — مشاريع أرامكو',
    description: 'رفع مساحي طبوغرافي دقيق لمواقع متعددة',
    image_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80', location: 'الظهران' },
]).throwOnError());

// 8. PROJECT REQUESTS ─────────────────────────────────────────────────────────
console.log('9) Inserting project requests…');
await step('project_requests', () => admin.from('project_requests').insert([
  { request_id: REQ1_ID, client_id: clientId,
    title: 'تصميم فيلا سكنية دور وملحق — الرياض',
    description: 'أحتاج تصميماً معمارياً وإنشائياً لفيلا سكنية بمساحة أرض 400م² في حي النرجس.',
    location: 'الرياض', budget_range: '15,000 - 25,000 ريال', status: 'approved' },
  { request_id: REQ2_ID, client_id: clientId,
    title: 'إشراف هندسي على بناء عمارة سكنية',
    description: 'مطلوب إشراف هندسي كامل على مشروع عمارة شقق سكنية من 4 أدوار بمدينة جدة.',
    location: 'جدة', budget_range: '20,000 - 35,000 ريال', status: 'pending' },
  { request_id: REQ3_ID, client_id: clientId,
    title: 'مخططات كهروميكانيكية لمبنى تجاري',
    description: 'نحتاج مخططات MEP كاملة لمبنى تجاري من 3 طوابق في الدمام.',
    location: 'الدمام', budget_range: '12,000 - 20,000 ريال', status: 'approved' },
]).throwOnError());

// 9. BIDS ─────────────────────────────────────────────────────────────────────
console.log('10) Inserting bids…');
const nowMinus3d = new Date(Date.now() - 3*86400000).toISOString();
const nowMinus2d = new Date(Date.now() - 2*86400000).toISOString();
const nowMinus1d = new Date(Date.now() - 1*86400000).toISOString();
await step('bids', () => admin.from('bids').insert([
  { bid_id: BID1_ID, request_id: REQ1_ID, office_id: office1Id, price: 18500, timeline: 21, status: 'submitted', submitted_at: nowMinus3d },
  { bid_id: BID2_ID, request_id: REQ1_ID, office_id: office2Id, price: 22000, timeline: 28, status: 'submitted', submitted_at: nowMinus2d },
  { bid_id: BID3_ID, request_id: REQ3_ID, office_id: office3Id, price: 15500, timeline: 14, status: 'submitted', submitted_at: nowMinus1d },
]).throwOnError());

// 10. CONVERSATIONS + MESSAGES ────────────────────────────────────────────────
console.log('11) Inserting conversations & messages…');
await step('conversations', () => admin.from('conversations').insert([
  { id: CONV1_ID, type: 'bid', reference_id: REQ1_ID,
    reference_title: 'تصميم فيلا سكنية دور وملحق — الرياض',
    client_id: clientId, office_id: office1Id,
    created_at: nowMinus3d, updated_at: new Date(Date.now() - 3600000).toISOString() },
  { id: CONV2_ID, type: 'bid', reference_id: REQ3_ID,
    reference_title: 'مخططات كهروميكانيكية لمبنى تجاري',
    client_id: clientId, office_id: office3Id,
    created_at: nowMinus1d, updated_at: new Date(Date.now() - 1800000).toISOString() },
]).throwOnError());

await step('messages', () => admin.from('messages').insert([
  { conversation_id: CONV1_ID, sender_id: clientId,
    content: 'السلام عليكم، اطلعت على عرضكم وأجد أنه مناسب. هل يمكن معرفة المزيد عن خبراتكم؟',
    created_at: nowMinus3d },
  { conversation_id: CONV1_ID, sender_id: office1Id,
    content: 'وعليكم السلام ورحمة الله. نعم بكل سرور. نحن متخصصون في تصميم الفلل ولدينا خبرة أكثر من 12 سنة.',
    created_at: new Date(Date.now() - 2.5*86400000).toISOString() },
  { conversation_id: CONV1_ID, sender_id: clientId,
    content: 'أود الاطلاع على أعمالكم. وهل يمكن تعديل التصميم بعد الاتفاق؟',
    created_at: nowMinus2d },
  { conversation_id: CONV1_ID, sender_id: office1Id,
    content: 'بالتأكيد، نوفر جلستين تعديل مجانيتين ضمن العقد وصور ثلاثية الأبعاد للمشروع.',
    created_at: new Date(Date.now() - 1.25*86400000).toISOString() },
  { conversation_id: CONV1_ID, sender_id: clientId,
    content: 'ممتاز، سأتواصل معكم لتحديد موعد للاجتماع.',
    created_at: new Date(Date.now() - 3600000).toISOString() },
  { conversation_id: CONV2_ID, sender_id: clientId,
    content: 'مرحباً، هل عندكم خبرة في مخططات MEP للمباني التجارية من 3 طوابق؟',
    created_at: nowMinus1d },
  { conversation_id: CONV2_ID, sender_id: office3Id,
    content: 'أهلاً بك. نعم لدينا خبرة واسعة. كم مساحة المبنى تقريباً؟',
    created_at: new Date(Date.now() - 1800000).toISOString() },
]).throwOnError());

// 11. CONTRACT + PROJECT + MILESTONES ─────────────────────────────────────────
console.log('12) Inserting contract, project, milestones…');
await step('contracts', () => admin.from('contracts').insert({
  contract_id: CONTRACT1_ID, client_id: clientId, office_id: office1Id,
  title: 'عقد تصميم فيلا سكنية',
  description: 'عقد تصميم معماري وإنشائي لفيلا سكنية بحي النرجس، الرياض. مساحة الأرض 400م².',
  is_client_signed: true, is_office_signed: true,
  created_at: new Date(Date.now() - 10*86400000).toISOString(),
}).throwOnError());

await step('projects', () => admin.from('projects').insert({
  project_id: PROJECT1_ID, contract_id: CONTRACT1_ID,
  title: 'تصميم فيلا النرجس',
  description: 'مشروع تصميم فيلا سكنية راقية في حي النرجس بالرياض',
  status: 'active', progress_percentage: 35,
  start_date: new Date(Date.now() - 8*86400000).toISOString().split('T')[0],
}).throwOnError());

await step('milestones', () => admin.from('milestones').insert([
  { milestone_id: MS1_ID, project_id: PROJECT1_ID,
    title: 'الدراسة والتخطيط الأولي',
    description: 'إعداد المخططات الأولية والرسومات المبدئية',
    due_date: new Date(Date.now() + 7*86400000).toISOString().split('T')[0], status: 'approved' },
  { milestone_id: MS2_ID, project_id: PROJECT1_ID,
    title: 'المخططات المعمارية الكاملة',
    description: 'إنجاز جميع المخططات المعمارية التفصيلية',
    due_date: new Date(Date.now() + 21*86400000).toISOString().split('T')[0], status: 'pending' },
]).throwOnError());

// 12. NOTIFICATIONS ───────────────────────────────────────────────────────────
console.log('13) Inserting notifications…');
await step('notifications', () => admin.from('notifications').insert([
  { user_id: clientId,  message: 'تلقيت عرضاً جديداً على طلبك: تصميم فيلا سكنية دور وملحق', is_read: false, created_at: nowMinus3d },
  { user_id: clientId,  message: 'تلقيت عرضاً من مكتب البناء الحديث على طلبك', is_read: false, created_at: nowMinus2d },
  { user_id: clientId,  message: 'تم قبول طلبك: مخططات كهروميكانيكية لمبنى تجاري', is_read: true, created_at: nowMinus1d },
  { user_id: office1Id, message: 'طلب حجز مباشر جديد من عميل: أحمد العمراني', is_read: false, created_at: new Date(Date.now() - 5*3600000).toISOString() },
  { user_id: office1Id, message: 'تم قبول العقد من قِبل العميل — مشروع فيلا النرجس', is_read: true, created_at: new Date(Date.now() - 9*86400000).toISOString() },
  { user_id: office3Id, message: 'رسالة جديدة من عميل بخصوص مخططات MEP', is_read: false, created_at: new Date(Date.now() - 1800000).toISOString() },
  { user_id: supId,     message: 'طلب تسجيل مكتب جديد في انتظار المراجعة', is_read: false, created_at: nowMinus1d },
]).throwOnError());

console.log('\n✅ Seed completed successfully!\n');
console.log('Demo accounts:');
console.log('  client@omran.demo     / Demo@1234');
console.log('  office@omran.demo     / Demo@1234  (main demo office)');
console.log('  office2@omran.demo    / Demo@1234');
console.log('  office3@omran.demo    / Demo@1234');
console.log('  supervisor@omran.demo / Demo@1234\n');
