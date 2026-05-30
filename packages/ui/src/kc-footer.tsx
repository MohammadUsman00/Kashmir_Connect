import { KCBadge } from "./kc-badge";

const districts = [
  "Srinagar",
  "Gulmarg",
  "Pahalgam",
  "Anantnag",
  "Baramulla",
  "Kupwara",
  "Pulwama",
  "Shopian"
];

export function KCFooter(): JSX.Element {
  return (
    <footer className="border-t border-[#e7d8c4] bg-[#f8f1e7] py-12 dark:border-[#1f3048] dark:bg-[#0d1727]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-3">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#3D1F0D] dark:text-[#f9e5be]">Kashmir Connect</h3>
          <p className="text-sm text-[#604b3d] dark:text-[#c7d3e6]">
            Building digital trust, commerce, and community for every district in Kashmir.
          </p>
          <p className="ur-text text-right text-sm text-[#1B6CA8] dark:text-[#9aceef]">
            کشمیر کے کاروبار، ایک مضبوط ڈیجیٹل مستقبل
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-[#3D1F0D] dark:text-[#f9e5be]">District Links</h4>
          <div className="flex flex-wrap gap-2">
            {districts.map((district) => (
              <KCBadge key={district} variant="sector">
                {district}
              </KCBadge>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-[#3D1F0D] dark:text-[#f9e5be]">Contact</h4>
          <p className="text-sm text-[#604b3d] dark:text-[#c7d3e6]">hello@kashmirconnect.in</p>
          <p className="text-sm text-[#604b3d] dark:text-[#c7d3e6]">Dal Gate, Srinagar, Jammu & Kashmir</p>
        </div>
      </div>
    </footer>
  );
}
