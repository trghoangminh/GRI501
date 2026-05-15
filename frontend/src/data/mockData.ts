import { User, Task, RoadmapItem, ChatMessage, DocumentItem, AnalyticsHour, AnalyticsScore, Topic } from '../types';

export const MOCK_USER: User = {
  name: "Alex Johnson",
  email: "alex@example.com",
  avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
  streak: 12
};

export const MOCK_TASKS: Task[] = [
  { id: 1, title: "Review React Hooks fundamentals", completed: true, type: "review" },
  { id: 2, title: "Read 'Advanced Patterns' Chapter 3", completed: false, type: "reading" },
  { id: 3, title: "Complete state management quiz", completed: false, type: "quiz" },
];

export const MOCK_ROADMAP: RoadmapItem[] = [
  { id: 1, title: "JavaScript Fundamentals", time: "Completed", status: "completed", desc: "Variables, functions, closures, and async JS." },
  { id: 2, title: "React Basics", time: "2 weeks", status: "in-progress", desc: "Components, props, state, and lifecycle." },
  { id: 3, title: "Advanced React", time: "3 weeks", status: "not-started", desc: "Context API, Refs, Portals, and Performance." },
  { id: 4, title: "State Management", time: "2 weeks", status: "not-started", desc: "Redux, Zustand, and server state with React Query." },
];

export const MOCK_CHAT_HISTORY: ChatMessage[] = [
  { id: 1, role: 'user', content: '', title: "React Lifecycle Methods", date: "Today" },
  { id: 2, role: 'user', content: '', title: "Explain Closures", date: "Yesterday" },
  { id: 3, role: 'user', content: '', title: "CSS Grid vs Flexbox", date: "Previous 7 days" },
];

export const MOCK_DOCS: DocumentItem[] = [
  { id: 1, name: "React_Handbook_2024.pdf", type: "PDF", date: "Oct 12", status: "ready" },
  { id: 2, name: "Lecture_04_Hooks.pptx", type: "Slides", date: "Oct 10", status: "ready" },
  { id: 3, name: "My_Notes_Context.docx", type: "Notes", date: "Oct 08", status: "processing" },
  { id: 4, name: "Performance_Optimizations.pdf", type: "PDF", date: "Oct 05", status: "ready" },
];

export const MOCK_ANALYTICS_HOURS: AnalyticsHour[] = [
  { name: 'Mon', hours: 2 }, { name: 'Tue', hours: 3.5 }, { name: 'Wed', hours: 1.5 },
  { name: 'Thu', hours: 4 }, { name: 'Fri', hours: 2.5 }, { name: 'Sat', hours: 5 }, { name: 'Sun', hours: 3 }
];

export const MOCK_ANALYTICS_SCORES: AnalyticsScore[] = [
  { name: 'Week 1', score: 65 }, { name: 'Week 2', score: 72 }, 
  { name: 'Week 3', score: 85 }, { name: 'Week 4', score: 91 }
];

export const MOCK_TOPICS: Topic[] = [
  { name: 'React', value: 45 }, { name: 'JS', value: 30 }, { name: 'CSS', value: 15 }, { name: 'HTML', value: 10 }
];

export const COLORS = ['#3B82F6', '#06B6D4', '#8B5CF6', '#10B981'];
