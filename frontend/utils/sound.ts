class SoundManager {
  ctx: AudioContext | null = null;
  initialized: boolean = false;

  init() {
    if (this.initialized) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.initialized = true;
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playHit() {
    // Tiếng "bụp" ngắn khi đánh trúng
    this.playTone(300, 'square', 0.05, 0.02);
  }

  playBaseHit() {
    // Tiếng "thud" trầm khi đánh vào trụ
    this.playTone(100, 'sawtooth', 0.2, 0.05);
  }

  playSpawnNormal() {
    // Tiếng "pop" khi sinh lính thường
    this.playTone(600, 'sine', 0.1, 0.03);
  }

  playSpawnSuper() {
    // Hiệu ứng "Siêu nhân Gao" (Gao Ranger vibe)
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Tiếng gầm dũng mãnh (Roar / Power sweep)
    const roarOsc1 = this.ctx.createOscillator();
    const roarOsc2 = this.ctx.createOscillator();
    const roarGain = this.ctx.createGain();
    
    roarOsc1.type = 'sawtooth';
    roarOsc2.type = 'square';
    
    // Tần số giảm dần tạo cảm giác gầm gừ
    roarOsc1.frequency.setValueAtTime(200, now);
    roarOsc1.frequency.exponentialRampToValueAtTime(40, now + 0.6);
    
    roarOsc2.frequency.setValueAtTime(205, now); // Detune nhẹ để âm thanh dày hơn
    roarOsc2.frequency.exponentialRampToValueAtTime(42, now + 0.6);

    roarGain.gain.setValueAtTime(0.15, now);
    roarGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    roarOsc1.connect(roarGain);
    roarOsc2.connect(roarGain);
    roarGain.connect(this.ctx.destination);

    roarOsc1.start(now);
    roarOsc2.start(now);
    roarOsc1.stop(now + 0.6);
    roarOsc2.stop(now + 0.6);

    // 2. Giai điệu kèn đồng/guitar điện xuất trận (Heroic Fanfare)
    const playNote = (f: number, t: number, d: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square'; // Âm thanh chói, mạnh mẽ giống synth/guitar
      osc.frequency.value = f;
      
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.setTargetAtTime(0.05, t + d * 0.8, 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + d);
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.start(t);
      osc.stop(t + d);
    };

    // Nhịp điệu dồn dập, vút cao
    playNote(440, now, 0.1);          // A4
    playNote(554.37, now + 0.1, 0.1); // C#5
    playNote(659.25, now + 0.2, 0.1); // E5
    playNote(880, now + 0.3, 0.4);    // A5 (Ngân dài)
  }

  playWin() {
    // Giai điệu chiến thắng
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const playNote = (f: number, t: number, d: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + d);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t);
      osc.stop(t + d);
    };

    playNote(440, now, 0.2); // A4
    playNote(554.37, now + 0.2, 0.2); // C#5
    playNote(659.25, now + 0.4, 0.2); // E5
    playNote(880, now + 0.6, 0.6); // A5
  }
}

export const soundManager = new SoundManager();
