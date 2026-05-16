# User Management Design

## Overview

Add user management functionality with a data table view and CRUD operations using better-auth's admin plugin APIs.

## Requirements

- List users in a data table with pagination
- View user details
- Edit user fields (name, email, role)
- Delete users with confirmation dialog
- Page location: `/users` inside `(logged)` route group

## Architecture

### Page Structure

```
src/app/(logged)/users/
├── page.tsx                    # Main page component
└── components/
    ├── user-table.tsx          # Data table with pagination
    ├── user-dialog.tsx         # Create/Edit dialog
    └── delete-confirm-dialog.tsx  # Delete confirmation
```

### Data Flow

```
Frontend → better-auth admin client → /api/auth/* endpoints → Prisma → PostgreSQL
```

### API Methods

Using better-auth's admin plugin client:

- `authClient.admin.listUsers()` — Fetch users with pagination (limit/offset)
- `authClient.admin.updateUser()` — Update user fields
- `authClient.admin.removeUser()` — Delete user

## UI Components

### User Table (`user-table.tsx`)

Columns:
- Name
- Email
- Role (badge: admin/member)
- Status (badge: active/banned)
- Created At (formatted date)
- Actions (Edit, Delete buttons)

Features:
- Server-side pagination
- Loading skeleton while fetching
- Empty state message

### User Dialog (`user-dialog.tsx`)

- Single dialog for create and edit modes
- Fields: Name (text), Email (text), Role (select: admin/member)
- Form validation with react-hook-form + zod
- Calls `authClient.admin.updateUser()` on submit

### Delete Confirmation (`delete-confirm-dialog.tsx`)

- Shows user name to confirm
- Calls `authClient.admin.removeUser()` on confirm
- Toast notification on success/error

## Error Handling

- API errors → Toast notifications (sonner)
- Form validation → Inline field messages
- Loading states → Skeleton/spinner
- Empty states → "No users found" message

## i18n Keys

Add to `messages/en.json` and `messages/zh.json`:

```json
{
  "Users": {
    "title": "User Management",
    "description": "Manage system users",
    "addUser": "Add User",
    "editUser": "Edit User",
    "deleteUser": "Delete User",
    "name": "Name",
    "email": "Email",
    "role": "Role",
    "status": "Status",
    "createdAt": "Created At",
    "actions": "Actions",
    "noUsers": "No users found",
    "confirmDelete": "Are you sure you want to delete",
    "deleteSuccess": "User deleted successfully",
    "updateSuccess": "User updated successfully",
    "roles": {
      "admin": "Admin",
      "member": "Member"
    }
  }
}
```

## Implementation Steps

1. Add shadcn/ui Table component
2. Create user table component with pagination
3. Create user dialog component
4. Create delete confirmation dialog
5. Create main users page
6. Add i18n translations
7. Test all CRUD operations
