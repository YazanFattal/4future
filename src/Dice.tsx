import {
  Component,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { Euler, Group, Quaternion } from "three";
import { FACE_ROTATIONS, PIPS } from "./dice-math";
import type { Face } from "./engine";

const layouts: {
  face: Face;
  position: [number, number, number];
  rotation: [number, number, number];
}[] = [
  { face: 1, position: [0, 0, 0.761], rotation: [0, 0, 0] },
  { face: 2, position: [0.761, 0, 0], rotation: [0, Math.PI / 2, 0] },
  { face: 3, position: [0, 0.761, 0], rotation: [-Math.PI / 2, 0, 0] },
  { face: 4, position: [0, -0.761, 0], rotation: [Math.PI / 2, 0, 0] },
  { face: 5, position: [-0.761, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  { face: 6, position: [0, 0, -0.761], rotation: [0, Math.PI, 0] },
];
function Cube({ result, rolling, reduced, home, onLanded }: DiceProps) {
  const group = useRef<Group>(null);
  const elapsed = useRef(0);
  const wasRolling = useRef(false);
  const completed = useRef(false);
  const start = useRef(new Quaternion());
  const landing = useRef(new Quaternion());
  const tumble = useRef(new Quaternion());
  const euler = useRef(new Euler());
  const callback = useRef(onLanded);
  useEffect(() => {
    callback.current = onLanded;
  }, [onLanded]);
  useFrame((state, delta) => {
    const cube = group.current;
    if (!cube) return;
    if (rolling && !wasRolling.current) {
      elapsed.current = 0;
      completed.current = false;
      start.current.copy(cube.quaternion);
      landing.current.setFromEuler(new Euler(...FACE_ROTATIONS[result]));
    }
    wasRolling.current = !!rolling;
    if (rolling) {
      elapsed.current += Math.min(delta, 0.05);
      const duration = reduced ? 0.15 : 2.4,
        p = Math.min(elapsed.current / duration, 1);
      if (reduced) cube.quaternion.copy(landing.current);
      else if (p < 0.72) {
        const t = p / 0.72;
        tumble.current.setFromEuler(
          euler.current.set(t * Math.PI * 7, t * Math.PI * 9, t * Math.PI * 3),
        );
        cube.quaternion.copy(start.current).multiply(tumble.current);
      } else {
        const t = (p - 0.72) / 0.28,
          smooth = 1 - Math.pow(1 - t, 3);
        tumble.current.setFromEuler(
          euler.current.set(Math.PI * 7, Math.PI * 9, Math.PI * 3),
        );
        cube.quaternion
          .copy(start.current)
          .multiply(tumble.current)
          .slerp(landing.current, smooth);
      }
      cube.position.y = reduced
        ? 0
        : Math.sin(p * Math.PI) * 0.45 +
          (p > 0.84 ? Math.sin(((p - 0.84) / 0.16) * Math.PI * 2) * 0.035 : 0);
      if (p === 1 && !completed.current) {
        completed.current = true;
        cube.quaternion.copy(landing.current);
        cube.position.y = 0;
        callback.current?.();
      }
    } else if (home) {
      cube.rotation.set(
        0.4 + (reduced ? 0 : Math.sin(state.clock.elapsedTime * 0.38) * 0.08),
        0.65 +
          Math.PI / 2 +
          (reduced ? 0 : Math.sin(state.clock.elapsedTime * 0.28) * 0.12),
        -0.16,
      );
      cube.position.y = reduced
        ? 0
        : Math.sin(state.clock.elapsedTime * 0.65) * 0.075;
    } else {
      cube.quaternion.slerp(
        landing.current.setFromEuler(
          euler.current.set(...FACE_ROTATIONS[result]),
        ),
        reduced ? 1 : 0.12,
      );
      cube.position.y = 0;
    }
  });
  return (
    <group ref={group}>
      <RoundedBox args={[1.52, 1.52, 1.52]} radius={0.19} smoothness={6}>
        <meshPhysicalMaterial
          color="#d8dcdb"
          metalness={0.57}
          roughness={0.23}
          clearcoat={0.8}
          clearcoatRoughness={0.22}
        />
      </RoundedBox>
      {layouts.map(({ face, position, rotation }) => (
        <group key={face} position={position} rotation={rotation}>
          {PIPS[face].map(([x, y], i) => (
            <group key={i} position={[x * 0.36, y * 0.36, 0]}>
              <mesh position={[0, 0, 0.001]}>
                <circleGeometry args={[0.122, 40]} />
                <meshStandardMaterial
                  color="#717674"
                  metalness={0.8}
                  roughness={0.3}
                />
              </mesh>
              <mesh position={[0, 0, 0.003]}>
                <circleGeometry args={[0.108, 40]} />
                <meshStandardMaterial
                  color="#090c0b"
                  roughness={0.55}
                  metalness={0.15}
                />
              </mesh>
              <mesh position={[0.005, -0.009, 0.004]}>
                <ringGeometry args={[0.088, 0.096, 40, 1, Math.PI, Math.PI]} />
                <meshBasicMaterial color="#343a35" />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}
type DiceProps = {
  result: Face;
  rolling?: boolean;
  reduced?: boolean;
  home?: boolean;
  onLanded?: () => void;
};
function FallbackDice({ result, rolling, reduced, onLanded }: DiceProps) {
  useEffect(() => {
    if (rolling) {
      const timer = setTimeout(() => onLanded?.(), reduced ? 150 : 1800);
      return () => clearTimeout(timer);
    }
  }, [rolling, reduced, onLanded]);
  return (
    <div
      className={`fallback-dice ${rolling ? "is-rolling" : ""}`}
      aria-hidden="true"
    >
      {PIPS[result].map(([x, y], i) => (
        <i
          key={i}
          style={{ left: `${50 + x * 28}%`, top: `${50 - y * 28}%` }}
        />
      ))}
    </div>
  );
}
class DiceBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export default function Dice(props: DiceProps) {
  const [available] = useState(() => {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2");
      if (gl) {
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });
  const fallback = <FallbackDice {...props} />;
  return (
    <div
      className="dice-canvas"
      role="img"
      aria-label={
        props.rolling
          ? "Dice rolling"
          : props.home
            ? "Floating silver six-sided destiny dice"
            : `Dice showing ${props.result}`
      }
    >
      {available ? (
        <DiceBoundary fallback={fallback}>
          <Suspense fallback={fallback}>
            <Canvas
              camera={{ position: [0, 0, 5.4], fov: 34 }}
              dpr={[1, 1.7]}
              gl={{ antialias: true, alpha: true }}
            >
              <ambientLight intensity={0.65} />
              <directionalLight
                position={[3, 5, 4]}
                intensity={3.1}
                color="#f4fff0"
              />
              <pointLight
                position={[-4, 1, 2]}
                intensity={28}
                color="#cbd0e6"
              />
              <Environment resolution={128}>
                <Lightformer
                  intensity={3}
                  position={[0, 5, -3]}
                  scale={[8, 3, 1]}
                />
                <Lightformer
                  intensity={2}
                  position={[-4, 0, 2]}
                  rotation={[0, Math.PI / 2, 0]}
                  scale={[4, 6, 1]}
                />
                <Lightformer
                  intensity={1}
                  position={[4, -2, 1]}
                  rotation={[0, -Math.PI / 2, 0]}
                  scale={[3, 5, 1]}
                />
              </Environment>
              <Cube {...props} />
            </Canvas>
          </Suspense>
        </DiceBoundary>
      ) : (
        fallback
      )}
    </div>
  );
}
