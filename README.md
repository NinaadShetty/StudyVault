# StudyVault

A small, local-first study dashboard for students. Add your subjects, track tasks, jot down quick notes, and run focus sessions with a built-in Pomodoro timer — all in one clean, dark-themed page that runs entirely in your browser.

No sign-up. No server. No tracking. Your data lives only in your browser's LocalStorage, on your device.

## Features

**Dashboard**
- Today's date at a glance
- Live counts of subjects, pending tasks, and completed tasks
- A study progress bar based on task completion
- Total completed study sessions
- A "due soon" list of your nearest upcoming tasks

**Subjects**
- Add a subject with a name and a color
- View subjects as cards with a live task count
- Delete a subject (linked tasks stay, just unlinked)

**Tasks**
- Add a task with a title, subject, priority (Low / Medium / High), and due date
- Mark tasks complete with a single click
- Delete tasks
- Filter by All / Pending / Completed
- Sort by due date or by priority

**Quick Notes**
- Create, edit, and delete short notes
- Search notes by title or content
- Notes are timestamped with their last update

**Study Timer**
- Pomodoro-style focus/break cycle (defaults: 25 min focus, 5 min break)
- Adjustable focus and break lengths
- Start, pause, and reset controls
- Completed focus sessions are automatically logged and shown on the dashboard

**Interface**
- Dark, modern, card-based UI built with plain CSS variables
- Responsive layout with a collapsible sidebar on mobile
- Subtle hover states and transitions — nothing flashy, nothing slow

## Tech stack

- HTML5
- CSS3 (custom properties, Grid, Flexbox — no framework)
- Vanilla JavaScript (no build step, no libraries)
- Browser LocalStorage for persistence

No npm, no Node.js, no database, no API keys, and no external requests of any kind.

## How to run locally

1. Download or clone this folder.
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).

That's it — the app works immediately, entirely offline.

> Tip: since everything is saved to your browser's LocalStorage, your data is tied to that specific browser on that specific device. Clearing your browser's site data will reset the app.

## Project structure

```
studyvault/
├── index.html      # Page structure and markup for every view
├── style.css       # Theme, layout, and responsive styles
├── script.js       # App state, LocalStorage persistence, and all interactivity
└── README.md       # You are here
```

## Screenshots

_Add screenshots here once you've customized the app._

```
docs/
├── dashboard.png
├── subjects.png
├── tasks.png
├── notes.png
└── timer.png
```

## Future improvements

- Export/import data as a JSON file for backup or transfer between devices
- Weekly and monthly study-session statistics with simple charts
- Recurring tasks and reminders
- Drag-and-drop task reordering
- Light theme toggle
- Per-subject color used consistently across tasks and notes
- Keyboard shortcuts for quick task/note entry

## License

Free to use, modify, and build on for personal or portfolio purposes.
