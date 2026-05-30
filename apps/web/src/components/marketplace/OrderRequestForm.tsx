"use client";

import * as React from "react";
import { KCButton, KCCard } from "@kashmir/ui";
import { trpcClient } from "@/lib/trpc-client";

export function OrderRequestForm({
  storefrontName,
  storefrontId,
  whatsapp
}: {
  storefrontName: string;
  storefrontId: string;
  whatsapp: string | null;
}): JSX.Element {
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      await trpcClient.order.create.mutate({
        storefrontId,
        customerName: name,
        customerPhone: phone,
        customerEmail: undefined,
        items: [{ qty: 1 }]
      });

      if (whatsapp) {
        const wa = `https://wa.me/${whatsapp.replace(/[^\d+]/g, "").replace("+", "")}?text=${encodeURIComponent(
          `Hi ${storefrontName}, I am ${name}. ${message} My phone: ${phone}`
        )}`;
        window.open(wa, "_blank", "noopener,noreferrer");
      }
      setStatus("Request sent. Merchant has been notified.");
      setName("");
      setPhone("");
      setMessage("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KCCard className="space-y-3">
      <h3 className="text-lg font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">Order request</h3>
      <form className="space-y-2" onSubmit={submit}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          placeholder="Your name"
          className="h-10 w-full rounded-lg border border-[#dfd1bc] bg-white px-3 text-sm dark:border-[#2b4261] dark:bg-[#111f34]"
        />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
          placeholder="Phone / WhatsApp"
          className="h-10 w-full rounded-lg border border-[#dfd1bc] bg-white px-3 text-sm dark:border-[#2b4261] dark:bg-[#111f34]"
        />
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          placeholder="What do you want to order?"
          className="w-full rounded-lg border border-[#dfd1bc] bg-white px-3 py-2 text-sm dark:border-[#2b4261] dark:bg-[#111f34]"
        />
        <KCButton type="submit" loading={submitting}>
          Submit Request
        </KCButton>
      </form>
      {status ? <p className="text-sm text-[#22603f] dark:text-[#7ad0a8]">{status}</p> : null}
    </KCCard>
  );
}
