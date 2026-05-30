import dynamic from "next/dynamic";

const SmartMap = dynamic(
  () => import("@/components/map/smart-map").then((module) => module.SmartMap),
  { ssr: false }
);

export default function MapPage(): JSX.Element {
  return <SmartMap />;
}
