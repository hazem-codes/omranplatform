# دليل المطور | Developer Guide

للمطورين الجدد المنضمين لمشروع عمران. For developers joining the Omran project.

---

# 🇸🇦 القسم العربي

## 1. نظرة معمارية عامة

عمران تطبيق **Full-Stack** يعمل كالتالي:

- **الواجهة:** TanStack Start v1 (SSR عبر Vite) تعمل داخل **Cloudflare Worker**.
- **الخلفية:** Supabase يوفر قاعدة بيانات Postgres، المصادقة، Realtime، وEdge Functions.
- **الذكاء الاصطناعي:** Edge Function باسم `ai-chat` تتصل بـ Google Gemini عبر Lovable AI Gateway.

عند فتح صفحة، Cloudflare Worker يعرض HTML جاهز (SSR)، ثم React يأخذ دوره. كل استدعاء للبيانات يمر عبر Supabase مع حماية RLS.

## 2. هيكل المجلدات

| المجلد | الوصف |
|--------|--------|
| `/src/routes/` | توجيه بالملفات — كل ملف = صفحة |
| `/src/services/` | منطق الأعمال — ملف لكل كيان (bidService, contractService...) |
| `/src/types/index.ts` | تعريفات TypeScript لجميع الكيانات |
| `/src/components/` | مكونات UI قابلة لإعادة الاستخدام |
| `/src/hooks/` | Hooks مخصصة (useAuthGuard, use-mobile) |
| `/src/context/` | حالة عامة (AuthContext, ThemeContext) |
| `/supabase/functions/ai-chat/` | دالة Edge للذكاء الاصطناعي Gemini |
| `/public/*.sql` | مخطط قاعدة البيانات وسياسات RLS |

## 3. نمط "Thin Class + Service"

الكيانات في `types/index.ts` مجرد **أشكال بيانات** (interfaces). كل **المنطق الحقيقي** في `services/*.ts`.

**مثال — Bid:**
```ts
// src/types/index.ts
export interface Bid {
  id: string;
  project_id: string;
  office_id: string;
  price: number;
  timeline: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
}
```
```ts
// src/services/bidService.ts
export const bidService = {
  async submitBid(...) { ... },
  async acceptBid(bidId) { ... }, // ← يُنشئ عقداً تلقائياً
  async withdrawBid(...) { ... },
};
```

## 4. إضافة ميزة جديدة (5 خطوات)

1. **عرّف النوع** في `src/types/index.ts`.
2. **أنشئ Service** في `src/services/` يحتوي على منطق CRUD.
3. **أنشئ Route** في `src/routes/` باسم الصفحة.
4. **أضف سياسة RLS** في `public/seed.sql` إذا كان الجدول جديداً.
5. **اختبر التدفق** من الواجهة حتى قاعدة البيانات.

## 5. قاعدة البيانات والأمان

- كل الجداول مفعّل عليها **Row Level Security (RLS)**.
- الأدوار مخزنة في جدول `user_roles` (وليس في `profiles` — منع تصعيد الصلاحيات).
- دالة `has_role(uid, role)` من نوع `SECURITY DEFINER` للتحقق الآمن من الصلاحيات.
- **تشغيل الإعداد:**
  ```sql
  -- في Supabase SQL Editor
  \i public/seed.sql
  \i public/marketplace_setup.sql
  \i public/conversations_setup.sql
  ```

## 6. متغيرات البيئة

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
LOVABLE_API_KEY=sk-...
```

## 7. الثغرات المعروفة (بصراحة)

| الفجوة | المرجع | الحالة |
|---------|--------|--------|
| OTP/MFA غير مفعل | FR-01, NFR-04 | ❌ |
| إشعارات SMS/Email | FR-33 | ❌ |
| بوابة دفع حقيقية للـ Escrow | NFR-06 | ⚠️ منطقي فقط |
| اختبارات الوحدة | MAINT-1 | ❌ |
| مستويات أسعار تعديل القوالب | FR-16 | ⚠️ |

---

# 🇬🇧 English Section

## 1. Architecture Overview

Omran is a **full-stack** application:

- **Frontend:** TanStack Start v1 (SSR via Vite) running inside a **Cloudflare Worker**.
- **Backend:** Supabase provides Postgres, Auth, Realtime, and Edge Functions.
- **AI:** An Edge Function named `ai-chat` connects to **Google Gemini** via the Lovable AI Gateway.

When a user opens a page, the Cloudflare Worker returns fully rendered HTML (SSR), then React hydrates. All data calls go through Supabase with RLS protection.

## 2. Folder Structure

| Folder | Purpose |
|--------|---------|
| `/src/routes/` | File-based routing — each file = one page |
| `/src/services/` | Business logic — one file per domain class |
| `/src/types/index.ts` | All TypeScript types and interfaces |
| `/src/components/` | Reusable UI components |
| `/src/hooks/` | Custom hooks (useAuthGuard, use-mobile) |
| `/src/context/` | Global state (AuthContext, ThemeContext) |
| `/supabase/functions/ai-chat/` | Gemini AI Edge Function |
| `/public/*.sql` | DB schema and RLS policies |

## 3. The "Thin Class + Service" Pattern

Entities in `types/index.ts` are **just data shapes** (interfaces). All **real logic** lives in `services/*.ts`.

**Example — Bid:**
```ts
// src/types/index.ts
export interface Bid {
  id: string;
  project_id: string;
  office_id: string;
  price: number;
  timeline: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
}
```
```ts
// src/services/bidService.ts
export const bidService = {
  async submitBid(...) { ... },
  async acceptBid(bidId) { ... }, // ← auto-generates a contract
  async withdrawBid(...) { ... },
};
```
The type defines the **shape**. The service defines the **behavior**.

## 4. How to Add a New Feature (5 Steps)

1. **Define the type** in `src/types/index.ts`.
2. **Create a service** in `src/services/` with CRUD logic.
3. **Create a route** in `src/routes/`.
4. **Add RLS policy** in `public/seed.sql` if the table is new.
5. **Test end-to-end** from UI to database.

## 5. Database & Security

- All tables have **Row Level Security (RLS)** enabled.
- Roles are stored in the `user_roles` table — **never** in `profiles` (prevents privilege escalation).
- The `has_role(uid, role)` function is `SECURITY DEFINER` for safe RBAC checks.
- **Setup scripts:**
  ```sql
  -- Run in Supabase SQL Editor
  \i public/seed.sql
  \i public/marketplace_setup.sql
  \i public/conversations_setup.sql
  ```

## 6. Environment Variables

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
LOVABLE_API_KEY=sk-...
```

## 7. Known Gaps (Honest, from SRS)

| Gap | SRS Reference | Status |
|-----|---------------|--------|
| OTP/MFA not implemented | FR-01, NFR-04 | ❌ Missing |
| SMS/Email notifications | FR-33 | ❌ Missing |
| Real payment gateway for escrow | NFR-06 | ⚠️ Logical only |
| Unit tests | MAINT-1 | ❌ Missing |
| Template modification pricing tiers | FR-16 | ⚠️ Partial |

These are documented honestly to guide future work.
