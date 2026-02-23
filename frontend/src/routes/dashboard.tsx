import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { format } from 'date-fns'
import {
  Search,
  Calendar,
  Download,
  HelpCircle,
  Bell,
  MessageCircle,
  BarChart3,
  TrendingUp,
  Banknote,
  Receipt,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis } from 'recharts'
import {
  dashboardSummary,
  clientClaims,
  claimsPerMonth,
  CURRENCY_CODE,
} from '#/data/dashboard-dummy'
import { getAuthUser, getTenantId } from '#/lib/auth-store'
import { formatCurrency, formatPercent, cn } from '#/lib/utils'
import { getApiErrorDetail } from '#/lib/api-client'
import { Button } from '#/components/ui/button'
import { DashboardSkeleton } from '#/components/DashboardSkeleton'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '#/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '#/components/ui/chart'
import { ScrollArea } from '#/components/ui/scroll-area'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => requireAuthBeforeLoad('/dashboard'),
  component: DashboardPage,
})

const chartConfig = {
  claims: {
    label: 'Claims',
    color: 'hsl(210, 45%, 52%)',
  },
} satisfies ChartConfig

function DashboardPage() {
  const user = getAuthUser()
  const displayName = user?.full_name || user?.username || 'Guest'
  const tenantId = getTenantId()
  const { totalClaims, totalClaimsChangePercent, totalPremiums, totalPremiumsChangePercent, projectedClaims, projectedClaimsChangePercent, periodLabel } = dashboardSummary

  const isLoading = false
  const error: Error | null = null
  const refetch = () => {}

  return (
    <div className="flex flex-col gap-10 p-6 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-1">
          <button
            type="button"
            className="flex h-9 min-w-[280px] max-w-md items-center justify-start gap-2 rounded-md bg-[var(--secondary)] px-3 text-left text-sm text-[var(--foreground-muted)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          >
            <Search className="size-4" aria-hidden />
            <span>Search</span>
            <kbd className="hidden rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-xs sm:inline-block">
              ⌘K
            </kbd>
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Welcome back, {displayName}
          </h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            Claims and premiums overview for this month.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-md bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]">
            <Calendar className="size-4 text-[var(--foreground-muted)]" aria-hidden />
            {format(new Date(), 'EEE, d MMM yyyy')}
          </div>
          <Button variant="secondary" size="default" className="gap-2">
            <Download className="size-4" aria-hidden />
            Export
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Help">
              <HelpCircle className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Messages">
              <MessageCircle className="size-4" />
            </Button>
            <div
              className="flex size-9 items-center justify-center rounded-full bg-[var(--muted)] text-sm font-medium text-[var(--foreground)]"
              aria-hidden
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {!tenantId ? (
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to see the dashboard.
        </p>
      ) : error ? (
        <div className="flex flex-col gap-2">
          <p className="text-[var(--destructive)]">
            {getApiErrorDetail(error)}
          </p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <DashboardSkeleton />
      ) : (
      <div className="grid gap-4 lg:grid-cols-5 lg:items-stretch">
        <Card className="flex min-h-0 flex-col border border-[var(--border-subtle)] bg-transparent py-2.5 lg:col-span-2">
          <CardHeader className="gap-2 px-4 pb-1.5">
            <div className="flex items-end gap-2.5">
              <Receipt className="size-5 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
              <span className="text-sm font-medium text-[var(--foreground-muted)] leading-none">
                Total claims
              </span>
              <span className="font-mono text-xs text-[var(--foreground-subtle)]">
                {CURRENCY_CODE}
              </span>
            </div>
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-[var(--foreground)]">
              {formatCurrency(totalClaims)}
            </p>
            <p
              className={cn(
                'text-xs tabular-nums',
                totalClaimsChangePercent >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-500 dark:text-red-400'
              )}
            >
              {formatPercent(totalClaimsChangePercent)} {periodLabel}
            </p>
            <div className="pt-1">
              <p className="text-xs text-[var(--foreground-muted)]">
                Claims by client this month
              </p>
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 px-4 pt-0.5">
            <ScrollArea
              className="pr-3"
              style={{ height: 'min(180px, 26vh)' }}
            >
              <ul className="py-0.5" role="list">
                {clientClaims.map((client) => (
                  <li key={client.id}>
                    <div className="flex items-center justify-between px-1 py-1 transition-colors hover:bg-[var(--muted)]/40 rounded-md">
                      <span className="truncate text-sm font-medium text-[var(--foreground)]">
                        {client.name}
                      </span>
                      <div className="flex shrink-0 items-center gap-4 tabular-nums">
                        <span className="text-sm text-[var(--foreground)]">
                          {formatCurrency(client.amount)}
                        </span>
                        <span
                          className={cn(
                            'min-w-[3rem] text-right text-xs font-medium',
                            client.changePercent >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-500 dark:text-red-400'
                          )}
                        >
                          {formatPercent(client.changePercent)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="flex min-h-0 flex-col gap-3 lg:col-span-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="border border-[var(--border-subtle)] bg-transparent py-3">
              <CardHeader className="flex flex-col gap-1.5 px-4 pb-0">
                <div className="flex items-end gap-2.5">
                  <Banknote className="size-5 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
                  <CardTitle className="text-sm font-medium text-[var(--foreground-muted)] leading-none">
                    Total premiums
                  </CardTitle>
                </div>
                <p className="text-base font-semibold tabular-nums tracking-tight text-[var(--foreground)]">
                  {formatCurrency(totalPremiums)}
                </p>
                <p
                  className={cn(
                    'text-xs tabular-nums',
                    totalPremiumsChangePercent >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-500 dark:text-red-400'
                  )}
                >
                  {formatPercent(totalPremiumsChangePercent)} {periodLabel}
                </p>
              </CardHeader>
            </Card>

            <Card className="border border-[var(--border-subtle)] bg-transparent py-3">
              <CardHeader className="flex flex-col gap-1.5 px-4 pb-0">
                <div className="flex items-end gap-2.5">
                  <TrendingUp className="size-5 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
                  <CardTitle className="text-sm font-medium text-[var(--foreground-muted)] leading-none">
                    Projected claims
                  </CardTitle>
                </div>
                <p className="text-base font-semibold tabular-nums tracking-tight text-[var(--foreground)]">
                  {formatCurrency(projectedClaims)}
                </p>
                <p
                  className={cn(
                    'text-xs tabular-nums',
                    projectedClaimsChangePercent >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-500 dark:text-red-400'
                  )}
                >
                  {formatPercent(projectedClaimsChangePercent)}
                </p>
              </CardHeader>
            </Card>
          </div>

          <Card className="flex min-h-0 flex-1 flex-col border border-[var(--border-subtle)] bg-transparent py-2">
            <CardHeader className="flex flex-row items-end shrink-0 px-4 pb-1.5">
              <div className="flex items-end gap-2.5">
                <BarChart3 className="size-5 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
                <CardTitle className="text-sm font-semibold text-[var(--foreground)] leading-none">
                  Overview
                </CardTitle>
              </div>
              <select
                className="ml-auto rounded bg-[var(--secondary)]/80 px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                aria-label="Filter by period"
              >
                <option>This year</option>
                <option>Last 6 months</option>
                <option>Last 3 months</option>
              </select>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 px-4 pt-0 pb-1">
              <ChartContainer config={chartConfig} className="h-full min-h-[120px] max-h-[200px] w-full">
                <BarChart
                  data={claimsPerMonth}
                  margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
                >
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v / 1000}k`}
                    tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(v) => formatCurrency(Number(v))}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.month}
                      />
                    }
                  />
                  <Bar
                    dataKey="claims"
                    fill="var(--color-claims)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
      )}
    </div>
  )
}
