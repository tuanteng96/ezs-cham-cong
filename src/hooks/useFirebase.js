// useFirebase.js
import { useMemo } from "react";
import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

// Parse chuỗi config cũ thành object
function parseFirebaseConfig(str) {
  const match = str.match(/\{([\s\S]*?)\}/);
  if (!match) return null;

  const body = match[1];
  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const config = {};
  lines.forEach((line) => {
    line = line.replace(/,$/, ""); // bỏ dấu phẩy cuối
    const [key, ...rest] = line.split(":");
    if (!key || !rest.length) return;

    const k = key.trim();
    let v = rest.join(":").trim();
    v = v.replace(/^"(.*)"$/, "$1"); // bỏ dấu nháy
    config[k] = v;
  });

  return config;
}

let firebaseServices = null;

const useFirebase = (firebaseStr) => {
  return useMemo(() => {
    if (!firebaseStr) return null;

    const config = parseFirebaseConfig(firebaseStr);
    if (!config) return null;

    // Nếu đã init trước đó thì trả luôn
    if (firebaseServices) return firebaseServices;

    const app =
      getApps().length === 0
        ? initializeApp(config)
        : initializeApp(config, "ALT"); // fallback tên khác nếu cần

    firebaseServices = {
      app,
      db: getDatabase(app),
      firestore: getFirestore(app),
      logout: async () => {
        if (firebaseServices?.app) {
          await deleteApp(firebaseServices.app).catch(() => {});
          firebaseServices = null;
        }
      },
    };

    return firebaseServices;
  }, [firebaseStr]);
};

export default useFirebase;
