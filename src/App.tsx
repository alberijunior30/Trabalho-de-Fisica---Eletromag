import { useState } from "react";
import { Header } from "./Components/Header/Header";
import { Participants } from "./Components/Participants/Participants";
import Simulation from "./Components/Simulation/Simulation";
import Controls from "./Components/Controls/Controls";
import Results from "./Components/Results/Results";
import type { Params } from "./physics/lorentz";

// Massa fixa em 1 kg; o usuário varia carga, velocidade e campo
const INITIAL_PARAMS: Params = { q: 1, m: 1, v: 4, B: 1 };

function App() {
  const [params, setParams] = useState<Params>(INITIAL_PARAMS);
  const [running, setRunning] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [resetSignal, setResetSignal] = useState(0);

  return (
    <main className="min-h-screen bg-stone-100 p-4 sm:p-8 text-gray-800">
      <div className="max-w-6xl mx-auto">
        <Header />

        <section className="grid gap-6 lg:grid-cols-[1fr_300px] my-8">
          <div>
            <Simulation
              params={params}
              running={running}
              showVectors={showVectors}
              resetSignal={resetSignal}
            />
            <Results params={params} />
          </div>

          <Controls
            params={params}
            onParamsChange={setParams}
            running={running}
            onToggleRunning={() => setRunning((r) => !r)}
            onReset={() => setResetSignal((n) => n + 1)}
            showVectors={showVectors}
            onToggleVectors={() => setShowVectors((s) => !s)}
          />
        </section>

        <Participants
          participants={[
            "Antonio Alberi de Lima Júnior",
            "João Rafael Uchôa de Brito",
            "Jonatas Queiroz Viana",
            "Luan Silva Cardoso",
            "Vinícius de Almeida Mango Vaz da Silva",
          ]}
        />
      </div>
    </main>
  );
}

export default App;
