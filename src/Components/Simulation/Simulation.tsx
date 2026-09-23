import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Params, ParticleState } from "../../physics/lorentz";
import {
  initialState,
  isOutside,
  lorentzForce,
  step,
  REGION,
} from "../../physics/lorentz";

interface SimulationProps {
  params: Params;
  running: boolean;
  showVectors: boolean;
  resetSignal: number; // muda de valor quando o usuário clica em "Reiniciar"
}

const COLORS = {
  background: 0xf6f7f2,
  grid: 0xd5dbd0,
  field: 0x9aa89c,
  positive: 0xb83227,
  negative: 0x2a5599,
  neutral: 0x777777,
  velocity: 0x1e6b57,
  force: 0xc98200,
  trail: 0x5f6b66,
};

const FIELD_HALF_HEIGHT = 4; // metade da altura das setas de campo (m)
const MAX_TRAIL = 2000; // pontos máximos do rastro
const BASE_SPACING = 4; // espaçamento das linhas de campo (m) quando |B| = 1 T

export default function Simulation({
  params,
  running,
  showVectors,
  resetSignal,
}: SimulationProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // O loop de animação lê estes refs, assim ele não precisa reiniciar
  // toda vez que uma prop muda.
  const paramsRef = useRef(params);
  const runningRef = useRef(running);
  const vectorsRef = useRef(showVectors);
  const stateRef = useRef<ParticleState>(initialState(params));
  const clearTrailRef = useRef(true);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    vectorsRef.current = showVectors;
  }, [showVectors]);

  // Mudou um parâmetro ou clicou em "Reiniciar" → recomeça o círculo
  useEffect(() => {
    paramsRef.current = params;
    stateRef.current = initialState(params);
    clearTrailRef.current = true;
  }, [params, resetSignal]);

  // ---------- Montagem da cena (roda uma vez) ----------
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.background);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 20, 15);
    scene.add(light);

    // Piso com grade de 1 m (tamanho definido por REGION no lorentz.ts)
    const grid = new THREE.GridHelper(
      2 * REGION,
      2 * REGION,
      COLORS.grid,
      COLORS.grid,
    );
    grid.position.y = -FIELD_HALF_HEIGHT;
    scene.add(grid);

    // ---------- Linhas de campo ----------
    // A densidade de linhas é proporcional a |B|,
    // então o espaçamento entre elas é proporcional a 1/√|B|.
    const fieldArrows: THREE.ArrowHelper[] = [];
    let lastFieldB: number | null = null;

    const buildField = (B: number) => {
      for (const arrow of fieldArrows) {
        scene.remove(arrow);
        arrow.dispose();
      }
      fieldArrows.length = 0;
      if (B === 0) return;

      const spacing = Math.min(
        Math.max(BASE_SPACING / Math.sqrt(Math.abs(B)), 1.5),
        12,
      );
      const n = Math.floor((REGION - 1) / spacing);
      const direction = new THREE.Vector3(0, Math.sign(B), 0);
      const startY = B > 0 ? -FIELD_HALF_HEIGHT : FIELD_HALF_HEIGHT;

      for (let i = -n; i <= n; i++) {
        for (let j = -n; j <= n; j++) {
          const arrow = new THREE.ArrowHelper(
            direction,
            new THREE.Vector3(i * spacing, startY, j * spacing),
            2 * FIELD_HALF_HEIGHT,
            COLORS.field,
            0.5,
            0.3,
          );
          scene.add(arrow);
          fieldArrows.push(arrow);
        }
      }
    };

    // Partícula
    const particleMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.positive,
      roughness: 0.4,
    });
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 32, 16),
      particleMaterial,
    );
    scene.add(particle);

    // Rastro (buffer pré-alocado, mais leve que recriar a geometria)
    const trailPositions = new Float32Array(MAX_TRAIL * 3);
    const trailAttribute = new THREE.BufferAttribute(trailPositions, 3);
    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute("position", trailAttribute);
    trailGeometry.setDrawRange(0, 0);
    scene.add(
      new THREE.Line(
        trailGeometry,
        new THREE.LineBasicMaterial({ color: COLORS.trail }),
      ),
    );
    let trailCount = 0;

    // Vetores v e F
    const velocityArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(),
      1,
      COLORS.velocity,
      0.4,
      0.25,
    );
    const forceArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(),
      1,
      COLORS.force,
      0.4,
      0.25,
    );
    scene.add(velocityArrow, forceArrow);

    // ---------- Câmera orbital: arrastar gira, roda do mouse aproxima ----------
    const orbit = {
      theta: 0.6,
      phi: 0.9,
      distance: 45,
      dragging: false,
      lastX: 0,
      lastY: 0,
    };

    const updateCamera = () => {
      camera.position.set(
        orbit.distance * Math.sin(orbit.phi) * Math.sin(orbit.theta),
        orbit.distance * Math.cos(orbit.phi),
        orbit.distance * Math.sin(orbit.phi) * Math.cos(orbit.theta),
      );
      camera.lookAt(0, 0, 0);
    };

    const canvas = renderer.domElement;
    canvas.style.touchAction = "none";

    const onPointerDown = (e: PointerEvent) => {
      orbit.dragging = true;
      orbit.lastX = e.clientX;
      orbit.lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!orbit.dragging) return;
      orbit.theta -= (e.clientX - orbit.lastX) * 0.008;
      orbit.phi = Math.min(
        Math.max(orbit.phi - (e.clientY - orbit.lastY) * 0.008, 0.1),
        Math.PI - 0.1,
      );
      orbit.lastX = e.clientX;
      orbit.lastY = e.clientY;
    };
    const onPointerUp = () => {
      orbit.dragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbit.distance = Math.min(
        Math.max(orbit.distance * (1 + e.deltaY * 0.001), 10),
        120,
      );
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    // ---------- Tamanho responsivo ----------
    const resize = () => {
      const width = mount.clientWidth;
      const height = Math.max(Math.round(width * 0.6), 300);
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    // ---------- Loop de animação ----------
    let frameId = 0;
    let last = performance.now();

    const animate = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const p = paramsRef.current;

      if (clearTrailRef.current) {
        trailCount = 0;
        clearTrailRef.current = false;
      }

      if (runningRef.current) {
        // Subpassos deixam a curva suave mesmo com giro rápido
        const substeps = 10;
        let s = stateRef.current;
        for (let i = 0; i < substeps; i++) s = step(s, p, dt / substeps);

        // Saiu da região (só acontece sem força) → recomeça
        if (isOutside(s, p)) {
          s = initialState(p);
          trailCount = 0;
        }
        stateRef.current = s;

        if (trailCount >= MAX_TRAIL) {
          trailPositions.copyWithin(0, 3);
          trailCount = MAX_TRAIL - 1;
        }
        trailPositions.set([s.pos.x, s.pos.y, s.pos.z], trailCount * 3);
        trailCount++;
      }
      trailGeometry.setDrawRange(0, trailCount);
      trailAttribute.needsUpdate = true;

      const s = stateRef.current;
      particle.position.set(s.pos.x, s.pos.y, s.pos.z);
      particleMaterial.color.setHex(
        p.q > 0 ? COLORS.positive : p.q < 0 ? COLORS.negative : COLORS.neutral,
      );

      // Reconstrói as linhas de campo só quando o valor de B muda
      if (p.B !== lastFieldB) {
        buildField(p.B);
        lastFieldB = p.B;
      }

      // Vetores
      const vel = new THREE.Vector3(s.vel.x, s.vel.y, s.vel.z);
      const f = lorentzForce(p, s);
      const force = new THREE.Vector3(f.x, f.y, f.z);

      velocityArrow.visible = vectorsRef.current && vel.length() > 1e-3;
      forceArrow.visible = vectorsRef.current && force.length() > 1e-3;

      if (velocityArrow.visible) {
        velocityArrow.position.copy(particle.position);
        velocityArrow.setDirection(vel.clone().normalize());
        velocityArrow.setLength(vel.length() * 0.6, 0.4, 0.25);
      }
      if (forceArrow.visible) {
        forceArrow.position.copy(particle.position);
        forceArrow.setDirection(force.clone().normalize());
        forceArrow.setLength(Math.min(force.length() * 0.35, 5), 0.4, 0.25);
      }

      updateCamera();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    // ---------- Limpeza ao desmontar ----------
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      for (const arrow of fieldArrows) arrow.dispose();
      renderer.dispose();
      mount.removeChild(canvas);
    };
  }, []);

  return (
    <div>
      <div
        ref={mountRef}
        className="w-full rounded-lg overflow-hidden border border-gray-300 cursor-grab active:cursor-grabbing"
      />
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs mt-2 text-gray-600">
        <span>
          <span className="text-emerald-800">━</span> velocidade v
        </span>
        <span>
          <span className="text-amber-600">━</span> força magnética F
        </span>
        <span>
          <span className="text-gray-400">━</span> linhas de campo B (mais
          juntas = campo mais forte)
        </span>
        <span>Arraste para girar · roda do mouse para aproximar</span>
      </div>
    </div>
  );
}
