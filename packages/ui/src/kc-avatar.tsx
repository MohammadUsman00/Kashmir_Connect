import { cn } from "./utils";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "KC";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function KCAvatar({
  name,
  imageUrl,
  online = false,
  className
}: {
  name: string;
  imageUrl?: string;
  online?: boolean;
  className?: string;
}): JSX.Element {
  return (
    <div className={cn("relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3D1F0D] text-sm font-semibold text-[#FAF6EF] dark:bg-[#C8972A] dark:text-[#1a1208]", className)}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        initialsFromName(name)
      )}
      {online ? <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-[#0d1727]" /> : null}
    </div>
  );
}
