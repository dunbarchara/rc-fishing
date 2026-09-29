import type { ThreeElements } from '@react-three/fiber';


const PALETTE = {
    sky: '#fce1c0',
    water: '#3fa7b5',
    sand: '#f2d49b',
    grass: '#8cc56b',
    hill: '#6fae5f',
    leaves: '#3f8a5a',
    leavesDark: '#2f6f4a',
    wood: '#a8774f',
    woodDark: '#6e4a2f',
    rock: '#a9a4a0',
};

// shorthand for "any props a <group> takes" (position, rotation, scale...)
type GroupProps = ThreeElements['group'];

// background + fog
function Sky() {
    return (
        <>
            {/* attach="background" sets scene.background instead of adding a child */}
            <color attach="background" args={[PALETTE.sky]} />
            {/* args = [color, near, far] */}
            <fog attach="fog" args={[PALETTE.sky, 6, 28]} />
        </>
    );
}

function Lights() {
    return (
        <>
            {/* soft fill: sky color from above, ground color from below */}
            <hemisphereLight args={['#fff4e0', '#4a8a9a', 1.2]} />
            {/* the "sun" */}
            <directionalLight position={[-6, 5, 3]} intensity={2} color="#ffe2b8" />
        </>
    );
}

function Water() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[80, 80]} />
            <meshToonMaterial color={PALETTE.water} />
        </mesh>
    );
}

// low-poly tree: trunk + two cones
function Tree({ dark = false, ...props }: GroupProps & { dark?: boolean }) {
    const leaves = dark ? PALETTE.leavesDark : PALETTE.leaves;
    return (
        <group {...props}>
            <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.08, 0.12, 0.6, 6]} />
                <meshToonMaterial color={PALETTE.woodDark} />
            </mesh>
            <mesh position={[0, 1, 0]}>
                {/* args = radius, height, segments */}
                <coneGeometry args={[0.6, 1.2, 7]} />
                <meshToonMaterial color={leaves} />
            </mesh>
            <mesh position={[0, 1.6, 0]}>
                <coneGeometry args={[0.42, 0.9, 7]} />
                <meshToonMaterial color={leaves} />
            </mesh>
        </group>
    );
}

function Rock(props: GroupProps) {
    return (
        <group {...props}>
            <mesh scale={[1.5, 0.6, 0.8]}>
                {/* args = [radius, detail] */}
                <dodecahedronGeometry args={[0.5, 0]} />
                <meshToonMaterial color={PALETTE.rock} />
            </mesh>
        </group>
    );
}

// wooden dock you're fishing from
function Dock(props: GroupProps) {
    const posts = [1.2, 2.4, 3.6];
    return (
        <group {...props}>
            {/* deck: one long flat box */}
            <mesh position={[0, 0.25, 2.5]}>
                <boxGeometry args={[0.9, 0.08, 5]} />
                <meshToonMaterial color={PALETTE.wood} />
            </mesh>
            {/* posts on both sides, sunk into the water */}
            {posts.flatMap((z) =>
                [-0.4, 0.4].map((x) => (
                    <mesh key={`${x}${z}`} position={[x, 0.1, z]}>
                        <cylinderGeometry args={[0.05, 0.05, 0.6, 6]} />
                        <meshToonMaterial color={PALETTE.woodDark} />
                    </mesh>
                )),
            )}
        </group>
    );
}

// island: sand, grass top, hill, trees
function Island({ radius = 6, children, ...props }: GroupProps & { radius?: number }) {
    return (
        <group {...props}>
            <mesh position={[0.8, 0.05, 0]}>
                <cylinderGeometry args={[radius + 0.2, radius + 0.3, 0.3, 12]} />
                <meshToonMaterial color={PALETTE.sand} />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[radius - 0.5, radius - 0.3, 0.2, 12]} />
                <meshToonMaterial color={PALETTE.grass} />
            </mesh>
            {children}
        </group>
    );
}

// tree placements [x, z, scale, dark?]
const FAR_TREES: [number, number, number, boolean][] = [
    [-2.5, 0.5, 1.2, false],
    [-1.2, -1, 1.5, true],
    [0.4, 0.8, 1, false],
    [1.8, -0.6, 1.4, true],
    [3, 0.6, 1.1, false],
];

export default function Scene() {
    return (
        <>
            <Sky />
            <Lights />
            <Water />
            <Dock position={[1.7, 0, 1.2]} />

            {/* far island straight ahead: the main backdrop */}
            <Island radius={6} position={[0, 0, -13]}>
                {/* a hill is just a squashed low-poly sphere */}
                <mesh position={[-1, 0.3, -2]} scale={[3, 1.6, 2]}>
                    <sphereGeometry args={[1, 8, 6]} />
                    <meshToonMaterial color={PALETTE.hill} />
                </mesh>
                {FAR_TREES.map(([x, z, s, dark], i) => (
                    <Tree key={i} position={[x, 0.3, z]} scale={s} dark={dark} />
                ))}
            </Island>

            {/* closer shore on the left frames the shot */}
            <Island radius={3} position={[-6, 0, -4]}>
                <Tree position={[0.5, 0.3, -0.5]} scale={1.3} dark />
                <Tree position={[-0.8, 0.3, 0.6]} />
                <Rock position={[1.8, 0.2, 1.2]} />
            </Island>

            {/* a few rocks poking out of the water */}
            <Rock position={[-2.2, 0, -2.5]} scale={0.7} />
            <Rock position={[2.8, 0, -4]} scale={1.1} />
        </>
    );
}
