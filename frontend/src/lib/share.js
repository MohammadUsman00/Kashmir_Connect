export async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}

export function whatsappShareUrl(text, phoneDigits) {
  const encoded = encodeURIComponent(text);
  if (phoneDigits) {
    return `https://wa.me/${phoneDigits}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export function buildStorefrontShareText(businessName, url) {
  return `Check out ${businessName} on KashmirConnect: ${url}`;
}

export function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
