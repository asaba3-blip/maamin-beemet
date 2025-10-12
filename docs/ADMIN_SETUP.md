# Admin User Setup

After the security migration, admin roles are now stored in a separate `user_roles` table for better security.

## To Grant Admin Access to a User

1. Go to the [Supabase SQL Editor](https://supabase.com/dashboard/project/sfqbhpplirspvgdqlcdl/sql/new)

2. Run this SQL command (replace the email with the user's email):

```sql
-- Grant admin role to a user by their email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'user@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

## To Remove Admin Access

```sql
-- Remove admin role from a user by their email
DELETE FROM public.user_roles
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'user@example.com'
)
AND role = 'admin';
```

## To View All Admins

```sql
-- List all users with admin role
SELECT u.email, ur.created_at as admin_since
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role = 'admin';
```

## Security Notes

- Admin roles are now stored separately from user profiles
- The system uses a security definer function `has_role()` to check permissions
- All RLS policies have been updated to use this new architecture
- This prevents privilege escalation attacks that could occur with the old `is_admin` boolean flag
