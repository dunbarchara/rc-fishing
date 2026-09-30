import { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import type { Group } from 'three';
import takopiUrl from '../assets/takopi_octo.glb?url';

type GroupProps = ThreeElements['group'];

// fishing pole

const POLE_UP = -0.5;
const POLE_OUT = Math.PI / 4;
const BACKSWING = 1; // how far back over the shoulder it goes mid-cast
const CAST_MS = 400;
const POLE_LENGTH = 0.8;
const GRIP = 0.15; // how far up from the butt end takopi holds it (= the pivot)

function Pole({ castAt }: { castAt: number | null }) {
    const ref = useRef<Group>(null);

    useFrame(() => {
        if (!ref.current) return;
        const age = castAt === null ? 0 : Math.min((performance.now() - castAt) / CAST_MS, 1);
        ref.current.rotation.x = POLE_UP + (POLE_OUT - POLE_UP) * age + BACKSWING * Math.sin(Math.PI * age);
    });

    return (
        <group ref={ref} position={[-0.3, 0.25, 0]} rotation={[POLE_UP, 0, 0]}>
            <mesh position={[0, POLE_LENGTH / 2 - GRIP, 0]}>
                <cylinderGeometry args={[0.008, 0.015, POLE_LENGTH, 5]} />
                <meshToonMaterial color="#6e4a2f" />
            </mesh>
        </group>
    );
}

export default function Takopi({ castAt, ...props }: GroupProps & { castAt: number | null }) {
    // loads + parses the file once and caches it; the component suspends until it's ready
    const { scene } = useGLTF(takopiUrl);

    return (
        <group {...props}>
            <primitive object={scene} />
            <Pole castAt={castAt} />
        </group>
    );
}


useGLTF.preload(takopiUrl);
