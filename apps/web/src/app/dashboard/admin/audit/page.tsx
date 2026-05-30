import { redirect } from "next/navigation";
import { prisma } from "@kashmir/db";
import { auth } from "@/server/auth";
import { KCCard } from "@kashmir/ui";

export default async function AuditTrailPage(): Promise<JSX.Element> {
  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 200
  });

  return (
    <main className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#3D1F0D] dark:text-[#f3dfbb]">Audit Trail</h1>
        <p className="text-sm text-[#6b5548] dark:text-[#bdcee4]">
          Immutable state-change history for compliance and incident response.
        </p>
      </div>

      <KCCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f2e7d6] dark:bg-[#152841]">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Resource</th>
                <th className="px-3 py-2">IP</th>
                <th className="px-3 py-2">Success</th>
                <th className="px-3 py-2">Error</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-[#e5d8c6] dark:border-[#243a56]">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-3 py-2">{log.userId}</td>
                  <td className="px-3 py-2">{log.action}</td>
                  <td className="px-3 py-2">
                    {log.resourceType}:{log.resourceId}
                  </td>
                  <td className="px-3 py-2">{log.ipAddress}</td>
                  <td className="px-3 py-2">{log.success ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">{log.errorCode ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </KCCard>
    </main>
  );
}
