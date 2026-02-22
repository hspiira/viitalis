import { Card, CardHeader, CardContent } from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-5 lg:items-stretch">
      {/* Left card */}
      <Card className="flex min-h-0 flex-col border border-[var(--border-subtle)] bg-transparent py-2.5 lg:col-span-2">
        <CardHeader className="gap-2 px-4 pb-1.5">
          <div className="flex items-end gap-2.5">
            <Skeleton className="size-5 shrink-0 rounded" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-3 w-32" />
          <div className="pt-1">
            <Skeleton className="h-3 w-40" />
          </div>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 px-4 pt-0.5">
          <div className="flex flex-col gap-1 pr-3" style={{ height: 'min(180px, 26vh)' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center justify-between px-1 py-1">
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-10" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Right column */}
      <div className="flex min-h-0 flex-col gap-3 lg:col-span-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border border-[var(--border-subtle)] bg-transparent py-3">
            <CardHeader className="flex flex-col gap-1.5 px-4 pb-0">
              <div className="flex items-end gap-2.5">
                <Skeleton className="size-5 shrink-0 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-28" />
            </CardHeader>
          </Card>
          <Card className="border border-[var(--border-subtle)] bg-transparent py-3">
            <CardHeader className="flex flex-col gap-1.5 px-4 pb-0">
              <div className="flex items-end gap-2.5">
                <Skeleton className="size-5 shrink-0 rounded" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-3 w-12" />
            </CardHeader>
          </Card>
        </div>
        <Card className="flex min-h-0 flex-1 flex-col border border-[var(--border-subtle)] bg-transparent py-2">
          <CardHeader className="flex flex-row items-end shrink-0 px-4 pb-1.5">
            <div className="flex items-end gap-2.5">
              <Skeleton className="size-5 shrink-0 rounded" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="ml-auto h-8 w-24 rounded" />
          </CardHeader>
          <CardContent className="min-h-0 flex-1 px-4 pt-0 pb-1">
            <Skeleton className="h-full min-h-[120px] w-full rounded" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
