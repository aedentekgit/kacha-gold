import React, { useEffect } from "react";
import { LogOut } from "lucide-react";
import { useBackHandler } from "../utils/backButton";

export default function ExitConfirmModal({ isOpen, onClose, onConfirmExit }) {
  // When this exit confirmation modal is open, pressing Android back button should close it
  useBackHandler(
    () => {
      onClose();
      return true;
    },
    isOpen,
    100
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="gl-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-modal-title"
      style={{ zIndex: 9999999 }}
    >
      <div
        className="gl-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 420,
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.35)",
          border: "1px solid #E2E8F0"
        }}
      >
        <div className="gl-modal-handle" />

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#DC2626",
              flexShrink: 0
            }}
          >
            <LogOut size={22} />
          </div>
          <div>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: "#D97706",
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                display: "block",
                marginBottom: 2
              }}
            >
              VMG Kacha Gold
            </span>
            <h3
              id="exit-modal-title"
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 800,
                color: "#0F172A",
                fontFamily: "'Manrope', sans-serif"
              }}
            >
              Exit Application?
            </h3>
          </div>
        </div>

        <p
          style={{
            margin: "0 0 24px",
            fontSize: 13.5,
            color: "#64748B",
            lineHeight: 1.55,
            fontWeight: 500
          }}
        >
          Are you sure you want to exit the app? All your purchase entries and settings are safely saved.
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className="gl-btn-ghost"
            onClick={onClose}
            style={{
              padding: "9px 18px",
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 10
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="gl-btn"
            onClick={async () => {
              if (onConfirmExit) {
                await onConfirmExit();
              }
            }}
            style={{
              padding: "9px 20px",
              fontSize: 13,
              fontWeight: 700,
              background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
              boxShadow: "0 4px 14px rgba(220, 38, 38, 0.28)",
              color: "#FFFFFF",
              border: "none",
              cursor: "pointer",
              borderRadius: 10,
              display: "inline-flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <LogOut size={16} />
            <span>Exit App</span>
          </button>
        </div>
      </div>
    </div>
  );
}
