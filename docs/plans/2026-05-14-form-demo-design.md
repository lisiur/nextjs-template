# Form Demo Page Design

## Overview

A comprehensive form demo page showcasing all common form field types with validation, submission handling, and error states. This serves as a reference implementation for forms in the Next.js monorepo.

## Route

`/demo/form`

## Components to Install

Install the following shadcn/ui components:

```bash
pnpm dlx shadcn@latest add checkbox select textarea radio-group label badge
```

## Form Fields

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Name | text input | required, min 2 chars | Basic text field |
| Email | email input | required, valid email format | Uses `z.email()` |
| Password | password input | required, min 8 chars | Shows strength indicator |
| Bio | textarea | optional, max 500 chars | Multi-line text |
| Country | select | required | Dropdown with options |
| Preference | radio group | required | Single selection |
| Terms | checkbox | must be checked | Required agreement |
| Avatar | file upload | optional, image only | Shows preview |

## Zod Schema

```typescript
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  country: z.string().min(1, "Please select a country"),
  preference: z.enum(["email", "sms", "push"], {
    required_error: "Please select a preference",
  }),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms",
  }),
  avatar: z.any().optional(),
});
```

## Features

1. **Validation**
   - Real-time field validation on blur
   - Form-level validation on submit
   - Clear error messages below each field

2. **Submission**
   - Simulated 2-second delay
   - Loading state with spinner
   - Success toast notification
   - Error toast on failure

3. **UX Enhancements**
   - Form reset button
   - Disabled state examples
   - Field descriptions/helper text
   - Required field indicators (*)

4. **State Management**
   - React Hook Form for form state
   - Zustand not needed (local state sufficient)

## File Structure

```
apps/web/src/
├── app/demo/form/page.tsx          # Page component
├── components/forms/
│   └── form-demo.tsx               # Main form component
└── components/ui/                  # shadcn/ui components (installed)
    ├── checkbox.tsx
    ├── select.tsx
    ├── textarea.tsx
    ├── radio-group.tsx
    ├── label.tsx
    └── badge.tsx
```

## Layout

The page follows the existing demo page pattern:
- Centered content with max-width
- Card wrapper for the form
- Header with title and description
- Footer with action buttons (Submit, Reset)

## Dependencies

- React Hook Form (already installed)
- @hookform/resolvers (already installed)
- Zod (already installed)
- shadcn/ui components (to be installed)
- Sonner for toast notifications (already installed)

## Success Criteria

- [ ] All field types render correctly
- [ ] Validation works for all fields
- [ ] Submission shows loading and success states
- [ ] Form can be reset
- [ ] Error messages display properly
- [ ] Responsive on mobile and desktop
- [ ] Follows existing code patterns (login-form.tsx)
