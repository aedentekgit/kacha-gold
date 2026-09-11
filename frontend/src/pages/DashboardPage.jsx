import React, { useState, useEffect, useMemo } from "react";
import { Sparkles, CheckCircle2, Zap, Plus, ArrowUpRight, TrendingUp, TrendingDown, Trash2, Calendar, Award } from "lucide-react";
import { todayStr, nowTime, inr, uid, fetchGoodReturns22KRate, fmtDate, compareEntriesDesc } from "../utils/goldHelpers";

function fmtCompactINR(val) {
  if (val === null || val === undefined || isNaN(val)) return "—";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : (val > 0 ? "+" : "");
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  }
  return inr(val);
}

export default function DashboardPage({
  latestRate,
  kachaPerGram,
  highMetrics,
  sortedRates,
  rates,
  persistRates,
  totals,
  purchaseCount,
  sellAnalysis,
  goToSignals,
  goToAdd
}) {
  const [board, setBoard] = useState("");
  const [kacha, setKacha] = useState("");
  const [busy, setBusy] = useState(false);
  const [fetchingRate, setFetchingRate] = useState(false);
  const [fetchMsg, setFetchMsg] = useState(null);
  const [showLogs, setShowLogs] = useState(false);

  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth <= 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const todayEntries = useMemo(() => {
    return (rates || [])
      .filter((r) => r.date === todayStr())
      .sort(compareEntriesDesc);
  }, [rates]);

  useEffect(() => {
    autoFetchRate();
  }, []);

  const autoFetchRate = async () => {
    setFetchingRate(true);
    setFetchMsg(null);
    const res = await fetchGoodReturns22KRate();
    setFetchingRate(false);
    if (res.success && res.rate) {
      setBoard(res.rate.toString());
    }
  };

  const submitRate = async () => {
    if (!board || !kacha) return;
    setBusy(true);
    const entry = {
      id: uid("rate"), date: todayStr(), time: nowTime(),
      board: parseFloat(board), kacha: parseFloat(kacha), createdAt: Date.now(),
      userLogged: true
    };
    await persistRates([...rates, entry]);
    setBoard(""); setKacha("");
    setBusy(false);
  };

  const deleteRateEntry = async (id) => {
    const next = rates.filter((r) => r.id !== id);
    await persistRates(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "14px" : "20px", paddingTop: isMobile ? 4 : 8 }}>
      {/* 1. Active Market Rates Banner */}
      {latestRate && (
        <div
          className="gl-card"
          style={{
            margin: 0,
            padding: isMobile ? "14px 16px" : "16px 24px",
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 14,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
          }}
        >
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={16} color="#059669" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", letterSpacing: "0.2px" }}>
                    Market Rates Active
                  </span>
                </div>
                <span style={{ background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A", fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
                  {fmtDate(latestRate.date)}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, background: "#F8FAFC", padding: "10px 14px", borderRadius: 10, border: "1px solid #F1F5F9" }}>
                <div>
                  <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Board (22K)</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#D97706", marginTop: 2 }}>{inr(latestRate.board)}<span style={{ fontSize: 11, color: "#94A3B8" }}>/g</span></div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Kacha Rate</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#059669", marginTop: 2 }}>{inr(kachaPerGram)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle2 size={18} color="#059669" />
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: "#0F172A", letterSpacing: "0.2px" }}>
                    Market Rates Active
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 18, background: "#F8FAFC", padding: "8px 18px", borderRadius: 10, border: "1px solid #F1F5F9" }}>
                  <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>
                    Board (22K): <strong style={{ color: "#D97706", fontWeight: 800, fontSize: 14.5 }}>{inr(latestRate.board)}/g</strong>
                  </span>
                  <span style={{ color: "#CBD5E1" }}>|</span>
                  <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>
                    Kacha: <strong style={{ color: "#059669", fontWeight: 800, fontSize: 14.5 }}>{inr(kachaPerGram)}</strong>
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A", fontSize: 11.5, padding: "4px 10px", borderRadius: 6, fontWeight: 700 }}>
                  {fmtDate(latestRate.date)}
                </span>
                {(!sellAnalysis || sellAnalysis.strongSellCount === 0) && (
                  <button
                    className="gl-btn"
                    onClick={goToSignals}
                    style={{
                      padding: "8px 16px",
                      fontSize: 13,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <Sparkles size={14} /> Check Sell Signals <ArrowUpRight size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Compact Minimal Sell Signal Alert Banner */}
      {sellAnalysis && sellAnalysis.strongSellCount > 0 && (
        <div
          onClick={goToSignals}
          style={{
            background: "linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)",
            border: "1px solid #A7F3D0",
            borderRadius: 14,
            padding: isMobile ? "12px 14px" : "14px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(5, 150, 105, 0.06)",
            transition: "transform 0.15s ease"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Sparkles size={16} color="#059669" />
            </div>
            <span style={{ fontSize: isMobile ? 13 : 14.5, fontWeight: 800, color: "#065F46", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {sellAnalysis.strongSellCount} Lots Ready to Sell ({sellAnalysis.strongSellGrams.toFixed(2)}g)
            </span>
          </div>

          <button
            className="gl-btn"
            onClick={(e) => {
              e.stopPropagation();
              goToSignals();
            }}
            style={{
              padding: isMobile ? "6px 12px" : "8px 16px",
              fontSize: isMobile ? 12 : 13,
              borderRadius: 8,
              whiteSpace: "nowrap",
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 4
            }}
          >
            View Signals <ArrowUpRight size={14} />
          </button>
        </div>
      )}

      {/* 3. Dual Cards Grid */}
      <div className="gl-grid2" style={{ gap: isMobile ? "14px" : "20px" }}>
        {/* Market Rate Entry Card */}
        <div className="gl-card" style={{ padding: isMobile ? "18px 16px" : "24px 26px", margin: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 14 : 20, gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div className="gl-section-title" style={{ margin: 0, fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "#0F172A" }}>
                  Daily Market Rate
                </div>
                {latestRate && (
                  <div style={{ fontSize: isMobile ? 11.5 : 12.5, color: "#059669", fontWeight: 700, marginTop: 2 }}>
                    Active: {inr(kachaPerGram)}
                  </div>
                )}
              </div>

              <button
                className="gl-btn-ghost gl-btn-sm"
                onClick={autoFetchRate}
                disabled={fetchingRate}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, fontSize: isMobile ? 11.5 : 12.5, padding: isMobile ? "6px 10px" : "6px 14px", flexShrink: 0 }}
              >
                <Zap size={13} className={fetchingRate ? "gl-spin" : ""} color="#059669" />
                {fetchingRate ? "Fetching…" : "Auto-Fetch 22K"}
              </button>
            </div>

            {/* Side-by-Side Inputs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: isMobile ? "12px" : "16px", marginBottom: isMobile ? 16 : 22 }}>
              <div>
                <label className="gl-input-label" style={{ fontSize: isMobile ? 11.5 : 12, marginBottom: 6, fontWeight: 700, color: "#475569" }}>Board Rate (₹/g, 22K)</label>
                <input className="gl-input" type="number" inputMode="decimal" placeholder="Auto-fetched" value={board} onChange={(e) => setBoard(e.target.value)} style={{ fontSize: isMobile ? 14.5 : 15, padding: isMobile ? "10px 12px" : "10px 14px", fontWeight: 700 }} />
              </div>
              <div>
                <label className="gl-input-label" style={{ fontSize: isMobile ? 11.5 : 12, marginBottom: 6, fontWeight: 700, color: "#475569" }}>Kacha Rate (₹)</label>
                <input className="gl-input" type="number" inputMode="decimal" placeholder="Enter Kacha" value={kacha} onChange={(e) => setKacha(e.target.value)} style={{ fontSize: isMobile ? 14.5 : 15, padding: isMobile ? "10px 12px" : "10px 14px", fontWeight: 700 }} />
              </div>
            </div>
          </div>

          <div>
            <button className="gl-btn" onClick={submitRate} disabled={!board || !kacha || busy} style={{ width: "100%", justifyContent: "center", padding: isMobile ? "11px 14px" : "12px 18px", fontSize: isMobile ? 13.5 : 14.5, fontWeight: 700 }}>
              <Plus size={16} /> Save Today's Market Rate
            </button>

            {/* Today's Log History Collapsible */}
            {todayEntries.length > 0 && (
              <div style={{ marginTop: isMobile ? 14 : 18, borderTop: "1px dashed #E2E8F0", paddingTop: isMobile ? 10 : 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: isMobile ? 11 : 11.5, color: "#64748B", fontWeight: 700, letterSpacing: "0.4px" }}>TODAY'S LOG HISTORY ({todayEntries.length})</span>
                  <button className="gl-btn-ghost gl-btn-sm" onClick={() => setShowLogs(!showLogs)} style={{ fontSize: isMobile ? 11 : 11.5, padding: "3px 8px" }}>
                    {showLogs ? "Hide History" : "View Today's Logs"}
                  </button>
                </div>

                {showLogs && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8, maxHeight: 180, overflowY: "auto" }}>
                    {todayEntries.map((e) => (
                      <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "8px 12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8 }}>
                        <span style={{ fontWeight: 700, color: "#0F172A" }}>{e.time}</span>
                        <span>Board <strong style={{ color: "#D97706" }}>{inr(e.board)}</strong> · Kacha <strong style={{ color: "#059669" }}>{inr(e.kacha)}</strong></span>
                        <button className="gl-btn-ghost gl-btn-sm" onClick={() => deleteRateEntry(e.id)} style={{ padding: "2px 6px", color: "#DC2626", borderColor: "#FCA5A5", background: "#FEF2F2" }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Summary Card */}
        <div className="gl-card" style={{ padding: isMobile ? "18px 16px" : "24px 26px", margin: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="gl-section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 14 : 20 }}>
              <span style={{ margin: 0, fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "#0F172A" }}>Portfolio Summary</span>
              <button className="gl-btn-ghost gl-btn-sm" onClick={goToAdd} style={{ fontSize: isMobile ? 12 : 12.5, padding: isMobile ? "5px 10px" : "6px 14px" }}>
                + Add Gold
              </button>
            </div>

            {/* 2x2 Grid of Key Portfolio Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: isMobile ? "12px" : "14px", marginBottom: isMobile ? 16 : 22 }}>
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: isMobile ? "12px 14px" : "14px 16px" }}>
                <div style={{ fontSize: isMobile ? 10.5 : 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Holdings</div>
                <div style={{ fontSize: isMobile ? 18 : 24, color: "#D97706", fontWeight: 800, marginTop: 4 }}>
                  {totals.totalGrams.toFixed(2)} <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700 }}>g</span>
                </div>
              </div>

              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: isMobile ? "12px 14px" : "14px 16px" }}>
                <div style={{ fontSize: isMobile ? 10.5 : 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Avg Buy Price</div>
                <div style={{ fontSize: isMobile ? 18 : 24, color: "#0F172A", fontWeight: 800, marginTop: 4 }}>
                  {totals.avgRate ? inr(totals.avgRate) : "—"}
                </div>
              </div>

              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: isMobile ? "12px 14px" : "14px 16px" }}>
                <div style={{ fontSize: isMobile ? 10.5 : 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Total Invested</div>
                <div style={{ fontSize: isMobile ? 15 : 20, color: "#0F172A", fontWeight: 800, marginTop: 4 }}>
                  {isMobile ? fmtCompactINR(totals.totalInvested) : inr(totals.totalInvested)}
                </div>
              </div>

              <div style={{ background: totals.unrealized >= 0 ? "#ECFDF5" : "#FEF2F2", border: `1px solid ${totals.unrealized >= 0 ? "#A7F3D0" : "#FCA5A5"}`, borderRadius: 10, padding: isMobile ? "12px 14px" : "14px 16px" }}>
                <div style={{ fontSize: isMobile ? 10.5 : 11, color: totals.unrealized >= 0 ? "#047857" : "#B91C1C", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Unrealized P/L</div>
                <div style={{ fontSize: isMobile ? 15 : 20, color: totals.unrealized >= 0 ? "#059669" : "#DC2626", fontWeight: 800, marginTop: 4 }}>
                  {totals.unrealized !== null ? (isMobile ? fmtCompactINR(totals.unrealized) : `${totals.unrealized >= 0 ? "+" : ""}${inr(totals.unrealized)} (${totals.profitPercent.toFixed(1)}%)`) : "—"}
                </div>
              </div>
            </div>
          </div>

          <button className="gl-btn" onClick={goToSignals} style={{ padding: isMobile ? "11px 14px" : "12px 18px", fontSize: isMobile ? 13.5 : 14.5, width: "100%", justifyContent: "center" }}>
            <Sparkles size={16} /> Review Sell Signals Engine <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
