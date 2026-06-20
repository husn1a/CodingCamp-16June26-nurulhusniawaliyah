# Requirements Document

## Introduction

The To-Do List Life Dashboard is a client-side web application built with HTML, CSS, and Vanilla JavaScript. It provides users with a unified personal productivity interface featuring a time-aware greeting, a focus timer, a persistent to-do list, and a customizable quick-links panel. All data is stored in the browser's Local Storage — no backend server is required. The app must work as a standalone web page or browser extension in all modern browsers.

---

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Widget**: The UI component that displays the current time, date, and a time-of-day greeting.
- **Focus_Timer**: The UI component that manages a 25-minute countdown timer with start, stop, and reset controls.
- **Todo_List**: The UI component that manages a persistent list of user tasks.
- **Task**: A single item in the Todo_List with a text description and a completion state.
- **Quick_Links**: The UI component that displays user-defined shortcut buttons that open external URLs.
- **Link**: A single entry in Quick_Links containing a label and a URL.
- **Storage**: The browser's Local Storage API used for all client-side data persistence.
- **Modern_Browser**: The two latest stable major versions of Chrome, Firefox, Edge, and Safari.

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a contextual greeting when I open the Dashboard, so that I can quickly orient myself throughout the day.

#### Acceptance Criteria

1. WHEN the Dashboard loads and at the start of every subsequent minute, THE Greeting_Widget SHALL display the current local time in 24-hour HH:MM format.
2. THE Greeting_Widget SHALL display the current date in the format "Weekday, DD Month YYYY" (e.g., Monday, 16 June 2025).
3. WHEN the local time is between 05:00 and 11:59, THE Greeting_Widget SHALL display the greeting "Good Morning".
4. WHEN the local time is between 12:00 and 17:59, THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. WHEN the local time is between 18:00 and 21:59, THE Greeting_Widget SHALL display the greeting "Good Evening".
6. WHEN the local time is between 22:00 and 23:59, THE Greeting_Widget SHALL display the greeting "Good Night".
7. WHEN the local time is between 00:00 and 04:59, THE Greeting_Widget SHALL display no greeting text.
8. IF the Greeting_Widget fails to determine the correct greeting for the current time, THEN THE Greeting_Widget SHALL display an empty greeting rather than an incorrect one.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can manage focused work sessions.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialise with a countdown value of 25 minutes and 00 seconds (25:00).
2. WHEN the user activates the Start control and the Focus_Timer is not already counting down, THE Focus_Timer SHALL begin counting down one second at a time from the current displayed time.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second.
4. WHEN the user activates the Stop control, THE Focus_Timer SHALL pause the countdown at the current remaining time.
5. WHEN the user activates the Reset control, THE Focus_Timer SHALL stop any active countdown and restore the displayed time to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop counting down completely and display a session-ended indicator that remains visible until the user activates the Reset control.
7. THE Focus_Timer SHALL display the remaining time in MM:SS format at all times.
8. IF the countdown has reached 00:00, THEN THE Focus_Timer SHALL not allow the Start control to resume the countdown until the user activates the Reset control.

---

### Requirement 3: To-Do List — Add and Display Tasks

**User Story:** As a user, I want to add tasks to a list and have them persist across page reloads, so that I do not lose my task data.

#### Acceptance Criteria

1. THE Todo_List SHALL provide an input field and an Add control for entering new tasks.
2. WHEN the user submits a non-empty task description via the Add control or the Enter key, THE Todo_List SHALL append the Task to the visible list.
3. IF the user attempts to submit an empty task description, THEN THE Todo_List SHALL not add the Task and SHALL not modify the existing list.
4. WHEN a Task is added, THE Todo_List SHALL persist the updated task collection to Storage.
5. WHEN the Dashboard loads, THE Todo_List SHALL attempt to retrieve saved tasks from Storage; IF retrieval fails or no saved tasks exist, THEN THE Todo_List SHALL display an empty list.

---

### Requirement 4: To-Do List — Edit Tasks

**User Story:** As a user, I want to edit the text of an existing task, so that I can correct or update it without deleting and re-adding it.

#### Acceptance Criteria

1. THE Todo_List SHALL provide an Edit control for each Task.
2. WHEN the user activates the Edit control on a Task, THE Todo_List SHALL replace the Task's display text with an editable input field pre-filled with the current task description.
3. WHEN the user confirms the edit via a Save control or the Enter key, and the new value is non-empty and no more than 500 characters, THE Todo_List SHALL update the Task's description to the new value and return to display mode.
4. IF the user confirms an edit with an empty value or a whitespace-only value, THEN THE Todo_List SHALL not update the Task and SHALL retain the original description.
5. WHEN a Task is successfully edited, THE Todo_List SHALL persist the updated task collection to Storage.
6. WHEN the user cancels an edit via the Escape key or by clicking outside the editable input field, THE Todo_List SHALL discard the change and return the Task to display mode with its original description unchanged.
7. IF one Task is already in edit mode and the user activates the Edit control on a different Task, THEN THE Todo_List SHALL cancel the first edit (discarding changes) before entering edit mode on the second Task.

---

### Requirement 5: To-Do List — Complete and Delete Tasks

**User Story:** As a user, I want to mark tasks as done and delete tasks I no longer need, so that I can track progress and keep my list tidy.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a completion toggle (e.g., checkbox) for each Task.
2. WHEN the user activates the completion toggle on an incomplete Task, THE Todo_List SHALL mark the Task as complete and apply a strikethrough style on the Task's text label.
3. WHEN the user activates the completion toggle on a complete Task, THE Todo_List SHALL mark the Task as incomplete and remove the strikethrough style from the Task's text label.
4. WHEN a Task's completion state changes, THE Todo_List SHALL persist the updated task collection to Storage; IF Storage write fails, THE Todo_List SHALL retain the updated completion state in the current session.
5. THE Todo_List SHALL provide a Delete control for each Task.
6. WHEN the user activates the Delete control on a Task, THE Todo_List SHALL permanently remove the Task from the visible list and persist the updated task collection to Storage; IF Storage write fails, THE Todo_List SHALL retain the Task's removal from the visible list in the current session.

---

### Requirement 6: Quick Links — Display and Navigate

**User Story:** As a user, I want to see my saved shortcut links as clickable buttons, so that I can open favourite websites quickly.

#### Acceptance Criteria

1. THE Quick_Links SHALL display each saved Link as a button whose visible label is the Link's label text.
2. WHEN the user activates a Link button and the stored URL is a valid absolute URL, THE Quick_Links SHALL open the associated URL in a new browser tab.
3. IF the stored URL for a Link is not a valid absolute URL, THEN THE Quick_Links SHALL display an error indication on that Link button instead of attempting navigation.
4. WHEN the Dashboard loads, THE Quick_Links SHALL attempt to retrieve saved links from Storage; IF retrieval fails or no saved links exist, THEN THE Quick_Links SHALL display a panel containing no Link buttons.

---

### Requirement 7: Quick Links — Add and Delete Links

**User Story:** As a user, I want to add and remove quick-link entries, so that I can customise my shortcut panel to my preferences.

#### Acceptance Criteria

1. THE Quick_Links SHALL provide input fields for a link label and a URL, and an Add control.
2. WHEN the user submits a label of 1–100 characters and a URL that is 1–2048 characters and begins with `http://` or `https://` via the Add control, THE Quick_Links SHALL append the Link to the panel and render the new Link button in the visible panel.
3. IF the user attempts to submit a Link where the label is empty, exceeds 100 characters, the URL is empty, exceeds 2048 characters, or does not begin with `http://` or `https://`, THEN THE Quick_Links SHALL not add the Link, SHALL display an error message indicating which field is invalid, and SHALL not modify the existing panel.
4. WHEN a Link is added, THE Quick_Links SHALL persist the updated link collection to Storage.
5. THE Quick_Links SHALL provide a Delete control for each Link.
6. WHEN the user activates the Delete control on a Link, THE Quick_Links SHALL permanently remove the Link from the panel and persist the updated link collection to Storage.
7. IF Storage fails during a Link add or delete operation, THEN THE Quick_Links SHALL revert the panel to its state prior to the operation and display an error message indicating the link could not be saved.
8. IF the user attempts to submit a Link when the panel already contains 50 Links, THEN THE Quick_Links SHALL not add the Link and SHALL display an error message indicating the maximum number of links has been reached.

---

### Requirement 8: Technical Constraints

**User Story:** As a developer, I want the Dashboard to follow defined technical and structural constraints, so that the codebase remains simple, maintainable, and compatible.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using only HTML, CSS, and Vanilla JavaScript with no external frameworks or libraries.
2. THE Dashboard SHALL store all persistent data exclusively in the browser's Local Storage API with no server-side calls.
3. THE Dashboard SHALL function correctly in the two latest stable major versions of Chrome, Firefox, Edge, and Safari without requiring any installation or server setup.
4. THE Dashboard SHALL load and be fully interactive — with all UI controls responding to user input within 1 second of page load completing — from a single HTML file entry point that references exactly one CSS file and exactly one JavaScript file.
5. THE Dashboard SHALL produce no overlapping elements, no clipped or truncated content, and no horizontal scrollbar when viewed at common desktop viewport widths (1024 px to 1920 px).

---

### Requirement 9: Performance and Visual Design

**User Story:** As a user, I want the Dashboard to load fast and look clean, so that using it feels effortless and pleasant.

#### Acceptance Criteria

1. THE Dashboard SHALL reach a Time to Interactive of 2 seconds or less on a broadband connection under normal desktop conditions.
2. WHEN the user interacts with any control (add, edit, delete, toggle, timer buttons), THE Dashboard SHALL reflect the result of that interaction within 100 milliseconds.
3. THE Dashboard SHALL apply a consistent visual hierarchy in which all section headings are rendered at a font size at least 1.25× the body font size and at a visually distinct font weight.
4. THE Dashboard SHALL use a minimum body text font size of 14 px and colour contrast ratios that meet WCAG 2.1 AA minimums (4.5:1 for normal text, 3:1 for large text and UI components).
