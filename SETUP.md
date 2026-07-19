# הקמת המערכת — טכנושף

## שלב 1: יצירת פרויקט Firebase

1. גש ל-console.firebase.google.com
2. צור פרויקט חדש (שם לדוגמה: `technosha`)
3. הפעל **Realtime Database** (בחר `Europe-West1`)
4. הפעל **Hosting**

## שלב 2: כללי אבטחה ל-Database

בכללי ה-Database (Rules), הכנס:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
> לאירועי ייצור — ניתן להגביל ל-write בעתיד.

## שלב 3: עדכון הקונפיגורציה

פתח את `public/js/firebase-config.js` ומלא את הפרטים מ-Firebase Console:
```js
const firebaseConfig = {
  apiKey:            "...",
  authDomain:        "...firebaseapp.com",
  databaseURL:       "https://...-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "...",
  storageBucket:     "....appspot.com",
  messagingSenderId: "...",
  appId:             "..."
};
```

## שלב 4: עדכון .firebaserc

```json
{
  "projects": {
    "default": "YOUR-PROJECT-ID"
  }
}
```

## שלב 5: Deploy

```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

---

## כתובות המערכת

| דף | כתובת | שימוש |
|----|--------|--------|
| בית | `/` | כל הקישורים |
| ניהול | `/admin.html` | הוספת מתחמים |
| דאשבורד | `/dashboard.html` | מנהל משמרת |
| מדריך | `/remote.html?station=ID` | טאבלט מדריך |
| דלת | `/door.html?station=ID` | מסך מחוץ למעבדה |
| מסך | `/screen.html?station=ID` | טלוויזיה בתוך המעבדה |
| לוח | `/board.html` | לובי / כניסה |

---

## זרימת עבודה

```
מנהל Admin:
  1. admin.html → הוסף מתחמים עם שם/נושא/סרטון/זמנים
  2. העתק את קישורי remote, door, screen לכל מתחם

יום האירוע:
  - door.html   → על הטלוויזיה מחוץ לכל מעבדה
  - screen.html → על הטלוויזיה בתוך המעבדה
  - remote.html → על הטאבלט של כל מדריך
  - dashboard.html → אצל מנהל המשמרת
  - board.html  → מסך גדול בלובי
```

## זמנים מומלצים ברירת מחדל

| פרמטר | ברירת מחדל |
|--------|-------------|
| משך פעילות | 25 דקות |
| זמן התארגנות | 7 דקות |
| זמן קליטת קהל | 5 דקות |
| המתנה לאחר סיום | 3 דקות |
