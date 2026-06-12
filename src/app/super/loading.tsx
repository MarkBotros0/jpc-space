import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function SuperLoading() {
  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
