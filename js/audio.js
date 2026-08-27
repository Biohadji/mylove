/* MyLove SoundFX — Web Audio sound effects (no external files needed) */
class SoundFX {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem('mylove_sound') === '0';
    }

    init() {
        if (this.ctx) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
            try { this.ctx = new AC(); } catch (e) { this.ctx = null; }
        }
    }

    ensure() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    toggle() {
        this.muted = !this.muted;
        localStorage.setItem('mylove_sound', this.muted ? '0' : '1');
        return !this.muted;
    }

    tone(freq, dur, type, vol, delay) {
        if (this.muted || !this.ctx) return;
        delay = delay || 0;
        vol = vol || 0.18;
        const t0 = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t0);
        osc.stop(t0 + dur + 0.05);
    }

    play(name) {
        this.ensure();
        switch (name) {
            case 'click':
                this.tone(600, 0.08, 'sine', 0.12);
                break;
            case 'pop':
                this.tone(520, 0.1, 'square', 0.1);
                this.tone(780, 0.12, 'square', 0.08, 0.06);
                break;
            case 'success':
                [523, 659, 784].forEach((f, i) => this.tone(f, 0.16, 'sine', 0.16, i * 0.09));
                break;
            case 'win':
                [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.2, i * 0.12));
                break;
            case 'coin':
                this.tone(880, 0.1, 'sine', 0.14);
                this.tone(1174, 0.2, 'sine', 0.14, 0.08);
                break;
            case 'error':
                this.tone(220, 0.2, 'sawtooth', 0.1);
                this.tone(180, 0.25, 'sawtooth', 0.08, 0.1);
                break;
            case 'reveal':
                [392, 523, 659].forEach((f, i) => this.tone(f, 0.15, 'sine', 0.14, i * 0.07));
                break;
            case 'shuffle':
                [500, 600, 700, 800].forEach((f, i) => this.tone(f, 0.06, 'square', 0.08, i * 0.05));
                break;
            case 'spin':
                this.tone(300, 0.05, 'sine', 0.08);
                this.interval = setInterval(() => {
                    this.tone(200 + Math.random() * 200, 0.05, 'sine', 0.06);
                }, 120);
                break;
            case 'spinEnd':
                if (this.interval) clearInterval(this.interval);
                this.play('coin');
                break;
            case 'heart':
                this.tone(700, 0.15, 'triangle', 0.12);
                this.tone(880, 0.2, 'sine', 0.12, 0.1);
                break;
            default:
                this.tone(440, 0.1, 'sine', 0.1);
        }
    }
}

const SFX = new SoundFX();