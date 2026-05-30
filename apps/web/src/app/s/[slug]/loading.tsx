import { KCSkeleton } from "@kashmir/ui";

export default function StorefrontLoading(): JSX.Element {
  return (
    <main className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      <KCSkeleton className="h-[40vh] w-full rounded-2xl" />
      <div className="grid gap-3 md:grid-cols-4">
        <KCSkeleton className="h-16 rounded-xl" />
        <KCSkeleton className="h-16 rounded-xl" />
        <KCSkeleton className="h-16 rounded-xl" />
        <KCSkeleton className="h-16 rounded-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <KCSkeleton className="h-64 rounded-2xl" />
        <KCSkeleton className="h-64 rounded-2xl" />
        <KCSkeleton className="h-64 rounded-2xl" />
      </div>
    </main>
  );
}
