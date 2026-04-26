// Seed data for Omran Platform — 5 Saudi engineering offices
// This file provides realistic mock data for demonstration purposes.

export const SEED_OFFICES = [
  {
    name: 'مكتب المهندس خالد العمري للاستشارات الهندسية',
    nameEn: 'Eng. Khalid Al-Omari Consulting Office',
    city: 'الرياض',
    cityEn: 'Riyadh',
    type: 'مكتب هندسي متكامل (جميع التخصصات)',
    typeEn: 'Integrated Engineering Office',
    experience: 15,
    coverage: 'الرياض، القصيم، حائل',
    coverageEn: 'Riyadh, Qassim, Hail',
    license: 'SE-10421',
    rating: 4.8,
    services: [
      { category: 'architectural_design', sub_category: 'residential_plans', pricing_model: 'fixed', price: 20000, descAr: 'تصميم مخططات معمارية للفلل والمساكن بأحدث التقنيات', descEn: 'Architectural plans for villas and residences with latest technology' },
      { category: 'architectural_design', sub_category: 'commercial_plans', pricing_model: 'fixed', price: 25000, descAr: 'تصميم مراكز تجارية ومكاتب بأعلى المعايير', descEn: 'Commercial center and office design to highest standards' },
      { category: 'structural_engineering', sub_category: 'reinforced_concrete', pricing_model: 'fixed', price: 12000, descAr: 'تصميم مخططات إنشائية للخرسانة المسلحة', descEn: 'Structural plans for reinforced concrete' },
      { category: 'permits_consulting', sub_category: 'building_permits', pricing_model: 'fixed', price: 5000, descAr: 'استخراج تصاريح البناء والموافقات اللازمة', descEn: 'Building permit extraction and approvals' },
    ],
    templates: [
      { title: 'مخطط فيلا 300م² - طراز حديث', titleEn: 'Villa Plan 300m² - Modern Style', price: 3500, category: 'architectural_design', descAr: 'مخطط معماري جاهز لفيلا سكنية 300م² بطراز حديث مع تصاميم داخلية', descEn: 'Ready-made architectural plan for 300m² modern villa' },
      { title: 'مخطط شقة دوبلكس 200م²', titleEn: 'Duplex Apartment Plan 200m²', price: 2500, category: 'architectural_design', descAr: 'تصميم شقة دوبلكس بغرفتين نوم ومعيشة واسعة', descEn: 'Duplex apartment design with 2 bedrooms' },
      { title: 'نموذج مواصفات إنشائية', titleEn: 'Structural Specifications Template', price: 1500, category: 'structural_engineering', descAr: 'قالب مواصفات إنشائية قياسية للمباني السكنية', descEn: 'Standard structural specs template for residential buildings' },
    ],
    portfolio: [
      { project_title: 'تصميم فيلا سكنية حديثة - حي النرجس', category: 'residential', description: 'تصميم معماري وإنشائي لفيلا 600م² بطراز حديث' },
      { project_title: 'مجمع تجاري الربوة', category: 'commercial', description: 'تصميم مول تجاري متعدد الطوابق بمساحة 3000م²' },
      { project_title: 'مبنى حكومي - وزارة الإسكان', category: 'government', description: 'مبنى إداري حكومي بتصميم مستدام' },
    ],
  },
  {
    name: 'شركة إتقان للمقاولات والهندسة',
    nameEn: 'Itqan Construction & Engineering Co.',
    city: 'جدة',
    cityEn: 'Jeddah',
    type: 'مكتب هندسي إنشائي',
    typeEn: 'Structural Engineering Office',
    experience: 12,
    coverage: 'جدة، مكة المكرمة، الطائف',
    coverageEn: 'Jeddah, Makkah, Taif',
    license: 'SE-20835',
    rating: 4.7,
    services: [
      { category: 'structural_engineering', sub_category: 'reinforced_concrete', pricing_model: 'fixed', price: 15000, descAr: 'تصميم وتحليل الهياكل الخرسانية المسلحة', descEn: 'Design and analysis of reinforced concrete structures' },
      { category: 'construction_supervision', sub_category: 'full_supervision', pricing_model: 'per_m2', price: 5, descAr: 'إشراف هندسي كامل من الأساسات حتى التسليم', descEn: 'Full engineering supervision from foundation to handover' },
      { category: 'full_construction', sub_category: 'concrete_works', pricing_model: 'per_m2', price: 1200, descAr: 'تنفيذ أعمال الخرسانة الإنشائية بجميع المراحل', descEn: 'Concrete structural works execution at all stages' },
    ],
    templates: [
      { title: 'نموذج عقد إشراف هندسي', titleEn: 'Engineering Supervision Contract', price: 800, category: 'construction_supervision', descAr: 'عقد إشراف هندسي جاهز يشمل جميع البنود القانونية', descEn: 'Ready-made supervision contract with all legal clauses' },
      { title: 'جدول كميات بناء فيلا', titleEn: 'Villa Construction BOQ', price: 1200, category: 'full_construction', descAr: 'جدول كميات تفصيلي لبناء فيلا سكنية مع الأسعار', descEn: 'Detailed bill of quantities for villa construction' },
      { title: 'خطة إدارة مشروع إنشائي', titleEn: 'Construction Project Management Plan', price: 2000, category: 'structural_engineering', descAr: 'خطة إدارة مشروع إنشائي شاملة بالمراحل والتسليمات', descEn: 'Comprehensive construction project management plan' },
    ],
    portfolio: [
      { project_title: 'برج سكني الكورنيش', category: 'residential', description: 'إشراف إنشائي على برج 12 طابق' },
      { project_title: 'مجمع فلل النسيم', category: 'residential', description: 'بناء 8 فلل سكنية متصلة' },
      { project_title: 'مصنع الصناعات الغذائية', category: 'industrial', description: 'تنفيذ هيكل إنشائي لمصنع 5000م²' },
    ],
  },
  {
    name: 'مكتب الرؤية الهندسية المتكاملة',
    nameEn: 'Al-Rouya Integrated Engineering Office',
    city: 'المدينة المنورة',
    cityEn: 'Madinah',
    type: 'مكتب هندسي معماري',
    typeEn: 'Architectural Engineering Office',
    experience: 8,
    coverage: 'المدينة المنورة، ينبع، تبوك',
    coverageEn: 'Madinah, Yanbu, Tabuk',
    license: 'SE-31247',
    rating: 4.9,
    services: [
      { category: 'architectural_design', sub_category: 'residential_plans', pricing_model: 'fixed', price: 18000, descAr: 'تصميم فلل ومساكن بتقنية BIM ثلاثية الأبعاد', descEn: 'Villa design using 3D BIM technology' },
      { category: 'architectural_design', sub_category: '3d_visualization', pricing_model: 'fixed', price: 8000, descAr: 'تصور معماري ثلاثي الأبعاد واقعي للمشاريع', descEn: 'Realistic 3D architectural visualization' },
      { category: 'mep_engineering', sub_category: 'electrical', pricing_model: 'fixed', price: 7000, descAr: 'تصميم أنظمة كهربائية شاملة للمباني', descEn: 'Comprehensive electrical systems design' },
      { category: 'finishing_works', sub_category: 'standard_finishing', pricing_model: 'per_m2', price: 420, descAr: 'تشطيب داخلي وخارجي بمواصفات استاندرد عالية الجودة', descEn: 'High-quality standard interior and exterior finishing' },
    ],
    templates: [
      { title: 'تصميم فيلا 500م² - إسلامي عصري', titleEn: 'Villa Design 500m² - Modern Islamic', price: 5000, category: 'architectural_design', descAr: 'مخطط فيلا بطراز إسلامي عصري مع حديقة داخلية ومجلس', descEn: 'Villa plan with modern Islamic style including inner garden' },
      { title: 'حزمة تصميم MEP سكنية', titleEn: 'Residential MEP Design Package', price: 3000, category: 'mep_engineering', descAr: 'حزمة تصاميم كهربائية وميكانيكية وصحية للمباني السكنية', descEn: 'Electrical, mechanical, and plumbing design package for residential buildings' },
      { title: 'دليل مواصفات التشطيب', titleEn: 'Finishing Specifications Guide', price: 1000, category: 'finishing_works', descAr: 'دليل شامل لمواصفات التشطيب بثلاث مستويات جودة', descEn: 'Complete finishing specs guide with three quality tiers' },
    ],
    portfolio: [
      { project_title: 'فيلا العلا الحديثة', category: 'residential', description: 'تصميم فيلا 450م² بتقنية BIM' },
      { project_title: 'فندق طيبة بوتيك', category: 'hospitality', description: 'تصميم داخلي وخارجي لفندق 40 غرفة' },
      { project_title: 'مركز الأعمال ينبع', category: 'commercial', description: 'تصميم مبنى مكاتب بمساحة 2000م²' },
    ],
  },
  {
    name: 'مكتب الدقة للمساحة والجيوماتكس',
    nameEn: 'Al-Diqqa Surveying & Geomatics Office',
    city: 'الدمام',
    cityEn: 'Dammam',
    type: 'مكتب استشارات هندسية',
    typeEn: 'Engineering Consulting Office',
    experience: 10,
    coverage: 'الدمام، الخبر، الظهران',
    coverageEn: 'Dammam, Khobar, Dhahran',
    license: 'SE-40518',
    rating: 4.6,
    services: [
      { category: 'permits_consulting', sub_category: 'feasibility_studies', pricing_model: 'fixed', price: 15000, descAr: 'دراسات جدوى هندسية شاملة للمشاريع العقارية والصناعية', descEn: 'Comprehensive feasibility studies for real estate and industrial projects' },
      { category: 'surveying_geomatics', sub_category: 'land_survey', pricing_model: 'fixed', price: 5000, descAr: 'مسح أراضي دقيق باستخدام أحدث أجهزة GPS', descEn: 'Precision land surveying using latest GPS equipment' },
      { category: 'surveying_geomatics', sub_category: 'contour_maps', pricing_model: 'fixed', price: 8000, descAr: 'رسم خرائط كنتور طبوغرافية عالية الدقة', descEn: 'High-precision topographic contour mapping' },
    ],
    templates: [
      { title: 'نموذج دراسة جدوى هندسية', titleEn: 'Engineering Feasibility Study Template', price: 4000, category: 'permits_consulting', descAr: 'قالب دراسة جدوى هندسية شامل يغطي الجوانب التقنية والمالية', descEn: 'Comprehensive engineering feasibility study covering technical and financial aspects' },
      { title: 'تقرير مسح أراضي نموذجي', titleEn: 'Sample Land Survey Report', price: 1500, category: 'surveying_geomatics', descAr: 'نموذج تقرير مسح أراضي مع المخططات والإحداثيات', descEn: 'Sample land survey report with plans and coordinates' },
      { title: 'نموذج طلب تصريح بناء', titleEn: 'Building Permit Application Form', price: 500, category: 'permits_consulting', descAr: 'نموذج جاهز لطلب تصريح بناء مع جميع المرفقات المطلوبة', descEn: 'Ready-made building permit application with all required attachments' },
    ],
    portfolio: [
      { project_title: 'مسح أراضي مشروع نيوم', category: 'survey', description: 'مسح طبوغرافي لمساحة 50 هكتار' },
      { project_title: 'دراسة جدوى مجمع صناعي', category: 'consulting', description: 'دراسة جدوى هندسية شاملة' },
      { project_title: 'تحديد مواقع حقول النفط', category: 'survey', description: 'مسح جيوديسي دقيق باستخدام GPS' },
    ],
  },
  {
    name: 'مجموعة البنيان للإنشاء والتشطيب',
    nameEn: 'Al-Bunyan Construction & Finishing Group',
    city: 'أبها',
    cityEn: 'Abha',
    type: 'مكتب هندسي متكامل (جميع التخصصات)',
    typeEn: 'Integrated Engineering Office',
    experience: 20,
    coverage: 'أبها، جازان، نجران، الباحة',
    coverageEn: 'Abha, Jazan, Najran, Al Baha',
    license: 'SE-50962',
    rating: 4.5,
    services: [
      { category: 'full_construction', sub_category: 'excavation', pricing_model: 'per_m2', price: 900, descAr: 'أعمال حفر وتأسيس بمعدات حديثة', descEn: 'Excavation and foundation work with modern equipment' },
      { category: 'full_construction', sub_category: 'finishing_ext_int', pricing_model: 'per_m2', price: 1400, descAr: 'تشطيب داخلي وخارجي متكامل', descEn: 'Complete interior and exterior finishing' },
      { category: 'finishing_works', sub_category: 'economy_finishing', pricing_model: 'per_m2', price: 280, descAr: 'تشطيب اقتصادي بمواصفات جيدة وسعر مناسب', descEn: 'Economy finishing with good specs at affordable price' },
      { category: 'finishing_works', sub_category: 'luxury_finishing', pricing_model: 'per_m2', price: 700, descAr: 'تشطيب فاخر بأرقى المواد والتصاميم', descEn: 'Luxury finishing with finest materials and designs' },
      { category: 'construction_supervision', sub_category: 'full_supervision', pricing_model: 'per_m2', price: 8, descAr: 'إشراف هندسي شامل على جميع مراحل البناء', descEn: 'Comprehensive engineering supervision for all construction stages' },
    ],
    templates: [
      { title: 'حزمة تشطيب فيلا اقتصادية', titleEn: 'Economy Villa Finishing Package', price: 2000, category: 'finishing_works', descAr: 'حزمة تشطيب اقتصادية كاملة لفيلا سكنية مع جدول الكميات', descEn: 'Complete economy finishing package for villa with BOQ' },
      { title: 'حزمة تشطيب فيلا فاخرة', titleEn: 'Luxury Villa Finishing Package', price: 4500, category: 'finishing_works', descAr: 'حزمة تشطيب فاخر شاملة بأرقى المواد والتصاميم الداخلية', descEn: 'Comprehensive luxury finishing package with finest materials' },
      { title: 'خطة بناء فيلا من الصفر', titleEn: 'Villa Construction Plan from Scratch', price: 3500, category: 'full_construction', descAr: 'خطة بناء شاملة من الحفر حتى التسليم مع جدول زمني', descEn: 'Complete construction plan from excavation to handover with timeline' },
    ],
    portfolio: [
      { project_title: 'منتجع السودة السياحي', category: 'hospitality', description: 'بناء وتشطيب منتجع 30 شاليه فاخر' },
      { project_title: 'مجمع سكني الباحة', category: 'residential', description: 'بناء 15 وحدة سكنية بتشطيب فاخر' },
      { project_title: 'سوق جازان المركزي', category: 'commercial', description: 'تنفيذ وتشطيب سوق تجاري 4000م²' },
    ],
  },
];

// Note: runSeed() requires authenticated Supabase sessions with proper permissions.
// Use this data for UI demo purposes or seed via Supabase SQL editor.
export async function runSeed() {
  console.log('Seed data available. Use SEED_OFFICES array for demonstration.');
  console.log(`Total offices: ${SEED_OFFICES.length}`);
  console.log(`Total services: ${SEED_OFFICES.reduce((a, o) => a + o.services.length, 0)}`);
  console.log(`Total templates: ${SEED_OFFICES.reduce((a, o) => a + o.templates.length, 0)}`);
  console.log(`Total portfolio items: ${SEED_OFFICES.reduce((a, o) => a + o.portfolio.length, 0)}`);
}
