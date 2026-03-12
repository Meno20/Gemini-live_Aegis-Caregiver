'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Heart, 
  Users, 
  Briefcase, 
  Music, 
  AlertTriangle,
  Pill,
  Phone,
  Save,
  Edit2,
  Plus,
  X,
  Calendar,
  MapPin
} from 'lucide-react'

export interface PatientProfileData {
  id: string
  fullName: string
  preferredName: string
  dateOfBirth: string
  pronouns: string
  diagnosisStage: 'mild' | 'moderate' | 'severe'
  diagnosisType: string
  diagnosisDate: string
  
  spouseName: string
  spouseStatus: string
  childrenNames: string[]
  grandchildrenNames: string[]
  
  occupation: string
  careerHighlights: string
  hometown: string
  
  favoriteMusic: string
  favoriteFoods: string
  hobbies: string[]
  calmingActivities: string[]
  
  medications: Array<{ name: string; dosage: string; schedule: string; description?: string }>
  medicalConditions: string[]
  allergies: string[]
  
  topicsThatEngage: string[]
  topicsToAvoid: string[]
  triggersToAvoid: string[]
  communicationTips: string
  
  primaryCaregiverName: string
  primaryCaregiverRelationship: string
  emergencyContacts: Array<{ name: string; relationship: string; phone: string; isPrimary: boolean }>
}

interface PatientProfileEditorProps {
  profile: PatientProfileData
  onSave?: (profile: PatientProfileData) => void
}

export function PatientProfileEditor({ profile, onSave }: PatientProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<PatientProfileData>(profile)
  const [newItem, setNewItem] = useState<{ field: string; value: string }>({ field: '', value: '' })

  const updateField = (field: keyof PatientProfileData, value: unknown) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }))
  }

  const addToArray = (field: keyof PatientProfileData, value: string) => {
    if (!value.trim()) return
    const currentArray = editedProfile[field] as string[]
    if (!currentArray.includes(value.trim())) {
      updateField(field, [...currentArray, value.trim()])
    }
    setNewItem({ field: '', value: '' })
  }

  const removeFromArray = (field: keyof PatientProfileData, index: number) => {
    const currentArray = editedProfile[field] as string[]
    updateField(field, currentArray.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    onSave?.(editedProfile)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedProfile(profile)
    setIsEditing(false)
  }

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {editedProfile.preferredName[0]}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{editedProfile.fullName}</h2>
                <p className="text-sm text-muted-foreground">
                  {editedProfile.preferredName} • {calculateAge(editedProfile.dateOfBirth)} years old
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={
                    editedProfile.diagnosisStage === 'mild' ? 'default' :
                    editedProfile.diagnosisStage === 'moderate' ? 'secondary' : 'destructive'
                  }>
                    {editedProfile.diagnosisStage.charAt(0).toUpperCase() + editedProfile.diagnosisStage.slice(1)} {editedProfile.diagnosisType}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">Full Name</label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">{editedProfile.fullName}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Preferred Name</label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.preferredName}
                      onChange={(e) => updateField('preferredName', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">{editedProfile.preferredName}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Date of Birth</label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedProfile.dateOfBirth}
                      onChange={(e) => updateField('dateOfBirth', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">
                      {new Date(editedProfile.dateOfBirth).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Pronouns</label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.pronouns}
                      onChange={(e) => updateField('pronouns', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">{editedProfile.pronouns}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Career & Background
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">Occupation</label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.occupation}
                      onChange={(e) => updateField('occupation', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">{editedProfile.occupation || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Hometown</label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.hometown}
                      onChange={(e) => updateField('hometown', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">{editedProfile.hometown || 'N/A'}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Career Highlights</label>
                {isEditing ? (
                  <Textarea
                    value={editedProfile.careerHighlights}
                    onChange={(e) => updateField('careerHighlights', e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm mt-1">{editedProfile.careerHighlights || 'N/A'}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Tab */}
        <TabsContent value="medical" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Diagnosis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs text-muted-foreground">Stage</label>
                  {isEditing ? (
                    <select
                      value={editedProfile.diagnosisStage}
                      onChange={(e) => updateField('diagnosisStage', e.target.value)}
                      className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    >
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  ) : (
                    <p className="font-medium mt-1 capitalize">{editedProfile.diagnosisStage}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Type</label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.diagnosisType}
                      onChange={(e) => updateField('diagnosisType', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">{editedProfile.diagnosisType}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Diagnosis Date</label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedProfile.diagnosisDate}
                      onChange={(e) => updateField('diagnosisDate', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">
                      {editedProfile.diagnosisDate ? new Date(editedProfile.diagnosisDate).toLocaleDateString() : 'N/A'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Pill className="h-4 w-4" />
                Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {editedProfile.medications.map((med, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{med.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {med.dosage} • {med.schedule}
                        {med.description && ` • ${med.description}`}
                      </p>
                    </div>
                    {isEditing && (
                      <Button size="sm" variant="ghost" onClick={() => {
                        const newMeds = [...editedProfile.medications]
                        newMeds.splice(i, 1)
                        updateField('medications', newMeds)
                      }}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <Button size="sm" variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Medication
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Conditions & Allergies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground">Medical Conditions</label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {editedProfile.medicalConditions.map((condition, i) => (
                      <Badge key={i} variant="secondary" className="flex items-center gap-1">
                        {condition}
                        {isEditing && (
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('medicalConditions', i)} />
                        )}
                      </Badge>
                    ))}
                    {isEditing && (
                      <div className="flex gap-1">
                        <Input
                          value={newItem.field === 'medicalConditions' ? newItem.value : ''}
                          onChange={(e) => setNewItem({ field: 'medicalConditions', value: e.target.value })}
                          placeholder="Add..."
                          className="h-6 w-20 text-xs"
                          onKeyDown={(e) => e.key === 'Enter' && addToArray('medicalConditions', newItem.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Allergies</label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {editedProfile.allergies.map((allergy, i) => (
                      <Badge key={i} variant="destructive" className="flex items-center gap-1">
                        {allergy}
                        {isEditing && (
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('allergies', i)} />
                        )}
                      </Badge>
                    ))}
                    {isEditing && editedProfile.allergies.length === 0 && (
                      <span className="text-xs text-muted-foreground">No known allergies</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Music className="h-4 w-4" />
                Interests & Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">Favorite Music</label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.favoriteMusic}
                      onChange={(e) => updateField('favoriteMusic', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">{editedProfile.favoriteMusic || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Favorite Foods</label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.favoriteFoods}
                      onChange={(e) => updateField('favoriteFoods', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">{editedProfile.favoriteFoods || 'N/A'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Hobbies</label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {editedProfile.hobbies.map((hobby, i) => (
                    <Badge key={i} variant="outline" className="flex items-center gap-1">
                      {hobby}
                      {isEditing && (
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('hobbies', i)} />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Calming Activities</label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {editedProfile.calmingActivities.map((activity, i) => (
                    <Badge key={i} variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800">
                      {activity}
                      {isEditing && (
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('calmingActivities', i)} />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Communication Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Communication Tips</label>
                {isEditing ? (
                  <Textarea
                    value={editedProfile.communicationTips}
                    onChange={(e) => updateField('communicationTips', e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                ) : (
                  <p className="text-sm mt-1">{editedProfile.communicationTips || 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Topics That Engage</label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {editedProfile.topicsThatEngage.map((topic, i) => (
                    <Badge key={i} variant="outline" className="flex items-center gap-1 border-green-300 text-green-700">
                      {topic}
                      {isEditing && (
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('topicsThatEngage', i)} />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Topics to Avoid</label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {editedProfile.topicsToAvoid.map((topic, i) => (
                    <Badge key={i} variant="outline" className="flex items-center gap-1 border-red-300 text-red-700">
                      {topic}
                      {isEditing && (
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('topicsToAvoid', i)} />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Triggers to Avoid</label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {editedProfile.triggersToAvoid.map((trigger, i) => (
                    <Badge key={i} variant="destructive" className="flex items-center gap-1">
                      {trigger}
                      {isEditing && (
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('triggersToAvoid', i)} />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Family Tab */}
        <TabsContent value="family" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Family Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">Spouse</label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.spouseName}
                      onChange={(e) => updateField('spouseName', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">{editedProfile.spouseName || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Spouse Status</label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.spouseStatus}
                      onChange={(e) => updateField('spouseStatus', e.target.value)}
                      className="mt-1"
                      placeholder="e.g., living, deceased (year)"
                    />
                  ) : (
                    <p className="font-medium mt-1">{editedProfile.spouseStatus || 'N/A'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Children</label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {editedProfile.childrenNames.map((name, i) => (
                    <Badge key={i} variant="secondary" className="flex items-center gap-1">
                      {name}
                      {isEditing && (
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('childrenNames', i)} />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Grandchildren</label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {editedProfile.grandchildrenNames.map((name, i) => (
                    <Badge key={i} variant="outline" className="flex items-center gap-1">
                      {name}
                      {isEditing && (
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('grandchildrenNames', i)} />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Care Team & Emergency Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Primary Caregiver</label>
                    {isEditing ? (
                      <Input
                        value={editedProfile.primaryCaregiverName}
                        onChange={(e) => updateField('primaryCaregiverName', e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium mt-1">{editedProfile.primaryCaregiverName}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Relationship</label>
                    {isEditing ? (
                      <Input
                        value={editedProfile.primaryCaregiverRelationship}
                        onChange={(e) => updateField('primaryCaregiverRelationship', e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium mt-1">{editedProfile.primaryCaregiverRelationship}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Emergency Contacts</label>
                  <div className="space-y-2">
                    {editedProfile.emergencyContacts.map((contact, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div>
                          <p className="font-medium text-sm">
                            {contact.name}
                            {contact.isPrimary && <Badge variant="secondary" className="ml-2 text-xs">Primary</Badge>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contact.relationship} • {contact.phone}
                          </p>
                        </div>
                        {isEditing && (
                          <Button size="sm" variant="ghost">
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Sample patient profile for demo
export const samplePatientProfile: PatientProfileData = {
  id: 'patient_001',
  fullName: 'Margaret Anne Johnson',
  preferredName: 'Maggie',
  dateOfBirth: '1940-05-15',
  pronouns: 'she/her',
  diagnosisStage: 'moderate',
  diagnosisType: "Alzheimer's",
  diagnosisDate: '2022-03-01',
  
  spouseName: "Robert 'Bob' Johnson",
  spouseStatus: 'deceased (2014)',
  childrenNames: ['Susan', 'Michael', 'David'],
  grandchildrenNames: ['Emily', 'Jake', 'Sophie', 'Max'],
  
  occupation: 'Elementary school teacher',
  careerHighlights: 'Taught 3rd grade for 32 years at Lincoln Elementary. Won Teacher of the Year 1985.',
  hometown: 'Springfield, Illinois',
  
  favoriteMusic: 'Big Band, Glenn Miller, Frank Sinatra',
  favoriteFoods: 'Pot roast, apple pie, vanilla ice cream',
  hobbies: ['gardening', 'knitting', 'crossword puzzles', 'baking'],
  calmingActivities: ['looking at photo albums', 'listening to Glenn Miller', 'folding towels', 'sorting buttons'],
  
  medications: [
    { name: 'Donepezil', dosage: '10mg', schedule: 'morning', description: 'small white pill', purpose: 'for memory' },
    { name: 'Lisinopril', dosage: '5mg', schedule: 'morning', description: 'small pink pill', purpose: 'for blood pressure' },
  ],
  medicalConditions: ["Alzheimer's disease", 'hypertension', 'mild arthritis'],
  allergies: ['Penicillin'],
  
  topicsThatEngage: ['teaching stories', 'her grandchildren', 'gardening', 'recipes', 'her wedding day'],
  topicsToAvoid: ['current politics', "her parents' deaths", 'driving'],
  triggersToAvoid: ['loud sudden noises', 'being corrected', 'feeling rushed', 'strangers in the home'],
  communicationTips: 'Speak slowly. Make eye contact. Use her name. Don\'t quiz her memory. Join her reality.',
  
  primaryCaregiverName: 'Susan Martinez',
  primaryCaregiverRelationship: 'daughter',
  emergencyContacts: [
    { name: 'Susan Martinez', relationship: 'daughter', phone: '555-123-4567', isPrimary: true },
    { name: 'Michael Johnson', relationship: 'son', phone: '555-234-5678', isPrimary: false },
  ],
}
