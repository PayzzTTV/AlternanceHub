import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "AlternanceHub — Offres d'alternance cybersécurité",
  description:
    "Agrégateur d'offres d'alternance en cybersécurité. France Travail, La Bonne Alternance en un seul endroit.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
