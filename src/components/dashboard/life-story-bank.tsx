"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Plus, 
  Play, 
  Pause,
  Calendar,
  MapPin,
  Users,
  Heart,
  Briefcase,
  GraduationCap,
  Home,
  Music
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LifeStoryBankProps {
  patientId: string;
  patientName: string;
}

const categoryIcons: Record<string, typeof Heart> = {
  childhood: GraduationCap,
  career: Briefcase,
  family: Users,
  hobbies: Music,
  achievements: Heart,
  home: Home,
};

const categoryColors: Record<string, string> = {
  childhood: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
  career: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
  family: "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400",
  hobbies: "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400",
  achievements: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
  home: "bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400",
};

const lifeStories = [
  {
    id: 1,
    title: "First Day Teaching",
    category: "career",
    date: "September 1965",
    content: "I remember walking into my first classroom at Lincoln Elementary. Twenty-five third graders looking up at me with curious eyes. I was so nervous, but the moment I started teaching, everything felt right. Teaching was my calling.",
    mediaUrl: null,
    isPlaying: false,
  },
  {
    id: 2,
    title: "Wedding Day",
    category: "family",
    date: "June 20, 1968",
    content: "Robert and I got married at St. Mary's Church. The flowers were beautiful - white roses and baby's breath. My mother made my dress. Robert couldn't stop smiling. It was the happiest day of my life.",
    mediaUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400",
    isPlaying: false,
  },
  {
    id: 3,
    title: "Summer at the Lake",
    category: "childhood",
    date: "August 1950",
    content: "Every summer, our family would drive to Lake Tahoe. Dad would fish early in the morning, and Mom would make breakfast over the campfire. We'd swim all day until the sun went down. Those were magical times.",
    mediaUrl: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400",
    isPlaying: false,
  },
  {
    id: 4,
    title: "Teacher of the Year Award",
    category: "achievements",
    date: "May 1985",
    content: "After 20 years of teaching, I received the District Teacher of the Year award. My students wrote letters about how I had touched their lives. Reading them brought tears to my eyes. I had made a difference.",
    mediaUrl: null,
    isPlaying: false,
  },
  {
    id: 5,
    title: "Garden Club President",
    category: "hobbies",
    date: "1995-2000",
    content: "I served as president of the Riverside Garden Club for five years. We transformed the town square with beautiful flowers. Every Saturday morning, I'd tend to my roses - they were the pride of our neighborhood.",
    mediaUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
    isPlaying: false,
  },
  {
    id: 6,
    title: "Our First Home",
    category: "home",
    date: "1970",
    content: "Robert and I bought our first home on Maple Street. It needed work, but we made it ours. I painted the kitchen yellow - the color of sunshine. We raised all three of our children in that house.",
    mediaUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
    isPlaying: false,
  },
];

const categories = ["all", "childhood", "career", "family", "hobbies", "achievements", "home"];

export function LifeStoryBank({ patientId, patientName }: LifeStoryBankProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [playingId, setPlayingId] = useState<number | null>(null);

  const filteredStories = lifeStories.filter((story) => {
    const matchesCategory = selectedCategory === "all" || story.category === selectedCategory;
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          story.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePlay = (id: number) => {
    setPlayingId(playingId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:border-emerald-800 dark:from-emerald-950/30 dark:to-teal-950/30">
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Life Story Bank</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Preserving memories for reminiscence therapy. AI uses these stories to provide personalized comfort 
                and spark meaningful conversations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search stories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:w-64"
        />
        <ScrollArea className="w-full sm:w-auto">
          <div className="flex gap-2 pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "bg-emerald-500 hover:bg-emerald-600" : ""}
              >
                {category === "all" ? "All Stories" : category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Stories Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {filteredStories.map((story) => {
            const Icon = categoryIcons[story.category] || BookOpen;
            const isPlaying = playingId === story.id;
            
            return (
              <motion.div
                key={story.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                  {story.mediaUrl && (
                    <div className="h-40 overflow-hidden">
                      <img 
                        src={story.mediaUrl} 
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${categoryColors[story.category]}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{story.title}</CardTitle>
                          <CardDescription className="flex items-center gap-1 text-xs">
                            <Calendar className="h-3 w-3" />
                            {story.date}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {story.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">{story.content}</p>
                    <div className="flex items-center gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => handlePlay(story.id)}
                        className="flex-1"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Play Story
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add New Story */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium">Add a New Memory</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Preserve another precious memory for {patientName.split(' ')[0]}
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Story
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
