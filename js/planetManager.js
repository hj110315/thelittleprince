import { db } from './db.js';
import { store } from './store.js';

export class PlanetManager {
  static async createPlanet(name, archetype = 'dune') {
    if (!name || !name.trim()) return null;

    const newPlanet = {
      id: `planet_${Date.now()}`,
      name: name.trim(),
      archetype,
      seed: Math.floor(Math.random() * 1000000),
      colorTheme: 'sunset',
      createdAt: new Date().toISOString()
    };

    await db.planets.add(newPlanet);
    store.publish('planet:created', newPlanet);
    return newPlanet;
  }

  static async deletePlanet(planetId) {
    if (planetId === 'b612') {
      alert("Asteroid B-612 is your home planet and cannot be deleted.");
      return false;
    }

    if (!confirm("Are you sure you want to delete this subject planet and all associated tasks?")) {
      return false;
    }

    // Transaction to delete planet and its associated tasks
    await db.transaction('rw', db.planets, db.tasks, async () => {
      await db.tasks.where('planetId').equals(planetId).delete();
      await db.planets.delete(planetId);
    });

    store.publish('planet:deleted', planetId);
    return true;
  }

  static renderPlanetCreationModal(container) {
    if (!container) return;

    container.innerHTML = `
      <div class="planet-form-card parchment-card">
        <h3 class="form-title">Establish New Subject Planet</h3>
        <form id="form-create-planet">
          <div class="form-group">
            <label for="planet-name">Planet / Subject Name</label>
            <input type="text" id="planet-name" required placeholder="e.g. Quantum Physics, French Grammar" class="form-input">
          </div>
          <div class="form-group">
            <label for="planet-archetype">Archetype Topography</label>
            <select id="planet-archetype" class="form-select">
              <option value="dune">Dune (Ochre Sand Washes)</option>
              <option value="crystalline">Crystalline (Hexagonal Facets)</option>
              <option value="botanical">Botanical (Terraced Sage Green)</option>
              <option value="ringed">Ringed (Violet Core & Starlight Ring)</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="hud-btn hud-btn-primary">Create Planet</button>
          </div>
        </form>
      </div>
    `;

    const form = container.querySelector('#form-create-planet');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = container.querySelector('#planet-name');
      const archetypeSelect = container.querySelector('#planet-archetype');

      const created = await PlanetManager.createPlanet(nameInput.value, archetypeSelect.value);
      if (created) {
        nameInput.value = '';
      }
    });
  }
}
