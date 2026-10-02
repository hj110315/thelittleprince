// Dexie.js Database Instance & Schema Setup
const db = new Dexie('LittlePrincePlannerDB');

db.version(1).stores({
  planets: 'id, name, archetype, seed, colorTheme, createdAt',
  tasks: 'id, planetId, title, priority, deadline, completed, createdAt, completedAt, timeSpentMinutes',
  flightLogs: 'id, taskId, durationMinutes, completedAt'
});

// Seed default Home Planet (Asteroid B-612) if empty
export async function initDatabase() {
  const planetCount = await db.planets.count();
  if (planetCount === 0) {
    await db.planets.add({
      id: 'b612',
      name: 'Asteroid B-612',
      archetype: 'home',
      seed: 849201,
      colorTheme: 'sunset',
      createdAt: new Date().toISOString()
    });
    
    // Seed an initial welcoming task
    await db.tasks.add({
      id: 'task_welcome',
      planetId: 'b612',
      title: 'Water the Rose (Complete first focus session)',
      priority: 'high',
      deadline: new Date(Date.now() + 86400000).toISOString(),
      notes: 'Establishing ties requires daily care. Launch a flight to start.',
      completed: 0, // 0 = false, 1 = true for IndexedDB numerical queries
      createdAt: new Date().toISOString(),
      completedAt: null,
      timeSpentMinutes: 0
    });
  }
}

export { db };
