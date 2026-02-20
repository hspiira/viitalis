/**
 * Shared layout for login/register: full-screen dark background with animated bg and overlay.
 */
export function AuthPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark min-h-screen flex flex-col bg-[var(--background)]">
      {/* Animated background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-[0.14]"
        style={{ backgroundImage: 'url(/images/background.gif)' }}
        aria-hidden
      />
      {/* Soft overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] bg-[var(--background)]/60"
        aria-hidden
      />

      {/* Subtle grid */}
      <div
        className="pointer-events-none fixed inset-0 z-[2] opacity-[0.015]"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '8px 8px',
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-[2] opacity-[0.04]"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 45%, var(--card), transparent 65%)',
        }}
      />

      <div className="relative z-10 flex flex-1 items-center justify-center p-6">
        {children}
      </div>
    </div>
  )
}
