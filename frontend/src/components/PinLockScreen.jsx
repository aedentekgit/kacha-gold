import React, { useState, useEffect, useCallback } from "react";
import { Lock, Delete, ShieldCheck, AlertCircle, KeyRound } from "lucide-react";

export default function PinLockScreen({ expectedPin = "123456", onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const PIN_LENGTH = 6;

  const handleVerify = useCallback(
    (pinToTest) => {
      const targetPin = String(expectedPin || "123456").trim();
      if (pinToTest === targetPin) {
        setIsSuccess(true);
        setError("");
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 320);
      } else {
        setIsShaking(true);
        setError("Incorrect PIN. Please try again.");
        setTimeout(() => {
          setPin("");
          setIsShaking(false);
        }, 500);
      }
    },
    [expectedPin, onSuccess]
  );

  const handleDigit = useCallback(
    (digit) => {
      if (pin.length >= PIN_LENGTH || isSuccess) return;
      setError("");
      const next = pin + digit;
      setPin(next);

      if (next.length === PIN_LENGTH) {
        // Auto-verify when 4 digits are reached
        setTimeout(() => {
          handleVerify(next);
        }, 80);
      }
    },
    [pin, isSuccess, handleVerify]
  );

  const handleBackspace = useCallback(() => {
    if (isSuccess) return;
    setError("");
    setPin((prev) => prev.slice(0, -1));
  }, [isSuccess]);

  const handleClear = useCallback(() => {
    if (isSuccess) return;
    setError("");
    setPin("");
  }, [isSuccess]);

  // Physical keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape" || e.key === "Delete") {
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDigit, handleBackspace, handleClear]);

  return (
    <div className="gl-pin-overlay">
      <style>{`
        .gl-pin-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: radial-gradient(circle at 50% 20%, #F8FAFC 0%, #E2E8F0 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          user-select: none;
          animation: glPinFadeIn 0.25s ease-out forwards;
        }

        @keyframes glPinFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes glPinShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-14px); }
          40% { transform: translateX(12px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(6px); }
        }

        .gl-pin-card {
          width: 100%;
          max-width: 360px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 24px;
          padding: 32px 24px 28px;
          box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: all 0.25s ease;
        }

        .gl-pin-card.shaking {
          animation: glPinShake 0.45s ease-in-out;
          border-color: #FCA5A5;
        }

        .gl-pin-card.success {
          border-color: #86EFAC;
          box-shadow: 0 20px 40px -15px rgba(5, 150, 105, 0.2);
        }

        .gl-pin-logo-wrap {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
          overflow: hidden;
        }

        .gl-pin-title {
          font-family: 'Manrope', sans-serif !important;
          font-size: 20px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 6px 0;
          letter-spacing: -0.3px;
        }

        .gl-pin-subtitle {
          font-family: 'Manrope', sans-serif;
          font-size: 13px;
          color: #64748B;
          margin: 0 0 24px 0;
          font-weight: 500;
        }

        /* PIN Dots */
        .gl-pin-dots {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .gl-pin-dot {
          width: 15px;
          height: 15px;
          border-radius: 50%;
          border: 2px solid #CBD5E1;
          background: #F8FAFC;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .gl-pin-dot.filled {
          background: #059669;
          border-color: #059669;
          transform: scale(1.15);
          box-shadow: 0 0 12px rgba(5, 150, 105, 0.4);
        }

        .gl-pin-dot.success {
          background: #10B981;
          border-color: #10B981;
          transform: scale(1.2);
        }

        /* Error notification */
        .gl-pin-error {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: #DC2626;
          min-height: 22px;
          margin-bottom: 16px;
        }

        /* Numeric Keypad */
        .gl-keypad-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          width: 100%;
          max-width: 290px;
        }

        .gl-keypad-btn {
          height: 60px;
          border-radius: 16px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          color: #0F172A;
          font-family: 'Manrope', sans-serif;
          font-size: 22px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.12s ease;
          outline: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
          -webkit-tap-highlight-color: transparent;
        }

        .gl-keypad-btn:active {
          transform: scale(0.93);
          background: #ECFDF5;
          border-color: #A7F3D0;
          color: #059669;
        }

        .gl-keypad-btn.action {
          font-size: 14px;
          font-weight: 700;
          color: #64748B;
          background: transparent;
          border-color: transparent;
          box-shadow: none;
        }

        .gl-keypad-btn.action:active {
          background: #F1F5F9;
          color: #0F172A;
        }

        .gl-pin-footer-hint {
          margin-top: 20px;
          font-size: 12px;
          color: #94A3B8;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 5px;
        }
      `}</style>

      <div className={`gl-pin-card ${isShaking ? "shaking" : ""} ${isSuccess ? "success" : ""}`}>
        {/* Brand Icon / Logo */}
        <div className="gl-pin-logo-wrap">
          {isSuccess ? (
            <ShieldCheck size={32} color="#059669" />
          ) : (
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="VMoney Gold Logo"
              style={{
                width: 44,
                height: 44,
                objectFit: "contain"
              }}
            />
          )}
        </div>

        <h2 className="gl-pin-title">VMG Gold </h2>
        <p className="gl-pin-subtitle">Enter 6-digit PIN to access ledger</p>

        {/* PIN visual indicators */}
        <div className="gl-pin-dots">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`gl-pin-dot ${isFilled ? "filled" : ""} ${isSuccess ? "success" : ""}`}
              />
            );
          })}
        </div>

        {/* Error message or spacing */}
        <div className="gl-pin-error">
          {error && (
            <>
              <AlertCircle size={15} />
              <span>{error}</span>
            </>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="gl-keypad-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              className="gl-keypad-btn"
              onClick={() => handleDigit(String(num))}
            >
              {num}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            className="gl-keypad-btn action"
            onClick={handleClear}
            title="Clear all"
          >
            Clear
          </button>

          {/* 0 Button */}
          <button
            type="button"
            className="gl-keypad-btn"
            onClick={() => handleDigit("0")}
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            className="gl-keypad-btn action"
            onClick={handleBackspace}
            title="Backspace"
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
