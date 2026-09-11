import React, { useState, useEffect, useMemo } from "react";
import { X, Clock, Filter } from "lucide-react";
import { inr, fmtDate, getEntryTimestamp } from "../utils/goldHelpers";

const fmtCompactINR = (val) => {
  if (val === undefined || val === null || val === 0) return "₹0";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : (val > 0 ? "+" : "");
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)}k`;
  }
  return `${sign}₹${Math.round(abs)}`;
};

export default function KachaHistoryModal({ isOpen, onClose, sortedRates = [], purchases = [], totals, selectedItem = null }) {
  const [timeFilter, setTimeFilter] = useState("30d"); // '7d', '30d', '1y', 'all'
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth <= 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset filter to '30d' (1 Month) whenever a selectedItem is opened
  useEffect(() => {
    if (isOpen) {
      setTimeFilter("30d");
    }
  }, [isOpen, selectedItem]);

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

  const { buyKacha, lotGrams } = useMemo(() => {
    if (selectedItem) {
      const bKacha = selectedItem.purchaseKacha !== undefined && selectedItem.purchaseKacha !== null
        ? selectedItem.purchaseKacha
        : (selectedItem.kachaAtPurchase || selectedItem.ratePaid || 0);
      return { buyKacha: bKacha, lotGrams: selectedItem.grams || 0 };
    }

    let avgK = totals && totals.avgKacha ? totals.avgKacha : 0;
    if (!avgK && purchases && purchases.length) {
      const valid = purchases.filter((p) => p.kachaAtPurchase || p.ratePaid);
      if (valid.length) {
        avgK = valid.reduce((s, p) => s + (p.kachaAtPurchase || p.ratePaid || 0), 0) / valid.length;
      }
    }
    const tGrams = totals ? totals.totalGrams : (purchases ? purchases.reduce((s, p) => s + p.grams, 0) : 0);
    return { buyKacha: avgK, lotGrams: tGrams };
  }, [selectedItem, purchases, totals]);

  // Full sorted rates (newest first)
  const fullSortedRates = useMemo(() => {
    if (!sortedRates || !sortedRates.length) return [];
    return [...sortedRates].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [sortedRates]);

  const filteredLogs = useMemo(() => {
    if (!fullSortedRates.length) return [];

    let base = [...fullSortedRates];

    // Filter to only include rates recorded ON or AFTER the purchase time if selectedItem is present
    if (selectedItem) {
      const purchaseTs = getEntryTimestamp(selectedItem);
      if (purchaseTs > 0) {
        base = base.filter((r) => {
          const rTs = getEntryTimestamp(r);
          return rTs >= purchaseTs;
        });
      } else if (selectedItem.date) {
        base = base.filter((r) => r.date >= selectedItem.date);
      }
    }

    if (timeFilter !== "all") {
      const now = new Date();
      const cutoff = new Date();
      if (timeFilter === "7d") {
        cutoff.setDate(now.getDate() - 7);
      } else if (timeFilter === "30d") {
        cutoff.setDate(now.getDate() - 30);
      } else if (timeFilter === "1y") {
        cutoff.setFullYear(now.getFullYear() - 1);
      }

      const year = cutoff.getFullYear();
      const month = String(cutoff.getMonth() + 1).padStart(2, "0");
      const day = String(cutoff.getDate()).padStart(2, "0");
      const cutoffStr = `${year}-${month}-${day}`;

      base = base.filter((r) => r.date >= cutoffStr);
    }

    return base;
  }, [fullSortedRates, selectedItem, timeFilter]);

  const { displayLogs, boughtEntryId } = useMemo(() => {
    if (!selectedItem) {
      return { displayLogs: filteredLogs, boughtEntryId: null };
    }

    // Check if there is an existing rate matching the purchase date and buyKacha
    const sameDateMatches = filteredLogs.filter(
      (r) => r.date === selectedItem.date && Math.round(r.kacha || 0) === Math.round(buyKacha)
    );

    if (sameDateMatches.length > 0) {
      // Pick the single oldest matching entry on that day as the purchase anchor
      const targetId = sameDateMatches[sameDateMatches.length - 1].id;
      return { displayLogs: filteredLogs, boughtEntryId: targetId };
    }

    // If no matching rate in log equals buyKacha, append a baseline purchase entry at the bottom
    if (buyKacha) {
      const baselineEntry = {
        id: `purchase-base-${selectedItem.id || "lot"}`,
        date: selectedItem.date,
        time: selectedItem.time || "",
        kacha: buyKacha,
        isBaselinePurchase: true
      };
      return { displayLogs: [...filteredLogs, baselineEntry], boughtEntryId: baselineEntry.id };
    }

    return { displayLogs: filteredLogs, boughtEntryId: null };
  }, [filteredLogs, selectedItem, buyKacha]);

  if (!isOpen) return null;

  return (
    <div
      className="gl-modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100dvh",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 16,
        paddingBottom: isMobile ? "calc(6px + env(safe-area-inset-bottom, 0px))" : 16,
        zIndex: 10005,
        overscrollBehavior: "contain"
      }}
    >
      <div
        className="gl-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: isMobile ? "100%" : 820,
          width: "100%",
          borderTopLeftRadius: isMobile ? 16 : 6,
          borderTopRightRadius: isMobile ? 16 : 6,
          borderBottomLeftRadius: isMobile ? 0 : 6,
          borderBottomRightRadius: isMobile ? 0 : 6,
          padding: isMobile ? "14px 12px calc(14px + env(safe-area-inset-bottom, 0px)) 12px" : "22px",
          maxHeight: isMobile ? "85dvh" : "90dvh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "#FFFFFF",
          boxShadow: "0 -10px 30px rgba(0,0,0,0.35)",
          boxSizing: "border-box"
        }}
      >
        {/* Mobile App Bottom Sheet Handle */}
        {isMobile && (
          <div style={{ width: 42, height: 4.5, background: "#CBD5E1", borderRadius: 3, margin: "0 auto 10px auto", flexShrink: 0 }} />
        )}

        {/* Header & Close Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, borderBottom: "1px solid #E2E8F0", paddingBottom: 8, gap: 8, flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? 14 : 17, fontWeight: 900, color: "#0F172A", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", lineHeight: 1.3 }}>
              <Clock color="#107C41" size={isMobile ? 16 : 19} style={{ flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: isMobile ? "nowrap" : "normal", display: "inline-block", maxWidth: isMobile ? "210px" : "100%" }}>
                {selectedItem ? (selectedItem.notes || `${selectedItem.grams}g Gold Lot`) : "Overall Portfolio"}
              </span>
              <span style={{ fontSize: isMobile ? 11.5 : 13, color: "#64748B", fontWeight: 700 }}>Rate History</span>
            </div>
            <div style={{ fontSize: isMobile ? 10.5 : 12, color: "#334155", marginTop: 4, fontWeight: 700, background: "#F1F5F9", padding: "2px 8px", borderRadius: 4, display: "inline-block" }}>
              {selectedItem
                ? `Bought: ${selectedItem.grams.toFixed(2)}g @ ${inr(buyKacha)} on ${fmtDate(selectedItem.date)}`
                : `Combined holdings: ${lotGrams.toFixed(2)}g`}
            </div>
          </div>
          <button className="gl-btn-ghost gl-btn-sm" onClick={onClose} style={{ padding: "4px 8px", color: "#64748B", flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Time Filters Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6, flexShrink: 0 }}>
          <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 800, color: "#334155", display: "flex", alignItems: "center", gap: 4 }}>
            <Filter size={12} color="#107C41" /> Period:
          </div>
          <div style={{ display: "flex", gap: 3, background: "#F1F5F9", padding: "3px", borderRadius: 6, border: "1px solid #CBD5E1" }}>
            {["7d", "30d", "1y", "all"].map((tf) => (
              <button
                key={tf}
                className="gl-btn-ghost gl-btn-sm"
                onClick={() => setTimeFilter(tf)}
                style={{
                  background: timeFilter === tf ? "#107C41" : "transparent",
                  color: timeFilter === tf ? "#FFFFFF" : "#334155",
                  fontWeight: 800,
                  fontSize: isMobile ? 11 : 11.5,
                  padding: isMobile ? "3px 9px" : "4px 10px",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
              >
                {tf === "7d" ? "1W" : tf === "30d" ? "1M" : tf === "1y" ? "1Y" : "All"}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile View: Modern Mobile App Timeline Feed Cards */}
        {isMobile ? (
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 2, overscrollBehavior: "contain" }}>
            {displayLogs.map((entry, idx) => {
              const isBoughtEntry = entry.id === boughtEntryId || entry.isBaselinePurchase;
              const kachaVal = entry.kacha || 0;

              let diff = 0;
              let diffPct = 0;
              let lotPL = 0;
              let lotPLPct = 0;

              if (selectedItem) {
                if (isBoughtEntry) {
                  diff = 0;
                  diffPct = 0;
                  lotPL = 0;
                  lotPLPct = 0;
                } else {
                  diff = kachaVal - buyKacha;
                  diffPct = buyKacha > 0 ? (diff / buyKacha) * 100 : 0;
                  lotPL = diff * lotGrams;
                  lotPLPct = diffPct;
                }
              } else {
                let prev = displayLogs[idx + 1];
                if (!prev) {
                  const fullIdx = fullSortedRates.findIndex((r) => r.id === entry.id);
                  if (fullIdx !== -1 && fullIdx + 1 < fullSortedRates.length) {
                    prev = fullSortedRates[fullIdx + 1];
                  }
                }
                const benchmarkKacha = prev && prev.kacha ? prev.kacha : null;
                diff = benchmarkKacha ? kachaVal - benchmarkKacha : 0;
                diffPct = benchmarkKacha && benchmarkKacha > 0 ? (diff / benchmarkKacha) * 100 : 0;
                lotPL = diff * lotGrams;
                lotPLPct = diffPct;
              }

              return (
                <div
                  key={entry.id || idx}
                  style={{
                    background: isBoughtEntry ? "#F0FDF4" : "#F8FAFC",
                    border: `1.5px solid ${isBoughtEntry ? "#86EFAC" : "#CBD5E1"}`,
                    borderLeft: `5px solid ${isBoughtEntry ? "#107C41" : (diff > 0 ? "#15803D" : diff < 0 ? "#DC2626" : "#94A3B8")}`,
                    borderRadius: 8,
                    padding: "12px 14px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                  }}
                >
                  {/* Top Row: Date + Time + Bought Badge & Active Kacha Rate */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13.5, fontWeight: 900, color: "#0F172A" }}>{fmtDate(entry.date)}</span>
                      {entry.time && (
                        <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>{entry.time}</span>
                      )}
                      {isBoughtEntry && (
                        <span style={{ color: "#166534", fontSize: 10, background: "#DCFCE7", border: "1px solid #86EFAC", padding: "1px 6px", borderRadius: 4, fontWeight: 900 }}>
                          BOUGHT
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: "#107C41" }}>
                      {kachaVal ? inr(kachaVal) : "—"}
                    </div>
                  </div>

                  {/* Bottom Row: 2-Column Metrics */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: "#FFFFFF", padding: "8px 10px", borderRadius: 6, border: "1px solid #E2E8F0" }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#64748B", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {selectedItem ? "Change vs Buy" : "Rate Change"}
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 900, color: diff > 0 ? "#15803D" : diff < 0 ? "#DC2626" : "#64748B", marginTop: 2 }}>
                        {isBoughtEntry ? "—" : (diff !== 0 ? `${diff > 0 ? "+" : ""}${inr(diff)} (${diff > 0 ? "+" : ""}${diffPct.toFixed(1)}%)` : "—")}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 10, color: "#64748B", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {selectedItem ? "Lot Profit / Loss" : "Daily Portfolio P/L"}
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 900, color: lotPL > 0 ? "#15803D" : lotPL < 0 ? "#DC2626" : "#475569", marginTop: 2 }}>
                        {isBoughtEntry ? "₹0 (0.0%)" : (lotPL !== 0 ? `${lotPL > 0 ? "+" : ""}${inr(lotPL)} (${lotPL > 0 ? "+" : ""}${lotPLPct.toFixed(1)}%)` : "₹0 (0.0%)")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop View: Classic Table */
          <div className="gl-table-wrapper" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "auto", overscrollBehavior: "contain" }}>
            <table className="gl-table" style={{ width: "100%", tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={{ padding: "10px 12px", fontSize: 13, whiteSpace: "nowrap" }}>Date</th>
                  <th style={{ padding: "10px 12px", fontSize: 13, whiteSpace: "nowrap" }}>Kacha Rate</th>
                  <th style={{ padding: "10px 12px", fontSize: 13, whiteSpace: "nowrap" }}>
                    {selectedItem ? "Change vs Buy" : "Rate Change"}
                  </th>
                  <th style={{ padding: "10px 12px", fontSize: 13, whiteSpace: "nowrap" }}>
                    {selectedItem ? "Lot Profit / Loss" : "Daily Portfolio P/L"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayLogs.map((entry, idx) => {
                  const isBoughtEntry = entry.id === boughtEntryId || entry.isBaselinePurchase;
                  const kachaVal = entry.kacha || 0;

                  let diff = 0;
                  let diffPct = 0;
                  let lotPL = 0;
                  let lotPLPct = 0;

                  if (selectedItem) {
                    if (isBoughtEntry) {
                      diff = 0;
                      diffPct = 0;
                      lotPL = 0;
                      lotPLPct = 0;
                    } else {
                      diff = kachaVal - buyKacha;
                      diffPct = buyKacha > 0 ? (diff / buyKacha) * 100 : 0;
                      lotPL = diff * lotGrams;
                      lotPLPct = diffPct;
                    }
                  } else {
                    let prev = displayLogs[idx + 1];
                    if (!prev) {
                      const fullIdx = fullSortedRates.findIndex((r) => r.id === entry.id);
                      if (fullIdx !== -1 && fullIdx + 1 < fullSortedRates.length) {
                        prev = fullSortedRates[fullIdx + 1];
                      }
                    }
                    const benchmarkKacha = prev && prev.kacha ? prev.kacha : null;
                    diff = benchmarkKacha ? kachaVal - benchmarkKacha : 0;
                    diffPct = benchmarkKacha && benchmarkKacha > 0 ? (diff / benchmarkKacha) * 100 : 0;
                    lotPL = diff * lotGrams;
                    lotPLPct = diffPct;
                  }

                  return (
                    <tr
                      key={entry.id || idx}
                      style={{ background: isBoughtEntry ? "#F0FDF4" : "transparent" }}
                    >
                      <td style={{ fontWeight: 800, color: "#0F172A", fontSize: 14, padding: "10px 12px", whiteSpace: "nowrap" }}>
                        <span>{fmtDate(entry.date)}</span>
                        {entry.time && (
                          <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, marginLeft: 6 }}>
                            {entry.time}
                          </span>
                        )}
                        {isBoughtEntry && (
                          <span style={{ color: "#166534", fontSize: 10, background: "#DCFCE7", border: "1px solid #86EFAC", padding: "1px 6px", borderRadius: 4, marginLeft: 6, fontWeight: 900 }}>
                            BOUGHT
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 900, color: "#107C41", fontSize: 15, padding: "10px 12px", whiteSpace: "nowrap" }}>
                        {kachaVal ? inr(kachaVal) : "—"}
                      </td>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        {isBoughtEntry ? (
                          <span style={{ color: "#94A3B8", fontSize: 14 }}>—</span>
                        ) : diff !== 0 ? (
                          <span style={{ color: diff > 0 ? "#15803D" : "#B91C1C", fontWeight: 900, fontSize: 14 }}>
                            {(diff > 0 ? "+" : "") + inr(diff)} ({diff > 0 ? "+" : ""}{diffPct.toFixed(1)}%)
                          </span>
                        ) : (
                          <span style={{ color: "#94A3B8", fontSize: 14 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        {isBoughtEntry ? (
                          <span style={{ color: "#475569", fontWeight: 900, fontSize: 14.5 }}>₹0 (0.0%)</span>
                        ) : lotPL !== 0 ? (
                          <span style={{ color: lotPL > 0 ? "#15803D" : "#B91C1C", fontWeight: 900, fontSize: 14.5 }}>
                            {(lotPL > 0 ? "+" : "") + inr(lotPL)} ({lotPL > 0 ? "+" : ""}{lotPLPct.toFixed(1)}%)
                          </span>
                        ) : (
                          <span style={{ color: "#475569", fontWeight: 900, fontSize: 14.5 }}>₹0 (0.0%)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
