import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function proxy() {
    return NextResponse.next()
  },
  {
    pages: {
      signIn: '/login',
    },
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect specific routes
        const protectedPaths = ['/profile', '/dashboard', '/courses/learn', '/admin']
        const pathname = req.nextUrl.pathname

        const isProtected = protectedPaths.some(path =>
          pathname.startsWith(path)
        )

        if (isProtected && !token) {
          return false
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/profile/:path*',
    '/dashboard/:path*',
    '/courses/learn/:path*',
    '/admin/:path*',
  ],
}
