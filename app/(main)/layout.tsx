import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-dvh w-full max-w-full overflow-x-clip">{children}</main>
      <Footer />
    </>
  )
}
