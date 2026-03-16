import { Patient } from "@/types/dashboard";

export const patients: Patient[] = [
  {
    id: "maggie",
    name: "Maggie Thompson",
    age: 78,
    dementiaStage: "moderate",
    avatar: "https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=150&h=150&fit=crop&crop=face",
    status: "active",
    mood: "calm",
    occupation: "Former Teacher",
  },
  {
    id: "bill",
    name: "Bill Martinez",
    age: 82,
    dementiaStage: "early-moderate",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    status: "resting",
    mood: "content",
    occupation: "Former Carpenter",
  },
];
