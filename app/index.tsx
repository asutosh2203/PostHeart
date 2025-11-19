import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  NativeModules,
  ActivityIndicator,
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
          const savedCode = await AsyncStorage.getItem("couple_code");
          if (savedCode) {
            setCoupleCode(savedCode); // This updates the UI to the NEW code
          }
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
    if (!coupleCode) return; // Don't listen if we don't have a code

    console.log("Listening to room:", coupleCode); // Debug log

    const noteRef = doc(db, "couples", coupleCode);

    const unsubscribe = onSnapshot(
      noteRef,
      (documentSnapshot) => {
        if (documentSnapshot.exists()) {
          const data = documentSnapshot.data();
          const newNote = data?.text || "Welcome!";

          setLastSent(newNote);
          SharedStorage.set(newNote);
        }
      },
      (error) => console.error("Listen failed: ", error)
    );

    return () => unsubscribe();
  }, [coupleCode]); // Re-run if code changes

  const handleSend = async () => {
    if (note.trim() === "" || !coupleCode) return;

    try {
      const noteRef = doc(db, "couples", coupleCode);
      await setDoc(
        noteRef,
        {
          text: note,
          timestamp: serverTimestamp(),
        },
        { merge: true }
      ); // merge: true keeps the 'created' date safe

      setNote("");
      console.log("Sent to cloud! ☁️");
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
