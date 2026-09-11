export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`motion-safe:animate-pulse rounded-[10px] bg-raised ${className}`}
    />
  )
}

/* Esqueletos por forma de página — reemplazan el loading.tsx único de producción */

export function ListSkeleton() {
  return (
    <div className="mx-auto max-w-[80rem] px-4 py-10 md:px-8">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-4 h-12 w-[min(28rem,80%)]" />
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44" />
        ))}
      </div>
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-[80rem] px-4 py-10 md:px-8">
      <Skeleton className="h-4 w-56" />
      <Skeleton className="mt-4 h-12 w-[min(24rem,70%)]" />
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="mt-8 h-[280px]" />
    </div>
  )
}

export function MapSkeleton() {
  return <Skeleton className="h-[70dvh] w-full rounded-none" />
}
