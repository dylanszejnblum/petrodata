import { MapSkeleton, Skeleton } from '@/ui/skeleton'

export default function Loading() {
  return (
    <div className="pb-14">
      <div className="mx-auto max-w-[80rem] px-4 py-10 md:px-8">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-11 w-[min(20rem,70%)]" />
      </div>
      <MapSkeleton />
    </div>
  )
}
