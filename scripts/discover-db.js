const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

async function discover() {
  console.log('Discovering Firestore databases for project:', process.env.FIREBASE_ADMIN_PROJECT_ID);
  
  try {
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    const client = await auth.getClient();
    const token = await client.getAccessToken();
    
    // List databases
    const url = `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_ADMIN_PROJECT_ID}/databases`;
    console.log('Calling:', url);
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token.token}` }
    });

    console.log('Databases found:');
    console.log(JSON.stringify(response.data, null, 2));

    if (!response.data || !response.data.databases || response.data.databases.length === 0) {
      console.error('❌ NO DATABASES FOUND. You need to click "Create Database" in the Firebase Console.');
    }
  } catch (error) {
    console.error('Discovery failed!');
    if (error.response) {
      console.error('Data:', error.response.data);
      console.error('Status:', error.response.status);
    } else {
      console.error('Message:', error.message);
    }
  }
}

discover();
