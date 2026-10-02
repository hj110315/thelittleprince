import { PRNG } from './planetRenderer.js';

export class SkyManager {
  constructor(skyStage) {
    this.stage = skyStage.stage;
    this.bgLayer = skyStage.bgLayer;
    this.worldSize = skyStage.worldSize;

    this.initBackground();
  }

  initBackground() {
    this.bgLayer.destroyChildren();

    // 1. Render Deep Space Ink Washes (Procedural Nebulae)
    const prng = new PRNG(102938); // Fixed seed for consistent deep sky
    const nebulaCount = 6;

    for (let i = 0; i < nebulaCount; i++) {
      const x = prng.range(300, this.worldSize - 300);
      const y = prng.range(300, this.worldSize - 300);
      const radius = prng.range(250, 500);

      const nebula = new Konva.Circle({
        x,
        y,
        radius,
        fillLinearGradientStartPoint: { x: -radius, y: -radius },
        fillLinearGradientEndPoint: { x: radius, y: radius },
        fillLinearGradientColorStops: [
          0, 'rgba(112, 61, 80, 0.18)',   // Soft Sunset Peach Wash
          0.5, 'rgba(43, 27, 45, 0.12)',  // Deep Violet Wash
          1, 'rgba(19, 25, 43, 0)'        // Fade to Cosmic Indigo
        ],
        listening: false
      });

      this.bgLayer.add(nebula);
    }

  // 2. Render Procedural Starfield
    const starCount = 350;
    for (let i = 0; i < starCount; i++) {
      const sx = prng.range(0, this.worldSize);
      const sy = prng.range(0, this.worldSize);
      const size = prng.range(0.8, 2.4);
      const alpha = prng.range(0.3, 0.9);

      const star = new Konva.Circle({
        x: sx,
        y: sy,
        radius: size,
        fill: '#F4D35E',
        opacity: alpha,
        listening: false
      });

      this.bgLayer.add(star);
    }

    this.bgLayer.batchDraw();
  }

  // Time-of-day Sky Class Switcher
  static updateSkyMoodByTime() {
    const hour = new Date().getHours();
    const body = document.body;
    
    body.classList.remove('sky-dawn', 'sky-day', 'sky-sunset', 'sky-midnight');

    if (hour >= 6 && hour < 10) {
      body.classList.add('sky-dawn');
    } else if (hour >= 10 && hour < 17) {
      body.classList.add('sky-day');
    } else if (hour >= 17 && hour < 20) {
      body.classList.add('sky-sunset');
    } else {
      body.classList.add('sky-midnight');
    }
  }
}
