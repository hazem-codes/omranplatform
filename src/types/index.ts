// =============================================================================
// Omran Platform — Domain Model Classes
// Aligned with UML Class Diagram and SRS
// All attributes are PRIVATE unless marked PROTECTED (User class only)
// All methods are PUBLIC
// NOTE: TypeScript export types use public accessors for Supabase compatibility.
//       The class definitions below document the canonical visibility from the
//       UML diagram. Runtime data objects from Supabase use the exported type
//       aliases (e.g. UserData, ClientData) which mirror the class attributes.
// =============================================================================

// ===== User (base class — protected attributes per UML) — SRS: FR-01, FR-03 =====
export class User {
  protected userID: string;
  protected name: string;
  protected email: string;
  protected password: string;
 protected phone: string;
  protected role: 'client' | 'engineering_office' | 'supervisor';

  constructor(data: { userID: string; name: string; email: string; password?: string; role: 'client' | 'engineering_office' | 'supervisor' }) {
    this.userID = data.userID;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password || '';
    this.role = data.role;
  }

  public register(): void { /* handled by authService */ }
  public login(): boolean { return true; /* handled by authService */ }
  public logout(): void { /* handled by authService */ }
}

// ===== Profile — SRS: FR-01 =====
export class Profile {
  private id: string;
  private name: string;
  private email: string;
  private role: 'client' | 'engineering_office' | 'supervisor';

  constructor(data: ProfileData) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.role = data.role;
  }
}

export type ProfileData = {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'engineering_office' | 'supervisor';
};

// ===== Client — SRS: FR-04 through FR-14 =====
export class Client {
  private phone: string;
  private isActive: boolean;

  constructor(data: ClientData) {
    this.phone = data.phone || '';
    this.isActive = data.is_active ?? true;
  }

  public submitProjectRequest(title: string, details: string, location: string, budgetRange: string): void {}
  public viewBids(): void {}
  public acceptBid(bidID: string): void {}
  public rejectBid(bidID: string): void {}
  public submitReport(): void {}
  public viewMilestone(milestoneID: string): void {}
  public rejectMilestone(milestoneID: string): void {}
  public rateMilestone(milestoneID: string): void {}
  public acceptMilestone(milestoneID: string): void {}
  public browseCatalog(): void {}
  public signContract(contractID: string): void {}
  public bookTemplate(templateID: string): void {}
  public chatWithBot(): string { return ''; }
}

export type ClientData = {
  id: string;
  phone?: string | null;
  is_active?: boolean | null;
};

// ===== EngineeringOffice — SRS: FR-04, FR-15, FR-16 =====
export class EngineeringOffice {
  private licenseNumber: string;
  private description: string;
  private coverageArea: string;
  private isVerified: boolean;
  private licenseExpiryDate: string;

  constructor(data: EngineeringOfficeData) {
    this.licenseNumber = data.license_number;
    this.description = data.description || '';
    this.coverageArea = data.coverage_area || '';
    this.isVerified = data.is_verified ?? false;
    this.licenseExpiryDate = data.license_expiry_date || '';
  }

  public browseProjectRequests(): void {}
  public submitBid(requestID: string, price: number, timeline: number): void {}
  public manageProfile(): void {}
  public createMilestone(title: string, dueDate: string): void {}
  public receivePayment(): void {}
}

export type EngineeringOfficeData = {
  id: string;
  license_number: string;
  coverage_area?: string | null;
  description?: string | null;
  is_verified?: boolean | null;
  license_expiry_date?: string | null;
};

// ===== Supervisor — SRS: FR-17 through FR-29 =====
export class Supervisor {
  private phone: string;

  constructor(data: SupervisorData) {
    this.phone = data.phone || '';
  }

  public viewOfficesRegistration(): void {}
  public approveOfficeRegistration(officeID: string): void {}
  public rejectOfficeRegistration(officeID: string, reason: string): void {}
  public viewProjects(): void {}
  public approveProjectRequest(requestID: string): void {}
  public rejectProjectRequest(requestID: string): void {}
  public approveTemplate(templateID: string): void {}
  public rejectTemplate(templateID: string, reason: string): void {}
  public viewReports(): void {}
  public addReportFeedback(reportID: string, feedback: string): void {}
  public deleteReport(): void {}
}

export type SupervisorData = {
  id: string;
  phone?: string | null;
};

// ===== ProjectRequest — SRS: FR-07 =====
export class ProjectRequest {
  private requestID: string;
  private clientID: string;
  private title: string;
  private description: string;
  private status: string;
  private createdAt: string;
  private budgetRange: string;
  private location: string;

  constructor(data: ProjectRequestData) {
    this.requestID = data.request_id;
    this.clientID = data.client_id || '';
    this.title = data.title;
    this.description = data.description || '';
    this.status = data.status || 'pending';
    this.createdAt = data.created_at || '';
    this.budgetRange = data.budget_range || '';
    this.location = data.location || '';
  }

  public getDetails(): string { return ''; }
  public updateStatus(status: string): void {}
}

export type ProjectRequestData = {
  request_id: string;
  client_id?: string | null;
  title: string;
  description?: string | null;
  location?: string | null;
  budget_range?: string | null;
  status?: string | null;
  created_at?: string | null;
};

// ===== Bid — SRS: FR-08, FR-09 =====
export class Bid {
  private bidID: string;
  private officeID: string;
  private requestID: string;
  private price: number;
  private timeline: number;
  private status: string;
  private submittedAt: string;

  constructor(data: BidData) {
    this.bidID = data.bid_id;
    this.officeID = data.office_id || '';
    this.requestID = data.request_id || '';
    this.price = data.price;
    this.timeline = data.timeline;
    this.status = data.status || 'submitted';
    this.submittedAt = data.submitted_at || '';
  }

  public updateStatus(status: string): void {}
  public getDetails(): string { return ''; }
}

export type BidData = {
  bid_id: string;
  request_id?: string | null;
  office_id?: string | null;
  price: number;
  timeline: number;
  status?: string | null;
  submitted_at?: string | null;
};

// ===== Contract — SRS: FR-10 =====
export class Contract {
  private contractID: string;
  private clientID: string;
  private officeID: string;
  private title: string;
  private description: string;
  private signedAt: string;
  private createdAt: string;
  private isClientSigned: boolean;
  private isOfficeSigned: boolean;

  constructor(data: ContractData) {
    this.contractID = data.contract_id;
    this.clientID = data.client_id || '';
    this.officeID = data.office_id || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.signedAt = data.signed_at || '';
    this.createdAt = data.created_at || '';
    this.isClientSigned = data.is_client_signed ?? false;
    this.isOfficeSigned = data.is_office_signed ?? false;
  }

  public getPDF(): Blob { return new Blob(); }
  public generateContract(clientID: string, officeID: string, price: number, timeline: number): void {}
  public eSign(): void {}
}

export type ContractData = {
  contract_id: string;
  client_id?: string | null;
  office_id?: string | null;
  title?: string | null;
  description?: string | null;
  is_client_signed?: boolean | null;
  is_office_signed?: boolean | null;
  signed_at?: string | null;
  created_at?: string | null;
};

// ===== Project — SRS: FR-11, project tracking =====
export class Project {
  private projectID: string;
  private contractID: string;
  private title: string;
  private status: string;
  private progressPercentage: number;
  private description: string;
  private startDate: string;

  constructor(data: ProjectData) {
    this.projectID = data.project_id;
    this.contractID = data.contract_id || '';
    this.title = data.title;
    this.status = data.status || 'active';
    this.progressPercentage = data.progress_percentage ?? 0;
    this.description = data.description || '';
    this.startDate = data.start_date || '';
  }

  public updateProgress(): void {}
  public getDetails(): string { return ''; }
}

export type ProjectData = {
  project_id: string;
  contract_id?: string | null;
  title: string;
  description?: string | null;
  status?: string | null;
  progress_percentage?: number | null;
  start_date?: string | null;
};

// ===== Milestone — SRS: FR-11, FR-12 =====
export class Milestone {
  private milestoneID: string;
  private projectID: string;
  private title: string;
  private description: string;
  private dueDate: string;
  private deliverableURL: string;
  private status: string;

  constructor(data: MilestoneData) {
    this.milestoneID = data.milestone_id;
    this.projectID = data.project_id || '';
    this.title = data.title;
    this.description = data.description || '';
    this.dueDate = data.due_date || '';
    this.deliverableURL = data.deliverable_url || '';
    this.status = data.status || 'pending';
  }

  public updateStatus(status: string): void {}
}

export type MilestoneData = {
  milestone_id: string;
  project_id?: string | null;
  title: string;
  description?: string | null;
  status?: string | null;
  due_date?: string | null;
  deliverable_url?: string | null;
};

// ===== Rating — SRS: FR-12 =====
export class Rating {
  private ratingID: string;
  private milestoneID: string;
  private clientID: string;
  private stars: number;
  private comment: string;
  private createdAt: string;

  constructor(data: RatingData) {
    this.ratingID = data.rating_id;
    this.milestoneID = data.milestone_id || '';
    this.clientID = data.client_id || '';
    this.stars = data.stars ?? 0;
    this.comment = data.comment || '';
    this.createdAt = data.created_at || '';
  }

  public submitRating(): void {}
  public getDetails(): string { return ''; }
}

export type RatingData = {
  rating_id: string;
  client_id?: string | null;
  milestone_id?: string | null;
  stars?: number | null;
  comment?: string | null;
  created_at?: string | null;
};

// ===== Payment — SRS: FR-14 =====
export class Payment {
  private paymentID: string;
  private escrowID: string;
  private milestoneID: string;
  private status: boolean;
  private amount: number;
  private createdAt: string;

  constructor(data: PaymentData) {
    this.paymentID = data.payment_id;
    this.escrowID = data.escrow_id || '';
    this.milestoneID = data.milestone_id || '';
    this.status = data.status ?? false;
    this.amount = data.amount ?? 0;
    this.createdAt = data.created_at || '';
  }

  public refund(): void {}
  public getPDF(): Blob { return new Blob(); }
}

export type PaymentData = {
  payment_id: string;
  escrow_id?: string | null;
  milestone_id?: string | null;
  amount?: number | null;
  status?: boolean | null;
  created_at?: string | null;
};

// ===== Escrow — SRS: FR-14, FR-29 =====
export class Escrow {
  private escrowID: string;
  private contractID: string;
  private totalAmount: number;
  private releasedAmount: number;
  private status: string;
  private createdAt: string;

  constructor(data: EscrowData) {
    this.escrowID = data.escrow_id;
    this.contractID = data.contract_id || '';
    this.totalAmount = data.total_amount ?? 0;
    this.releasedAmount = data.released_amount ?? 0;
    this.status = data.status || 'held';
    this.createdAt = data.created_at || '';
  }

  public deposit(): void {}
  public release(): void {}
  public refund(): void {}
  public getBalance(): number { return this.totalAmount - this.releasedAmount; }
}

export type EscrowData = {
  escrow_id: string;
  contract_id?: string | null;
  total_amount?: number | null;
  released_amount?: number | null;
  status?: string | null;
  created_at?: string | null;
};

// ===== Template — SRS: FR-05, FR-16, FR-26 =====
export class Template {
  private templateID: string;
  private officeID: string;
  private price: number;
  private title: string;
  private description: string;
  private isAvailable: boolean;
  private isApproved: boolean;

  constructor(data: TemplateData) {
    this.templateID = data.template_id;
    this.officeID = data.office_id || '';
    this.price = data.price ?? 0;
    this.title = data.title || '';
    this.description = data.description || '';
    this.isAvailable = data.is_available ?? false;
    this.isApproved = data.is_approved ?? false;
  }

  public updateStatus(): void {}
  public deleteTemplate(): void {}
  public editTemplate(): void {}
}

export type TemplateData = {
  template_id: string;
  office_id?: string | null;
  title?: string | null;
  description?: string | null;
  price?: number | null;
  is_approved?: boolean | null;
  is_available?: boolean | null;
};

// ===== ServiceCatalog — SRS: FR-15 =====
export class ServiceCatalog {
  private catalogID: string;
  private officeID: string;
  private category: string;
  private subCategory: string;
  private pricingModel: string;
  private price: number;

  constructor(data: ServiceCatalogData) {
    this.catalogID = data.catalog_id;
    this.officeID = data.office_id || '';
    this.category = data.category || '';
    this.subCategory = data.sub_category || '';
    this.pricingModel = data.pricing_model || '';
    this.price = data.price ?? 0;
  }

  public addService(category: string, price: number): void {}
  public editService(catalogID: string): void {}
}

export type ServiceCatalogData = {
  catalog_id: string;
  office_id?: string | null;
  category?: string | null;
  sub_category?: string | null;
  pricing_model?: string | null;
  price?: number | null;
};

// ===== Report — SRS: FR-13, FR-29 =====
export class Report {
  private reportID: string;
  private clientID: string;
  private projectID: string;
  private description: string;
  private status: string;
  private createdAt: string;

  constructor(data: ReportData) {
    this.reportID = data.report_id;
    this.clientID = data.client_id || '';
    this.projectID = data.project_id || '';
    this.description = data.description || '';
    this.status = data.status || 'open';
    this.createdAt = data.created_at || '';
  }

  public viewReport(): string { return ''; }
  public updateStatus(status: string): void {}
}

export type ReportData = {
  report_id: string;
  client_id?: string | null;
  project_id?: string | null;
  description?: string | null;
  status?: string | null;
  created_at?: string | null;
};

// ===== Notification — SRS: FR-33 =====
export class Notification {
  private notificationID: string;
  private userID: string;
  private message: string;
  private isRead: boolean;
  private createdAt: string;

  constructor(data: NotificationData) {
    this.notificationID = data.notification_id;
    this.userID = data.user_id || '';
    this.message = data.message || '';
    this.isRead = data.is_read ?? false;
    this.createdAt = data.created_at || '';
  }

  public markAsRead(): void {}
}

export type NotificationData = {
  notification_id: string;
  user_id?: string | null;
  message?: string | null;
  is_read?: boolean | null;
  created_at?: string | null;
};

// ===== Portfolio — SRS: FR-16 =====
export class Portfolio {
  private portfolioID: string;
  private officeID: string;
  private projectTitle: string;
  private description: string;
  private category: string;
  private imageURL: string;
  private completedAt: string;

  constructor(data: PortfolioData) {
    this.portfolioID = data.portfolio_id;
    this.officeID = data.office_id || '';
    this.projectTitle = data.project_title || '';
    this.description = data.description || '';
    this.category = data.category || '';
    this.imageURL = data.image_url || '';
    this.completedAt = data.completed_at || '';
  }

  public getDetails(): string { return ''; }
  public updateItem(): void {}
}

export type PortfolioData = {
  portfolio_id: string;
  office_id?: string | null;
  project_title?: string | null;
  description?: string | null;
  category?: string | null;
  image_url?: string | null;
  completed_at?: string | null;
};

// ===== AIAssistant — SRS: FR-02, FR-30, FR-31, FR-32 =====
export class AIAssistant {
  private modelVersion: string;

  constructor(modelVersion: string = '1.0') {
    this.modelVersion = modelVersion;
  }

  public generateDescription(input: string): string { return ''; }
  public onboardClient(input: string): string { return ''; }
  public compareBids(bids: any[]): string { return ''; }
}

// ===== Supporting types (NOT core domain classes) =====
export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export type AIResponse = {
  message: string;
  type: 'chat' | 'description' | 'bid_comparison';
};

export type AuthState = {
  user: ProfileData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: ProfileData['role'] | null;
};

// ===== Backward-compatible type aliases =====
// Domain class names are now canonical. *Data aliases remain for Supabase row compatibility.
// No separate type aliases needed — the class names ARE the domain names.

// ===== Service Categories (SRS exact 8 categories) =====
export const SERVICE_CATEGORIES = [
  'architectural_design',
  'structural_engineering',
  'mep_engineering',
  'permits_consulting',
  'construction_supervision',
  'full_construction',
  'finishing_works',
  'surveying_geomatics',
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];

// ===== Service Categories Data =====
// NOTE: existing sub-category keys (residential_plans, commercial_plans, reinforced_concrete,
// full_supervision, building_permits, concrete_works, land_survey, ...) are kept so seeded
// rows in service_catalog / templates continue to resolve to a label. New keys requested by
// the spec are added alongside them.
export const SERVICE_CATEGORIES_DATA: Record<ServiceCategory, { ar: string; en: string; subcategories: { key: string; ar: string; en: string }[] }> = {
  architectural_design: {
    ar: 'التصميم المعماري',
    en: 'Architectural Design',
    subcategories: [
      { key: 'residential_plans', ar: 'مخططات سكنية', en: 'Residential Plans' },
      { key: 'commercial_plans', ar: 'مخططات تجارية', en: 'Commercial Plans' },
      { key: 'architectural_facades', ar: 'واجهات معمارية', en: 'Architectural Facades' },
      { key: 'interior_design', ar: 'تصميم داخلي', en: 'Interior Design' },
    ],
  },
  structural_engineering: {
    ar: 'الهندسة الإنشائية',
    en: 'Structural Engineering',
    subcategories: [
      { key: 'reinforced_concrete', ar: 'هياكل خرسانية مسلحة', en: 'Reinforced Concrete Structures' },
      { key: 'steel_structures', ar: 'هياكل معدنية', en: 'Steel Structures' },
      { key: 'structural_assessment', ar: 'تقييم الجدارة الإنشائية', en: 'Structural Assessment' },
    ],
  },
  mep_engineering: {
    ar: 'هندسة الميكانيكا والكهرباء والسباكة',
    en: 'MEP Engineering',
    subcategories: [
      { key: 'electrical_systems', ar: 'الأنظمة الكهربائية', en: 'Electrical Systems' },
      { key: 'hvac_systems', ar: 'أنظمة التكييف', en: 'HVAC Systems' },
      { key: 'plumbing', ar: 'الصرف الصحي والسباكة', en: 'Plumbing & Sanitary' },
      { key: 'fire_systems', ar: 'أنظمة الحريق', en: 'Fire Systems' },
    ],
  },
  permits_consulting: {
    ar: 'الاستشارات الهندسية',
    en: 'Engineering Consultations',
    subcategories: [
      { key: 'structural_consultations', ar: 'استشارات إنشائية', en: 'Structural Consultations' },
      { key: 'architectural_consultations', ar: 'استشارات معمارية', en: 'Architectural Consultations' },
      { key: 'feasibility_studies', ar: 'دراسات الجدوى', en: 'Feasibility Studies' },
      { key: 'building_permits', ar: 'طلبات تصاريح البناء', en: 'Building Permit Applications' },
    ],
  },
  construction_supervision: {
    ar: 'الإشراف على التشييد',
    en: 'Construction Supervision',
    subcategories: [
      { key: 'full_supervision', ar: 'إشراف كامل', en: 'Full Supervision' },
      { key: 'periodic_visits', ar: 'زيارات دورية', en: 'Periodic Visits' },
      { key: 'progress_reports', ar: 'تقارير تقدم', en: 'Progress Reports' },
    ],
  },
  full_construction: {
    ar: 'إدارة المشاريع',
    en: 'Project Management',
    subcategories: [
      { key: 'residential_pm', ar: 'إدارة مشاريع سكنية', en: 'Residential Project Management' },
      { key: 'commercial_pm', ar: 'إدارة مشاريع تجارية', en: 'Commercial Project Management' },
      { key: 'scheduling_planning', ar: 'جدولة وتخطيط', en: 'Scheduling & Planning' },
      { key: 'concrete_works', ar: 'الأعمال الإنشائية الخرسانية', en: 'Concrete Structural Works' },
    ],
  },
  finishing_works: {
    ar: 'أعمال التشطيبات',
    en: 'Finishing Works',
    subcategories: [
      { key: 'standard_finishing', ar: 'تشطيبات عادية', en: 'Standard Finishing' },
      { key: 'premium_finishing', ar: 'تشطيبات راقية', en: 'Premium Finishing' },
      { key: 'interior_decoration', ar: 'الديكور والتصميم الداخلي', en: 'Interior Decoration' },
    ],
  },
  surveying_geomatics: {
    ar: 'المساحة والرفع الطبوغرافي',
    en: 'Surveying & Topography',
    subcategories: [
      { key: 'topographic_survey', ar: 'رفع طبوغرافي', en: 'Topographic Survey' },
      { key: 'land_survey', ar: 'مسح طبوغرافي', en: 'Land Survey' },
      { key: 'boundary_determination', ar: 'تحديد الحدود', en: 'Boundary Determination' },
    ],
  },
};

// ===== Arabic → Category Key normalization =====
// The DB may store either English enum keys OR Arabic display strings (legacy seed).
// This map normalizes Arabic variants → canonical English key so lookups always work.
const ARABIC_TO_CATEGORY_KEY: Record<string, ServiceCategory> = {
  'التصميم المعماري':                 'architectural_design',
  'تصميم معماري':                      'architectural_design',
  'تصميم داخلي':                       'architectural_design',
  'الهندسة الإنشائية':                 'structural_engineering',
  'تصميم إنشائي':                      'structural_engineering',
  'دراسات تربة':                       'structural_engineering',
  'هندسة الميكانيكا والكهرباء والسباكة': 'mep_engineering',
  'مخططات MEP':                        'mep_engineering',
  'الاستشارات الهندسية':               'permits_consulting',
  'استشارات هندسية':                   'permits_consulting',
  'مخططات وتصاريح':                    'permits_consulting',
  'الإشراف على التشييد':               'construction_supervision',
  'إشراف هندسي':                       'construction_supervision',
  'إدارة المشاريع':                    'full_construction',
  'أعمال التشطيبات':                   'finishing_works',
  'المساحة والرفع الطبوغرافي':         'surveying_geomatics',
};

export function normalizeCategoryKey(category: string): ServiceCategory | string {
  return ARABIC_TO_CATEGORY_KEY[category] ?? category;
}

// ===== Saudi Cities =====
export const SAUDI_CITIES = [
  { ar: 'الرياض', en: 'Riyadh' },
  { ar: 'جدة', en: 'Jeddah' },
  { ar: 'مكة المكرمة', en: 'Makkah' },
  { ar: 'المدينة المنورة', en: 'Madinah' },
  { ar: 'الدمام', en: 'Dammam' },
  { ar: 'الخبر', en: 'Khobar' },
  { ar: 'الظهران', en: 'Dhahran' },
  { ar: 'أبها', en: 'Abha' },
  { ar: 'تبوك', en: 'Tabuk' },
  { ar: 'القصيم', en: 'Qassim' },
  { ar: 'حائل', en: 'Hail' },
  { ar: 'جازان', en: 'Jazan' },
  { ar: 'نجران', en: 'Najran' },
  { ar: 'الباحة', en: 'Al Baha' },
  { ar: 'الجوف', en: 'Al Jouf' },
  { ar: 'عرعر', en: 'Arar' },
  { ar: 'سكاكا', en: 'Sakaka' },
  { ar: 'ينبع', en: 'Yanbu' },
  { ar: 'الطائف', en: 'Taif' },
] as const;

// ===== Office Types =====
export const OFFICE_TYPES = [
  { ar: 'مكتب هندسي معماري', en: 'Architectural Engineering Office' },
  { ar: 'مكتب هندسي إنشائي', en: 'Structural Engineering Office' },
  { ar: 'مكتب هندسي كهروميكانيكي', en: 'Electromechanical Engineering Office' },
  { ar: 'مكتب استشارات هندسية', en: 'Engineering Consulting Office' },
  { ar: 'مكتب إشراف وإدارة مشاريع', en: 'Supervision & Project Management Office' },
  { ar: 'مكتب هندسي متكامل (جميع التخصصات)', en: 'Integrated Engineering Office (All Specialties)' },
] as const;
