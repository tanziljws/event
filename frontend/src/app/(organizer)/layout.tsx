export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Organizer pages use organizer-specific layout */}
      {children}
    </div>
  )
}
