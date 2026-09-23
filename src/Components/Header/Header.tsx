export function Header(){
    return (
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif mb-1">
          Simulação 3D de uma carga num campo magnético uniforme
        </h1>
        <p className="text-sm opacity-75 mb-6 max-w-2xl">
          Este trabalho simula o movimento circular de uma partícula carregada
          em um campo magnético uniforme, com base na força de Lorentz (F = q v
          × B). A velocidade da partícula é sempre perpendicular ao campo
          (ângulo de 90°), por isso a força magnética atua como força centrípeta
          e a trajetória é uma circunferência. É possível variar a carga, a
          velocidade e a intensidade do campo para observar como esses
          parâmetros determinam o raio (r = mv / |q|B) e o período do movimento.
        </p>
      </div>
    );
}