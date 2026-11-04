# CodeLane // Developer Kanban Board

> **Continuous Assessment — Assignment 4 (Option B: Kanban Board)**  
> **Course:** Web Technology  
> **Architecture:** Pure Vanilla JavaScript (ES6+), Semantic HTML5, Modular CSS3  
> **Zero External Dependencies / Frameworks**

---

## 📌 Project Overview

**CodeLane** is an AI/developer-inspired Kanban project tracker engineered specifically for developers managing personal software milestones. It supports full CRUD operations, multi-stage task lifecycles (**To Do**, **In Progress**, and **Done**), real-time search, multi-field filtering and sorting, persistent browser storage, native HTML5 drag-and-drop, and an instant JSON data portability suite (Export/Import/Reset/Clear).

---

## 🚀 Key Features Checklist

- [x] **Zero Frameworks / Libraries**: 100% vanilla HTML5, CSS3, and ES6+ JavaScript.
- [x] **Persistent Storage**: All task records, modifications, column movements, and theme preferences survive page refreshes via `localStorage`.
- [x] **Full CRUD Lifecycle**:
  - **Create**: Accessible modal dialog with real-time field validation (title length, required due dates).
  - **Read**: Dynamic card rendering using `document.createElement` and safe `textContent` assignment to prevent Cross-Site Scripting (XSS).
  - **Update**: Pre-populated modal editing.
  - **Delete**: Custom accessible confirmation modal with one-click **Undo** toast restore.
- [x] **Dynamic Task Organization**:
  - Live as-you-type search across task titles and descriptions.
  - Filter by priority (`All`, `High`, `Medium`, `Low`).
  - Sort by Due Date, Priority level, or Creation timestamp.
  - Live column counter badges that synchronize with active filter/search results.
- [x] **Dual Movement Controls**:
  - Native **HTML5 Drag-and-Drop** between columns with visual drop-zone feedback.
  - Granular **$\leftarrow$ and $\rightarrow$ buttons** on each card with automatic boundary disablement.
- [x] **Developer UI & Theming**:
  - Dark mode by default with electric developer orange accent (`#ff7a1a`).
  - High-contrast Light mode (`#d95300`) meeting WCAG AAA color standards.
  - Live project health overview strip with stat metric cards, overall completion percentage bar, and segmented distribution breakdown.
  - Overdue warning pill and red border highlight for uncompleted tasks past their due date.
- [x] **Data Portability**:
  - Export tasks to a formatted `.json` file.
  - Import tasks from a `.json` file with strict schema validation.
  - Reset to default sample developer tasks.
  - Clear all tasks with confirmation.
- [x] **Fully Responsive**: Fluid layout scaling across mobile phones, tablets, and desktop displays.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Structure** | Semantic HTML5 | `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>` |
| **Styling** | Modern CSS3 | CSS Grid for macro layouts, Flexbox for micro components, CSS Variables (`var(--token)`) |
| **Logic** | Vanilla JavaScript (ES6+) | State-driven architecture, event delegation, native Drag & Drop API, `FileReader` API |
| **Typography** | Google Fonts | `JetBrains Mono` for developer headings and code tags, `Inter` for clean body typography |
| **Storage** | Web Storage API | `window.localStorage` with defensive `try...catch` serialization |

---

## 📂 Project Structure

```text
codelane-kanban/
├── index.html        # Semantic HTML5 markup, modal dialogs, and accessible ARIA attributes
├── style.css         # CSS design system, dark/light themes, grid layouts, animations
├── script.js         # Centralized state management, CRUD logic, event delegation
├── README.md         # Comprehensive project documentation and viva preparation guide
└── .gitignore        # Ignores OS metadata (.DS_Store, Thumbs.db) and IDE config
```

---

## 💻 How to Run Locally

Because CodeLane is built with 100% vanilla web technologies, **no build steps, Node.js, or package managers (npm/yarn) are required**.

### Method 1: Direct File Opening
1. Clone or download this repository.
2. Double-click [index.html](file:///Users/lostprnv/Desktop/devboard-kanban/index.html) to open it directly in any modern browser (Google Chrome, Safari, Mozilla Firefox, Microsoft Edge).

### Method 2: Local HTTP Server (Optional)
If using VS Code:
1. Install the **Live Server** extension.
2. Right-click `index.html` and click **"Open with Live Server"**.

Or via Python (built into macOS and Linux):
```bash
# In the project directory:
python3 -m http.server 8000
# Open http://localhost:8000 in your browser
```

---

## 💾 How `localStorage` is Used

1. **Serialization (`JSON.stringify`)**:  
   Since `localStorage` only stores string keys and string values, the central `tasks` array is serialized before saving:
   ```javascript
   localStorage.setItem('codelane_tasks', JSON.stringify(tasks));
   ```
2. **Deserialization (`JSON.parse`)**:  
   Upon app load, the stored string is read and deserialized back into active JavaScript objects:
   ```javascript
   const rawData = localStorage.getItem('codelane_tasks');
   tasks = JSON.parse(rawData);
   ```
3. **Defensive Error Handling (`try...catch`)**:  
   Both read and write operations are wrapped inside `try...catch` blocks to protect against:
   - Private browsing modes where storage access is blocked.
   - `QuotaExceededError` when browser storage is full.
   - Corrupted JSON strings, falling back safely to default tasks.
4. **Theme Persistence**:  
   The user's active theme (`'dark'` or `'light'`) is stored under `'codelane_theme'` and applied before the page renders to eliminate flash of unstyled content.

---

## 🎓 Viva Examination Preparation & Code Explanations

Here are the key questions and architectural concepts professors frequently ask during continuous assessment vivas:

### Q1: What is the benefit of your State-Driven Architecture?
> **Answer:** We adhere to the unidirectional data pattern: **Change Data $\rightarrow$ Save State $\rightarrow$ Render UI**.  
> We never directly edit DOM text or move elements manually. Instead, when a user creates, edits, moves, or deletes a task, we modify the central `tasks` array, persist it to `localStorage`, and call `render()`. This guarantees that the UI, overview statistics, distribution bar, and column counts never go out of sync.

### Q2: What is Event Delegation and why did you use it?
> **Answer:** Dynamically created cards are added and removed constantly. If we attached individual click event listeners to every single card's Edit, Delete, $\leftarrow$, and $\rightarrow$ buttons, it would waste memory and cause leaks.  
> Instead, we attach **one single click listener** to the parent `.board-grid`. When an event bubbles up, we use `e.target.closest('.task-card')` to identify which card was clicked and retrieve its unique `data-id`.

### Q3: How do you protect CodeLane against Cross-Site Scripting (XSS)?
> **Answer:** We strictly use `element.textContent` rather than `element.innerHTML` for any content submitted by the user (task title, description, due date). If a user enters `<script>alert('hack')</script>`, the browser renders it harmlessly as literal string characters rather than executing it as JavaScript.

### Q4: When should you use CSS Grid vs CSS Flexbox?
> **Answer:**  
> - **CSS Grid** is two-dimensional (handling both rows and columns simultaneously). We use Grid for macro structures like `.board-grid` (the 3 column layout) and `.stats-grid` (the 4 metric cards).  
> - **Flexbox** is one-dimensional (content flows along a single axis). We use Flexbox for micro components like `.app-header`, `.card-actions`, toolbar controls, and toast notifications.

---

## 🌐 Deployment Guide

### Deploying to GitHub Pages
1. Push your repository to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/codelane-kanban.git
   git push -u origin main
   ```
2. On GitHub, navigate to **Settings** $\rightarrow$ **Pages**.
3. Under **Build and deployment** $\rightarrow$ **Branch**, select `main` and `/ (root)`.
4. Click **Save**. Within 1–2 minutes, your Kanban board will be live at:
   `https://<your-username>.github.io/codelane-kanban/`

### Deploying to Netlify
1. Log into [Netlify](https://www.netlify.com/).
2. Drag and drop the `devboard-kanban` project folder directly into the Netlify dashboard.
3. Your site is instantly live with a global CDN and HTTPS certificate.

### Deploying to Vercel
1. Install Vercel CLI: `npm i -g vercel` or import the GitHub repository in the [Vercel Dashboard](https://vercel.com).
2. Accept the default static settings and click **Deploy**.

---

## 📜 License
This project was created for educational purposes under the Continuous Assessment Web Technology curriculum. Free to use and adapt for academic learning.
