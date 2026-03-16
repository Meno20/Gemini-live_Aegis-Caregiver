import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
const app = getApps().length === 0
  ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  : getApps()[0];

const adminDb = getFirestore(app);
const adminAuth = getAuth(app);

const CAREGIVER_EMAIL = 'sarah@example.com';

const PATIENTS_DATA = [
  {
    id: 'maggie',
    firstName: 'Maggie',
    lastName: 'Thompson',
    dateOfBirth: new Date(1948, 4, 12),
    gender: 'female',
    dementiaStage: 'moderate',
    address: 'Oakwood Independent Living, Room 302',
    emergencyPhone: '(555) 123-4567',
    lifeStory: {
      birthplace: 'Portland, OR',
      career: 'Elementary School Teacher for 35 years',
      spouseName: 'Bob Thompson',
      spouseStatus: 'Passed away in 2014',
      children: [
        { name: 'Sarah', birthYear: 1975, notes: 'Daughter, visits daily' },
        { name: 'David', birthYear: 1978, notes: 'Son, lives in Seattle' },
      ],
      favoriteMusic: ['Frank Sinatra', 'Ella Fitzgerald', 'Dean Martin'],
      childhoodMemories: [
        'Summer vacations at Lake Michigan',
        'Teaching first grade at Lincoln Elementary',
        'Dancing with Bob at their wedding',
        'Baking cookies with grandchildren',
      ],
      repeatedQuestions: [
        { question: 'Where is Bob?', bestResponse: 'Bob is watching over us. Would you like to hear some Sinatra?' },
        { question: 'When am I going home?', bestResponse: "You're safe here at Oakwood. Let's look at some photos." },
      ],
    },
    vitals: {
      bloodPressure: '120/80',
      heartRate: 72,
      temperature: 98.6,
      oxygenLevel: 98,
    },
    medications: [
      { name: 'Donepezil', dosage: '10mg', frequency: '8:00 AM', pillDescription: 'Yellow tablet' },
      { name: 'Memantine', dosage: '5mg', frequency: '8:00 PM', pillDescription: 'Blue tablet' },
    ],
    careTeam: [
      { name: 'Sarah Thompson', role: 'Primary Caregiver', relationship: 'Daughter' },
      { name: 'Dr. Sarah Chen', role: 'Geriatric Specialist', relationship: 'Physician' },
      { name: 'Maria Garcia', role: 'Home Health Aide', relationship: 'Nurse' },
    ],
  },
  {
    id: 'bill',
    firstName: 'Bill',
    lastName: 'Martinez',
    dateOfBirth: new Date(1944, 1, 15),
    gender: 'male',
    dementiaStage: 'early-moderate',
    address: 'Oakwood Independent Living, Room 105',
    emergencyPhone: '(555) 987-6543',
    lifeStory: {
      birthplace: 'Seattle, WA',
      career: 'Carpenter and woodworker for 40 years',
      spouseName: 'Rosa Martinez',
      spouseStatus: 'Living, primary caregiver',
      children: [
        { name: 'Carlos', birthYear: 1970, notes: 'Son, lives nearby' },
        { name: 'Maria', birthYear: 1973, notes: 'Daughter, visits weekends' },
      ],
      favoriteMusic: ['Johnny Cash', 'Patsy Cline', 'Hank Williams'],
      childhoodMemories: [
        'Building the family home with his own hands',
        'Fishing trips with Carlos every summer',
        "Rosa's cooking — especially her enchiladas",
        'Woodworking shop in the garage',
      ],
      repeatedQuestions: [
        { question: 'Where are my tools?', bestResponse: "Your tools are safe in the workshop. Want to look at your woodworking photos?" },
        { question: 'Is Rosa here?', bestResponse: 'Rosa will be here soon. She loves you very much.' },
      ],
    },
    vitals: {
      bloodPressure: '130/85',
      heartRate: 68,
      temperature: 98.4,
      oxygenLevel: 97,
    },
    medications: [
      { name: 'Donepezil', dosage: '10mg', frequency: '9:00 AM', pillDescription: 'White round pill' },
    ],
    careTeam: [
      { name: 'Rosa Martinez', role: 'Primary Caregiver', relationship: 'Wife' },
      { name: 'Dr. James Wilson', role: 'Neurologist', relationship: 'Physician' },
    ],
  },
];

async function seed() {
  console.log('🌱 Seeding Aegis database...');

  let caregiverUid: string;

  // 1. Create or get caregiver
  try {
    const user = await adminAuth.getUserByEmail(CAREGIVER_EMAIL);
    caregiverUid = user.uid;
    console.log('✅ Caregiver user already exists');
  } catch {
    const user = await adminAuth.createUser({
      email: CAREGIVER_EMAIL,
      password: 'aegis2024!',
      displayName: 'Sarah Thompson',
    });
    caregiverUid = user.uid;
    console.log('✅ Created caregiver user');
  }

  // 2. Create caregiver profile
  await adminDb.collection('caregivers').doc(caregiverUid).set({
    email: CAREGIVER_EMAIL,
    name: 'Sarah Thompson',
    phone: '(555) 123-4567',
    role: 'PRIMARY_CAREGIVER',
    isVerified: true,
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log('✅ Caregiver profile created');

  // 3. Populate patients
  for (const data of PATIENTS_DATA) {
    console.log(`Processing ${data.firstName}...`);

    try {
      // Patient document
      await adminDb.collection('patients').doc(data.id).set({
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

      // Life story
      await adminDb.collection('patients').doc(data.id)
        .collection('details').doc('life_story').set({
          patientId: data.id,
          ...data.lifeStory,
          updatedAt: FieldValue.serverTimestamp(),
        });

      // Health record
      await adminDb.collection('patients').doc(data.id)
        .collection('health_records').add({
          patientId: data.id,
          ...data.vitals,
          recordDate: FieldValue.serverTimestamp(),
        });

      // Medications
      for (const med of data.medications) {
        await adminDb.collection('patients').doc(data.id)
          .collection('medications').add({
            patientId: data.id,
            ...med,
            isActive: true,
            startDate: new Date(),
          });
      }

      // Care team
      for (const member of data.careTeam) {
        await adminDb.collection('patients').doc(data.id)
          .collection('care_team').add({
            patientId: data.id,
            ...member,
            isActive: true,
          });
      }

      // Caregiver assignment
      await adminDb.collection('caregiver_patients')
        .doc(`${caregiverUid}_${data.id}`).set({
          caregiverId: caregiverUid,
          patientId: data.id,
          role: 'PRIMARY_CAREGIVER',
          isPrimary: true,
          assignedAt: FieldValue.serverTimestamp(),
        });

      console.log(`✅ ${data.firstName} populated`);
    } catch (err: any) {
      console.error(`❌ Error processing ${data.firstName}:`, err.message);
      throw err;
    }
  }

  console.log('');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('Login credentials:');
  console.log('  Email:    sarah@example.com');
  console.log('  Password: aegis2024!');
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
