export interface User {
  name: string;
  email: string;
  avatar: string;
  streak: number;
}

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  type: string;
}

export interface RoadmapItem {
  id: number;
  title: string;
  time: string;
  status: 'not-started' | 'in-progress' | 'completed';
  desc: string;
}

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  title?: string;
  date?: string;
}

export interface DocumentItem {
  id: number;
  name: string;
  type: string;
  date: string;
  status: 'ready' | 'processing';
}

export interface AnalyticsHour {
  name: string;
  hours: number;
}

export interface AnalyticsScore {
  name: string;
  score: number;
}

export interface Topic {
  name: string;
  value: number;
}
