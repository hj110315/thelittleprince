import { store } from '../store.js';

// Seeded Pseudo-Random Number Generator (Mulberry32)
export class PRNG {
  constructor(seed) {
    this.s = seed >>> 0;
  }

  next() {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min, max) {
    return min + this.next() * (max - min);
  }

  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }
}

// Planet Drawing Factory
export class PlanetRenderer {
  static createPlanetNode(planetData, taskStats = { total: 0, highUrgent: 0 }) {
    const { id, name, archetype, seed, x, y } = planetData;
    const prng = new PRNG(seed || 12345);

    const planetGroup = new Konva.Group({
      x: x || 500,
      y: y || 500,
      id: `planet-${id}`,
      name: 'planet-node'
    });

    const baseRadius = prng.range(38, 52);

    // 1. Render Atmospheric Nebular Glow (Workload Indicator)
    const glowColor = PlanetRenderer.getWorkloadGlowColor(taskStats);
    const glowRadius = baseRadius * (taskStats.highUrgent > 0 ? 1.8 : 1.4);

    const aura = new Konva.Circle({
      radius: glowRadius,
      fillRadialGradientStartPoint: { x: 0, y: 0 },
      fillRadialGradientStartRadius: baseRadius * 0.8,
      fillRadialGradientEndPoint: { x: 0, y: 0 },
      fillRadialGradientEndRadius: glowRadius,
      fillRadialGradientColorStops: [
        0, glowColor.inner,
        0.7, glowColor.mid,
        1, 'rgba(0, 0, 0, 0)'
      ],
      listening: false
    });
    planetGroup.add(aura);

    // 2. Render Archetype Topography
    const bodyGroup = PlanetRenderer.drawArchetypeBody(archetype, baseRadius, prng);
    planetGroup.add(bodyGroup);

    // 3. Render Planet Label (Cormorant Garamond Style)
    const label = new Konva.Text({
      text: name,
      fontSize: 14,
      fontFamily: 'Cormorant Garamond, serif',
      fontStyle: '600',
      fill: '#F6F1E5',
      align: 'center',
      y: baseRadius + 14
    });
    label.offsetX(label.width() / 2);
    planetGroup.add(label);

    // 4. Interactive Events
    planetGroup.on('mouseenter', () => {
      document.body.style.cursor = 'pointer';
      planetGroup.to({ scaleX: 1.1, scaleY: 1.1, duration: 0.2 });
    });

    planetGroup.on('mouseleave', () => {
      document.body.style.cursor = 'default';
      planetGroup.to({ scaleX: 1.0, scaleY: 1.0, duration: 0.2 });
    });

    planetGroup.on('click tap', () => {
      store.publish('planet:selected', planetData);
    });

    return planetGroup;
  }

  static getWorkloadGlowColor(stats) {
    if (stats.highUrgent > 0) {
      // Sunset Vermilion Pulse for High Urgency
      return {
        inner: 'rgba(226, 109, 92, 0.45)',
        mid: 'rgba(226, 109, 92, 0.15)'
      };
    } else if (stats.total > 0) {
      // Sahara Sand Warmth for Active Work
      return {
        inner: 'rgba(233, 196, 106, 0.35)',
        mid: 'rgba(233, 196, 106, 0.10)'
      };
    }
    // Golden Starlight Serenity for Zero Pending Tasks
    return {
      inner: 'rgba(244, 211, 94, 0.25)',
      mid: 'rgba(244, 211, 94, 0.05)'
    };
  }

  static drawArchetypeBody(archetype, radius, prng) {
    const group = new Konva.Group();

    switch (archetype) {
      case 'crystalline': {
        // Sharp facets, indigo/teal gradient
        const base = new Konva.RegularPolygon({
          sides: 6,
          radius: radius,
          fillLinearGradientStartPoint: { x: -radius, y: -radius },
          fillLinearGradientEndPoint: { x: radius, y: radius },
          fillLinearGradientColorStops: [0, '#2A9D8F', 1, '#13192B'],
          stroke: '#6B8EA7',
          strokeWidth: 1.5
        });
        group.add(base);
        break;
      }

      case 'botanical': {
        // Terraced sage green rings
        const base = new Konva.Circle({
          radius: radius,
          fill: '#52796F',
          stroke: '#84A98C',
          strokeWidth: 2
        });
        const ring = new Konva.Circle({
          radius: radius * 0.65,
          fill: '#354F52'
        });
        group.add(base, ring);
        break;
      }

      case 'ringed': {
        // Translucent pastel ring + violet core
        const core = new Konva.Circle({
          radius: radius * 0.85,
          fill: '#703D50'
        });
        const ring = new Konva.Ellipse({
          radiusX: radius * 1.5,
          radiusY: radius * 0.4,
          stroke: 'rgba(244, 211, 94, 0.6)',
          strokeWidth: 3,
          rotation: prng.range(-25, 25)
        });
        group.add(core, ring);
        break;
      }

      case 'dune':
      default: {
        // Ochre sand washes
        const base = new Konva.Circle({
          radius: radius,
          fillLinearGradientStartPoint: { x: -radius, y: 0 },
          fillLinearGradientEndPoint: { x: radius, y: 0 },
          fillLinearGradientColorStops: [0, '#E9C46A', 0.8, '#F4A261', 1, '#E76F51'],
          stroke: '#8C6D46',
          strokeWidth: 1
        });
        group.add(base);
        break;
      }
    }

    return group;
  }
}
