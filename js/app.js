import { db, initDatabase } from './db.js';
import { store } from './store.js';
import { SkyStage } from './canvas/stage.js';
import { SkyManager } from './canvas/skyManager.js';
import { PlanetRenderer } from './canvas/planetRenderer.js';

class App {
  constructor() {
    this.init();
  }

  async init() {
    await initDatabase();

    // Initialize Canvas Stage & Sky Environment
    this.skyStage = new SkyStage('canvas-container');
    this.skyManager = new SkyManager(this.skyStage);
    SkyManager.updateSkyMoodByTime();

    // Render Procedural Planets
    await this.renderWorldPlanets();

    this.setupHUDListeners();
    store.publish('app:ready', { db });
  }

  async renderWorldPlanets() {
    const planets = await db.planets.toArray();
    const tasks = await db.tasks.toArray();

    planets.forEach((planet, index) => {
      // Calculate planet workload stats
      const planetTasks = tasks.filter(t => t.planetId === planet.id && !t.completed);
      const highUrgent = planetTasks.filter(t => t.priority === 'high').length;

      // Arrange planets in a spacious celestial circle around center (B-612)
      const centerX = this.skyStage.worldSize / 2;
      const centerY = this.skyStage.worldSize / 2;

      let x = centerX;
      let y = centerY;

      if (index > 0) {
        const angle = ((index - 1) * (360 / Math.max(1, planets.length - 1))) * (Math.PI / 180);
        const radius = 380;
        x = centerX + radius * Math.cos(angle);
        y = centerY + radius * Math.sin(angle);
      }

      planet.x = x;
      planet.y = y;

      const planetNode = PlanetRenderer.createPlanetNode(planet, {
        total: planetTasks.length,
        highUrgent
      });

      this.skyStage.worldLayer.add(planetNode);
    });

    this.skyStage.worldLayer.batchDraw();

    // Handle Planet Selection & Camera Zoom Event
    store.subscribe('planet:selected', (planetData) => {
      this.skyStage.centerOnCoordinates(planetData.x, planetData.y, 2.0, () => {
        // Open Slide-out Parchment Drawer
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
