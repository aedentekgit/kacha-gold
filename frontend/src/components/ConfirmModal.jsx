import React, { useEffect } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  confirmVariant = "danger",
  icon: CustomIcon,
  onConfirm,
  onClose
}) {
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

  const isDanger = confirmVariant === "danger";
  const isPrimary = confirmVariant === "primary" || confirmVariant === "success";

  const renderIcon = () => {
    if (CustomIcon) return <CustomIcon size={22} />;
    if (isPrimary) return <CheckCircle2 size={22} />;
    return <AlertTriangle size={22} />;
  };

  const getBadgeStyle = () => {
    if (isPrimary) {
      return {
        width: 42,
        height: 42,
        borderRadius: 12,
        background: "#ECFDF5",
        border: "1px solid #A7F3D0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#059669",
        flexShrink: 0
      };
    }
    if (isDanger) {
      return {
        width: 42,
        height: 42,
        borderRadius: 12,
        background: "#FEF2F2",
        border: "1px solid #FECACA",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#DC2626",
        flexShrink: 0
      };
    }
    return {
      width: 42,
      height: 42,
      borderRadius: 12,
      background: "#FFFBEB",
      border: "1px solid #FDE68A",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#D97706",
      flexShrink: 0
    };
  };

  const getBtnStyle = () => {
    if (isPrimary) {
      return {
        padding: "8px 18px",
        fontSize: 13,
        fontWeight: 700,
        background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
        boxShadow: "0 4px 14px rgba(5, 150, 105, 0.3)",
        color: "#FFFFFF",
        border: "none",
        cursor: "pointer",
        borderRadius: 10
      };
    }
    if (isDanger) {
      return {
        padding: "8px 18px",
        fontSize: 13,
        fontWeight: 700,
        background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
        boxShadow: "0 4px 14px rgba(220, 38, 38, 0.3)",
        color: "#FFFFFF",
        border: "none",
        cursor: "pointer",
        borderRadius: 10
      };
    }
    return {
      padding: "8px 18px",
      fontSize: 13,
      fontWeight: 700,
      background: "linear-gradient(135deg, #D97706 0%, #B45309 100%)",
      boxShadow: "0 4px 14px rgba(217, 119, 6, 0.3)",
      color: "#FFFFFF",
      border: "none",
      cursor: "pointer",
      borderRadius: 10
    };
  };

  return (
    <div className="gl-modal-overlay" onClick={onClose}>
      <div className="gl-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="gl-modal-handle" />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div className="gl-alert-pulse" style={getBadgeStyle()}>
            {renderIcon()}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1C1917", fontFamily: "'Montserrat', sans-serif" }}>
              {title}
            </h3>
          </div>
        </div>

        <p style={{ margin: "0 0 22px", fontSize: 13.5, color: "#64748B", lineHeight: 1.5 }}>
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
            style={getBtnStyle()}
          >
            {confirmText || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
