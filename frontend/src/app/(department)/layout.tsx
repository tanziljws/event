export default function DepartmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Department pages use department-specific layout */}
      {children}
    </div>
  )
}
