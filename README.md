# SkillSwap

> A freelance marketplace SPA built with **Angular 21** where job owners post work and freelancers submit proposals, negotiate, and leave reviews once work is done.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Architecture Overview](#architecture-overview)
5. [Module & Layer Diagram](#module--layer-diagram)
6. [Domain Models](#domain-models)
7. [Routing Map](#routing-map)
8. [Authentication Flow](#authentication-flow)
9. [HTTP Layer & Interceptor Chain](#http-layer--interceptor-chain)
10. [State Management](#state-management)
11. [Use Cases & Sequence Diagrams](#use-cases--sequence-diagrams)
    - [UC1 — Register & Login](#uc1--register--login)
    - [UC2 — Post a Job](#uc2--post-a-job)
    - [UC3 — Search & Apply for a Job](#uc3--search--apply-for-a-job)
    - [UC4 — Accept a Proposal & Start Work](#uc4--accept-a-proposal--start-work)
    - [UC5 — Complete a Job](#uc5--complete-a-job)
    - [UC6 — Leave a Review](#uc6--leave-a-review)
    - [UC7 — Language & Theme Switch](#uc7--language--theme-switch)
12. [Navbar Badge Reactivity](#navbar-badge-reactivity)
13. [i18n Architecture](#i18n-architecture)
14. [Getting Started](#getting-started)

---

## Overview

SkillSwap connects **job owners** (people who need work done) with **freelancers** (people who provide skills). The lifecycle of an engagement is:

```
Open Job → Proposal Submitted → Proposal Accepted → Job In-Progress → Job Completed → Reviews Left
```

Both sides can leave one review per completed job. The platform tracks open jobs and pending bids in real-time badge counters on the navbar.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21 (standalone components) |
| Language | TypeScript 5 |
| Styling | SCSS + DaisyUI / Tailwind CSS |
| State | Angular Signals (`signal`, `computed`) |
| HTTP | Angular `HttpClient` via a typed `ApiClient` wrapper |
| Auth | JWT stored in `localStorage`; attached via HTTP interceptor |
| i18n | Custom signal-based service + JSON locale files (EN / FR) |
| Testing | Vitest |
| Build | Angular CLI |

---

## Project Structure

```
src/app/
├── core/                    # Singleton infrastructure (loaded once)
│   ├── auth/                # AuthStore — JWT session signals
│   ├── config/              # API base URL
│   ├── guards/              # Route guards
│   ├── http/                # ApiClient wrapper + error normalisation
│   ├── i18n/                # I18nService, TranslatePipe, loader
│   ├── interceptors/        # JWT attachment + 401 redirect
│   ├── models/              # Domain types + request/response DTOs
│   ├── navbar/              # NavbarStore — reactive badge counts
│   ├── services/            # Domain services (jobs, proposals, …)
│   ├── theme/               # ThemeService — light/dark toggle
│   └── utils/               # Dev logger, utility pipes
│
├── features/                # Page-level feature modules
│   ├── auth/                # Login, Register
│   ├── jobs/                # JobSearch, JobCreate, JobEdit, JobDetails,
│   │                        # MyPostings, JobList (reusable list)
│   ├── platform/            # Stats dashboard
│   ├── proposals/           # JobProposals, MyBids, ProposalCreate
│   ├── reviews/             # ReviewSubmit, JobReviews, UserReviews
│   └── users/               # ProfileMe, PublicProfile
│
├── layout/                  # Shell components: Header, Footer, Navbar, Sidebar
│
└── shared/                  # Reusable UI: alerts, spinner, modal,
                             # rating-stars, form helpers, confirm-dialog
```

---

## Architecture Overview

```mermaid
graph TD
    Browser["Browser / User"]

    subgraph Angular SPA
        Router["Angular Router"]

        subgraph CoreLayer["Core Layer (singletons)"]
            AuthStore["AuthStore\n(JWT signals)"]
            NavbarStore["NavbarStore\n(badge counts)"]
            AuthInterceptor["AuthInterceptor\n(attach Bearer token)"]
            ApiClient["ApiClient\n(typed HTTP wrapper)"]
            I18n["I18nService\n(translations)"]
            Theme["ThemeService\n(light/dark)"]
            Guards["authGuard"]
        end

        subgraph Services["Domain Services"]
            AuthSvc["AuthService"]
            JobsSvc["JobsService\n(+ categories cache)"]
            ProposalsSvc["ProposalsService"]
            ReviewsSvc["ReviewsService"]
            UsersSvc["UsersService"]
            PlatformSvc["PlatformService"]
        end

        subgraph Features["Feature Pages"]
            Auth["Auth\n(Login / Register)"]
            Jobs["Jobs\n(Search / Create / Edit / Details / My Postings)"]
            Proposals["Proposals\n(Job Proposals / My Bids / Create)"]
            Reviews["Reviews\n(Submit / Job Reviews / User Reviews)"]
            Users["Users\n(Profile Me / Public Profile)"]
            Platform["Platform\n(Stats)"]
        end

        subgraph Shared["Shared UI"]
            Alerts["Alerts\n(error / success)"]
            Spinner["Spinner"]
            Modal["Modal"]
            RatingStars["Rating Stars"]
            ConfirmDialog["Confirm Dialog"]
            FormHelpers["Form Helpers\n(field-error, summary)"]
        end
    end

    BackendAPI["REST API\n(remote backend)"]

    Browser --> Router
    Router --> Guards
    Guards --> AuthStore
    Router --> Features
    Features --> Services
    Features --> Shared
    Services --> ApiClient
    ApiClient --> AuthInterceptor
    AuthInterceptor --> BackendAPI
    AuthStore --> AuthInterceptor
    NavbarStore --> JobsSvc
    NavbarStore --> ProposalsSvc
    Features --> NavbarStore
    Features --> I18n
    Features --> Theme
```

---

## Module & Layer Diagram

```mermaid
graph LR
    subgraph Infrastructure["Infrastructure (Core)"]
        direction TB
        ApiClient --> |"normalizes errors"| ErrorUtil["error.util.ts"]
        ApiClient --> |"prefixes URL"| ApiConfig["api.config.ts"]
        AuthInterceptor --> |"reads token"| AuthStore
        AuthStore --> |"persists to"| LocalStorage["localStorage"]
    end

    subgraph DomainServices["Domain Services"]
        direction TB
        JobsSvc --> ApiClient
        ProposalsSvc --> ApiClient
        ReviewsSvc --> ApiClient
        UsersSvc --> ApiClient
        AuthSvc --> ApiClient
        PlatformSvc --> ApiClient
    end

    subgraph FeatureComponents["Feature Components"]
        direction TB
        MyPostings --> JobsSvc
        MyPostings --> ReviewsSvc
        MyPostings --> NavbarStore
        MyBids --> ProposalsSvc
        MyBids --> ReviewsSvc
        MyBids --> NavbarStore
        JobDetails --> JobsSvc
        JobDetails --> ProposalsSvc
        JobDetails --> ReviewsSvc
        JobSearch --> JobsSvc
        JobCreate --> JobsSvc
        JobCreate --> NavbarStore
        JobEdit --> JobsSvc
        JobEdit --> NavbarStore
        ProposalCreate --> ProposalsSvc
        ProposalCreate --> NavbarStore
        ReviewSubmit --> ReviewsSvc
        ProfileMe --> UsersSvc
        PublicProfile --> UsersSvc
        PublicProfile --> ReviewsSvc
    end

    FeatureComponents --> DomainServices
    DomainServices --> Infrastructure
```

---

## Domain Models

```mermaid
erDiagram
    USER {
        number id
        string name
        string username
        string email
        string bio
        string[] skills
        number rating_avg
        number completed_jobs
    }

    JOB {
        number id
        string title
        string description
        number budget
        string category
        string status
        number owner_id
        number freelancer_id
        string created_at
        string updated_at
    }

    PROPOSAL {
        number id
        number job_id
        number user_id
        number price
        string cover_letter
        string status
        string created_at
        string updated_at
    }

    REVIEW {
        string id
        string job_id
        string reviewer_id
        string target_id
        number rating
        string comment
        string created_at
    }

    USER ||--o{ JOB : "owns"
    USER ||--o{ JOB : "freelances on"
    USER ||--o{ PROPOSAL : "submits"
    JOB ||--o{ PROPOSAL : "receives"
    JOB ||--o{ REVIEW : "generates"
    USER ||--o{ REVIEW : "writes"
    USER ||--o{ REVIEW : "receives"
```

---

## Routing Map

```mermaid
graph LR
    Root["/"] -->|redirect| Jobs

    Jobs["/jobs\nJobSearch"]
    JobCreate["/jobs/create\nJobCreate 🔒"]
    MyPostings["/jobs/my-postings\nMyPostings 🔒"]
    JobId["/jobs/:id\nJobDetails 🔒"]
    JobEdit["/jobs/:id/edit\nJobEdit 🔒"]
    JobProposals["/jobs/:id/proposals\nJobProposals 🔒"]

    MyBids["/proposals/my-bids\nMyBids 🔒"]

    UsersMe["/users/me\nProfileMe 🔒"]
    UsersName["/users/:username\nPublicProfile"]

    ReviewsUser["/reviews/user/:id\nUserReviews"]

    Stats["/platform/stats\nStats"]

    Login["/login\nLogin"]
    Register["/register\nRegister"]

    Root --> Jobs
    Jobs --> JobCreate
    Jobs --> MyPostings
    Jobs --> JobId
    JobId --> JobEdit
    JobId --> JobProposals
    JobProposals --> MyBids
    Jobs --> UsersMe
    Jobs --> UsersName
    UsersName --> ReviewsUser
    Jobs --> Stats
    Jobs --> Login
    Jobs --> Register

    classDef protected fill:#f9a,stroke:#c55
    class JobCreate,MyPostings,JobId,JobEdit,JobProposals,MyBids,UsersMe protected
```

> Routes marked 🔒 require authentication via `authGuard`.

---

## Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant LoginPage as Login Page
    participant AuthService as AuthService
    participant ApiClient as ApiClient
    participant BackendAPI as REST API
    participant AuthStore as AuthStore
    participant LocalStorage as localStorage
    participant Router as Angular Router

    User->>LoginPage: Enter email + password
    LoginPage->>AuthService: login(dto)
    AuthService->>ApiClient: post('/auth/login', dto)
    ApiClient->>BackendAPI: POST /auth/login
    BackendAPI-->>ApiClient: { token, user }
    ApiClient-->>AuthService: LoginResponseDto
    AuthService->>AuthStore: setSession(token, user)
    AuthStore->>LocalStorage: store token + user JSON
    AuthStore-->>AuthService: session set
    AuthService-->>LoginPage: success
    LoginPage->>Router: navigate to /jobs (or returnUrl)

    Note over AuthStore,LocalStorage: On app restart, AuthStore reads localStorage<br/>to rehydrate the session automatically
```

### Token Expiry / 401 Handling

```mermaid
sequenceDiagram
    participant Component
    participant AuthInterceptor as AuthInterceptor
    participant BackendAPI as REST API
    participant AuthStore as AuthStore
    participant Router as Angular Router

    Component->>AuthInterceptor: HTTP request (expired token)
    AuthInterceptor->>AuthInterceptor: Attach Bearer token from AuthStore
    AuthInterceptor->>BackendAPI: Request with Authorization header
    BackendAPI-->>AuthInterceptor: 401 Unauthorized
    AuthInterceptor->>AuthStore: clearSession()
    AuthInterceptor->>Router: navigate('/login?sessionExpired=true')
    Router-->>Component: Redirect to Login
```

---

## HTTP Layer & Interceptor Chain

```mermaid
graph LR
    Component["Feature Component"]
    DomainSvc["Domain Service"]
    ApiClient["ApiClient\n(get / post / patch / delete)"]
    Interceptor["authInterceptor\n(HttpInterceptorFn)"]
    HttpClient["Angular HttpClient"]
    Backend["REST API"]
    ErrorUtil["normalizeError()\n→ ApiError"]

    Component -->|"calls method"| DomainSvc
    DomainSvc -->|"typed RxJS Observable"| ApiClient
    ApiClient -->|"prefixes API_BASE_URL"| HttpClient
    HttpClient -->|"passes through"| Interceptor
    Interceptor -->|"sets Authorization: Bearer"| Backend
    Backend -->|"HTTP response"| Interceptor
    Interceptor -->|"catchError 401 → clearSession + redirect"| ApiClient
    ApiClient -->|"catchError → normalizeError"| ErrorUtil
    ErrorUtil -->|"ApiError thrown"| DomainSvc
    DomainSvc -->|"error propagated"| Component
```

---

## State Management

SkillSwap uses **Angular Signals** for all reactive state — no NgRx or other external store library.

```mermaid
graph TD
    subgraph AuthStore["AuthStore (singleton)"]
        tokenSignal["tokenSignal\n(string | null)"]
        userSignal["userSignal\n(User | null)"]
        authenticated["computed: authenticated\n(!!token)"]
        tokenSignal --> authenticated
        userSignal --> authenticated
    end

    subgraph NavbarStore["NavbarStore (singleton)"]
        myJobsCount["myJobsCount signal\n(open job count)"]
        myBidsCount["myBidsCount signal\n(pending bid count)"]
        refresh["refresh()\nfetches my-postings + my-bids"]
        refresh --> myJobsCount
        refresh --> myBidsCount
    end

    subgraph ComponentSignals["Per-Component Signals (examples)"]
        jobs["jobs signal\n(Job[])"]
        loading["loading signal\n(boolean)"]
        error["error signal\n(string | null)"]
        reviewedJobIds["reviewedJobIds signal\n(Set of job ids)"]
        hasSubmittedReview["hasSubmittedReview signal\n(boolean)"]
    end

    NavbarStore -->|"reads"| JobsService
    NavbarStore -->|"reads"| ProposalsService
    MutatingComponents["Job Create / Edit / Complete\nProposal Create / Delete / Accept"] -->|"calls refresh()"| NavbarStore
    LocalStorage -->|"rehydrates on init"| AuthStore
```

> Every mutation that affects badge counts (create job, delete bid, accept proposal, complete job) calls `navbarStore.refresh()` to keep the navbar in sync.

---

## Use Cases & Sequence Diagrams

### UC1 — Register & Login

```mermaid
sequenceDiagram
    actor Owner as New User
    participant Register as Register Page
    participant AuthService
    participant BackendAPI as REST API
    participant AuthStore
    participant Router

    Owner->>Register: Fill name, username, email, password, skills
    Register->>AuthService: register(dto)
    AuthService->>BackendAPI: POST /auth/register
    BackendAPI-->>AuthService: { message, user }
    AuthService->>AuthService: auto-login → POST /auth/login
    AuthService->>BackendAPI: POST /auth/login
    BackendAPI-->>AuthService: { token, user }
    AuthService->>AuthStore: setSession(token, user)
    AuthStore-->>Register: session active
    Register->>Router: navigate('/jobs')
```

---

### UC2 — Post a Job

```mermaid
sequenceDiagram
    actor Owner
    participant JobCreate as Job Create Page
    participant JobsService
    participant NavbarStore
    participant BackendAPI as REST API
    participant Router

    Owner->>JobCreate: Fill title, description, budget, category
    JobCreate->>JobCreate: Validate form (required fields, budget > 0)
    JobCreate->>JobsService: create(JobCreateDto)
    JobsService->>BackendAPI: POST /jobs
    BackendAPI-->>JobsService: Job (id, status: 'open', …)
    JobsService-->>JobCreate: Job created
    JobCreate->>NavbarStore: refresh()
    NavbarStore->>BackendAPI: GET /jobs/my-postings
    NavbarStore-->>NavbarStore: update myJobsCount
    JobCreate->>Router: navigate('/jobs/my-postings')
```

---

### UC3 — Search & Apply for a Job

```mermaid
sequenceDiagram
    actor Freelancer
    participant JobSearch as Job Search Page
    participant JobDetails as Job Details Modal
    participant ProposalCreate as Proposal Create
    participant JobsService
    participant ProposalsService
    participant NavbarStore
    participant BackendAPI as REST API

    Freelancer->>JobSearch: Enter keyword / category / budget filter
    JobSearch->>JobsService: search(JobSearchDto)
    JobsService->>BackendAPI: POST /jobs/search
    BackendAPI-->>JobsService: Job[]
    JobsService-->>JobSearch: Render job cards

    Freelancer->>JobDetails: Click job card
    JobDetails->>JobsService: getById(jobId)
    BackendAPI-->>JobDetails: Full Job + owner info

    Freelancer->>ProposalCreate: Click "Submit Proposal"
    ProposalCreate->>ProposalCreate: Fill price + cover letter
    ProposalCreate->>ProposalsService: create(jobId, ProposalCreateDto)
    ProposalsService->>BackendAPI: POST /jobs/:id/proposals
    BackendAPI-->>ProposalsService: Proposal (status: 'pending')
    ProposalCreate->>NavbarStore: refresh()
    NavbarStore-->>NavbarStore: update myBidsCount
    ProposalCreate-->>Freelancer: Success alert shown
```

---

### UC4 — Accept a Proposal & Start Work

```mermaid
sequenceDiagram
    actor Owner
    participant JobProposals as Job Proposals Page
    participant ProposalsService
    participant NavbarStore
    participant BackendAPI as REST API

    Owner->>JobProposals: Navigate to /jobs/:id/proposals
    JobProposals->>BackendAPI: GET /jobs/:id/proposals
    BackendAPI-->>JobProposals: Proposal[]

    Owner->>JobProposals: Click "Accept" on a proposal
    JobProposals->>ProposalsService: accept(proposalId)
    ProposalsService->>BackendAPI: PATCH /proposals/:id/accept
    BackendAPI-->>ProposalsService: Proposal (status: 'accepted')
    Note over BackendAPI: Job status changes to 'in_progress' on backend

    JobProposals->>NavbarStore: refresh()
    NavbarStore->>BackendAPI: GET /jobs/my-postings
    NavbarStore-->>NavbarStore: myJobsCount updated (open jobs only)
    JobProposals-->>Owner: Proposal card shows "Accepted"
```

---

### UC5 — Complete a Job

```mermaid
sequenceDiagram
    actor Owner
    participant MyPostings as My Postings Page
    participant ConfirmDialog as Confirm Dialog
    participant JobsService
    participant NavbarStore
    participant BackendAPI as REST API

    Owner->>MyPostings: View in_progress job
    MyPostings->>MyPostings: actionLabelResolver → "Mark Complete"
    Owner->>MyPostings: Click "Mark Complete"
    MyPostings->>ConfirmDialog: Open confirmation dialog
    Owner->>ConfirmDialog: Confirm
    ConfirmDialog-->>MyPostings: confirmed = true

    MyPostings->>JobsService: complete(jobId)
    JobsService->>BackendAPI: PATCH /jobs/:id/complete
    BackendAPI-->>JobsService: Job (status: 'completed')
    MyPostings->>JobsService: getMyPostings() (re-fetch)
    MyPostings->>NavbarStore: refresh()
    NavbarStore-->>NavbarStore: myJobsCount decremented
    MyPostings-->>Owner: Card shows "completed" badge + "Leave Review" button
```

---

### UC6 — Leave a Review

Both the **job owner** (reviewing the freelancer) and the **freelancer** (reviewing the owner) can leave one review each after a job is completed.

```mermaid
sequenceDiagram
    participant U as User
    participant P as MyPostingsOrMyBids
    participant M as ReviewSubmitModal
    participant S as ReviewsService
    participant A as API

    U->>P: Open a completed job
    U->>M: Click Leave Review
    M->>S: Create review with rating and comment
    S->>A: Submit review
    A-->>S: Review created
    S-->>P: Reload review state
    P-->>U: Show Already Reviewed state
```

#### Review Eligibility Gate

```mermaid
flowchart TD
    A[Job completed?] -- No --> Z[No review action shown]
    A -- Yes --> B{Is current user the owner?}
    B -- Yes --> C[Target = freelancer_id]
    B -- No --> D{Is proposal status accepted?}
    D -- No --> Z
    D -- Yes --> E[Target = owner_id / job.owner_id]
    C --> F[Fetch reviews for target]
    E --> F
    F --> G{Review already submitted\nfor this job?}
    G -- Yes --> H[Show 'Already Reviewed' — disabled]
    G -- No --> I[Show 'Leave Review' button]
```

---

### UC7 — Language & Theme Switch

```mermaid
sequenceDiagram
    actor User
    participant Navbar as Navbar / Header
    participant I18nService
    participant ThemeService
    participant LocalStorage as localStorage
    participant AllComponents as All Components (via TranslatePipe)

    User->>Navbar: Click language toggle (EN ↔ FR)
    Navbar->>I18nService: setLang('fr')
    I18nService->>LocalStorage: fetch /assets/i18n/fr.json
    LocalStorage-->>I18nService: JSON dictionary loaded
    I18nService->>I18nService: lang.set('fr') + dict.set(dictionary)
    I18nService->>LocalStorage: persist 'lang' key
    I18nService-->>AllComponents: Signal change propagates
    AllComponents-->>User: All text re-renders in French

    User->>Navbar: Click theme toggle (Light ↔ Dark)
    Navbar->>ThemeService: toggle()
    ThemeService->>ThemeService: setTheme('dark')
    ThemeService->>LocalStorage: persist 'theme' key
    ThemeService->>ThemeService: setAttribute('data-theme', 'dark')
    ThemeService-->>User: CSS variables switch to dark palette
```

---

## Navbar Badge Reactivity

```mermaid
flowchart LR
    subgraph Mutations["Mutation Events"]
        M1["Job Created"]
        M2["Job Completed"]
        M3["Proposal Created"]
        M4["Proposal Deleted"]
        M5["Proposal Accepted"]
        M6["Job Edited"]
    end

    NS["NavbarStore.refresh()"]

    subgraph Fetches["Parallel Fetches"]
        F1["GET /jobs/my-postings\n→ filter open\n→ myJobsCount"]
        F2["GET /proposals/my-bids\n→ filter pending\n→ myBidsCount"]
    end

    subgraph NavbarUI["Navbar UI"]
        B1["'My Postings' badge\n(open count)"]
        B2["'My Bids' badge\n(pending count)"]
    end

    M1 --> NS
    M2 --> NS
    M3 --> NS
    M4 --> NS
    M5 --> NS
    M6 --> NS

    NS --> F1
    NS --> F2
    F1 --> B1
    F2 --> B2
```

---

## i18n Architecture

```mermaid
graph TD
    subgraph Locale["Locale Files (public/assets/i18n/)"]
        EN["en.json"]
        FR["fr.json"]
    end

    I18nService["I18nService\n- lang signal\n- dict signal\n- t(path): string"]
    BrowserLang["detectBrowserLang()\n(navigator.language)"]
    LocalStorage["localStorage\n('lang' key)"]

    TranslatePipe["TranslatePipe\n{{ 'key.path' | translate }}"]
    Components["Components / Templates"]

    BrowserLang --> I18nService
    LocalStorage --> I18nService
    EN --> I18nService
    FR --> I18nService
    I18nService --> TranslatePipe
    TranslatePipe --> Components

    subgraph Resolution["Key Resolution (dot-path)"]
        Key["'jobs.fields.title'"]
        Split["Split by '.'"]
        Walk["Walk dict object"]
        Result["'Job Title' (en)\nor 'Titre du poste' (fr)"]
        Key --> Split --> Walk --> Result
    end
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- Angular CLI ≥ 21 (`npm install -g @angular/cli`)

### Install

```bash
npm install
```

### Development Server

```bash
ng serve
# or, without Hot Module Replacement:
npm start -- --no-hmr
```

Navigate to `http://localhost:4200/`. The app auto-reloads on file changes.

### Build

```bash
ng build
```

Artifacts are written to `dist/`. Production builds are optimised for performance.

### Tests

```bash
ng test
```

Runs unit tests with [Vitest](https://vitest.dev/).

### Code Scaffolding

```bash
ng generate component component-name
ng generate --help   # list all schematics
```

---

## Additional Resources

- [Angular CLI Reference](https://angular.dev/tools/cli)
- [Angular Signals](https://angular.dev/guide/signals)
- [Mermaid Diagram Syntax](https://mermaid.js.org/)
