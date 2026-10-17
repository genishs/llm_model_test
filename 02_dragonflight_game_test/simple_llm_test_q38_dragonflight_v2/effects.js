"use strict";
/* ============================================================
 * Dragon Flight - sound engine (WebAudio, no assets)
 * ============================================================ */
const Sound = (() => {
  let ac = null;
  let master = null;
  let muted = false;

  function ensure() {
    if (ac) return;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain();
      master.gain.value = 0.5;
      master.connect(ac.destination);
    } catch (e) { ac = null; }
  }

  function env(g, t0, a, d, peak) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
  }

  function tone(freq, dur, type, peak, slideTo) {
    if (!ac || muted) return;
    const t0 = ac.currentTime;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    env(g, t0, 0.008, dur, peak || 0.2);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function noise(dur, peak, hp) {
    if (!ac || muted) return;
    const t0 = ac.currentTime;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const g = ac.createGain();
    env(g, t0, 0.005, dur, peak || 0.3);
    let node = src;
    if (hp) {
      const f = ac.createBiquadFilter();
      f.type = "highpass"; f.frequency.value = hp;
      node = src; src.connect(f); node = f;
    }
    node.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }

  return {
    ensure,
    setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.5; },
    isMuted() { return muted; },

    shoot()   { tone(880, 0.06, "square", 0.05, 440); },
    enemyShoot() { tone(300, 0.12, "sawtooth", 0.06, 180); },
    kill()   { noise(0.18, 0.25, 800); tone(220, 0.12, "triangle", 0.12, 90); },
    hit(vol) { noise(0.3, 0.35 * vol, 300); tone(120, 0.2, "sawtooth", 0.2 * vol, 60); },
    coin()   { tone(1200, 0.05, "sine", 0.12); setTimeout(() => tone(1600, 0.07, "sine", 0.12), 40); },
    item()   { tone(600, 0.08, "sine", 0.15, 1200); setTimeout(() => tone(900, 0.1, "sine", 0.15, 1800), 70); },
    jingle(up) {
      if (!ac || muted) return;
      const seq = up ? [523, 659, 784, 1047] : [400, 350, 300, 220];
      seq.forEach((f, i) => setTimeout(() => tone(f, 0.18, "triangle", 0.15), i * 120));
    }
  };
})();
