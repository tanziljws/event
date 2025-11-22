export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard pages use the main layout with sidebar/navigation */}
      {children}
    </div>
  )
}
