/**
 * Light, minimal layout for the marketing landing page (Monotree-style).
 */
export function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0f0f0f] antialiased">
      {children}
    </div>
  )
}
