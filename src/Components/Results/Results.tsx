import type { Params } from "../../physics/lorentz";
import {
  angularVelocity,
  forceMagnitude,
  period,
  radius,
  rotationSense,
  REGION,
} from "../../physics/lorentz";

interface ResultsProps {
  params: Params;
}

const format = (n: number, digits = 2) =>
  Number.isFinite(n) ? n.toFixed(digits) : "∞";

export default function Results({ params }: ResultsProps) {
  const r = radius(params);

  const items = [
    { label: "Raio r = mv/|q|B", value: `${format(r)} m` },
    { label: "Período T = 2πm/|q|B", value: `${format(period(params))} s` },
    { label: "ω = |q|B/m", value: `${format(angularVelocity(params))} rad/s` },
    { label: "|F| = |q|vB", value: `${format(forceMagnitude(params))} N` },
    { label: "Sentido (visto de cima)", value: rotationSense(params) },
  ];

  return (
    <section className="mt-5">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-md px-3 py-2 border border-gray-200"
          >
            <div className="text-xs text-gray-500">{item.label}</div>
            <div className="text-lg tabular-nums">{item.value}</div>
          </div>
        ))}
      </div>

      {Number.isFinite(r) && r > REGION - 1 && (
        <p className="text-sm mt-3 text-red-700">
          O raio ({format(r)} m) é maior que a área visível. Aumente |q| ou |B|,
          ou diminua v.
        </p>
      )}
    </section>
  );
}
