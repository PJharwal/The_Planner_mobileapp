# 📚 The Planner - Student Study App

A comprehensive, feature-rich mobile application designed to help students organize their studies, track progress, and achieve academic excellence. Built with React Native and Expo for cross-platform compatibility.

---

## ✨ Features Overview

### 📋 Subject & Task Management
- **Hierarchical Organization**: Create subjects → topics → sub-topics → tasks for structured learning
- **Priority Levels**: Mark tasks as Low, Medium, or High priority with color-coded indicators
- **Due Dates**: Set deadlines and track upcoming tasks
- **Task Notes**: Add detailed notes to any task for reference
- **Complete/Incomplete Tracking**: Toggle task completion with timestamps
- **Quick Add Task**: Create tasks instantly from the home screen without navigating
- **Add to Today**: Bulk-add all pending tasks from a subject, topic, or sub-topic to today's list

### 🔍 Global Search
- **Universal Search**: Find subjects, topics, sub-topics, tasks, and notes from one search bar
- **Instant Results**: Real-time search with type indicators and breadcrumb navigation
- **Quick Actions**: Add search results directly to Today's task list with one tap
- **Smart Navigation**: Jump directly to any item in the hierarchy

### ⏱️ Focus Timer (Pomodoro-Style)
- **Preset Durations**: Quick start with 25min, 40min, or 90min study sessions
- **Context-Aware**: Link focus sessions to specific subjects, topics, or tasks
- **Pause/Resume**: Flexible control over your study sessions
- **Auto-Save**: Sessions are automatically saved when completed (min 10 seconds)
- **Vibration Alerts**: Get notified when your timer completes
- **Daily Stats**: Track total study minutes for the day

### 🎯 Smart Today (AI-Powered Suggestions)
- **Intelligent Prioritization**: Get personalized daily study recommendations
- **Collapsible Interface**: Expandable dropdown to keep your home screen clean
- **Priority-Based Sorting**:
  - 🔥 Exam-related tasks (exam within 7 days)
  - ⚠️ Missed/overdue tasks
  - ⭐ High priority pending tasks
  - 📅 Tasks due soon
  - ⚖️ Balanced across all subjects
- **Dismissible Cards**: Remove suggestions you don't want to see

### ⚠️ Missed Task Recovery
- **Overdue Detection**: Automatically identifies tasks past their due date
- **Days Overdue Counter**: See how many days each task has been missed
- **Quick Actions**:
  - Reschedule to today with one tap
  - Skip with reason tracking (too difficult, no time, low priority)
- **Subject Context**: See which subject each missed task belongs to

### 📝 Notes System
- **Daily Notes**: Write and save notes for any date
- **Calendar Navigation**: Browse notes by date easily
- **Rich Content**: Capture thoughts, learnings, and ideas
- **Task-Specific Notes**: Attach notes directly to tasks
- **Searchable**: Find notes through global search

### 📊 Analytics Dashboard
- **Completion Rates**: Track overall and per-subject task completion
- **Study Time Tracking**: See total minutes studied per subject
- **Streak Tracking**: Monitor your daily consistency (displayed on home screen)
- **Subject Health Scores**: Visual indicators (Strong/Good/Needs Attention/Critical)
- **Weekly Reviews**: Summarized weekly performance insights

### 📖 Exam Mode
- **Exam Scheduling**: Create exam entries with target dates
- **Countdown Display**: See days remaining until your exam
- **Exam Alerts**: Visual warnings when exams are within 7 days
- **Priority Tasks**: Link high-priority tasks to specific exams
- **Active Mode**: Set one exam as active for focused preparation

### 💡 Daily Reflections
- **Prompted Journaling**: Automatic prompts after completing your first task
- **What You Learned**: Record daily learnings
- **What Was Difficult**: Note challenging concepts for review
- **Self-Awareness**: Build metacognitive skills over time

### 👤 Personalization
- **Editable Display Name**: Customize your greeting name
- **Time-Based Greetings**: Dynamic greetings (Good morning/afternoon/evening)
- **Profile Stats**: Quick view of subjects, completed tasks, and progress %

### 🌐 Offline Support
- **Action Queue**: Continue working offline without interruption
- **Auto-Sync**: Changes automatically sync when back online
- **Network Status**: Real-time connectivity indicator
- **Queue Processing**: View and manage pending offline actions

### 💾 Data Backup
- **Export All Data**: Generate complete JSON backup
- **One-Tap Export**: Easy share/save backup solution
- **Comprehensive**: Includes subjects, topics, tasks, notes, sessions, and more

---

## 🎓 How It's Useful for Students

### Stay Organized
- Break down complex syllabi into manageable subjects and topics
- Never lose track of what you need to study with clear task hierarchies
- Keep all study materials and notes in one place
- Use global search to instantly find anything in your study materials

### Boost Productivity
- Use the Pomodoro-style focus timer to maintain concentration
- Smart Today feature eliminates decision fatigue—just follow the suggestions
- Priority system ensures you tackle the most important tasks first
- Quick Add lets you capture tasks instantly without context switching

### Track Progress
- Visual health scores show which subjects need more attention
- Analytics dashboard provides insights into your study habits
- Completion rates and streaks motivate continued effort
- Daily reflections help you understand your learning patterns

### Handle Missed Tasks
- Never lose track of overdue work with automatic detection
- Quickly reschedule or skip tasks with tracked reasons
- Stay on top of your workload even when things slip through

### Prepare for Exams
- Exam Mode keeps you focused on what matters most
- Countdown timers create urgency without stress
- Exam alerts appear on home screen when exams are near
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
| **React Native Paper** | Material Design components |
| **date-fns** | Date manipulation utilities |
| **Ionicons** | Icon library |
| **NetInfo** | Network connectivity monitoring |

---

## 📱 App Structure

```
src/
├── app/                 # Expo Router pages
│   ├── (auth)/         # Auth screens (login, signup)
│   ├── (tabs)/         # Main tab navigation
│   │   ├── index.tsx   # Home (Today's tasks + Smart Today + Search)
│   │   ├── subjects.tsx# Subject management
│   │   ├── notes.tsx   # Daily notes
│   │   ├── analytics.tsx# Stats & insights
│   │   └── profile.tsx # User settings & backup
│   ├── focus/          # Focus timer screen
│   ├── subject/        # Subject detail
│   ├── topic/          # Topic detail
│   ├── subtopic/       # Sub-topic detail
│   └── exam/           # Exam mode
├── components/         # Reusable UI components
│   └── ui/             # Design system components
├── store/              # Zustand state stores
│   ├── authStore.ts    # Authentication state
│   ├── taskStore.ts    # Task management
│   ├── timerStore.ts   # Focus timer sessions
│   ├── examStore.ts    # Exam mode state
│   ├── reflectionStore.ts # Daily reflections
│   ├── subjectStore.ts # Subject data
│   └── userStore.ts    # User preferences
├── hooks/              # Custom React hooks
│   └── useNetworkStatus.ts # Offline/online detection
├── utils/              # Utility functions
│   ├── smartToday.ts   # AI task suggestions
│   ├── missedTasks.ts  # Overdue task recovery
│   ├── globalSearch.ts # Universal search
│   ├── addToToday.ts   # Bulk add to today
│   ├── offlineQueue.ts # Offline action queue
│   ├── healthScore.ts  # Subject health calculation
│   ├── weeklyReview.ts # Weekly insights
│   └── dataExport.ts   # Backup generation
├── lib/                # External integrations
│   └── supabase.ts     # Supabase client
├── constants/          # App constants
│   └── theme.ts        # Design tokens & colors
└── types/              # TypeScript definitions
```

---

## 🎨 Design System

The app uses a consistent design system with:

- **Pastel Color Palette**: Mint, Peach, Mist Blue, Beige, and more
- **Dark Theme**: Modern dark background with high-contrast text
- **Semantic Colors**: Success, Warning, Error states
- **Priority Colors**: Visual distinction for Low/Medium/High priority
- **Consistent Spacing**: 4px grid system
- **Border Radius**: Rounded corners for card components

---

## 🔐 Authentication

The app uses Supabase Auth for secure user authentication:
- Email/password sign-up and login
- Session persistence
- Row Level Security (RLS) ensures data privacy
- Automatic session refresh

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

## 🧪 Testing

The app includes Jest tests for core functionality:
- Component tests
- Utility function tests
- Store tests

Run tests with:
```bash
npm test
```

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
