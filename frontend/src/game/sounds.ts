import * as Tone from 'tone';

let thud: Tone.MembraneSynth | undefined;
let pluck: Tone.MembraneSynth | undefined;
let fishHum: Tone.Synth | undefined;
let yourHum: Tone.Synth | undefined;

const hum = (volume: number) =>
    new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.15 },
        volume,
    }).toDestination();

// build synths up front (after Tone.start) so the first tug doesn't stutter
export function initSounds() {
    thud ??= new Tone.MembraneSynth({ volume: -4 }).toDestination();
    pluck ??= new Tone.MembraneSynth({ volume: -2 }).toDestination();
    fishHum ??= hum(-10);
    yourHum ??= hum(-10);
}

// fish tug
export function playThud(time?: number) {
    initSounds();
    thud!.triggerAttackRelease('C3', '8n', time);
}

// sounds you trigger by pressing use Tone.immediate()
// pull
export function playPluck() {
    initSounds();
    pluck!.triggerAttackRelease('G4', '8n', Tone.immediate());
}

// fish hold
export function playFishHold(duration: number, time?: number) {
    initSounds();
    fishHum!.triggerAttackRelease('C3', duration, time);
}

// your hold
export function startHold() {
    initSounds();
    yourHum!.triggerAttack('G3', Tone.immediate());
}

export function stopHold() {
    yourHum?.triggerRelease(Tone.immediate());
}
