import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function CustomSelect({
  options = [],
  value,
  onChange,
  prefix = null,
  placeholder = "Select...",
  size = "md",
  style = {},
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value)) || options[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const isSmall = size === "sm";

  return (
    <div
      ref={dropdownRef}
      className={`gl-custom-select-container ${className}`}
      style={{
        position: "relative",
        display: "inline-block",
        userSelect: "none",
        ...style
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="gl-custom-select-btn"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          background: "#FFFFFF",
          border: isOpen ? "1px solid #059669" : "1px solid #CBD5E1",
          borderRadius: isSmall ? "6px" : "8px",
          padding: isSmall ? "4px 10px" : "6px 12px",
          fontSize: isSmall ? "12px" : "13px",
          fontWeight: "700",
          color: "#0F172A",
          cursor: "pointer",
          boxShadow: isOpen
            ? "0 0 0 3px rgba(5, 150, 105, 0.15)"
            : "0 1px 2px rgba(0,0,0,0.04)",
          transition: "all 0.15s ease",
          outline: "none",
          whiteSpace: "nowrap",
          minHeight: isSmall ? "28px" : "34px"
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
          {prefix && <span style={{ color: "#64748B", fontWeight: 700 }}>{prefix}</span>}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown
          size={isSmall ? 13 : 15}
          color={isOpen ? "#059669" : "#64748B"}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            flexShrink: 0
          }}
        />
      </button>

      {isOpen && (
        <div
          className="gl-custom-select-menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 4px)",
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "10px",
            padding: "4px",
            boxShadow:
              "0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
            zIndex: 1000,
            minWidth: "100%",
            width: "max-content",
            maxHeight: "220px",
            overflowY: "auto",
            animation: "glDropdownFadeIn 0.15s ease-out"
          }}
        >
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);
            return (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                style={{
                  padding: isSmall ? "6px 10px" : "8px 12px",
                  borderRadius: "6px",
                  fontSize: isSmall ? "12px" : "12.5px",
                  fontWeight: isSelected ? "800" : "600",
                  color: isSelected ? "#047857" : "#334155",
                  background: isSelected ? "#ECFDF5" : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  transition: "background 0.1s ease, color 0.1s ease",
                  marginBottom: "2px"
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "#F8FAFC";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "transparent";
                }}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={14} color="#059669" style={{ flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
