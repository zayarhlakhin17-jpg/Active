# Manhattan Habit Audit & Clera Diary

An executive-tier productivity operating system that merges **habit tracking, auditable daily execution, AI advisory, and real-time 3D telemetry** into a single cohesive platform. Designed with an audit-first methodology, Manhattan bridges daily routines with measurable proof, cognitive reflection, and enterprise workspace integrations.

---

## 🌟 Key Features

### 1. 🌐 3D Golden Momentum Core
- **WebGL / Three.js Visualizer**: An interactive, real-time particle sphere and wireframe core that reflects your daily completion percentage and productivity momentum score (0–100).
- **Lethal Shining Black & 24k Gold Aesthetic**: Dual-point golden lighting, additive blending, Fibonacci particle distribution, and rotating orbital habit rings.
- **Interactive Controls**: Zoom, pan, orbit, and expand controls to inspect momentum state.

### 2. ⚡ Daily Habit Execution Engine
- **Categorized Tracking**: Organize habits into Engineering, Deep Focus, Mindset, and Health.
- **Streak Counters & Flame Indicators**: Tracks current streaks and lifetime personal records with active streak bonus XP.
- **Quick Habit Creation**: Modal for defining title, category, target frequency, and daily reminder times.
- **Google Calendar Scheduling**: Direct sync of daily habit time-blocks into Google Calendar.

### 3. 🛡️ Manhattan Audit Matrix
- **Evidence-Based Evaluation**: Enforces objective auditing rather than subjective feeling.
- **Verified Metrics**: Tracks Daily Execution, Weekly Acceptance, and overall rating scores.
- **Evening Snapshot**: Instant verdict review (e.g. *Target Met*, *Missed Target*) with executive audit logs.

### 4. 📖 Clera Diary
- **Cognitive Journaling**: Log energy levels, focus ratings, executive summaries, breakthrough notes, and blockers.
- **Export Capabilities**: One-click export to Google Docs or downloadable markdown reports.

### 5. 📈 Predictive Analytics & Correlations
- **Habit vs. Mood Correlation**: Scatter plot analyzing the direct impact of habit completion on mental clarity.
- **90-Day Consistency Heatmap**: Visual grid tracking habit adherence over a full quarter.
- **Burnout Radar Diagnostic**: Multi-axis radar chart analyzing workload, recovery, and cognitive fatigue.
- **Quarterly Execution Horizon**: Milestone target tracker comparing planned vs. actual output.

### 6. 🏆 Gamification & Executive Leaderboard
- **XP & Levels System**: Earn XP for completions, bonus multipliers for multi-day streaks, and rank progression.
- **Milestone Badges**: Unlockable achievements across discipline, focus volume, and streak length.
- **Cohort Leaderboard**: Weekly and all-time sprint rankings with peer performance comparison.

### 7. 🤖 Clera AI Copilot
- **Gemini-Powered Intelligence**: Server-side integration with Google Gemini with high-thinking mode.
- **Action Execution**: Directly analyzes habits, detects blockers, and provides concrete habit creation and optimization recommendations.

### 8. ☁️ Workspace & Cloud Integrations
- **Google Workspace (OAuth)**:
  - **Google Sheets**: Export habit logs and streaks to dedicated spreadsheets.
  - **Google Calendar**: Schedule daily habit focus sessions.
  - **Google Docs**: Generate formatted executive audit documents.
  - **Gmail**: Draft executive end-of-day digest emails.
- **Notion Database Sync**: Two-way connection pushing audit scores and habit execution directly into Notion databases.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **3D Graphics**: Three.js WebGL rendering engine
- **Backend**: Node.js, Express, Google GenAI SDK, Notion REST API
- **Persistence**: Local storage cache with external sync to Google Sheets, Docs, and Notion
- **Build System**: Vite with TypeScript type-checking

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation
1. Clone or download the repository:
   ```bash
   git clone <repository-url>
   cd manhattan-habit-audit
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables (optional, for external API keys):
   Copy `.env.example` to `.env` if using Gemini or Notion keys:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   NOTION_API_KEY=your_notion_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:3000`.

5. Build for production:
   ```bash
   npm run build
   npm start
   ```

---

## 📱 Mobile & PWA Usage
- **iOS Safari**: Tap **Share** ➔ **Add to Home Screen** to launch Manhattan in native full-screen mode.
- **Android Chrome**: Tap the menu (three dots) ➔ **Install App** or **Add to Home screen**.

---

## 📄 License
MIT License. Built for high-performance personal execution and audit integrity.
