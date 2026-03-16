/**
 * Aegis Caregiver - Database Seed Script
 * Seeds the database with demo patient data for hackathon presentation
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo patient - Margaret "Maggie" Johnson
  const patient = await prisma.patient.upsert({
    where: { id: 'patient_001' },
    update: {},
    create: {
      id: 'patient_001',
      fullName: 'Margaret Anne Johnson',
      preferredName: 'Maggie',
      dateOfBirth: new Date('1942-03-15'),
      pronouns: 'she/her',
      diagnosisStage: 'moderate',
      diagnosisType: "Alzheimer's",
      diagnosisDate: new Date('2022-06-20'),
      
      // Family Information
      spouseName: "Robert 'Bob' Johnson",
      spouseStatus: 'deceased (2014)',
      childrenNames: JSON.stringify(['Susan', 'Michael', 'David']),
      grandchildrenNames: JSON.stringify(['Emily', 'Jake', 'Sophie', 'Max']),
      
      // Life History
      occupation: 'Elementary school teacher',
      careerHighlights: 'Taught 3rd grade for 32 years at Lincoln Elementary. Won Teacher of the Year 1985.',
      hometown: 'Springfield, Illinois',
      
      // Preferences
      favoriteMusic: 'Big Band, Glenn Miller, Frank Sinatra',
      favoriteMusicEra: '1940s-1960s',
      favoriteFoods: JSON.stringify(['pot roast', 'apple pie', 'mashed potatoes', 'green bean casserole']),
      hobbies: JSON.stringify(['gardening', 'knitting', 'crossword puzzles', 'baking']),
      calmingActivities: JSON.stringify(['looking at photo albums', 'listening to Glenn Miller', 'folding towels', 'sorting buttons']),
      
      // Communication
      communicationTips: JSON.stringify([
        'Speak slowly and clearly',
        'Use short sentences',
        'Give her time to respond',
        'Avoid correcting her memory errors'
      ]),
      topicsThatEngage: JSON.stringify(['teaching stories', 'her grandchildren', 'gardening', 'recipes', 'her wedding day']),
      topicsToAvoid: JSON.stringify(['current politics', "her parents' deaths", 'driving']),
      triggersToAvoid: JSON.stringify(['loud sudden noises', 'being corrected', 'feeling rushed', 'strangers in the home']),
      
      // Medical
      medications: JSON.stringify([
        { name: 'Donepezil', dosage: '10mg', schedule: 'morning', purpose: 'Cognitive function' },
        { name: 'Lisinopril', dosage: '5mg', schedule: 'morning', purpose: 'Blood pressure' },
        { name: 'Melatonin', dosage: '3mg', schedule: 'evening', purpose: 'Sleep aid' }
      ]),
      medicalConditions: JSON.stringify(['Alzheimer\'s Disease', 'Hypertension']),
      allergies: JSON.stringify(['Penicillin']),
      mobilityLevel: 'ambulatory',
      fallRisk: 'low',
      
      // Care Team
      primaryCaregiverName: 'Susan Martinez',
      primaryCaregiverRelationship: 'daughter',
      emergencyContacts: JSON.stringify([
        { name: 'Susan Martinez', relationship: 'daughter', phone: '555-123-4567', primary: true },
        { name: 'Michael Johnson', relationship: 'son', phone: '555-234-5678', primary: false },
        { name: 'Dr. Emily Chen', relationship: 'physician', phone: '555-345-6789', primary: false }
      ]),
      
      // Behavioral Patterns
      typicalWakeTime: '07:00',
      typicalSleepTime: '21:30',
      sundowningRisk: 'high',
      wanderingHistory: true,
      aggressionHistory: false,
      
      // Settings
      voicePreference: 'warm_female',
      volumePreference: 'normal',
    },
  })

  console.log('✅ Created patient:', patient.preferredName)

  // Create life stories
  const stories = await Promise.all([
    prisma.lifeStory.upsert({
      where: { id: 'story_001' },
      update: {},
      create: {
        id: 'story_001',
        patientId: patient.id,
        title: 'First Day of Teaching',
        content: 'In 1965, I walked into Lincoln Elementary for my first day as a teacher. I was so nervous my hands were shaking. But then little Tommy Wilson handed me a crayon drawing of a sun, and I knew I was exactly where I belonged. That drawing stayed on my desk for 32 years.',
        category: 'career',
        decade: '1960s',
        peopleMentioned: JSON.stringify(['Tommy Wilson']),
        emotions: JSON.stringify(['nervous', 'joyful', 'grateful']),
      },
    }),
    prisma.lifeStory.upsert({
      where: { id: 'story_002' },
      update: {},
      create: {
        id: 'story_002',
        patientId: patient.id,
        title: 'Wedding Day',
        content: "Bob and I got married on June 12, 1962, at St. Mary's Church. My father walked me down the aisle, and I remember thinking Bob was the most handsome man I'd ever seen. We danced to 'Unforgettable' by Nat King Cole. I still remember every step of that dance.",
        category: 'family',
        decade: '1960s',
        peopleMentioned: JSON.stringify(['Bob Johnson', 'father']),
        emotions: JSON.stringify(['love', 'happiness', 'nostalgia']),
      },
    }),
    prisma.lifeStory.upsert({
      where: { id: 'story_003' },
      update: {},
      create: {
        id: 'story_003',
        patientId: patient.id,
        title: 'Teacher of the Year 1985',
        content: 'The whole school gathered in the auditorium. Principal Henderson called my name, and I couldn\'t believe it. Teacher of the Year! My students cheered so loud. Susan, my daughter, was in the front row crying. That plaque still hangs in my living room.',
        category: 'career',
        decade: '1980s',
        peopleMentioned: JSON.stringify(['Principal Henderson', 'Susan']),
        emotions: JSON.stringify(['pride', 'surprise', 'accomplishment']),
      },
    }),
    prisma.lifeStory.upsert({
      where: { id: 'story_004' },
      update: {},
      create: {
        id: 'story_004',
        patientId: patient.id,
        title: 'The Garden Behind the House',
        content: 'Every spring, Bob and I would plant tomatoes, zucchini, and marigolds. He always said the marigolds kept the pests away, but I think he just liked how cheerful they looked. After he passed, I planted a rose bush where his tomatoes used to be. Pink roses—his favorite.',
        category: 'hobbies',
        decade: '1970s',
        peopleMentioned: JSON.stringify(['Bob Johnson']),
        emotions: JSON.stringify(['peace', 'love', 'memory']),
      },
    }),
    prisma.lifeStory.upsert({
      where: { id: 'story_005' },
      update: {},
      create: {
        id: 'story_005',
        patientId: patient.id,
        title: 'Susan\'s Wedding',
        content: 'My daughter Susan married David in our backyard, under the oak tree where Bob proposed to me. She wore my wedding dress—altered just a little. I cried through the whole ceremony. Bob was there in spirit, I could feel it. That was 1998.',
        category: 'family',
        decade: '1990s',
        peopleMentioned: JSON.stringify(['Susan', 'David', 'Bob Johnson']),
        emotions: JSON.stringify(['joy', 'pride', 'bittersweet']),
      },
    }),
    prisma.lifeStory.upsert({
      where: { id: 'story_006' },
      update: {},
      create: {
        id: 'story_006',
        patientId: patient.id,
        title: 'Christmas Traditions',
        content: 'Every Christmas Eve, we\'d make sugar cookies—Bob, Susan, Michael, David, and later the grandchildren. Everyone got to decorate their own. Emily always made a star cookie with way too much glitter. We still have that ornament on the tree.',
        category: 'family',
        decade: '1990s',
        peopleMentioned: JSON.stringify(['Bob Johnson', 'Susan', 'Michael', 'David', 'Emily']),
        emotions: JSON.stringify(['warmth', 'family', 'tradition']),
      },
    }),
  ])

  console.log('✅ Created', stories.length, 'life stories')

  // Create sample patterns
  const patterns = await Promise.all([
    prisma.pattern.upsert({
      where: { id: 'pattern_001' },
      update: {},
      create: {
        id: 'pattern_001',
        patientId: patient.id,
        patternType: 'sundowning',
        confidence: 0.85,
        description: 'Patient shows elevated agitation during late afternoon/early evening hours (4 PM - 7 PM), consistent with sundowning behavior.',
        recommendation: 'Begin calming activities at 3:30 PM. Reduce stimulation, dim lights, and play familiar music (Glenn Miller).',
        triggerConditions: JSON.stringify({ timeRange: [16, 19], location: 'any', priorActivity: 'none' }),
        occurrenceData: JSON.stringify({ occurrences: 12, avgAgitationIncrease: 0.35 }),
        isActive: true,
      },
    }),
    prisma.pattern.upsert({
      where: { id: 'pattern_002' },
      update: {},
      create: {
        id: 'pattern_002',
        patientId: patient.id,
        patternType: 'wandering_risk',
        confidence: 0.78,
        description: 'Wandering events most common after periods of silence (>30 minutes without interaction). Peak wandering time: 2-4 PM.',
        recommendation: 'Increase proactive engagement frequency during quiet periods. Schedule activities for mid-afternoon.',
        triggerConditions: JSON.stringify({ silenceDuration: 30, timeRange: [14, 16] }),
        occurrenceData: JSON.stringify({ occurrences: 8, peakHour: 15 }),
        isActive: true,
      },
    }),
    prisma.pattern.upsert({
      where: { id: 'pattern_003' },
      update: {},
      create: {
        id: 'pattern_003',
        patientId: patient.id,
        patternType: 'medication_timing',
        confidence: 0.92,
        description: 'Patient most responsive to medication reminders between 8:00-8:30 AM.',
        recommendation: 'Schedule medication prompts at 8:00 AM for best compliance.',
        triggerConditions: JSON.stringify({ timeRange: [8, 8.5] }),
        occurrenceData: JSON.stringify({ occurrences: 14, successRate: 0.92 }),
        isActive: true,
      },
    }),
    prisma.pattern.upsert({
      where: { id: 'pattern_004' },
      update: {},
      create: {
        id: 'pattern_004',
        patientId: patient.id,
        patternType: 'conversation_topic',
        confidence: 0.88,
        description: 'Topics about grandchildren and gardening reduce agitation by 40%.',
        recommendation: 'Use these topics when de-escalation is needed. Reference Emily, Jake, Sophie, and Max.',
        triggerConditions: JSON.stringify({ agitationThreshold: 0.4 }),
        occurrenceData: JSON.stringify({ occurrences: 25, agitationReduction: 0.4 }),
        isActive: true,
      },
    }),
  ])

  console.log('✅ Created', patterns.length, 'behavioral patterns')

  // Create second demo patient for multi-patient support
  const patient2 = await prisma.patient.upsert({
    where: { id: 'patient_002' },
    update: {},
    create: {
      id: 'patient_002',
      fullName: 'William "Bill" Thompson',
      preferredName: 'Bill',
      dateOfBirth: new Date('1938-07-22'),
      pronouns: 'he/him',
      diagnosisStage: 'mild',
      diagnosisType: "Vascular Dementia",
      diagnosisDate: new Date('2023-01-15'),
      
      spouseName: 'Margaret Thompson',
      spouseStatus: 'living',
      childrenNames: JSON.stringify(['Robert', 'Jennifer']),
      grandchildrenNames: JSON.stringify(['Liam', 'Olivia']),
      
      occupation: 'Civil Engineer',
      careerHighlights: 'Designed bridges for the state highway department. Led the team for the Route 66 overpass project.',
      hometown: 'Chicago, Illinois',
      
      favoriteMusic: 'Jazz, Miles Davis, Duke Ellington',
      favoriteMusicEra: '1950s-1970s',
      favoriteFoods: JSON.stringify(['steak', 'corn on the cob', 'chocolate ice cream']),
      hobbies: JSON.stringify(['woodworking', 'chess', 'watching baseball']),
      calmingActivities: JSON.stringify(['listening to jazz', 'woodworking', 'watching Cubs games', 'playing chess']),
      
      topicsThatEngage: JSON.stringify(['bridge construction', 'chess strategies', 'Cubs baseball', 'his wife Margaret']),
      topicsToAvoid: JSON.stringify(['driving', 'finances']),
      triggersToAvoid: JSON.stringify(['crowded spaces', 'loud arguments', 'being interrupted']),
      
      medications: JSON.stringify([
        { name: 'Memantine', dosage: '10mg', schedule: 'morning', purpose: 'Cognitive function' },
        { name: 'Aspirin', dosage: '81mg', schedule: 'morning', purpose: 'Heart health' }
      ]),
      medicalConditions: JSON.stringify(['Vascular Dementia', 'Coronary Artery Disease']),
      allergies: JSON.stringify([]),
      mobilityLevel: 'ambulatory_with_assist',
      fallRisk: 'moderate',
      
      primaryCaregiverName: 'Jennifer Thompson-White',
      primaryCaregiverRelationship: 'daughter',
      emergencyContacts: JSON.stringify([
        { name: 'Jennifer Thompson-White', relationship: 'daughter', phone: '555-456-7890', primary: true },
        { name: 'Margaret Thompson', relationship: 'spouse', phone: '555-567-8901', primary: false }
      ]),
      
      typicalWakeTime: '06:30',
      typicalSleepTime: '22:00',
      sundowningRisk: 'low',
      wanderingHistory: false,
      aggressionHistory: false,
      
      voicePreference: 'warm_male',
      volumePreference: 'loud',
    },
  })

  console.log('✅ Created second patient:', patient2.preferredName)

  // Add life story for Bill
  await prisma.lifeStory.upsert({
    where: { id: 'story_007' },
    update: {},
    create: {
      id: 'story_007',
      patientId: patient2.id,
      title: 'The Route 66 Overpass',
      content: 'Three years we worked on that project. When they finally opened it, the governor cut the ribbon and shook my hand. I still drive past it sometimes—well, Margaret drives now. Best work I ever did.',
      category: 'career',
      decade: '1970s',
      peopleMentioned: JSON.stringify(['governor', 'Margaret']),
      emotions: JSON.stringify(['pride', 'accomplishment']),
    },
  })

  console.log('🌱 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
