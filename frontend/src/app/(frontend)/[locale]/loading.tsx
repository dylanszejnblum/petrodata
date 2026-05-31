import React from 'react'

function SkeletonPulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-[2rem] bg-nd-surface-raised ${className ?? ''}`} />
}

export default function Loading() {
  return (
    <>
      <header className="container py-4">
        <div className="flex items-center justify-between">
          <div className="animate-pulse rounded-full bg-nd-surface-raised h-8 w-28" />
          <div className="animate-pulse rounded-full bg-nd-surface-raised h-4 w-48 hidden md:block" />
        </div>
      </header>
      <main className="flex-1">
        <section className="container py-12 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,40rem)] lg:items-center">
            <div>
              <div className="animate-pulse rounded bg-nd-surface-raised h-3 w-48 mb-4" />
              <div className="animate-pulse rounded bg-nd-surface-raised h-16 w-72 mb-6" />
              <div className="animate-pulse rounded bg-nd-surface-raised h-4 w-96 max-w-full mb-2" />
              <div className="animate-pulse rounded bg-nd-surface-raised h-4 w-64 max-w-full" />
              <div className="mt-8 flex gap-3">
                <div className="animate-pulse rounded-full bg-nd-surface-raised h-12 w-36" />
                <div className="animate-pulse rounded-full bg-nd-surface-raised h-12 w-40" />
              </div>
            </div>
            <SkeletonPulse className="hidden lg:block h-[400px]" />
          </div>
        </section>
        <section className="container pb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-nd-border">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-nd-surface p-5">
                <div className="animate-pulse rounded bg-nd-surface-raised h-3 w-20 mb-3" />
                <div className="animate-pulse rounded bg-nd-surface-raised h-6 w-24" />
              </div>
            ))}
          </div>
        </section>
        <section className="container pb-20">
          <SkeletonPulse className="h-[500px]" />
        </section>
      </main>
    </>
  )
}
