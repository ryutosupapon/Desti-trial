// Minimal segment layout for /shared routes.
// This lets Next's build worker see a layout in the ancestry of shared/[id]/page.
export default function SharedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
