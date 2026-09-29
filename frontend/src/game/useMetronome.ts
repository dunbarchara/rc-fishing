import { useEffect, useRef } from 'react';
import * as Tone from 'tone';

// soft tick on every beat
// click to start() call 
export function useMetronome(bpm: number) {
    const ready = useRef(false);

    const start = async () => {
        await Tone.start();

        // build the synth + loop only once, then just start/stop the clock
        if (!ready.current) {
            ready.current = true;

            const tick = new Tone.Synth({
                oscillator: { type: 'sine' },
                envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
                volume: -12,
            }).toDestination();

            Tone.getTransport().bpm.value = bpm;
            new Tone.Loop((time) => tick.triggerAttackRelease('C6', '32n', time), '4n').start(0);
        }

        Tone.getTransport().start();
    };

    const stop = () => Tone.getTransport().stop();

    // stop ticking
    useEffect(() => () => {
        Tone.getTransport().stop();
        Tone.getTransport().cancel();
    }, []);

    return { start, stop };
}
