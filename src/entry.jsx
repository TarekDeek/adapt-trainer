/* Storage shim: same window.storage API the app expects, backed by the phone's localStorage */
window.storage = {
  async get(k) {
    const v = localStorage.getItem(k);
    if (v === null) throw new Error("key not found: " + k);
    return { key: k, value: v };
  },
  async set(k, v) {
    localStorage.setItem(k, v);
    return { key: k, value: v };
  },
  async delete(k) {
    localStorage.removeItem(k);
    return { key: k, deleted: true };
  },
  async list(prefix) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!prefix || key.startsWith(prefix)) keys.push(key);
    }
    return { keys };
  },
};

import { createRoot } from "react-dom/client";
import App from "./adapt-trainer.jsx";

createRoot(document.getElementById("root")).render(<App />);
