const firebase = require('firebase/app');
require('firebase/database');

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.database();

// Example: Write data
db.ref('users/1').set({
  username: 'testuser',
  email: 'test@example.com'
});

// Example: Read data
db.ref('users/1').once('value').then(snapshot => {
  console.log(snapshot.val());
});