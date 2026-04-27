-- =============================================================================
-- Omran Platform — Full Reset & Reseed
-- Run ONCE in Supabase SQL Editor (Dashboard → SQL Editor → New Query → Run)
-- Idempotent: safe to re-run. Uses fixed UUIDs so re-seeding is clean.
-- =============================================================================

-- ─── Extension ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Fixed UUIDs (used everywhere for cross-table links) ─────────────────────
DO $$
DECLARE
  v_client_id    uuid := 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
  v_office1_id   uuid := 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2';
  v_office2_id   uuid := 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3';
  v_office3_id   uuid := 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4';
  v_super_id     uuid := 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5';

  v_req1_id      uuid := 'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6';
  v_req2_id      uuid := '07070707-0707-0707-0707-070707070707';
  v_req3_id      uuid := '18181818-1818-1818-1818-181818181818';

  v_bid1_id      uuid := '29292929-2929-2929-2929-292929292929';
  v_bid2_id      uuid := '3a3a3a3a-3a3a-3a3a-3a3a-3a3a3a3a3a3a';
  v_bid3_id      uuid := '4b4b4b4b-4b4b-4b4b-4b4b-4b4b4b4b4b4b';

  v_conv1_id     uuid := '5c5c5c5c-5c5c-5c5c-5c5c-5c5c5c5c5c5c';
  v_conv2_id     uuid := '6d6d6d6d-6d6d-6d6d-6d6d-6d6d6d6d6d6d';

  v_contract1_id uuid := '7e7e7e7e-7e7e-7e7e-7e7e-7e7e7e7e7e7e';
  v_project1_id  uuid := '8f8f8f8f-8f8f-8f8f-8f8f-8f8f8f8f8f8f';
  v_ms1_id       uuid := '90909090-9090-9090-9090-909090909090';
  v_ms2_id       uuid := 'a1b2c3d4-a1b2-a1b2-a1b2-a1b2c3d4e5f6';

BEGIN

-- ─── 1. CLEAR ALL DATA (reverse FK order) ────────────────────────────────────
DELETE FROM public.notifications;
DELETE FROM public.reports;
DELETE FROM public.ratings;
DELETE FROM public.payments;
DELETE FROM public.escrow;
DELETE FROM public.milestones;
DELETE FROM public.template_purchases;
DELETE FROM public.contracts;
DELETE FROM public.messages;
DELETE FROM public.conversations;
DELETE FROM public.bids;
DELETE FROM public.project_requests;
DELETE FROM public.projects;
DELETE FROM public.portfolio;
DELETE FROM public.templates;
DELETE FROM public.service_catalog;
DELETE FROM public.engineering_offices;
DELETE FROM public.supervisors;
DELETE FROM public.clients;
DELETE FROM public.public_profiles WHERE id IN (v_client_id, v_office1_id, v_office2_id, v_office3_id, v_super_id);
DELETE FROM public.profiles WHERE id IN (v_client_id, v_office1_id, v_office2_id, v_office3_id, v_super_id);

-- Delete auth identities before users
DELETE FROM auth.identities WHERE user_id IN (v_client_id, v_office1_id, v_office2_id, v_office3_id, v_super_id);
DELETE FROM auth.users WHERE id IN (v_client_id, v_office1_id, v_office2_id, v_office3_id, v_super_id);

-- ─── 2. CREATE AUTH USERS ─────────────────────────────────────────────────────

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) VALUES
  (v_client_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'client@omran.demo',  crypt('Demo@1234', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}'::jsonb,
   '{"name":"أحمد العمراني","role":"client"}'::jsonb,
   now(), now(), '', '', '', ''),

  (v_office1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'office@omran.demo',  crypt('Demo@1234', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}'::jsonb,
   '{"name":"مكتب عمران الهندسي","role":"engineering_office"}'::jsonb,
   now(), now(), '', '', '', ''),

  (v_office2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'office2@omran.demo', crypt('Demo@1234', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}'::jsonb,
   '{"name":"مكتب البناء الحديث","role":"engineering_office"}'::jsonb,
   now(), now(), '', '', '', ''),

  (v_office3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'office3@omran.demo', crypt('Demo@1234', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}'::jsonb,
   '{"name":"مكتب التميز الإنشائي","role":"engineering_office"}'::jsonb,
   now(), now(), '', '', '', ''),

  (v_super_id,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'supervisor@omran.demo', crypt('Demo@1234', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}'::jsonb,
   '{"name":"المشرف العام","role":"supervisor"}'::jsonb,
   now(), now(), '', '', '', '');

-- Auth identities (required for email/password login)
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  (gen_random_uuid(), v_client_id,  'client@omran.demo',
   json_build_object('sub', v_client_id::text, 'email', 'client@omran.demo')::jsonb,
   'email', now(), now(), now()),
  (gen_random_uuid(), v_office1_id, 'office@omran.demo',
   json_build_object('sub', v_office1_id::text, 'email', 'office@omran.demo')::jsonb,
   'email', now(), now(), now()),
  (gen_random_uuid(), v_office2_id, 'office2@omran.demo',
   json_build_object('sub', v_office2_id::text, 'email', 'office2@omran.demo')::jsonb,
   'email', now(), now(), now()),
  (gen_random_uuid(), v_office3_id, 'office3@omran.demo',
   json_build_object('sub', v_office3_id::text, 'email', 'office3@omran.demo')::jsonb,
   'email', now(), now(), now()),
  (gen_random_uuid(), v_super_id,   'supervisor@omran.demo',
   json_build_object('sub', v_super_id::text, 'email', 'supervisor@omran.demo')::jsonb,
   'email', now(), now(), now());

-- ─── 3. PROFILES ─────────────────────────────────────────────────────────────
INSERT INTO public.profiles (id, name, email, role) VALUES
  (v_client_id,  'أحمد العمراني',         'client@omran.demo',     'client'),
  (v_office1_id, 'مكتب عمران الهندسي',    'office@omran.demo',     'engineering_office'),
  (v_office2_id, 'مكتب البناء الحديث',    'office2@omran.demo',    'engineering_office'),
  (v_office3_id, 'مكتب التميز الإنشائي',  'office3@omran.demo',    'engineering_office'),
  (v_super_id,   'المشرف العام',           'supervisor@omran.demo', 'supervisor');

-- ─── 4. ROLE-SPECIFIC ROWS ───────────────────────────────────────────────────
INSERT INTO public.clients (id, phone, is_active) VALUES
  (v_client_id, '0512345678', true);

INSERT INTO public.engineering_offices (
  id, license_number, license_expiry_date, coverage_area, description,
  phone, city, office_type, years_of_experience, is_verified, is_active
) VALUES
  (v_office1_id, 'SE-10001', '2027-12-31',
   'الرياض، جدة، الدمام',
   'مكتب هندسي متكامل متخصص في التصميم المعماري والإنشائي وإدارة المشاريع. خبرة أكثر من 12 سنة في السوق السعودي.',
   '0501112233', 'الرياض', 'مكتب هندسي متكامل (جميع التخصصات)', 'أكثر من 10 سنوات',
   true, true),

  (v_office2_id, 'SE-10002', '2026-06-30',
   'جدة، مكة المكرمة، المدينة المنورة',
   'مكتب البناء الحديث متخصص في الهندسة الإنشائية والإشراف على التشييد. نفذنا أكثر من 200 مشروع.',
   '0502223344', 'جدة', 'مكتب هندسي إنشائي', '5-10 سنوات',
   true, true),

  (v_office3_id, 'SE-10003', '2026-09-30',
   'الدمام، الخبر، الظهران',
   'مكتب التميز الإنشائي يقدم خدمات هندسة الميكانيكا والكهرباء والسباكة والاستشارات الهندسية.',
   '0503334455', 'الدمام', 'مكتب هندسي كهروميكانيكي', '3-5 سنوات',
   true, true);

INSERT INTO public.supervisors (id, phone) VALUES
  (v_super_id, '0509998877');

-- ─── 5. SERVICE CATALOG (30 services, ~4 per category) ───────────────────────

INSERT INTO public.service_catalog (catalog_id, office_id, category, sub_category, pricing_model, price) VALUES
  -- التصميم المعماري (office1)
  (gen_random_uuid(), v_office1_id, 'architectural_design', 'residential_plans',     'fixed',  8500),
  (gen_random_uuid(), v_office1_id, 'architectural_design', 'commercial_plans',      'fixed',  14000),
  (gen_random_uuid(), v_office1_id, 'architectural_design', 'architectural_facades', 'fixed',  6000),
  (gen_random_uuid(), v_office1_id, 'architectural_design', 'interior_design',       'per_m2', 120),

  -- الهندسة الإنشائية (office1 + office2)
  (gen_random_uuid(), v_office1_id, 'structural_engineering', 'reinforced_concrete',   'per_m2', 85),
  (gen_random_uuid(), v_office2_id, 'structural_engineering', 'steel_structures',      'fixed',  22000),
  (gen_random_uuid(), v_office2_id, 'structural_engineering', 'structural_assessment', 'fixed',  7500),
  (gen_random_uuid(), v_office2_id, 'structural_engineering', 'reinforced_concrete',   'per_m2', 90),

  -- هندسة الميكانيكا والكهرباء والسباكة (office3)
  (gen_random_uuid(), v_office3_id, 'mep_engineering', 'electrical_systems', 'fixed',  11000),
  (gen_random_uuid(), v_office3_id, 'mep_engineering', 'hvac_systems',       'per_m2', 95),
  (gen_random_uuid(), v_office3_id, 'mep_engineering', 'plumbing',           'fixed',  9500),
  (gen_random_uuid(), v_office3_id, 'mep_engineering', 'fire_systems',       'fixed',  13000),

  -- الاستشارات الهندسية (office1 + office3)
  (gen_random_uuid(), v_office1_id, 'permits_consulting', 'structural_consultations',    'fixed', 4500),
  (gen_random_uuid(), v_office1_id, 'permits_consulting', 'architectural_consultations', 'fixed', 4000),
  (gen_random_uuid(), v_office3_id, 'permits_consulting', 'feasibility_studies',         'fixed', 12000),
  (gen_random_uuid(), v_office3_id, 'permits_consulting', 'building_permits',            'fixed', 3500),

  -- الإشراف على التشييد (office2)
  (gen_random_uuid(), v_office2_id, 'construction_supervision', 'full_supervision', 'per_m2', 65),
  (gen_random_uuid(), v_office2_id, 'construction_supervision', 'periodic_visits',  'fixed',  6000),
  (gen_random_uuid(), v_office2_id, 'construction_supervision', 'progress_reports', 'fixed',  2800),
  (gen_random_uuid(), v_office1_id, 'construction_supervision', 'full_supervision', 'per_m2', 70),

  -- إدارة المشاريع (office1)
  (gen_random_uuid(), v_office1_id, 'full_construction', 'residential_pm',    'fixed',  18000),
  (gen_random_uuid(), v_office1_id, 'full_construction', 'commercial_pm',     'fixed',  28000),
  (gen_random_uuid(), v_office1_id, 'full_construction', 'scheduling_planning','fixed', 9000),
  (gen_random_uuid(), v_office2_id, 'full_construction', 'concrete_works',    'per_m2', 1400),

  -- أعمال التشطيبات (office1 + office2)
  (gen_random_uuid(), v_office1_id, 'finishing_works', 'standard_finishing',   'per_m2', 750),
  (gen_random_uuid(), v_office1_id, 'finishing_works', 'premium_finishing',    'per_m2', 1350),
  (gen_random_uuid(), v_office2_id, 'finishing_works', 'interior_decoration',  'fixed',  25000),

  -- المساحة والرفع الطبوغرافي (office3)
  (gen_random_uuid(), v_office3_id, 'surveying_geomatics', 'topographic_survey',    'fixed', 5500),
  (gen_random_uuid(), v_office3_id, 'surveying_geomatics', 'land_survey',           'fixed', 3800),
  (gen_random_uuid(), v_office3_id, 'surveying_geomatics', 'boundary_determination','fixed', 4200);

-- ─── 6. TEMPLATES (9, 3 per office) ──────────────────────────────────────────
INSERT INTO public.templates (
  template_id, office_id, title, description, price, category, sub_category,
  preview_image_url, included_files, is_approved, is_available
) VALUES
  -- Office 1 templates
  (gen_random_uuid(), v_office1_id,
   'مخططات فيلا سكنية دور وملحق',
   'مجموعة مخططات كاملة لفيلا سكنية بمساحة 400م² تشمل الدور الأرضي وملحق العمالة مع جميع التفاصيل الإنشائية والمعمارية.',
   2800, 'architectural_design', 'residential_plans',
   'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
   'مخططات معمارية PDF، مخططات إنشائية، جداول الكميات، ملفات DWG',
   true, true),

  (gen_random_uuid(), v_office1_id,
   'مخططات عمارة شقق سكنية (8 وحدات)',
   'مجموعة مخططات احترافية لعمارة شقق سكنية من 4 أدوار بإجمالي 8 شقق، تشمل جميع التفاصيل والواجهات.',
   4500, 'architectural_design', 'commercial_plans',
   'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
   'مخططات معمارية PDF، مخططات كهربائية، مخططات صرف صحي، ملفات CAD',
   true, true),

  (gen_random_uuid(), v_office1_id,
   'تقرير جدوى إنشائية لمشروع تجاري',
   'نموذج دراسة جدوى إنشائية متكاملة للمشاريع التجارية يتضمن التحليل والتوصيات الفنية.',
   1800, 'permits_consulting', 'feasibility_studies',
   'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
   'تقرير PDF تفصيلي، جداول بيانات Excel، ملاحق فنية',
   true, true),

  -- Office 2 templates
  (gen_random_uuid(), v_office2_id,
   'مخططات إنشائية لفيلا خرسانية',
   'مجموعة مخططات إنشائية متكاملة لفيلا سكنية خرسانية مسلحة تشمل جميع الأعضاء الإنشائية.',
   3200, 'structural_engineering', 'reinforced_concrete',
   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
   'مخططات إنشائية PDF، مخططات أساسات، جداول حديد التسليح، ملفات DWG',
   true, true),

  (gen_random_uuid(), v_office2_id,
   'نموذج خطة إشراف هندسي شامل',
   'خطة إشراف هندسية نموذجية للمشاريع السكنية تشمل جداول الزيارات والتقارير الدورية.',
   1200, 'construction_supervision', 'full_supervision',
   'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
   'خطة الإشراف PDF، نماذج تقارير الزيارات، قوائم فحص الجودة',
   true, true),

  (gen_random_uuid(), v_office2_id,
   'مخططات إنشائية لعمارة تجارية',
   'حزمة مخططات إنشائية كاملة لمبنى تجاري من 6 أدوار تشمل الأساسات والأعمدة والجسور.',
   5500, 'structural_engineering', 'steel_structures',
   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
   'مخططات إنشائية PDF، حسابات إنشائية، جداول الكميات، ملفات AutoCAD',
   true, true),

  -- Office 3 templates
  (gen_random_uuid(), v_office3_id,
   'مخططات كهربائية وميكانيكية لفيلا',
   'حزمة مخططات MEP كاملة لفيلا سكنية تشمل مخططات الكهرباء والتكييف والسباكة والصرف الصحي.',
   2200, 'mep_engineering', 'electrical_systems',
   'https://images.unsplash.com/photo-1621905251189-08b45249ff78?w=800&q=80',
   'مخططات كهربائية PDF، مخططات HVAC، مخططات سباكة، ملفات DWG',
   true, true),

  (gen_random_uuid(), v_office3_id,
   'تقرير رفع مساحي طبوغرافي',
   'نموذج تقرير رفع مساحي طبوغرافي احترافي للأراضي السكنية والتجارية.',
   1500, 'surveying_geomatics', 'topographic_survey',
   'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80',
   'تقرير مساحي PDF، خرائط طبوغرافية، بيانات جيوديزية، ملفات DXF',
   true, true),

  (gen_random_uuid(), v_office3_id,
   'حزمة استشارات هندسية للمشاريع الصغيرة',
   'حزمة استشارية متكاملة للمشاريع السكنية الصغيرة تشمل نماذج طلبات التراخيص وقوائم المتطلبات.',
   950, 'permits_consulting', 'building_permits',
   'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
   'قائمة متطلبات الترخيص، نماذج الطلبات، دليل الإجراءات PDF',
   true, true);

-- ─── 7. PORTFOLIO ITEMS ───────────────────────────────────────────────────────
INSERT INTO public.portfolio (portfolio_id, office_id, project_title, description, image_url, location) VALUES
  (gen_random_uuid(), v_office1_id, 'فيلا راقية — حي النرجس، الرياض',
   'تصميم معماري وإنشائي متكامل لفيلا فاخرة من دورين وملحق بمساحة 550م²',
   'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80', 'الرياض'),
  (gen_random_uuid(), v_office1_id, 'مجمع تجاري — جدة الشمالية',
   'تصميم وإشراف على مجمع تجاري متعدد الطوابق بمساحة 2000م²',
   'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80', 'جدة'),
  (gen_random_uuid(), v_office1_id, 'عمارة سكنية — المدينة المنورة',
   'إدارة كاملة لمشروع عمارة شقق سكنية (12 وحدة)',
   'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', 'المدينة المنورة'),

  (gen_random_uuid(), v_office2_id, 'برج تجاري — الدمام',
   'تصميم إنشائي لبرج تجاري من 15 طابقاً',
   'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80', 'الدمام'),
  (gen_random_uuid(), v_office2_id, 'مستودعات صناعية — الجبيل',
   'إشراف على إنشاء مجمع مستودعات صناعية بمساحة 8000م²',
   'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80', 'الجبيل'),

  (gen_random_uuid(), v_office3_id, 'مشروع MEP — المنطقة الشرقية',
   'تصميم وتركيب أنظمة MEP كاملة لمجمع سكني',
   'https://images.unsplash.com/photo-1621905251189-08b45249ff78?w=800&q=80', 'الخبر'),
  (gen_random_uuid(), v_office3_id, 'رفع مساحي — مشاريع أرامكو',
   'رفع مساحي طبوغرافي دقيق لمواقع متعددة في المنطقة الشرقية',
   'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80', 'الظهران');

-- ─── 8. PROJECT REQUESTS ─────────────────────────────────────────────────────
INSERT INTO public.project_requests (request_id, client_id, title, description, location, budget_range, status) VALUES
  (v_req1_id, v_client_id,
   'تصميم فيلا سكنية دور وملحق — الرياض',
   'أحتاج تصميماً معمارياً وإنشائياً لفيلا سكنية بمساحة أرض 400م² في حي النرجس بالرياض. المطلوب مخططات معمارية وإنشائية كاملة مع واجهات.',
   'الرياض', '15,000 - 25,000 ريال', 'approved'),

  (v_req2_id, v_client_id,
   'إشراف هندسي على بناء عمارة سكنية',
   'مطلوب إشراف هندسي كامل على مشروع عمارة شقق سكنية من 4 أدوار بمدينة جدة. المشروع قيد التنفيذ ويحتاج إشراف متكامل.',
   'جدة', '20,000 - 35,000 ريال', 'pending'),

  (v_req3_id, v_client_id,
   'مخططات كهروميكانيكية لمبنى تجاري',
   'نحتاج مخططات MEP كاملة لمبنى تجاري من 3 طوابق في الدمام يشمل الكهرباء والتكييف والسباكة.',
   'الدمام', '12,000 - 20,000 ريال', 'approved');

-- ─── 9. BIDS ─────────────────────────────────────────────────────────────────
INSERT INTO public.bids (bid_id, request_id, office_id, price, timeline, status, submitted_at) VALUES
  (v_bid1_id, v_req1_id, v_office1_id, 18500, 21, 'submitted',
   now() - interval '3 days'),
  (v_bid2_id, v_req1_id, v_office2_id, 22000, 28, 'submitted',
   now() - interval '2 days'),
  (v_bid3_id, v_req3_id, v_office3_id, 15500, 14, 'submitted',
   now() - interval '1 day');

-- ─── 10. CONVERSATIONS + MESSAGES ────────────────────────────────────────────
INSERT INTO public.conversations (id, type, reference_id, reference_title, client_id, office_id, created_at, updated_at)
VALUES
  (v_conv1_id, 'bid', v_req1_id::text,
   'تصميم فيلا سكنية دور وملحق — الرياض',
   v_client_id, v_office1_id, now() - interval '3 days', now() - interval '1 hour'),

  (v_conv2_id, 'bid', v_req3_id::text,
   'مخططات كهروميكانيكية لمبنى تجاري',
   v_client_id, v_office3_id, now() - interval '1 day', now() - interval '30 minutes');

INSERT INTO public.messages (id, conversation_id, sender_id, content, created_at)
VALUES
  (gen_random_uuid(), v_conv1_id, v_client_id,
   'السلام عليكم، اطلعت على عرضكم وأجد أنه مناسب. هل يمكن معرفة المزيد عن خبراتكم في تصميم الفلل السكنية؟',
   now() - interval '3 days'),

  (gen_random_uuid(), v_conv1_id, v_office1_id,
   'وعليكم السلام ورحمة الله. نعم بكل سرور. نحن متخصصون في تصميم الفلل السكنية الراقية ولدينا خبرة أكثر من 12 سنة في السوق السعودي. هل تودون الاطلاع على أعمالنا السابقة؟',
   now() - interval '2 days' - interval '12 hours'),

  (gen_random_uuid(), v_conv1_id, v_client_id,
   'نعم أود الاطلاع على أعمالكم. وهل يمكن تعديل التصميم بعد الاتفاق؟',
   now() - interval '2 days'),

  (gen_random_uuid(), v_conv1_id, v_office1_id,
   'بالتأكيد، نوفر جلستين تعديل مجانيتين ضمن العقد. كما نقدم صور ثلاثية الأبعاد (3D) للمشروع قبل الاعتماد النهائي.',
   now() - interval '1 day' - interval '6 hours'),

  (gen_random_uuid(), v_conv1_id, v_client_id,
   'ممتاز، سأتواصل معكم لتحديد موعد للاجتماع.',
   now() - interval '1 hour'),

  (gen_random_uuid(), v_conv2_id, v_client_id,
   'مرحباً، هل عندكم خبرة في مخططات MEP للمباني التجارية من 3 طوابق؟',
   now() - interval '1 day'),

  (gen_random_uuid(), v_conv2_id, v_office3_id,
   'أهلاً بك. نعم لدينا خبرة واسعة في تصميم أنظمة MEP للمباني التجارية. كم مساحة المبنى تقريباً؟',
   now() - interval '30 minutes');

-- ─── 11. CONTRACT + PROJECT + MILESTONES ─────────────────────────────────────
INSERT INTO public.contracts (
  contract_id, client_id, office_id, title, description,
  is_client_signed, is_office_signed, created_at
) VALUES (
  v_contract1_id, v_client_id, v_office1_id,
  'عقد تصميم فيلا سكنية',
  'عقد تصميم معماري وإنشائي لفيلا سكنية بحي النرجس، الرياض. مساحة الأرض 400م².',
  true, true, now() - interval '10 days'
);

INSERT INTO public.projects (project_id, contract_id, title, description, status, progress_percentage, start_date) VALUES
  (v_project1_id, v_contract1_id,
   'تصميم فيلا النرجس',
   'مشروع تصميم فيلا سكنية راقية في حي النرجس بالرياض',
   'active', 35, (now() - interval '8 days')::date::text);

INSERT INTO public.milestones (milestone_id, project_id, title, description, due_date, status) VALUES
  (v_ms1_id, v_project1_id,
   'الدراسة والتخطيط الأولي',
   'إعداد المخططات الأولية والرسومات المبدئية للمشروع',
   (now() + interval '7 days')::date::text, 'approved'),

  (v_ms2_id, v_project1_id,
   'المخططات المعمارية الكاملة',
   'إنجاز جميع المخططات المعمارية التفصيلية بصيغة PDF و DWG',
   (now() + interval '21 days')::date::text, 'pending');

-- ─── 12. NOTIFICATIONS ───────────────────────────────────────────────────────
INSERT INTO public.notifications (id, user_id, message, is_read, created_at) VALUES
  (gen_random_uuid(), v_client_id,
   'تلقيت عرضاً جديداً على طلبك: تصميم فيلا سكنية دور وملحق — الرياض',
   false, now() - interval '3 days'),

  (gen_random_uuid(), v_client_id,
   'تلقيت عرضاً جديداً من مكتب البناء الحديث على طلبك',
   false, now() - interval '2 days'),

  (gen_random_uuid(), v_client_id,
   'تم قبول طلبك: مخططات كهروميكانيكية لمبنى تجاري',
   true, now() - interval '1 day'),

  (gen_random_uuid(), v_office1_id,
   'طلب حجز مباشر جديد من عميل: أحمد العمراني',
   false, now() - interval '5 hours'),

  (gen_random_uuid(), v_office1_id,
   'تم قبول العقد من قِبل العميل — مشروع فيلا النرجس',
   true, now() - interval '9 days'),

  (gen_random_uuid(), v_office3_id,
   'رسالة جديدة من عميل بخصوص مخططات MEP',
   false, now() - interval '30 minutes'),

  (gen_random_uuid(), v_super_id,
   'طلب تسجيل مكتب جديد في انتظار المراجعة',
   false, now() - interval '1 day');

END $$;
