import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  NativeModules,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, useFocusEffect } from "expo-router"; // <--- The Magic Redirect Component

const { SharedStorage } = NativeModules;

export default function HomeScreen() {
  const [note, setNote] = useState("");
  const [myName, setMyName] = useState("");
  const [lastSent, setLastSent] = useState("Syncing...");

  // New State for Pairing
  const [coupleCode, setCoupleCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const db = getFirestore();

  // 1. CHECK LOGIN STATUS ON STARTUP
  useFocusEffect(
    useCallback(() => {
      const checkLogin = async () => {
        setIsLoading(true); // Show spinner briefly while checking
        try {
          const values = await AsyncStorage.multiGet([
            "couple_code",
            "user_name",
          ]);
          const savedCode = values[0][1];
          const savedName = values[1][1];

          // Update the UI to new code
          if (savedCode) setCoupleCode(savedCode);
          if (savedName) setMyName(savedName);
        } catch (e) {
          console.error("Storage error", e);
        } finally {
          setIsLoading(false);
        }
      };

      checkLogin();
    }, []) // The empty array here is safe with useFocusEffect
  );

  // 2. LISTEN TO FIREBASE (Only if logged in)
  useEffect(() => {
    if (!coupleCode) return;

    const noteRef = doc(db, "couples", coupleCode);

    const unsubscribe = onSnapshot(noteRef, (documentSnapshot) => {
      if (documentSnapshot.exists()) {
        const data = documentSnapshot.data();

        // 1. Get the Text
        const newNote = data?.text || "Welcome!";

        // 2. Get the Sender (Default to empty if missing)
        const senderName = data?.sender || "";

        // 3. Format the Time
        let timeString = "Just now";
        if (data?.timestamp) {
          const date = data.timestamp.toDate();
          timeString = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        setLastSent(newNote);

        // 4. Create the Rich JSON Payload
        const payload = JSON.stringify({
          text: newNote,
          time: timeString,
          sender: senderName, // <--- Sending it to the Kotlin Bridge
          type: "text",
        });

        // 5. Update the Widget
        SharedStorage.set(payload);
      }
    });

    return () => unsubscribe();
  }, [coupleCode]); // Re-run if code changes

  const SENDER = `— ${myName}`;

  const handleSend = async () => {
    if (note.trim() === "" || !coupleCode) return;

    try {
      const noteRef = doc(db, "couples", coupleCode);

      await setDoc(
        noteRef,
        {
          text: note,
          sender: SENDER,
          timestamp: serverTimestamp(),
        },
        { merge: true }
      );

      setNote("");
      console.log("Sent to cloud by ", myName, "! ☁️");
    } catch (e) {
      console.error("Cloud Error:", e);
      alert("Failed to send note");
    }
  };

  // 3. LOADING STATE (While checking storage)
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF4081" />
        <Text style={{ marginTop: 10, color: "#636E72" }}>
          Checking heart status...
        </Text>
      </View>
    );
  }

  // 4. REDIRECT LOGIC (The Router Magic)
  if (!coupleCode) {
    // If we finished loading and found NO code, go to Setup
    return <Redirect href="/setup" />;
  }

  // 5. THE DASHBOARD (Only renders if logged in)
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined} // Android handles 'padding' via the config we just changed
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0} // Adjusts for iOS header height
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>PostHeart 🔐</Text>
          <Text style={styles.codeDisplay}>CODE: {coupleCode}</Text>

          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>LIVE ON PARTNER'S SCREEN</Text>
            <Text style={styles.previewText}>"{lastSent}"</Text>
          </View>

          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="Type a note..."
            multiline
          />

          <TouchableOpacity style={styles.button} onPress={handleSend}>
            <Text style={styles.buttonText}>Send to Partner</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ... Use your existing styles ...
  // Add this one new style:
  codeDisplay: {
    fontSize: 14,
    color: "#B2BEC3",
    fontWeight: "bold",
    marginBottom: 20,
    letterSpacing: 2,
    textAlign: "center",
  },
  // Paste the rest of your styles from the previous file here
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2D3436",
    marginBottom: 8,
    textAlign: "center",
  },
  previewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B2BEC3",
    marginBottom: 8,
    letterSpacing: 1,
  },
  previewText: {
    fontSize: 20,
    color: "#2D3436",
    fontStyle: "italic",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#DFE6E9",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#0984E3",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
