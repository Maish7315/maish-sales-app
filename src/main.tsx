import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Debug PWA installation
if ('onbeforeinstallprompt' in window) {
  console.log('PWA install prompt is supported');
} else {
  console.log('PWA install prompt is NOT supported');
}

if ('serviceWorker' in navigator) {
  console.log('Service Worker is supported');
} else {
  console.log('Service Worker is NOT supported');
}

if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('App is running in standalone mode');
} else {
  console.log('App is running in browser mode');
}
