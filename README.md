# 📚 The Planner - Student Study App

A comprehensive, feature-rich mobile application designed to help students organize their studies, track progress, and achieve academic excellence. Built with React Native and Expo for cross-platform compatibility.

---

## ✨ Features Overview

### 📋 Subject & Task Management
- **Hierarchical Organization**: Create subjects → topics → sub-topics → tasks for structured learning
- **Priority Levels**: Mark tasks as Low, Medium, or High priority
- **Due Dates**: Set deadlines and track upcoming tasks
- **Task Notes**: Add detailed notes to any task for reference
- **Complete/Incomplete Tracking**: Toggle task completion with timestamps

### ⏱️ Focus Timer (Pomodoro-Style)
- **Preset Durations**: Quick start with 25min, 40min, or 90min study sessions
- **Context-Aware**: Link focus sessions to specific subjects, topics, or tasks
- **Pause/Resume**: Flexible control over your study sessions
- **Auto-Save**: Sessions are automatically saved when completed (min 10 seconds)
- **Vibration Alerts**: Get notified when your timer completes
- **Daily Stats**: Track total study minutes for the day

### 🎯 Smart Today (AI-Powered Suggestions)
- **Intelligent Prioritization**: Get personalized daily study recommendations
- **Priority-Based Sorting**:
  - 🔥 Exam-related tasks (exam within 7 days)
  - ⚠️ Missed/overdue tasks
  - ⭐ High priority pending tasks
  - 📅 Tasks due soon
  - ⚖️ Balanced across all subjects

### 📝 Notes System
- **Daily Notes**: Write and save notes for any date
- **Calendar Navigation**: Browse notes by date easily
- **Rich Content**: Capture thoughts, learnings, and ideas
- **Task-Specific Notes**: Attach notes directly to tasks

### 📊 Analytics Dashboard
- **Completion Rates**: Track overall and per-subject task completion
- **Study Time Tracking**: See total minutes studied per subject
- **Streak Tracking**: Monitor your consistency
- **Subject Health Scores**: Visual indicators (Strong/Good/Needs Attention/Critical)
- **Weekly Reviews**: Summarized weekly performance insights

### 📖 Exam Mode
- **Exam Scheduling**: Create exam entries with target dates
- **Countdown Display**: See days remaining until your exam
- **Priority Tasks**: Link high-priority tasks to specific exams
- **Active Mode**: Set one exam as active for focused preparation

### 💡 Daily Reflections
- **What You Learned**: Record daily learnings
- **What Was Difficult**: Note challenging concepts for review
- **Self-Awareness**: Build metacognitive skills over time

### 🌐 Offline Support
- **Action Queue**: Continue working offline without interruption
- **Auto-Sync**: Changes automatically sync when back online
- **Network Status**: Real-time connectivity indicator
- **Queue Processing**: View and manage pending offline actions

### 💾 Data Backup
- **Export All Data**: Generate complete JSON backup
- **Clipboard Export**: Easy copy-paste backup solution
- **Comprehensive**: Includes subjects, tasks, notes, sessions, and more

---

## 🎓 How It's Useful for Students

### Stay Organized
- Break down complex syllabi into manageable subjects and topics
- Never lose track of what you need to study with clear task hierarchies
- Keep all study materials and notes in one place

### Boost Productivity
- Use the Pomodoro-style focus timer to maintain concentration
- Smart Today feature eliminates decision fatigue—just follow the suggestions
- Priority system ensures you tackle the most important tasks first

### Track Progress
- Visual health scores show which subjects need more attention
- Analytics dashboard provides insights into your study habits
- Completion rates and streaks motivate continued effort

### Prepare for Exams
- Exam Mode keeps you focused on what matters most
- Countdown timers create urgency without stress
- Link specific tasks to exams for targeted preparation

### Build Better Habits
- Daily reflections encourage metacognition and self-improvement
- Streak tracking rewards consistency
- Weekly reviews help identify patterns and areas for growth

### Never Lose Data
- Cloud sync with Supabase keeps everything backed up
- Offline mode ensures you can study anywhere
- Manual export option for additional peace of mind

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Supabase account (for backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/PJharwal/The_Planner_mobileapp.git

# Navigate to the project
cd todo_app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run the app
npm start
# Or use tunnel for mobile testing
npm run tunnel
```

### Database Setup
Run the SQL schema in your Supabase project:
```bash
# Navigate to supabase folder
# Copy contents of schema.sql to Supabase SQL Editor
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform mobile framework |
| **Expo** | Development and build tooling |
| **TypeScript** | Type-safe JavaScript |
| **Supabase** | Backend-as-a-Service (Auth + Database) |
| **Zustand** | State management |
| **NativeWind** | Tailwind CSS for React Native |
| **date-fns** | Date manipulation utilities |
| **Phosphor Icons** | Beautiful icon library |

---

## 📱 App Structure

```
src/
├── app/                 # Expo Router pages
│   ├── (auth)/         # Auth screens (login, signup)
│   ├── (tabs)/         # Main tab navigation
│   │   ├── index.tsx   # Home (Today's tasks + Smart Today)
│   │   ├── subjects.tsx# Subject management
│   │   ├── notes.tsx   # Daily notes
│   │   ├── analytics.tsx# Stats & insights
│   │   └── profile.tsx # User settings & backup
│   ├── focus/          # Focus timer screen
│   ├── subject/        # Subject detail
│   ├── topic/          # Topic detail
│   └── exam/           # Exam mode
├── components/         # Reusable UI components
├── store/              # Zustand state stores
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── lib/                # External integrations
└── types/              # TypeScript definitions
```

---

## 🔐 Authentication

The app uses Supabase Auth for secure user authentication:
- Email/password sign-up and login
- Session persistence
- Row Level Security (RLS) ensures data privacy

---

## 📄 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo development server |
| `npm run android` | Run on Android emulator |
| `npm run ios` | Run on iOS simulator |
| `npm run web` | Run in web browser |
| `npm run tunnel` | Start with tunnel for testing on physical device |
| `npm test` | Run Jest tests |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

This project is private and proprietary.

---

## 👨‍💻 Author

**P. Jharwal**

---

<p align="center">
  <strong>📚 Study Smart, Not Hard! 📚</strong>
</p>
