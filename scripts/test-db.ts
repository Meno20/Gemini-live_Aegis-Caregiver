import { adminDb } from '../src/lib/firebase/admin';
import * as dotenv from 'dotenv';

dotenv.config();

async function test() {
  console.log('Testing Firestore connection...');
  try {
    const collections = await adminDb.listCollections();
    console.log('Success! Collections found:', collections.length);
    for (const col of collections) {
      console.log(' - Collection:', col.id);
    }
  } catch (error: any) {
    console.error('Firestore Test Failed!');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Stack Trace:', error.stack);
  }
}

test();
