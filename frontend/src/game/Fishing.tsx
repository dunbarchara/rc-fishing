import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { Mesh, MeshBasicMaterial } from 'three';
import * as Tone from 'tone';
import { useMetronome } from './useMetronome';
import { playFishHold, playPluck, playThud, startHold, stopHold } from './sounds';
import Scene from './Scene';
import Takopi from './Takopi';
import { useProfileCards, type CardData } from '../features/profiles/useProfileCards';
import DexCard from './DexCard';

// can use this to fly to debug!!!
const DEBUG_CAMERA = false;
const PIXEL_SCALE = 0.4;
// looking a bit above the bobber [0,0,0] to keep the horizon and far island in frame
const CAM_POS = [0, 1.15, 3.7] as const;
const CAM_TARGET = [0, 0.35, 0] as const;

type Phase = 'idle' | 'waiting' | 'bite' | 'caught' | 'escaped';

const text: Record<Phase, string> = {
    idle: 'click to cast',
    waiting: 'waiting...',
    bite: 'copy the fish!',
    caught: 'you caught a fish!',
    escaped: 'it got away...',
};

// first round beat pattern
const BPM = 90;
const BEAT = 60 / BPM; // bps
const TUGS = [0, 1];
const PULLS = [2, 3];
const WINDOW = 0.12 / BEAT;
const ROUNDS = 3; // round to win
const ROUND = 8; // 8 beat each round
const HOLD = 4; // hold round

type Round = { start: number; kind: 'tap' | 'hold' };

// add in audio latency
function outputDelay() {
    const raw = Tone.getContext().rawContext as unknown as AudioContext;
    return (raw.outputLatency || 0) + (raw.baseLatency || 0);
}

// beats since cast
function currentBeat() {
    const transport = Tone.getTransport();
    if (transport.state !== 'started') return -1;
    const heard = Tone.getContext().currentTime - outputDelay();
    return transport.getSecondsAtTime(heard) / BEAT;
}

// how far into the current beat (0 -> 1)
function beatPhase() {
    const beat = currentBeat();
    return beat < 0 ? 1 : beat % 1;
}

// beats since the round started 
function inRound(round: Round | null) {
    return round ? currentBeat() - round.start : -1;
}

// 1 on a tug beat, decaying before the next beat
function tugAmount(round: Round | null) {
    const local = inRound(round);
    if (round?.kind !== 'tap' || local < 0 || !TUGS.includes(Math.floor(local))) return 0;
    return Math.exp(-(local % 1) * 5);
}

// 1 while the fish is holding the line in the hold round
function fishHolding(round: Round | null) {
    const local = inRound(round);
    return round?.kind === 'hold' && local >= 0 && local < HOLD ? 1 : 0;
}

function fightAmount(round: Round | null) {
    const local = inRound(round);
    if (!fishHolding(round)) return 0;
    return Math.min(local / 0.5, 1) * (0.7 + 0.3 * (local / HOLD));
}

// keep the wander slow: anything quick strobes once the low-res buffer is scaled up
function strain(t: number) {
    return Math.sin(t * 6) + 0.5 * Math.sin(t * 9.4);
}

function reelAmount(round: Round | null) {
    const local = inRound(round);
    if (round?.kind !== 'hold' || local < HOLD) return 0;
    return Math.min((local - HOLD) / HOLD, 1);
}

function crank() {
    return Math.sin(currentBeat() * Math.PI * 2);
}

// bobber
function Bobber({ phase, round }: { phase: Phase; round: Round | null }) {
    const ref = useRef<Mesh>(null);

    useFrame(({ clock }) => {
        if (!ref.current) return;
        const shake = fightAmount(round);

        ref.current.position.x = 0.04 * shake * Math.sin(clock.elapsedTime * 50);
        ref.current.position.y =
            0 - 0.01 * Math.exp(-beatPhase() * 5) - 0.3 * tugAmount(round) - 0.08 * shake;
    });

    if (phase !== 'waiting' && phase !== 'bite') return null;

    return (
        <mesh ref={ref}>
            <sphereGeometry args={[0.1, 24, 12]} />
            <meshStandardMaterial color="#00ff26" />
        </mesh>
    );
}

// ring on the water that closes in on the bobber
function ApproachRing({ phase, targets }: { phase: Phase; targets: number[] }) {
    const ref = useRef<Mesh>(null);

    useFrame(() => {
        if (!ref.current) return;
        const beat = currentBeat();
        const target = targets.find((t) => beat >= t - 1 && beat <= t + WINDOW);
        ref.current.visible = phase === 'bite' && target !== undefined;
        if (target === undefined) return;

        const early = Math.max(0, target - beat); // 1 → 0 as the beat arrives
        ref.current.scale.setScalar(1 + 3 * early);
        (ref.current.material as MeshBasicMaterial).opacity = 1 - 0.7 * early;
    });

    return (
        <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} visible={false}>
            <ringGeometry args={[0.1, 0.12, 20]} />
            <meshBasicMaterial color="white" transparent />
        </mesh>
    );
}

// ripple for beat indicator
type Press = { at: number; good: boolean };
function PressRipple({ press }: { press: Press | null }) {
    const ref = useRef<Mesh>(null);

    useFrame(() => {
        if (!ref.current) return;
        const age = press ? (performance.now() - press.at) / 400 : 1;
        ref.current.visible = age < 1;
        ref.current.scale.setScalar(1 + 2 * age);
        (ref.current.material as MeshBasicMaterial).opacity = 1 - age;
    });

    return (
        <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} visible={false}>
            <ringGeometry args={[0.24, 0.3, 48]} />
            <meshBasicMaterial color={press?.good ? '#3bff52' : '#ff9a9a'} transparent />
        </mesh>
    );
}

function pullAmount(press: Press | null) {
    const age = press ? (performance.now() - press.at) / 200 : 1;
    return age < 1 ? Math.exp(-age * 4) : 0;
}

// camera movement: the fish hauls it down and in, your pull kicks it back out
function CameraRig({ round, holding, press }: { round: Round | null; holding: boolean; press: Press | null }) {
    useFrame(({ camera, clock }) => {
        const t = clock.elapsedTime;
        const tug = tugAmount(round);
        const fight = fightAmount(round);
        const pull = pullAmount(press);
        const reel = holding ? reelAmount(round) : 0;
        const sway = reel * crank();

        camera.position.set(
            CAM_POS[0] + 0.03 * fight * strain(t) + 0.02 * sway,
            CAM_POS[1] - 0.1 * tug - 0.05 * fight + 0.05 * pull - 0.08 * reel,
            CAM_POS[2] - 0.3 * tug - 0.16 * fight + 0.12 * pull - 0.3 * reel - 0.03 * sway,
        );
        camera.lookAt(
            CAM_TARGET[0],
            CAM_TARGET[1] - 0.09 * tug - 0.04 * fight + 0.04 * pull - 0.04 * reel,
            CAM_TARGET[2],
        );
    });
    return null;
}

// hold round: one dot slides across the four beats instead of the dots pulsing,
function HoldSlider({ round, mine, holding }: { round: Round; mine: boolean; holding: boolean }) {
    const dot = useRef<HTMLDivElement>(null);

    // slide every frame without re-rendering the strip
    useEffect(() => {
        let frame = 0;
        const loop = () => {
            const local = currentBeat() - round.start;
            const progress = Math.min(Math.max((mine ? local - HOLD : local) / HOLD, 0), 1);
            const track = dot.current?.parentElement;
            if (dot.current && track) {
                const span = track.clientWidth - dot.current.clientWidth;
                dot.current.style.transform = `translateX(${progress * span}px)`;
            }
            frame = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(frame);
    }, [round, mine]);

    return (
        <div
            ref={dot}
            className={[
                'absolute left-0 top-0 w-9 h-9 rounded-full',
                mine ? (holding ? 'bg-emerald-400' : 'border-2 border-white') : 'bg-orange-300',
            ].join(' ')}
        />
    );
}

// beat strip that pulse with the tick
function BeatStrip({ phase, round, hits, holding }: { phase: Phase; round: Round | null; hits: number[]; holding: boolean }) {
    const [beat, setBeat] = useState(-1);

    // re-render only when the beat changes
    useEffect(() => {
        let frame = 0;
        const loop = () => {
            setBeat(Math.floor(currentBeat()));
            frame = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(frame);
    }, []);

    if (phase !== 'waiting' && phase !== 'bite') return null;

    const local = round && phase === 'bite' ? beat - round.start : -1;
    const inPlay = round !== null && local >= 0 && local < ROUND;
    const isHold = inPlay && round.kind === 'hold';
    // the hold round has the sliding dot instead, so nothing pulses there
    const active = isHold ? -1 : inPlay ? local % 4 : beat % 4;
    const firstHalf = local < 4;

    // rhythm dots
    return (
        <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none">
            <div className="relative flex gap-4">
                {[0, 1, 2, 3].map((i) => {
                    let style: string;
                    if (isHold) {
                        // just a track for the sliding dot to run along
                        style = 'bg-white/25';
                    } else if (inPlay && round.kind === 'tap' && firstHalf) {
                        // fish tugs, then your pulls
                        if (TUGS.includes(i)) style = 'bg-orange-300';
                        else style = `border-2 border-white ${hits.includes(round.start + i) ? 'bg-emerald-400' : ''}`;
                    } else {
                        // waiting or resting: plain pulse
                        style = i === active ? 'bg-white/70' : 'bg-white/25';
                    }
                    return (
                        <div
                            key={i}
                            className={[
                                'w-9 h-9 rounded-full transition-transform duration-100',
                                i === active ? 'scale-120' : 'scale-100',
                                style,
                            ].join(' ')}
                        />
                    );
                })}
                {isHold && <HoldSlider round={round} mine={!firstHalf} holding={holding} />}
            </div>
        </div>
    );
}

// tension bar
function TensionBar({ phase, reeled, holding }: { phase: Phase; reeled: number; holding: boolean }) {
    if (phase !== 'waiting' && phase !== 'bite') return null;
    const steps = ROUNDS + 1; // tap rounds + final hold
    return (
        <div className="absolute right-4 top-4 bottom-4 w-6 flex flex-col justify-end rounded-md border-4 border-amber-800 pointer-events-none">
            <div
                className="w-full bg-emerald-500 ease-linear"
                style={{
                    height: `${((holding ? steps : reeled) / steps) * 100}%`,
                    transition: `height ${holding ? HOLD * BEAT : 0.3}s`,
                }}
            />
        </div>
    );
}

// you caught fish banner
function CaughtBanner({ phase, cards }: { phase: Phase; cards: CardData[] }) {
    if (phase !== 'caught') return null;
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[0.8em] text-[length:1.8cqw] leading-tight pointer-events-none">
            <p className="text-[2em] font-bold text-white drop-shadow-md">you caught a recursor :p</p>
            {cards[0] && <DexCard profile={cards[0].profile} drawingSrc={cards[0].drawing} />}
        </div>
    );
}

// fishing
export default function Fishing() {
    const { cards, load: loadCards } = useProfileCards();
    const [phase, setPhase] = useState<Phase>('idle');
    const events = useRef<number[]>([]);
    const metronome = useMetronome(BPM);

    // refs are what the game logic reads; the matching state is just for drawing
    const round = useRef<Round | null>(null);
    const [roundView, setRoundView] = useState<Round | null>(null);
    const targets = useRef<number[]>([]); // beats you still need to press on this round
    const [targetsView, setTargetsView] = useState<number[]>([]);
    const [hits, setHits] = useState<number[]>([]);
    const resolved = useRef(false); // this round is already won/lost
    const reeled = useRef(0); // tap rounds won so far
    const [reeledView, setReeledView] = useState(0);
    const holding = useRef(false);
    const [isHolding, setIsHolding] = useState(false);
    const [press, setPress] = useState<Press | null>(null);
    const [castAt, setCastAt] = useState<number | null>(null); // when the pole was last cast
    const [feedback, setFeedback] = useState('');

    // book something to happen on a beat
    // save each booking's id so end() can cancel the ones that haven't happened yet
    const at = (beat: number, cb: (time: number) => void) => {
        events.current.push(Tone.getTransport().scheduleOnce(cb, beat * BEAT));
    };

    // beat for game logic/visuals
    const onBeat = (beat: number, cb: () => void) => {
        at(beat, (time) => Tone.getDraw().schedule(cb, time + outputDelay()));
    };

    const setTargets = (t: number[]) => {
        targets.current = t;
        setTargetsView(t);
    };

    const setHold = (on: boolean) => {
        holding.current = on;
        setIsHolding(on);
        if (on) startHold();
        else stopHold();
    };

    const end = (result: Phase) => {
        setHold(false);
        events.current.forEach((id) => Tone.getTransport().clear(id));
        events.current = [];
        metronome.stop();
        round.current = null;
        setRoundView(null);
        setTargets([]);
        setCastAt(null); // reel the pole back up
        setPhase(result);
    };

    // clear events
    useEffect(() => () => events.current.forEach((id) => Tone.getTransport().clear(id)), []);

    // rounds: tap rounds until you've won ROUNDS of them, then the hold round
    const startRound = (start: number) => {
        const kind = reeled.current >= ROUNDS ? 'hold' : 'tap';
        round.current = { start, kind };
        setRoundView(round.current);
        resolved.current = false;
        setHits([]);

        // only react if this round is still the live one
        const live = () => round.current?.start === start && !resolved.current;

        if (kind === 'tap') {
            setTargets(PULLS.map((p) => start + p));
            TUGS.forEach((t) => at(start + t, (time) => playThud(time)));
            onBeat(start + PULLS[PULLS.length - 1] + WINDOW, () => live() && resolve(false));
        } else {
            // final round holding
            setTargets([start + HOLD]);
            at(start, (time) => {
                playThud(time);
                playFishHold(HOLD * BEAT, time);
            });
            onBeat(start + HOLD + WINDOW, () => live() && !holding.current && resolve(false));
            onBeat(start + 2 * HOLD, () => live() && holding.current && end('caught'));
        }
    };

    // round won → reel in a step; missed → slip back to last round (or lose the fish if nothing's reeled yet)
    const resolve = (won: boolean) => {
        resolved.current = true;
        setTargets([]);
        setHold(false);

        if (won) reeled.current += 1;
        else if (reeled.current === 0) return end('escaped');
        else reeled.current -= 1;
        setReeledView(reeled.current);

        // next round on the next round boundary that's at least 2 beats away
        let next = round.current!.start + ROUND;
        if (next - currentBeat() < 2) next += ROUND;
        startRound(next);
    };

    // all the clicking
    const handleDown = () => {
        if (phase === 'waiting') return;

        if (phase === 'bite') {
            const r = round.current;
            const beat = currentBeat();
            // between rounds, after this round is decided, or during tap-round rest: ignore
            if (!r || resolved.current || beat < r.start - WINDOW) return;
            if (r.kind === 'tap' && beat - r.start >= 4) return;
            if (targets.current.length === 0) return;

            // how far off the nearest beat you still need to press on
            const target = targets.current.reduce((a, b) => (Math.abs(beat - b) < Math.abs(beat - a) ? b : a));
            const ms = Math.round((beat - target) * BEAT * 1000);
            const good = Math.abs(beat - target) <= WINDOW;
            setPress({ at: performance.now(), good });
            setFeedback(Math.abs(ms) <= 40 ? 'perfect!' : `${ms < 0 ? 'early' : 'late'} ${Math.abs(ms)}ms`);
            if (!good) return resolve(false);

            setTargets(targets.current.filter((t) => t !== target));
            if (r.kind === 'hold') return setHold(true);

            playPluck();
            setHits((h) => [...h, target]);
            if (targets.current.length === 0) resolve(true);
            return;
        }

        // cast: wait 1-2 bars, then the bite starts on a downbeat
        const bite = 4 * (1 + Math.floor(Math.random() * 2));
        reeled.current = 0;
        setReeledView(0);
        setFeedback('');
        setPhase('waiting');
        setCastAt(performance.now());
        loadCards(); // pick the card that a win will show
        metronome.start();

        onBeat(bite, () => setPhase('bite'));
        startRound(bite);
    };

    // release grip in the hold round before it's done: slip back a round
    const handleUp = () => {
        if (!holding.current || !round.current) return;
        if (currentBeat() >= round.current.start + 2 * HOLD - WINDOW) end('caught');
        else resolve(false);
    };

    return (
        <div>
            <div
                // the scene is framed for a wide, short box; lock that aspect so the
                // sides never get cropped, and let the width set the size
                className="@container relative w-full aspect-[19/10] bg-sky-600 cursor-pointer select-none"
                onPointerDown={handleDown}
                onPointerUp={handleUp}
                onPointerLeave={handleUp}
            >
                <Canvas
                    camera={{ position: CAM_POS, fov: 40 }}
                    // render at a fraction of the screen's resolution
                    dpr={PIXEL_SCALE}
                    gl={{ antialias: false }}
                    // scale up
                    onCreated={({ gl }) => (gl.domElement.style.imageRendering = 'pixelated')}
                >
                    {DEBUG_CAMERA ? <OrbitControls target={CAM_TARGET} /> : <CameraRig round={roundView} holding={isHolding} press={press} />}
                    <Scene />
                    <Suspense fallback={null}>
                        <Takopi position={[-1.18, 0.28, 1.4]} rotation={[0, 9, 0]} castAt={castAt} />
                    </Suspense>
                    <Bobber phase={phase} round={roundView} />
                    <ApproachRing phase={phase} targets={targetsView} />
                    <PressRipple press={press} />
                </Canvas>
                {feedback && (
                    <p className="absolute top-4 inset-x-0 text-center text-lg font-semibold text-white drop-shadow pointer-events-none">
                        {feedback}
                    </p>
                )}
                <TensionBar phase={phase} reeled={reeledView} holding={isHolding} />
                <BeatStrip phase={phase} round={roundView} hits={hits} holding={isHolding} />
                <CaughtBanner phase={phase} cards={cards} />
            </div>
            <p className="mt-2">{text[phase]}</p>
        </div>
    );
}
