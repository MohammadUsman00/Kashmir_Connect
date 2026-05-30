import { createHash } from "crypto";
import { prisma } from "@kashmir/db";

export interface AuditLogInput {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  payload: unknown;
  success: boolean;
  errorCode?: string;
}

export function payloadSha256(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload ?? {})).digest("hex");
}

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  const payloadHash = payloadSha256(input.payload);
  const record = {
    id: crypto.randomUUID(),
    userId: input.userId,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    payloadHash,
    timestamp: new Date(),
    success: input.success,
    errorCode: input.errorCode
  };

  await prisma.auditLog.create({
    data: record
  });

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      channel: "audit",
      ...record
    })
  );
}

export async function withAudit<T>(params: {
  input: Omit<AuditLogInput, "success" | "errorCode">;
  operation: () => Promise<T>;
}): Promise<T> {
  try {
    const result = await params.operation();
    await writeAuditLog({
      ...params.input,
      success: true
    });
    return result;
  } catch (error) {
    await writeAuditLog({
      ...params.input,
      success: false,
      errorCode: error instanceof Error ? error.name : "UNKNOWN_ERROR"
    });
    throw error;
  }
}
