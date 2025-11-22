import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";
import messaging from "@react-native-firebase/messaging";
import { NativeModules } from "react-native";

const { SharedStorage } = NativeModules;

// This runs even if the app is killed/closed!
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("Message handled in the background!", remoteMessage);

  // 1. Extract the payload from the notification
  const data = remoteMessage.data;

  if (data) {
    const dateObj = data.time ? new Date(data.time) : new Date();

    // 2. Format cleanly (Local Time, No Seconds)
    const cleanTime = dateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    // 2. Reconstruct the JSON for the Widget
    const payload = JSON.stringify({
      text: data.text || "New Note!",
      time: cleanTime || "Just now", // We might calculate time fresh here
      sender: data.sender || "",
      theme: data.theme || "light",
      type: data.type || "text",
      content: data.content || "",
    });

    // 3. Wake up the Native Bridge
    SharedStorage.set(payload);
  }
});

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context("./app");
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
