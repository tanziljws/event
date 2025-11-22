export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Public pages don't need special layout - they use the root layout */}
      {children}
    </div>
  )
}
