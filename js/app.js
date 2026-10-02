import { db, initDatabase } from './db.js';
import { store } from './store.js';

class App {
  constructor() {
    this.init();
  }

  async init() {
    // 1. Initialize Dexie IndexedDB
    await initDatabase();

    // 2. Setup HUD Event Listeners
    this.setupHUDListeners();

    // 3. Notify app components ready
    store.publish('app:ready', { db });
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

    const closeDrawerBtn = document.getElementById('btn-close-drawer');
    closeDrawerBtn?.addEventListener('click', () => {
      document.getElementById('drawer-container')?.classList.add('drawer-hidden');
      store.publish('drawer:closed');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
