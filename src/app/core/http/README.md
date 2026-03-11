# HTTP Layer (core/http)

Purpose: centralize HTTP behavior for the frontend so services remain small and consistent.

Files:

```
api-client.ts
api-error.model.ts
error.util.ts
```

---

# Role in Application Architecture

Request flow:

```
Component
   ↓
Feature Service
   ↓
ApiClient
   ↓
Angular HttpClient
   ↓
Backend API
```

Responsibilities by layer

| Layer           | Responsibility                        |
| --------------- | ------------------------------------- |
| Component       | UI logic, user interaction            |
| Feature Service | Map API endpoints to functions        |
| ApiClient       | HTTP requests + error normalization   |
| HttpClient      | Angular low‑level HTTP implementation |

Rule:

```
Components and feature services must NOT use HttpClient directly
```

All HTTP calls pass through **ApiClient**.

---

# Why ApiClient Exists

Without wrapper:

```ts
this.http.post(`${BASE_API_URL}/jobs`, body)
```

With wrapper:

```ts
this.api.post<Job>('/jobs', dto)
```

Benefits:

| Problem                 | Solution                 |
| ----------------------- | ------------------------ |
| repeated base URL       | centralized in ApiClient |
| repeated error handling | normalized once          |
| duplicated HTTP logic   | removed from services    |

---

# File Overview

## api-client.ts

HTTP wrapper around Angular `HttpClient`.

Methods provided:

```
get<T>()
post<T>()
patch<T>()
delete<T>()
```

Example service usage:

```ts
return this.api.get<User>('/users/me')
```

Generic `<T>` represents expected response type.

---

## api-error.model.ts

Standardized error structure used across the frontend.

Type:

```
ApiError
```

Fields:

| Field   | Meaning                        |
| ------- | ------------------------------ |
| status  | HTTP status code               |
| message | readable backend error message |
| raw     | original backend payload       |

Purpose:

```
Avoid exposing Angular HttpErrorResponse objects to UI components
```

---

## error.util.ts

Utility that converts Angular errors into `ApiError`.

Backend error format:

```
{ "error": "message" }
```

Transformation:

```
HttpErrorResponse
   ↓
normalizeError()
   ↓
ApiError
```

---

# Angular HTTP Behavior

Angular HTTP calls return **Observables**, not Promises.

Example:

```ts
http.get<User>()
```

returns

```
Observable<User>
```

Meaning:

```
a future asynchronous value that will emit a User
```

---

# Observables (Quick Reference)

Concept summary:

| Property   | Explanation                       |
| ---------- | --------------------------------- |
| lazy       | request runs only when subscribed |
| cancelable | subscription can be cancelled     |
| composable | operators transform the stream    |

Example:

```ts
this.service.method().subscribe({
  next: data => ...
  error: err => ...
})
```

Handlers:

| Handler  | Purpose             |
| -------- | ------------------- |
| next     | successful response |
| error    | failure response    |
| complete | stream finished     |

HTTP calls usually use only **next** and **error**.

---

# RxJS Operator Used

Operator used in ApiClient:

```
catchError()
```

Purpose:

```
Intercept errors in observable pipeline
```

Flow:

```
HTTP error
   ↓
catchError
   ↓
normalizeError()
   ↓
ApiError
```

Result:

```
UI always receives ApiError
```

---

# Example Usage

Service:

```ts
createJob(dto: JobCreateDTO) {
  return this.api.post<Job>('/jobs', dto)
}
```

Component:

```ts
this.jobsService.createJob(dto).subscribe({
  next: job => ...,
  error: err => this.errorMessage = err.message
})
```

### Typical Component Pattern example:
```ts
submit() {

  this.loading = true
  this.errorMessage = null

  this.service.call(dto).subscribe({

    next: result => {
      this.loading = false
      ...
    },

    error: err => {
      this.loading = false
      this.errorMessage = err.message
    }

  })
}
```
---

# Design Rules

| Rule                        | Reason                       |
| --------------------------- | ---------------------------- |
| HTTP logic centralized      | avoid duplication            |
| services remain thin        | easier maintenance           |
| consistent error structure  | simpler UI handling          |
| components focus on UI only | clear separation of concerns |

---

# Documentation Sources

Angular HttpClient

[https://angular.dev/guide/http](https://angular.dev/guide/http)

RxJS Observables

[https://rxjs.dev/guide/observable](https://rxjs.dev/guide/observable)

RxJS catchError

[https://rxjs.dev/api/operators/catchError](https://rxjs.dev/api/operators/catchError)

Angular Error Handling (HttpErrorResponse)

[https://angular.dev/api/common/http/HttpErrorResponse](https://angular.dev/api/common/http/HttpErrorResponse)

Reactive Programming Concepts

[https://rxjs.dev/guide/overview](https://rxjs.dev/guide/overview)

---

End of HTTP layer documentation.
