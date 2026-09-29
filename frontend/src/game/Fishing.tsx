import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { useMetronome } from './useMetronome';

type Phase = 'idle' | 'waiting' | 'bite' | 'caught' | 'escaped';

const text: Record<Phase, string> = {
    idle: 'click to cast',
    waiting: 'waiting...',
    bite: 'BITE!',
    caught: 'you caught a fish!',
    escaped: 'it got away...',
};

// bobber
function Bobber({ phase }: { phase: Phase }) {
    const ref = useRef<Mesh>(null);

    useFrame(({ clock }, delta) => {
        if (!ref.current) return;
        if (phase === 'bite') ref.current.rotation.y += delta * 10;
        else ref.current.position.y = Math.abs(Math.sin(clock.elapsedTime * 3)) * 0.01;
    });

    if (phase !== 'waiting' && phase !== 'bite') return null;

    return (
        <mesh ref={ref}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="red" />
        </mesh>
    );
}

// fishing
export default function Fishing() {
    const [phase, setPhase] = useState<Phase>('idle');
    const timer = useRef<number | undefined>(undefined);
    const metronome = useMetronome(90);

    // clear timer
    useEffect(() => () => clearTimeout(timer.current), []);

    const handleClick = () => {
        if (phase === 'waiting') return;

        clearTimeout(timer.current);

        if (phase === 'bite') {
            metronome.stop();
            setPhase('caught');
            return;
        }

        // cast & wait 2-3 seconds
        metronome.start();
        setPhase('waiting');
        timer.current = window.setTimeout(() => {
            setPhase('bite');
            timer.current = window.setTimeout(() => {
                metronome.stop();
                setPhase('escaped');
            }, 1000);
        }, 2000 + Math.random() * 3000);
    };

    return (
        <div>
            <div className="h-80 bg-sky-600 cursor-pointer" onClick={handleClick}>
                <Canvas camera={{ position: [0, 2, 5] }}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 5, 5]} />
                    <Bobber phase={phase} />
                </Canvas>
            </div>
            <p className="mt-2">{text[phase]}</p>
        </div>
    );
}
