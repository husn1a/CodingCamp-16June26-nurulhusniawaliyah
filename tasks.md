# Implementation Plan: To-Do Life Dashboard

## Overview

Build a zero-dependency, single-page web application (HTML + CSS + Vanilla JavaScript) with four independent widgets. All logic lives in three files: `index.html`, `styles.css`, and `app.js`. Modules are organised as IIFE namespaces and wired together in a `bootstrap()` function on `DOMContentLoaded`. Persistence is handled exclusively through `localStorage`. Property-based tests use **fast-check**.

---

## Tasks

- [x] 1. Set up project scaffold and data models
  - Create `index.html` with the full semantic markup skeleton: `<section>` elements for each widget (`#greeting-widget`, `#focus-timer`, `#todo-list`, `#quick-links`) with all `aria-label` attributes, IDs, and placeholder child elements defined in the design
  - Create `styles.css` with CSS custom properties (colour palette, spacing, typography) and the responsive `dashboard-grid` layout (`grid-template-areas`, two-column desktop, single-column mobile ≤ 1023 px)
  - Create `app.js` as an empty IIFE shell declaring the five module namespaces (`StorageModule`, `GreetingModule`, `TimerModule`, `TodoModule`, `QuickLinksModule`) and the `bootstrap()` function, called on `DOMContentLoaded`
  - Define the `Task` object shape `{ id, description, completed }` and the `Link` object shape `{ id, label, url }` as JSDoc typedefs at the top of `app.js`
  - Implement a `generateUUID()` helper using `crypto.randomUUID()` (with a `Math.random` fallback for older Safari)
  - _Requirements: 8.1, 8.4_

- [x] 2. Implement StorageModule
  - [x] 2.1 Implement `StorageModule.loadTodos` and `StorageModule.saveTodos`
    - `loadTodos()` reads key `"tld_todos"`, parses JSON, returns `Task[]`; on any error returns `[]`
    - `saveTodos(tasks)` serialises and writes; wraps `setItem` in `try/catch`; returns `boolean`
    - _Requirements: 3.4, 3.5, 5.4, 5.6_
  - [x] 2.2 Implement `StorageModule.loadLinks` and `StorageModule.saveLinks`
    - Mirror pattern of 2.1 but for key `"tld_links"` and `Link[]`
    - _Requirements: 7.4, 7.6, 7.7_

- [x] 3. Implement GreetingModule
  - [x] 3.1 Implement `GreetingModule.getGreeting(hour)`
    - Pure function: hour 5–11 → `"Good Morning"`, 12–17 → `"Good Afternoon"`, 18–21 → `"Good Evening"`, 22–23 → `"Good Night"`, 0–4 → `""`, any other value → `""`
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_
  - [x] 3.2 Implement `GreetingModule.formatTime(date)` and `GreetingModule.formatDate(date)`
    - `formatTime` returns `"HH:MM"` 24-hour zero-padded string
    - `formatDate` returns `"Weekday, DD Month YYYY"` using English locale names (hardcoded arrays, no `Intl` dependency)
    - _Requirements: 1.1, 1.2_
  - [x] 3.3 Implement `GreetingModule.tick()` and `GreetingModule.init()`
    - `tick()` calls `new Date()`, updates `#greeting-text`, `#current-time`, `#current-date` DOM elements
    - `init()` calls `tick()` once immediately, then schedules `setInterval(tick, 60000)` aligned to the next full minute
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  

- [x] 4. Checkpoint — Verify greeting widget and storage baseline
  - Ensure all tests pass, ask the user if questions arise.
 
- [x] 5. Implement TimerModule
  - [x] 5.1 Implement `TimerModule.formatTime(totalSeconds)`
    - Pure function: converts integer [0..1500] to `"MM:SS"` zero-padded string
    - _Requirements: 2.7_
  - [x] 5.2 Implement the timer state machine (`init`, `start`, `stop`, `reset`, `tick`, `getState`)
    - Internal state: `{ state: 'IDLE'|'RUNNING'|'PAUSED'|'ENDED', remainingSeconds: 1500, intervalId: null }`
    - `init()` sets IDLE + 1500, renders `#timer-display` as `"25:00"`, hides `#timer-ended-indicator`
    - `start()` transitions IDLE/PAUSED → RUNNING; ignored silently if state is ENDED (Req 2.8); starts `setInterval(tick, 1000)`
    - `stop()` transitions RUNNING → PAUSED; clears interval
    - `reset()` any state → IDLE; restores 1500, hides ended indicator, clears interval
    - `tick()` decrements `remainingSeconds`; on reaching 0 transitions to ENDED, clears interval, shows `#timer-ended-indicator`
    - Bind `#btn-start`, `#btn-stop`, `#btn-reset` click handlers
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8_


- [x] 6. Implement TodoModule — add and display
  - [x] 6.1 Implement `TodoModule.isValidDescription(value)`
    - Pure function: trims input, returns `true` iff length ≥ 1 and ≤ 500
    - _Requirements: 3.3, 4.4_
  - [x] 6.2 Implement `TodoModule.addTask(description)` and `TodoModule.render()`
    - `addTask` validates via `isValidDescription`, generates UUID, pushes to in-memory `tasks[]`, calls `StorageModule.saveTodos`, calls `render()`; returns `false` if invalid
    - `render()` rebuilds `#todo-items` `<ul>`: each `<li>` contains checkbox (with `aria-label`), `<span class="task-label">`, Edit button, Delete button; completed tasks get strikethrough style and `completed` class
    - Bind `#todo-add-form` submit handler; prevent default, clear input on success
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.2_
  - [x] 6.3 Implement `TodoModule.init()`
    - Calls `StorageModule.loadTodos()`, populates in-memory array, calls `render()`
    - _Requirements: 3.5_
  

- [x] 7. Implement TodoModule — edit tasks
  - [x] 7.1 Implement `TodoModule.enterEditMode(id)`, `TodoModule.cancelEditMode()`, `TodoModule.editTask(id, newDescription)`
    - `enterEditMode` calls `cancelEditMode()` first (enforces single edit mode), replaces task `<span>` with `<input>` pre-filled with current description + Save button; focuses the input
    - `editTask` validates via `isValidDescription`, updates in-memory task, persists, calls `render()`; returns `false` on invalid
    - `cancelEditMode` restores display without saving
    - Bind Save button click and Enter keydown on edit input to call `editTask`; bind Escape keydown and blur event to call `cancelEditMode`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  

- [x] 8. Implement TodoModule — complete and delete tasks
  - [x] 8.1 Implement `TodoModule.toggleTask(id)` and `TodoModule.deleteTask(id)`
    - `toggleTask` flips `completed` on the matching task, calls `StorageModule.saveTodos`, calls `render()`
    - `deleteTask` filters out matching task, calls `StorageModule.saveTodos`, calls `render()`
    - Bind checkbox `change` and Delete button `click` handlers inside `render()` using event delegation or direct binding
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  

- [x] 9. Checkpoint — Verify full TodoModule
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement QuickLinksModule — validation and display
  - [ ] 10.1 Implement `QuickLinksModule.isValidLinkLabel(label)`, `QuickLinksModule.isValidLinkUrl(url)`, `QuickLinksModule.validateAddLink(label, url)`
    - `isValidLinkLabel`: 1–100 chars (trimmed)
    - `isValidLinkUrl`: 1–2048 chars, starts with `http://` or `https://`
    - `validateAddLink`: combines both; returns `{ valid: boolean, error: string }`; error message names the invalid field(s)
    - _Requirements: 7.2, 7.3_
  - [ ] 10.2 Implement `QuickLinksModule.render()` and `QuickLinksModule.init()`
    - `render()` rebuilds `#links-panel`: each link → `<button class="link-btn">` with label text; if URL is invalid add class `link-btn--invalid` and append `⚠`; include a `<button class="btn-delete-link">` per link
    - `init()` calls `StorageModule.loadLinks()`, populates in-memory `links[]`, calls `render()`
    - _Requirements: 6.1, 6.3, 6.4_
  

- [ ] 11. Implement QuickLinksModule — add, delete, navigate
  - [ ] 11.1 Implement `QuickLinksModule.addLink(label, url)`, `QuickLinksModule.deleteLink(id)`, `QuickLinksModule.navigateLink(url)`
    - `addLink`: calls `validateAddLink`; checks 50-link capacity limit (Req 7.8); on validation failure sets `#link-error` text and returns `false`; on success pushes to `links[]`, calls `StorageModule.saveLinks`; on storage failure reverts `links[]` to previous state and shows error (Req 7.7); calls `render()`; clears form inputs on success
    - `deleteLink`: removes from `links[]`, calls `StorageModule.saveLinks`; on storage failure reverts and shows error; calls `render()`
    - `navigateLink`: calls `isValidLinkUrl`; if valid calls `window.open(url, '_blank')`; if invalid suppresses navigation
    - Bind `#link-add-form` submit handler; bind link button clicks to `navigateLink`; bind delete button clicks inside `render()`
    - _Requirements: 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_


- [ ] 12. Checkpoint — Verify full QuickLinksModule
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Wire everything together in `bootstrap()` and polish CSS
  - [ ] 13.1 Complete `bootstrap()` in `app.js`
    - Call `StorageModule` (no explicit init needed — reads are lazy)
    - Call `GreetingModule.init()`, `TimerModule.init()`, `TodoModule.init()`, `QuickLinksModule.init()` in sequence
    - Verify `DOMContentLoaded` listener in `app.js` invokes `bootstrap()`
    - _Requirements: 8.4, 9.1_
  - [ ] 13.2 Complete responsive CSS and visual hierarchy
    - Apply `font-size`, `font-weight` rules so all section headings are ≥ 1.25× body size and visually distinct weight (Req 9.3)
    - Set `html { font-size: 14px }` baseline; verify all body text ≥ 14 px (Req 9.4)
    - Apply WCAG 2.1 AA colour contrast rules to all text/background pairs (Req 9.4)
    - Style `#timer-display` with `font-size: 3rem; font-variant-numeric: tabular-nums` (Req 2.7 display stability)
    - Style completed tasks with `text-decoration: line-through` and reduced opacity (Req 5.2, 5.3)
    - Style `link-btn--invalid` with visible error indicator (Req 6.3)
    - Ensure no overlapping, clipped content, or horizontal scrollbar at 1024–1920 px (Req 8.5)
    - _Requirements: 8.5, 9.1, 9.3, 9.4_
 

- [ ] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- The design mandates **no external libraries** in the production files (`index.html`, `styles.css`, `app.js`); fast-check is a **dev-only** test dependency and must not be bundled into `app.js`
- Property tests should be placed in a `tests/` directory alongside a minimal test runner setup (e.g., `tests/pbt.test.js` run with a Node.js test runner or bundled separately)
- Each property test file must include the tag comment `// Feature: todo-life-dashboard, Property N: <property text>` directly above the test
- UUID generation should use `crypto.randomUUID()` where available; the `Math.random`-based fallback is only for Safari < 15.4
- All `StorageModule` functions must handle both `null` (key not found) and malformed JSON without throwing
- Aria attributes and focus management for edit mode are required for accessibility compliance; manual screen-reader verification is needed after implementation (NVDA / VoiceOver)

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.2"] },
    { "id": 1, "tasks": ["3.1", "3.2", "5.1", "6.1", "10.1"] },
    { "id": 2, "tasks": ["3.3", "3.4", "5.2", "6.2", "6.3", "10.2"] },
    { "id": 3, "tasks": ["5.3", "6.4", "7.1", "10.3", "11.1"] },
    { "id": 4, "tasks": ["7.2", "8.1", "11.2"] },
    { "id": 5, "tasks": ["8.2", "13.1", "13.2"] },
    { "id": 6, "tasks": ["13.3"] }
  ]
}
```
