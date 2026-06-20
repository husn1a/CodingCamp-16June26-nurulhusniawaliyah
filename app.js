/**
 * To-Do Life Dashboard — app.js
 *
 * Zero-dependency, single-file JavaScript application.
 * Modules are organised as IIFE namespaces; wired together in bootstrap().
 *
 * @typedef {{ id: string, description: string, completed: boolean }} Task
 * @typedef {{ id: string, label: string, url: string }} Link
 */

'use strict';

/* =========================================================
   Utility — UUID Generation
   Uses crypto.randomUUID() where available (Chrome 92+, Firefox 95+,
   Safari 15.4+). Falls back to Math.random for older Safari.
   ========================================================= */

/**
 * Generate a UUID v4 string.
 * @returns {string} UUID v4
 */
function generateUUID() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  // Math.random fallback (RFC 4122-compliant structure, not cryptographically secure)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/* =========================================================
   StorageModule
   Thin wrapper around localStorage with JSON serialisation
   and error isolation.
   ========================================================= */
const StorageModule = (function () {
  const KEYS = {
    TODOS: 'tld_todos',
    LINKS: 'tld_links',
  };

  /**
   * Load tasks from localStorage.
   * @returns {Task[]} Parsed tasks or empty array on failure.
   */
  function loadTodos() {
    try {
      const raw = localStorage.getItem(KEYS.TODOS);
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Persist tasks to localStorage.
   * @param {Task[]} tasks
   * @returns {boolean} true on success, false on failure.
   */
  function saveTodos(tasks) {
    try {
      localStorage.setItem(KEYS.TODOS, JSON.stringify(tasks));
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Load links from localStorage.
   * @returns {Link[]} Parsed links or empty array on failure.
   */
  function loadLinks() {
    try {
      const raw = localStorage.getItem(KEYS.LINKS);
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Persist links to localStorage.
   * @param {Link[]} links
   * @returns {boolean} true on success, false on failure.
   */
  function saveLinks(links) {
    try {
      localStorage.setItem(KEYS.LINKS, JSON.stringify(links));
      return true;
    } catch (e) {
      return false;
    }
  }

  return { KEYS, loadTodos, saveTodos, loadLinks, saveLinks };
})();

/* =========================================================
   GreetingModule
   Displays the current time, date, and a time-of-day greeting.
   Refreshes every minute.
   ========================================================= */
const GreetingModule = (function () {
  /** Hardcoded English day names (index matches Date.getDay()). */
  const DAY_NAMES = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday',
  ];

  /** Hardcoded English month names (index matches Date.getMonth()). */
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  /**
   * Return a greeting string for the given hour (0–23).
   * Non-integer, out-of-range, or non-number values return "".
   * @param {number} hour Integer in [0..23]
   * @returns {string} Greeting text or empty string.
   */
  function getGreeting(hour) {
    // Guard: must be a finite number with no fractional part, in [0..23]
    if (
      typeof hour !== 'number' ||
      !isFinite(hour) ||
      hour !== Math.floor(hour) ||
      hour < 0 ||
      hour > 23
    ) {
      return '';
    }

    if (hour >= 5 && hour <= 11) return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    if (hour >= 18 && hour <= 21) return 'Good Evening';
    if (hour >= 22 && hour <= 23) return 'Good Night';
    // hour 0–4
    return '';
  }

  /**
   * Format a Date as "HH:MM" (24-hour, zero-padded).
   * @param {Date} date
   * @returns {string}
   */
  function formatTime(date) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return hh + ':' + mm;
  }

  /**
   * Format a Date as "Weekday, DD Month YYYY".
   * Uses hardcoded English locale arrays — no Intl dependency.
   * @param {Date} date
   * @returns {string}
   */
  function formatDate(date) {
    const weekday = DAY_NAMES[date.getDay()];
    const dd = String(date.getDate()).padStart(2, '0');
    const month = MONTH_NAMES[date.getMonth()];
    const yyyy = date.getFullYear();
    return weekday + ', ' + dd + ' ' + month + ' ' + yyyy;
  }

  /**
   * Read the current time and update DOM elements:
   *   #greeting-text, #current-time, #current-date
   */
  function tick() {
    const now = new Date();

    const greetingEl = document.getElementById('greeting-text');
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date');

    if (greetingEl) greetingEl.innerText = getGreeting(now.getHours());
    if (timeEl) timeEl.innerText = formatTime(now);
    if (dateEl) dateEl.innerText = formatDate(now);
  }

  /**
   * Initialise the greeting widget:
   * - Render immediately via tick().
   * - Align to the next full minute using setTimeout, then tick every 60 s.
   */
  function init() {
    tick();

    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    setTimeout(function () {
      tick();
      setInterval(tick, 60000);
    }, msUntilNextMinute);
  }

  return { getGreeting, formatTime, formatDate, tick, init };
})();

/* =========================================================
   TimerModule
   Manages a 25-minute countdown with states:
   IDLE | RUNNING | PAUSED | ENDED
   ========================================================= */
const TimerModule = (function () {
  /** @type {{ state: string, remainingSeconds: number, intervalId: number|null }} */
  const _state = {
    state: 'IDLE',
    remainingSeconds: 1500, // 25 * 60
    intervalId: null,
  };

  /**
   * Format total seconds as "MM:SS" (zero-padded).
   * @param {number} totalSeconds Integer in [0..1500]
   * @returns {string}
   */
  function formatTime(totalSeconds) {
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    return mm + ':' + ss;
  }

  /**
   * Return the current state label.
   * @returns {string}
   */
  function getState() {
    return _state.state;
  }

  /** Decrement remaining seconds; handle ENDED transition. */
  function tick() {
    _state.remainingSeconds -= 1;

    const displayEl = document.getElementById('timer-display');
    if (displayEl) displayEl.innerText = formatTime(_state.remainingSeconds);

    if (_state.remainingSeconds <= 0) {
      _state.state = 'ENDED';
      clearInterval(_state.intervalId);
      _state.intervalId = null;

      const endedEl = document.getElementById('timer-ended-indicator');
      if (endedEl) endedEl.removeAttribute('hidden');
    }
  }

  /** Initialise timer to IDLE / 25:00 and bind button handlers. */
  function init() {
    _state.state = 'IDLE';
    _state.remainingSeconds = 1500;
    _state.intervalId = null;

    const displayEl = document.getElementById('timer-display');
    if (displayEl) displayEl.innerText = formatTime(1500);

    const endedEl = document.getElementById('timer-ended-indicator');
    if (endedEl) endedEl.setAttribute('hidden', '');

    const btnStart = document.getElementById('btn-start');
    const btnStop = document.getElementById('btn-stop');
    const btnReset = document.getElementById('btn-reset');

    if (btnStart) btnStart.addEventListener('click', start);
    if (btnStop) btnStop.addEventListener('click', stop);
    if (btnReset) btnReset.addEventListener('click', reset);
  }

  /** Transition IDLE/PAUSED → RUNNING. */
  function start() {
    // Silently ignore if ENDED (Req 2.8)
    if (_state.state === 'ENDED') return;

    if (_state.state === 'IDLE' || _state.state === 'PAUSED') {
      _state.state = 'RUNNING';
      _state.intervalId = setInterval(tick, 1000);
    }
  }

  /** Transition RUNNING → PAUSED. */
  function stop() {
    if (_state.state === 'RUNNING') {
      _state.state = 'PAUSED';
      clearInterval(_state.intervalId);
      _state.intervalId = null;
    }
  }

  /** Any state → IDLE; restore 25:00. */
  function reset() {
    clearInterval(_state.intervalId);
    _state.intervalId = null;
    _state.state = 'IDLE';
    _state.remainingSeconds = 1500;

    const displayEl = document.getElementById('timer-display');
    if (displayEl) displayEl.innerText = formatTime(1500);

    const endedEl = document.getElementById('timer-ended-indicator');
    if (endedEl) endedEl.setAttribute('hidden', '');
  }

  return { formatTime, getState, tick, init, start, stop, reset,
           // Expose remaining seconds for testing
           get remainingSeconds() { return _state.remainingSeconds; } };
})();

/* =========================================================
   TodoModule
   Manages a mutable ordered list of Task objects.
   Supports add, edit, complete-toggle, and delete.
   ========================================================= */
const TodoModule = (function () {
  /** @type {Task[]} In-memory task list — single source of truth. */
  let _tasks = [];

  /** @type {string|null} ID of the task currently in edit mode, or null. */
  let _editingId = null;

  /**
   * Flag to prevent blur→cancelEditMode firing when the user clicks Save.
   * mousedown on Save sets this true; the blur handler skips cancel if true.
   */
  let _isSaving = false;

  /**
   * Validate a task description: non-empty (trimmed), ≤ 500 characters.
   * @param {string} value
   * @returns {boolean}
   */
  function isValidDescription(value) {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    return trimmed.length >= 1 && trimmed.length <= 500;
  }

  /**
   * Add a new task with the given description.
   * @param {string} description
   * @returns {boolean} false if invalid.
   */
  function addTask(description) {
    if (!isValidDescription(description)) return false;

    const id = generateUUID();
    const task = { id, description: description.trim(), completed: false };
    _tasks.push(task);
    StorageModule.saveTodos(_tasks);
    render();
    return true;
  }

  /**
   * Update the description of an existing task.
   * @param {string} id
   * @param {string} newDescription
   * @returns {boolean} false if invalid.
   */
  function editTask(id, newDescription) {
    if (!isValidDescription(newDescription)) return false;

    const task = _tasks.find(function (t) { return t.id === id; });
    if (!task) return false;

    task.description = newDescription.trim();
    StorageModule.saveTodos(_tasks);
    render();
    return true;
  }

  /**
   * Flip the completed state of a task.
   * @param {string} id
   */
  function toggleTask(id) {
    const task = _tasks.find(function (t) { return t.id === id; });
    if (!task) return;
    task.completed = !task.completed;
    StorageModule.saveTodos(_tasks);
    render();
  }

  /**
   * Remove a task from the list.
   * @param {string} id
   */
  function deleteTask(id) {
    _tasks = _tasks.filter(function (t) { return t.id !== id; });
    StorageModule.saveTodos(_tasks);
    render();
  }

  /**
   * Enter edit mode for a task; cancel any existing edit first.
   * @param {string} id
   */
  function enterEditMode(id) {
    // Enforce single-edit-at-a-time (Req 4.7)
    cancelEditMode();

    const task = _tasks.find(function (t) { return t.id === id; });
    if (!task) return;

    const li = document.querySelector('[data-id="' + id + '"]');
    if (!li) return;

    // Remove the existing display span
    const existingSpan = li.querySelector('.task-label');
    if (existingSpan) li.removeChild(existingSpan);

    // Create the edit input pre-filled with current description
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = task.description;
    input.setAttribute('aria-label', 'Edit task description');

    // Create the Save button
    const btnSave = document.createElement('button');
    btnSave.className = 'btn-save';
    btnSave.textContent = 'Save';

    // mousedown on Save sets the flag so blur doesn't cancel the edit
    btnSave.addEventListener('mousedown', function () {
      _isSaving = true;
    });

    // Save button click — confirm the edit
    btnSave.addEventListener('click', function () {
      _isSaving = false;
      editTask(id, input.value);
    });

    // Keyboard: Enter confirms, Escape cancels
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        _isSaving = false;
        editTask(id, input.value);
      } else if (e.key === 'Escape') {
        cancelEditMode();
      }
    });

    // Blur cancels unless the user is clicking Save
    input.addEventListener('blur', function () {
      if (_isSaving) {
        _isSaving = false;
        return;
      }
      cancelEditMode();
    });

    // Insert the input before the Edit button
    const btnEdit = li.querySelector('.btn-edit');
    li.insertBefore(input, btnEdit);
    li.insertBefore(btnSave, btnEdit);

    // Track the active edit and focus the input
    _editingId = id;
    input.focus();
  }

  /** Cancel any active edit without saving. */
  function cancelEditMode() {
    if (_editingId === null) return;

    const id = _editingId;
    _editingId = null;
    _isSaving = false;

    const task = _tasks.find(function (t) { return t.id === id; });
    if (!task) return;

    const li = document.querySelector('[data-id="' + id + '"]');
    if (!li) return;

    // Remove the edit input and Save button
    const input = li.querySelector('.task-edit-input');
    const btnSave = li.querySelector('.btn-save');
    if (input) li.removeChild(input);
    if (btnSave) li.removeChild(btnSave);

    // Restore the original display span
    const span = document.createElement('span');
    span.className = 'task-label';
    span.textContent = task.description;

    const btnEdit = li.querySelector('.btn-edit');
    li.insertBefore(span, btnEdit);
  }

  /** Re-render the #todo-items list from the in-memory array. */
  function render() {
    const ul = document.getElementById('todo-items');
    if (!ul) return;

    ul.innerHTML = '';

    _tasks.forEach(function (task) {
      const li = document.createElement('li');
      li.setAttribute('data-id', task.id);
      if (task.completed) li.classList.add('completed');

      // Checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.setAttribute(
        'aria-label',
        task.completed ? 'Mark task incomplete' : 'Mark task complete'
      );
      checkbox.addEventListener('change', function () {
        toggleTask(task.id);
      });

      // Description label
      const span = document.createElement('span');
      span.className = 'task-label';
      span.textContent = task.description;

      // Edit button
      const btnEdit = document.createElement('button');
      btnEdit.className = 'btn-edit';
      btnEdit.textContent = 'Edit';
      btnEdit.addEventListener('click', function () {
        enterEditMode(task.id);
      });

      // Delete button
      const btnDelete = document.createElement('button');
      btnDelete.className = 'btn-delete';
      btnDelete.textContent = 'Delete';
      btnDelete.addEventListener('click', function () {
        deleteTask(task.id);
      });

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(btnEdit);
      li.appendChild(btnDelete);
      ul.appendChild(li);
    });
  }

  /** Load tasks from StorageModule and render. */
  function init() {
    _tasks = StorageModule.loadTodos();
    render();

    const form = document.getElementById('todo-add-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const input = document.getElementById('todo-input');
        if (!input) return;
        const success = addTask(input.value);
        if (success) {
          input.value = '';
        }
      });
    }
  }

  return {
    isValidDescription,
    addTask,
    editTask,
    toggleTask,
    deleteTask,
    enterEditMode,
    cancelEditMode,
    render,
    init,
    // Expose internal state accessor for testing
    get tasks() { return _tasks; },
  };
})();

/* =========================================================
   QuickLinksModule
   Manages user-defined shortcut links.
   Supports add, delete, and URL validation.
   ========================================================= */
const QuickLinksModule = (function () {
  /** @type {Link[]} In-memory links list — single source of truth. */
  let _links = [];

  /**
   * Validate a link label: 1–100 characters (trimmed).
   * @param {string} label
   * @returns {boolean}
   */
  function isValidLinkLabel(label) {
    // Placeholder — implemented in Task 10.1
    return false;
  }

  /**
   * Validate a link URL: 1–2048 characters, starts with http:// or https://.
   * @param {string} url
   * @returns {boolean}
   */
  function isValidLinkUrl(url) {
    // Placeholder — implemented in Task 10.1
    return false;
  }

  /**
   * Validate both label and URL together.
   * @param {string} label
   * @param {string} url
   * @returns {{ valid: boolean, error: string }}
   */
  function validateAddLink(label, url) {
    // Placeholder — implemented in Task 10.1
    return { valid: false, error: '' };
  }

  /**
   * Add a new link to the panel.
   * @param {string} label
   * @param {string} url
   * @returns {boolean} false on validation failure or storage error.
   */
  function addLink(label, url) {
    // Placeholder — implemented in Task 11.1
    return false;
  }

  /**
   * Remove a link from the panel.
   * @param {string} id
   */
  function deleteLink(id) {
    // Placeholder — implemented in Task 11.1
  }

  /**
   * Open a URL in a new tab if the URL is valid.
   * @param {string} url
   */
  function navigateLink(url) {
    // Placeholder — implemented in Task 11.1
  }

  /** Re-render the #links-panel from the in-memory array. */
  function render() {
    // Placeholder — implemented in Task 10.2
  }

  /** Load links from StorageModule and render. */
  function init() {
    // Placeholder — implemented in Task 10.2
  }

  return {
    isValidLinkLabel,
    isValidLinkUrl,
    validateAddLink,
    addLink,
    deleteLink,
    navigateLink,
    render,
    init,
    // Expose internal state accessor for testing
    get links() { return _links; },
  };
})();

/* =========================================================
   Bootstrap
   Wires all modules together on DOMContentLoaded.
   ========================================================= */

/**
 * Initialise the entire dashboard application.
 * Called once when the DOM is fully loaded.
 */
function bootstrap() {
  GreetingModule.init();
  TimerModule.init();
  TodoModule.init();
  QuickLinksModule.init();
}

document.addEventListener('DOMContentLoaded', bootstrap);
