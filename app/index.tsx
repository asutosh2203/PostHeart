import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  doc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "@react-native-firebase/firestore";
import { Redirect, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  NativeModules,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
const { SharedStorage } = NativeModules;

export default function HomeScreen() {
  const [note, setNote] = useState("");
  const [myName, setMyName] = useState("");
  const [lastSent, setLastSent] = useState("Syncing...");
  const [theme, setTheme] = useState("");

  // New State for Pairing
  const [coupleCode, setCoupleCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Themes
  const THEMES = [
    { id: "light", color: "#FFF9C4", label: "💛" }, // Matches widget_background
    { id: "pink", color: "#ff97bc", label: "🌸" }, // Matches widget_background_pink
    { id: "dark", color: "#2D3436", label: "🖤" },
    { id: "duck_wink", color: "#f7cbb0", label: "🐣" },
    { id: "bunny", color: "#F0D0C1", label: "🐰" },
    { id: "duck_rain", color: "#D6DBE1", label: "🦆" },
    { id: "duck_clueless", color: "#FFD6D8", label: "🦢" },
    { id: "mm_hug", color: "#F7E1C9", label: "🐻" },
  ];

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

        // Format the Time
        let timeString = "Just now";
        if (data?.timestamp) {
          const date = data.timestamp.toDate();
          timeString = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        setLastSent(data?.text || "Welcome!");

        // Create the Rich JSON Payload
        const payload = JSON.stringify({
          text: data?.text || "Welcome!",
          time: timeString,
          sender: data?.sender || "",
          type: "text",
          theme: data?.theme || "light",
        });

        // Update the Widget
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
      if (theme !== "")
        await setDoc(
          noteRef,
          {
            text: note,
            sender: SENDER,
            timestamp: serverTimestamp(),
            theme,
          },
          { merge: true }
        );
      else
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
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
            scrollEnabled
          />

          <View style={styles.themeContainer}>
            <Text style={styles.label}>PICK A VIBE</Text>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              style={styles.scrollContainer} // 1. Controls the window size
              contentContainerStyle={styles.scrollContent}
            >
              {THEMES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setTheme(t.id)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: t.color, marginRight: 10 },
                    theme === t.id && styles.selectedCircle, // Highlight selected
                  ]}
                >
                  {theme === t.id && (
                    <Text style={{ fontSize: 12 }}>{t.label}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSend}>
            <Text style={styles.buttonText}>Send to Partner</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
    maxHeight: 120,
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
  themeContainer: {
    marginBottom: 20,
    width: "100%",
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#B2BEC3",
    marginBottom: 8,
    letterSpacing: 1,
  },
  scrollContainer: {
    flexGrow: 0, // Don't expand to fill screen
    marginBottom: 10, // Space below the scroller
    paddingVertical: 10, // Add room for shadows so they don't get clipped
    // marginHorizontal: -20, // Optional: Lets it scroll edge-to-edge?
  },

  scrollContent: {
    flexDirection: "row", // Keep items horizontal
    gap: 16, // Increase gap slightly for better touch targets
    paddingHorizontal: 4, // Tiny padding at the start
    paddingRight: 20, // Space at the end
    alignItems: "center", // Center circles vertically in the scroll track
  },
  colorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "transparent", // Invisible border normally
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedCircle: {
    borderColor: "#0984E3", // Blue ring when selected
    transform: [{ scale: 1.1 }], // Slightly bigger
  },
});
