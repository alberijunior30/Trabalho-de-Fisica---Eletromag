// Física do movimento circular de uma carga num campo magnético uniforme.
// Não depende de React nem de three.js.
//
// Convenções:
//   - B aponta no eixo y (vertical): B = (0, B, 0)
//   - a velocidade fica no plano horizontal (xz), sempre a 90° de B
//   - unidades SI com valores didáticos (C, kg, m/s, T)

export interface Params {
  q: number; // carga (C)
  m: number; // massa (kg)
  v: number; // módulo da velocidade (m/s)
  B: number; // campo magnético (T); positivo = para cima
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ParticleState {
  pos: Vec3;
  vel: Vec3;
}

// Metade do tamanho da região visível (m)
export const REGION = 50;

export function hasCircularMotion(p: Params): boolean {
  return p.q !== 0 && p.B !== 0;
}

// ---------- Fórmulas analíticas ----------

// r = mv / |q|B
export function radius(p: Params): number {
  return hasCircularMotion(p) ? (p.m * p.v) / Math.abs(p.q * p.B) : Infinity;
}

// ω = |q|B / m
export function angularVelocity(p: Params): number {
  return hasCircularMotion(p) ? Math.abs(p.q * p.B) / p.m : 0;
}

// T = 2πm / |q|B
export function period(p: Params): number {
  const w = angularVelocity(p);
  return w > 0 ? (2 * Math.PI) / w : Infinity;
}

// |F| = |q|·v·|B| (sen 90° = 1)
export function forceMagnitude(p: Params): number {
  return Math.abs(p.q) * p.v * Math.abs(p.B);
}

// Sentido de giro visto de cima
export function rotationSense(p: Params): string {
  if (!hasCircularMotion(p)) return "sem giro";
  return p.q * p.B > 0 ? "horário" : "anti-horário";
}

// ---------- Simulação ----------

// F = q v × B, com B = (0, B, 0)  →  v × B = (−vz·B, 0, vx·B)
export function lorentzForce(p: Params, s: ParticleState): Vec3 {
  return {
    x: -p.q * s.vel.z * p.B,
    y: 0,
    z: p.q * s.vel.x * p.B,
  };
}

// Posiciona a carga para que o centro do círculo fique na origem
export function initialState(p: Params): ParticleState {
  if (!hasCircularMotion(p)) {
    // Sem força: anda em linha reta atravessando a região
    return { pos: { x: -REGION, y: 0, z: 0 }, vel: { x: p.v, y: 0, z: 0 } };
  }
  // Com v = (v, 0, 0), a força aponta para sinal(qB)·ẑ, ou seja, para o centro.
  // Então a carga começa em −r na direção da força.
  const r = radius(p);
  return {
    pos: { x: 0, y: 0, z: -r * Math.sign(p.q * p.B) },
    vel: { x: p.v, y: 0, z: 0 },
  };
}

// Avança dt segundos.
// O campo só gira a velocidade (|v| constante), então giramos v em torno de y
// pelo ângulo exato φ = −(qB/m)·dt. Isso evita que o círculo "espirale".
export function step(s: ParticleState, p: Params, dt: number): ParticleState {
  let { x: vx, z: vz } = s.vel;

  if (hasCircularMotion(p)) {
    const phi = -((p.q * p.B) / p.m) * dt;
    const c = Math.cos(phi);
    const sn = Math.sin(phi);
    vx = s.vel.x * c + s.vel.z * sn;
    vz = -s.vel.x * sn + s.vel.z * c;
  }

  return {
    // média das velocidades antes/depois: mantém a órbita fechada
    pos: {
      x: s.pos.x + ((s.vel.x + vx) / 2) * dt,
      y: s.pos.y,
      z: s.pos.z + ((s.vel.z + vz) / 2) * dt,
    },
    vel: { x: vx, y: 0, z: vz },
  };
}

export function isOutside(s: ParticleState, p: Params): boolean {
  // Com movimento circular a carga sempre volta, então nunca "sai"
  if (hasCircularMotion(p)) return false;
  return Math.abs(s.pos.x) > REGION + 2 || Math.abs(s.pos.z) > REGION + 2;
}