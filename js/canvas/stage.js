import { store } from '../store.js';

export class SkyStage {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`Container #${containerId} not found.`);

    // Stage Dimensions & Bounds
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.worldSize = 3000; // 3000x3000px celestial space

    // Konva Stage Initialization
    this.stage = new Konva.Stage({
      container: containerId,
      width: this.width,
      height: this.height,
      draggable: true
    });

    // Layer Stack Separation (Performance Optimization)
    this.bgLayer = new Konva.Layer({ listening: false }); // Static sky/stars (no events)
    this.worldLayer = new Konva.Layer();                  // Interactive planets & B-612
    this.animLayer = new Konva.Layer({ listening: false });  // Aircraft trails & flight animations

    this.stage.add(this.bgLayer);
    this.stage.add(this.worldLayer);
    this.stage.add(this.animLayer);

    // Initial Camera Positioning (Center on World)
    this.stage.position({
      x: this.width / 2 - this.worldSize / 2,
      y: this.height / 2 - this.worldSize / 2
    });

    this.initEventListeners();
  }

  initEventListeners() {
    // 1. Responsive Resize
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.stage.width(this.width);
      this.stage.height(this.height);
      this.stage.batchDraw();
    });

    // 2. Cursor Styling during drag
    this.stage.on('dragstart', () => {
      this.container.style.cursor = 'grabbing';
    });
    this.stage.on('dragend', () => {
      this.container.style.cursor = 'default';
      this.clampCameraBounds();
    });

    // 3. Smooth Mouse Wheel Zoom toward Cursor
    this.stage.on('wheel', (e) => {
      e.evt.preventDefault();
      const scaleBy = 1.08;
      const oldScale = this.stage.scaleX();
      const pointer = this.stage.getPointerPosition();

      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - this.stage.x()) / oldScale,
        y: (pointer.y - this.stage.y()) / oldScale
      };

      // Zoom limits: 0.4x to 2.5x
      let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
      newScale = Math.max(0.4, Math.min(2.5, newScale));

      this.stage.scale({ x: newScale, y: newScale });

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale
      };

      this.stage.position(newPos);
      this.clampCameraBounds();
      this.stage.batchDraw();
      
      store.publish('camera:zoomed', { scale: newScale });
    });

    // 4. Listen to view toggle pause/resume
    store.subscribe('view:changed', (viewMode) => {
      if (viewMode === 'journal') {
        this.stage.stop();
      } else {
        this.stage.start();
        this.stage.batchDraw();
      }
    });

    // 5. HUD Home Button Reset
    document.getElementById('btn-home-b612')?.addEventListener('click', () => {
      this.centerOnCoordinates(this.worldSize / 2, this.worldSize / 2, 1.0);
    });

    document.getElementById('btn-sky-compass')?.addEventListener('click', () => {
      this.resetZoom();
    });
  }

  // Prevent panning too far out into the void
  clampCameraBounds() {
    const scale = this.stage.scaleX();
    const minX = this.width - this.worldSize * scale;
    const minY = this.height - this.worldSize * scale;

    const x = Math.min(0, Math.max(minX, this.stage.x()));
    const y = Math.min(0, Math.max(minY, this.stage.y()));

    this.stage.position({ x, y });
  }

  // Camera Smooth Vector Tweening
  centerOnCoordinates(worldX, worldY, targetScale = 1.8, onComplete) {
    const targetX = (this.width * 0.35) - (worldX * targetScale);
    const targetY = (this.height * 0.5) - (worldY * targetScale);

    this.stage.to({
      x: targetX,
      y: targetY,
      scaleX: targetScale,
      scaleY: targetScale,
      duration: 0.8,
      easing: Konva.Easings.EaseInOut,
      onFinish: () => {
        this.clampCameraBounds();
        if (onComplete) onComplete();
      }
    });
  }

  resetZoom() {
    this.stage.to({
      scaleX: 1.0,
      scaleY: 1.0,
      duration: 0.5,
      easing: Konva.Easings.EaseInOut
    });
  }
}
