// ============================================================
// הגדרות Firebase — פרויקט manage-9678e
// ============================================================
const firebaseConfig = {
  apiKey:            "AIzaSyA7C6oE5N_mNhItC180_s36-NHlKrgyxfE",
  authDomain:        "manage-9678e.firebaseapp.com",
  // אם בחרת Europe בעת יצירת ה-Database, שנה ל:
  // "https://manage-9678e-default-rtdb.europe-west1.firebasedatabase.app"
  databaseURL:       "https://manage-9678e-default-rtdb.firebaseio.com",
  projectId:         "manage-9678e",
  storageBucket:     "manage-9678e.firebasestorage.app",
  messagingSenderId: "620644419146",
  appId:             "1:620644419146:web:9d2a34d35fa9caf7eb08b3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
