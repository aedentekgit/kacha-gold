import React, { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmModal({ isOpen, title, message, confirmText, confirmVariant = "danger", onConfirm, onClose }) {
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
    <div className="gl-modal-overlay" onClick={onClose}>
      <div className="gl-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="gl-modal-handle" />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: confirmVariant === "danger" ? "#FEF2F2" : "#FEF3C7",
            border: `1px solid ${confirmVariant === "danger" ? "#FECACA" : "#FDE68A"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: confirmVariant === "danger" ? "#DC2626" : "#D97706",
            flexShrink: 0
          }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1C1917", fontFamily: "'Montserrat', sans-serif" }}>
              {title}
            </h3>
          </div>
        </div>

        <p style={{ margin: "0 0 22px", fontSize: 13, color: "#78716C", lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            className="gl-btn-ghost"
            onClick={onClose}
            style={{ padding: "8px 16px", fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            className="gl-btn"
            onClick={async () => {
              try {
                if (onConfirm) await onConfirm();
              } finally {
                if (onClose) onClose();
              }
            }}
            style={{
              padding: "8px 18px",
              fontSize: 13,
              background: confirmVariant === "danger" ? "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)" : undefined,
              boxShadow: confirmVariant === "danger" ? "0 4px 14px rgba(220, 38, 38, 0.3)" : undefined
            }}
          >
            {confirmText || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
