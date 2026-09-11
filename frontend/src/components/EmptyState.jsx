import React from "react";
import { Plus, ArrowRight, ShieldCheck, Sparkles, TrendingUp, FilterX, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EmptyState({
  icon: Icon = Coins,
  iconColor = "#B8860B",
  iconBg = "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
  title = "No Records Found",
  subtitle = "Log your gold purchases to track live sell signals, profits, and price graphs.",
  badge = "Gold Portfolio Ledger",
  primaryAction = null,
  secondaryAction = null,
  showHighlights = true
}) {
  const navigate = useNavigate();

  const defaultPrimary = {
    label: "Add Gold Purchase",
    icon: Plus,
    onClick: () => navigate("/add")
  };

  const action = primaryAction || defaultPrimary;
  const ActionIcon = action.icon || Plus;
  const SecondaryIcon = secondaryAction?.icon || ArrowRight;

  return (
    <div
      className="gl-empty-card"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 16,
        padding: "48px 24px 40px",
        textAlign: "center",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
        position: "relative",
        overflow: "hidden",
        maxWidth: 760,
        margin: "16px auto",
        animation: "fadeIn 0.3s ease-out"
      }}
    >
      {/* Top subtle decorative accent stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "linear-gradient(90deg, #10B981 0%, #F59E0B 50%, #10B981 100%)"
        }}
      />

      {/* Decorative ambient background glow */}
      <div
        style={{
          position: "absolute",
          top: "-50px",
          left: "50%",
          transform: "translateX(-50%)",
          width: 300,
          height: 180,
          background: "radial-gradient(ellipse at center, rgba(245, 158, 11, 0.08) 0%, rgba(255, 255, 255, 0) 70%)",
          pointerEvents: "none"
        }}
      />

      {/* Badge */}
      {badge && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 20, fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 18 }}>
          <Sparkles size={13} color="#F59E0B" />
          <span>{badge}</span>
        </div>
      )}

      {/* Central Icon Illustration */}
      <div
        style={{
          width: 68,
          height: 68,
          borderRadius: 20,
          background: iconBg,
          boxShadow: "0 8px 24px -4px rgba(245, 158, 11, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          border: "2px solid #FFFFFF",
          transition: "transform 0.2s ease"
        }}
      >
        <Icon size={32} color={iconColor} />
      </div>

      {/* Title */}
      <h2
        style={{
          margin: "0 0 10px",
          fontSize: 21,
          fontWeight: 800,
          color: "#0F172A",
          fontFamily: "'Montserrat', sans-serif",
          letterSpacing: "-0.3px"
        }}
      >
        {title}
      </h2>

      {/* Subtitle */}
      <p
        style={{
          margin: "0 auto 26px",
          fontSize: 14,
          color: "#64748B",
          lineHeight: 1.6,
          maxWidth: 480
        }}
      >
        {subtitle}
      </p>

      {/* Action Buttons */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: showHighlights ? 36 : 8 }}>
        {action && (
          <button
            className="gl-btn"
            onClick={action.onClick}
            style={{
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 800,
              borderRadius: 10,
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              boxShadow: "0 4px 14px rgba(5, 150, 105, 0.25)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer"
            }}
          >
            <ActionIcon size={16} />
            <span>{action.label}</span>
          </button>
        )}

        {secondaryAction && (
          <button
            className="gl-btn-ghost"
            onClick={secondaryAction.onClick}
            style={{
              padding: "10px 20px",
              fontSize: 13.5,
              fontWeight: 700,
              borderRadius: 10,
              color: "#334155",
              borderColor: "#CBD5E1",
              background: "#F8FAFC",
              display: "inline-flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <SecondaryIcon size={15} />
            <span>{secondaryAction.label}</span>
          </button>
        )}
      </div>

      {/* Mini Feature Highlights */}
      {showHighlights && (
        <div
          style={{
            borderTop: "1px solid #F1F5F9",
            paddingTop: 24,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            textAlign: "left"
          }}
        >
          <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 14px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Coins size={14} color="#B45309" />
              <span style={{ fontSize: 12, fontWeight: 800, color: "#0F172A" }}>Lot-by-Lot Ledger</span>
            </div>
            <div style={{ fontSize: 11.5, color: "#64748B", lineHeight: 1.4 }}>
              Accurately track purchase weight, rate paid, and supplier notes.
            </div>
          </div>

          <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 14px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <TrendingUp size={14} color="#059669" />
              <span style={{ fontSize: 12, fontWeight: 800, color: "#0F172A" }}>Live Sell Signals</span>
            </div>
            <div style={{ fontSize: 11.5, color: "#64748B", lineHeight: 1.4 }}>
              Instant indicators when market Kacha crosses your profit targets.
            </div>
          </div>

          <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 14px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <ShieldCheck size={14} color="#2563EB" />
              <span style={{ fontSize: 12, fontWeight: 800, color: "#0F172A" }}>Safe Real-Time P/L</span>
            </div>
            <div style={{ fontSize: 11.5, color: "#64748B", lineHeight: 1.4 }}>
              Automatic valuation based on day-by-day market benchmarks.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
