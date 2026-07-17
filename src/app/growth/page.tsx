import { auth } from "@/auth";
import { listGrowthMeasurements } from "@/db/queries";
import { GrowthForm } from "./GrowthForm";
import { GrowthChart } from "./GrowthChart";

export default async function GrowthPage() {
  const session = await auth();
  const measurements = await listGrowthMeasurements(session!.user!.familyId);

  const heightPoints = measurements
    .filter((m) => m.heightCm != null)
    .map((m) => ({ date: m.measuredAt, value: Number(m.heightCm) }));
  const weightPoints = measurements
    .filter((m) => m.weightKg != null)
    .map((m) => ({ date: m.measuredAt, value: Number(m.weightKg) }));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <header className="pt-4">
        <h1 className="font-heading text-2xl font-bold text-emerald-700 dark:text-emerald-300">📈 Growth</h1>
      </header>
      <GrowthForm measurements={measurements} />
      <GrowthChart label="Height" unit="cm" points={heightPoints} />
      <GrowthChart label="Weight" unit="kg" points={weightPoints} />
    </div>
  );
}
