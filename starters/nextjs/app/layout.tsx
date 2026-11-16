import type {Metadata} from "next"
import type {ReactNode} from "react"
// Scriviamo's interface uses Bootstrap's CSS and Bootstrap Icons (not Bootstrap's JavaScript),
// loaded before Scriviamo's own stylesheets.
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.min.css"
import "../../../dist/scriviamo.css"
import "../../../dist/addons/scriviamo.callouts.css"
import "../../../dist/addons/scriviamo.media.css"
import "../../../dist/addons/scriviamo.math.css"
import "../../../dist/addons/scriviamo.diagrams.css"
import "./app.css"

export const metadata: Metadata = {
  title: "Scriviamo with Next.js",
  description: "Write documents with Scriviamo, and publish them as server-rendered pages."
}

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="en" data-bs-theme="light">
      <body>
        <main className="container py-4">{children}</main>
      </body>
    </html>
  )
}
