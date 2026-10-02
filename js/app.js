import { db, initDatabase } from './db.js';
import { store } from './store.js';
import { SkyStage } from './canvas/stage.js';
import { SkyManager } from './canvas/skyManager.js';
import { PlanetRenderer } from './canvas/planetRenderer.js';
import { B612Renderer } from './canvas/b612Renderer.js';
import { MonoplaneEngine } from './canvas/monoplane.js';

class App {
  constructor() {
    this.init();
  }

  async init() {
    // 1. Initialize Dexie Database
    await initDatabase();

    // 2. Setup Stage and Sky Environment
    this.skyStage = new SkyStage('canvas-container');
    this.skyManager = new SkyManager(this.skyStage);
    SkyManager.updateSkyMoodByTime();

    // 3. Initialize Monoplane Focus Engine
    this.monoplaneEngine = new MonoplaneEngine(this.skyStage);

    // 4. Render World Planets & Asteroid B-612
    await this.renderWorldPlanets();

    // 5. HUD Events
    this.setupHUDListeners();

    store.publish('app:ready', { db });
  }

  async renderWorldPlanets() {
    const planets = await db.planets.toArray();
    const tasks = await db.tasks.toArray();

    const centerX = this.skyStage.worldSize / 2;
    const centerY = this.skyStage.worldSize / 2;

    planets.forEach((planet, index) => {
      const planetTasks = tasks.filter(t => t.planetId === planet.id && !t.completed);
      const overdueTasks = planetTasks.filter(t => t.deadline && new Date(t.deadline) < new Date()).length;
      const highUrgent = planetTasks.filter(t => t.priority === 'high').length;

      let planetNode;

      if (planet.id === 'b612' || planet.archetype === 'home') {
        planet.x = centerX;
        planet.y = centerY;

        planetNode = B612Renderer.createB612Node(planet, {
          overdue: overdueTasks,
          completedStreak: 3
        });
      } else {
        const angle = ((index - 1) * (360 / Math.max(1, planets.length - 1))) * (Math.PI / 180);
        const orbitRadius = 420;

        planet.x = centerX + orbitRadius * Math.cos(angle);
        planet.y = centerY + orbitRadius * Math.sin(angle);

        planetNode = PlanetRenderer.createPlanetNode(planet, {
          total: planetTasks.length,
          highUrgent
        });
      }

      this.skyStage.worldLayer.add(planetNode);
    });

    this.skyStage.worldLayer.batchDraw();

    // Planet Selection & Camera Target
    store.subscribe('planet:selected', (planetData) => {
      this.skyStage.centerOnCoordinates(planetData.x, planetData.y, 2.0, () => {
        const drawer = document.getElementById('drawer-container');
        const title = document.getElementById('drawer-planet-title');
        if (title) title.textContent = planetData.name;
        drawer?.classList.remove('drawer-hidden');
      });
    });
  }

  setupHUDListeners() {
    const viewToggleBtn = document.getElementById('btn-view-toggle');
    const canvasContainer = document.getElementById('canvas-container');
    const journalContainer = document.getElementById('journal-container');

    viewToggleBtn?.addEventListener('click', () => {
      const isCanvasActive = canvasContainer.classList.contains('view-active');

      if (isCanvasActive) {
        canvasContainer.classList.remove('view-active');
        canvasContainer.classList.add('view-hidden');
        journalContainer.classList.remove('view-hidden');
        journalContainer.classList.add('view-active');
        viewToggleBtn.querySelector('.btn-text').textContent = 'Sky Map';
        store.publish('view:changed', 'journal');
      } else {
        journalContainer.classList.remove('view-active');
        journalContainer.classList.add('view-hidden');
        canvasContainer.classList.remove('view-hidden');
        canvasContainer.classList.add('view-active');
        viewToggleBtn.querySelector('.btn-text').textContent = 'Journal';
        store.publish('view:changed', 'canvas');
      }
    });

    document.getElementById('btn-close-drawer')?.addEventListener('click', () => {
      document.getElementById('drawer-container')?.classList.add('drawer-hidden');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
