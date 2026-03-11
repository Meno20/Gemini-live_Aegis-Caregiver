'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  BookOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  Heart, 
  Briefcase, 
  Plane, 
  Users,
  Music,
  Home,
  Calendar,
  X,
  Save,
  Search
} from 'lucide-react'

export interface LifeStory {
  id: string
  title: string
  content: string
  category: 'career' | 'family' | 'travel' | 'hobbies' | 'music' | 'home' | 'other'
  decade?: string
  peopleMentioned: string[]
  emotions: string[]
  createdAt: Date
  updatedAt: Date
}

interface LifeStoryBankProps {
  stories: LifeStory[]
  onAddStory?: (story: Omit<LifeStory, 'id' | 'createdAt' | 'updatedAt'>) => void
  onEditStory?: (id: string, story: Partial<LifeStory>) => void
  onDeleteStory?: (id: string) => void
}

const categoryIcons: Record<string, React.ReactNode> = {
  career: <Briefcase className="h-4 w-4" />,
  family: <Users className="h-4 w-4" />,
  travel: <Plane className="h-4 w-4" />,
  hobbies: <Heart className="h-4 w-4" />,
  music: <Music className="h-4 w-4" />,
  home: <Home className="h-4 w-4" />,
  other: <BookOpen className="h-4 w-4" />
}

const categoryColors: Record<string, string> = {
  career: 'bg-amber-100 text-amber-700 border-amber-200',
  family: 'bg-pink-100 text-pink-700 border-pink-200',
  travel: 'bg-blue-100 text-blue-700 border-blue-200',
  hobbies: 'bg-green-100 text-green-700 border-green-200',
  music: 'bg-purple-100 text-purple-700 border-purple-200',
  home: 'bg-orange-100 text-orange-700 border-orange-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200'
}

const emotionEmojis: Record<string, string> = {
  happy: '😊',
  proud: '😎',
  nostalgic: '🥹',
  love: '❤️',
  excited: '🎉',
  peaceful: '😌',
  grateful: '🙏',
  hopeful: '🌟',
  bittersweet: '😢',
  funny: '😄'
}

const decades = ['1940s', '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s']

export function LifeStoryBank({ stories, onAddStory, onEditStory, onDeleteStory }: LifeStoryBankProps) {
  const [isAddingStory, setIsAddingStory] = useState(false)
  const [editingStory, setEditingStory] = useState<LifeStory | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  
  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<LifeStory['category']>('family')
  const [decade, setDecade] = useState('')
  const [people, setPeople] = useState('')
  const [emotions, setEmotions] = useState<string[]>([])

  const resetForm = () => {
    setTitle('')
    setContent('')
    setCategory('family')
    setDecade('')
    setPeople('')
    setEmotions([])
    setIsAddingStory(false)
    setEditingStory(null)
  }

  const handleSave = () => {
    const storyData = {
      title,
      content,
      category,
      decade: decade || undefined,
      peopleMentioned: people.split(',').map(p => p.trim()).filter(Boolean),
      emotions
    }

    if (editingStory) {
      onEditStory?.(editingStory.id, storyData)
    } else {
      onAddStory?.(storyData)
    }

    resetForm()
  }

  const handleEdit = (story: LifeStory) => {
    setTitle(story.title)
    setContent(story.content)
    setCategory(story.category)
    setDecade(story.decade || '')
    setPeople(story.peopleMentioned.join(', '))
    setEmotions(story.emotions)
    setEditingStory(story)
    setIsAddingStory(true)
  }

  const toggleEmotion = (emotion: string) => {
    setEmotions(prev => 
      prev.includes(emotion) 
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    )
  }

  // Filter stories
  const filteredStories = stories.filter(story => {
    const matchesSearch = !searchQuery || 
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !filterCategory || story.category === filterCategory
    return matchesSearch && matchesCategory
  })

  // Group stories by category
  const groupedStories = filteredStories.reduce((groups, story) => {
    const cat = story.category
    if (!groups[cat]) {
      groups[cat] = []
    }
    groups[cat].push(story)
    return groups
  }, {} as Record<string, LifeStory[]>)

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Life Story Bank
            </CardTitle>
            <Button 
              size="sm" 
              onClick={() => setIsAddingStory(true)}
              disabled={isAddingStory}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Story
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Store memories and stories for reminiscence therapy. Aegis uses these to connect with the patient.
          </p>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {Object.keys(categoryIcons).map(cat => (
            <Button
              key={cat}
              size="sm"
              variant={filterCategory === cat ? 'default' : 'outline'}
              onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
              className="capitalize"
            >
              {categoryIcons[cat]}
              <span className="ml-1 hidden sm:inline">{cat}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Add/Edit Form */}
      {isAddingStory && (
        <Card className="border-primary/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {editingStory ? 'Edit Story' : 'New Story'}
              </CardTitle>
              <Button size="sm" variant="ghost" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., First Day of Teaching"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as LifeStory['category'])}
                  className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  {Object.keys(categoryIcons).map(cat => (
                    <option key={cat} value={cat} className="capitalize">{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium">Story</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tell the story in first person, as the patient would remember it..."
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium">Decade</label>
                <select
                  value={decade}
                  onChange={(e) => setDecade(e.target.value)}
                  className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="">Select decade</option>
                  {decades.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">People Mentioned</label>
                <Input
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                  placeholder="e.g., Bob, Susan, Tommy"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium">Emotions</label>
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(emotionEmojis).map(([emotion, emoji]) => (
                  <Button
                    key={emotion}
                    size="sm"
                    variant={emotions.includes(emotion) ? 'default' : 'outline'}
                    onClick={() => toggleEmotion(emotion)}
                    className="text-xs"
                  >
                    {emoji} {emotion}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!title || !content}>
                <Save className="h-4 w-4 mr-1" />
                Save Story
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stories List */}
      <ScrollArea className="h-[500px] pr-4">
        {filteredStories.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No stories found</p>
              <p className="text-xs">Add stories to help Aegis connect with the patient</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedStories).map(([cat, categoryStories]) => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded ${categoryColors[cat]}`}>
                    {categoryIcons[cat]}
                  </div>
                  <h3 className="font-medium capitalize">{cat}</h3>
                  <Badge variant="secondary">{categoryStories.length}</Badge>
                </div>
                
                <div className="space-y-2">
                  {categoryStories.map((story) => (
                    <Card key={story.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{story.title}</h4>
                              {story.decade && (
                                <Badge variant="outline" className="text-xs">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {story.decade}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {story.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {story.peopleMentioned.length > 0 && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  {story.peopleMentioned.slice(0, 3).join(', ')}
                                  {story.peopleMentioned.length > 3 && `+${story.peopleMentioned.length - 3}`}
                                </div>
                              )}
                              {story.emotions.length > 0 && (
                                <div className="flex items-center gap-0.5">
                                  {story.emotions.slice(0, 3).map(e => (
                                    <span key={e} title={e}>
                                      {emotionEmojis[e]}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleEdit(story)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => onDeleteStory?.(story.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

// Sample stories for demo
export const sampleStories: LifeStory[] = [
  {
    id: '1',
    title: 'First Day of Teaching',
    content: "In 1965, I walked into Lincoln Elementary for my first day as a teacher. I was so nervous my hands were shaking. But then little Tommy Wilson handed me a crayon drawing of a sun, and I knew I was exactly where I belonged.",
    category: 'career',
    decade: '1960s',
    peopleMentioned: ['Tommy Wilson'],
    emotions: ['nervous', 'proud', 'happy'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    title: 'Wedding Day',
    content: "Bob and I got married on June 12, 1962, at St. Mary's Church. My father walked me down the aisle, and I remember thinking Bob was the most handsome man I'd ever seen. We danced to 'Unforgettable' by Nat King Cole.",
    category: 'family',
    decade: '1960s',
    peopleMentioned: ['Bob', 'father'],
    emotions: ['love', 'happy', 'nostalgic'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '3',
    title: 'Teacher of the Year',
    content: "In 1985, I was surprised with the Teacher of the Year award. The whole school gathered in the auditorium, and the superintendent presented me with a plaque. My students made me a card with all their handprints on it.",
    category: 'career',
    decade: '1980s',
    peopleMentioned: [],
    emotions: ['proud', 'grateful', 'happy'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '4',
    title: 'Gardening with Mom',
    content: "Every spring, my mother and I would plant tomatoes and marigolds in our backyard. She taught me that marigolds keep the pests away. I still love the smell of fresh soil and the feeling of seeds in my hands.",
    category: 'hobbies',
    decade: '1950s',
    peopleMentioned: ['Mom'],
    emotions: ['peaceful', 'nostalgic', 'happy'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  }
]
