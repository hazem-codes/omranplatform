# عمران | Omran

> منصة ذكية تربط العملاء بالمكاتب الهندسية الموثوقة في المملكة العربية السعودية.
>
> A smart marketplace connecting clients with verified engineering offices in Saudi Arabia.

---

## 🇸🇦 نظرة عامة (Arabic)

### ما هي منصة عمران؟
منصة عمران هي سوق رقمي مُشرَف عليه يجمع بين العملاء والمكاتب الهندسية المرخصة، مع دعم ذكاء اصطناعي، وعقود رقمية، ومدفوعات ضمان (Escrow) لحماية الطرفين.

### المشكلة التي تحلها
- صعوبة إيجاد مكاتب هندسية موثوقة ومرخصة.
- غياب آلية شفافة للعروض والعقود والدفع.
- عدم وجود جهة مشرفة تحمي الطرفين عند النزاع.

### الأدوار الثلاثة
| الدور | الوصف |
|-------|--------|
| 👤 العميل (Client) | يرسل طلبات المشاريع، يستعرض العروض، يوقع العقود، يدفع عبر الضمان |
| 🏢 المكتب الهندسي (Engineering Office) | يقدم العروض، يدير مراحل المشروع، يبيع قوالب جاهزة |
| 🛡️ المشرف (Supervisor) | يعتمد التسجيلات، يراجع القوالب، يدير النزاعات |

### التقنيات المستخدمة
- **الواجهة:** TanStack Start (SSR) + React 19
- **الخلفية:** Supabase (Postgres + Auth + Realtime + Edge Functions)
- **الذكاء الاصطناعي:** Google Gemini عبر Edge Function
- **التصميم:** Tailwind CSS v4 + shadcn/ui
- **الاستضافة:** Cloudflare Worker

### التشغيل محلياً
```bash
git clone <repo-url>
cd omran
npm install
# أنشئ ملف .env وأضف المفاتيح التالية
# SUPABASE_URL=...
# SUPABASE_ANON_KEY=...
# LOVABLE_API_KEY=...
npm run dev
```

### هيكل المجلدات
```
/src         → الكود الأمامي بالكامل
/supabase    → Edge Functions وإعدادات قاعدة البيانات
/public      → ملفات SQL لإعداد الجداول
/docs        → وثائق المشروع
```

### الترخيص
MIT License

---

## 🇬🇧 Overview (English)

### What is Omran?
Omran is a supervised digital marketplace connecting clients with licensed engineering offices, powered by AI assistance, digital contracts, and escrow payments to protect both parties.

### The Problem It Solves
- Finding verified, licensed engineering offices in Saudi Arabia is hard.
- No transparent process for bidding, contracts, and payments.
- No neutral supervisor to protect parties in case of disputes.

### The 3 User Roles
| Role | What They Do |
|------|--------------|
| 👤 **Client** | Submits project requests, reviews bids, signs contracts, pays via escrow |
| 🏢 **Engineering Office** | Submits bids, manages project milestones, sells ready-made templates |
| 🛡️ **Supervisor** | Approves registrations, reviews templates, handles disputes |

### Tech Stack
- **Frontend:** TanStack Start (SSR) + React 19
- **Backend:** Supabase (Postgres + Auth + Realtime + Edge Functions)
- **AI:** Google Gemini via Edge Function
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Hosting:** Cloudflare Worker

### Run Locally
1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   LOVABLE_API_KEY=your_gemini_key
   ```
4. Start the dev server: `npm run dev`

### Top-Level Folder Structure
```
/src         → All frontend code
/supabase    → Edge functions and DB config
/public      → SQL setup files
/docs        → Project documentation
```

### License
MIT License — free to use, modify, and distribute.

---

## 📚 More Documentation
- [User Guide](./docs/user-guide.md) — for end users
- [Developer Guide](./docs/developer-guide.md) — for developers
- [Business Requirements](./docs/business-requirements.md) — for stakeholders
