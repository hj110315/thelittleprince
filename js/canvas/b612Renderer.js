import { store } from '../store.js';

export class B612Renderer {
  static createB612Node(planetData, taskStats = { overdue: 0, completedStreak: 0 }) {
    const { id, name, x, y } = planetData;

    const group = new Konva.Group({
      x: x || 1500,
      y: y || 1500,
      id: `planet-${id}`,
      name: 'b612-node'
    });

    const radius = 65;

    // 1. Asteroid Base Surface
    const asteroidBase = new Konva.Circle({
      radius: radius,
      fillLinearGradientStartPoint: { x: -radius, y: -radius },
      fillLinearGradientEndPoint: { x: radius, y: radius },
      fillLinearGradientColorStops: [
        0, '#E9C46A',
        0.6, '#D4A373',
        1, '#8C6D46'
      ],
      stroke: '#6B4E2E',
      strokeWidth: 2
    });
    group.add(asteroidBase);

    // 2. Three Volcanoes (2 Active, 1 Extinct)
    group.add(B612Renderer.drawVolcano(-28, -42, true));   // Active Volcano 1
    group.add(B612Renderer.drawVolcano(25, -45, true));    // Active Volcano 2
    group.add(B612Renderer.drawVolcano(40, 20, false));   // Extinct Volcano

    // 3. The Rose under a Glass Dome
    const roseGroup = B612Renderer.drawRose(0, -radius + 4, taskStats.completedStreak);
    group.add(roseGroup);

    // 4. Baobab Sprouts (Threat visualizer when overdue tasks > 0)
    if (taskStats.overdue > 0) {
      const baobabGroup = B612Renderer.drawBaobabSprouts(taskStats.overdue, radius);
      group.add(baobabGroup);
    }

    // 5. Title Label
    const label = new Konva.Text({
      text: name,
      fontSize: 16,
      fontFamily: 'Cormorant Garamond, serif',
      fontStyle: '700',
      fill: '#F4D35E',
      align: 'center',
      y: radius + 16
    });
    label.offsetX(label.width() / 2);
    group.add(label);

    // Interactive Hover & Click
    group.on('mouseenter', () => {
      document.body.style.cursor = 'pointer';
      group.to({ scaleX: 1.08, scaleY: 1.08, duration: 0.2 });
    });

    group.on('mouseleave', () => {
      document.body.style.cursor = 'default';
      group.to({ scaleX: 1.0, scaleY: 1.0, duration: 0.2 });
    });

    group.on('click tap', () => {
      store.publish('planet:selected', planetData);
    });

    return group;
  }

  static drawVolcano(x, y, isActive) {
    const volcano = new Konva.Group({ x, y });

    // Cone
    const cone = new Konva.Path({
      data: 'M -10 12 L -4 -6 L 4 -6 L 10 12 Z',
      fill: isActive ? '#A0522D' : '#5C5C5C',
      stroke: '#3A2618',
      strokeWidth: 1
    });

    // Crater Rim / Ember Glow
    const crater = new Konva.Ellipse({
      x: 0,
      y: -6,
      radiusX: 4,
      radiusY: 2,
      fill: isActive ? '#E26D5C' : '#333333'
    });

    volcano.add(cone, crater);
    return volcano;
  }

  static drawRose(x, y, streak) {
    const rose = new Konva.Group({ x, y });

    // Stem
    const stem = new Konva.Line({
      points: [0, 0, 0, -14],
      stroke: '#2A9D8F',
      strokeWidth: 2,
      lineCap: 'round'
    });

    // Flower Bloom (Scales with streak count)
    const bloomScale = Math.min(1.4, 0.7 + streak * 0.15);
    const petals = new Konva.Circle({
      x: 0,
      y: -16,
      radius: 5 * bloomScale,
      fill: '#E26D5C',
      stroke: '#B83B28',
      strokeWidth: 1
    });

    // Glass Dome Cover
    const dome = new Konva.Path({
      data: 'M -9 2 Q -9 -24 0 -24 Q 9 -24 9 2 Z',
      fill: 'rgba(255, 255, 255, 0.25)',
      stroke: 'rgba(255, 255, 255, 0.6)',
      strokeWidth: 1
    });

    rose.add(stem, petals, dome);
    return rose;
  }

  static drawBaobabSprouts(overdueCount, planetRadius) {
    const baobabGroup = new Konva.Group();
    const count = Math.min(5, overdueCount);

    for (let i = 0; i < count; i++) {
      const angle = (i * (360 / count) + 45) * (Math.PI / 180);
      const bx = (planetRadius - 2) * Math.cos(angle);
      const by = (planetRadius - 2) * Math.sin(angle);

      const sprout = new Konva.Path({
        data: 'M 0 0 C -3 -8, -6 -12, -2 -18 C 2 -12, 0 -8, 0 0 Z',
        fill: '#3A5A40',
        stroke: '#283618',
        strokeWidth: 1,
        x: bx,
        y: by,
        rotation: (angle * 180) / Math.PI + 90
      });

      baobabGroup.add(sprout);
    }

    return baobabGroup;
  }
}
