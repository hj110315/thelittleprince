import { db } from './db.js';
import { store } from './store.js';

export class TaskManager {
  static async getTasksByPlanet(planetId) {
    return await db.tasks.where('planetId').equals(planetId).toArray();
  }

  static async addTask({ planetId, title, priority = 'medium', deadline = null, notes = '' }) {
    if (!title || !title.trim()) return null;

    const newTask = {
      id: `task_${Date.now()}`,
      planetId,
      title: title.trim(),
      priority,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      notes: notes.trim(),
      completed: 0,
      createdAt: new Date().toISOString(),
      completedAt: null,
      timeSpentMinutes: 0
    };

    await db.tasks.add(newTask);
    store.publish('task:created', newTask);
    return newTask;
  }

  static async toggleTaskCompletion(taskId) {
    const task = await db.tasks.get(taskId);
    if (!task) return;

    const newCompleted = task.completed === 1 ? 0 : 1;
    const completedAt = newCompleted === 1 ? new Date().toISOString() : null;

    await db.tasks.update(taskId, {
      completed: newCompleted,
      completedAt
    });

    store.publish('task:updated', { taskId, completed: newCompleted });
  }

  static async deleteTask(taskId) {
    await db.tasks.delete(taskId);
    store.publish('task:deleted', taskId);
  }

  static renderTaskListHTML(tasks) {
    if (!tasks || tasks.length === 0) {
      return `<p class="empty-notice">No tasks recorded for this subject planet yet. Add one below!</p>`;
    }

    return tasks.map(task => {
      const isCompleted = task.completed === 1;
      const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !isCompleted;
      
      const deadlineLabel = task.deadline 
        ? new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : 'No date';

      return `
        <div class="task-card ${isCompleted ? 'task-done' : ''} ${isOverdue ? 'task-overdue' : ''}" data-id="${task.id}">
          <div class="task-header">
            <label class="task-checkbox-label">
              <input type="checkbox" class="task-toggle" ${isCompleted ? 'checked' : ''} data-id="${task.id}">
              <span class="task-title ${isCompleted ? 'completed-text' : ''}">${task.title}</span>
            </label>
            <button class="btn-delete-task" data-id="${task.id}" title="Delete Task">&times;</button>
          </div>
          
          <div class="task-meta">
            <span class="priority-badge priority-${task.priority}">${task.priority}</span>
            ${task.deadline ? `<span class="deadline-badge ${isOverdue ? 'overdue' : ''}">📅 ${deadlineLabel}</span>` : ''}
          </div>

          ${task.notes ? `<p class="task-notes">${task.notes}</p>` : ''}
        </div>
      `;
    }).join('');
  }

  static async renderDrawerContent(planetId) {
    const drawerContent = document.getElementById('drawer-content');
    if (!drawerContent) return;

    const planet = await db.planets.get(planetId);
    const tasks = await TaskManager.getTasksByPlanet(planetId);

    drawerContent.innerHTML = `
      <div class="planet-drawer-view">
        <div class="drawer-actions-bar">
          ${planetId !== 'b612' ? `<button id="btn-delete-planet" class="btn-text-danger" data-id="${planetId}">Delete Planet</button>` : '<span>Home Asteroid</span>'}
        </div>

        <div id="drawer-task-list" class="task-list-container">
          ${TaskManager.renderTaskListHTML(tasks)}
        </div>

        <hr class="divider">

        <div class="add-task-section">
          <h3>Add Task to ${planet?.name || 'Planet'}</h3>
          <form id="form-add-task">
            <input type="text" id="task-title" placeholder="Task title..." required class="form-input">
            
            <div class="form-row">
              <select id="task-priority" class="form-select">
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="low">Low Priority</option>
              </select>
              
              <input type="date" id="task-deadline" class="form-input">
            </div>

            <textarea id="task-notes" placeholder="Notes or details..." class="form-textarea" rows="2"></textarea>
            
            <button type="submit" class="hud-btn hud-btn-primary full-width">Add Task</button>
          </form>
        </div>
      </div>
    `;

    TaskManager.bindTaskEvents(drawerContent, planetId);

    // Bind Delete Planet event
    drawerContent.querySelector('#btn-delete-planet')?.addEventListener('click', async (e) => {
      const pId = e.target.dataset.id;
      const deleted = await PlanetManager.deletePlanet(pId);
      if (deleted) {
        document.getElementById('drawer-container')?.classList.add('drawer-hidden');
      }
    });
  }

  static async renderJournalView() {
    const tabsContainer = document.getElementById('journal-planet-tabs');
    const taskListContainer = document.getElementById('journal-task-list');

    if (!tabsContainer || !taskListContainer) return;

    const planets = await db.planets.toArray();
    let activePlanetId = tabsContainer.querySelector('.tab-active')?.dataset.id || planets[0]?.id || 'b612';

    // Render Planet Tabs
    tabsContainer.innerHTML = planets.map(p => `
      <button class="journal-tab ${p.id === activePlanetId ? 'tab-active' : ''}" data-id="${p.id}">
        ${p.name}
      </button>
    `).join('') + `<button id="btn-journal-add-planet" class="journal-tab tab-add">+ Add Subject</button>`;

    // Render Tasks for Active Tab
    const tasks = await TaskManager.getTasksByPlanet(activePlanetId);
    taskListContainer.innerHTML = `
      <div class="journal-tasks-wrapper">
        ${TaskManager.renderTaskListHTML(tasks)}
      </div>
    `;

    // Tab Selection Event Listeners
    tabsContainer.querySelectorAll('.journal-tab[data-id]').forEach(tab => {
      tab.addEventListener('click', async () => {
        tabsContainer.querySelectorAll('.journal-tab').forEach(t => t.classList.remove('tab-active'));
        tab.classList.add('tab-active');
        const pId = tab.dataset.id;
        const pTasks = await TaskManager.getTasksByPlanet(pId);
        taskListContainer.innerHTML = `<div class="journal-tasks-wrapper">${TaskManager.renderTaskListHTML(pTasks)}</div>`;
        TaskManager.bindTaskEvents(taskListContainer, pId);
      });
    });

    TaskManager.bindTaskEvents(taskListContainer, activePlanetId);
  }

  static bindTaskEvents(container, planetId) {
    // 1. Checkbox Toggle
    container.querySelectorAll('.task-toggle').forEach(checkbox => {
      checkbox.addEventListener('change', async (e) => {
        const taskId = e.target.dataset.id;
        await TaskManager.toggleTaskCompletion(taskId);
      });
    });

    // 2. Delete Task Button
    container.querySelectorAll('.btn-delete-task').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const taskId = e.target.dataset.id;
        await TaskManager.deleteTask(taskId);
      });
    });

    // 3. Add Task Form Handler
    const addTaskForm = container.querySelector('#form-add-task');
    addTaskForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = container.querySelector('#task-title').value;
      const priority = container.querySelector('#task-priority').value;
      const deadline = container.querySelector('#task-deadline').value;
      const notes = container.querySelector('#task-notes').value;

      await TaskManager.addTask({
        planetId,
        title,
        priority,
        deadline,
        notes
      });
    });
  }
}
