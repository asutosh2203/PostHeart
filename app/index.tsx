import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addDoc,
  collection,
  doc,
  FieldValue,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "@react-native-firebase/firestore";
import messaging from "@react-native-firebase/messaging";
import { Redirect, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  NativeModules,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  LayoutAnimation,
  UIManager,
} from "react-native";
const { SharedStorage } = NativeModules;
import styles from "./css/index_css";

import { THEMES, STICKERS, getColorForSender } from "@/utils/utils";

interface Payload {
  text: string;
  type: string;
  sender: string;
  theme: string;
  content: string | null;
  timestamp: FieldValue;
}

export default function HomeScreen() {
  const [note, setNote] = useState("");
  const [myName, setMyName] = useState("");
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

  const [history, setHistory] = useState<Payload[]>();
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  const db = getFirestore();

  // Smooth snimation for history list
  if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

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
          const savedCode = values[0]![1];
          const savedName = values[1]![1];

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

  // 3. LISTEN TO FIREBASE FOR HISTORY
  useEffect(() => {
    if (!coupleCode) return;

    const historyRef = collection(db, "couples", coupleCode, "history");
    const q = query(historyRef, orderBy("timestamp", "desc"), limit(20));
    let senderColors: Record<string, string> = {};

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot) {
        setIsHistoryLoading(true);
        // Map the docs to a clean array for your FlatList
        let historyData = snapshot.docs.map((doc: any) => {
          return {
            id: doc.id,
            ...doc.data(),
          };
        });

        historyData = historyData.slice(1, historyData.length);

        historyData = historyData.map((item: Payload) => ({
          ...item,
          color: getColorForSender(item.sender),
        }));

        setHistory(historyData); // Update your state
        setIsHistoryLoading(false);
      } else {
        console.log("No history yet!");
      }
    });

    return () => unsubscribe();
  }, [coupleCode]);

  // 4. SETUP NOTIFICATIONS
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
      const historyRef = collection(db, "couples", coupleCode, "history");

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

      // Chnage theme in payload if it exists
      if (theme !== "") {
        payload.theme = theme;
      }

      await setDoc(noteRef, payload, { merge: true });
      // Add message to history
      await addDoc(historyRef, payload);

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
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <View style={styles.content}>
          <Text style={styles.title}>PostHeart 🔐</Text>
          <Text style={styles.codeDisplay}>CODE: {coupleCode}</Text>

          {/* HISTORY SECTION */}
          <TouchableOpacity
            onPress={() => {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut
              );
              setIsHistoryExpanded(!isHistoryExpanded);
            }}
            style={[
              styles.historyContainer,
              {
                height:
                  history && history?.length > 0
                    ? isHistoryExpanded
                      ? 205
                      : 40
                    : isHistoryExpanded
                    ? 100
                    : 40,
              },
            ]}
          >
            <View style={styles.historyHeaderRow}>
              <Text style={styles.historyTitle}>MEMORY LANE 🕰️</Text>
              <Text style={styles.expandIcon}>
                {isHistoryExpanded ? "▼" : "▲"}
              </Text>
            </View>
            {isHistoryExpanded && (
              <View style={{ marginBottom: 30 }}>
                <ScrollView
                  style={{ maxHeight: 200 }}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                >
                  {history && history.length > 0 ? (
                    history.map((item, index) => {
                      const isLast = index === history.length - 1;
                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.historyItem,
                            isLast && { marginBottom: 40 },
                          ]}
                        >
                          <View style={styles.historyHeader}>
                            <Text
                              style={{
                                ...styles.historySender,
                                color: item.color,
                              }}
                            >
                              {item.sender}
                            </Text>
                            <Text style={styles.historyTime}>
                              {item.timestamp?.toDate
                                ? item.timestamp
                                    .toDate()
                                    .toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                : "Just now"}
                            </Text>
                          </View>

                          {item.type === "sticker" ? (
                            <Text style={{ fontSize: 24 }}>
                              {STICKERS.find((s) => s.id === item.content)
                                ?.label || "🖼️"}
                            </Text>
                          ) : (
                            <Text style={styles.historyText} numberOfLines={2}>
                              {item.text}
                            </Text>
                          )}
                        </View>
                      );
                    })
                  ) : (
                    // Return this if no history is present
                    <View
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          margin: "auto",
                          fontWeight: 700,
                          fontSize: 22,
                          fontStyle: "italic",
                          paddingTop: 15,
                        }}
                      >
                        "Let's make history together"
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </TouchableOpacity>
          {/* 1. PREVIEW CARD (Moved to Top) */}
          <View style={[styles.previewCard]}>
            <Text style={styles.previewLabel}>LIVE ON HOME SCREEN</Text>

            {liveMessage.type === "sticker" ? (
              <Text style={{ fontSize: 50, textAlign: "center" }}>
                {STICKERS.find((s) => s.id === liveMessage.content)?.label}
              </Text>
            ) : (
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

          {/* 2. MODE TABS */}
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

          {/* 3. INPUT AREA */}
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

          {/* 4. THEME PICKER */}
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
