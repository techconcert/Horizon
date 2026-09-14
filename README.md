# Horizon 🌅

> A mindful, privacy-first daily inventory, sobriety milestone tracker, and 12-Step recovery companion.

Horizon is an open-source progressive web application (PWA) engineered to support personal recovery, mindfulness, and daily spiritual fitness. Built with a local-first philosophy, Horizon puts complete privacy and data ownership in the user's hands—requiring no account creation, passwords, or personal identity tracking—while offering seamless cross-device cloud synchronization via anonymous backup codes.

Current Version: **v2.4.6**

---

## ✨ Key Features

### ⏱️ Grounded Sobriety Counter & NA Milestone Keytags
- **Precision Sober Counter**: Real-time counter tracking years, months, days, hours, minutes, and seconds of continuous recovery.
- **Narcotics Anonymous (NA) Milestone Droplet Badges**: Authentic droplet-shaped anniversary keytags matching fellowship milestone traditions:
  - **White (1 Day / Welcome)**: First day of hope and surrender.
  - **Orange (30 Days)**: One month of daily progress.
  - **Green (60 Days)**: Two months clean and serene.
  - **Red (90 Days)**: Three months of foundational recovery.
  - **Blue (6 Months)**: Half a year of transformation.
  - **Yellow (9 Months)**: Nine months of growth.
  - **Moonglow / Glow-in-the-Dark (1 Year)**: First year anniversary luminescent keytag.
  - **Grey (18 Months)**: A year and a half milestone.
  - **Black (Multiple Years)**: Enduring commitment and service.

### ☀️ "Just for Today" Daily 24-Hour Commitment
- **Daily 24-Hour Cycle**: Grounded in the foundational recovery principle of taking life "just for today."
- **Local Midnight Rollover**: The 24-hour cycle automatically resets at the user's local midnight, enabling a fresh, conscious renewal each morning.
- **Real-Time Elapsed Time & Progress Bar**: Synchronized digital clock and progress bar tracking the passage of the current 24-hour block from 0% to 100%.
- **Active Commitment Countdown**: Live remaining-time countdown displayed during active daily commitments.
- **One-Tap Affirmation & Renewal**: Meaningful affirmations to anchor intention and focus throughout the day.

### ⭕ Daily Recovery Practices Tracker (`o-o-o-o`)
- **Five Core Recovery Pillars**:
  1. **Just for Today**: Conscious 24-hour sobriety commitment.
  2. **Daily Check-In**: Morning or evening reflection and mood inventory.
  3. **Meditation Practice**: Step 11 guided meditation or quiet stillness.
  4. **Mindful Breathing**: Somatic nervous system regulation (Box Breathing or 4-7-8).
  5. **12-Step Lesson Study**: Engaging with curriculum readings and exercises.
- **4 of 5 Daily Goal**: Complete any 4 of the 5 daily practices to achieve the day's recovery goal.
- **Interactive Bead Progress**: Visual `o-o-o-o` progress indicator with real-time status breakdowns and historic calendar tracking.

### 💡 Daily Rotating Focus Messages
- **Automatic Midnight Rotation**: Inspiring, grounded recovery reflections that change daily without requiring manual input or internet connection.
- **Trilingual Thought Library**: Contextually curated thoughts for the day across English, Spanish, and Portuguese.

### 📖 12-Step Recovery Curriculum
- **Structured Pathway**: Guided interactive modules exploring the principles, literature, and exercises of all 12 Steps.
- **Daily Micro-Lessons**: Digestible daily readings with contextual reflections and personal notes.
- **Step Progression & Unlocking**: Track sub-lesson statuses (Unread, In Progress, Read) and milestone accomplishments as you progress through each step.

### 🧘 Meditation & Step 11 Mindful Rituals
- **Dedicated Meditation Suite**: Purpose-built environment for spiritual reflection, contemplation, and mindful grounding.
- **Guided Breathing Pacer**: Calming visual breath cycle guide supporting Box Breathing (4-4-4-4) and Relaxing 4-7-8 breathing techniques.
- **Urge Surfing Assistant**: A supportive mindfulness timer designed to ride out cravings through conscious observation and somatic grounding.
- **Ambient Chimes & Bells**: Soothing audio chimes to gently bookend meditation sessions.
- **Serenity Prayer & Affirmations**: Instant access to spiritual affirmations in moments of acute stress.

### 🆘 Emergency Support & "Reach Out" SOS
- **One-Tap Access**: Prominent, horizontally aligned top-bar SOS button accessible from any screen.
- **Personalized Contacts**: Dedicated fields for trusted sponsor contacts and personal recovery numbers.
- **Emergency Helplines**: Pre-configured access to national and international crisis hotlines (with support for custom helpline overrides).
- **Fellowship Resources**: Fast links to local meeting directories and online fellowship rooms.

### 🤝 Fellowships & Brotherhood Tracker
- **Multi-Fellowship Milestones**: Record and celebrate clean dates across diverse fellowships (AA, NA, Al-Anon, etc.).
- **Anniversary Reminders**: Track individual entry dates and days grounded across each fellowship community.

### 🌐 Trilingual Localization
- Full native language support across all interfaces, lessons, prayers, and prompts:
  - **English**
  - **Español** (Spanish)
  - **Português** (Portuguese)
- Automatic system locale detection with instant in-app language switching.

### 🔒 Privacy-First Architecture & Anonymous Cloud Sync
- **Local-First by Default**: All journals, inventories, milestones, and settings are stored locally on your device (`localStorage` / offline state).
- **Zero Required Sign-In**: No email, passwords, phone numbers, or third-party trackers.
- **Anonymous Cloud Sync**: Generate an encrypted 6-character recovery code (`HZ-XXXX`) backed by Google Cloud Firestore to backup, migrate, or restore your recovery journal across devices or web browsers at any time.
- **High-Efficiency Data Compression**: Utilizes LZString compression and compact data representations to keep backups minimal, fast, and free-tier sustainable.
- **Biometric / Privacy Lock**: Optional app-level biometric authentication gate using standard WebAuthn APIs.
- **Complete Data Sovereignty**: Full JSON export and import capabilities with secure local cache clearing and permanent deletion controls.

### 🛡️ Administrative Maintenance & System Diagnostics
- **Operator Diagnostics**: Dedicated administrative tooling allowing authorized operators to inspect database hygiene, monitor anonymous backup retention, and perform safe record archiving.
- **Zero Exposure**: Engineered with strict role-based access safeguards to protect platform integrity and preserve user confidentiality.

### 📱 Progressive Web App (PWA)
- Fully installable on iOS (Safari "Add to Home Screen"), Android (Chrome "Install App"), and Desktop.
- Designed for mobile touch interaction, fluid spring animations with Motion, native safe-area notch awareness, and haptic pull-to-refresh.

---

## 🛠️ Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend & Serving**: [Express](https://expressjs.com/) + TypeScript runtime (`tsx` / `esbuild`)
- **Cloud Database**: [Google Cloud Firestore](https://firebase.google.com/docs/firestore) (for optional anonymous sync codes)
- **Data Compression**: [lz-string](https://github.com/pieroxy/lz-string)
- **Testing**: Built-in Node.js Test Runner via `tsx --test`

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- `npm` or `bun` / `pnpm`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/horizon.git
   cd horizon
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Copy `.env.example` to `.env` if you are using custom backend services or Gemini AI capabilities:
   ```bash
   cp .env.example .env
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

### Production Build

To build the static frontend assets and bundle the Express server:

```bash
npm run build
npm start
```

### Running Tests

Execute the automated test suite covering cloud sync compression, data hydration, and daily practice logic:

```bash
npm test
```

---

## 📂 Project Structure

```
├── public/                     # Static assets, PWA icons, and manifest
│   ├── icon.svg
│   ├── manifest.json
│   ├── horizon_header_1.png    # Primary header visual
│   ├── horizon_header_2.png    # Secondary theme header visual
│   └── favicon.ico
├── src/
│   ├── components/             # UI Components
│   │   ├── HomeView.tsx        # Sobriety counter, 24h commitment, keytags, daily practices
│   │   ├── LessonsView.tsx     # 12-Step curriculum and reflection journals
│   │   ├── MeditationView.tsx  # Step 11 guided meditation, breathing pacers, soundscapes
│   │   ├── ToolsView.tsx       # Urge surfing, daily inventory, spiritual affirmations
│   │   ├── TrackersView.tsx    # Recovery analytics, sentiment & milestone history
│   │   ├── ProfileView.tsx     # Cloud sync codes, fellowships, export/import, settings
│   │   ├── OnboardingView.tsx  # Initial setup & sync code recovery flow
│   │   ├── SOSModal.tsx        # Emergency Reach Out support & helpline modal
│   │   ├── AdminView.tsx       # Authorized operator diagnostics & maintenance
│   │   ├── NavBar.tsx          # Bottom navigation bar
│   │   └── MigrationBanner.tsx # Cross-domain migration notice
│   ├── context/
│   │   ├── HorizonContext.tsx  # Centralized state management & localization
│   │   └── SanctuaryContext.tsx# Backward-compatibility alias wrapper
│   ├── services/
│   │   └── cloudSync.ts        # Firestore anonymous cloud backup, compression & restore
│   ├── lib/
│   │   └── firebase.ts         # Firebase SDK initialization singleton
│   ├── data/
│   │   ├── lessons.json        # 12-Step structured curriculum data
│   │   └── dailyFocusMessages.ts # Daily rotating recovery reflections
│   ├── utils/
│   │   ├── dailyPractices.ts   # Daily 4-of-5 practice calculation utilities
│   │   ├── migration.ts        # LocalStorage migration and key management
│   │   └── webauthn.ts         # Biometric authentication helpers
│   ├── types.ts                # TypeScript interfaces and milestone types
│   ├── App.tsx                 # Root application component & layout header
│   ├── main.tsx                # Client DOM entry point
│   └── index.css               # Tailwind CSS theme entry point
├── server.ts                   # Express server with Vite middleware integration
├── LICENSE                     # GNU General Public License v3.0
├── package.json                # Project dependencies and build scripts
└── README.md                   # Project documentation
```

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0** (GPLv3).

```
Horizon - Mindful Daily Inventory & Recovery Companion
Copyright (C) 2026 Horizon Contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```

See the [LICENSE](LICENSE) file for the full license text.

