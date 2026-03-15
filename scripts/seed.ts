import { adminDb, adminAuth } from '../src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * SEED DATA FROM FRONTEND DASHBOARD
 */
const PATIENTS_DATA = [
  {
    id: "maggie",
    firstName: "Maggie",
    lastName: "Thompson",
    dateOfBirth: new Date(1948, 4, 12), // Age 78 in 2026
    gender: "female",
    dementiaStage: "moderate",
    address: "Oakwood Independent Living, Room 302",
    emergencyPhone: "(555) 123-4567",
    lifeStory: {
      birthplace: "Portland, OR",
      career: "Elementary School Teacher for 35 years",
      spouseName: "Bob Thompson",
      spouseStatus: "Passed away in 2014",
      children: [
        { name: "Sarah", birthYear: 1975, notes: "Daughter, visits daily" },
        { name: "David", birthYear: 1978, notes: "Son, lives in Seattle" }
      ],
      favoriteMusic: ["Frank Sinatra", "Ella Fitzgerald", "Dean Martin"],
      childhoodMemories: [
        "Summer vacations at Lake Michigan",
        "Teaching first grade at Lincoln Elementary",
        "Dancing with Bob at their wedding",
        "Baking cookies with grandchildren"
      ],
      repeatedQuestions: [
        { question: "Where is Bob?", bestResponse: "Bob is watching over us. Would you like to hear some Sinatra?" },
        { question: "When am I going home?", bestResponse: "You're safe here at Oakwood. Let's look at some photos." }
      ]
    },
    vitals: {
      bloodPressure: "120/80",
      heartRate: 72,
      temperature: 98.6,
      oxygenLevel: 98
    },
    medications: [
      { name: "Donepezil", dosage: "10mg", frequency: "8:00 AM", pillDescription: "Yellow tablet" },
      { name: "Memantine", dosage: "5mg", frequency: "8:00 PM", pillDescription: "Blue tablet" }
    ],
    careTeam: [
      { name: "Sarah Thompson", role: "Primary Caregiver", relationship: "Daughter" },
      { name: "Dr. Sarah Chen", role: "Geriatric Specialist", relationship: "Physician" },
      { name: "Maria Garcia", role: "Home Health Aide", relationship: "Nurse" }
    ]
  },
  {
    id: "bill",
    firstName: "Bill",
    lastName: "Martinez",
    dateOfBirth: new Date(1944, 1, 15), // Age 82 in 2026
    gender: "male",
    dementiaStage: "early-moderate",
    address: "Oakwood Independent Living, Room 105",
    emergencyPhone: "(555) 987-6543",
    lifeStory: {
      birthplace: "Seattle, WA",
      career: "Carpenter and woodworker for 40 years",
      spouseName: "Rosa Martinez",
      spouseStatus: "Living, primary caregiver",
      children: [
        { name: "Carlos", birthYear: 1970, notes: "Son, visits for fishing" },
        { name: "Maria", birthYear: 1973, notes: "Daughter" },
        { name: "Elena", birthYear: 1976, notes: "Daughter" }
      ],
      favoriteMusic: ["Johnny Cash", "Patsy Cline", "Hank Williams"],
      childhoodMemories: [
        "Building the family home with his own hands",
        "Fishing trips with Carlos every summer",
        "Rosa's cooking — especially her enchiladas",
        "Woodworking shop in the garage"
      ],
      repeatedQuestions: [
        { question: "Where are my tools?", bestResponse: "Your tools are safe in the shop, Bill. Rosa has the key." },
        { question: "Is Rosa here?", bestResponse: "Rosa just stepped out but she'll be back for dinner soon." }
      ]
    },
    vitals: {
      bloodPressure: "118/75",
      heartRate: 68,
      temperature: 98.4,
      oxygenLevel: 99
    },
    medications: [
      { name: "Donepezil", dosage: "5mg", frequency: "9:00 AM", pillDescription: "White tablet" }
    ],
    careTeam: [
      { name: "Rosa Martinez", role: "Primary Caregiver", relationship: "Spouse" },
      { name: "Carlos Martinez", role: "Family Member", relationship: "Son" },
      { name: "Dr. Sarah Chen", role: "Geriatric Specialist", relationship: "Physician" }
    ]
  }
];

async function seed() {
  console.log('🌱 Seeding Aegis Firestore with Dashboard Data...');

  try {
    // 1. Create a default caregiver user if it doesn't exist
    const CAREGIVER_EMAIL = 'caregiver@aegis.ai';
    let caregiverUid: string;

    try {
      const user = await adminAuth.getUserByEmail(CAREGIVER_EMAIL);
      caregiverUid = user.uid;
      console.log('✅ Caregiver user already exists');
    } catch {
      const user = await adminAuth.createUser({
        email: CAREGIVER_EMAIL,
        password: 'password123',
        displayName: 'Susan Thompson',
      });
      caregiverUid = user.uid;
      console.log('✅ Created caregiver user');
    }

    // 2. Populate Patients
    for (const data of PATIENTS_DATA) {
      console.log(`Processing ${data.firstName}...`);
      
      try {
        console.log(` - Creating patient doc for ${data.id}`);
        const patientRef = adminDb.collection('patients').doc(data.id);
        await patientRef.set({
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          dementiaStage: data.dementiaStage,
          address: data.address,
          emergencyPhone: data.emergencyPhone,
          avatar: `https://ui-avatars.com/api/?name=${data.firstName}+${data.lastName}&background=random`,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(` - Setting life story for ${data.id}`);
        await adminDb.collection('life_stories').doc(data.id).set({
          patientId: data.id,
          ...data.lifeStory,
          updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(` - Adding vitals for ${data.id}`);
        await adminDb.collection('health_records').add({
          patientId: data.id,
          type: 'VITALS',
          value: JSON.stringify(data.vitals),
          date: new Date(),
          notes: "Initial baseline from dashboard migration",
          recordedBy: caregiverUid,
        });

        console.log(` - Adding medications for ${data.id}`);
        for (const med of data.medications) {
          await adminDb.collection('medications').add({
            patientId: data.id,
            ...med,
            status: 'ACTIVE',
            startDate: new Date(),
          });
        }

        console.log(` - Adding care team members for ${data.id}`);
        for (const member of data.careTeam) {
          await adminDb.collection('care_team').add({
            patientId: data.id,
            ...member,
          });
        }

        console.log(` - Setting caregiver assignment for ${data.id}`);
        await adminDb.collection('caregiver_patients').doc(`${caregiverUid}_${data.id}`).set({
          caregiverId: caregiverUid,
          patientId: data.id,
          role: 'PRIMARY_CAREGIVER',
          isPrimary: true,
          assignedAt: FieldValue.serverTimestamp(),
        });

        console.log(`✅ ${data.firstName} populated`);
      } catch (err: any) {
        console.error(`❌ Error processing ${data.firstName}:`, err.message);
        console.error('Stack Trace:', err.stack);
        throw err;
      }
    }

    console.log('✨ Seeding complete!');
  } catch (error: any) {
    console.error('❌ Seeding failed:', error.message);
  }
}

seed();
