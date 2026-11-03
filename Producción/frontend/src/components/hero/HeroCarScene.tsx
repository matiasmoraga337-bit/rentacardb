import { ContactShadows, OrbitControls, RoundedBox } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { Group } from 'three';
import { cn } from '@/lib/utils';

type HeroCarVariant = 'catalogo' | 'auth' | 'dashboard';

interface HeroCarSceneProps {
  reducedMotion: boolean;
  variant: HeroCarVariant;
}

const BODY = '#2dd4bf';
const BODY_LIGHT = '#7de8d5';
const BODY_DARK = '#0f766e';
const GLASS = '#0b4f49';
const TIRE = '#07110e';
const RIM = '#d5fff5';
const LIGHT = '#ffd67a';
const TAILLIGHT = '#ff8a5c';

function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.42, z]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.4, 0.4, 0.28, 32]} />
        <meshStandardMaterial color={TIRE} roughness={0.92} metalness={0.02} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.22, 0.22, 0.3, 32]} />
        <meshStandardMaterial color={RIM} roughness={0.26} metalness={0.18} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.09, 0.09, 0.31, 24]} />
        <meshStandardMaterial color={BODY_DARK} roughness={0.4} />
      </mesh>
    </group>
  );
}

function CarModel({ animate }: { animate: boolean }) {
  const group = useRef<Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    group.current.position.y = animate ? Math.sin(state.clock.elapsedTime * 0.75) * 0.035 : 0;
  });

  return (
    <group ref={group} position={[0, 0.06, 0]}>
      <RoundedBox args={[4.2, 0.72, 1.8]} radius={0.26} smoothness={5} position={[0, 0.62, 0]}>
        <meshStandardMaterial color={BODY} roughness={0.58} metalness={0.05} />
      </RoundedBox>

      <RoundedBox args={[2.45, 0.9, 1.58]} radius={0.28} smoothness={5} position={[-0.15, 1.14, 0]}>
        <meshStandardMaterial color={BODY_LIGHT} roughness={0.54} metalness={0.04} />
      </RoundedBox>

      <RoundedBox args={[1.95, 0.18, 1.44]} radius={0.01} smoothness={4} position={[-0.18, 1.6, 0]}>
        <meshStandardMaterial color={BODY} roughness={0.5} metalness={0.05} />
      </RoundedBox>

      <RoundedBox args={[1.35, 0.3, 1.62]} radius={0.12} smoothness={5} position={[1.45, 0.91, 0]}>
        <meshStandardMaterial color={BODY_LIGHT} roughness={0.52} metalness={0.04} />
      </RoundedBox>

      <RoundedBox
        args={[0.5, 0.12, 1.4]}
        radius={0.04}
        position={[-1.48, 1.03, 0]}
        rotation={[0, 0, 0.12]}
      >
        <meshStandardMaterial color={BODY_LIGHT} roughness={0.52} metalness={0.04} />
      </RoundedBox>

      <RoundedBox args={[0.3, 0.38, 1.7]} radius={0.12} position={[2.15, 0.57, 0]}>
        <meshStandardMaterial color={BODY_DARK} roughness={0.62} metalness={0.08} />
      </RoundedBox>
      <RoundedBox args={[0.3, 0.38, 1.7]} radius={0.12} position={[-2.15, 0.57, 0]}>
        <meshStandardMaterial color={BODY_DARK} roughness={0.62} metalness={0.08} />
      </RoundedBox>

      <RoundedBox args={[0.08, 0.22, 0.8]} radius={0.02} position={[2.31, 0.57, 0]}>
        <meshStandardMaterial color="#062f2a" roughness={0.75} />
      </RoundedBox>

      {[-1, 1].map((side) => (
        <group key={side}>
          <RoundedBox
            args={[1.05, 0.43, 0.035]}
            radius={0.01}
            smoothness={4}
            position={[0.25, 1.35, side * 0.805]}
          >
            <meshStandardMaterial
              color={GLASS}
              roughness={0.12}
              metalness={0.25}
              transparent
              opacity={0.82}
            />
          </RoundedBox>
          <RoundedBox
            args={[0.78, 0.4, 0.035]}
            radius={0.01}
            smoothness={4}
            position={[-0.68, 1.34, side * 0.805]}
          >
            <meshStandardMaterial
              color={GLASS}
              roughness={0.12}
              metalness={0.25}
              transparent
              opacity={0.82}
            />
          </RoundedBox>
          <RoundedBox
            args={[0.07, 0.52, 0.05]}
            radius={0.02}
            position={[-0.25, 1.34, side * 0.81]}
          >
            <meshStandardMaterial color={BODY_DARK} roughness={0.5} />
          </RoundedBox>
          <RoundedBox
            args={[0.24, 0.12, 0.12]}
            radius={0.05}
            position={[0.72, 1.22, side * 0.88]}
          >
            <meshStandardMaterial color={BODY} roughness={0.55} />
          </RoundedBox>
        </group>
      ))}

      <RoundedBox
        args={[0.06, 0.62, 1.42]}
        radius={0.02}
        position={[0.99, 1.33, 0]}
        rotation={[0, 0, -0.55]}
      >
        <meshStandardMaterial
          color={GLASS}
          roughness={0.1}
          metalness={0.2}
          transparent
          opacity={0.78}
        />
      </RoundedBox>
      <RoundedBox
        args={[0.06, 0.58, 1.42]}
        radius={0.02}
        position={[-1.33, 1.32, 0]}
        rotation={[0, 0, 0.5]}
      >
        <meshStandardMaterial
          color={GLASS}
          roughness={0.1}
          metalness={0.2}
          transparent
          opacity={0.78}
        />
      </RoundedBox>

      {[-1, 1].map((side) => (
        <RoundedBox
          key={`light-${side}`}
          args={[0.07, 0.16, 0.3]}
          radius={0.02}
          position={[2.29, 0.73, side * 0.53]}
        >
          <meshStandardMaterial
            color={LIGHT}
            emissive={LIGHT}
            emissiveIntensity={1.1}
            roughness={0.24}
          />
        </RoundedBox>
      ))}
      {[-1, 1].map((side) => (
        <RoundedBox
          key={`tail-${side}`}
          args={[0.07, 0.14, 0.28]}
          radius={0.02}
          position={[-2.29, 0.73, side * 0.53]}
        >
          <meshStandardMaterial
            color={TAILLIGHT}
            emissive={TAILLIGHT}
            emissiveIntensity={0.75}
            roughness={0.3}
          />
        </RoundedBox>
      ))}

      <Wheel x={-1.45} z={0.94} />
      <Wheel x={1.45} z={0.94} />
      <Wheel x={-1.45} z={-0.94} />
      <Wheel x={1.45} z={-0.94} />
    </group>
  );
}

function Scene({ animate, autoRotate }: { animate: boolean; autoRotate: boolean }) {
  return (
    <>
      <hemisphereLight args={['#d5fff8', '#042f2e', 1.15]} />
      <directionalLight position={[4, 6, 4]} intensity={2.2} color="#f0fffb" />
      <pointLight position={[-4, 2.2, -3]} intensity={1.4} color="#2dd4bf" />
      <pointLight position={[3.5, 2, -2]} intensity={0.9} color="#f6c76a" />

      <CarModel animate={animate} />
      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.42}
        scale={7}
        blur={2.4}
        far={4}
        color="#042f2e"
      />
      <OrbitControls
        target={[0, 0.85, 0]}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        autoRotate={autoRotate}
        autoRotateSpeed={0.85}
        minPolarAngle={0.85}
        maxPolarAngle={1.45}
      />
    </>
  );
}

export default function HeroCarScene({ reducedMotion, variant }: HeroCarSceneProps) {
  const container = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [documentVisible, setDocumentVisible] = useState(true);

  useEffect(() => {
    const element = container.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onChange = (): void => setDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  const active = inView && documentVisible;

  return (
    <div
      ref={container}
      className={cn('relative h-full w-full', variant === 'dashboard' && 'opacity-90')}
      role="group"
      aria-label="Vehículo 3D interactivo"
    >
      <Canvas
        aria-hidden="true"
        camera={{ position: [5.2, 2.4, 5.6], fov: 32 }}
        dpr={[1, 1.5]}
        frameloop={active ? 'always' : 'never'}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <Scene animate={!reducedMotion} autoRotate={!reducedMotion} />
      </Canvas>
    </div>
  );
}
