# PostHeart ❤️

**A cross-platform mobile app for friends to share notes directly to each other's Home Screen via Native Widgets.**

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Kotlin](https://img.shields.io/badge/Kotlin-0095D5?style=for-the-badge&logo=kotlin&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)

## 📖 Overview

PostHeart allows partners to pair up via a unique code. Once connected, any text sent from the app instantly updates the **Native Android Widget** on their partner's home screen. It acts like a "digital sticky note" on your partner's phone.

Unlike typical React Native widget libraries that rely on "screenshotting" views, PostHeart uses a **custom Native Module bridge** written in Kotlin to handle `SharedPreferences` and `BroadcastReceivers` for high-performance, battery-efficient updates.

---

## 🛠 Tech Stack

* **Frontend:** React Native (Expo Managed Workflow with Prebuild)
* **Native Android:** Kotlin, XML Layouts, AppWidgetProvider
* **Backend:** Firebase Firestore (Real-time listeners)
* **State Management:** React Hooks & Context
* **Navigation:** Expo Router (Stack Navigation)
* **Local Storage:** AsyncStorage (for session persistence)

---

## 🧠 Key Engineering Highlights

### 1. Custom Native Bridge (The "Special Sauce")
Instead of using heavy third-party libraries, I wrote a custom Native Module to bridge the JavaScript thread and the Android Native thread.

* **JS Side:** React Native sends data via `NativeModules.SharedStorage.set(note)`.
* **Kotlin Side:**
    * Intercepts the data.
    * Writes to Android `SharedPreferences` (native disk storage).
    * Fires a `BroadcastIntent` to wake up the Widget Provider.
* **Widget Side:** The `AppWidgetProvider` wakes up, reads from disk, and renders the XML layout instantly.

### 2. Real-time Sync
* Uses **Firestore listeners** (`onSnapshot`) to detect changes in the cloud instantly.
* Architecture handles the "Digital Fridge" concept: both users see the same shared state to ensure synchronization confirmation.

### 3. Secure Pairing Logic
* Implemented a room-based pairing system where users generate or join a unique 6-character alphanumeric code.
* Gatekeeper logic in `index.tsx` handles redirection/routing based on local auth state.

---

## 📂 Project Structure

Interesting files for Recruiters/Developers:

```bash
├── app/
│   ├── index.tsx          # Main Dashboard & Gatekeeper Logic
│   └── setup.tsx          # Pairing/Login Screen
├── android/app/src/main/java/com/anonymous/PostHeart/
│   ├── HelloWidget.kt     # NATIVE: The Android Widget Provider logic
│   ├── SharedStorageModule.kt # NATIVE: The Bridge between JS and Kotlin
│   └── SharedStoragePackage.kt # NATIVE: React Package registration
├── android/app/src/main/res/layout/
│   └── widget_layout.xml  # NATIVE: XML UI definition for the widget
```

---

## 🚀 How to Run
### Prerequisites
* Node.js & npm
* Android Studio (for Emulator)
* JDK 17+

### Steps
#### 1. Clone the Repo:
```bash
git clone https://github.com/asutosh2203/PostHeart.git
cd PostHeart
```

#### 2. Install Dependencies:
```bash
npm install
```

#### 3. Firebase setup:
* Create a project in Firebase Console.
* Download google-services.json.
* Place it in the android/app/ directory.

#### 4. Run the App:
```bash
npx expo run:android
```

---

## 🔮 Future Roadmap
* [ ] iOS Support: Implementing WidgetKit via Swift bridge.
* [ ] Push Notifications (FCM): To wake up the widget when the app is killed in the background.
* [ ] Identity System: Device fingerprinting to show "Sent by You" vs "Sent by Partner".

---

Maintained by [Asutosh](https://asutosh2203.netlify.app)  
Drop a ⭐ if you like where this is going!
