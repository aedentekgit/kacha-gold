import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";

let isModalActive = false;

/**
 * Updates the native status bar to match modal backdrop overlay.
 * When a modal is open: sets status bar to dark (#0F172A) with white icons.
 * When closed: restores clean white status bar (#FFFFFF) with dark icons.
 */
export async function updateStatusBarForModal(hasModal) {
  if (!Capacitor.isPluginAvailable("StatusBar")) return;
  if (isModalActive === hasModal) return;
  isModalActive = hasModal;

  try {
    if (hasModal) {
      await StatusBar.setBackgroundColor({ color: "#0F172A" });
      await StatusBar.setStyle({ style: Style.Dark });
    } else {
      await StatusBar.setBackgroundColor({ color: "#FFFFFF" });
      await StatusBar.setStyle({ style: Style.Light });
    }
  } catch (err) {
    console.debug("StatusBar update error:", err);
  }
}

/**
 * Automatically observes the DOM for any open modals (.gl-modal-overlay)
 * and keeps native Android/iOS status bar synchronized.
 */
export function initStatusBarObserver() {
  if (!Capacitor.isPluginAvailable("StatusBar")) return () => {};

  // Initialize status bar to clean white
  try {
    StatusBar.setBackgroundColor({ color: "#FFFFFF" });
    StatusBar.setStyle({ style: Style.Light });
  } catch (err) {
    // ignore
  }

  const check = () => {
    const modalExists = Boolean(document.querySelector(".gl-modal-overlay"));
    updateStatusBarForModal(modalExists);
  };

  const observer = new MutationObserver(() => {
    check();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  check();

  return () => observer.disconnect();
}
