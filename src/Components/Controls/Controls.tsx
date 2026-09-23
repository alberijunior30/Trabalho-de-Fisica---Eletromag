import type { Params } from "../../physics/lorentz";

interface SliderProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  hint?: string;
}

function Slider({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
  hint,
}: SliderProps) {
  return (
    <label className="block mb-5">
      <div className="flex justify-between items-baseline text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums">
          {value.toFixed(1)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full mt-1 accent-emerald-800"
      />
      {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
    </label>
  );
}

interface ControlsProps {
  params: Params;
  onParamsChange: (params: Params) => void;
  running: boolean;
  onToggleRunning: () => void;
  onReset: () => void;
  showVectors: boolean;
  onToggleVectors: () => void;
}

export default function Controls({
  params,
  onParamsChange,
  running,
  onToggleRunning,
  onReset,
  showVectors,
  onToggleVectors,
}: ControlsProps) {
  // Cria um handler para cada parâmetro: update("q") devolve (valor) => ...
  const update = (key: keyof Params) => (value: number) =>
    onParamsChange({ ...params, [key]: value });

  return (
    <aside className="bg-white rounded-lg p-5 self-start border border-gray-200">
      <Slider
        label="Carga q"
        unit="C"
        value={params.q}
        min={-3}
        max={3}
        step={0.5}
        onChange={update("q")}
        hint="Troque o sinal e veja o sentido de giro inverter"
      />
      <Slider
        label="Velocidade v"
        unit="m/s"
        value={params.v}
        min={1}
        max={8}
        step={0.5}
        onChange={update("v")}
      />
      <Slider
        label="Campo B"
        unit="T"
        value={params.B}
        min={-2}
        max={2}
        step={0.1}
        onChange={update("B")}
        hint="Positivo: para cima. Negativo: para baixo."
      />

      <label className="flex items-center gap-2 text-sm mb-5">
        <input
          type="checkbox"
          checked={showVectors}
          onChange={onToggleVectors}
          className="accent-emerald-800"
        />
        Mostrar vetores
      </label>

      <div className="flex gap-2">
        <button
          onClick={onToggleRunning}
          className="flex-1 rounded-md py-2 text-sm text-white bg-emerald-800 hover:bg-emerald-900"
        >
          {running ? "Pausar" : "Continuar"}
        </button>
        <button
          onClick={onReset}
          className="flex-1 rounded-md py-2 text-sm border border-emerald-800 text-emerald-800 hover:bg-emerald-50"
        >
          Reiniciar
        </button>
      </div>
    </aside>
  );
}
