import { OrbitControls, OrthographicCamera, Text } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import React from 'react';
import { useGameStore } from '../store/useGameStore';

function StationLabel({
  children,
  position,
}: {
  children: string;
  position: [number, number, number];
}) {
  return (
    <Text
      position={position}
      fontSize={0.4}
      color="#f8fafc"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.02}
      outlineColor="#0f172a"
      raycast={() => null}
    >
      {children}
    </Text>
  );
}

function HitBox({
  position,
  size,
  onActivate,
}: {
  position: [number, number, number];
  size: [number, number, number];
  onActivate: () => void;
}) {
  const activate = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onActivate();
  };

  return (
    <mesh position={position} onPointerDown={activate} onClick={activate}>
      <boxGeometry args={size} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

export const IsometricMortuary: React.FC = () => {
  const setActiveStation = useGameStore((s) => s.setActiveStation);

  return (
    <div className="w-full h-full bg-slate-900">
      <Canvas shadows>
        <OrthographicCamera
          makeDefault
          position={[18, 18, 18]}
          zoom={45}
          near={-50}
          far={200}
        />
        <OrbitControls
          enableRotate={true}
          enableZoom={true}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.4}
          minPolarAngle={Math.PI / 6}
          rotateSpeed={0.45}
        />

        <ambientLight intensity={0.65} />
        <directionalLight position={[12, 24, 10]} intensity={1.1} castShadow />

        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[18, 18]} />
          <meshStandardMaterial color="#1e293b" flatShading />
        </mesh>

        {/* Embalming Prep Table */}
        <group position={[-4, 0.75, -3]}>
          <mesh castShadow>
            <boxGeometry args={[3.2, 1.2, 1.6]} />
            <meshStandardMaterial color="#38bdf8" flatShading />
          </mesh>
          <mesh position={[0, 0.75, 0]} castShadow>
            <cylinderGeometry args={[0.35, 0.35, 0.3, 8]} />
            <meshStandardMaterial color="#94a3b8" flatShading />
          </mesh>
          <StationLabel position={[0, 1.6, 0]}>Embalming Table</StationLabel>
          <HitBox
            position={[0, 0.4, 0]}
            size={[4, 2.4, 2.4]}
            onActivate={() => setActiveStation('EMBALMING')}
          />
        </group>

        {/* Brick Cremation Retort */}
        <group position={[4, 1.5, -3]}>
          <mesh castShadow>
            <boxGeometry args={[3.5, 3, 3.5]} />
            <meshStandardMaterial color="#ea580c" flatShading />
          </mesh>
          <mesh position={[0, 0.2, 1.9]} castShadow>
            <boxGeometry args={[1.2, 1.4, 0.2]} />
            <meshStandardMaterial color="#1c1917" flatShading />
          </mesh>
          <mesh position={[0, 2.2, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.55, 1.2, 8]} />
            <meshStandardMaterial color="#78716c" flatShading />
          </mesh>
          <StationLabel position={[0, 3.4, 0]}>Cremation Retort</StationLabel>
          <HitBox
            position={[0, 0.2, 0]}
            size={[4.2, 3.8, 4.2]}
            onActivate={() => setActiveStation('CREMATION')}
          />
        </group>

        {/* Chapel & Showroom */}
        <group position={[0, 0.8, 4]}>
          <mesh castShadow>
            <boxGeometry args={[5, 1.4, 2.5]} />
            <meshStandardMaterial color="#7c3aed" flatShading />
          </mesh>
          <mesh position={[0, 1.2, 0]} castShadow>
            <coneGeometry args={[1.4, 1.2, 4]} />
            <meshStandardMaterial color="#c4b5fd" flatShading />
          </mesh>
          <StationLabel position={[0, 2.4, 0]}>Chapel & Showroom</StationLabel>
          <HitBox
            position={[0, 0.5, 0]}
            size={[5.8, 3.2, 3.2]}
            onActivate={() => setActiveStation('SHOWROOM')}
          />
        </group>
      </Canvas>
    </div>
  );
};
