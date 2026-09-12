import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Target, Sliders, ArrowUpRight, TrendingDown, TrendingUp, Save, Check, Coins, Sparkles, ChevronRight, Info } from "lucide-react";
import { inr, fmtDate, compareEntriesDesc, compareEntriesAsc } from "../utils/goldHelpers";
import TablePagination from "../components/TablePagination";
import CustomSelect from "../components/CustomSelect";
import EmptyState from "../components/EmptyState";

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
    }
    if (persistTarget) {
      persistTarget(targetProfit, num);
    }
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const items = useMemo(() => {
    if (!purchases || !purchases.length) return [];
    const list = purchases.map((p) => {
      const pk = p.purchaseKacha !== undefined && p.purchaseKacha !== null ? p.purchaseKacha : (p.kachaAtPurchase || p.ratePaid || activeSellRate);
      const ak = p.activeKacha !== undefined && p.activeKacha !== null ? p.activeKacha : activeSellRate;
      const margin = ak - pk;
      const marginPct = pk > 0 ? (margin / pk) * 100 : 0;
      const itemProfit = Math.round(margin * p.grams);

      let status = "HOLD";
      if (marginPct >= targetProfitPct) {
        status = "STRONG_SELL";
      } else if (margin > 0) {
        status = "MODERATE_SELL";
      }

      return {
        ...p,
        purchaseKacha: pk,
        activeKacha: ak,
        margin,
        marginPct,
        itemProfit,
        status
      };
    });

    return sortOrder === "asc" ? list.sort(compareEntriesAsc) : list.sort(compareEntriesDesc);
  }, [purchases, activeSellRate, targetProfitPct, sortOrder]);

  const totalHoldingsGrams = useMemo(() => {
    return purchases.reduce((sum, p) => sum + (p.grams || 0), 0);
  }, [purchases]);

  const totalSellProfit = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.itemProfit || 0), 0);
  }, [items]);

  const sellableItems = useMemo(() => {
    return items.filter((x) => x.status === "STRONG_SELL" || x.status === "MODERATE_SELL");
  }, [items]);

  const paginatedItems = useMemo(() => {
    if (pageSize === "all") return items;
    const ps = parseInt(pageSize) || 25;
    const start = (currentPage - 1) * ps;
    return items.slice(start, start + ps);
  }, [items, pageSize, currentPage]);

  const navigate = useNavigate();

  if (!purchases.length) {
    return (
      <EmptyState
        icon={Target}
        iconColor="#059669"
        iconBg="linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)"
        badge="Intelligent Sell Advice"
        title="No Gold Lots to Evaluate"
        subtitle="Record your gold purchases to get live sell advice, lot-by-lot profit margins, and automated sell signals based on your target profit margin."
        primaryAction={{
          label: "Add Your First Gold Lot",
          onClick: () => navigate("/add")
        }}
        secondaryAction={{
          label: "Go to Kacha Update",
          onClick: () => navigate("/dashboard")
        }}
        showHighlights={false}
      />
    );
  }

  if (!kachaPerGram) {
    return (
      <EmptyState
        icon={Sliders}
        iconColor="#B45309"
        iconBg="linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)"
        badge="Market Rate Required"
        title="Active Kacha Rate Needed"
        subtitle="Please log today's market Kacha rate on Kacha Update to calculate sell recommendations and benchmark targets."
        primaryAction={{
          label: "Go to Kacha Update",
          onClick: () => navigate("/dashboard")
        }}
        showHighlights={false}
      />
    );
  }

  return (
    <div>
      {/* 1. Target Profit % Selector Control Panel */}
      {isMobile ? (
        <div className="gl-mobile-target-bar">
          <div className="gl-mobile-target-header">
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Target size={16} color="#059669" />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>
                Target Margin: <strong style={{ color: "#059669" }}>{targetProfitPct}%</strong>
              </span>
              {savedNotice && (
                <span style={{ fontSize: 11, fontWeight: 800, color: "#059669", display: "inline-flex", alignItems: "center", gap: 2 }}>
                  <Check size={12} /> Saved!
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#F8FAFC", padding: "2px 8px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
              <Sliders size={12} color="#64748B" />
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={targetProfitPct}
                onChange={(e) => handleSavePct(e.target.value)}
                style={{
                  width: 40,
                  padding: "2px 2px",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#059669",
                  border: "none",
                  textAlign: "center",
                  background: "transparent",
                  outline: "none"
                }}
              />
              <span style={{ fontSize: 11, fontWeight: 800, color: "#047857" }}>%</span>
            </div>
          </div>

          {/* 5 Quick-Tap Preset Chips */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
            {[2, 5, 10, 15, 20].map((pct) => (
              <button
                key={pct}
                onClick={() => handleSavePct(pct)}
                className={`gl-mobile-pill ${targetProfitPct === pct ? "active" : ""}`}
                style={{ flex: 1, padding: "5px 0", fontSize: 12, fontWeight: 800 }}
              >
                +{pct}%
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div
          className="gl-card"
          style={{
            marginBottom: 16,
            padding: "18px 24px",
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 14,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
          }}
        >
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
        </div>
      )}

      {/* 2. Portfolio Metrics: Mobile Hero Card vs Desktop Strip */}
      {isMobile ? (
        <div className="gl-mobile-hero-card">
          {/* Top Hero Profit Stat */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Target Realizable Profit
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: totalSellProfit >= 0 ? "#10B981" : "#F87171", marginTop: 2, letterSpacing: "-0.5px" }}>
                {totalSellProfit >= 0 ? "+" : ""}{inr(totalSellProfit)}
              </div>
            </div>

            <div style={{
              background: sellAnalysis && sellAnalysis.strongSellCount > 0 ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.1)",
              color: sellAnalysis && sellAnalysis.strongSellCount > 0 ? "#34D399" : "#E2E8F0",
              border: `1px solid ${sellAnalysis && sellAnalysis.strongSellCount > 0 ? "rgba(52, 211, 153, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
              padding: "4px 10px",
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: 4
            }}>
              <Sparkles size={12} />
              {sellAnalysis ? sellAnalysis.strongSellCount : 0} of {purchases.length} Ready
            </div>
          </div>

          {/* 3 Core Micro-Metrics */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            padding: "10px 0",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
          }}>
            <div style={{ cursor: "pointer" }} onClick={() => onOpenKachaHistory && onOpenKachaHistory(null)}>
              <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Active Kacha</div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#34D399", marginTop: 2 }}>{inr(kachaPerGram)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Holdings</div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#FBBF24", marginTop: 2 }}>{totalHoldingsGrams.toFixed(2)} g</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Target Met</div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#FFFFFF", marginTop: 2 }}>{sellAnalysis ? sellAnalysis.strongSellCount : 0} / {purchases.length}</div>
            </div>
          </div>

          {/* Benchmark Highs Strip */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 10,
            gap: 6,
            fontSize: 11,
            fontWeight: 700
          }}>
            <div
              onClick={() => onOpenKachaHistory && onOpenKachaHistory(null)}
              style={{ flex: 1, background: "rgba(255, 255, 255, 0.06)", padding: "5px 6px", borderRadius: 8, textAlign: "center", cursor: "pointer" }}
            >
              <span style={{ color: "#94A3B8", fontSize: 9.5 }}>7D HIGH </span>
              <span style={{ color: "#34D399" }}>{highMetrics && highMetrics.high7Day ? inr(highMetrics.high7Day) : "—"}</span>
            </div>
            <div
              onClick={() => onOpenKachaHistory && onOpenKachaHistory(null)}
              style={{ flex: 1, background: "rgba(255, 255, 255, 0.06)", padding: "5px 6px", borderRadius: 8, textAlign: "center", cursor: "pointer" }}
            >
              <span style={{ color: "#94A3B8", fontSize: 9.5 }}>30D HIGH </span>
              <span style={{ color: "#60A5FA" }}>{highMetrics && highMetrics.highMonthly ? inr(highMetrics.highMonthly) : "—"}</span>
            </div>
            <div
              onClick={() => onOpenKachaHistory && onOpenKachaHistory(null)}
              style={{ flex: 1, background: "rgba(255, 255, 255, 0.06)", padding: "5px 6px", borderRadius: 8, textAlign: "center", cursor: "pointer" }}
            >
              <span style={{ color: "#94A3B8", fontSize: 9.5 }}>52W HIGH </span>
              <span style={{ color: "#FBBF24" }}>{highMetrics && highMetrics.high52Week ? inr(highMetrics.high52Week) : "—"}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="gl-filter-bar" style={{ marginBottom: 16, background: "#FFFFFF", border: "1px solid #E2E8F0", padding: "16px 20px" }}>
          <div className="gl-hero-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px", width: "100%" }}>
            <div style={{ padding: "12px 14px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, textAlign: "center", cursor: "pointer" }} onClick={() => onOpenKachaHistory && onOpenKachaHistory(null)}>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Active Kacha</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#059669", marginTop: 4 }}>{inr(kachaPerGram)}</div>
            </div>
            <div style={{ padding: "12px 14px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Total Holdings</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#D97706", marginTop: 4 }}>{totalHoldingsGrams.toFixed(2)} g</div>
            </div>
            <div style={{ padding: "12px 14px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Lots Meeting Target</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#059669", marginTop: 4 }}>{sellAnalysis ? sellAnalysis.strongSellCount : 0} / {purchases.length}</div>
            </div>
            <div style={{ padding: "12px 14px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Target Realizable Profit</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: totalSellProfit >= 0 ? "#059669" : "#DC2626", marginTop: 4 }}>{totalSellProfit >= 0 ? "+" : ""}{inr(totalSellProfit)}</div>
            </div>
            <div style={{ padding: "12px 14px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8, textAlign: "center", cursor: "pointer" }} onClick={() => onOpenKachaHistory && onOpenKachaHistory(null)}>
              <div style={{ fontSize: 11, color: "#047857", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>7-Day High</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#059669", marginTop: 4 }}>{highMetrics && highMetrics.high7Day ? inr(highMetrics.high7Day) : "—"}</div>
            </div>
            <div style={{ padding: "12px 14px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, textAlign: "center", cursor: "pointer" }} onClick={() => onOpenKachaHistory && onOpenKachaHistory(null)}>
              <div style={{ fontSize: 11, color: "#1E40AF", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Monthly High</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#2563EB", marginTop: 4 }}>{highMetrics && highMetrics.highMonthly ? inr(highMetrics.highMonthly) : "—"}</div>
            </div>
            <div style={{ padding: "12px 14px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, textAlign: "center", cursor: "pointer" }} onClick={() => onOpenKachaHistory && onOpenKachaHistory(null)}>
              <div style={{ fontSize: 11, color: "#92400E", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>52-Week High</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#D97706", marginTop: 4 }}>{highMetrics && highMetrics.high52Week ? inr(highMetrics.high52Week) : "—"}</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Gold Lots Section */}
      <div className={isMobile ? "" : "gl-card"} style={isMobile ? { marginTop: 4 } : { padding: "20px 24px", borderRadius: 16 }}>
        <div className={isMobile ? "" : "gl-section-title"} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: isMobile ? "0 2px" : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: isMobile ? 16 : 16, fontWeight: 800, color: "#0F172A" }}>Gold Lots & Sell Signals</span>
            <span style={{ background: "#ECFDF5", color: "#047857", padding: "2px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 800, border: "1px solid #A7F3D0" }}>
              {items.length}
            </span>
          </div>

          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>EVALUATED LOT-BY-LOT</span>
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
          )}
        </div>

        {/* Desktop Table View */}
        <div className="gl-desktop-table-wrap gl-table-wrapper">
          <table className="gl-table">
            <thead>
              <tr style={{ cursor: "pointer" }} onClick={() => onOpenKachaHistory && onOpenKachaHistory(null)} title="Click to view overall portfolio rate history">
                <th>Date</th>
                <th>Item & Weight</th>
                <th>Purchased Kacha</th>
                <th>Current Kacha</th>
                <th>Kacha Diff</th>
                <th>Lot P/L</th>
                <th>Sell Indication</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => {
                const pk = item.purchaseKacha !== undefined && item.purchaseKacha !== null ? item.purchaseKacha : (item.kachaAtPurchase || item.ratePaid || activeSellRate);
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
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {item.status === "STRONG_SELL" ? (
                          <span
                            className="gl-badge sell-strong"
                            style={{
                              background: "#059669",
                              color: "#FFFFFF",
                              border: "1px solid transparent",
                              fontWeight: 800,
                              padding: "0 12px",
                              height: "28px",
                              width: "175px",
                              fontSize: "12px",
                              borderRadius: 8,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                              boxSizing: "border-box",
                              flexShrink: 0
                            }}
                          >
                            <ArrowUpRight size={14} style={{ flexShrink: 0 }} /> SELL NOW (≥{targetProfitPct}%)
                          </span>
                        ) : item.status === "MODERATE_SELL" ? (
                          <span
                            className="gl-badge"
                            style={{
                              background: "#FFFBEB",
                              color: "#B45309",
                              border: "1px solid #FDE68A",
                              fontWeight: 800,
                              padding: "0 12px",
                              height: "28px",
                              width: "175px",
                              fontSize: "12px",
                              borderRadius: 8,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                              boxSizing: "border-box",
                              flexShrink: 0
                            }}
                          >
                            <ArrowUpRight size={14} style={{ flexShrink: 0 }} /> GAIN (&lt;{targetProfitPct}%)
                          </span>
                        ) : (
                          <span
                            className="gl-badge sell-hold"
                            style={{
                              background: "#FEF2F2",
                              color: "#DC2626",
                              border: "1px solid #FCA5A5",
                              fontWeight: 800,
                              padding: "0 12px",
                              height: "28px",
                              width: "175px",
                              fontSize: "12px",
                              borderRadius: 8,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                              boxSizing: "border-box",
                              flexShrink: 0
                            }}
                          >
                            <TrendingDown size={14} style={{ flexShrink: 0 }} /> HOLD (NO GAIN)
                          </span>
                        )}
                        <button
                          type="button"
                          className="gl-btn-ghost gl-btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSold && onToggleSold(item.id);
                          }}
                          style={{
                            color: "#DC2626",
                            borderColor: "#FCA5A5",
                            background: "#FEF2F2",
                            fontWeight: 800,
                            padding: "0 10px",
                            height: "28px",
                            minWidth: "52px",
                            fontSize: "11.5px",
                            borderRadius: 6,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            cursor: "pointer",
                            boxSizing: "border-box"
                          }}
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

        {/* Native Mobile Trade Cards List */}
        <div className="gl-mobile-cards-list">
          {paginatedItems.map((item) => {
            const pk = item.purchaseKacha !== undefined && item.purchaseKacha !== null ? item.purchaseKacha : (item.kachaAtPurchase || item.ratePaid || activeSellRate);
            const ak = item.activeKacha !== undefined && item.activeKacha !== null ? item.activeKacha : activeSellRate;

            return (
              <div
                key={item.id}
                className="gl-mobile-trade-card"
                onClick={() => onOpenKachaHistory && onOpenKachaHistory(item)}
                style={{ cursor: "pointer" }}
              >
                {/* Top Row: Weight + Badges */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{item.grams.toFixed(2)} g</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B" }}>
                        • {fmtDate(item.date)}
                      </span>
                    </div>
                    {item.notes ? (
                      <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600, marginTop: 2 }}>{item.notes}</div>
                    ) : (
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Gold Lot</div>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {item.status === "STRONG_SELL" ? (
                      <span className="gl-badge sell-strong" style={{ background: "#059669", color: "#FFFFFF", border: "none", fontWeight: 800, padding: "5px 10px", fontSize: "11px", borderRadius: 9999 }}>
                        <ArrowUpRight size={12} /> SELL NOW
                      </span>
                    ) : item.status === "MODERATE_SELL" ? (
                      <span className="gl-badge" style={{ background: "#FEF3C7", color: "#B45309", border: "1px solid #FDE68A", fontWeight: 800, padding: "4px 8px", fontSize: "11px", borderRadius: 9999 }}>
                        <ArrowUpRight size={12} /> GAIN
                      </span>
                    ) : (
                      <span className="gl-badge sell-hold" style={{ background: "#F1F5F9", color: "#64748B", border: "1px solid #E2E8F0", padding: "4px 8px", fontSize: "11px", borderRadius: 9999 }}>
                        <TrendingDown size={12} /> HOLD
                      </span>
                    )}

                    <button
                      type="button"
                      className="gl-btn-ghost gl-btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSold && onToggleSold(item.id);
                      }}
                      style={{
                        color: "#DC2626",
                        borderColor: "#FECACA",
                        background: "#FEF2F2",
                        fontWeight: 800,
                        padding: "5px 10px",
                        fontSize: "11.5px",
                        borderRadius: 8
                      }}
                    >
                      Sold
                    </button>
                  </div>
                </div>

                {/* 2-Column Comparison Bar */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  background: "#F8FAFC",
                  border: "1px solid #F1F5F9",
                  borderRadius: 12,
                  padding: "10px 12px"
                }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Bought Rate</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>{pk ? inr(pk) : "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Current Rate</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#059669", marginTop: 2 }}>{ak ? inr(ak) : "—"}</div>
                  </div>
                </div>

                {/* Bottom Profit Highlight Bar */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  background: item.itemProfit >= 0 ? "#ECFDF5" : "#FEF2F2",
                  border: `1px solid ${item.itemProfit >= 0 ? "#A7F3D0" : "#FCA5A5"}`,
                  borderRadius: 10
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>Margin:</span>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: item.margin >= 0 ? "#047857" : "#DC2626" }}>
                      {item.margin >= 0 ? "+" : ""}{inr(item.margin)}/g
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>Lot P/L:</span>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: item.itemProfit >= 0 ? "#047857" : "#DC2626" }}>
                      {item.itemProfit >= 0 ? "+" : ""}{inr(item.itemProfit)} ({item.marginPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination & Show-per-page for Mobile */}
        <div style={{ marginTop: 12 }}>
          {isMobile && items.length > 25 && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
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
          )}

          <TablePagination
            totalItems={items.length}
            pageSize={pageSize}
            setPageSize={setPageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
