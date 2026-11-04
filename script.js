/**
 * ============================================================================
 * CodeLane // Developer Kanban Board
 * Pure Vanilla JavaScript (ES6+) Architecture
 * ============================================================================
 */

'use strict';

/* ----------------------------------------------------------------------------
   1. State & Storage Constants
   ---------------------------------------------------------------------------- */

/**
 * Storage keys used for browser localStorage persistence.
 */
const STORAGE_KEYS = {
  TASKS: 'codelane_tasks',
  THEME: 'codelane_theme'
};

/**
 * Central state array holding all task objects.
 * Task schema: { id: number, title: string, description: string, priority: string, due: string, status: string, createdAt: number }
 */
let tasks = [];

/**
 * Holds reference to the most recently deleted task for Undo support.
 */
let recentlyDeletedTask = null;
let toastTimeoutId = null;

/**
 * Default sample coding tasks loaded on first visit.
 */
const SAMPLE_TASKS = [
  {
    id: 1700000001000,
    title: 'Design database schema',
    description: 'Draft relational PostgreSQL ER diagram for users, projects, and tasks tables.',
    priority: 'high',
    due: getOffsetDateString(2),
    status: 'todo',
    createdAt: 1700000001000
  },
  {
    id: 1700000002000,
    title: 'Build REST API endpoints',
    description: 'Implement Express CRUD controllers with status codes and JWT token authentication.',
    priority: 'medium',
    due: getOffsetDateString(4),
    status: 'inprogress',
    createdAt: 1700000002000
  },
  {
    id: 1700000003000,
    title: 'Write project README',
    description: 'Document system architecture, setup commands, and viva talking points in markdown.',
    priority: 'low',
    due: getOffsetDateString(-1), // Purposely set yesterday to showcase overdue indicator
    status: 'done',
    createdAt: 1700000003000
  }
];

/* ----------------------------------------------------------------------------
   2. DOM Element Selectors
   ---------------------------------------------------------------------------- */
const DOM = {
  // Theme Toggle
  themeToggleBtn: document.getElementById('theme-toggle-btn'),

  // Stats & Progress
  statTotal: document.getElementById('stat-total'),
  statTodo: document.getElementById('stat-todo'),
  statInProgress: document.getElementById('stat-inprogress'),
  statDone: document.getElementById('stat-done'),
  progressPercent: document.getElementById('progress-percent'),
  progressBarFill: document.getElementById('progress-bar-fill'),
  distTodo: document.getElementById('dist-todo'),
  distInProgress: document.getElementById('dist-inprogress'),
  distDone: document.getElementById('dist-done'),

  // Toolbar
  searchInput: document.getElementById('search-input'),
  priorityFilter: document.getElementById('priority-filter'),
  sortSelect: document.getElementById('sort-select'),
  boardEmptyMessage: document.getElementById('board-empty-message'),
  clearFiltersBtn: document.getElementById('clear-filters-btn'),

  // Columns & Cards Containers
  cardsTodo: document.getElementById('cards-todo'),
  cardsInProgress: document.getElementById('cards-inprogress'),
  cardsDone: document.getElementById('cards-done'),
  emptyTodo: document.getElementById('empty-todo'),
  emptyInProgress: document.getElementById('empty-inprogress'),
  emptyDone: document.getElementById('empty-done'),
  countTodo: document.getElementById('count-todo'),
  countInProgress: document.getElementById('count-inprogress'),
  countDone: document.getElementById('count-done'),
  boardGrid: document.querySelector('.board-grid'),

  // Task Modal Form
  taskModal: document.getElementById('task-modal'),
  modalTitle: document.getElementById('modal-title'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  modalCancelBtn: document.getElementById('modal-cancel-btn'),
  taskForm: document.getElementById('task-form'),
  taskIdInput: document.getElementById('task-id'),
  taskTitleInput: document.getElementById('task-title'),
  taskDescInput: document.getElementById('task-desc'),
  taskPrioritySelect: document.getElementById('task-priority'),
  taskDueInput: document.getElementById('task-due'),
  taskStatusSelect: document.getElementById('task-status'),
  titleError: document.getElementById('title-error'),
  dueError: document.getElementById('due-error'),
  openNewTaskBtn: document.getElementById('open-new-task-btn'),

  // Confirm Modal
  confirmModal: document.getElementById('confirm-modal'),
  confirmModalTitle: document.getElementById('confirm-modal-title'),
  confirmModalMessage: document.getElementById('confirm-modal-message'),
  confirmCancelBtn: document.getElementById('confirm-cancel-btn'),
  confirmProceedBtn: document.getElementById('confirm-proceed-btn'),

  // Notifications
  toastContainer: document.getElementById('toast-container')
};

// Pending callback for confirmation dialog
let onConfirmCallback = null;

/* ----------------------------------------------------------------------------
   3. Initialization & Lifecycle
   ---------------------------------------------------------------------------- */

/**
 * Initializes the application: loads theme, loads tasks, attaches listeners, and renders.
 */
function initApp() {
  loadTheme();
  loadTasks();
  setupEventListeners();
  render();
}

/**
 * Helper to compute an ISO date string (YYYY-MM-DD) offset by days from today.
 * @param {number} daysOffset 
 * @returns {string} Date string formatted as YYYY-MM-DD
 */
function getOffsetDateString(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/* ----------------------------------------------------------------------------
   4. LocalStorage Data & Theme Persistence
   ---------------------------------------------------------------------------- */

/**
 * Restores user theme choice from localStorage.
 * Defaults to dark theme if no preference has been saved yet.
 */
function loadTheme() {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme === 'light') {
      document.body.classList.add('theme-light');
      updateThemeButtonUI(true);
    } else {
      document.body.classList.remove('theme-light');
      updateThemeButtonUI(false);
    }
  } catch (err) {
    console.warn('Could not read theme from localStorage:', err);
  }
}

/**
 * Toggles the theme between dark and light, updates DOM, and saves to localStorage.
 */
function toggleTheme() {
  const isCurrentlyLight = document.body.classList.toggle('theme-light');
  updateThemeButtonUI(isCurrentlyLight);
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, isCurrentlyLight ? 'light' : 'dark');
  } catch (err) {
    console.warn('Could not save theme preference to localStorage:', err);
  }
}

/**
 * Updates the theme button icon and text for clarity.
 * @param {boolean} isLight 
 */
function updateThemeButtonUI(isLight) {
  if (!DOM.themeToggleBtn) return;
  const iconSpan = DOM.themeToggleBtn.querySelector('.theme-icon');
  const labelSpan = DOM.themeToggleBtn.querySelector('.theme-label');

  if (isLight) {
    if (iconSpan) iconSpan.textContent = '🌙';
    if (labelSpan) labelSpan.textContent = 'Dark';
    DOM.themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
  } else {
    if (iconSpan) iconSpan.textContent = '☀️';
    if (labelSpan) labelSpan.textContent = 'Light';
    DOM.themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
  }
}

/**
 * Safely loads tasks from localStorage with try/catch.
 * If visiting for the first time, seeds SAMPLE_TASKS.
 * If data is corrupted, catches the error and recovers safely.
 */
function loadTasks() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEYS.TASKS);

    // 1. First visit check: key is null
    if (rawData === null) {
      tasks = [...SAMPLE_TASKS];
      saveTasks();
      return;
    }

    // 2. Parse JSON
    const parsed = JSON.parse(rawData);

    // 3. Schema validation check: must be an array
    if (Array.isArray(parsed)) {
      tasks = parsed;
    } else {
      throw new Error('Stored data is not a valid task array.');
    }
  } catch (err) {
    console.error('Failed to load or parse tasks from localStorage. Recovering with sample data:', err);
    tasks = [...SAMPLE_TASKS];
    saveTasks();
    showToast('Corrupted data detected. Restored default sample tasks.', 'error');
  }
}

/**
 * Safely serializes and saves the central tasks array into localStorage.
 * Wrapped in try/catch to gracefully handle QuotaExceededError or disabled storage.
 * @returns {boolean} Whether save succeeded
 */
function saveTasks() {
  try {
    const serialized = JSON.stringify(tasks);
    localStorage.setItem(STORAGE_KEYS.TASKS, serialized);
    return true;
  } catch (err) {
    console.error('Error saving tasks to localStorage:', err);
    showToast('Storage quota exceeded or storage disabled.', 'error');
    return false;
  }
}

/* ----------------------------------------------------------------------------
   5. Rendering Architecture (Data -> Save -> Render)
   ---------------------------------------------------------------------------- */

/**
 * Central orchestrator that redraws the whole UI to reflect current data state.
 */
function render() {
  updateDashboard();
  renderBoard();
}

/**
 * Updates the Overview Strip: Total, To Do, In Progress, Done, Progress Bar, and Distribution Bar.
 */
function updateDashboard() {
  const total = tasks.length;
  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'inprogress').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  // Update numerical metric values
  DOM.statTotal.textContent = total;
  DOM.statTodo.textContent = todoCount;
  DOM.statInProgress.textContent = inProgressCount;
  DOM.statDone.textContent = doneCount;

  // Calculate and update completion percentage
  const percentage = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  DOM.progressPercent.textContent = `${percentage}%`;
  DOM.progressBarFill.style.width = `${percentage}%`;

  // Update segmented distribution breakdown bar
  if (total > 0) {
    DOM.distTodo.style.width = `${(todoCount / total) * 100}%`;
    DOM.distInProgress.style.width = `${(inProgressCount / total) * 100}%`;
    DOM.distDone.style.width = `${(doneCount / total) * 100}%`;
  } else {
    DOM.distTodo.style.width = '0%';
    DOM.distInProgress.style.width = '0%';
    DOM.distDone.style.width = '0%';
  }
}

/**
 * Renders task cards into the three board columns based on visible filtered items.
 */
function renderBoard() {
  // Clear existing card elements in all three columns
  DOM.cardsTodo.innerHTML = '';
  DOM.cardsInProgress.innerHTML = '';
  DOM.cardsDone.innerHTML = '';

  const visibleTasks = getVisibleTasks();

  // Buckets for column tasks
  const todoTasks = [];
  const inProgressTasks = [];
  const doneTasks = [];

  visibleTasks.forEach(task => {
    if (task.status === 'inprogress') {
      inProgressTasks.push(task);
    } else if (task.status === 'done') {
      doneTasks.push(task);
    } else {
      todoTasks.push(task);
    }
  });

  // Render cards safely using document.createElement
  todoTasks.forEach(task => DOM.cardsTodo.appendChild(createTaskCardElement(task)));
  inProgressTasks.forEach(task => DOM.cardsInProgress.appendChild(createTaskCardElement(task)));
  doneTasks.forEach(task => DOM.cardsDone.appendChild(createTaskCardElement(task)));

  // Update live column count badges
  DOM.countTodo.textContent = todoTasks.length;
  DOM.countInProgress.textContent = inProgressTasks.length;
  DOM.countDone.textContent = doneTasks.length;

  // Show or hide empty state placeholders per column
  DOM.emptyTodo.style.display = todoTasks.length === 0 ? 'flex' : 'none';
  DOM.emptyInProgress.style.display = inProgressTasks.length === 0 ? 'flex' : 'none';
  DOM.emptyDone.style.display = doneTasks.length === 0 ? 'flex' : 'none';

  // Show global empty state message if search/filter returned 0 results
  if (tasks.length > 0 && visibleTasks.length === 0) {
    DOM.boardEmptyMessage.hidden = false;
  } else {
    DOM.boardEmptyMessage.hidden = true;
  }
}

/**
 * Helper to determine if a task is overdue.
 * A task is overdue if today's date > due date AND status is NOT 'done'.
 * @param {Object} task 
 * @returns {boolean}
 */
function isTaskOverdue(task) {
  if (task.status === 'done' || !task.due) return false;
  const todayStr = getOffsetDateString(0);
  return task.due < todayStr;
}

/**
 * Constructs a DOM Element for a single task card.
 * Uses textContent for all user-entered text to avoid XSS vulnerabilities.
 * @param {Object} task 
 * @returns {HTMLElement} article.task-card
 */
function createTaskCardElement(task) {
  const card = document.createElement('article');
  card.className = 'task-card';
  card.setAttribute('data-id', String(task.id));
  card.setAttribute('draggable', 'true');
  card.setAttribute('tabindex', '0');

  const overdue = isTaskOverdue(task);
  if (overdue) {
    card.classList.add('is-overdue');
  }

  // --- 1. Card Header (Title & Priority Badge) ---
  const header = document.createElement('header');
  header.className = 'card-header';

  const titleEl = document.createElement('h3');
  titleEl.className = 'card-title';
  titleEl.textContent = task.title;

  const priorityBadge = document.createElement('span');
  priorityBadge.className = `badge-priority badge-priority-${task.priority}`;
  priorityBadge.textContent = task.priority;

  header.appendChild(titleEl);
  header.appendChild(priorityBadge);
  card.appendChild(header);

  // --- 2. Card Description (if present) ---
  if (task.description && task.description.trim() !== '') {
    const descEl = document.createElement('p');
    descEl.className = 'card-desc';
    descEl.textContent = task.description;
    card.appendChild(descEl);
  }

  // --- 3. Card Metadata (Due Date & Overdue Tag) ---
  const meta = document.createElement('div');
  meta.className = 'card-meta';

  const dueEl = document.createElement('span');
  dueEl.className = 'card-due';
  dueEl.textContent = `📅 ${task.due || 'No due date'}`;
  meta.appendChild(dueEl);

  if (overdue) {
    const overdueBadge = document.createElement('span');
    overdueBadge.className = 'badge-overdue';
    overdueBadge.textContent = 'Overdue';
    meta.appendChild(overdueBadge);
  }

  card.appendChild(meta);

  // --- 4. Card Action Buttons (Move Left/Right, Edit, Delete) ---
  const actions = document.createElement('footer');
  actions.className = 'card-actions';

  // Navigation group (Move Left / Right)
  const navGroup = document.createElement('div');
  navGroup.className = 'card-actions-nav';

  const moveLeftBtn = document.createElement('button');
  moveLeftBtn.type = 'button';
  moveLeftBtn.className = 'card-btn card-btn-move-left';
  moveLeftBtn.textContent = '←';
  moveLeftBtn.title = 'Move left';
  moveLeftBtn.setAttribute('aria-label', `Move ${task.title} to previous column`);
  if (task.status === 'todo') {
    moveLeftBtn.disabled = true;
  }

  const moveRightBtn = document.createElement('button');
  moveRightBtn.type = 'button';
  moveRightBtn.className = 'card-btn card-btn-move-right';
  moveRightBtn.textContent = '→';
  moveRightBtn.title = 'Move right';
  moveRightBtn.setAttribute('aria-label', `Move ${task.title} to next column`);
  if (task.status === 'done') {
    moveRightBtn.disabled = true;
  }

  navGroup.appendChild(moveLeftBtn);
  navGroup.appendChild(moveRightBtn);

  // CRUD group (Edit & Delete)
  const crudGroup = document.createElement('div');
  crudGroup.className = 'card-actions-crud';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'card-btn card-btn-edit';
  editBtn.textContent = '✏️ Edit';
  editBtn.title = 'Edit task';
  editBtn.setAttribute('aria-label', `Edit task ${task.title}`);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'card-btn card-btn-delete';
  deleteBtn.textContent = '🗑️';
  deleteBtn.title = 'Delete task';
  deleteBtn.setAttribute('aria-label', `Delete task ${task.title}`);

  crudGroup.appendChild(editBtn);
  crudGroup.appendChild(deleteBtn);

  actions.appendChild(navGroup);
  actions.appendChild(crudGroup);
  card.appendChild(actions);

  return card;
}

/**
 * Filter and sort visible tasks.
 * Supports live search, priority filtering, and sorting.
 * @returns {Array<Object>}
 */
function getVisibleTasks() {
  const searchTerm = DOM.searchInput ? DOM.searchInput.value.trim().toLowerCase() : '';
  const selectedPriority = DOM.priorityFilter ? DOM.priorityFilter.value : 'all';
  const sortMode = DOM.sortSelect ? DOM.sortSelect.value : 'created-desc';

  // 1. Filter by Search Query & Priority
  let filtered = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
      (task.description && task.description.toLowerCase().includes(searchTerm));
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    return matchesSearch && matchesPriority;
  });

  // 2. Sort results
  filtered.sort((a, b) => {
    if (sortMode === 'due-asc') {
      return (a.due || '').localeCompare(b.due || '');
    }
    if (sortMode === 'priority-desc') {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    }
    // Default: 'created-desc'
    return (b.createdAt || b.id) - (a.createdAt || a.id);
  });

  return filtered;
}

/* ----------------------------------------------------------------------------
   6. CRUD Operations (Add, Edit, Delete, Move)
   ---------------------------------------------------------------------------- */

/**
 * Opens the modal dialog to create a new task or edit an existing one.
 * @param {Object|null} taskToEdit 
 * @param {string} defaultStatus 
 */
function openTaskModal(taskToEdit = null, defaultStatus = 'todo') {
  clearValidationErrors();

  if (taskToEdit) {
    // Editing Mode
    DOM.modalTitle.textContent = 'Edit Task';
    DOM.taskIdInput.value = String(taskToEdit.id);
    DOM.taskTitleInput.value = taskToEdit.title;
    DOM.taskDescInput.value = taskToEdit.description || '';
    DOM.taskPrioritySelect.value = taskToEdit.priority;
    DOM.taskDueInput.value = taskToEdit.due;
    DOM.taskStatusSelect.value = taskToEdit.status;
  } else {
    // Creation Mode
    DOM.modalTitle.textContent = 'Create Task';
    DOM.taskForm.reset();
    DOM.taskIdInput.value = '';
    DOM.taskPrioritySelect.value = 'medium';
    DOM.taskStatusSelect.value = defaultStatus;
    DOM.taskDueInput.value = getOffsetDateString(3); // Default due date in 3 days
  }

  DOM.taskModal.hidden = false;
  DOM.taskTitleInput.focus();
}

/**
 * Closes the task creation / editing modal.
 */
function closeTaskModal() {
  DOM.taskModal.hidden = true;
  DOM.taskForm.reset();
  clearValidationErrors();
}

/**
 * Clears visual error labels and invalid field borders.
 */
function clearValidationErrors() {
  DOM.titleError.textContent = '';
  DOM.dueError.textContent = '';
  DOM.taskTitleInput.classList.remove('is-invalid');
  DOM.taskDueInput.classList.remove('is-invalid');
}

/**
 * Validates modal inputs and returns whether the form is valid.
 * @returns {boolean}
 */
function validateTaskForm() {
  clearValidationErrors();
  let isValid = true;

  const titleVal = DOM.taskTitleInput.value.trim();
  if (!titleVal) {
    DOM.titleError.textContent = 'Task title is required.';
    DOM.taskTitleInput.classList.add('is-invalid');
    isValid = false;
  } else if (titleVal.length < 3) {
    DOM.titleError.textContent = 'Task title must be at least 3 characters.';
    DOM.taskTitleInput.classList.add('is-invalid');
    isValid = false;
  }

  const dueVal = DOM.taskDueInput.value.trim();
  if (!dueVal) {
    DOM.dueError.textContent = 'Due date is required.';
    DOM.taskDueInput.classList.add('is-invalid');
    isValid = false;
  }

  return isValid;
}

/**
 * Handles form submission for both Creating and Updating tasks.
 * Follows the pattern: Mutate Data -> Save to localStorage -> Render UI.
 * @param {Event} e 
 */
function handleTaskFormSubmit(e) {
  e.preventDefault();

  if (!validateTaskForm()) {
    return;
  }

  const idVal = DOM.taskIdInput.value.trim();
  const title = DOM.taskTitleInput.value.trim();
  const description = DOM.taskDescInput.value.trim();
  const priority = DOM.taskPrioritySelect.value;
  const due = DOM.taskDueInput.value;
  const status = DOM.taskStatusSelect.value;

  if (idVal) {
    // --- UPDATE EXISTING TASK ---
    const numericId = Number(idVal);
    const existingIndex = tasks.findIndex(t => t.id === numericId);

    if (existingIndex !== -1) {
      tasks[existingIndex] = {
        ...tasks[existingIndex],
        title,
        description,
        priority,
        due,
        status
      };
      saveTasks();
      render();
      closeTaskModal();
      showToast('Task updated successfully.', 'success');
    }
  } else {
    // --- CREATE NEW TASK ---
    const newTask = {
      id: Date.now(),
      title,
      description,
      priority,
      due,
      status,
      createdAt: Date.now()
    };

    tasks.push(newTask);
    saveTasks();
    render();
    closeTaskModal();
    showToast('Task created successfully.', 'success');
  }
}

/**
 * Deletes a task by ID, stores it for Undo, saves and renders.
 * @param {number} taskId 
 */
function deleteTask(taskId) {
  const index = tasks.findIndex(t => t.id === taskId);
  if (index === -1) return;

  recentlyDeletedTask = {
    task: tasks[index],
    index: index
  };

  tasks.splice(index, 1);
  saveTasks();
  render();
  showToast('Task deleted.', 'info', true);
}

/**
 * Restores the most recently deleted task.
 */
function undoDelete() {
  if (!recentlyDeletedTask) return;

  // Insert back at original index or append if out of bounds
  const targetIndex = Math.min(recentlyDeletedTask.index, tasks.length);
  tasks.splice(targetIndex, 0, recentlyDeletedTask.task);

  recentlyDeletedTask = null;
  saveTasks();
  render();
  showToast('Task deletion undone.', 'success');
}

/**
 * Moves a task to the next or previous column.
 * @param {number} taskId 
 * @param {'left'|'right'} direction 
 */
function moveTaskDirection(taskId, direction) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const sequence = ['todo', 'inprogress', 'done'];
  const currentIndex = sequence.indexOf(task.status);

  if (direction === 'left' && currentIndex > 0) {
    task.status = sequence[currentIndex - 1];
  } else if (direction === 'right' && currentIndex < sequence.length - 1) {
    task.status = sequence[currentIndex + 1];
  } else {
    return;
  }

  saveTasks();
  render();
}

/* ----------------------------------------------------------------------------
   7. Confirmation Dialog Modal
   ---------------------------------------------------------------------------- */

/**
 * Opens confirmation modal with customized title, message, and confirm button text.
 * @param {string} title 
 * @param {string} message 
 * @param {string} actionText 
 * @param {Function} onConfirm 
 */
function showConfirmModal(title, message, actionText = 'Delete', onConfirm) {
  DOM.confirmModalTitle.textContent = title;
  DOM.confirmModalMessage.textContent = message;
  DOM.confirmProceedBtn.textContent = actionText;
  onConfirmCallback = onConfirm;
  DOM.confirmModal.hidden = false;
  DOM.confirmProceedBtn.focus();
}

/**
 * Closes confirmation modal and clears pending callback.
 */
function closeConfirmModal() {
  DOM.confirmModal.hidden = true;
  onConfirmCallback = null;
}

/* ----------------------------------------------------------------------------
   8. Toast Notifications with Undo Capability
   ---------------------------------------------------------------------------- */

/**
 * Displays a toast notification on the bottom-right corner.
 * @param {string} message 
 * @param {'success'|'error'|'info'} type 
 * @param {boolean} showUndo 
 */
function showToast(message, type = 'info', showUndo = false) {
  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }

  DOM.toastContainer.innerHTML = '';

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');

  const textSpan = document.createElement('span');
  textSpan.className = 'toast-message';
  textSpan.textContent = message;
  toast.appendChild(textSpan);

  if (showUndo) {
    const undoBtn = document.createElement('button');
    undoBtn.type = 'button';
    undoBtn.className = 'toast-undo-btn';
    undoBtn.textContent = 'Undo';
    undoBtn.onclick = () => {
      undoDelete();
      DOM.toastContainer.innerHTML = '';
    };
    toast.appendChild(undoBtn);
  }

  DOM.toastContainer.appendChild(toast);

  toastTimeoutId = setTimeout(() => {
    DOM.toastContainer.innerHTML = '';
  }, 4500);
}

/* ----------------------------------------------------------------------------
   9. Event Delegation & Central Event Listeners
   ---------------------------------------------------------------------------- */

function setupEventListeners() {
  // --- Theme Toggle Listener ---
  if (DOM.themeToggleBtn) {
    DOM.themeToggleBtn.addEventListener('click', toggleTheme);
  }

  // --- Header Actions ---
  DOM.openNewTaskBtn.addEventListener('click', () => {
    openTaskModal(null, 'todo');
  });

  // --- Modal Form Events ---
  DOM.modalCloseBtn.addEventListener('click', closeTaskModal);
  DOM.modalCancelBtn.addEventListener('click', closeTaskModal);
  DOM.taskForm.addEventListener('submit', handleTaskFormSubmit);

  // Real-time input validation clearance
  DOM.taskTitleInput.addEventListener('input', () => {
    if (DOM.taskTitleInput.value.trim().length >= 3) {
      DOM.titleError.textContent = '';
      DOM.taskTitleInput.classList.remove('is-invalid');
    }
  });

  DOM.taskDueInput.addEventListener('input', () => {
    if (DOM.taskDueInput.value.trim()) {
      DOM.dueError.textContent = '';
      DOM.taskDueInput.classList.remove('is-invalid');
    }
  });

  // Close modals on clicking overlay backdrop
  DOM.taskModal.addEventListener('click', (e) => {
    if (e.target === DOM.taskModal) closeTaskModal();
  });

  DOM.confirmModal.addEventListener('click', (e) => {
    if (e.target === DOM.confirmModal) closeConfirmModal();
  });

  DOM.confirmCancelBtn.addEventListener('click', closeConfirmModal);
  DOM.confirmProceedBtn.addEventListener('click', () => {
    if (typeof onConfirmCallback === 'function') {
      onConfirmCallback();
    }
    closeConfirmModal();
  });

  // Global keydown (Escape to close modals)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!DOM.taskModal.hidden) closeTaskModal();
      if (!DOM.confirmModal.hidden) closeConfirmModal();
    }
  });

  // --- Column Header "+ Add" Buttons ---
  document.querySelectorAll('.add-col-task-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const colStatus = btn.getAttribute('data-status') || 'todo';
      openTaskModal(null, colStatus);
    });
  });

  // --- Event Delegation on the Kanban Board Grid ---
  // One single click listener handles Edit, Delete, Move Left, and Move Right on all cards!
  DOM.boardGrid.addEventListener('click', (e) => {
    const cardEl = e.target.closest('.task-card');
    if (!cardEl) return;

    const taskId = Number(cardEl.getAttribute('data-id'));
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Handle Edit
    if (e.target.closest('.card-btn-edit')) {
      openTaskModal(task);
      return;
    }

    // Handle Delete (with custom confirmation modal)
    if (e.target.closest('.card-btn-delete')) {
      showConfirmModal(
        'Delete Task',
        `Are you sure you want to delete "${task.title}"?`,
        'Delete',
        () => deleteTask(taskId)
      );
      return;
    }

    // Handle Move Left (←)
    if (e.target.closest('.card-btn-move-left')) {
      moveTaskDirection(taskId, 'left');
      return;
    }

    // Handle Move Right (→)
    if (e.target.closest('.card-btn-move-right')) {
      moveTaskDirection(taskId, 'right');
      return;
    }
  });

  // --- Toolbar Live Search & Filter Listeners ---
  DOM.searchInput.addEventListener('input', renderBoard);
  DOM.priorityFilter.addEventListener('change', renderBoard);
  DOM.sortSelect.addEventListener('change', renderBoard);

  if (DOM.clearFiltersBtn) {
    DOM.clearFiltersBtn.addEventListener('click', () => {
      DOM.searchInput.value = '';
      DOM.priorityFilter.value = 'all';
      DOM.sortSelect.value = 'created-desc';
      renderBoard();
    });
  }
}

// Kick off the application on DOM ready
document.addEventListener('DOMContentLoaded', initApp);
