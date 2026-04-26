# Omran Platform — Strict Code-to-Documentation Compliance Report

> **Generated**: 2026-04-22  
> **Source of truth**: Actual codebase files, verified line-by-line  
> **Rules**: No guessing, no inference, no invention. Every item verified in code.

---

## 1. Overview

**Omran (عمران)** is a B2B engineering services marketplace for Saudi Arabia. Three roles interact through the platform: **Client**, **Engineering Office**, and **Supervisor**. The platform includes AI-assisted features, bilingual support (Arabic RTL + English LTR), and a Supabase backend.

---

## 2. Architecture

| Layer | Technology |
|---|---|
| Frontend | TanStack Start v1 (React 19), Vite 7 |
| Styling | Tailwind CSS v4, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| AI | Lovable AI Gateway via Supabase Edge Function `ai-chat` |
| Deployment | Cloudflare Workers (Edge) |
| State | React Context (AuthContext, ThemeContext) |
| i18n | Custom i18n (`src/i18n.ts`) with locale files (`src/locales/ar.json`, `src/locales/en.json`) |

---

## 3. Folder Structure (Verified)

```
src/
├── components/          # Reusable UI components
│   ├── ui/              # shadcn/ui primitives
│   ├── ChatbotWidget.tsx
│   ├── Footer.tsx
│   ├── LanguageToggle.tsx
│   ├── LoadingSpinner.tsx
│   ├── Navbar.tsx
│   ├── RatingStars.tsx
│   ├── StatusBadge.tsx
│   └── ThemeToggle.tsx
├── context/
│   ├── AuthContext.tsx   # AuthProvider, useAuth()
│   └── ThemeContext.tsx  # ThemeProvider, useTheme()
├── data/
│   ├── seedData.ts      # 5 offices, services, templates, portfolio
│   └── serviceCatalogData.ts  # Category label helpers
├── hooks/
│   └── use-mobile.tsx
├── i18n.ts
├── integrations/supabase/
│   ├── client.ts        # Browser Supabase client (anon key)
│   ├── client.server.ts # Server Supabase client (service role)
│   ├── auth-middleware.ts
│   └── types.ts         # Auto-generated DB types (read-only)
├── lib/
│   └── utils.ts
├── locales/
│   ├── ar.json
│   └── en.json
├── routes/              # TanStack file-based routing
│   ├── __root.tsx
│   ├── index.tsx
│   ├── login.tsx
│   ├── register.tsx
│   ├── estimator.tsx
│   ├── notifications.tsx
│   ├── client/          # 13 route files
│   ├── office/          # 8 route files
│   └── supervisor/      # 3 route files
├── services/            # 16 service modules
├── styles.css
├── types/
│   └── index.ts         # Domain model classes + data types
├── router.tsx
└── routeTree.gen.ts     # Auto-generated (read-only)

supabase/
├── config.toml
├── functions/
│   └── ai-chat/index.ts  # Edge function
└── migrations/
    ├── 20260422073205_*.sql
    └── 20260422075120_*.sql

public/
└── audit-report.md

docs/
└── implementation-map.md
```

---

## 4. Domain / Class Reference

All 19 domain entities are defined in `src/types/index.ts` as **classes** (NOT interfaces).

### Key Rules
- **All attributes are private** by default in the UML and in code.
- **`User` is the only class with `protected` attributes** (userID, name, email, password, role).
- **Methods are public**.
- Implementation classes use `Entity` suffix (e.g., `Profile`). The UML/domain name is the primary identity.
- Backward-compatible type aliases are exported (e.g., `export type Profile = ProfileData`).

### 4.1 User (base class)

| Property | UML Name | Code Attribute | Visibility | Type |
|---|---|---|---|---|
| userID | userID | `userID` | **protected** | `string` |
| name | name | `name` | **protected** | `string` |
| email | email | `email` | **protected** | `string` |
| password | password | `password` | **protected** | `string` |
| role | role | `role` | **protected** | `'client' \| 'engineering_office' \| 'supervisor'` |

**Methods**: `register()`, `login()`, `logout()`  
**Implementation class**: `User`  
**File**: `src/types/index.ts` (lines 13–31)  
**DB table**: `profiles` (id, name, email, role) + `auth.users`  
**SRS**: FR-01, FR-03  

### 4.2 Profile

| Property | UML Name | Code Attribute | Visibility | Type |
|---|---|---|---|---|
| id | id | `id` | private | `string` |
| name | name | `name` | private | `string` |
| email | email | `email` | private | `string` |
| role | role | `role` | private | `'client' \| 'engineering_office' \| 'supervisor'` |

**Methods**: (none)  
**Implementation class**: `Profile`  
**Data type alias**: `ProfileData`  
**Backward-compatible alias**: `export type Profile = ProfileData`  
**File**: `src/types/index.ts` (lines 34–53)  
**DB table**: `profiles`  
**SRS**: FR-01  
**Note**: Profile is not shown in the UML diagram but is listed in the user's domain entity requirements and exists in the DB schema.

### 4.3 Client

| Property | UML Name | Code Attribute | Visibility | Type |
|---|---|---|---|---|
| phone | phone | `phone` | private | `string` |
| isActive | isActive | `isActive` | private | `boolean` |

**Methods**: `submitProjectRequest()`, `viewBids()`, `acceptBid()`, `rejectBid()`, `submitReport()`, `viewMilestone()`, `rejectMilestone()`, `rateMilestone()`, `acceptMilestone()`, `browseCatalog()`, `signContract()`, `bookTemplate()`, `chatWithBot()`  
**Implementation class**: `Client`  
**Data type alias**: `ClientData`  
**Backward-compatible alias**: `export type Client = ClientData`  
**File**: `src/types/index.ts` (lines 56–84)  
**DB table**: `clients`  
**SRS**: FR-04 through FR-14  

### 4.4 EngineeringOffice

| Property | UML Name | Code Attribute | Visibility | Type |
|---|---|---|---|---|
| licenseNumber | licenseNumber | `licenseNumber` | private | `string` |
| description | description | `description` | private | `string` |
| coverageArea | coverageArea | `coverageArea` | private | `string` |
| isVerified | isVerified | `isVerified` | private | `boolean` |
| licenseExpiryDate | licenseExpiryDate | `licenseExpiryDate` | private | `string` |

**Methods**: `browseProjectRequests()`, `submitBid()`, `manageProfile()`, `createMilestone()`, `receivePayment()`  
**Implementation class**: `EngineeringOffice`  
**Data type alias**: `EngineeringOfficeData`  
**File**: `src/types/index.ts` (lines 87–116)  
**DB table**: `engineering_offices`  
**SRS**: FR-04, FR-15, FR-16  
**Composition**: Owns `Portfolio` (1:N via `portfolio.office_id`)  

### 4.5 Supervisor

| Property | UML Name | Code Attribute | Visibility | Type |
|---|---|---|---|---|
| phone | phone | `phone` | private | `string` |

**Methods**: `viewOfficesRegistration()`, `approveOfficeRegistration()`, `rejectOfficeRegistration()`, `viewProjects()`, `approveProjectRequest()`, `rejectProjectRequest()`, `approveTemplate()`, `rejectTemplate()`, `viewReports()`, `addReportFeedback()`, `deleteReport()`  
**Implementation class**: `Supervisor`  
**Data type alias**: `SupervisorData`  
**Backward-compatible alias**: `export type Supervisor = SupervisorData`  
**File**: `src/types/index.ts` (lines 119–142)  
**DB table**: `supervisors`  
**SRS**: FR-17 through FR-29  
**Note**: `viewReports()` exists in code but is NOT in the UML diagram. Kept for functionality.

### 4.6 ProjectRequest

| Property | UML Name | Code Attribute | Visibility | Type |
|---|---|---|---|---|
| requestID | requestID | `requestID` | private | `string` |
| clientID | clientID | `clientID` | private | `string` |
| title | title | `title` | private | `string` |
| description | description | `description` | private | `string` |
| status | status | `status` | private | `string` |
| createdAt | createdAt | `createdAt` | private | `string` |
| budgetRange | budgetRange | `budgetRange` | private | `string` |
| location | location | `location` | private | `string` |

**Methods**: `getDetails()`, `updateStatus()`  
**Implementation class**: `ProjectRequest`  
**Data type alias**: `ProjectRequestData`  
**Backward-compatible alias**: `export type ProjectRequest = ProjectRequestData`  
**File**: `src/types/index.ts` (lines 145–179)  
**DB table**: `project_requests`  
**SRS**: FR-07  

### 4.7 Bid

| Property | UML Name | Code Attribute | Visibility | Type |
|---|---|---|---|---|
| bidID | bidID | `bidID` | private | `string` |
| officeID | officeID | `officeID` | private | `string` |
| requestID | requestID | `requestID` | private | `string` |
| price | price | `price` | private | `number` |
| timeline | timeline | `timeline` | private | `number` |
| status | status | `status` | private | `string` |
| submittedAt | submittedAt | `submittedAt` | private | `string` |

**Methods**: `updateStatus()`, `getDetails()`  
**Implementation class**: `Bid`  
**Data type alias**: `BidData`  
**Backward-compatible alias**: `export type Bid = BidData`  
**File**: `src/types/index.ts` (lines 182–213)  
**DB table**: `bids`  
**SRS**: FR-08, FR-09  

### 4.8 Contract

| Property | UML Name | Code Attribute | Visibility | Type |
|---|---|---|---|---|
| contractID | contractID | `contractID` | private | `string` |
| clientID | clientID | `clientID` | private | `string` |
| officeID | officeID | `officeID` | private | `string` |
| title | title | `title` | private | `string` |
| description | description | `description` | private | `string` |
| signedAt | signedAt | `signedAt` | private | `string` |
| createdAt | createdAt | `createdAt` | private | `string` |
| isClientSigned | isClientSigned | `isClientSigned` | private | `boolean` |
| isOfficeSigned | isOfficeSigned | `isOfficeSigned` | private | `boolean` |

**Methods**: `getPDF()`, `generateContract()`, `eSign()`  
**Implementation class**: `Contract`  
**Data type alias**: `ContractData`  
**Backward-compatible alias**: `export type Contract = ContractData`  
**File**: `src/types/index.ts` (lines 216–254)  
**DB table**: `contracts`  
**SRS**: FR-10  

### 4.9 Project ⭐ Core Entity

| Property | UML Name | Code Attribute | Visibility | Type |
|---|---|---|---|---|
| projectID | projectID | `projectID` | private | `string` |
| contractID | contractID | `contractID` | private | `string` |
| title | title | `title` | private | `string` |
| status | status | `status` | private | `string` |
| progressPercentage | progressPercentage | `progressPercentage` | private | `number` |
| description | description | `description` | private | `string` |
| startDate | startDate | `startDate` | private | `string` |

**Methods**: `updateProgress()`, `getDetails()`  
**Implementation class**: `Project`  
**Data type alias**: `ProjectData`  
**Backward-compatible alias**: `export type Project = ProjectData`  
**File**: `src/types/index.ts` (lines 257–288)  
**DB table**: `projects`  
**SRS**: FR-11, project tracking  
**Composition**: Owns `Milestone` (1:N via `milestones.project_id`)  

### 4.10 Milestone

| Property | UML Name | Code Attribute | Visibility | Type |
|---|---|---|---|---|
| milestoneID | milestoneID | `milestoneID` | private | `string` |
| projectID | projectID | `projectID` | private | `string` |
| title | title | `title` | private | `string` |
| description | description | `description` | private | `string` |
| dueDate | dueDate | `dueDate` | private | `string` |
| deliverableURL | deliverableURL | `deliverableURL` | private | `string` |
| status | status | `status` | private | `string` |

**Methods**: `updateStatus()`  
**Implementation class**: `Milestone`  
**Data type alias**: `MilestoneData`  
**Backward-compatible alias**: `export type Milestone = MilestoneData`  
**File**: `src/types/index.ts` (lines 291–321)  
**DB table**: `milestones`  
**SRS**: FR-11, FR-12  
**Composed by**: `Project` (via `milestones.project_id → projects.project_id`)  

### 4.11 Rating

| Property | UML Name | Code Attribute | Visibility | Type |
|---|---|---|---|---|
| ratingID | ratingID | `ratingID` | private | `string` |
| milestoneID | milestoneID | `milestoneID` | private | `string` |
| clientID | clientID | `clientID` | private | `string` |
| stars | stars | `stars` | private | `number` |
| comment | comment | `comment` | private | `string` |
| createdAt | createdAt | `createdAt` | private | `string` |

**Methods**: `submitRating()`, `getDetails()`  
**Implementation class**: `Rating`  
**Data type alias**: `RatingData`  
**Backward-compatible alias**: `export type Rating = RatingData`  
**File**: `src/types/index.ts` (lines 324–352)  
**DB table**: `ratings`  
**SRS**: FR-12  

### 4.12 Payment

| Property | UML Name | Code Attribute | Visibility | Type |
|---|---|---|---|---|
| paymentID | paymentID | `paymentID` | private | `string` |
| escrowID | escrowID | `escrowID` | private | `string` |
| milestoneID | milestoneID | `milestoneID` | private | `string` |
| status | status | `status` | private | `boolean` |
| amount | amount | `amount` | private | `number` |
| createdAt | createdAt | `createdAt` | private | `string` |

**Methods**: `refund()`, `getPDF()`  
**Implementation class**: `Payment`  
**Data type alias**: `PaymentData`  
**Backward-compatible alias**: `export type Payment = PaymentData`  
**File**: `src/types/index.ts` (lines 355–383)  
**DB table**: `payments`  
**SRS**: FR-14  

### 4.13 Escrow

| Property | UML Name | Code Attribute | Visibility | Type |
|---|---|---|---|---|
| escrowID | escrowID | `escrowID` | private | `string` |
| contractID | contractID | `contractID` | private | `string` |
| totalAmount | totalAmount | `totalAmount` | private | `number` |
| releasedAmount | releasedAmount | `releasedAmount` | private | `number` |
| status | status | `status` | private | `string` |
| createdAt | createdAt | `createdAt` | private | `string` |

**Methods**: `deposit()`, `release()`, `refund()`, `getBalance()`  
**Implementation class**: `Escrow`  
**Data type alias**: `EscrowData`  
**Backward-compatible alias**: `export type Escrow = EscrowData`  
**File**: `src/types/index.ts` (lines 386–416)  
**DB table**: `escrow`  
**SRS**: FR-14, FR-29  

### 4.14 Template

| Property | UML Name | Code Attribute | Visibility | Type |
|---|---|---|---|---|
| templateID | templateID | `templateID` | private | `string` |
| officeID | officeID | `officeID` | private | `string` |
| price | price | `price` | private | `number` |
| title | title | `title` | private | `string` |
| description | description | `description` | private | `string` |
| isAvailable | isAvailable | `isAvailable` | private | `boolean` |
| isApproved | isApproved | `isApproved` | private | `boolean` |

**Methods**: `updateStatus()`, `deleteTemplate()`, `editTemplate()`  
**Implementation class**: `Template`  
**Data type alias**: `TemplateData`  
**Backward-compatible alias**: `export type Template = TemplateData`  
**File**: `src/types/index.ts` (lines 419–451)  
**DB table**: `templates`  
**SRS**: FR-05, FR-16, FR-26  

### 4.15 ServiceCatalog

| Property | UML Name | Code Attribute | Visibility | Type |
|---|---|---|---|---|
| catalogID | catalogID | `catalogID` | private | `string` |
| officeID | officeID | `officeID` | private | `string` |
| category | category | `category` | private | `string` |
| subCategory | subCategory | `subCategory` | private | `string` |
| pricingModel | pricingModel | `pricingModel` | private | `string` |
| price | _(not in UML)_ | `price` | private | `number` |

**Methods**: `addService()`, `editService()`  
**Implementation class**: `ServiceCatalog`  
**Data type alias**: `ServiceCatalogData`  
**Backward-compatible alias**: `export type ServiceCatalog = ServiceCatalogData`  
**File**: `src/types/index.ts` (lines 454–482)  
**DB table**: `service_catalog`  
**SRS**: FR-15  
**Note**: `price` attribute exists in code and DB but is NOT in the UML diagram. Kept because it exists in the database schema and removing it would break functionality.

### 4.16 Report

| Property | UML Name | Code Attribute | Visibility | Type |
|---|---|---|---|---|
| reportID | reportID | `reportID` | private | `string` |
| clientID | clientID | `clientID` | private | `string` |
| projectID | projectID | `projectID` | private | `string` |
| description | description | `description` | private | `string` |
| status | status | `status` | private | `string` |
| createdAt | createdAt | `createdAt` | private | `string` |

**Methods**: `viewReport()`, `updateStatus()`  
**Implementation class**: `Report`  
**Data type alias**: `ReportData`  
**Backward-compatible alias**: `export type Report = ReportData`  
**File**: `src/types/index.ts` (lines 485–513)  
**DB table**: `reports`  
**SRS**: FR-13, FR-29  

### 4.17 Notification

| Property | UML Name | Code Attribute | Visibility | Type |
|---|---|---|---|---|
| notificationID | notificationID | `notificationID` | private | `string` |
| userID | userID | `userID` | private | `string` |
| message | message | `message` | private | `string` |
| isRead | isRead | `isRead` | private | `boolean` |
| createdAt | createdAt | `createdAt` | private | `string` |

**Methods**: `markAsRead()`  
**Implementation class**: `Notification`  
**Data type alias**: `NotificationData`  
**Backward-compatible alias**: `export type Notification = NotificationData`  
**File**: `src/types/index.ts` (lines 516–540)  
**DB table**: `notifications`  
**SRS**: FR-33  

### 4.18 Portfolio ⭐ Core Entity

| Property | UML Name | Code Attribute | Visibility | Type |
|---|---|---|---|---|
| portfolioID | portfolioID | `portfolioID` | private | `string` |
| officeID | officeID | `officeID` | private | `string` |
| projectTitle | projectTitle | `projectTitle` | private | `string` |
| description | description | `description` | private | `string` |
| category | category | `category` | private | `string` |
| imageURL | imageURL | `imageURL` | private | `string` |
| completedAt | completedAt | `completedAt` | private | `string` |

**Methods**: `getDetails()`, `updateItem()`  
**Implementation class**: `Portfolio`  
**Data type alias**: `PortfolioData`  
**Backward-compatible alias**: `export type Portfolio = PortfolioData`  
**File**: `src/types/index.ts` (lines 543–574)  
**DB table**: `portfolio`  
**SRS**: FR-16  
**Composed by**: `EngineeringOffice` (via `portfolio.office_id → engineering_offices.id`)  

### 4.19 AIAssistant

| Property | UML Name | Code Attribute | Visibility | Type |
|---|---|---|---|---|
| modelVersion | modelVersion | `modelVersion` | private | `string` |

**Methods**: `generateDescription()`, `onboardClient()`, `compareBids()`  
**Implementation class**: `AIAssistant`  
**File**: `src/types/index.ts` (lines 577–587)  
**Edge function**: `supabase/functions/ai-chat/index.ts`  
**Service**: `src/services/aiService.ts`  
**SRS**: FR-02, FR-30, FR-31, FR-32  

---

## 5. Supporting Types (NOT core domain classes)

These are utility types defined in `src/types/index.ts`:

| Type | Purpose | Line |
|---|---|---|
| `ChatMessage` | AI chat message format (`role`, `content`, `timestamp`) | 590–594 |
| `AIResponse` | AI response wrapper (`message`, `type`) | 596–599 |
| `AuthState` | Authentication state for React context | 601–606 |
| `ServiceCategory` | Union of 8 category keys | 639 |
| `SERVICE_CATEGORIES` | Const array of 8 category keys | 628–637 |
| `SERVICE_CATEGORIES_DATA` | Full bilingual category/subcategory data | 642–721 |
| `SAUDI_CITIES` | 19 Saudi city objects (ar/en) | 724–744 |
| `OFFICE_TYPES` | 6 office type objects (ar/en) | 747–754 |

---

## 6. Service / Function Reference

All services are in `src/services/`. Each uses the Supabase client from `@/integrations/supabase/client`.

### 6.1 authService (`src/services/authService.ts`)
| Function | Signature |
|---|---|
| `login` | `(email: string, password: string) → Promise` |
| `register` | `(email: string, password: string, name: string, role: string, meta?: Record<string, string>) → Promise` |
| `logout` | `() → Promise<void>` |
| `getCurrentUser` | `() → Promise` |
| `getSession` | `() → Promise` |

### 6.2 clientService (`src/services/clientService.ts`)
| Function | Signature |
|---|---|
| `getProfile` | `(clientId: string) → Promise` |
| `updatePhone` | `(clientId: string, phone: string) → Promise` |

### 6.3 engineeringOfficeService (`src/services/engineeringOfficeService.ts`)
| Function | Signature |
|---|---|
| `registerWithLicense` | `(data) → Promise` |
| `getOfficeProfile` | `(officeId: string) → Promise` |
| `updateOfficeProfile` | `(officeId: string, updates) → Promise` |
| `verifyLicense` | `(licenseNumber: string) → Promise<boolean>` |
| `browseProjectRequests` | `(filters?) → Promise` |
| `receivePayment` | `(milestoneId: string) → Promise` |
| `getProfile` | alias → `getOfficeProfile` |
| `update` | alias → `updateOfficeProfile` |
| `getVerified` | `() → Promise` |
| `getAll` | `() → Promise` |
| `getPortfolio` | `(officeId: string) → Promise` |
| `addPortfolioItem` | `(item) → Promise` |

### 6.4 projectRequestService (`src/services/projectRequestService.ts`)
| Function | Signature |
|---|---|
| `submitProjectRequest` | `(data) → Promise` |
| `getClientRequests` | `(clientId: string) → Promise` |
| `getApprovedRequests` | `() → Promise` |
| `updateRequestStatus` | `(requestId: string, status: string) → Promise` |
| `submit` | alias → `submitProjectRequest` |
| `getByClient` | alias → `getClientRequests` |
| `getApproved` | alias → `getApprovedRequests` |
| `getAll` | `() → Promise` |
| `updateStatus` | alias → `updateRequestStatus` |

### 6.5 bidService (`src/services/bidService.ts`)
| Function | Signature |
|---|---|
| `submitBid` | `(data) → Promise` |
| `withdrawBid` | `(bidId: string) → Promise` |
| `getBidsForRequest` | `(requestId: string) → Promise` |
| `acceptBid` | `(bidId: string) → Promise` |
| `rejectBid` | `(bidId: string) → Promise` |
| `updateStatus` | `(bidId: string, status: string) → Promise` |
| `submit` | alias → `submitBid` |
| `getByRequest` | alias → `getBidsForRequest` |
| `getByOffice` | `(officeId: string) → Promise` |
| `withdraw` | alias → `withdrawBid` |

### 6.6 contractService (`src/services/contractService.ts`)
| Function | Signature |
|---|---|
| `generateContract` | `(clientId: string, officeId: string, bidId: string) → Promise` |
| `signContract` | `(contractId: string, role: 'client' \| 'office') → Promise` |
| `getContract` | `(contractId: string) → Promise` |
| `exportContractPDF` | `(contractId: string) → Promise<Blob>` |
| `create` | `(contract) → Promise` |
| `getById` | alias → `getContract` |
| `getByUser` | `(userId: string) → Promise` |
| `signAsClient` | alias → `signContract('client')` |
| `signAsOffice` | alias → `signContract('office')` |

### 6.7 projectService (`src/services/projectService.ts`)
| Function | Signature |
|---|---|
| `getById` | `(projectId: string) → Promise` |
| `getAll` | `() → Promise` |
| `create` | `(project) → Promise` |
| `updateProgress` | `(projectId: string, progress: number) → Promise` |

### 6.8 milestoneService (`src/services/milestoneService.ts`)
| Function | Signature |
|---|---|
| `createMilestonePlan` | `(projectId: string, milestones[]) → Promise` |
| `submitMilestone` | `(milestoneId: string, deliverableURL: string) → Promise` |
| `approveMilestone` | `(milestoneId: string) → Promise` |
| `rejectMilestone` | `(milestoneId: string) → Promise` |
| `getMilestones` | `(projectId: string) → Promise` |
| `create` | `(milestone) → Promise` |
| `getByProject` | alias → `getMilestones` |
| `updateStatus` | `(milestoneId: string, status: string) → Promise` |
| `submitDeliverable` | alias → `submitMilestone` |

### 6.9 ratingService (`src/services/ratingService.ts`)
| Function | Signature |
|---|---|
| `submitRating` | `(milestoneId, clientId, stars, comment?) → Promise` |
| `getRatingsByOffice` | `(officeId: string) → Promise` |
| `getAverageRating` | `(officeId: string) → Promise<number>` |
| `submit` | alias → `submitRating` |
| `getByMilestone` | `(milestoneId: string) → Promise` |

### 6.10 escrowService (`src/services/escrowService.ts`)
| Function | Signature |
|---|---|
| `deposit` | `(contractId: string, amount: number) → Promise` |
| `releaseFunds` | `(milestoneId: string) → Promise` |
| `refund` | `(escrowId: string) → Promise` |
| `getBalance` | `(escrowId: string) → Promise<number>` |
| `freezeEscrow` | `(escrowId: string) → Promise` |
| `create` | alias → `deposit` |
| `getByContract` | `(contractId: string) → Promise` |
| `release` | `(escrowId: string, amount: number) → Promise` |
| `freeze` | alias → `freezeEscrow` |

### 6.11 templateService (`src/services/templateService.ts`)
| Function | Signature |
|---|---|
| `uploadTemplate` | `(data) → Promise` |
| `getApprovedTemplates` | `() → Promise` |
| `purchaseTemplate` | `(templateId, clientId) → Promise` |
| `deleteTemplate` | `(templateId: string) → Promise` |
| `getAll` | `() → Promise` |
| `getApproved` | alias → `getApprovedTemplates` |
| `getByOffice` | `(officeId: string) → Promise` |
| `upload` | alias → `uploadTemplate` |
| `approve` | `(templateId: string) → Promise` |
| `reject` | `(templateId: string) → Promise` |

### 6.12 serviceCatalogService (`src/services/serviceCatalogService.ts`)
| Function | Signature |
|---|---|
| `getAll` | `() → Promise` |
| `getByOffice` | `(officeId: string) → Promise` |
| `getByCategory` | `(category: string) → Promise` |
| `addService` | `(officeId: string, data) → Promise` |
| `editService` | `(catalogId: string, data) → Promise` |
| `deleteService` | `(catalogId: string) → Promise` |
| `getCatalogByOffice` | alias → `getByOffice` |
| `searchCatalog` | `(filters) → Promise` |
| `add` | alias → `addService` |
| `remove` | alias → `deleteService` |

### 6.13 reportService (`src/services/reportService.ts`)
| Function | Signature |
|---|---|
| `submitReport` | `(clientId, projectId, description) → Promise` |
| `getReportsByClient` | `(clientId: string) → Promise` |
| `updateReportStatus` | `(reportId, status) → Promise` |
| `submit` | alias → `submitReport` |
| `getByClient` | alias → `getReportsByClient` |
| `getAll` | `() → Promise` |
| `updateStatus` | alias → `updateReportStatus` |

### 6.14 notificationService (`src/services/notificationService.ts`)
| Function | Signature |
|---|---|
| `send` | `(userId: string, message: string) → Promise` |
| `sendNotification` | alias → `send` |
| `getNotifications` | `(userId: string) → Promise` |
| `getByUser` | alias → `getNotifications` |
| `markAsRead` | `(notificationId: string) → Promise` |
| `markAllAsRead` | `(userId: string) → Promise` |
| `getUnreadCount` | `(userId: string) → Promise<number>` |

### 6.15 supervisorService (`src/services/supervisorService.ts`)
| Function | Signature |
|---|---|
| `getOfficeRegistrations` | `() → Promise` |
| `approveOfficeRegistration` | `(officeId: string) → Promise` |
| `rejectOfficeRegistration` | `(officeId, reason) → Promise` |
| `getProjectRequests` | `() → Promise` |
| `approveProjectRequest` | `(requestId: string) → Promise` |
| `rejectProjectRequest` | `(requestId, feedback) → Promise` |
| `getPendingTemplates` | `() → Promise` |
| `approveTemplate` | `(templateId: string) → Promise` |
| `rejectTemplate` | `(templateId, reason) → Promise` |
| `getAllReports` | `() → Promise` |
| `resolveReport` | `(reportId, decision) → Promise` |
| `getAllAccounts` | `() → Promise` |
| `suspendAccount` | `(userId: string) → Promise` |
| `freezeEscrow` | `(escrowId: string) → Promise` |
| `approveOffice` | alias → `approveOfficeRegistration` |
| `rejectOffice` | alias → `rejectOfficeRegistration` |
| `getPendingOffices` | alias → `getOfficeRegistrations` |
| `getAllProfiles` | alias → `getAllAccounts` |
| `getPendingRequests` | alias → `getProjectRequests` |
| `getOpenReports` | alias → `getAllReports` |

### 6.16 aiService (`src/services/aiService.ts`)
| Function | Signature |
|---|---|
| `generateProjectDescription` | `(input, language?) → Promise<string>` |
| `onboardClient` | `(message, language?) → Promise<string>` |
| `compareBids` | `(bids[], language?) → Promise<string>` |
| `chat` | `(messages: ChatMessage[], language) → Promise<string>` |
| `generateDescription` | `(projectTitle, language) → Promise<string>` |
| `_mockChat` | `(messages, language) → string` (internal fallback) |

---

## 7. Role-Based Flow

### Client Flow
1. Register/Login → 2. Submit project request → 3. Browse catalog/templates → 4. View bids → 5. Accept bid → 6. Sign contract → 7. Track project → 8. Approve/reject milestones → 9. Rate milestones → 10. Submit reports → 11. Chat with AI

### Engineering Office Flow
1. Register with license → 2. Wait for supervisor verification → 3. Browse approved requests → 4. Submit bids → 5. Sign contracts → 6. Create/manage milestones → 7. Upload templates → 8. Manage service catalog → 9. Manage portfolio

### Supervisor Flow
1. Login → 2. Review office registrations → 3. Approve/reject requests → 4. Approve/reject templates → 5. View/resolve reports → 6. Manage accounts → 7. Freeze escrow if needed

---

## 8. Route Map (Verified)

### Public Routes

| Route Path | File | Purpose |
|---|---|---|
| `/` | `src/routes/index.tsx` | Landing page |
| `/login` | `src/routes/login.tsx` | Login |
| `/register` | `src/routes/register.tsx` | Registration |
| `/estimator` | `src/routes/estimator.tsx` | Cost estimator |
| `/notifications` | `src/routes/notifications.tsx` | Notifications |

### Client Routes (`/client/*`)

| Route Path | File | Purpose |
|---|---|---|
| `/client/home` | `src/routes/client/home.tsx` | Client landing |
| `/client/dashboard` | `src/routes/client/dashboard.tsx` | Client dashboard |
| `/client/submit-request` | `src/routes/client/submit-request.tsx` | Submit project request |
| `/client/my-requests` | `src/routes/client/my-requests.tsx` | View own requests |
| `/client/bids` | `src/routes/client/bids.tsx` | View bids |
| `/client/bid-comparison` | `src/routes/client/bid-comparison.tsx` | AI bid comparison |
| `/client/contract` | `src/routes/client/contract.tsx` | Contract management |
| `/client/escrow` | `src/routes/client/escrow.tsx` | Escrow management |
| `/client/project-tracking` | `src/routes/client/project-tracking.tsx` | Track projects |
| `/client/milestone-approval` | `src/routes/client/milestone-approval.tsx` | Approve milestones |
| `/client/submit-report` | `src/routes/client/submit-report.tsx` | Submit report |
| `/client/catalog` | `src/routes/client/catalog.tsx` | Browse service catalog |
| `/client/templates` | `src/routes/client/templates.tsx` | Browse templates |

### Office Routes (`/office/*`)

| Route Path | File | Purpose |
|---|---|---|
| `/office/home` | `src/routes/office/home.tsx` | Office landing |
| `/office/dashboard` | `src/routes/office/dashboard.tsx` | Office dashboard |
| `/office/browse-requests` | `src/routes/office/browse-requests.tsx` | Browse approved requests |
| `/office/catalog` | `src/routes/office/catalog.tsx` | Manage service catalog |
| `/office/contract-sign` | `src/routes/office/contract-sign.tsx` | Sign contracts |
| `/office/manage-milestones` | `src/routes/office/manage-milestones.tsx` | Manage milestones |
| `/office/profile` | `src/routes/office/profile.tsx` | Office profile |
| `/office/upload-template` | `src/routes/office/upload-template.tsx` | Upload templates |

### Supervisor Routes (`/supervisor/*`)

| Route Path | File | Purpose |
|---|---|---|
| `/supervisor/dashboard` | `src/routes/supervisor/dashboard.tsx` | Supervisor dashboard |
| `/supervisor/accounts` | `src/routes/supervisor/accounts.tsx` | Manage accounts |
| `/supervisor/disputes` | `src/routes/supervisor/disputes.tsx` | View/resolve disputes |

### Root Layout
| File | Purpose |
|---|---|
| `src/routes/__root.tsx` | Root layout with providers, Navbar, Footer |

---

## 9. Landing Page Structure

The landing page at `/` (`src/routes/index.tsx`) serves as the main entry point with sections for hero, services overview, and role-based navigation.

---

## 10. Database Schema (Verified from Supabase)

### Tables (16 tables)

| Table | Primary Key | Key Columns | RLS |
|---|---|---|---|
| `profiles` | `id` (uuid) | name, email, role | Owner-only + service_role |
| `clients` | `id` (uuid, FK→profiles) | phone, is_active | Owner-only + service_role |
| `engineering_offices` | `id` (uuid, FK→profiles) | license_number, description, coverage_area, is_verified, license_expiry_date | Owner-only + service_role |
| `supervisors` | `id` (uuid, FK→profiles) | phone | Read-own only; no insert/update/delete for public |
| `project_requests` | `request_id` (uuid) | client_id, title, description, status, location, budget_range, created_at | Owner + approved-visible + supervisor |
| `bids` | `bid_id` (uuid) | office_id, request_id, price, timeline, status, submitted_at | Office-owner + request-owner + supervisor |
| `contracts` | `contract_id` (uuid) | client_id, office_id, title, description, is_client_signed, is_office_signed, signed_at, created_at | Client/office parties + supervisor |
| `projects` | `project_id` (uuid) | contract_id, title, description, status, progress_percentage, start_date | Via contract parties + supervisor |
| `milestones` | `milestone_id` (uuid) | project_id, title, description, status, due_date, deliverable_url | Via project→contract parties + supervisor |
| `ratings` | `rating_id` (uuid) | milestone_id, client_id, stars, comment, created_at | Public read; client-only insert; no update/delete |
| `payments` | `payment_id` (uuid) | escrow_id, milestone_id, amount, status, created_at | Via escrow→contract parties + supervisor |
| `escrow` | `escrow_id` (uuid) | contract_id, total_amount, released_amount, status, created_at | Via contract parties + supervisor |
| `templates` | `template_id` (uuid) | office_id, title, description, price, is_approved, is_available | Office-owner + approved-visible + supervisor |
| `service_catalog` | `catalog_id` (uuid) | office_id, category, sub_category, pricing_model, price | Public read; office-owner write |
| `reports` | `report_id` (uuid) | client_id, project_id, description, status, created_at | Client-owner + supervisor |
| `notifications` | `notification_id` (uuid) | user_id, message, is_read, created_at | Owner-only |
| `portfolio` | `portfolio_id` (uuid) | office_id, project_title, description, category, image_url, completed_at | Public read; office-owner write |

### Views

| View | Columns |
|---|---|
| `public_profiles` | id, name, role (no email exposed) |

### Database Functions

| Function | Purpose |
|---|---|
| `handle_new_user()` | Trigger on `auth.users` insert → creates `profiles` + role-specific record (`clients` or `engineering_offices`) |

### Storage Buckets

| Bucket | Public |
|---|---|
| `license-files` | Yes |

### Migrations

| File | Description |
|---|---|
| `20260422073205_*.sql` | Initial schema |
| `20260422075120_*.sql` | Follow-up schema changes |

---

## 11. Context Providers

| Provider | File | Exports |
|---|---|---|
| `AuthProvider` | `src/context/AuthContext.tsx` | `AuthProvider`, `useAuth()` |
| `ThemeProvider` | `src/context/ThemeContext.tsx` | `ThemeProvider`, `useTheme()` |

---

## 12. Edge Functions

| Function | File | Purpose |
|---|---|---|
| `ai-chat` | `supabase/functions/ai-chat/index.ts` | AI gateway proxy (chat, generate_description, compare_bids) via Lovable AI Gateway |

---

## 13. Seed Data (Verified from `src/data/seedData.ts`)

| Item | Count | Details |
|---|---|---|
| Offices | 5 | Khalid Al-Omari (Riyadh), Itqan (Jeddah), Al-Rouya (Madinah), Al-Diqqa (Dammam), Al-Bunyan (Abha) |
| Services | 19 | 4 + 3 + 4 + 3 + 5 across offices |
| Templates | 15 | 3 + 3 + 3 + 3 + 3 across offices |
| Portfolio items | 15 | 3 + 3 + 3 + 3 + 3 across offices |

### Helper file: `src/data/serviceCatalogData.ts`
Exports: `SERVICE_CATALOG_CATEGORIES`, `getCategoryLabel()`, `getSubcategoryLabel()`

---

## 14. SRS Mapping Table

| Domain Entity | SRS Requirements | Service File |
|---|---|---|
| User | FR-01, FR-03 | `authService.ts` |
| Profile | FR-01 | `authService.ts` (via trigger) |
| Client | FR-04 – FR-14 | `clientService.ts` |
| EngineeringOffice | FR-04, FR-15, FR-16 | `engineeringOfficeService.ts` |
| Supervisor | FR-17 – FR-29 | `supervisorService.ts` |
| ProjectRequest | FR-07 | `projectRequestService.ts` |
| Bid | FR-08, FR-09 | `bidService.ts` |
| Contract | FR-10 | `contractService.ts` |
| Project | FR-11, tracking | `projectService.ts` |
| Milestone | FR-11, FR-12 | `milestoneService.ts` |
| Rating | FR-12 | `ratingService.ts` |
| Payment | FR-14 | `escrowService.ts` (payments table) |
| Escrow | FR-14, FR-29 | `escrowService.ts` |
| Template | FR-05, FR-16, FR-26 | `templateService.ts` |
| ServiceCatalog | FR-15 | `serviceCatalogService.ts` |
| Report | FR-13, FR-29 | `reportService.ts` |
| Notification | FR-33 | `notificationService.ts` |
| Portfolio | FR-16 | `engineeringOfficeService.ts` |
| AIAssistant | FR-02, FR-30, FR-31, FR-32 | `aiService.ts` |

---

## 15. Implementation Aliases / Backward Compatibility

| UML/Domain Name | Implementation Class | Data Type | Export Alias | File |
|---|---|---|---|---|
| User | `User` | — | — | `src/types/index.ts` |
| Profile | `Profile` | `ProfileData` | `Profile` | `src/types/index.ts` |
| Client | `Client` | `ClientData` | `Client` | `src/types/index.ts` |
| EngineeringOffice | `EngineeringOffice` | `EngineeringOfficeData` | — | `src/types/index.ts` |
| Supervisor | `Supervisor` | `SupervisorData` | `Supervisor` | `src/types/index.ts` |
| ProjectRequest | `ProjectRequest` | `ProjectRequestData` | `ProjectRequest` | `src/types/index.ts` |
| Bid | `Bid` | `BidData` | `Bid` | `src/types/index.ts` |
| Contract | `Contract` | `ContractData` | `Contract` | `src/types/index.ts` |
| Project | `Project` | `ProjectData` | `Project` | `src/types/index.ts` |
| Milestone | `Milestone` | `MilestoneData` | `Milestone` | `src/types/index.ts` |
| Rating | `Rating` | `RatingData` | `Rating` | `src/types/index.ts` |
| Payment | `Payment` | `PaymentData` | `Payment` | `src/types/index.ts` |
| Escrow | `Escrow` | `EscrowData` | `Escrow` | `src/types/index.ts` |
| Template | `Template` | `TemplateData` | `Template` | `src/types/index.ts` |
| ServiceCatalog | `ServiceCatalog` | `ServiceCatalogData` | `ServiceCatalog` | `src/types/index.ts` |
| Report | `Report` | `ReportData` | `Report` | `src/types/index.ts` |
| Notification | `Notification` | `NotificationData` | `Notification` | `src/types/index.ts` |
| Portfolio | `Portfolio` | `PortfolioData` | `Portfolio` | `src/types/index.ts` |
| AIAssistant | `AIAssistant` | — | — | `src/types/index.ts` |

---

## 16. Mismatch / Change Log

| # | Item | Finding | Action |
|---|---|---|---|
| 1 | `ServiceCatalog.price` | Exists in code and DB but NOT in UML class diagram | **Kept** — removing would break DB queries |
| 2 | `Supervisor.viewReports()` | Exists in code but NOT in UML diagram | **Kept** — removing would break functionality |
| 3 | `Profile` class | NOT in UML diagram but in user's required entity list and DB | **Kept** — essential for auth flow |
| 4 | All entities | Verified as **classes** (not interfaces) in `src/types/index.ts` | ✅ Correct |
| 5 | `User` visibility | All 5 attributes are `protected` | ✅ Matches UML `#` notation |
| 6 | All other classes | All attributes are `private` | ✅ Matches UML `-` notation |
| 7 | `Project` and `Portfolio` | Both present as core entities with classes | ✅ Verified |
| 8 | Composition: Project→Milestone | `milestones.project_id` FK documented | ✅ Verified |
| 9 | Composition: EngineeringOffice→Portfolio | `portfolio.office_id` FK documented | ✅ Verified |
| 10 | Report stale content | Previous report had inaccurate/verbose descriptions | **Fixed** — regenerated from source |

---

## 17. Important Notes

1. **`Project` and `Portfolio` are core classes/entities** in the domain model, not supporting types.
2. **All attributes are private** unless explicitly marked protected on `User`.
3. **There are no interface entities** in this model — all 19 domain entities are TypeScript classes.
4. **Payment operations** are handled through `escrowService.ts` — there is no standalone `paymentService.ts`.
5. **Portfolio operations** are handled through `engineeringOfficeService.ts` — there is no standalone `portfolioService.ts`.
6. **TypeScript build passes** with zero errors (`npx tsc --noEmit` = exit 0).
