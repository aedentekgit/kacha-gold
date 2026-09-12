import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";

// Stack of active modal/overlay handlers
// Each item: { id: string, fn: () => boolean | void, priority: number }
const handlers = [];

// Fallback navigation handler (provided by App.jsx)
let defaultNavigationHandler = null;

let isCapacitorListenerAttached = false;
let capacitorListenerHandle = null;

/**
 * Exits the native application or closes window if in web environment.
 */
export async function exitApplication() {
  try {
    if (Capacitor.isNativePlatform()) {
      await CapApp.exitApp();
    } else {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.close();
      }
    }
  } catch (err) {
    console.warn("exitApplication error:", err);
  }
}

/**
 * Triggers the back button action through the registered handler hierarchy:
 * 1. Checks modal/popup handlers (highest priority first).
 * 2. If no modal handles it, runs the default navigation handler (screen back / exit prompt).
 */
export function triggerBack() {
  // Sort by priority descending (higher priority runs first)
  const sorted = [...handlers].sort((a, b) => b.priority - a.priority);

  for (const item of sorted) {
    try {
      const handled = item.fn();
      // If the handler didn't explicitly return false, consider it consumed
      if (handled !== false) {
        return true;
      }
    } catch (err) {
      console.error("Error in back handler:", err);
    }
  }

  // If no registered modal handled the back action, invoke fallback navigation
  if (typeof defaultNavigationHandler === "function") {
    try {
      defaultNavigationHandler();
      return true;
    } catch (err) {
      console.error("Error in defaultNavigationHandler:", err);
    }
  }

  return false;
}

/**
 * Sets the default navigation fallback handler.
 */
export function setDefaultNavigationHandler(handler) {
  defaultNavigationHandler = handler;
}

/**
 * Registers a handler with an optional priority (default: 10).
 * Returns an unregister function.
 */
export function registerBackHandler(fn, priority = 10) {
  const item = { id: Math.random().toString(36).slice(2), fn, priority };
  handlers.push(item);

  return () => {
    const idx = handlers.indexOf(item);
    if (idx !== -1) {
      handlers.splice(idx, 1);
    }
  };
}

/**
 * React hook to register a back button handler when `isActive` is true.
 */
export function useBackHandler(handler, isActive = true, priority = 10) {
  useEffect(() => {
    if (!isActive) return;
    const unregister = registerBackHandler(handler, priority);
    return unregister;
  }, [isActive, handler, priority]);
}

/**
 * Initializes the native Capacitor back button listener and browser keyboard fallback.
 */
export function initBackButtonListener() {
  if (isCapacitorListenerAttached) return () => {};

  isCapacitorListenerAttached = true;

  // Native Android back button listener
  if (Capacitor.isPluginAvailable("App")) {
    CapApp.addListener("backButton", () => {
      triggerBack();
    }).then((handle) => {
      capacitorListenerHandle = handle;
    }).catch((err) => {
      console.warn("Could not attach CapApp backButton listener:", err);
    });
  }

  // Browser escape key support for testing in dev/browser
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      triggerBack();
    }
  };
  window.addEventListener("keydown", handleKeyDown);

  return () => {
    if (capacitorListenerHandle && capacitorListenerHandle.remove) {
      capacitorListenerHandle.remove();
      capacitorListenerHandle = null;
    }
    window.removeEventListener("keydown", handleKeyDown);
    isCapacitorListenerAttached = false;
  };
}
