# SkillSwap – GitHub Project Backlog (Complete, Ordered)

Work must proceed strictly in dependency order:

**P0 Domain & DTO Contracts → P1 Infrastructure → P2 Domain Services → P3 Shared UI → P4 Layout & Routing → P5 Mandatory Flow → P6 Coverage → P7 UX Hardening**

---

# EPIC P0 – Domain & DTO Contracts

Purpose: define type contracts before wiring infrastructure/services/UI.

## P0.1 – Domain Models (Response Shapes)

Create/confirm models under `core/models/`:

* `user.model.ts`
* `job.model.ts`
* `proposal.model.ts`
* `review.model.ts`

Acceptance Criteria:

* No `any`
* Optional fields marked correctly
* Job status typed as union: `'open' | 'in_progress' | 'completed'`

---

## P0.2 – Request DTOs (Write Shapes)

Create request DTO definitions (folder location stays under `core/models/` to preserve agreed structure; use a subfolder if desired, e.g. `core/models/dto/`).

Minimum required DTOs:

Auth:

* `register.dto.ts` (name, username, email, password, bio, skills[])
* `login.dto.ts` (email, password)

Jobs:

* `job-search.dto.ts` (category?, status?, min_budget?)
* `job-create.dto.ts` (title, description, budget, category)
* `job-update.dto.ts` (partial: title?, description?, budget?, category?, status?)

Proposals:

* `proposal-create.dto.ts` (price, cover_letter|message)

Reviews:

* `review-create.dto.ts` (target_id, rating, message?)

Acceptance Criteria:

* Services do not build inline request object literals (services take DTOs)
* PATCH uses update DTO with optional fields

---

## P0.3 – Response DTOs (Non-Domain Wrappers)

Create response DTOs where API returns wrappers instead of pure domain models.

Minimum required response DTOs:

* `login-response.dto.ts` (token, user)
* `register-response.dto.ts` (message, user)
* `platform-stats.model.ts` (total_users, active_jobs, total_value_moved)

Acceptance Criteria:

* Services return typed wrappers where applicable
* No UI guesses about wrapper shapes

---

# EPIC P1 – Infrastructure (Blockers)

These tasks must be completed before service and UI work.

## P1.1 – API Configuration

* Create `core/config/api.config.ts`
* Export `API_BASE_URL`

Acceptance Criteria:

* Base URL is centralized
* No hardcoded URLs elsewhere

---

## P1.2 – HTTP Wrapper

* Create `core/http/api-client.ts`
* Implement:

  * get()
  * post()
  * patch()
  * delete()
* Prefix base URL automatically
* Catch HttpErrorResponse
* Normalize errors

Acceptance Criteria:

* All services use api-client
* No direct HttpClient usage in features

---

## P1.3 – ApiError Model & Error Normalization

* Create `core/http/api-error.model.ts`
* Create `core/http/error.util.ts`
* Extract `{ "error": "..." }` safely
* Fallback for unexpected shapes

Acceptance Criteria:

* Backend error messages displayed verbatim
* No unhandled HttpErrorResponse

---

## P1.4 – Authentication Store

* Create `core/auth/auth.store.ts`
* Store token + user
* Persist token in localStorage
* Expose authentication helpers

Acceptance Criteria:

* Token persists across refresh
* isAuthenticated() works correctly

---

## P1.5 – JWT Interceptor

* Create `core/interceptors/auth.interceptor.ts`
* Attach `Authorization: Bearer <token>`
* Handle 401:

  * Clear session
  * Redirect to /login

Acceptance Criteria:

* Protected endpoints include header
* Expired/invalid token redirects properly

---

## P1.6 – Auth Guard

* Create `core/guards/auth.guard.ts`
* Protect authenticated routes
* Preserve attempted URL

Acceptance Criteria:

* Unauthenticated access blocked
* Redirect flow works

---

# EPIC P2 – Domain Services (API Mapping)

Purpose: map every endpoint into a typed service before building pages.

Acceptance Criteria (applies to all services):

* Uses `api-client` only
* Typed inputs via DTOs
* Typed outputs via domain models / response DTOs
* All backend errors propagate as `ApiError` without being rewritten

---

## P2.1 – Auth Service

File: `core/services/auth.service.ts`

Endpoints:

* `POST /auth/register`
* `POST /auth/login`

Acceptance Criteria:

* Register returns typed `register-response` wrapper
* Login returns typed `login-response` wrapper
* 409 suggested_username supported in error payload handling

---

## P2.2 – Users Service

File: `core/services/users.service.ts`

Endpoints:

* `GET /users/me`
* `GET /users/<username>`

---

## P2.3 – Jobs Service

File: `core/services/jobs.service.ts`

Endpoints:

* `POST /jobs/search`
* `POST /jobs`
* `GET /jobs/<job_id>`
* `PATCH /jobs/<job_id>`
* `GET /jobs/my-postings`
* `PATCH /jobs/<job_id>/complete`

---

## P2.4 – Proposals Service

File: `core/services/proposals.service.ts`

Endpoints:

* `POST /jobs/<job_id>/proposals`
* `GET /jobs/<job_id>/proposals`
* `PATCH /proposals/<proposal_id>/accept`
* `GET /proposals/my-bids`
* `DELETE /proposals/<proposal_id>`

---

## P2.5 – Reviews Service

File: `core/services/reviews.service.ts`

Endpoints:

* `POST /jobs/<job_id>/reviews`
* `GET /reviews/user/<user_id>`

---

## P2.6 – Platform Service

File: `core/services/platform.service.ts`

Endpoint:

* `GET /platform/stats`

---

# EPIC P3 – Shared UI (Reusable Components)

Purpose: ensure consistent error/loading/empty patterns across all pages.

## P3.1 – Alerts

* `alert-error` (Input: message)
* `alert-success` (Input: message)

---

## P3.2 – Loading

* `spinner`

---

## P3.3 – Empty State

* `empty-state` (Inputs: title, message)

---

## P3.4 – Confirm Dialog

* `confirm-dialog` (confirm/cancel outputs)

---

## P3.5 – Rating Stars

* `rating-stars` (Input: rating)

---

## P3.6 – Form Helpers

* `field-error`
* `form-error-summary`

Acceptance Criteria:

* Pure presentation / form utilities
* No API calls

---

# EPIC P4 – Layout & Routing

Purpose: stable navigation shell and required route map.

## P4.1 – Root Layout

* Implement `app.component.html` layout
* Header + Navbar + router-outlet + Footer

---

## P4.2 – Static Navbar (Pre-Auth Binding)

* Implement navigation links without auth state coupling
* Links required at minimum:

  * Jobs
  * Platform Stats
  * Login
  * Register

---

## P4.3 – Routing Map (Single File)

Implement `app.routes.ts` with:

* `/login`
* `/register`
* `/jobs`
* `/jobs/create`
* `/jobs/my-postings`
* `/jobs/:id`
* `/jobs/:id/edit`
* `/proposals/my-bids`
* `/users/me`
* `/users/:username`
* `/platform/stats`

---

## P4.4 – Guard Integration

* Apply `auth.guard` to protected routes

Acceptance Criteria:

* Unauthenticated access redirects to /login
* Attempted URL preserved

---

## P4.5 – Navbar Auth Binding (Post-Login)

Upgrade navbar after P5.2 is complete.

* Show guest links when unauthenticated
* Show authenticated links when authenticated:

  * Jobs
  * My Postings
  * My Bids
  * My Profile
  * Platform Stats
  * Logout
* Logout clears session and navigates to login (or jobs)

Acceptance Criteria:

* Navbar updates without reload after login/logout

---

# EPIC P5 – Mandatory Business Flow (Grading Core)

Each page must:

* Use services only
* Track loading state
* Disable submits while pending
* Display backend errors verbatim

---

## P5.1 – Register Page (`/register`)

* Reactive form for required fields
* Display suggested_username when 409 includes it
* On success: redirect to /login

---

## P5.2 – Login Page (`/login`)

* On success:

  * store token
  * store user
  * redirect to intended URL

---

## P5.3 – Job Search Page (`/jobs`)

* Filters: category, status (default open), min_budget
* Empty state handling

---

## P5.4 – Create Job Page (`/jobs/create`)

* Protected
* Fields: title, description, budget, category

---

## P5.5 – Job Details Page (`/jobs/:id`)

* Protected
* Displays job details + owner/freelancer summaries
* Implements action panel rules (see P7.5)

---

## P5.6 – Owner Proposals Page (`/jobs/:id` action → proposals list)

* Owner-only access
* Lists proposals for job

---

## P5.7 – Accept Proposal

* Accept action (confirm dialog)
* After accept:

  * job becomes in_progress
  * refresh job details

---

## P5.8 – Complete Job

* Complete action (confirm dialog)
* Allowed only when in_progress
* Allowed only for owner or assigned freelancer

---

## P5.9 – Submit Proposal

* Submit from job details
* Prevent own job submission
* Prevent if job not open
* Prevent multiple pending proposals

---

## P5.10 – Submit Reviews

* From completed job
* Both participants can review the other
* Prevent self-review
* Prevent duplicates
* Refresh job/profile after submission to show rating updates

---

# EPIC P6 – Completeness & Coverage

## P6.1 – My Profile Page (`/users/me`)

* Display full authenticated profile

---

## P6.2 – Public Profile Page (`/users/:username`)

* Display public profile fields

---

## P6.3 – My Postings Page (`/jobs/my-postings`)

* Display jobs created by logged-in user

---

## P6.4 – My Bids Page (`/proposals/my-bids`)

* Display submitted proposals
* Delete proposal if pending (confirm dialog)

---

## P6.5 – User Reviews Page

* Display reviews for a given user id

---

## P6.6 – Platform Stats Page (`/platform/stats`)

* Display platform statistics

---

# EPIC P7 – UX Hardening (Required Behaviors)

## P7.1 – Global Pending State Discipline

* Disable submit while pending on every form
* Prevent double-click actions

---

## P7.2 – Consistent Error Display

* Standardize error surfaces:

  * top-of-form API error summary
  * inline field errors
* Ensure all 400/401/403/404/409 display verbatim messages

---

## P7.3 – Confirmation Enforcement

Confirm dialog required for:

* Accept proposal
* Complete job
* Delete proposal

---

## P7.4 – Empty State Coverage

* All list pages show empty-state when empty

---

## P7.5 – UI Business Rule Enforcement (Action Matrix)

Job Details actions:

If `status=open`:

* Non-owner can submit proposal (only if no pending proposal)
* Owner can view proposals

If `status=in_progress`:

* Owner or assigned freelancer can complete

If `status=completed`:

* Owner and freelancer can review the other participant
* If already reviewed: disable

Backend remains authoritative.
All resulting 400/401/403/404/409 errors must display.

---

# Definition of Done

Project is complete when:

* Mandatory workflow fully functions:

  * Register → Login → Post Job → Submit Proposal → Accept Proposal → Complete Job → Leave Reviews → Rating updates
* JWT is stored and used via interceptor
* 401 triggers redirect to /login
* All documented backend errors are displayed verbatim
* No mocked data or simulated responses
* Code follows the agreed structure and separation of concerns
