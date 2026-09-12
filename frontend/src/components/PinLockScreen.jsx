import React, { useState, useEffect, useCallback } from "react";
import { Lock, Delete, ShieldCheck, AlertCircle } from "lucide-react";

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

  // Physical keyboard listeners (desktop / hardware keyboard)
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
    <div className="gl-pin-screen">
      <style>{`
        .gl-pin-screen {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          height: 100dvh;
          z-index: 99999;
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0;
          margin: 0;
          user-select: none;
          -webkit-user-select: none;
          box-sizing: border-box;
          overflow: hidden;
        }

        .gl-pin-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: calc(env(safe-area-inset-top, 0px) + 24px) 24px calc(env(safe-area-inset-bottom, 0px) + 20px);
          box-sizing: border-box;
          max-width: 420px;
          margin: 0 auto;
        }

        @keyframes glPinShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-12px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(4px); }
        }

        .gl-pin-top-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: 100%;
          padding-top: 10px;
        }

        .gl-pin-top-section.shaking {
          animation: glPinShake 0.4s ease-in-out;
        }

        .gl-pin-logo-wrap {
          width: 68px;
          height: 68px;
          border-radius: 20px;
          background: linear-gradient(135deg, #FFFDF9 0%, #FAF3E8 100%);
          border: 1.5px solid #E5C378;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          box-shadow: 0 8px 20px rgba(229, 195, 120, 0.25);
          overflow: hidden;
          transition: transform 0.2s ease;
        }

        .gl-pin-logo-wrap:hover {
          transform: scale(1.04);
        }

        .gl-pin-title {
          font-family: 'Manrope', -apple-system, sans-serif !important;
          font-size: 22px;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 6px 0;
          letter-spacing: -0.4px;
        }

        .gl-pin-subtitle {
          font-family: 'Manrope', -apple-system, sans-serif;
          font-size: 13.5px;
          color: #64748B;
          margin: 0 0 24px 0;
          font-weight: 600;
        }

        /* 6 PIN Indicator Dots */
        .gl-pin-dots {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .gl-pin-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid #CBD5E1;
          background: #F8FAFC;
          transition: all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .gl-pin-dot.filled {
          background: #059669;
          border-color: #059669;
          transform: scale(1.22);
          box-shadow: 0 0 14px rgba(5, 150, 105, 0.45);
        }

        .gl-pin-dot.success {
          background: #10B981;
          border-color: #10B981;
          transform: scale(1.25);
          box-shadow: 0 0 16px rgba(16, 185, 129, 0.6);
        }

        /* Error notification */
        .gl-pin-error {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #DC2626;
          min-height: 24px;
          margin-bottom: 8px;
        }

        /* Ergonomic Mobile Numeric Keypad */
        .gl-pin-bottom-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 8px;
        }

        .gl-keypad-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          width: 100%;
          max-width: 320px;
          margin: 0 auto;
        }

        .gl-keypad-btn {
          height: 64px;
          border-radius: 20px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          color: #0F172A;
          font-family: 'Manrope', -apple-system, sans-serif;
          font-size: 24px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.12s cubic-bezier(0.2, 0, 0, 1);
          outline: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        .gl-keypad-btn:active {
          transform: scale(0.92);
          background: #ECFDF5;
          border-color: #10B981;
          color: #047857;
          box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.15);
        }

        .gl-keypad-btn.action {
          font-size: 13.5px;
          font-weight: 700;
          color: #64748B;
          background: transparent;
          border-color: transparent;
          box-shadow: none;
        }

        .gl-keypad-btn.action:active {
          background: #F1F5F9;
          color: #0F172A;
          transform: scale(0.92);
        }

        .gl-pin-footer-brand {
          margin-top: 14px;
          font-size: 11.5px;
          color: #94A3B8;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          letter-spacing: 0.3px;
        }

        /* Desktop Container Polish (Centers neatly if rendered on broad screens) */
        @media (min-width: 641px) {
          .gl-pin-screen {
            background: radial-gradient(circle at 50% 20%, #F8FAFC 0%, #E2E8F0 100%);
            padding: 32px 16px;
          }
          .gl-pin-container {
            height: auto;
            min-height: 600px;
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 28px;
            padding: 36px 28px 30px;
            box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.15);
            max-width: 380px;
          }
        }
      `}</style>

      <div className="gl-pin-container">
        {/* Top Header & PIN Display */}
        <div className={`gl-pin-top-section ${isShaking ? "shaking" : ""}`}>
          <div className="gl-pin-logo-wrap">
            {isSuccess ? (
              <ShieldCheck size={36} color="#059669" />
            ) : (
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="VMG Gold"
                style={{
                  width: 48,
                  height: 48,
                  objectFit: "contain"
                }}
              />
            )}
          </div>

          <h2 className="gl-pin-title">VMG Gold</h2>
          <p className="gl-pin-subtitle">Enter 6-digit PIN to access ledger</p>

          {/* 6 PIN Indicator Dots */}
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

          {/* Error Message */}
          <div className="gl-pin-error">
            {error && (
              <>
                <AlertCircle size={15} />
                <span>{error}</span>
              </>
            )}
          </div>
        </div>

        {/* Bottom Ergonomic Keypad */}
        <div className="gl-pin-bottom-section">
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
              <Delete size={22} />
            </button>
          </div>

          <div className="gl-pin-footer-brand">
            <Lock size={12} color="#94A3B8" />
            <span>Secure 6-Digit PIN Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
}
