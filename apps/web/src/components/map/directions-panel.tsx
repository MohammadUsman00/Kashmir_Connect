import { KCCard, KCButton } from "@kashmir/ui";

type RouteSummary = {
  distanceKm: number;
  durationMin: number;
  profile: "fastest" | "scenic";
  steps: string[];
};

export function DirectionsPanel({
  routes,
  selected,
  onSelect
}: {
  routes: RouteSummary[];
  selected: "fastest" | "scenic";
  onSelect: (profile: "fastest" | "scenic") => void;
}): JSX.Element | null {
  if (routes.length === 0) return null;
  const route = routes.find((r) => r.profile === selected) ?? routes[0];

  return (
    <KCCard className="absolute right-4 top-4 z-20 w-[320px] space-y-3 bg-white/95 dark:bg-[#0d1728]/95">
      <h3 className="text-sm font-semibold text-[#3D1F0D] dark:text-[#f3dfbb]">Route planner</h3>
      <div className="flex gap-2">
        <KCButton size="sm" variant={selected === "fastest" ? "primary" : "ghost"} onClick={() => onSelect("fastest")}>
          Fastest
        </KCButton>
        <KCButton size="sm" variant={selected === "scenic" ? "secondary" : "ghost"} onClick={() => onSelect("scenic")}>
          Scenic
        </KCButton>
      </div>
      <p className="text-sm text-[#624e40] dark:text-[#c5d3e7]">
        {route.distanceKm.toFixed(1)} km · {Math.round(route.durationMin)} mins
      </p>
      <div className="max-h-44 space-y-1 overflow-y-auto pr-1 text-xs text-[#5a4639] dark:text-[#c1cfe4]">
        {route.steps.map((step, index) => (
          <p key={step + index}>• {step}</p>
        ))}
      </div>
    </KCCard>
  );
}
