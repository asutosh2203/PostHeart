import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "@react-native-firebase/firestore";

export default function SetupScreen() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const db = getFirestore();

  // 1. Create a new room
  const createCode = async () => {
    // Generate a random 6-char code
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setLoading(true);

    try {
      // Create the document in Firebase
      await setDoc(doc(db, "couples", newCode), {
        created: new Date(),
        text: "Welcome to PostHeart! ❤️",
      });

      // Save locally
      await AsyncStorage.setItem("couple_code", newCode);

      Alert.alert(
        "Success!",
        `Your Couple Code is: ${newCode}\n\nShare this with your partner!`,
        [
          {
            text: "OK, Let's Go!",
            onPress: () => {
              // This runs ONLY when you tap the button
              router.replace("/");
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Could not create code.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Join an existing room
  const joinCode = async () => {
    if (code.length < 6) return;
    setLoading(true);

    try {
      const cleanCode = code.trim().toUpperCase();
      const docRef = doc(db, "couples", cleanCode);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await AsyncStorage.setItem("couple_code", cleanCode);

        // Add a success alert here too for good UX
        Alert.alert("Connected!", "You are now linked.", [
          { text: "Enter", onPress: () => router.replace("/") },
        ]);
      } else {
        Alert.alert("Invalid Code", "That couple code doesn't exist!");
      }
    } catch (error) {
      Alert.alert("Error", "Could not join.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PostHeart ❤️</Text>
      <Text style={styles.subtitle}>Connect with your person.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>ENTER PARTNER'S CODE:</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. X7Z9KP"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.joinBtn} onPress={joinCode}>
          <Text style={styles.btnText}>Join Existing</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.or}>- OR -</Text>

      <TouchableOpacity style={styles.createBtn} onPress={createCode}>
        <Text style={styles.createBtnText}>Create New Code</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FF4081",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#636E72",
    textAlign: "center",
    marginBottom: 40,
  },
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    elevation: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#B2BEC3",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    textAlign: "center",
    marginBottom: 16,
  },
  joinBtn: {
    backgroundColor: "#FF4081",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "bold" },
  or: { textAlign: "center", marginVertical: 20, color: "#B2BEC3" },
  createBtn: { padding: 16, alignItems: "center" },
  createBtnText: { color: "#2D3436", fontWeight: "bold" },
});
