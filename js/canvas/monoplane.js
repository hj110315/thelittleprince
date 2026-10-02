import { store } from '../store.js';

export class MonoplaneEngine {
  constructor(skyStage) {
    this.stage = skyStage.stage;
    this.animLayer = skyStage.animLayer;

    // Flight Dynamics State
    this.planeNode = null;
    this.isFlying = false;
    this.smokeParticles = [];

    // Timer State
    this.timerMode = 'pomodoro'; // 'pomodoro' | 'stopwatch'
    this.durationSeconds = 25 * 60;
    this.remainingSeconds = 25 * 60;
    this.elapsedSeconds = 0;
    this.timerInterval = null;

    this.createMonoplaneSprite();
    this.bindHUDControls();
  }

  createMonoplaneSprite() {
    this.planeNode = new Konva.Group({
      x: 1500,
      y: 1420, // Parked on B-612 by default
      visible: true
    });

    // Fuselage (Vintage Yellow Wings & Red Body)
    const body = new Konva.Path({
      data: 'M -12 0 L 12 -4 L 16 0 L 12 4 Z',
      fill: '#E26D5C',
      stroke: '#8C6D46',
      strokeWidth: 1
    });

    const wings = new Konva.Rect({
      x: -4,
      y: -14,
      width: 8,
      height: 28,
      fill: '#F4D35E',
      stroke: '#8C6D46',
      strokeWidth: 1,
      cornerRadius: 2
    });

    // Propeller
    const prop = new Konva.Line({
      points: [17, -6, 17, 6],
      stroke: '#F6F1E5',
      strokeWidth: 2
    });

    this.planeNode.add(wings, body, prop);
    this.animLayer.add(this.planeNode);
    this.animLayer.batchDraw();
  }

  bindHUDControls() {
    const launchBtn = document.getElementById('btn-launch-flight');
    const focusDisplay = document.getElementById('gauge-focus-time');

    launchBtn?.addEventListener('click', () => {
      if (this.isFlying) {
        this.stopFlightSession();
      } else {
        this.startFlightSession();
      }
    });

    store.subscribe('timer:tick', (seconds) => {
      if (focusDisplay) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        focusDisplay.textContent = `${mins}:${secs}`;
      }
    });
  }

  startFlightSession(targetCoords = { x: 1800, y: 1200 }) {
    this.isFlying = true;
    this.remainingSeconds = this.durationSeconds;
    this.elapsedSeconds = 0;

    const launchBtn = document.getElementById('btn-launch-flight');
    if (launchBtn) {
      launchBtn.querySelector('.btn-text').textContent = 'Land Flight';
      launchBtn.classList.add('hud-btn-active');
    }

    // Start Focus Timer Loop
    this.timerInterval = setInterval(() => {
      if (this.timerMode === 'pomodoro') {
        this.remainingSeconds--;
        this.elapsedSeconds++;
        store.publish('timer:tick', this.remainingSeconds);

        if (this.remainingSeconds <= 0) {
          this.stopFlightSession(true);
        }
      } else {
        this.elapsedSeconds++;
        store.publish('timer:tick', this.elapsedSeconds);
      }

      this.spawnSmokeTrail();
    }, 1000);

    // Orbit Animation Tween
    this.animateFlightOrbit(targetCoords);
  }

  stopFlightSession(completed = false) {
    this.isFlying = false;
    clearInterval(this.timerInterval);

    const launchBtn = document.getElementById('btn-launch-flight');
    if (launchBtn) {
      launchBtn.querySelector('.btn-text').textContent = 'Launch Flight';
      launchBtn.classList.remove('hud-btn-active');
    }

    if (completed) {
      store.publish('flight:completed', { durationMinutes: Math.floor(this.elapsedSeconds / 60) });
    }

    // Return monoplane to B-612 home base
    this.planeNode.to({
      x: 1500,
      y: 1420,
      rotation: 0,
      duration: 1.5,
      easing: Konva.Easings.EaseInOut
    });
  }

  animateFlightOrbit(targetCoords) {
    if (!this.isFlying) return;

    const radius = 180;
    const speed = 0.02;
    let angle = 0;

    const anim = new Konva.Animation((frame) => {
      if (!this.isFlying) {
        anim.stop();
        return;
      }

      angle += speed;
      const x = targetCoords.x + radius * Math.cos(angle);
      const y = targetCoords.y + radius * Math.sin(angle);
      const rotation = ((angle + Math.PI / 2) * 180) / Math.PI;

      this.planeNode.position({ x, y });
      this.planeNode.rotation(rotation);
    }, this.animLayer);

    anim.start();
  }

  spawnSmokeTrail() {
    const pos = this.planeNode.position();
    const particle = new Konva.Circle({
      x: pos.x,
      y: pos.y,
      radius: 4,
      fill: 'rgba(246, 241, 229, 0.6)',
      listening: false
    });

    this.animLayer.add(particle);

    particle.to({
      radius: 12,
      opacity: 0,
      duration: 1.2,
      onFinish: () => particle.destroy()
    });
  }
}
