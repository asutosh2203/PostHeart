import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  doc,
  FieldValue,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "@react-native-firebase/firestore";
import messaging from "@react-native-firebase/messaging";
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

import { THEMES, STICKERS } from "@/utils/utils";

interface Payload {
  text: String;
  type: String;
  sender: String;
  theme: String;
  content: String | null;
  timestamp: FieldValue;
}

export default function HomeScreen() {
  const [note, setNote] = useState("");
  const [myName, setMyName] = useState("");
  const [lastSent, setLastSent] = useState("Syncing...");
  const [liveMessage, setLiveMessage] = useState({
    type: "text",
    text: "Syncing...",
    content: null, // Sticker ID
    theme: "light", // The background color currently on the widget
    time: "",
    sender: "",
  });
  const [theme, setTheme] = useState("");

  // New State for Pairing
  const [coupleCode, setCoupleCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [mode, setMode] = useState("text"); // 'text' or 'sticker'
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);

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
        setLiveMessage({
          type: data?.type || "text",
          text: data?.text || "Welcome!",
          content: data?.content || null,
          theme: data?.theme || "light",
          time: timeString,
          sender: data?.sender,
        });

        let payload = "";

        // Create the Rich JSON Payload
        payload = JSON.stringify({
          text: data?.text || "Welcome!",
          time: timeString,
          sender: data?.sender || "",
          type: data?.type,
          theme: data?.theme || "light",
          content: data?.content || "sticker_heart",
        });

        // Update the Widget
        SharedStorage.set(payload);
      }
    });

    return () => unsubscribe();
  }, [coupleCode]); // Re-run if code changes

  // 3. SETUP NOTIFICATIONS
  useEffect(() => {
    const setupNotifications = async () => {
      // Only proceed if we are logged in (have code and name)
      if (!coupleCode || !myName) return;

      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          // 1. Get the Token
          const token = await messaging().getToken();

          // 2. Save it to Firestore "Phone Book"
          // We use the Name as the Key, so if you get a new phone, it updates YOUR token
          const noteRef = doc(db, "couples", coupleCode);

          await setDoc(
            noteRef,
            {
              tokens: {
                [myName]: token,
              },
            },
            { merge: true }
          ); // merge is CRITICAL here so we don't delete the note!

          console.log("Token saved to database!");
        }
      } catch (error) {
        console.error("Notification setup failed:", error);
      }
    };

    setupNotifications();
  }, [coupleCode, myName]); // Run this whenever code/name loads

  const SENDER = `— ${myName}`;

  const handleSend = async () => {
    if (!coupleCode) return;

    // Validation: Don't send empty stuff
    if (mode === "text" && note.trim() === "") return;
    if (mode === "sticker" && !selectedSticker) return;

    try {
      const noteRef = doc(db, "couples", coupleCode);

      let payload: Payload = {
        type: mode,
        sender: SENDER,
        timestamp: serverTimestamp(),
      };

      if (mode == "text") {
        payload.text = note;
      } else {
        payload.content = selectedSticker;
        payload.text = "Sent a sticker";
      }

      if (theme !== "") {
        payload.theme = theme;
        await setDoc(noteRef, payload, { merge: true });
      } else await setDoc(noteRef, payload, { merge: true });

      setNote("");
      setSelectedSticker(null);
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
          {/* PREVIEW CARD */}
          <View style={[styles.previewCard]}>
            <Text style={styles.previewLabel}>LIVE ON HOME SCREEN</Text>

            {liveMessage.type === "sticker" ? (
              // Show the LIVE sticker (emoji representation)
              <Text style={{ fontSize: 50, textAlign: "center" }}>
                {STICKERS.find((s) => s.id === liveMessage.content)?.label}
              </Text>
            ) : (
              // Show the LIVE text
              <Text style={styles.previewText}>"{liveMessage.text}"</Text>
            )}

            <View style={styles.preViewCardFooter}>
              <Text style={styles.preViewCardFooterText}>
                {liveMessage.sender}
              </Text>
              <Text style={styles.preViewCardFooterText}>
                {liveMessage.time}
              </Text>
            </View>
          </View>

          {/* --- 1. MODE TABS --- */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              onPress={() => setMode("text")}
              style={[styles.tab, mode === "text" && styles.activeTab]}
            >
              <Text
                style={[
                  styles.tabText,
                  mode === "text" && styles.activeTabText,
                ]}
              >
                Write Note
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode("sticker")}
              style={[styles.tab, mode === "sticker" && styles.activeTab]}
            >
              <Text
                style={[
                  styles.tabText,
                  mode === "sticker" && styles.activeTabText,
                ]}
              >
                Send Sticker
              </Text>
            </TouchableOpacity>
          </View>

          {/* --- 2. CONDITIONAL CONTENT --- */}
          {mode === "text" ? (
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              placeholder="Type a note..."
              multiline
              scrollEnabled
            />
          ) : (
            /* STICKER GRID */
            <View style={styles.stickerGrid}>
              {STICKERS.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setSelectedSticker(s.id)}
                  style={[
                    styles.stickerButton,
                    selectedSticker === s.id && styles.selectedSticker,
                  ]}
                >
                  <Text style={{ fontSize: 32 }}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* --- 3. THEME PICKER (Available in both modes!) --- */}
          <View style={styles.themeContainer}>
            <Text style={styles.label}>PICK A VIBE</Text>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
            >
              {THEMES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setTheme(t.id)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: t.color, marginRight: 10 },
                    theme === t.id && styles.selectedCircle,
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
            <Text style={styles.buttonText}>
              {mode === "text" ? "Send Note" : "Send Sticker"}
            </Text>
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
  // ... existing styles ...

  // TABS
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E0E0E0", // Grey background for the pill
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: { fontWeight: "bold", color: "#9E9E9E" },
  activeTabText: { color: "#2D3436" },

  // STICKERS
  stickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
    marginBottom: 20,
    minHeight: 120, // Match input height roughly so layout doesn't jump
    alignItems: "center",
  },
  stickerButton: {
    width: 70,
    height: 70,
    backgroundColor: "#FFF",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    elevation: 2,
  },
  selectedSticker: {
    borderColor: "#0984E3",
    backgroundColor: "#E3F2FD",
    transform: [{ scale: 1.05 }],
  },
  preViewCardFooter: {
    marginTop: 12,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  preViewCardFooterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B2BEC3",
    textTransform: "uppercase",
  },
});
