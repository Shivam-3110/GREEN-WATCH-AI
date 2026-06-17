import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Building component
export function Building({ position, height, color, pollution }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime + position[0]) * 0.02 * pollution;
    }
  });

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      <boxGeometry args={[1, height, 1]} />
      <meshStandardMaterial
        color={color}
        metalness={0.3}
        roughness={0.7}
        emissive={color}
        emissiveIntensity={pollution * 0.1}
      />
    </mesh>
  );
}

// Tree component
export function Tree({ position, scale = 1 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5 * scale, 0]} castShadow>
        <cylinderGeometry args={[0.1 * scale, 0.15 * scale, 1 * scale, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0, 1.5 * scale, 0]} castShadow>
        <coneGeometry args={[0.5 * scale, 1.5 * scale, 8]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
    </group>
  );
}

// Road component
export function Road({ start, end, width = 0.5 }) {
  const length = Math.sqrt(
    Math.pow(end[0] - start[0], 2) + Math.pow(end[2] - start[2], 2)
  );
  const angle = Math.atan2(end[2] - start[2], end[0] - start[0]);
  const midPoint = [
    (start[0] + end[0]) / 2,
    0.01,
    (start[2] + end[2]) / 2,
  ];

  return (
    <mesh position={midPoint} rotation={[0, angle, 0]} receiveShadow>
      <boxGeometry args={[length, 0.05, width]} />
      <meshStandardMaterial color="#444444" roughness={0.9} />
    </mesh>
  );
}

// Car component
export function Car({ position, color, speed }) {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.x += speed * 0.02;
      if (meshRef.current.position.x > 15) {
        meshRef.current.position.x = -15;
      }
    }
  });

  return (
    <mesh ref={meshRef} position={position} castShadow>
      <boxGeometry args={[0.4, 0.3, 0.2]} />
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
    </mesh>
  );
}

// Pollution particle system
export function PollutionParticles({ count, intensity, bounds }) {
  const particlesRef = useRef();

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * bounds;
    positions[i * 3 + 1] = Math.random() * 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * bounds;

    const color = new THREE.Color();
    color.setHSL(0.1 - intensity * 0.1, 0.8, 0.5);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  useFrame(() => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += 0.01 * intensity;
        if (positions[i * 3 + 1] > 8) {
          positions[i * 3 + 1] = 0;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      particlesRef.current.rotation.y += 0.001;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Heat haze effect
export function HeatHaze({ position, intensity }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1 * intensity;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <cylinderGeometry args={[2, 2.5, 0.5, 32]} />
      <meshBasicMaterial
        color="#ff6600"
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Ground plane
export function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#2d5016" roughness={0.9} />
    </mesh>
  );
}

// Sky dome
export function Sky({ pollution }) {
  const skyColor = new THREE.Color();
  skyColor.setHSL(0.6 - pollution * 0.2, 0.7 - pollution * 0.3, 0.5 - pollution * 0.2);

  return (
    <mesh>
      <sphereGeometry args={[100, 32, 32]} />
      <meshBasicMaterial color={skyColor} side={THREE.BackSide} />
    </mesh>
  );
}
