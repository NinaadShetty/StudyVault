/* =========================================================
   StudyVault — app logic
   Everything is stored in the browser's LocalStorage.
   No backend, no build step — just plain JavaScript.
   ========================================================= */

/* ---------- LocalStorage keys ---------- */
const STORAGE_KEYS = {
  subjects: "studyvault_subjects",
  tasks: "studyvault_tasks",
  notes: "studyvault_notes",
  sessions: "studyvault_sessions",
};

/* ---------- Small storage helpers ---------- */
function loadFromStorage(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Could not read", key, err);
    return fallback;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------- App state (loaded once at startup) ---------- */
let subjects = loadFromStorage(STORAGE_KEYS.subjects, []);
let tasks = loadFromStorage(STORAGE_KEYS.tasks, []);
let notes = loadFromStorage(STORAGE_KEYS.notes, []);
let sessions = loadFromStorage(STORAGE_KEYS.sessions, []); // array of ISO date strings

/* ---------- Generic id generator ---------- */
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* =========================================================
   NAVIGATION — switching between views
   ========================================================= */

const viewTitles = {
  dashboard: ["Dashboard", "A quick look at how your studying is going."],
  subjects: ["Subjects", "Everything you're studying, in one place."],
  tasks: ["Tasks", "What needs doing, and when."],
  notes: ["Notes", "Quick thoughts worth keeping."],
  timer: ["Study timer", "Focus in short, honest bursts."],
};

function switchView(viewName) {
  document.querySelectorAll(".view").forEach((el) => el.classList.remove("active"));
  document.getElementById("view-" + viewName).classList.add("active");

  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });

  const [title, subtitle] = viewTitles[viewName];
  document.getElementById("viewTitle").textContent = title;
  document.getElementById("viewSubtitle").textContent = subtitle;

  closeSidebarOnMobile();
}

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

/* ---------- Mobile sidebar toggle ---------- */
const sidebar = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");

document.getElementById("menuToggle").addEventListener("click", () => {
  sidebar.classList.toggle("open");
  sidebarBackdrop.classList.toggle("active");
});

sidebarBackdrop.addEventListener("click", closeSidebarOnMobile);

function closeSidebarOnMobile() {
  sidebar.classList.remove("open");
  sidebarBackdrop.classList.remove("active");
}

/* =========================================================
   MODALS — small helper to open/close any modal by id
   ========================================================= */

function openModal(id) {
  document.getElementById(id).classList.add("active");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

document.querySelectorAll("[data-close-modal]").forEach((btn) => {
  btn.addEventListener("click", () => btn.closest(".modal-overlay").classList.remove("active"));
});

// Clicking the dark backdrop also closes the modal
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("active");
  });
});

/* ---------- Toast (small confirmation message) ---------- */
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* =========================================================
   SUBJECTS
   ========================================================= */

const SUBJECT_COLORS = [
  "#e8a33d", "#e2685f", "#6fbf8b", "#7ea8d8",
  "#c792ea", "#4fc1c9", "#f28fb2", "#b8c04a",
];

function buildColorSwatches() {
  const row = document.getElementById("colorRow");
  row.innerHTML = "";
  SUBJECT_COLORS.forEach((color, index) => {
    const swatch = document.createElement("div");
    swatch.className = "color-swatch" + (index === 0 ? " selected" : "");
    swatch.style.background = color;
    swatch.addEventListener("click", () => {
      document.querySelectorAll(".color-swatch").forEach((s) => s.classList.remove("selected"));
      swatch.classList.add("selected");
      document.getElementById("subjectColor").value = color;
    });
    row.appendChild(swatch);
  });
}
buildColorSwatches();

document.getElementById("openAddSubject").addEventListener("click", () => {
  document.getElementById("subjectForm").reset();
  buildColorSwatches();
  document.getElementById("subjectColor").value = SUBJECT_COLORS[0];
  openModal("subjectModal");
});

document.getElementById("subjectForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("subjectName").value.trim();
  const color = document.getElementById("subjectColor").value;
  if (!name) return;

  subjects.push({ id: makeId(), name, color });
  saveToStorage(STORAGE_KEYS.subjects, subjects);

  closeModal("subjectModal");
  renderSubjects();
  populateSubjectSelect();
  renderDashboard();
  showToast("Subject added");
});

function deleteSubject(id) {
  const hasTasks = tasks.some((t) => t.subjectId === id);
  const confirmMsg = hasTasks
    ? "This subject has tasks linked to it. Delete it anyway? The tasks will stay, just unlinked."
    : "Delete this subject?";
  if (!confirm(confirmMsg)) return;

  subjects = subjects.filter((s) => s.id !== id);
  tasks = tasks.map((t) => (t.subjectId === id ? { ...t, subjectId: "" } : t));

  saveToStorage(STORAGE_KEYS.subjects, subjects);
  saveToStorage(STORAGE_KEYS.tasks, tasks);

  renderSubjects();
  populateSubjectSelect();
  renderTasks();
  renderDashboard();
  showToast("Subject deleted");
}

function renderSubjects() {
  const grid = document.getElementById("subjectGrid");
  grid.innerHTML = "";

  if (subjects.length === 0) {
    grid.innerHTML = `<div class="empty-state">No subjects yet — add one to start organizing your tasks.</div>`;
    return;
  }

  subjects.forEach((subject) => {
    const taskCount = tasks.filter((t) => t.subjectId === subject.id).length;

    const card = document.createElement("div");
    card.className = "subject-card";
    card.innerHTML = `
      <div class="subject-card-top">
        <span class="subject-dot" style="background:${subject.color}"></span>
        <span class="subject-name" title="${escapeHtml(subject.name)}">${escapeHtml(subject.name)}</span>
        <div class="subject-actions">
          <button class="btn-icon" data-delete-subject="${subject.id}" title="Delete subject">
            <svg viewBox="0 0 24 24"><path d="M4 6h16M9 6V4h6v2m-8 0 1 14h10l1-14"/></svg>
          </button>
        </div>
      </div>
      <span class="subject-meta">${taskCount} task${taskCount === 1 ? "" : "s"}</span>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll("[data-delete-subject]").forEach((btn) => {
    btn.addEventListener("click", () => deleteSubject(btn.dataset.deleteSubject));
  });
}

function populateSubjectSelect() {
  const select = document.getElementById("taskSubject");
  const currentValue = select.value;
  select.innerHTML = `<option value="">No subject</option>`;
  subjects.forEach((s) => {
    const option = document.createElement("option");
    option.value = s.id;
    option.textContent = s.name;
    select.appendChild(option);
  });
  select.value = currentValue;
}

/* =========================================================
   TASKS
   ========================================================= */

let currentTaskFilter = "all";
let currentTaskSort = "dueDate";

document.getElementById("openAddTask").addEventListener("click", () => {
  document.getElementById("taskForm").reset();
  populateSubjectSelect();
  openModal("taskModal");
});

document.getElementById("taskForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("taskTitle").value.trim();
  if (!title) return;

  tasks.push({
    id: makeId(),
    title,
    subjectId: document.getElementById("taskSubject").value,
    priority: document.getElementById("taskPriority").value,
    dueDate: document.getElementById("taskDueDate").value,
    completed: false,
  });

  saveToStorage(STORAGE_KEYS.tasks, tasks);
  closeModal("taskModal");
  renderTasks();
  renderDashboard();
  showToast("Task added");
});

document.getElementById("taskFilter").addEventListener("click", (e) => {
  const btn = e.target.closest(".segmented-btn");
  if (!btn) return;
  currentTaskFilter = btn.dataset.filter;
  document.querySelectorAll("#taskFilter .segmented-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  renderTasks();
});

document.getElementById("taskSort").addEventListener("change", (e) => {
  currentTaskSort = e.target.value;
  renderTasks();
});

function toggleTaskComplete(id) {
  tasks = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
  saveToStorage(STORAGE_KEYS.tasks, tasks);
  renderTasks();
  renderDashboard();
}

function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  tasks = tasks.filter((t) => t.id !== id);
  saveToStorage(STORAGE_KEYS.tasks, tasks);
  renderTasks();
  renderSubjects();
  renderDashboard();
  showToast("Task deleted");
}

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

function getSortedFilteredTasks() {
  let list = [...tasks];

  if (currentTaskFilter === "pending") list = list.filter((t) => !t.completed);
  if (currentTaskFilter === "completed") list = list.filter((t) => t.completed);

  list.sort((a, b) => {
    if (currentTaskSort === "priority") {
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    }
    // sort by due date — tasks without a date go to the bottom
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  return list;
}

function renderTasks() {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  const visibleTasks = getSortedFilteredTasks();

  if (visibleTasks.length === 0) {
    list.innerHTML = `<li class="empty-state">No tasks here. Add one, or check a different filter.</li>`;
    return;
  }

  visibleTasks.forEach((task) => {
    const subject = subjects.find((s) => s.id === task.subjectId);
    const row = document.createElement("li");
    row.className = "task-row" + (task.completed ? " completed" : "");

    row.innerHTML = `
      <button class="task-check ${task.completed ? "checked" : ""}" data-toggle-task="${task.id}" aria-label="Mark complete">
        <svg viewBox="0 0 24 24"><path d="m4 12 5 5L20 6"/></svg>
      </button>
      <div class="task-main">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-tags">
          ${subject ? `<span class="subject-chip"><span class="subject-dot" style="width:8px;height:8px;background:${subject.color}"></span>${escapeHtml(subject.name)}</span>` : ""}
          <span class="priority-badge priority-${task.priority}">${task.priority}</span>
          ${task.dueDate ? `<span>Due ${formatDate(task.dueDate)}</span>` : ""}
        </div>
      </div>
      <button class="btn-icon" data-delete-task="${task.id}" title="Delete task">
        <svg viewBox="0 0 24 24"><path d="M4 6h16M9 6V4h6v2m-8 0 1 14h10l1-14"/></svg>
      </button>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll("[data-toggle-task]").forEach((btn) => {
    btn.addEventListener("click", () => toggleTaskComplete(btn.dataset.toggleTask));
  });
  list.querySelectorAll("[data-delete-task]").forEach((btn) => {
    btn.addEventListener("click", () => deleteTask(btn.dataset.deleteTask));
  });
}

/* =========================================================
   NOTES
   ========================================================= */

let noteSearchTerm = "";

document.getElementById("openAddNote").addEventListener("click", () => {
  document.getElementById("noteForm").reset();
  document.getElementById("noteId").value = "";
  document.getElementById("noteModalTitle").textContent = "New note";
  document.getElementById("noteSubmitBtn").textContent = "Save note";
  openModal("noteModal");
});

document.getElementById("noteForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("noteId").value;
  const title = document.getElementById("noteTitle").value.trim();
  const content = document.getElementById("noteContent").value.trim();
  if (!title) return;

  if (id) {
    notes = notes.map((n) => (n.id === id ? { ...n, title, content, updatedAt: new Date().toISOString() } : n));
  } else {
    notes.unshift({ id: makeId(), title, content, updatedAt: new Date().toISOString() });
  }

  saveToStorage(STORAGE_KEYS.notes, notes);
  closeModal("noteModal");
  renderNotes();
  showToast(id ? "Note updated" : "Note saved");
});

function editNote(id) {
  const note = notes.find((n) => n.id === id);
  if (!note) return;
  document.getElementById("noteId").value = note.id;
  document.getElementById("noteTitle").value = note.title;
  document.getElementById("noteContent").value = note.content;
  document.getElementById("noteModalTitle").textContent = "Edit note";
  document.getElementById("noteSubmitBtn").textContent = "Update note";
  openModal("noteModal");
}

function deleteNote(id) {
  if (!confirm("Delete this note?")) return;
  notes = notes.filter((n) => n.id !== id);
  saveToStorage(STORAGE_KEYS.notes, notes);
  renderNotes();
  showToast("Note deleted");
}

document.getElementById("noteSearch").addEventListener("input", (e) => {
  noteSearchTerm = e.target.value.trim().toLowerCase();
  renderNotes();
});

function renderNotes() {
  const grid = document.getElementById("noteGrid");
  grid.innerHTML = "";

  const visibleNotes = notes.filter((n) =>
    (n.title + " " + n.content).toLowerCase().includes(noteSearchTerm)
  );

  if (visibleNotes.length === 0) {
    grid.innerHTML = `<div class="empty-state">${notes.length === 0 ? "No notes yet — jot one down." : "No notes match your search."}</div>`;
    return;
  }

  visibleNotes.forEach((note) => {
    const card = document.createElement("div");
    card.className = "note-card";
    card.innerHTML = `
      <div class="note-card-top">
        <span class="note-title">${escapeHtml(note.title)}</span>
        <div class="note-actions">
          <button class="btn-icon" data-edit-note="${note.id}" title="Edit note">
            <svg viewBox="0 0 24 24"><path d="M4 20h4l10-10-4-4L4 16v4Z"/></svg>
          </button>
          <button class="btn-icon" data-delete-note="${note.id}" title="Delete note">
            <svg viewBox="0 0 24 24"><path d="M4 6h16M9 6V4h6v2m-8 0 1 14h10l1-14"/></svg>
          </button>
        </div>
      </div>
      <p class="note-body">${escapeHtml(note.content) || "<em>Empty note</em>"}</p>
      <span class="note-date">Updated ${formatDate(note.updatedAt)}</span>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll("[data-edit-note]").forEach((btn) => {
    btn.addEventListener("click", () => editNote(btn.dataset.editNote));
  });
  grid.querySelectorAll("[data-delete-note]").forEach((btn) => {
    btn.addEventListener("click", () => deleteNote(btn.dataset.deleteNote));
  });
}

/* =========================================================
   STUDY TIMER (Pomodoro-style)
   ========================================================= */

const RING_CIRCUMFERENCE = 2 * Math.PI * 90; // matches the SVG circle radius (90)

let timerMode = "focus"; // "focus" or "break"
let timerTotalSeconds = 25 * 60;
let timerSecondsLeft = timerTotalSeconds;
let timerIntervalId = null;
let timerRunning = false;

const timerDisplay = document.getElementById("timerDisplay");
const timerRing = document.getElementById("timerRingProgress");
const timerModeLabel = document.getElementById("timerMode");
const startBtn = document.getElementById("timerStart");
const pauseBtn = document.getElementById("timerPause");
const resetBtn = document.getElementById("timerReset");
const focusInput = document.getElementById("focusLength");
const breakInput = document.getElementById("breakLength");

timerRing.style.strokeDasharray = RING_CIRCUMFERENCE;

function updateTimerDisplay() {
  const minutes = Math.floor(timerSecondsLeft / 60).toString().padStart(2, "0");
  const seconds = (timerSecondsLeft % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `${minutes}:${seconds}`;

  const fraction = timerSecondsLeft / timerTotalSeconds;
  timerRing.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - fraction);
  timerRing.style.stroke = timerMode === "focus" ? "var(--accent)" : "var(--success)";

  timerModeLabel.textContent = timerMode === "focus" ? "Focus session" : "Break time";
}

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  startBtn.disabled = true;
  pauseBtn.disabled = false;

  timerIntervalId = setInterval(() => {
    timerSecondsLeft--;
    updateTimerDisplay();

    if (timerSecondsLeft <= 0) {
      handleTimerFinish();
    }
  }, 1000);
}

function pauseTimer() {
  timerRunning = false;
  clearInterval(timerIntervalId);
  startBtn.disabled = false;
  startBtn.textContent = "Resume";
  pauseBtn.disabled = true;
}

function resetTimer() {
  timerRunning = false;
  clearInterval(timerIntervalId);
  timerMode = "focus";
  timerTotalSeconds = getFocusMinutes() * 60;
  timerSecondsLeft = timerTotalSeconds;
  startBtn.disabled = false;
  startBtn.textContent = "Start";
  pauseBtn.disabled = true;
  updateTimerDisplay();
}

function getFocusMinutes() {
  return Math.max(1, parseInt(focusInput.value, 10) || 25);
}
function getBreakMinutes() {
  return Math.max(1, parseInt(breakInput.value, 10) || 5);
}

function handleTimerFinish() {
  clearInterval(timerIntervalId);
  timerRunning = false;

  if (timerMode === "focus") {
    // log a completed study session
    sessions.push(new Date().toISOString());
    saveToStorage(STORAGE_KEYS.sessions, sessions);
    renderDashboard();
    showToast("Focus session complete — nice work! Break time.");

    timerMode = "break";
    timerTotalSeconds = getBreakMinutes() * 60;
  } else {
    showToast("Break's over. Ready for another round?");
    timerMode = "focus";
    timerTotalSeconds = getFocusMinutes() * 60;
  }

  timerSecondsLeft = timerTotalSeconds;
  startBtn.disabled = false;
  startBtn.textContent = "Start";
  pauseBtn.disabled = true;
  updateTimerDisplay();
}

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

focusInput.addEventListener("change", () => {
  if (timerMode === "focus" && !timerRunning) {
    timerTotalSeconds = getFocusMinutes() * 60;
    timerSecondsLeft = timerTotalSeconds;
    updateTimerDisplay();
  }
});

breakInput.addEventListener("change", () => {
  if (timerMode === "break" && !timerRunning) {
    timerTotalSeconds = getBreakMinutes() * 60;
    timerSecondsLeft = timerTotalSeconds;
    updateTimerDisplay();
  }
});

/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {
  document.getElementById("statToday").textContent = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  document.getElementById("statSubjects").textContent = subjects.length;

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;
  document.getElementById("statPending").textContent = pendingCount;
  document.getElementById("statCompleted").textContent = completedCount;
  document.getElementById("statSessions").textContent = sessions.length;

  const totalTasks = tasks.length;
  const percent = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);
  document.getElementById("progressFill").style.width = percent + "%";
  document.getElementById("progressPercent").textContent = percent + "%";
  document.getElementById("progressCaption").textContent = `${completedCount} of ${totalTasks} tasks done`;

  renderDueSoon();
}

function renderDueSoon() {
  const list = document.getElementById("dueSoonList");
  const upcoming = tasks
    .filter((t) => !t.completed && t.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  if (upcoming.length === 0) {
    list.innerHTML = `<li class="empty-hint">Nothing on the horizon. Add a task to get started.</li>`;
    return;
  }

  list.innerHTML = upcoming
    .map(
      (t) => `<li><span>${escapeHtml(t.title)}</span><span class="mini-due">${formatDate(t.dueDate)}</span></li>`
    )
    .join("");
}

/* =========================================================
   SMALL UTILITIES
   ========================================================= */

function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Prevents note/task titles from breaking the page's HTML
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

/* =========================================================
   STARTUP
   ========================================================= */

function init() {
  populateSubjectSelect();
  renderSubjects();
  renderTasks();
  renderNotes();
  renderDashboard();
  updateTimerDisplay();
}

init();
