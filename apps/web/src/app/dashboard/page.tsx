import { auth } from "@/server/auth";
import { Card, CardDescription, CardTitle } from "@kashmir/ui";

export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await auth();

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Card className="space-y-3">
        <CardTitle>Merchant Dashboard</CardTitle>
        <CardDescription>Protected via middleware and NextAuth v5 session.</CardDescription>
        <div className="text-sm">
          <p>User: {session?.user.email}</p>
          <p>Role: {session?.user.role}</p>
          <p>Storefront ID: {session?.user.storefrontId ?? "Not linked"}</p>
        </div>
      </Card>
    </main>
  );
}
