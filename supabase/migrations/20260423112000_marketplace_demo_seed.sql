-- Demo marketplace seed for Omran Platform (idempotent)
-- Inserts realistic Saudi engineering offices, verified status, services, templates, and portfolio.

-- 1) Demo office profiles (engineering office accounts)
INSERT INTO public.profiles (id, name, email, role)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'مكتب أفق الرياض للاستشارات الهندسية', 'riyadh.office.demo@omran.sa', 'engineering_office'),
  ('22222222-2222-4222-8222-222222222222', 'مكتب نبراس جدة الهندسي', 'jeddah.office.demo@omran.sa', 'engineering_office'),
  ('33333333-3333-4333-8333-333333333333', 'مكتب مدى المدينة للتصميم والإشراف', 'madinah.office.demo@omran.sa', 'engineering_office'),
  ('44444444-4444-4444-8444-444444444444', 'خبراء الشرقية للهندسة المتكاملة', 'khobar.office.demo@omran.sa', 'engineering_office'),
  ('55555555-5555-4555-8555-555555555555', 'مكتب إعمار ينبع للمخططات والتنفيذ', 'yanbu.office.demo@omran.sa', 'engineering_office'),
  ('66666666-6666-4666-8666-666666666666', 'دقة الدمام للمساحة والجيوماتكس', 'dammam.office.demo@omran.sa', 'engineering_office')
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- 2) Engineering office records (verified for public marketplace visibility)
INSERT INTO public.engineering_offices (id, license_number, description, coverage_area, license_expiry_date, is_verified)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'SE-80101', 'مكتب هندسي متكامل متخصص في الفلل السكنية والمجمعات المتوسطة.', 'الرياض، الدرعية، الخرج', '2030-12-31', true),
  ('22222222-2222-4222-8222-222222222222', 'SE-80102', 'تصميم معماري وإنشائي للمشاريع السكنية والتجارية في جدة ومكة.', 'جدة، مكة المكرمة، الطائف', '2030-12-31', true),
  ('33333333-3333-4333-8333-333333333333', 'SE-80103', 'إشراف وتنفيذ هندسي مع خبرة في المشاريع الفندقية والصحية.', 'المدينة المنورة، ينبع', '2030-12-31', true),
  ('44444444-4444-4444-8444-444444444444', 'SE-80104', 'حلول هندسية متكاملة للمشاريع التجارية والسكنية متعددة الأدوار.', 'الخبر، الظهران، الدمام', '2030-12-31', true),
  ('55555555-5555-4555-8555-555555555555', 'SE-80105', 'مكتب تصميم وتنفيذ للمشاريع الساحلية والاستراحات والفلل.', 'ينبع، المدينة المنورة، أملج', '2030-12-31', true),
  ('66666666-6666-4666-8666-666666666666', 'SE-80106', 'مساحة وجيوماتكس ودراسات رفع وتحديد مواقع المشاريع.', 'الدمام، الخبر، الجبيل', '2030-12-31', true)
ON CONFLICT (id) DO UPDATE
SET
  license_number = EXCLUDED.license_number,
  description = EXCLUDED.description,
  coverage_area = EXCLUDED.coverage_area,
  license_expiry_date = EXCLUDED.license_expiry_date,
  is_verified = EXCLUDED.is_verified;

-- 3) Service catalog entries (services are visible via verified office filtering)
INSERT INTO public.service_catalog (catalog_id, office_id, category, sub_category, pricing_model, price)
VALUES
  ('a1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'architectural_design', 'residential_plans', 'fixed', 22000),
  ('a1111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', 'construction_supervision', 'full_supervision', 'per_m2', 9),
  ('a2222222-2222-4222-8222-222222222221', '22222222-2222-4222-8222-222222222222', 'structural_engineering', 'reinforced_concrete', 'fixed', 16500),
  ('a2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'permits_consulting', 'building_permits', 'fixed', 5800),
  ('a3333333-3333-4333-8333-333333333331', '33333333-3333-4333-8333-333333333333', 'mep_engineering', 'electrical', 'fixed', 8200),
  ('a3333333-3333-4333-8333-333333333332', '33333333-3333-4333-8333-333333333333', 'finishing_works', 'standard_finishing', 'per_m2', 430),
  ('a4444444-4444-4444-8444-444444444441', '44444444-4444-4444-8444-444444444444', 'full_construction', 'concrete_works', 'per_m2', 1280),
  ('a4444444-4444-4444-8444-444444444442', '44444444-4444-4444-8444-444444444444', 'architectural_design', 'commercial_plans', 'fixed', 31000),
  ('a5555555-5555-4555-8555-555555555551', '55555555-5555-4555-8555-555555555555', 'finishing_works', 'luxury_finishing', 'per_m2', 760),
  ('a5555555-5555-4555-8555-555555555552', '55555555-5555-4555-8555-555555555555', 'architectural_design', '3d_visualization', 'fixed', 9800),
  ('a6666666-6666-4666-8666-666666666661', '66666666-6666-4666-8666-666666666666', 'surveying_geomatics', 'land_survey', 'fixed', 6200),
  ('a6666666-6666-4666-8666-666666666662', '66666666-6666-4666-8666-666666666666', 'surveying_geomatics', 'contour_maps', 'fixed', 8700)
ON CONFLICT (catalog_id) DO NOTHING;

-- 4) Ready-made templates (explicitly approved and available)
INSERT INTO public.templates (template_id, office_id, title, description, price, is_approved, is_available)
VALUES
  (
    'b1111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'فيلا مودرن 420م² مع ملحق سطح',
    'نوع القالب: مخطط سكني حديث\n\nنبذة:\nمخطط فيلا سكنية حديثة بثلاثة أدوار مع مجلس مستقل.\n\nالمواصفات الهندسية:\nمخططات معمارية + إنشائية + تمديدات أساسية.\n\nالمخرجات المتضمنة:\nPDF + DWG + جدول كميات أولي.',
    4200,
    true,
    true
  ),
  (
    'b2222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    'حزمة تصاريح بناء سكنية - جدة',
    'نوع القالب: تصاريح واستشارات\n\nنبذة:\nحزمة مستندات جاهزة لرفع معاملة تصريح بناء سكني.\n\nالمواصفات الهندسية:\nنموذج متوافق مع اشتراطات البلدية الشائعة.\n\nالمخرجات المتضمنة:\nنماذج + قوائم التحقق + ملفات تقديم.',
    1900,
    true,
    true
  ),
  (
    'b3333333-3333-4333-8333-333333333333',
    '33333333-3333-4333-8333-333333333333',
    'مخطط مبنى شقق 5 أدوار',
    'نوع القالب: مخطط سكني متعدد الوحدات\n\nنبذة:\nتصميم عمارة شقق مع مواقف وخدمات مشتركة.\n\nالمواصفات الهندسية:\nتصميم معماري + إنشائي + واجهات.\n\nالمخرجات المتضمنة:\nمخططات تنفيذية + جداول أبواب ونوافذ.',
    5600,
    true,
    true
  ),
  (
    'b4444444-4444-4444-8444-444444444444',
    '44444444-4444-4444-8444-444444444444',
    'قالب مواصفات تشطيب تجاري فاخر',
    'نوع القالب: تشطيب تجاري\n\nنبذة:\nمواصفات تشطيب لمساحات عرض ومتاجر راقية.\n\nالمواصفات الهندسية:\nأرضيات، أسقف، إضاءة، واجهات داخلية.\n\nالمخرجات المتضمنة:\nمواصفات + جداول مواد + دليل تنفيذ.',
    3300,
    true,
    true
  ),
  (
    'b5555555-5555-4555-8555-555555555555',
    '66666666-6666-4666-8666-666666666666',
    'تقرير رفع مساحي وقالب كنتور',
    'نوع القالب: مساحة وجيوماتكس\n\nنبذة:\nقالب احترافي لتقرير الرفع المساحي وخرائط الكنتور.\n\nالمواصفات الهندسية:\nتخطيط نقاط، مناسيب، وإحداثيات.\n\nالمخرجات المتضمنة:\nDOCX + XLSX + DXF.',
    1400,
    true,
    true
  )
ON CONFLICT (template_id) DO NOTHING;

-- 5) Portfolio / showcase
INSERT INTO public.portfolio (portfolio_id, office_id, project_title, category, description, image_url, completed_at)
VALUES
  ('c1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'مجمع فلل حي النرجس - الرياض', 'residential', 'تصميم وإشراف 12 فيلا سكنية بمساحات متنوعة.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80', '2025-11-22'),
  ('c2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'مركز أعمال الواجهة البحرية - جدة', 'commercial', 'تصميم مبنى مكاتب وتجهيزات MEP متكاملة.', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&q=80', '2025-07-18'),
  ('c3333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', 'فندق بوتيك قرب المسجد النبوي', 'hospitality', 'إعادة تصميم كامل مع معالجة حركة النزلاء.', 'https://images.unsplash.com/photo-1465800872432-2b73cde03e45?w=900&q=80', '2024-12-03'),
  ('c4444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444', 'مبنى تجاري متعدد الاستخدام - الخبر', 'commercial', 'تنفيذ هيكل إنشائي وتشطيب تجاري فاخر.', 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=900&q=80', '2025-09-15'),
  ('c5555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', 'استراحة ساحلية خاصة - ينبع', 'residential', 'تصميم وتنفيذ استراحة مع مسطحات ومسبح.', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=900&q=80', '2025-05-10'),
  ('c6666666-6666-4666-8666-666666666666', '66666666-6666-4666-8666-666666666666', 'رفع مساحي لمنطقة تطوير صناعي - الدمام', 'survey', 'رفع كنتوري عالي الدقة لمساحة 2.4 مليون م².', 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&q=80', '2025-02-21')
ON CONFLICT (portfolio_id) DO NOTHING;
