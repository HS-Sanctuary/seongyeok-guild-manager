import { notFound } from "next/navigation";
import CompanionPreview from "./CompanionPreview";

// Local design study only. Never expose the simulated connector as a live feature.
export default function Page() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <CompanionPreview />;
}
