import fs from "fs";
import path from "path";

export function getRawFirebaseConfig(): any {
  try {
    const rawData = fs.readFileSync(
      path.join(process.cwd(), "firebase-applet-config.json"),
      "utf8"
    );
    const config = JSON.parse(rawData);
    if (
      !config.projectId ||
      config.projectId === "PLACEHOLDER" ||
      config.projectId.includes("#")
    )
      throw new Error("is placeholder");
    return config;
  } catch (err) {
    const isRealValue = (id: string | undefined): boolean => {
      if (!id) return false;
      if (id === "PLACEHOLDER") return false;
      if (
        id.includes("#") ||
        id.includes("!") ||
        id.includes("@") ||
        id.includes("$") ||
        id.includes("^")
      )
        return false;
      return true;
    };

    const envProjectId = process.env.VITE_FIREBASE_PROJECT_ID;
    if (envProjectId && isRealValue(envProjectId)) {
      return {
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        appId: process.env.VITE_FIREBASE_APP_ID,
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        firestoreDatabaseId: process.env.VITE_FIREBASE_DATABASE_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId:
          process.env.VITE_FIREBASE_MESSAGING_ID ||
          process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      };
    }

    throw new Error(
      "Firebase configuration is missing. Add VITE_FIREBASE_* environment variables."
    );
  }
}
