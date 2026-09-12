import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Filter, ArrowUpDown, ChevronDown, Check, X } from "lucide-react";

import CustomSelect from "./CustomSelect";

export default function FilterToolbar({
  filterMode, setFilterMode,
  selectedYear, setSelectedYear,
  selectedMonth, setSelectedMonth,
  selectedDay, setSelectedDay,
  customStart, setCustomStart,
  customEnd, setCustomEnd,
  availableYears,
  sortOrder = "desc", setSortOrder
}) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth <= 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCustom = () => {
    setFilterMode("custom");
    if (!customStart) {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setCustomStart(d.toISOString().split("T")[0]);
    }
    if (!customEnd) {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      setCustomEnd(`${yyyy}-${mm}-${dd}`);
    }
  };

  // NATIVE MOBILE UI
  if (isMobile) {
    return (
      <div className="gl-mobile-filter-container">
        {/* Horizontal Scrollable Segmented Track */}
        <div className="gl-mobile-pill-track">
          {/* Inline Mobile Sort Pill */}
          {setSortOrder && (
            <button
              type="button"
              className="gl-mobile-sort-pill"
              onClick={() => setSortOpen(!sortOpen)}
              style={{ flexShrink: 0 }}
            >
              <ArrowUpDown size={12} color="#059669" />
              <span>{sortOrder === "desc" ? "Newest" : "Oldest"}</span>
              <ChevronDown size={11} color="#64748B" style={{ transform: sortOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }} />
            </button>
          )}

          <button
            className={`gl-mobile-pill ${filterMode === "all" ? "active" : ""}`}
            onClick={() => setFilterMode("all")}
          >
            All Time
          </button>
          <button
            className={`gl-mobile-pill ${filterMode === "year" ? "active" : ""}`}
            onClick={() => setFilterMode("year")}
          >
            Year
          </button>
          <button
            className={`gl-mobile-pill ${filterMode === "month" ? "active" : ""}`}
            onClick={() => setFilterMode("month")}
          >
            Month
          </button>
          <button
            className={`gl-mobile-pill ${filterMode === "day" ? "active" : ""}`}
            onClick={() => setFilterMode("day")}
          >
            Single Day
          </button>
          <button
            className={`gl-mobile-pill ${filterMode === "custom" ? "active" : ""}`}
            onClick={handleSelectCustom}
          >
            Custom
          </button>
        </div>

        {/* Compact Sub-filter Picker Bar (Shown when a filter is active) */}
        {filterMode !== "all" && (
          <div className="gl-mobile-subfilter-box">
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              Filter:
            </span>

            {filterMode === "year" && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <CustomSelect
                  options={availableYears.map((y) => ({ value: String(y), label: String(y) }))}
                  value={selectedYear}
                  onChange={(val) => setSelectedYear(val)}
                  size="sm"
                />
              </div>
            )}

            {filterMode === "month" && (
              <input
                type="month"
                className="gl-select gl-date-input"
                style={{ flex: 1, minWidth: 0 }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            )}

            {filterMode === "day" && (
              <input
                type="date"
                className="gl-select gl-date-input"
                style={{ flex: 1, minWidth: 0 }}
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
              />
            )}

            {filterMode === "custom" && (
              <div style={{ display: "flex", gap: "6px", alignItems: "center", flex: 1, minWidth: 0 }}>
                <input
                  type="date"
                  className="gl-select gl-date-input"
                  style={{ flex: 1, minWidth: 0, padding: "4px 6px" }}
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>to</span>
                <input
                  type="date"
                  className="gl-select gl-date-input"
                  style={{ flex: 1, minWidth: 0, padding: "4px 6px" }}
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setFilterMode("all")}
              style={{
                background: "#F1F5F9",
                border: "none",
                borderRadius: "50%",
                width: 22,
                height: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
                color: "#64748B",
                cursor: "pointer",
                flexShrink: 0
              }}
              title="Clear Filter"
            >
              ✕
            </button>
          </div>
        )}

        {/* Native Mobile Sort Action Sheet Drawer (Portal) */}
        {sortOpen && typeof document !== "undefined" && createPortal(
          <div
            className="gl-modal-overlay"
            onClick={() => setSortOpen(false)}
            style={{ zIndex: 9999999 }}
          >
            <div
              className="gl-modal-card"
              onClick={(e) => e.stopPropagation()}
              style={{
                padding: "16px 20px calc(24px + env(safe-area-inset-bottom, 0px)) 20px",
                borderRadius: "22px 22px 0 0",
                background: "#FFFFFF",
                width: "100%",
                maxWidth: "460px",
                boxShadow: "0 -10px 25px rgba(0,0,0,0.15)"
              }}
            >
              <div className="gl-modal-handle" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ECFDF5", border: "1px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ArrowUpDown size={16} color="#059669" />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>Sort Gold Lots</div>
                    <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>Choose chronological display order</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSortOpen(false)}
                  style={{
                    background: "#F1F5F9",
                    border: "none",
                    borderRadius: "50%",
                    width: 30,
                    height: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748B",
                    cursor: "pointer"
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => { setSortOrder("desc"); setSortOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "13px 16px",
                    borderRadius: 12,
                    border: `1.5px solid ${sortOrder === "desc" ? "#059669" : "#E2E8F0"}`,
                    background: sortOrder === "desc" ? "#ECFDF5" : "#FFFFFF",
                    color: sortOrder === "desc" ? "#047857" : "#0F172A",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>Newest First</div>
                    <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>Most recent transactions on top (Default)</div>
                  </div>
                  {sortOrder === "desc" && <Check size={18} color="#059669" />}
                </button>

                <button
                  type="button"
                  onClick={() => { setSortOrder("asc"); setSortOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "13px 16px",
                    borderRadius: 12,
                    border: `1.5px solid ${sortOrder === "asc" ? "#059669" : "#E2E8F0"}`,
                    background: sortOrder === "asc" ? "#ECFDF5" : "#FFFFFF",
                    color: sortOrder === "asc" ? "#047857" : "#0F172A",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>Oldest First</div>
                    <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>Earliest recorded transactions on top</div>
                  </div>
                  {sortOrder === "asc" && <Check size={18} color="#059669" />}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  // DESKTOP UI
  return (
    <div className="gl-filter-bar" style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Top Header Row: TIME FILTERS (Left) + SORT (Right) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <div className="gl-filter-label" style={{ fontSize: "12px", fontWeight: 800, color: "#059669", display: "flex", alignItems: "center", gap: "6px" }}>
          <Filter size={14} color="#059669" /> TIME FILTERS
        </div>

        {setSortOrder && (
          <div ref={sortRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setSortOpen(!sortOpen)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "5px 12px",
                fontSize: "12px",
                fontWeight: "700",
                color: "#0F172A",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                transition: "all 0.15s ease"
              }}
            >
              <ArrowUpDown size={13} color="#059669" />
              <span>SORT: <strong style={{ color: "#059669" }}>{sortOrder === "desc" ? "Newest First" : "Oldest First"}</strong></span>
              <ChevronDown size={13} color="#64748B" style={{ transform: sortOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }} />
            </button>

            {sortOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 6px)",
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "4px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
                  zIndex: 1000,
                  minWidth: "150px",
                  animation: "glDropdownFadeIn 0.16s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
              >
                <button
                  type="button"
                  onClick={() => { setSortOrder("desc"); setSortOpen(false); }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: sortOrder === "desc" ? "800" : "600",
                    color: sortOrder === "desc" ? "#047857" : "#334155",
                    background: sortOrder === "desc" ? "#ECFDF5" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <span>Newest First</span>
                  {sortOrder === "desc" && <Check size={14} color="#059669" />}
                </button>
                <button
                  type="button"
                  onClick={() => { setSortOrder("asc"); setSortOpen(false); }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: sortOrder === "asc" ? "800" : "600",
                    color: sortOrder === "asc" ? "#047857" : "#334155",
                    background: sortOrder === "asc" ? "#ECFDF5" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <span>Oldest First</span>
                  {sortOrder === "asc" && <Check size={14} color="#059669" />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Filter Option Pills */}
      <div className="gl-no-scrollbar" style={{ display: "flex", gap: "6px", overflowX: "auto", flexWrap: "nowrap", scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch", width: "100%", paddingBottom: "4px", alignItems: "center" }}>
        <button className={`gl-filter-btn ${filterMode === "all" ? "active" : ""}`} onClick={() => setFilterMode("all")}>All Time</button>
        <button className={`gl-filter-btn ${filterMode === "year" ? "active" : ""}`} onClick={() => setFilterMode("year")}>Year</button>
        <button className={`gl-filter-btn ${filterMode === "month" ? "active" : ""}`} onClick={() => setFilterMode("month")}>Month</button>
        <button className={`gl-filter-btn ${filterMode === "day" ? "active" : ""}`} onClick={() => setFilterMode("day")}>Single Day</button>
        <button
          className={`gl-filter-btn ${filterMode === "custom" ? "active" : ""}`}
          onClick={handleSelectCustom}
        >
          Custom
        </button>

        {filterMode === "year" && (
          <CustomSelect
            options={availableYears.map((y) => ({ value: String(y), label: String(y) }))}
            value={selectedYear}
            onChange={(val) => setSelectedYear(val)}
            size="sm"
          />
        )}

        {filterMode === "month" && (
          <input
            type="month"
            className="gl-select gl-date-input"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        )}

        {filterMode === "day" && (
          <input
            type="date"
            className="gl-select gl-date-input"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          />
        )}

        {filterMode === "custom" && (
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
            <input
              type="date"
              className="gl-select gl-date-input"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
            <span style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>to</span>
            <input
              type="date"
              className="gl-select gl-date-input"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
