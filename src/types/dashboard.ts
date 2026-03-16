export interface Patient {
  id: string;
  name: string;
  age: number;
  dementiaStage: string;
  avatar: string;
  status: string;
  mood: string;
  occupation: string;
}

export interface Message {
  id: number;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

export interface ConversationsMap {
  [patientId: string]: Message[];
}

export type ViewType = "dashboard" | "insights" | "conversations" | "health" | "careteam" | "settings";
