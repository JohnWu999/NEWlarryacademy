export function isAdminUser(user?: { email?: string | null; role?: string | null } | null) {
  if (!user?.email) return false
  return user.email.toLowerCase() === 'wularry999@gmail.com'
}

export function shanghaiDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
