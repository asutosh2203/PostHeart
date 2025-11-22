import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

admin.initializeApp();

// Use the V2 trigger "onDocumentWritten"
export const onNoteWritten = onDocumentWritten(
  "couples/{coupleCode}",
  async (event) => {
    // 1. Get the new data (V2 puts it inside event.data)
    // event.data might be undefined if the document was deleted
    const change = event.data;
    const newData = change?.after.data();

    // If data was deleted or doesn't exist, stop
    if (!newData) return;

    const senderName = newData.sender || "Partner";
    const noteText = newData.text || "New Note!";
    const theme = newData.theme || "light";
    const type = newData.type || "text";
    const content = newData.content || "";

    // The tokens map
    const tokensMap = newData.tokens || {};

    logger.info(`New note from ${senderName}, notifying... ${newData.text}`);

    // 2. Prepare Payload
    const payload = {
      //   notification: {
      //     title: `New Note from ${senderName}`,
      //     body: type === "sticker" ? "Sent a sticker! 🖼️" : noteText,
      //   },
      data: {
        text: noteText,
        sender: senderName,
        theme: theme,
        type: type,
        content: content,
        // Use simple string for time to avoid parsing issues on client
        time: new Date().toISOString(),
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      android: {
        priority: "high" as const,
        ttl: 0 // Forces immediate delivery
      },
    };

    // 3. Send Loop
    const promises: Promise<any>[] = [];
    const tokensToRemove: string[] = [];

    for (const [name, token] of Object.entries(tokensMap)) {
      // Skip sender
      if (senderName.includes(name)) continue;

      const p = admin
        .messaging()
        .send({
          token: token as string,
          ...payload,
        })
        .catch((error) => {
          if (error.code === "messaging/registration-token-not-registered") {
            logger.warn(`Token invalid for ${name}, removing...`);
            tokensToRemove.push(`tokens.${name}`);
          } else {
            logger.error("FCM Error:", error);
          }
        });

      promises.push(p);
    }

    await Promise.all(promises);

    // 4. Cleanup
    if (tokensToRemove.length > 0) {
      const updateBlock: any = {};
      tokensToRemove.forEach((field) => {
        updateBlock[field] = admin.firestore.FieldValue.delete();
      });
      // Write back to the same document ref
      await event.data?.after.ref.update(updateBlock);
    }
  }
);
