export function isAdminUser(user?: { email?: string | null; role?: string | null } | null) {
  if (!user?.email) return false
  if (user.role === 'admin') return true

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  return adminEmails.includes(user.email.toLowerCase())
}

export function shanghaiDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
