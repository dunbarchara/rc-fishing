import { useGLTF } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import takopiUrl from '../assets/takopi_octo.glb?url';

type GroupProps = ThreeElements['group'];


export default function Takopi(props: GroupProps) {
    // loads + parses the file once and caches it; the component suspends until it's ready
    const { scene } = useGLTF(takopiUrl);

    return (
        <group {...props}>
            <primitive object={scene} />
            {/* pole */}
            {/* <group position={[0.15, 0.25, -0.2]} rotation={[-Math.PI / 4, 0, 0]}>
                <mesh position={[0, 0.4, 0]}>
                    <cylinderGeometry args={[0.008, 0.015, 0.8, 5]} />
                    <meshToonMaterial color="#6e4a2f" />
                </mesh>
            </group> */}
        </group>
    );
}


useGLTF.preload(takopiUrl);
