# Horizon 🌅

> A mindful, privacy-first daily inventory, sobriety milestone tracker, and 12-Step recovery companion.

Horizon is an open-source progressive web application (PWA) engineered to support personal recovery, mindfulness, and daily spiritual fitness. Built with a local-first philosophy, Horizon puts complete privacy and data ownership in the user's hands—requiring no account creation, passwords, or personal identity tracking—while offering seamless cross-device cloud synchronization via anonymous backup codes.

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

### 📖 12-Step Recovery Curriculum
- **Structured Pathway**: Guided interactive modules exploring the principles, literature, and exercises of the 12 Steps.
- **Daily Micro-Lessons**: Digestible daily readings with contextual reflections and personal notes.
- **Step Progression & Unlocking**: Track days completed and milestones achieved as you work through each step.

### 🧘 Daily Inventory & Grounding Tools
- **Daily Inventory**: Morning intention setting and evening personal inventories to maintain spiritual fitness and self-honesty.
- **Guided Breathing Pacer**: Calming visual breath cycle guide supporting Box Breathing (4-4-4-4) and Relaxing 4-7-8 breathing techniques.
- **Urge Surfing Assistant**: A supportive mindfulness timer designed to ride out cravings through conscious observation and somatic grounding.
- **Serenity Prayer & Affirmations**: Quick-access mindful affirmations and prayers available at any moment of stress or temptation.
- **Emergency Helpline Directory**: Quick access to national and international crisis hotlines and fellowship resources.

### 🌐 Trilingual Localization
- Full native language support across all interfaces, lessons, prayers, and prompts:
  - **English**
  - **Español** (Spanish)
  - **Português** (Portuguese)

### 🔒 Privacy-First Architecture & Anonymous Cloud Sync
- **Local-First**: All journals, inventories, milestones, and settings are stored locally on your device by default (`localStorage` / offline state).
- **Zero Required Sign-In**: No email, passwords, phone numbers, or third-party trackers.
- **Anonymous Cloud Sync**: Generate an encrypted 6-character recovery code (`HZ-XXXX`) backed by Google Cloud Firestore to backup, migrate, or restore your recovery journal across devices or web browsers at any time.

### 📱 Progressive Web App (PWA)
- Fully installable on iOS (Safari "Add to Home Screen"), Android (Chrome "Install App"), and Desktop.
- Designed for mobile touch interaction, fluid spring animations with Motion, and offline availability.

---

## 🛠️ Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend & Serving**: [Express](https://expressjs.com/) + TypeScript runtime (`tsx` / `esbuild`)
- **Cloud Database**: [Google Cloud Firestore](https://firebase.google.com/docs/firestore) (for optional anonymous sync codes)

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

---

## 📂 Project Structure

```
├── public/                     # Static assets, PWA icons, and manifest
│   ├── icon.svg
│   ├── manifest.json
│   └── favicon.ico
├── src/
│   ├── components/             # UI Components
│   │   ├── HomeView.tsx        # Sobriety dial, keytag badge, daily affirmations
│   │   ├── LessonsView.tsx     # 12-Step curriculum and reflection journals
│   │   ├── ToolsView.tsx       # Breathing pacer, urge surfing, daily inventory
│   │   ├── TrackersView.tsx    # Sentiment analysis & recovery streak charts
│   │   ├── ProfileView.tsx     # Cloud sync codes, language selector, data export
│   │   ├── OnboardingView.tsx  # Initial setup & sync code recovery flow
│   │   ├── NavBar.tsx          # Navigation bar
│   │   └── MigrationBanner.tsx # Cross-domain migration notice
│   ├── context/
│   │   └── SanctuaryContext.tsx# Centralized state management & localization
│   ├── services/
│   │   └── cloudSync.ts        # Firestore anonymous cloud backup & restore
│   ├── lib/
│   │   └── firebase.ts         # Firebase SDK initialization singleton
│   ├── data/
│   │   └── lessons.json        # 12-Step structured curriculum data
│   ├── types.ts                # TypeScript interfaces and milestone types
│   ├── App.tsx                 # Root application component
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
