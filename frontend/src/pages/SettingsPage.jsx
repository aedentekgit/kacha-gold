import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  Database,
  Target,
  Server
} from "lucide-react";

export default function SettingsPage({
  currentPin = "123456",
  onUpdatePin,
  onLockApp,
  targetProfit = 250,
  targetProfitPct = 5,
  onUpdateTargets,
}) {
  // PIN change state
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPins, setShowPins] = useState(false);
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState("");
  const [isSavingPin, setIsSavingPin] = useState(false);

  // Profit target state
  const [targetMarginVal, setTargetMarginVal] = useState(targetProfit);
  const [targetPctVal, setTargetPctVal] = useState(targetProfitPct);
  const [targetSuccess, setTargetSuccess] = useState("");
  const [isSavingTarget, setIsSavingTarget] = useState(false);

  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth <= 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle PIN Update
  const handleSavePin = async (e) => {
    e.preventDefault();
    setPinError("");
    setPinSuccess("");

    const cleanOld = oldPin.trim();
    const cleanNew = newPin.trim();
    const cleanConfirm = confirmPin.trim();

    if (!cleanOld) {
      setPinError("Please enter your current PIN.");
      return;
    }

    if (cleanOld !== String(currentPin || "123456").trim()) {
      setPinError("Current PIN does not match. Please verify and try again.");
      return;
    }

    if (!/^\d{6}$/.test(cleanNew)) {
      setPinError("New PIN must be exactly 6 numeric digits (0-9).");
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setPinError("New PIN and Confirm PIN do not match.");
      return;
    }

    if (cleanNew === cleanOld) {
      setPinError("New PIN must be different from your current PIN.");
      return;
    }

    try {
      setIsSavingPin(true);
      await onUpdatePin(cleanNew);
      setPinSuccess("Security PIN updated and synchronized in the Database!");
      setOldPin("");
      setNewPin("");
      setConfirmPin("");
      setTimeout(() => setPinSuccess(""), 4000);
    } catch (err) {
      setPinError(err.message || "Failed to update PIN in database.");
    } finally {
      setIsSavingPin(false);
    }
  };

  // Handle Target Settings Update
  const handleSaveTargets = async (e) => {
    e.preventDefault();
    setTargetSuccess("");
    try {
      setIsSavingTarget(true);
      if (onUpdateTargets) {
        await onUpdateTargets(Number(targetMarginVal), Number(targetPctVal));
        setTargetSuccess("Profit targets saved and synced with database!");
        setTimeout(() => setTargetSuccess(""), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingTarget(false);
    }
  };

  return (
    <div className="gl-settings-page">
      <style>{`
        .gl-settings-page {
          padding: 8px 0 32px 0;
          max-width: 860px;
          margin: 0 auto;
          animation: glSettingsFadeIn 0.25s ease-out;
        }

        @keyframes glSettingsFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .gl-settings-header {
          margin-bottom: 24px;
        }

        .gl-settings-title {
          font-family: 'Montserrat', sans-serif !important;
          font-size: 22px;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 4px 0;
        }

        .gl-settings-sub {
          font-size: 13.5px;
          color: #64748B;
          margin: 0;
        }

        .gl-settings-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .gl-settings-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .gl-card-head {
          margin-bottom: 18px;
          padding-bottom: 14px;
          border-bottom: 1px solid #F1F5F9;
        }

        .gl-card-head-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .gl-icon-badge {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #059669;
        }

        .gl-icon-badge.amber {
          background: #FFFBEB;
          border-color: #FDE68A;
          color: #D97706;
        }

        .gl-icon-badge.blue {
          background: #EFF6FF;
          border-color: #BFDBFE;
          color: #2563EB;
        }

        .gl-head-title {
          font-family: 'Montserrat', sans-serif !important;
          font-size: 17px;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 4px 0;
          letter-spacing: -0.2px;
        }

        .gl-head-desc {
          font-size: 13px;
          color: #64748B;
          margin: 0;
          line-height: 1.45;
        }

        .gl-form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 18px;
        }

        .gl-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .gl-label {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .gl-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .gl-input {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          font-size: 15px;
          font-family: inherit;
          color: #0F172A;
          background: #FFFFFF;
          outline: none;
          transition: all 0.2s ease;
        }

        .gl-input:focus {
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
        }

        .gl-input-btn {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          color: #64748B;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
        }

        .gl-btn-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .gl-btn-primary {
          background: #059669;
          color: #FFFFFF;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s ease;
          box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);
        }

        .gl-btn-primary:hover:not(:disabled) {
          background: #047857;
          transform: translateY(-1px);
        }

        .gl-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .gl-btn-secondary {
          background: #F8FAFC;
          border: 1px solid #CBD5E1;
          color: #334155;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s ease;
        }

        .gl-btn-secondary:hover {
          background: #F1F5F9;
          color: #0F172A;
          border-color: #94A3B8;
        }

        .gl-msg-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .gl-msg-banner.error {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #DC2626;
        }

        .gl-msg-banner.success {
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          color: #059669;
        }

        .gl-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 700;
          background: #ECFDF5;
          color: #059669;
          border: 1px solid #A7F3D0;
        }

        .gl-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10B981;
        }

        .gl-db-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
          background: #F8FAFC;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
        }

        .gl-db-info-item {
          display: flex;
          flex-direction: column;
        }

        .gl-settings-section-tag {
          font-size: 11px;
          font-weight: 800;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 6px;
          padding-left: 2px;
        }

        @media (max-width: 640px) {
          .gl-settings-page {
            padding: 2px 0 24px 0;
          }
          .gl-settings-header {
            margin-bottom: 12px;
          }
          .gl-settings-title {
            font-size: 18px;
            letter-spacing: -0.2px;
          }
          .gl-settings-sub {
            font-size: 12px;
            line-height: 1.4;
            color: #64748B;
          }
          .gl-settings-grid {
            gap: 16px;
          }
          .gl-settings-card {
            padding: 14px 14px;
            border-radius: 16px;
          }
          .gl-card-head {
            margin-bottom: 12px;
            padding-bottom: 10px;
          }
          .gl-card-head-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .gl-icon-badge {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            flex-shrink: 0;
          }
          .gl-head-title {
            font-size: 15px;
            line-height: 1.3;
          }
          .gl-head-desc {
            font-size: 12px;
            line-height: 1.4;
            color: #64748B;
            margin-top: 2px;
          }
          .gl-status-pill {
            flex-shrink: 0;
            padding: 3px 8px;
            font-size: 10.5px;
            gap: 4px;
          }
          .gl-form-row {
            grid-template-columns: 1fr;
            gap: 10px;
            margin-bottom: 14px;
          }
          .gl-mobile-two-col {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .gl-label {
            font-size: 11px;
          }
          .gl-input {
            height: 42px;
            font-size: 14px;
          }
          .gl-btn-group {
            display: flex;
            flex-direction: column;
            width: 100%;
            gap: 8px;
          }
          .gl-btn-primary, .gl-btn-secondary {
            width: 100%;
            justify-content: center;
            height: 44px;
            font-size: 13.5px;
          }
          .gl-db-info-grid {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 10px 12px;
          }
          .gl-db-info-item {
            padding-bottom: 6px;
            border-bottom: 1px solid #EEF2F6;
          }
          .gl-db-info-item:last-child {
            padding-bottom: 0;
            border-bottom: none;
          }
        }
      `}</style>

      {/* Header */}
      <div className="gl-settings-header">
        <h1 className="gl-settings-title">{isMobile ? "Settings" : "App Settings"}</h1>
        <p className="gl-settings-sub">Manage security PIN, database options, and sell signal targets</p>
      </div>

      <div className="gl-settings-grid">
        {/* Section 1: Security PIN */}
        <div>
          {isMobile && <div className="gl-settings-section-tag">SECURITY & APP ACCESS</div>}
          <div className="gl-settings-card">
            <div className="gl-card-head">
              <div className="gl-card-head-top">
                <div className="gl-icon-badge">
                  <ShieldCheck size={isMobile ? 18 : 22} />
                </div>
                <div className="gl-status-pill">
                  <span className="gl-status-dot" />
                  <span>PIN Protected</span>
                </div>
              </div>
              <div>
                <h3 className="gl-head-title">Security PIN Protection</h3>
                <p className="gl-head-desc">Set your 6-digit master PIN required to access the ledger</p>
              </div>
            </div>

            {pinError && (
              <div className="gl-msg-banner error">
                <AlertCircle size={16} />
                <span>{pinError}</span>
              </div>
            )}

            {pinSuccess && (
              <div className="gl-msg-banner success">
                <CheckCircle2 size={16} />
                <span>{pinSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSavePin}>
              <div className="gl-form-row">
                {/* Current PIN */}
                <div className="gl-form-group">
                  <label className="gl-label">Current PIN</label>
                  <div className="gl-input-wrap">
                    <input
                      type={showPins ? "text" : "password"}
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Enter current 6-digit PIN"
                      value={oldPin}
                      onChange={(e) => setOldPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="gl-input"
                    />
                    <button
                      type="button"
                      className="gl-input-btn"
                      onClick={() => setShowPins(!showPins)}
                      title={showPins ? "Hide" : "Show"}
                    >
                      {showPins ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New PIN & Confirm PIN in 2 columns on mobile */}
                <div className={isMobile ? "gl-mobile-two-col" : "gl-form-group"} style={{ display: isMobile ? "grid" : "contents" }}>
                  <div className="gl-form-group">
                    <label className="gl-label">{isMobile ? "New PIN" : "New 6-Digit PIN"}</label>
                    <div className="gl-input-wrap">
                      <input
                        type={showPins ? "text" : "password"}
                        maxLength={6}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="e.g. 123456"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="gl-input"
                      />
                    </div>
                  </div>

                  <div className="gl-form-group">
                    <label className="gl-label">{isMobile ? "Confirm PIN" : "Confirm New PIN"}</label>
                    <div className="gl-input-wrap">
                      <input
                        type={showPins ? "text" : "password"}
                        maxLength={6}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Re-enter PIN"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="gl-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="gl-btn-group">
                <button
                  type="submit"
                  disabled={isSavingPin || !oldPin || !newPin || !confirmPin}
                  className="gl-btn-primary"
                >
                  <Save size={15} />
                  <span>{isSavingPin ? "Updating DB..." : "Update PIN in Database"}</span>
                </button>

                <button
                  type="button"
                  onClick={onLockApp}
                  className="gl-btn-secondary"
                  title="Lock application immediately"
                >
                  <Lock size={15} />
                  <span>Lock App Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Section 2: Sell Signals & Profit Target Settings */}
        <div>
          {isMobile && <div className="gl-settings-section-tag">SELL SIGNAL PREFERENCES</div>}
          <div className="gl-settings-card">
            <div className="gl-card-head">
              <div className="gl-card-head-top">
                <div className="gl-icon-badge amber">
                  <Target size={isMobile ? 18 : 22} />
                </div>
              </div>
              <div>
                <h3 className="gl-head-title">Sell Signal Targets</h3>
                <p className="gl-head-desc">Customize default thresholds to trigger Strong Sell alerts</p>
              </div>
            </div>

            {targetSuccess && (
              <div className="gl-msg-banner success">
                <CheckCircle2 size={16} />
                <span>{targetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveTargets}>
              <div className={`gl-form-row ${isMobile ? "gl-mobile-two-col" : ""}`}>
                <div className="gl-form-group">
                  <label className="gl-label">{isMobile ? "Target (₹/g)" : "Target Profit (₹ per gram)"}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={10}
                    value={targetMarginVal}
                    onChange={(e) => setTargetMarginVal(e.target.value)}
                    className="gl-input"
                  />
                </div>

                <div className="gl-form-group">
                  <label className="gl-label">{isMobile ? "Target (%)" : "Target Profit Margin (%)"}</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.5}
                    value={targetPctVal}
                    onChange={(e) => setTargetPctVal(e.target.value)}
                    className="gl-input"
                  />
                </div>
              </div>

              <div className="gl-btn-group">
                <button
                  type="submit"
                  disabled={isSavingTarget}
                  className="gl-btn-primary"
                >
                  <Save size={15} />
                  <span>{isSavingTarget ? "Saving..." : "Save Profit Targets"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Section 3: Database & Cloud Sync Details */}
        <div>
          {isMobile && <div className="gl-settings-section-tag">DATABASE & CLOUD SYNC</div>}
          <div className="gl-settings-card">
            <div className="gl-card-head">
              <div className="gl-card-head-top">
                <div className="gl-icon-badge blue">
                  <Server size={isMobile ? 18 : 22} />
                </div>
                <div className="gl-status-pill">
                  <span className="gl-status-dot" />
                  <span>Live & Connected</span>
                </div>
              </div>
              <div>
                <h3 className="gl-head-title">Database & Cloud Synchronization</h3>
                <p className="gl-head-desc">Live status of centralized MySQL database connection</p>
              </div>
            </div>

            <div className="gl-db-info-grid">
              <div className="gl-db-info-item">
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Target Host</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>145.79.209.121:3306</div>
              </div>
              <div className="gl-db-info-item">
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Database Schema</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>u248216155_kacha</div>
              </div>
              <div className="gl-db-info-item">
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Cloud API Endpoint</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#059669", marginTop: 2 }}>kacha-gold.onrender.com</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
