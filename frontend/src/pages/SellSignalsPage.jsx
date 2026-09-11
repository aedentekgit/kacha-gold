import React, { useState, useEffect, useMemo } from "react";
import { Target, Sliders, ArrowUpRight, TrendingDown, TrendingUp, Save, Check } from "lucide-react";
import { inr, fmtDate, compareEntriesDesc, compareEntriesAsc } from "../utils/goldHelpers";
import TablePagination from "../components/TablePagination";
import CustomSelect from "../components/CustomSelect";

export default function SellSignalsPage({ sellAnalysis, targetProfit, targetProfitPct = 5, setTargetProfitPct, persistTarget, kachaPerGram, highMetrics, purchases, rateForDate, totals, sortedRates = [], onOpenKachaHistory, sortOrder = "desc", onToggleSold }) {
  const [pageSize, setPageSize] = useState("25");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth <= 640);
  const [savedNotice, setSavedNotice] = useState(false);
  const activeSellRate = kachaPerGram;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSavePct = (val) => {
    const num = Math.max(0, parseFloat(val) || 0);
    if (setTargetProfitPct) {
      setTargetProfitPct(num);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    }
  };

  const rawItems = sellAnalysis ? sellAnalysis.items : [];
  const activePurchaseIds = useMemo(() => new Set(purchases.map(p => p.id)), [purchases]);
  const items = useMemo(() => {
    const filtered = rawItems.filter(i => activePurchaseIds.has(i.id));
    return [...filtered].sort(sortOrder === "asc" ? compareEntriesAsc : compareEntriesDesc);
  }, [rawItems, activePurchaseIds, sortOrder]);
  const sellableItems = useMemo(() => items.filter((i) => i.status === "STRONG_SELL"), [items]);
  const totalSellProfit = useMemo(() => items.reduce((s, i) => s + i.itemProfit, 0), [items]);

  const totalHoldingsGrams = useMemo(() => purchases.reduce((s, p) => s + (p.grams || 0), 0), [purchases]);

  const paginatedItems = useMemo(() => {
    if (pageSize === "all") return items;
    const ps = parseInt(pageSize) || 25;
    const start = (currentPage - 1) * ps;
    return items.slice(start, start + ps);
  }, [items, pageSize, currentPage]);

  if (!purchases.length) {
    return <div className="gl-empty">No purchases logged yet. Add gold purchases to receive sell recommendations.</div>;
  }

  if (!kachaPerGram) {
    return (
      <div className="gl-card">
        <div className="gl-section-title">Sell Signal Engine</div>
        <p style={{ color: "#78716C", fontSize: 14 }}>
          Please log today's market Kacha rate on the Dashboard to calculate sell recommendations.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Target Profit % Selector Control Panel */}
      <div
        className="gl-card"
        style={{
          marginBottom: 16,
          padding: isMobile ? "14px 16px" : "18px 24px",
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 14,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}
      >
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Header: Title + Custom Input Pill on Right */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "#ECFDF5", border: "1px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Target size={15} color="#059669" />
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>Target Profit Margin</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#F8FAFC", padding: "3px 8px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                  <Sliders size={13} color="#64748B" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={targetProfitPct}
                    onChange={(e) => setTargetProfitPct && setTargetProfitPct(e.target.value)}
                    style={{
                      width: 44,
                      padding: "2px 4px",
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#059669",
                      border: "1.5px solid #059669",
                      borderRadius: 6,
                      textAlign: "center",
                      background: "#FFFFFF",
                      outline: "none"
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#047857" }}>%</span>
                </div>
                <button
                  className="gl-btn"
                  onClick={() => handleSavePct(targetProfitPct)}
                  style={{
                    padding: "4px 10px",
                    fontSize: 11.5,
                    borderRadius: 8,
                    background: savedNotice ? "#ECFDF5" : "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    color: savedNotice ? "#047857" : "#FFFFFF",
                    border: savedNotice ? "1px solid #A7F3D0" : "none",
                    boxShadow: savedNotice ? "none" : "0 2px 6px rgba(5, 150, 105, 0.2)"
                  }}
                >
                  {savedNotice ? <Check size={13} /> : <Save size={13} />}
                  {savedNotice ? "Saved!" : "Save"}
                </button>
              </div>
            </div>

            {/* 5-Column Grid for Preset Pills */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
              {[2, 5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  onClick={() => handleSavePct(pct)}
                  style={{
                    background: targetProfitPct === pct ? "#059669" : "#F8FAFC",
                    color: targetProfitPct === pct ? "#FFFFFF" : "#475569",
                    border: `1px solid ${targetProfitPct === pct ? "#047857" : "#E2E8F0"}`,
                    borderRadius: 8,
                    padding: "6px 2px",
                    fontSize: 12,
                    fontWeight: 800,
                    textAlign: "center",
                    cursor: "pointer",
                    boxShadow: targetProfitPct === pct ? "0 2px 6px rgba(5, 150, 105, 0.2)" : "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  +{pct}%
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ECFDF5", border: "1px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Target size={17} color="#059669" />
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.2px" }}>
                  Target Profit Margin
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {[2, 5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => handleSavePct(pct)}
                    style={{
                      background: targetProfitPct === pct ? "#059669" : "#F8FAFC",
                      color: targetProfitPct === pct ? "#FFFFFF" : "#475569",
                      border: `1px solid ${targetProfitPct === pct ? "#047857" : "#E2E8F0"}`,
                      borderRadius: 8,
                      padding: "6px 14px",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: targetProfitPct === pct ? "0 2px 6px rgba(5, 150, 105, 0.2)" : "none",
                      transition: "all 0.15s ease"
                    }}
                  >
                    +{pct}%
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", padding: "6px 14px", borderRadius: 10, border: "1px solid #E2E8F0" }}>
              <Sliders size={14} color="#64748B" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Custom Target:</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={targetProfitPct}
                onChange={(e) => setTargetProfitPct && setTargetProfitPct(e.target.value)}
                style={{
                  width: 58,
                  padding: "4px 8px",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#059669",
                  border: "1.5px solid #059669",
                  borderRadius: 6,
                  textAlign: "center",
                  background: "#FFFFFF",
                  outline: "none"
                }}
              />
              <span style={{ fontSize: 12.5, fontWeight: 800, color: "#047857" }}>%</span>

              <button
                className="gl-btn"
                onClick={() => handleSavePct(targetProfitPct)}
                style={{
                  padding: "5px 12px",
                  fontSize: 12,
                  borderRadius: 8,
                  background: savedNotice ? "#ECFDF5" : "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  color: savedNotice ? "#047857" : "#FFFFFF",
                  border: savedNotice ? "1px solid #A7F3D0" : "none",
                  boxShadow: savedNotice ? "none" : "0 2px 6px rgba(5, 150, 105, 0.2)",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5
                }}
              >
                {savedNotice ? <Check size={14} /> : <Save size={14} />}
                {savedNotice ? "Saved to DB!" : "Save Target"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Metric Strip Cards */}
      <div className="gl-filter-bar" style={{ marginBottom: 16, background: "#FFFFFF", border: "1px solid #E2E8F0", padding: isMobile ? "12px 10px" : "16px 20px" }}>
        <div className="gl-hero-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(7, 1fr)", gap: isMobile ? "8px" : "12px", width: "100%" }}>
          {/* Row 1 */}
          <div style={{ padding: isMobile ? "10px 6px" : "12px 14px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, textAlign: "center", cursor: "pointer" }} onClick={() => onOpenKachaHistory && onOpenKachaHistory(null)}>
            <div style={{ fontSize: isMobile ? 9.5 : 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Active Kacha</div>
            <div style={{ fontSize: isMobile ? 13 : 16, fontWeight: 800, color: "#059669", marginTop: 4 }}>{inr(kachaPerGram)}</div>
          </div>
          <div style={{ padding: isMobile ? "10px 6px" : "12px 14px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: isMobile ? 9.5 : 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Total Holdings</div>
            <div style={{ fontSize: isMobile ? 13 : 16, fontWeight: 800, color: "#D97706", marginTop: 4 }}>{totalHoldingsGrams.toFixed(2)} g</div>
          </div>
          <div style={{ padding: isMobile ? "10px 6px" : "12px 14px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: isMobile ? 9.5 : 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Lots Meeting Target</div>
            <div style={{ fontSize: isMobile ? 13 : 16, fontWeight: 800, color: "#059669", marginTop: 4 }}>{sellAnalysis ? sellAnalysis.strongSellCount : 0} / {purchases.length}</div>
          </div>

          {/* Row 2: Target Realizable Profit */}
          <div style={{ padding: isMobile ? "10px 6px" : "12px 14px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, textAlign: "center", gridColumn: isMobile ? "span 3" : "auto" }}>
            <div style={{ fontSize: isMobile ? 9.5 : 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Target Realizable Profit</div>
            <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: totalSellProfit >= 0 ? "#059669" : "#DC2626", marginTop: 4 }}>{totalSellProfit >= 0 ? "+" : ""}{inr(totalSellProfit)}</div>
          </div>

          {/* Row 3: All 3 High Rates Benchmark Strip Cards */}
          <div style={{ padding: isMobile ? "10px 6px" : "12px 14px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8, textAlign: "center", cursor: "pointer" }} onClick={() => onOpenKachaHistory && onOpenKachaHistory(null)}>
            <div style={{ fontSize: isMobile ? 9.5 : 11, color: "#047857", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>7-Day High</div>
            <div style={{ fontSize: isMobile ? 13 : 16, fontWeight: 800, color: "#059669", marginTop: 4 }}>{highMetrics && highMetrics.high7Day ? inr(highMetrics.high7Day) : "—"}</div>
          </div>
          <div style={{ padding: isMobile ? "10px 6px" : "12px 14px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, textAlign: "center", cursor: "pointer" }} onClick={() => onOpenKachaHistory && onOpenKachaHistory(null)}>
            <div style={{ fontSize: isMobile ? 9.5 : 11, color: "#1E40AF", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Monthly High</div>
            <div style={{ fontSize: isMobile ? 13 : 16, fontWeight: 800, color: "#2563EB", marginTop: 4 }}>{highMetrics && highMetrics.highMonthly ? inr(highMetrics.highMonthly) : "—"}</div>
          </div>
          <div style={{ padding: isMobile ? "10px 6px" : "12px 14px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, textAlign: "center", cursor: "pointer" }} onClick={() => onOpenKachaHistory && onOpenKachaHistory(null)}>
            <div style={{ fontSize: isMobile ? 9.5 : 11, color: "#92400E", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>52-Week High</div>
            <div style={{ fontSize: isMobile ? 13 : 16, fontWeight: 800, color: "#D97706", marginTop: 4 }}>{highMetrics && highMetrics.high52Week ? inr(highMetrics.high52Week) : "—"}</div>
          </div>
        </div>
      </div>

      <div className="gl-card">
        <div className="gl-section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <span>Individual Purchase Sell Indications</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>EVALUATED LOT-BY-LOT</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569" }}>
              <CustomSelect
                prefix="Show:"
                options={[
                  { value: "25", label: "25 per page" },
                  { value: "50", label: "50 per page" },
                  { value: "100", label: "100 per page" },
                  { value: "all", label: `Show All (${items.length})` }
                ]}
                value={pageSize}
                onChange={(val) => {
                  setPageSize(val);
                  setCurrentPage(1);
                }}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="gl-desktop-table-wrap gl-table-wrapper">
          <table className="gl-table">
            <thead>
              <tr style={{ cursor: "pointer" }} onClick={() => onOpenKachaHistory && onOpenKachaHistory(null)} title="Click to view overall portfolio rate history">
                <th>Date</th>
                <th>Item & Weight</th>
                <th>Previous Kacha</th>
                <th>Current Kacha</th>
                <th>Kacha Diff</th>
                <th>Lot P/L</th>
                <th>Sell Indication</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => {
                const pk = item.purchaseKacha !== undefined && item.purchaseKacha !== null ? item.purchaseKacha : (item.kachaAtPurchase || activeSellRate);
                const ak = item.activeKacha !== undefined && item.activeKacha !== null ? item.activeKacha : activeSellRate;

                return (
                  <tr key={item.id} style={{ cursor: "pointer" }} onClick={() => onOpenKachaHistory && onOpenKachaHistory(item)} title={`Click to view day-by-day P/L for ${item.grams}g lot`}>
                    <td style={{ fontWeight: 800, color: "#0F172A", fontSize: "14px" }}>{fmtDate(item.date)}</td>
                    <td>
                      <div style={{ fontWeight: 800, color: "#D97706", fontSize: "14px" }}>{item.grams.toFixed(2)} grams</div>
                      {item.notes ? (
                        <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>{item.notes}</div>
                      ) : (
                        <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600 }}>—</div>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: "#0F172A", fontSize: "14px" }}>
                      {pk ? inr(pk) : "—"}
                    </td>
                    <td style={{ fontWeight: 700, color: "#0F172A", fontSize: "14px" }}>{ak ? inr(ak) : "—"}</td>
                    <td>
                      <span style={{ color: item.margin >= 0 ? "#059669" : "#DC2626", fontWeight: 800, fontSize: "14px" }}>
                        {item.margin >= 0 ? "+" : ""}{inr(item.margin)}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: item.itemProfit >= 0 ? "#059669" : "#DC2626", fontWeight: 800, fontSize: "14px" }}>
                        {item.itemProfit >= 0 ? "+" : ""}{inr(item.itemProfit)} ({item.marginPct.toFixed(1)}%)
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {item.status === "STRONG_SELL" ? (
                          <span className="gl-badge sell-strong" style={{ background: "#059669", color: "#FFFFFF", border: "none", fontWeight: 800, padding: "5px 12px", fontSize: "12px", borderRadius: 8 }}>
                            <ArrowUpRight size={14} /> SELL NOW (≥{targetProfitPct}%)
                          </span>
                        ) : item.status === "MODERATE_SELL" ? (
                          <span className="gl-badge" style={{ background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A", fontWeight: 800, padding: "5px 12px", fontSize: "12px", borderRadius: 8 }}>
                            <ArrowUpRight size={14} /> GAIN (&lt;{targetProfitPct}%)
                          </span>
                        ) : (
                          <span className="gl-badge sell-hold" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5", fontWeight: 800, padding: "5px 12px", fontSize: "12px", borderRadius: 8 }}>
                            <TrendingDown size={14} /> HOLD (NO GAIN)
                          </span>
                        )}
                        <button
                          className="gl-btn-ghost gl-btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSold && onToggleSold(item.id);
                          }}
                          style={{ color: "#DC2626", borderColor: "#FCA5A5", background: "#FEF2F2", fontWeight: 800, padding: "4px 10px", fontSize: "11.5px", borderRadius: 6 }}
                          title="Mark lot as Sold (removes from Sell Signals)"
                        >
                          Sold
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="gl-excel-total-row" style={{ cursor: "pointer" }} onClick={() => onOpenKachaHistory && onOpenKachaHistory(null)} title="Click to view overall portfolio rate history">
                <td colSpan={2} style={{ fontWeight: 800, textTransform: "uppercase" }}>TOTAL SUMMARY ({items.length} LOTS)</td>
                <td>—</td>
                <td>{kachaPerGram ? inr(kachaPerGram) : "—"}</td>
                <td>—</td>
                <td style={{ fontWeight: 800, color: totalSellProfit >= 0 ? "#059669" : "#DC2626" }}>
                  {totalSellProfit >= 0 ? "+" : ""}{inr(totalSellProfit)}
                </td>
                <td>
                  <span className="gl-badge" style={{ background: sellableItems.length > 0 ? "#059669" : "#64748B", color: "#FFFFFF", fontWeight: 800, fontSize: "12px", borderRadius: 6 }}>
                    {sellableItems.length} PROFITABLE LOTS READY
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile View Card List */}
        <div className="gl-mobile-cards-list">
          {paginatedItems.map((item) => {
            const pk = item.purchaseKacha !== undefined && item.purchaseKacha !== null ? item.purchaseKacha : (item.kachaAtPurchase || activeSellRate);
            const ak = item.activeKacha !== undefined && item.activeKacha !== null ? item.activeKacha : activeSellRate;

            return (
              <div key={item.id} className="gl-mobile-card" style={{ cursor: "pointer" }} onClick={() => onOpenKachaHistory && onOpenKachaHistory(item)}>
                <div className="gl-mobile-card-header">
                  <div>
                    <div style={{ fontSize: 11, color: "#78716C", fontWeight: 600 }}>{fmtDate(item.date)}</div>
                    <div style={{ fontWeight: 700, color: "#B8860B" }}>{item.grams.toFixed(2)} grams</div>
                    {item.notes && <div style={{ fontSize: 12, color: "#475569", fontWeight: 700 }}>{item.notes}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {item.status === "STRONG_SELL" ? (
                      <span className="gl-badge sell-strong" style={{ background: "#059669", color: "#FFFFFF", border: "none", fontWeight: 800, padding: "4px 10px", fontSize: "11.5px", borderRadius: 8 }}>
                        <ArrowUpRight size={13} /> SELL NOW
                      </span>
                    ) : item.status === "MODERATE_SELL" ? (
                      <span className="gl-badge" style={{ background: "#FEF3C7", color: "#B45309", border: "1px solid #FDE68A", fontWeight: 900 }}>
                        <ArrowUpRight size={13} /> GAIN
                      </span>
                    ) : (
                      <span className="gl-badge sell-hold">
                        <TrendingDown size={13} /> HOLD
                      </span>
                    )}
                    <button
                      className="gl-btn-ghost gl-btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSold && onToggleSold(item.id);
                      }}
                      style={{ color: "#DC2626", borderColor: "#FCA5A5", background: "#FEF2F2", fontWeight: 800, padding: "4px 10px", fontSize: "11.5px", borderRadius: 8 }}
                    >
                      Sold
                    </button>
                  </div>
                </div>

                <div className="gl-mobile-card-row">
                  <span className="gl-label">Previous Kacha:</span>
                  <span className="gl-value">{pk ? inr(pk) : "—"}</span>
                </div>
                <div className="gl-mobile-card-row">
                  <span className="gl-label">Current Kacha:</span>
                  <span className="gl-value">{ak ? inr(ak) : "—"}</span>
                </div>
                <div className="gl-mobile-card-row" style={{ borderTop: "1px dashed #E8DFD1", paddingTop: 6, marginTop: 4 }}>
                  <span className="gl-label">Kacha Diff:</span>
                  <span style={{ color: item.margin >= 0 ? "#047857" : "#B91C1C", fontWeight: 700, fontSize: 14 }}>
                    {item.margin >= 0 ? "+" : ""}{inr(item.margin)}
                  </span>
                </div>
                <div className="gl-mobile-card-row">
                  <span className="gl-label">Total Lot P/L:</span>
                  <span style={{ color: item.itemProfit >= 0 ? "#047857" : "#B91C1C", fontWeight: 700, fontSize: 14 }}>
                    {item.itemProfit >= 0 ? "+" : ""}{inr(item.itemProfit)} ({item.marginPct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <TablePagination
          totalItems={items.length}
          pageSize={pageSize}
          setPageSize={setPageSize}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>
    </div>
  );
}
