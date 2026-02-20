import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { ArrowRight, Star } from 'lucide-react'
import { LandingLayout } from '#/components/landing/LandingLayout'
import { Button } from '#/components/ui/button'
import { useAuth } from '#/lib/auth-context'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

const accentGreen = 'hsl(160, 84%, 39%)'

function LandingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate({ to: '/dashboard' })
    }
  }, [user, navigate])

  if (user) {
    return null
  }

  return (
    <LandingLayout>
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-8 shrink-0">
        <Link to="/" className="flex items-center gap-2.5 text-black/90 hover:text-black transition-colors">
          <img src="/images/logo.svg" alt="" className="h-8 w-8" aria-hidden />
          <span className="text-lg font-semibold tracking-tight">Vitalis</span>
        </Link>
        <Link
          to="/login"
          search={{ redirect: undefined }}
          className="text-sm font-medium text-black/80 hover:text-black transition-colors"
        >
          Sign in
        </Link>
      </header>

      {/* Hero — left: copy + CTAs + metrics; right: hero image */}
      <main className="relative z-10 flex flex-1 items-center px-6 sm:px-8 md:px-12 lg:px-16">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 lg:items-center text-left">
          <div className="flex flex-col gap-10 md:gap-16">
            <div className="flex flex-col gap-5 max-w-xl">
              <h1 className="text-4xl font-bold tracking-tight text-black sm:text-5xl md:text-6xl lg:text-7xl">
                Put your{' '}
                <span className="border-b-2 border-black/15 border-dotted">members</span>
                {' '}
                first.
              </h1>
              <p className="text-base text-black/70 sm:text-lg">
                Fast, clear and compliant — turn healthcare admin into people and culture. Manage claims, members and reporting in one branded place.
              </p>
            </div>
            <div>
              <Button
                size="lg"
                className="w-full text-white hover:opacity-90 sm:w-auto"
                style={{ backgroundColor: accentGreen }}
                asChild
              >
                <Link to="/register" className="inline-flex items-center gap-2">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            {/* Metrics */}
            <div className="flex flex-wrap gap-x-10 gap-y-4 border-t border-black/10 pt-10">
              <div>
                <p className="text-2xl font-semibold tabular-nums text-black">98%</p>
                <p className="mt-0.5 text-sm text-black/60">Claims processed on time</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums text-black">10k+</p>
                <p className="mt-0.5 text-sm text-black/60">Members supported</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-black text-black" aria-hidden />
                  ))}
                  <Star className="h-4 w-4 fill-black/50 text-black/50" aria-hidden />
                </div>
                <span className="text-sm text-black/70">4.8 Average user rating</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center lg:justify-end">
            <img
              src="/images/hero.jpeg"
              alt=""
              className="w-full max-w-md object-contain"
              aria-hidden
            />
          </div>
        </div>
      </main>
    </LandingLayout>
  )
}
