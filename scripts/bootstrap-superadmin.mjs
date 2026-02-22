import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  process.exit(1)
}

const email = 'design@doimih.net'
const temporaryPassword = 'TempPass123'

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const { data: usersPage, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (listError) {
  console.error('Failed to list users:', listError.message)
  process.exit(1)
}

const existing = usersPage.users.find((item) => item.email?.toLowerCase() === email)

if (!existing) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    app_metadata: { role: 'superadmin' },
  })

  if (error) {
    console.error('Failed to create superadmin user:', error.message)
    process.exit(1)
  }

  console.log(`Created user ${email} with id ${data.user.id}`)
} else {
  const { error } = await admin.auth.admin.updateUserById(existing.id, {
    password: temporaryPassword,
    email_confirm: true,
    app_metadata: { role: 'superadmin' },
  })

  if (error) {
    console.error('Failed to update superadmin password:', error.message)
    process.exit(1)
  }

  console.log(`Updated temporary password for ${email}`)
}

const { data: usersAfter, error: listAfterError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (listAfterError) {
  console.error('Failed to re-list users:', listAfterError.message)
  process.exit(1)
}

const user = usersAfter.users.find((item) => item.email?.toLowerCase() === email)

if (!user) {
  console.error('User not found after create/update.')
  process.exit(1)
}

const { error: profileError } = await admin
  .from('profiles')
  .upsert({ id: user.id, email, role: 'superadmin' }, { onConflict: 'id' })

if (profileError) {
  console.warn('Profiles table missing or inaccessible. Auth user was still updated as superadmin in app_metadata.')
  console.warn(`Details: ${profileError.message}`)
  process.exit(0)
}

console.log(`Superadmin profile ensured for ${email}`)