# SkillSwap – Implementation Plan (Frontend Angular)
[Backlog Overview here!](./docs/project_backlog_overview.md)
## 0. Objective

Deliver a complete Angular frontend for SkillSwap that:

* Consumes the official REST API only.
* Implements JWT authentication (store token, attach via interceptor, redirect on 401).
* Implements the mandatory business flow end-to-end.
* Displays all backend error messages exactly as returned.
* Does not mock, simulate, or hardcode data.

Base API:

* `https://stingray-app-wxhhn.ondigitalocean.app`

All endpoints are relative to this base URL.

---

## 1. System Boundaries

### 1.1 Core Layer (Infrastructure & API)

Owns:

* API base URL configuration
* HTTP wrapper
* JWT interceptor
* Auth guard
* Authentication state store
* Error normalization (`{ "error": "..." }`)
* Domain services (API mapping)
* Shared DTO/domain models

Does not own:

* UI state (loading flags, button visibility)
* Template logic
* Form validation logic

Only the Core layer communicates with the backend.

---

### 1.2 Feature Layer (Business Use Cases)

Owns:

* Route-level pages
* Template rendering
* User interaction handling
* View state (loading, success, error)
* Form state management
* UI business rules (visibility and enable/disable based on role/status)

Feature components:

* Bind data to templates
* Call Core services
* Display API responses
* Display backend error messages verbatim

Feature components do NOT:

* Use HttpClient directly
* Store JWT
* Reimplement backend validation logic

---

### 1.3 Shared UI Layer

Owns:

* Reusable UI components (alerts, spinner, empty state, confirm dialog)
* Form helpers
* Presentation-only components (e.g., rating stars)

Does not own:

* API calls
* Routing logic
* Business rules

---

## 2. Codebase Structure (Authoritative)

```
src/app/

  core/
    config/
      api.config.ts

    http/
      api-client.ts
      api-error.model.ts
      error.util.ts

    auth/
      auth.store.ts

    services/
      auth.service.ts
      users.service.ts
      jobs.service.ts
      proposals.service.ts
      reviews.service.ts
      platform.service.ts

    interceptors/
      auth.interceptor.ts

    guards/
      auth.guard.ts

    models/
      user.model.ts
      job.model.ts
      proposal.model.ts
      review.model.ts

  shared/
    components/
      alert-error/
      alert-success/
      spinner/
      empty-state/
      confirm-dialog/
      rating-stars/

    forms/
      field-error/
      form-error-summary/

  layout/
    header/
    navbar/
    footer/
    sidebar/

  features/
    auth/
      login/
      register/

    users/
      profile-me/
      public-profile/

    jobs/
      job-search/
      job-create/
      job-details/
      job-edit/
      my-postings/

    proposals/
      job-proposals/
      my-bids/

    reviews/
      review-submit/
      user-reviews/

    platform/
      stats/

  app.routes.ts
  app.config.ts
  app.component.ts
  app.component.html
```

Rules:

* All HTTP logic is inside `core/http` and `core/services`.
* All route protection is inside `core/guards`.
* All authentication state is inside `core/auth`.
* Features contain only components.
* No HTTP logic inside features.

---

## 3. Core Infrastructure (Mandatory First Step)

### 3.1 API Configuration

`core/config/api.config.ts`

* Export `API_BASE_URL`.
* No additional logic.

---

### 3.2 HTTP Wrapper

`core/http/api-client.ts`

Responsibilities:

* Prefix base URL automatically.
* Expose typed methods:

  * `get<T>()`
  * `post<T>()`
  * `patch<T>()`
  * `delete<T>()`
* Catch `HttpErrorResponse`.
* Convert backend errors into `ApiError`.

Only this file directly uses Angular `HttpClient`.

---

### 3.3 Error Normalization

`core/http/api-error.model.ts`

Structure:

```
status: number
message: string
raw?: unknown
```

`core/http/error.util.ts`

Responsibilities:

* Extract `{ "error": "Message" }` safely.
* Fallback to generic message if structure differs.

UI rule:

* Always display `ApiError.message` exactly as returned.

---

### 3.4 Authentication State

`core/auth/auth.store.ts`

Responsibilities:

* Store JWT token.
* Store authenticated user object.
* Persist token (localStorage).
* Expose:

  * `setSession(token, user)`
  * `clearSession()`
  * `getToken()`
  * `getUser()`
  * `isAuthenticated()`

No HTTP logic.

---

### 3.5 JWT Interceptor

`core/interceptors/auth.interceptor.ts`

Responsibilities:

* Add `Authorization: Bearer <token>` if token exists.
* On 401:

  * Clear session.
  * Redirect to `/login`.

Must handle:

* Missing header
* Expired token
* Invalid token

---

### 3.6 Route Guard

`core/guards/auth.guard.ts`

Responsibilities:

* Protect routes requiring authentication.
* Redirect to `/login` if unauthenticated.
* Preserve attempted URL.

---

### 3.7 Domain Services (API Mapping)

Each service maps exactly to one backend module.

#### auth.service.ts

Endpoints:

* `POST /auth/register`
* `POST /auth/login`

Handle documented errors:

* 400 – Missing required fields
* 400 – Invalid username
* 409 – Email already in use
* 409 – Username already in use (with `suggested_username`)
* 401 – Invalid credentials

---

#### users.service.ts

Endpoints:

* `GET /users/me`
* `GET /users/<username>`

Handle:

* 404 – User not found
* 401 – Invalid or expired token

---

#### jobs.service.ts

Endpoints:

* `POST /jobs/search`
* `POST /jobs`
* `GET /jobs/<job_id>`
* `PATCH /jobs/<job_id>`
* `GET /jobs/my-postings`
* `PATCH /jobs/<job_id>/complete`

Handle documented errors including:

* 400 – min_budget must be numeric
* 400 – Missing required fields
* 400 – Invalid status
* 400 – No valid fields to update
* 400 – Only in-progress jobs can be completed
* 401 – Unauthorized
* 403 – Forbidden
* 404 – Job not found

---

#### proposals.service.ts

Endpoints:

* `POST /jobs/<job_id>/proposals`
* `GET /jobs/<job_id>/proposals`
* `PATCH /proposals/<proposal_id>/accept`
* `GET /proposals/my-bids`
* `DELETE /proposals/<proposal_id>`

Handle documented errors including:

* 403 – Cannot submit to own job
* 400 – Only open jobs allow proposals
* 409 – Already pending proposal
* 400 – price and cover_letter/message required
* 403 – Cannot accept own proposal
* 400 – Job is no longer open
* 400 – Only pending proposals can be deleted
* 404 – Proposal not found

---

#### reviews.service.ts

Endpoints:

* `POST /jobs/<job_id>/reviews`
* `GET /reviews/user/<user_id>`

Handle documented errors including:

* 400 – Reviews allowed only for completed jobs
* 400 – target_id and rating required
* 400 – Cannot review yourself
* 400 – rating must be integer 1–5
* 409 – Already reviewed
* 404 – Job not found
* 404 – Target user not found

---

#### platform.service.ts

Endpoint:

* `GET /platform/stats`

Public endpoint.

---

## 4. Layout and Routing

### 4.1 Layout Structure

`app.component.html` defines root layout.

Contains:

* Header
* Navbar
* `<router-outlet>`
* Footer

`index.html` is not modified.

---

### 4.2 Routing

All routes declared in `app.routes.ts`.

Routes:

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

Protected routes use `auth.guard`.

No feature-level route files.

---

## 5. Shared UI Requirements

Reusable components:

* `alert-error` – displays backend error
* `alert-success` – displays success message
* `spinner` – loading indicator
* `empty-state` – empty list display
* `confirm-dialog` – destructive/irreversible actions
* `rating-stars` – rating display

Form helpers:

* `field-error`
* `form-error-summary`

Global UI rules:

* Disable submit while pending.
* Always show backend error message.
* Show loading state for all async operations.
* Show empty state for empty lists.

---

## 6. Feature Specifications (Complete)

### 6.1 Authentication

Register page:

Fields:

* name
* username
* email
* password
* bio
* skills[]

Must:

* Validate required fields
* Display suggested username if 409 returns it
* Redirect to login on success

Login page:

Fields:

* email
* password

On success:

* Store token
* Store user
* Redirect to intended route

---

### 6.2 Users

My Profile (`/users/me`):

Display:

* name
* username
* email
* bio
* skills
* rating_avg
* completed_jobs

Public Profile (`/users/:username`):

Display public fields only.

---

### 6.3 Jobs

Search (`/jobs`):

Filters:

* category
* status (default: open)
* min_budget

Create (`/jobs/create`):

Fields:

* title
* description
* budget
* category

Job Details (`/jobs/:id`):

Display:

* job fields
* owner summary
* freelancer summary (if assigned)

Must render action panel according to status and role.

My Postings (`/jobs/my-postings`)

Edit (`/jobs/:id/edit`)

---

### 6.4 Proposals

Submit proposal (from job details):

Fields:

* price
* cover_letter or message

Must:

* Prevent submitting to own job
* Disable if job not open
* Prevent multiple pending proposals in UI

Job Proposals (`owner only`)

* List proposals
* Accept proposal (confirmation dialog)

My Bids (`/proposals/my-bids`)

* List submitted proposals
* Allow delete if pending

---

### 6.5 Reviews

Submit Review (from completed job):

Fields:

* target_id
* rating (1–5)

Must:

* Prevent self-review
* Prevent duplicate review
* Refresh job/profile after submission

User Reviews (`/reviews/user/:id`)

---

### 6.6 Platform

Stats page:

Display:

* total_users
* active_jobs
* total_value_moved

---

## 7. Business Rules (UI Matrix)

On Job Details:

If status = open:

* Non-owner may submit proposal (if no pending proposal)
* Owner may view proposals

If status = in_progress:

* Owner or assigned freelancer may complete

If status = completed:

* Owner and freelancer may review the other participant
* Disable review if already submitted

Backend remains authoritative.
All 400/401/403/404/409 errors must be displayed.

---

## 8. Mandatory Workflow Validation

The following sequence must work without error:

1. User A registers
2. User A logs in
3. User A creates a job
4. User B registers
5. User B submits proposal
6. User A accepts proposal
7. Job becomes in_progress
8. One participant completes job
9. Both participants leave reviews
10. Ratings update correctly

---

## 9. Evaluation Alignment

The architecture ensures:

* Correct API integration
* Proper JWT handling
* Complete error handling
* Proper Angular structure
* Clean separation of concerns
* Full business flow implementation
* No mocked data
* Clean repository structure for submission

This document is the authoritative implementation guideline.
