# SkillSwap Shared UI Components

This document lists the **existing shared UI components** located in:

```
src/app/shared
```

These components must be reused throughout the application to maintain visual and structural consistency with the global design system defined in `styles.scss`.

The purpose of this reference is simply:

* identify the available shared components
* show their inputs
* show how they are used

No component should introduce new styling outside the global stylesheet.

Angular **control flow syntax** must be used (`@if`, `@for`). Deprecated directives must not be used.

---

# Alert Error

Displays an error message.

## Input

```
message: string
```

## Template

```
<div class="alert-base alert-error inline">
  <i class="icon fas fa-circle-exclamation"></i>
  <span>{{ message }}</span>
</div>
```

## Usage

```
<app-alert-error message="Invalid credentials"></app-alert-error>
```

---

# Alert Success

Displays a success message.

## Input

```
message: string
```

## Template

```
<div class="alert-base alert-success inline">
  <i class="icon fas fa-circle-check"></i>
  <span>{{ message }}</span>
</div>
```

## Usage

```
<app-alert-success message="Profile updated"></app-alert-success>
```

---

# Spinner

Displays a loading spinner.

## Input

```
label?: string
```

## Template

```
<div class="spinner">
  <i class="icon fas fa-spinner fa-spin"></i>

  @if (label) {
    <span>{{ label }}</span>
  }
</div>
```

## Usage

```
<app-spinner label="Loading..."></app-spinner>
```

or

```
<app-spinner></app-spinner>
```

---

# Empty State

Displays a placeholder when a list or section has no content.

## Inputs

```
title: string
message: string
```

## Template

```
<div class="card stack-md text-muted animate-fade-in">

  <div class="inline">
    <i class="icon fas fa-folder-open"></i>
    <h3>{{ title }}</h3>
  </div>

  <p>{{ message }}</p>

  <ng-content></ng-content>

</div>
```

## Usage

```
<app-empty-state
  title="No jobs"
  message="There are currently no jobs available.">
</app-empty-state>
```

---

# Rating Stars

Displays a rating between 0 and 5.

## Input

```
rating: number
```

## Template

```
<div class="rating-stars">

  @for (star of stars; track star) {
    <i
      class="icon fas fa-star"
      [class.text-muted]="star > rating">
    </i>
  }

</div>
```

## Usage

```
<app-rating-stars [rating]="4"></app-rating-stars>
```

---

# Field Error

Displays validation text for a single form field.

## Input

```
message: string
```

## Template

```
<div class="field-error inline">
  <i class="icon fas fa-circle-exclamation"></i>
  <span>{{ message }}</span>
</div>
```

## Usage

```
<app-field-error message="Email is required"></app-field-error>
```

---

# Form Error Summary

Displays multiple validation errors at the top of a form.

## Input

```
errors: string[]
```

## Template

```
<div class="alert-base alert-error stack-xs">

  <div class="inline">
    <i class="icon fas fa-triangle-exclamation"></i>
    <strong>Errors</strong>
  </div>

  <ul>
    @for (e of errors; track e) {
      <li>{{ e }}</li>
    }
  </ul>

</div>
```

## Usage

```
<app-form-error-summary
  [errors]="formErrors">
</app-form-error-summary>
```

---

# Confirm Dialog

Displays a confirmation modal.

## Inputs

```
title: string
message: string
```

## Outputs

```
confirm
cancel
```

## Template

```
<div class="modal-backdrop animate-fade-in">

  <div class="modal-panel card stack-md animate-fade-in-up">

    <h3>{{ title }}</h3>

    <p class="text-soft">
      {{ message }}
    </p>

    <div class="inline-between">

      <button
        type="button"
        class="btn btn-ghost"
        (click)="cancel.emit()">

        <i class="icon fas fa-xmark"></i>
        Cancel

      </button>

      <button
        type="button"
        class="btn btn-danger"
        (click)="confirm.emit()">

        <i class="icon fas fa-check"></i>
        Confirm

      </button>

    </div>

  </div>

</div>
```

## Usage

```
<app-confirm-dialog
  title="Delete job"
  message="This action cannot be undone"
  (confirm)="deleteJob()"
  (cancel)="closeDialog()">
</app-confirm-dialog>
```

---

# Shared Components List

```
alert-error
alert-success
spinner
empty-state
rating-stars
field-error
form-error-summary
confirm-dialog
```

These are the **only shared UI primitives currently available**.
