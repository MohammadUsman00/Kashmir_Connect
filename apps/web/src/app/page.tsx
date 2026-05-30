import Link from "next/link";
import { Button, Card, CardDescription, CardTitle } from "@kashmir/ui";

export default function HomePage(): JSX.Element {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <Card className="space-y-4">
        <CardTitle>Kashmir Connect - Next.js 15 Monorepo</CardTitle>
        <CardDescription>
          App Router + TypeScript strict + tRPC + Prisma + Supabase + Tailwind v4 + shadcn-style UI package.
        </CardDescription>
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button>Open Dashboard</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
