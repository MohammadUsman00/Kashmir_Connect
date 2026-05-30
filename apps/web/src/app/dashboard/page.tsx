import { auth } from "@/server/auth";
import { KCCard } from "@kashmir/ui";

export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await auth();

  return (
    <main className="mx-auto max-w-5xl p-6">
      <KCCard className="space-y-3">
        <h2 className="text-xl font-semibold">Merchant Dashboard</h2>
        <p className="text-sm text-[#6a5548] dark:text-[#bccce1]">Protected via middleware and NextAuth v5 session.</p>
        <div className="text-sm">
          <p>User: {session?.user.email}</p>
          <p>Role: {session?.user.role}</p>
          <p>Storefront ID: {session?.user.storefrontId ?? "Not linked"}</p>
        </div>
      </KCCard>
    </main>
  );
}
