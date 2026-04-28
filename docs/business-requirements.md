# متطلبات الأعمال | Business Requirements

وثيقة للمراجعين الأكاديميين والمستثمرين وأصحاب المصلحة. For stakeholders, investors, and academic reviewers.

---

# 🇸🇦 القسم العربي

## 1. تعريف المشكلة

- يجد العملاء صعوبة في إيجاد مكاتب هندسية **موثوقة ومرخصة** في المملكة العربية السعودية.
- لا توجد آلية موحدة وشفافة للعروض والعقود.
- لا حماية للمدفوعات — يُدفع المبلغ كاملاً قبل الخدمة في الغالب.
- لا توجد منصة مركزية لسوق الخدمات الهندسية.

## 2. الحل: منصة عمران

- سوق مشرَف يربط العملاء بالمكاتب الهندسية المعتمدة.
- ذكاء اصطناعي للاستقبال، تقدير التكلفة، ومقارنة العروض.
- عقود رقمية مع توقيع إلكتروني.
- مدفوعات ضمان (Escrow) مقسمة على مراحل لحماية الطرفين.
- دعم كامل للعربية والإنجليزية (RTL/LTR).

## 3. الأدوار والقيمة المقدمة

| الدور | المشكلة | القيمة |
|-------|---------|--------|
| العميل | صعوبة إيجاد مكتب موثوق وخوف على المال | منصة موثقة + ضمان للدفع |
| المكتب الهندسي | صعوبة الوصول للعملاء وتحصيل الأجور | تدفق طلبات مستمر + ضمان التحصيل |
| المشرف | غياب رقابة على السوق الهندسي | أدوات رقابة وحل نزاعات |

## 4. المزايا الرئيسية (مطابقة لـ SRS)

| الميزة | رقم المتطلب |
|---------|-------------|
| الشات بوت الذكي والاستقبال | FR-02, FR-30 |
| حاسبة التكاليف | FR-03 |
| كتالوج الخدمات والحجز المباشر | FR-04, FR-06 |
| المناقصات الذكية والمقارنة بالذكاء الاصطناعي | FR-08, FR-32 |
| العقد الرقمي والتوقيع الإلكتروني | FR-10 |
| الضمان والدفع المرحلي | FR-11 |
| نظام التقييم | FR-12 |
| إشراف المشرف | FR-22 إلى FR-29 |
| دعم العربية والإنجليزية | NFR-09 |

## 5. التقنيات والمبرر التجاري

| التقنية | سبب الاختيار | الفائدة التجارية |
|---------|---------------|-------------------|
| Supabase | Postgres + Auth + Realtime جاهزة | تسريع التطوير وتقليل التكلفة |
| TanStack Start | SSR سريع وتحسين SEO | تجربة مستخدم أفضل وترتيب أعلى في البحث |
| Cloudflare Worker | شبكة عالمية بزمن استجابة منخفض | خدمة مستخدمين في السعودية والخليج بسرعة |
| Gemini AI | ذكاء اصطناعي قوي وتكلفة معقولة | تمييز تنافسي عبر الميزات الذكية |
| Tailwind + shadcn/ui | مكتبة تصميم احترافية | واجهة متسقة وسريعة البناء |

## 6. الميزات المضافة فوق متطلبات SRS

- 💬 محادثة فورية (Realtime) بين الأدوار
- 🔑 تسجيل الدخول بحساب Google
- 🗺️ خريطة للمكاتب القريبة
- 📊 تتبع مشتريات القوالب

## 7. الحدود الحالية وخريطة المستقبل

| الحد الحالي | المرجع | الخطة |
|-------------|--------|-------|
| OTP/MFA | FR-01, NFR-04 | ربط بمزود SMS (Twilio/Unifonic) |
| SMS/Email | FR-33 | ربط Resend وTwilio |
| بوابة دفع حقيقية | NFR-06 | تكامل مع HyperPay أو Stripe |
| اختبارات الوحدة | MAINT-1 | إضافة Vitest + تغطية ≥ 70% |

---

# 🇬🇧 English Section

## 1. Problem Statement

- Clients struggle to find **verified, licensed** engineering offices in Saudi Arabia.
- No standardized or transparent bidding and contract process exists.
- No escrow protection — clients often pay upfront with no guarantee.
- No centralized platform for the engineering services marketplace.

## 2. Solution: The Omran Platform

- A supervised marketplace connecting clients with verified engineering offices.
- AI-powered onboarding, cost estimation, and bid comparison.
- Digital contracts with electronic signatures.
- Escrow-based milestone payments protecting both parties.
- Full Arabic and English support (RTL/LTR).

## 3. User Roles & Value Delivered

| Role | Problem Solved | Value Delivered |
|------|----------------|------------------|
| **Client** | Hard to find trusted offices; payment risk | Verified directory + escrow-backed payments |
| **Engineering Office** | Hard to reach clients; collection risk | Steady request flow + guaranteed payment |
| **Supervisor** | No market oversight for engineering services | Tools for approval, dispute handling, account control |

## 4. Key Features (Mapped to SRS)

| Feature | SRS Reference |
|---------|---------------|
| AI Chatbot & Onboarding | FR-02, FR-30 |
| Cost Estimator | FR-03 |
| Service Catalog & Direct Booking | FR-04, FR-06 |
| Smart Bidding + AI Comparison | FR-08, FR-32 |
| Digital Contract & E-Sign | FR-10 |
| Escrow + Milestone Payment Release | FR-11 |
| Rating System | FR-12 |
| Supervisor Oversight | FR-22 to FR-29 |
| Multilingual AR/EN with RTL | NFR-09 |

## 5. Technology Choices & Business Rationale

| Technology | Why Chosen | Business Benefit |
|------------|------------|-------------------|
| **Supabase** | Ready-made Postgres + Auth + Realtime + Edge Functions | Faster time-to-market, lower infra cost |
| **TanStack Start** | Fast SSR + better SEO | Better UX and higher search rankings |
| **Cloudflare Worker** | Global low-latency edge network | Fast experience for users in KSA & Gulf |
| **Gemini AI** | Powerful AI at reasonable cost | Competitive differentiation via smart features |
| **Tailwind + shadcn/ui** | Modern, accessible design system | Consistent, quick-to-build UI |

## 6. Features Added Beyond Original SRS

- 💬 **Real-time chat** between clients, offices, and supervisors
- 🔑 **Google OAuth** one-click sign-in
- 🗺️ **Map view** for nearby engineering offices
- 📊 **Template purchase tracking** for clients and sellers

## 7. Current Limitations & Future Roadmap

| Limitation | SRS Ref | Planned Solution |
|------------|---------|-------------------|
| OTP/MFA missing | FR-01, NFR-04 | Integrate SMS provider (Twilio / Unifonic) |
| No SMS/Email notifications | FR-33 | Integrate Resend + Twilio |
| Escrow is logical only | NFR-06 | Integrate HyperPay or Stripe payment gateway |
| No unit tests | MAINT-1 | Add Vitest suite with ≥ 70% coverage |
| Template modification pricing tiers | FR-16 | Add tiered pricing model |

---

## Summary

Omran delivers a **trusted, AI-enhanced, escrow-protected** engineering marketplace for Saudi Arabia. It solves real pain points for three distinct user groups through a modern, scalable technology stack while maintaining an honest roadmap for remaining gaps.
