import React, { useState, useRef, useEffect } from "react";
import { Filter, ArrowUpDown, ChevronDown, Check } from "lucide-react";

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          onClick={() => {
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
          }}
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
