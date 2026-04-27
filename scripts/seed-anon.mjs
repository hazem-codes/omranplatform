/**
 * Omran Platform — Full Seed via Auth API (no service_role key required)
 * Usage: node scripts/seed-anon.mjs
 *
 * Signs up / signs in all 5 demo accounts, then seeds all data using
 * each user's own access token so RLS is satisfied.
 */

const BASE = 'https://elrktkqvuintknmvnkkp.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscmt0a3F2dWludGtubXZua2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MzQ5MTUsImV4cCI6MjA5MjQxMDkxNX0.sf8Wad2UV5e_uWl-QGCbsy91GKKssU4jbKVSnO95iHg';

// ─── helpers ─────────────────────────────────────────────────────────────────

function authHeaders(token) {
  return {
    'apikey': ANON,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function rest(method, path, token, body) {
  const res = await fetch(`${BASE}/rest/v1/${path}`, {
    method,
    headers: {
      ...authHeaders(token),
      'Prefer': 'return=minimal,resolution=merge-duplicates',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path}: ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function upsert(path, token, body) {
  return rest('POST', path, token, Array.isArray(body) ? body : [body]);
}

async function update(path, token, query, body) {
  const res = await fetch(`${BASE}/rest/v1/${path}?${query}`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(token),
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH ${path}: ${text}`);
  }
}

async function signUp(email, password, meta) {
  const res = await fetch(`${BASE}/auth/v1/signup`, {
    method: 'POST',
    headers: { 'apikey': ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, data: meta }),
  });
  const data = await res.json();
  if (data.error && data.error !== 'User already registered') {
    throw new Error(`signUp(${email}): ${data.msg || data.error}`);
  }
  if (data.access_token) return { id: data.user.id, token: data.access_token };
  // User already exists — sign in
  return signIn(email, password);
}

async function signIn(email, password) {
  const res = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`signIn(${email}): ${data.msg || JSON.stringify(data)}`);
  return { id: data.user.id, token: data.access_token };
}

function ok(label) { console.log(`  ✅ ${label}`); }
function warn(label, msg) { console.warn(`  ⚠  ${label}: ${msg}`); }

// ─── MAIN ────────────────────────────────────────────────────────────────────
console.log('\n🌱 Omran Platform — Full Seed (anon mode)\n');

// 1. Create / authenticate all 5 demo users
console.log('1) Authenticating demo users…');
const client = await signUp('client@omran.demo',     'Demo@1234', { name: 'أحمد العمراني',        role: 'client' });
const off1   = await signUp('office@omran.demo',     'Demo@1234', { name: 'مكتب عمران الهندسي',   role: 'engineering_office' });
const off2   = await signUp('office2@omran.demo',    'Demo@1234', { name: 'مكتب البناء الحديث',   role: 'engineering_office' });
const off3   = await signUp('office3@omran.demo',    'Demo@1234', { name: 'مكتب التميز الإنشائي', role: 'engineering_office' });
const sup    = await signUp('supervisor@omran.demo', 'Demo@1234', { name: 'المشرف العام',          role: 'supervisor' });
ok(`client=${client.id.slice(0,8)} off1=${off1.id.slice(0,8)} off2=${off2.id.slice(0,8)} off3=${off3.id.slice(0,8)} sup=${sup.id.slice(0,8)}`);

// 2. Update profiles (trigger may have created them with wrong name/role)
console.log('2) Updating profiles…');
try { await update('profiles', client.token, `id=eq.${client.id}`, { name: 'أحمد العمراني',        role: 'client',              email: 'client@omran.demo' }); } catch(e) { warn('client profile', e.message); }
try { await update('profiles', off1.token,   `id=eq.${off1.id}`,   { name: 'مكتب عمران الهندسي',   role: 'engineering_office',  email: 'office@omran.demo' }); } catch(e) { warn('off1 profile', e.message); }
try { await update('profiles', off2.token,   `id=eq.${off2.id}`,   { name: 'مكتب البناء الحديث',   role: 'engineering_office',  email: 'office2@omran.demo' }); } catch(e) { warn('off2 profile', e.message); }
try { await update('profiles', off3.token,   `id=eq.${off3.id}`,   { name: 'مكتب التميز الإنشائي', role: 'engineering_office',  email: 'office3@omran.demo' }); } catch(e) { warn('off3 profile', e.message); }
try { await update('profiles', sup.token,    `id=eq.${sup.id}`,    { name: 'المشرف العام',          role: 'supervisor',          email: 'supervisor@omran.demo' }); } catch(e) { warn('sup profile', e.message); }
ok('profiles updated');

// 3. Role-specific tables
console.log('3) Role-specific rows…');
try { await upsert('clients',     client.token, { id: client.id, phone: '0512345678', is_active: true }); ok('clients'); } catch(e) { warn('clients', e.message); }
try { await upsert('supervisors', sup.token,    { id: sup.id,    phone: '0508888999' }); ok('supervisors'); } catch(e) { warn('supervisors', e.message); }

// Engineering offices — is_verified+is_active required for marketplace visibility
const offices = [
  { id: off1.id, token: off1.token,
    row: { id: off1.id, license_number: 'SE-10001', license_expiry_date: '2027-12-31',
           coverage_area: 'الرياض، جدة، الدمام',
           description: 'مكتب هندسي متكامل متخصص في التصميم المعماري والإنشائي وإدارة المشاريع.',
           phone: '0501112233', city: 'الرياض', office_type: 'مكتب هندسي متكامل (جميع التخصصات)',
           years_of_experience: 'أكثر من 10 سنوات', is_verified: true, is_active: true } },
  { id: off2.id, token: off2.token,
    row: { id: off2.id, license_number: 'SE-10002', license_expiry_date: '2026-06-30',
           coverage_area: 'جدة، مكة المكرمة، المدينة المنورة',
           description: 'مكتب البناء الحديث متخصص في الهندسة الإنشائية والإشراف على التشييد.',
           phone: '0502223344', city: 'جدة', office_type: 'مكتب هندسي إنشائي',
           years_of_experience: '5-10 سنوات', is_verified: true, is_active: true } },
  { id: off3.id, token: off3.token,
    row: { id: off3.id, license_number: 'SE-10003', license_expiry_date: '2026-09-30',
           coverage_area: 'الدمام، الخبر، الظهران',
           description: 'مكتب التميز الإنشائي متخصص في هندسة MEP والمساحة والرفع الطبوغرافي.',
           phone: '0503334455', city: 'الدمام', office_type: 'مكتب هندسي كهروميكانيكي',
           years_of_experience: '5-10 سنوات', is_verified: true, is_active: true } },
];
for (const o of offices) {
  try { await upsert('engineering_offices', o.token, o.row); ok(`engineering_offices ${o.id.slice(0,8)}`); }
  catch(e) { warn(`engineering_offices ${o.id.slice(0,8)}`, e.message); }
}

// 3b. Clean existing data for these users
console.log('3b) Cleaning existing data for demo users…');
const officeIds3 = [off1.id, off2.id, off3.id];
for (const [offId, offToken] of [[off1.id, off1.token],[off2.id, off2.token],[off3.id, off3.token]]) {
  try {
    await fetch(`${BASE}/rest/v1/service_catalog?office_id=eq.${offId}`, { method: 'DELETE', headers: authHeaders(offToken) });
    await fetch(`${BASE}/rest/v1/templates?office_id=eq.${offId}`, { method: 'DELETE', headers: authHeaders(offToken) });
    await fetch(`${BASE}/rest/v1/portfolio?office_id=eq.${offId}`, { method: 'DELETE', headers: authHeaders(offToken) });
    ok(`cleaned ${offId.slice(0,8)}`);
  } catch(e) { warn(`clean ${offId.slice(0,8)}`, e.message); }
}
try {
  await fetch(`${BASE}/rest/v1/project_requests?client_id=eq.${client.id}`, { method: 'DELETE', headers: authHeaders(client.token) });
  ok(`cleaned client requests`);
} catch(e) { warn('clean requests', e.message); }
try {
  await fetch(`${BASE}/rest/v1/messages?sender_id=eq.${client.id}`, { method: 'DELETE', headers: authHeaders(client.token) });
  ok(`cleaned client messages`);
} catch(e) {}

// 4. Service catalog (30 services, 10 per office)
console.log('4) Service catalog…');
const catalog = [
  // Office 1 — التصميم المعماري + إدارة المشاريع + أعمال التشطيبات
  { office_id: off1.id, token: off1.token, category: 'architectural_design', sub_category: 'residential_plans',    pricing_model: 'fixed',  price: 12000 },
  { office_id: off1.id, token: off1.token, category: 'architectural_design', sub_category: 'commercial_plans',    pricing_model: 'fixed',  price: 28000 },
  { office_id: off1.id, token: off1.token, category: 'architectural_design', sub_category: 'architectural_facades', pricing_model: 'fixed', price: 18000 },
  { office_id: off1.id, token: off1.token, category: 'architectural_design', sub_category: 'interior_design',     pricing_model: 'fixed',  price: 15000 },
  { office_id: off1.id, token: off1.token, category: 'full_construction',    sub_category: 'residential_pm',      pricing_model: 'fixed',  price: 18000 },
  { office_id: off1.id, token: off1.token, category: 'full_construction',    sub_category: 'commercial_pm',       pricing_model: 'fixed',  price: 28000 },
  { office_id: off1.id, token: off1.token, category: 'full_construction',    sub_category: 'scheduling_planning', pricing_model: 'fixed',  price: 9000 },
  { office_id: off1.id, token: off1.token, category: 'finishing_works',      sub_category: 'standard_finishing',  pricing_model: 'per_m2', price: 750 },
  { office_id: off1.id, token: off1.token, category: 'finishing_works',      sub_category: 'premium_finishing',   pricing_model: 'per_m2', price: 1350 },
  { office_id: off1.id, token: off1.token, category: 'permits_consulting',   sub_category: 'building_permits',    pricing_model: 'fixed',  price: 5000 },
  // Office 2 — الهندسة الإنشائية + الإشراف
  { office_id: off2.id, token: off2.token, category: 'structural_engineering', sub_category: 'reinforced_concrete',  pricing_model: 'fixed',  price: 22000 },
  { office_id: off2.id, token: off2.token, category: 'structural_engineering', sub_category: 'steel_structures',     pricing_model: 'fixed',  price: 35000 },
  { office_id: off2.id, token: off2.token, category: 'structural_engineering', sub_category: 'structural_assessment', pricing_model: 'fixed', price: 8000 },
  { office_id: off2.id, token: off2.token, category: 'construction_supervision', sub_category: 'full_supervision',  pricing_model: 'fixed',  price: 20000 },
  { office_id: off2.id, token: off2.token, category: 'construction_supervision', sub_category: 'periodic_visits',   pricing_model: 'fixed',  price: 7000 },
  { office_id: off2.id, token: off2.token, category: 'construction_supervision', sub_category: 'progress_reports',  pricing_model: 'fixed',  price: 3500 },
  { office_id: off2.id, token: off2.token, category: 'finishing_works',         sub_category: 'interior_decoration', pricing_model: 'fixed', price: 25000 },
  { office_id: off2.id, token: off2.token, category: 'permits_consulting',      sub_category: 'feasibility_studies', pricing_model: 'fixed', price: 6500 },
  { office_id: off2.id, token: off2.token, category: 'full_construction',       sub_category: 'concrete_works',     pricing_model: 'per_m2', price: 1400 },
  { office_id: off2.id, token: off2.token, category: 'structural_engineering',  sub_category: 'reinforced_concrete', pricing_model: 'per_m2', price: 450 },
  // Office 3 — MEP + مساحة + استشارات
  { office_id: off3.id, token: off3.token, category: 'mep_engineering',     sub_category: 'electrical_systems',   pricing_model: 'fixed',  price: 12000 },
  { office_id: off3.id, token: off3.token, category: 'mep_engineering',     sub_category: 'hvac_systems',         pricing_model: 'fixed',  price: 15000 },
  { office_id: off3.id, token: off3.token, category: 'mep_engineering',     sub_category: 'plumbing',             pricing_model: 'fixed',  price: 9000 },
  { office_id: off3.id, token: off3.token, category: 'mep_engineering',     sub_category: 'fire_systems',         pricing_model: 'fixed',  price: 11000 },
  { office_id: off3.id, token: off3.token, category: 'surveying_geomatics', sub_category: 'topographic_survey',   pricing_model: 'fixed',  price: 5500 },
  { office_id: off3.id, token: off3.token, category: 'surveying_geomatics', sub_category: 'land_survey',          pricing_model: 'fixed',  price: 3800 },
  { office_id: off3.id, token: off3.token, category: 'surveying_geomatics', sub_category: 'boundary_determination', pricing_model: 'fixed', price: 4200 },
  { office_id: off3.id, token: off3.token, category: 'permits_consulting',  sub_category: 'structural_consultations', pricing_model: 'fixed', price: 4500 },
  { office_id: off3.id, token: off3.token, category: 'permits_consulting',  sub_category: 'architectural_consultations', pricing_model: 'fixed', price: 3800 },
  { office_id: off3.id, token: off3.token, category: 'construction_supervision', sub_category: 'full_supervision', pricing_model: 'per_m2', price: 85 },
];

// Group by office to reduce token switching
const byOffice1 = catalog.filter(r => r.office_id === off1.id);
const byOffice2 = catalog.filter(r => r.office_id === off2.id);
const byOffice3 = catalog.filter(r => r.office_id === off3.id);

async function insertCatalog(rows, token) {
  const payload = rows.map(({ token: _t, ...r }) => r);
  try {
    const res = await fetch(`${BASE}/rest/v1/service_catalog`, {
      method: 'POST',
      headers: { ...authHeaders(token), 'Prefer': 'return=minimal' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) { const t = await res.text(); throw new Error(t); }
    ok(`service_catalog ×${rows.length}`);
  } catch(e) { warn(`service_catalog batch`, e.message); }
}
await insertCatalog(byOffice1, off1.token);
await insertCatalog(byOffice2, off2.token);
await insertCatalog(byOffice3, off3.token);

// 5. Templates (9, 3 per office)
console.log('5) Templates…');
const templates = [
  { office_id: off1.id, token: off1.token,
    title: 'مخططات فيلا سكنية دور وملحق',
    description: 'مجموعة مخططات كاملة لفيلا سكنية بمساحة 400م² تشمل الدور الأرضي وملحق العمالة مع جميع التفاصيل الإنشائية والمعمارية.',
    price: 2800, category: 'architectural_design', sub_category: 'residential_plans',
    preview_image_url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
    included_files: 'مخططات معمارية PDF، مخططات إنشائية، جداول الكميات، ملفات DWG',
    is_approved: true, is_available: true },
  { office_id: off1.id, token: off1.token,
    title: 'مخططات عمارة شقق سكنية (8 وحدات)',
    description: 'مجموعة مخططات احترافية لعمارة شقق سكنية من 4 أدوار بإجمالي 8 شقق.',
    price: 4500, category: 'architectural_design', sub_category: 'commercial_plans',
    preview_image_url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
    included_files: 'مخططات معمارية PDF، مخططات كهربائية، مخططات صرف صحي، ملفات CAD',
    is_approved: true, is_available: true },
  { office_id: off1.id, token: off1.token,
    title: 'تقرير جدوى إنشائية لمشروع تجاري',
    description: 'نموذج دراسة جدوى إنشائية متكاملة للمشاريع التجارية.',
    price: 1800, category: 'permits_consulting', sub_category: 'feasibility_studies',
    preview_image_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
    included_files: 'تقرير PDF تفصيلي، جداول بيانات Excel، ملاحق فنية',
    is_approved: true, is_available: true },
  { office_id: off2.id, token: off2.token,
    title: 'مخططات إنشائية لفيلا خرسانية',
    description: 'مجموعة مخططات إنشائية متكاملة لفيلا سكنية خرسانية مسلحة.',
    price: 3200, category: 'structural_engineering', sub_category: 'reinforced_concrete',
    preview_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    included_files: 'مخططات إنشائية PDF، مخططات أساسات، جداول حديد التسليح، ملفات DWG',
    is_approved: true, is_available: true },
  { office_id: off2.id, token: off2.token,
    title: 'نموذج خطة إشراف هندسي شامل',
    description: 'خطة إشراف هندسية نموذجية للمشاريع السكنية.',
    price: 1200, category: 'construction_supervision', sub_category: 'full_supervision',
    preview_image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    included_files: 'خطة الإشراف PDF، نماذج تقارير الزيارات، قوائم فحص الجودة',
    is_approved: true, is_available: true },
  { office_id: off2.id, token: off2.token,
    title: 'مخططات إنشائية لعمارة تجارية',
    description: 'حزمة مخططات إنشائية كاملة لمبنى تجاري من 6 أدوار.',
    price: 5500, category: 'structural_engineering', sub_category: 'steel_structures',
    preview_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    included_files: 'مخططات إنشائية PDF، حسابات إنشائية، جداول الكميات، ملفات AutoCAD',
    is_approved: true, is_available: true },
  { office_id: off3.id, token: off3.token,
    title: 'مخططات كهربائية وميكانيكية لفيلا',
    description: 'حزمة مخططات MEP كاملة لفيلا سكنية.',
    price: 2200, category: 'mep_engineering', sub_category: 'electrical_systems',
    preview_image_url: 'https://images.unsplash.com/photo-1621905251189-08b45249ff78?w=800&q=80',
    included_files: 'مخططات كهربائية PDF، مخططات HVAC، مخططات سباكة، ملفات DWG',
    is_approved: true, is_available: true },
  { office_id: off3.id, token: off3.token,
    title: 'تقرير مساحي وطبوغرافي شامل',
    description: 'نموذج تقرير مساحي للأراضي والمواقع الإنشائية.',
    price: 1500, category: 'surveying_geomatics', sub_category: 'topographic_survey',
    preview_image_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80',
    included_files: 'تقرير مساحي PDF، خرائط طبوغرافية، بيانات GPS',
    is_approved: true, is_available: true },
  { office_id: off3.id, token: off3.token,
    title: 'نموذج تقرير استشاري هندسي',
    description: 'تقرير استشاري هندسي لتقييم المواقع والمشاريع الإنشائية.',
    price: 900, category: 'permits_consulting', sub_category: 'structural_consultations',
    preview_image_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
    included_files: 'تقرير تقييم PDF، توصيات فنية، ملاحق مصورة',
    is_approved: true, is_available: true },
];

for (const t of templates) {
  const { token, ...row } = t;
  try {
    const res = await fetch(`${BASE}/rest/v1/templates`, {
      method: 'POST',
      headers: { ...authHeaders(token), 'Prefer': 'return=minimal' },
      body: JSON.stringify(row),
    });
    if (!res.ok) { const tx = await res.text(); warn(`template "${row.title}"`, tx); }
    else ok(`template: ${row.title}`);
  } catch(e) { warn(`template`, e.message); }
}

// 6. Portfolio items (3 per office)
// Actual columns: portfolio_id, office_id, project_title, description, category, image_url, completed_at
console.log('6) Portfolio…');
const portfolio = [
  { office_id: off1.id, token: off1.token, project_title: 'فيلا سكنية راقية - الرياض',    description: 'تصميم معماري وإنشائي لفيلا سكنية فاخرة.', category: 'architectural_design', image_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600', completed_at: '2023-12-01' },
  { office_id: off1.id, token: off1.token, project_title: 'مجمع تجاري - حي العليا',       description: 'تصميم وإشراف على مجمع تجاري من 5 طوابق.',   category: 'architectural_design', image_url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600', completed_at: '2022-06-15' },
  { office_id: off1.id, token: off1.token, project_title: 'عمارة سكنية - شرق الرياض',    description: 'إدارة مشروع عمارة شقق سكنية 4 أدوار.',       category: 'full_construction',    image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600', completed_at: '2024-03-20' },
  { office_id: off2.id, token: off2.token, project_title: 'برج تجاري - جدة',              description: 'تصميم إنشائي لبرج تجاري 12 طابق.',            category: 'structural_engineering', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', completed_at: '2023-08-10' },
  { office_id: off2.id, token: off2.token, project_title: 'مشروع إسكان - المدينة',        description: 'إشراف على مشروع وحدات سكنية 50 وحدة.',        category: 'construction_supervision', image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600', completed_at: '2022-11-30' },
  { office_id: off2.id, token: off2.token, project_title: 'فندق - مكة المكرمة',           description: 'تصميم إنشائي لفندق 8 طوابق.',                 category: 'structural_engineering', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', completed_at: '2024-01-15' },
  { office_id: off3.id, token: off3.token, project_title: 'منشأة صناعية - الجبيل',       description: 'تصميم MEP لمصنع.',                            category: 'mep_engineering',      image_url: 'https://images.unsplash.com/photo-1621905251189-08b45249ff78?w=600', completed_at: '2023-05-20' },
  { office_id: off3.id, token: off3.token, project_title: 'مستشفى - الدمام',             description: 'مخططات MEP لمستشفى تخصصي.',                  category: 'mep_engineering',      image_url: 'https://images.unsplash.com/photo-1621905251189-08b45249ff78?w=600', completed_at: '2022-09-01' },
  { office_id: off3.id, token: off3.token, project_title: 'مشروع بنية تحتية - الظهران', description: 'رفع طبوغرافي وتصميم شبكة صرف صحي.',           category: 'surveying_geomatics', image_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600', completed_at: '2024-02-28' },
];
for (const p of portfolio) {
  const { token, ...row } = p;
  try {
    const res = await fetch(`${BASE}/rest/v1/portfolio`, {
      method: 'POST',
      headers: { ...authHeaders(token), 'Prefer': 'return=minimal' },
      body: JSON.stringify(row),
    });
    if (!res.ok) { const tx = await res.text(); warn(`portfolio "${row.project_title}"`, tx); } else ok(`portfolio: ${row.project_title}`);
  } catch(e) { warn('portfolio', e.message); }
}

// 7. Project requests (3, from client)
// Actual columns: request_id, client_id, title, description, status, budget_range, location, target_office_id
console.log('7) Project requests…');
const reqRows = [
  { client_id: client.id, title: 'تصميم فيلا سكنية في الرياض',
    description: 'أحتاج إلى تصميم معماري كامل لفيلا سكنية بمساحة 500م² في حي النرجس، تشمل 4 غرف نوم ومجلسين وملحق خادمة.',
    location: 'الرياض', budget_range: '50000-100000', status: 'open' },
  { client_id: client.id, title: 'إشراف هندسي على مشروع عمارة',
    description: 'مطلوب إشراف هندسي كامل على تشييد عمارة سكنية من 6 أدوار في جدة، مع تقارير دورية.',
    location: 'جدة', budget_range: '30000-50000', status: 'open' },
  { client_id: client.id, title: 'مخططات MEP لمجمع تجاري',
    description: 'مطلوب مخططات كاملة للأنظمة الكهربائية والميكانيكية والسباكة لمجمع تجاري.',
    location: 'الدمام', budget_range: '20000-40000', status: 'open' },
];
const reqIds = [];
for (const r of reqRows) {
  try {
    const res = await fetch(`${BASE}/rest/v1/project_requests`, {
      method: 'POST',
      headers: { ...authHeaders(client.token), 'Prefer': 'return=representation' },
      body: JSON.stringify(r),
    });
    if (!res.ok) { const tx = await res.text(); warn(`request "${r.title}"`, tx); reqIds.push(null); }
    else {
      const data = await res.json();
      const id = Array.isArray(data) ? data[0]?.request_id : data?.request_id;
      reqIds.push(id);
      ok(`project_request: ${r.title} → ${id?.slice(0,8)}`);
    }
  } catch(e) { warn('project_request', e.message); reqIds.push(null); }
}

// 8. Bids (3, from offices on requests)
// Actual columns: bid_id, request_id, office_id, price, timeline, status, submitted_at
console.log('8) Bids…');
const bidDefs = [
  { request_id: reqIds[0], office_id: off1.id, token: off1.token, price: 75000, timeline: 21 },
  { request_id: reqIds[1], office_id: off2.id, token: off2.token, price: 42000, timeline: 90 },
  { request_id: reqIds[2], office_id: off3.id, token: off3.token, price: 28000, timeline: 30 },
];
const bidIds = [];
for (const b of bidDefs) {
  if (!b.request_id) { bidIds.push(null); continue; }
  const { token, ...row } = b;
  try {
    const res = await fetch(`${BASE}/rest/v1/bids`, {
      method: 'POST',
      headers: { ...authHeaders(token), 'Prefer': 'return=representation' },
      body: JSON.stringify(row),
    });
    if (!res.ok) { const tx = await res.text(); warn(`bid`, tx); bidIds.push(null); }
    else {
      const data = await res.json();
      const id = Array.isArray(data) ? data[0]?.bid_id : data?.bid_id;
      bidIds.push(id);
      ok(`bid: off→${row.office_id.slice(0,8)} req→${row.request_id.slice(0,8)}`);
    }
  } catch(e) { warn('bid', e.message); bidIds.push(null); }
}

// 9. Messages (messageService uses messages table directly, no conversations table)
// Actual columns: sender_id, recipient_id, conversation_key, content, created_at
// conversation_key = sorted([senderId, recipientId]).join(':')
console.log('9) Messages…');
function convKey(a, b) { return [a,b].sort().join(':'); }

const msgDefs = [
  { sender_id: client.id, recipient_id: off1.id, token: client.token, content: 'مرحباً، أود الاستفسار عن تصميم فيلا سكنية' },
  { sender_id: off1.id,   recipient_id: client.id, token: off1.token, content: 'أهلاً وسهلاً! يسعدنا مساعدتكم. ما هي متطلباتكم بالتفصيل؟' },
  { sender_id: client.id, recipient_id: off1.id, token: client.token, content: 'أحتاج فيلا بمساحة 500م² في الرياض، 4 غرف نوم.' },
  { sender_id: off1.id,   recipient_id: client.id, token: off1.token, content: 'ممتاز! سنرسل لكم العرض قريباً.' },
  { sender_id: client.id, recipient_id: off2.id, token: client.token, content: 'السلام عليكم، أحتاج إشراف هندسي لعمارة في جدة' },
  { sender_id: off2.id,   recipient_id: client.id, token: off2.token, content: 'وعليكم السلام! لدينا فريق إشراف متخصص. كم عدد الأدوار؟' },
  { sender_id: client.id, recipient_id: off2.id, token: client.token, content: '6 أدوار، التشييد يبدأ الشهر القادم.' },
];
for (const m of msgDefs) {
  const { token, ...row } = m;
  row.conversation_key = convKey(row.sender_id, row.recipient_id);
  try {
    const res = await fetch(`${BASE}/rest/v1/messages`, {
      method: 'POST',
      headers: { ...authHeaders(token), 'Prefer': 'return=minimal' },
      body: JSON.stringify(row),
    });
    if (!res.ok) { const tx = await res.text(); warn('message', tx); }
    else ok(`message ${row.sender_id.slice(0,8)} → ${row.recipient_id.slice(0,8)}`);
  } catch(e) { warn('message', e.message); }
}

// 10. Notifications
// Actual columns: notification_id, user_id, message, is_read, created_at
console.log('10) Notifications…');
const notifDefs = [
  { user_id: client.id, token: client.token, message: 'مكتب عمران الهندسي قدم عرضاً على طلبك', is_read: false },
  { user_id: client.id, token: client.token, message: 'لديك رسالة جديدة من مكتب عمران', is_read: false },
  { user_id: off1.id,   token: off1.token,   message: 'تم نشر طلب مشروع جديد يطابق تخصصكم', is_read: false },
  { user_id: off2.id,   token: off2.token,   message: 'طلب إشراف هندسي جديد في جدة', is_read: false },
  { user_id: off3.id,   token: off3.token,   message: 'تم اعتماد مكتبكم من قِبل المشرف', is_read: true },
];
for (const n of notifDefs) {
  const { token, ...row } = n;
  try {
    const res = await fetch(`${BASE}/rest/v1/notifications`, {
      method: 'POST',
      headers: { ...authHeaders(token), 'Prefer': 'return=minimal' },
      body: JSON.stringify(row),
    });
    if (!res.ok) { const tx = await res.text(); warn('notification', tx); }
    else ok(`notification → ${row.user_id.slice(0,8)}`);
  } catch(e) { warn('notification', e.message); }
}

console.log('\n✅ Seed complete!\n');
console.log('Demo accounts:');
console.log(`  client@omran.demo       / Demo@1234  (id: ${client.id})`);
console.log(`  office@omran.demo       / Demo@1234  (id: ${off1.id})`);
console.log(`  office2@omran.demo      / Demo@1234  (id: ${off2.id})`);
console.log(`  office3@omran.demo      / Demo@1234  (id: ${off3.id})`);
console.log(`  supervisor@omran.demo   / Demo@1234  (id: ${sup.id})`);
