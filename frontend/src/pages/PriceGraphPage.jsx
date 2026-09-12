import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from "recharts";
import {
  inr,
  fmtDate,
  compareEntriesAsc,
  formatCleanTime,
  formatShortDate,
  formatFullDisplayDate
} from "../utils/goldHelpers";
import {
  TrendingUp,
  TrendingDown,
  LineChart,
  BarChart2,
  Plus
} from "lucide-react";
import EmptyState from "../components/EmptyState";

const CustomXAxisTick = ({ x, y, payload, isMobile }) => {
  if (!payload || payload.value == null) return null;
  const rawValue = String(payload.value);
  const parts = rawValue.split("__SEP__");
  const topText = parts[0];
  const bottomText = parts.length > 1 ? parts[1] : "";

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        textAnchor="middle"
        fill="#475569"
        fontSize={isMobile ? 9.5 : 11}
        fontWeight={700}
      >
        <tspan x={0} dy={14}>{topText}</tspan>
        {bottomText ? (
          <tspan
            x={0}
            dy={13}
            fontSize={isMobile ? 8.5 : 9.5}
            fill="#94A3B8"
            fontWeight={600}
          >
            {bottomText}
          </tspan>
        ) : null}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isUp = data.movement === "up";
    const isDown = data.movement === "down";

    return (
      <div style={{
        background: "#0F172A",
        border: "1.5px solid #334155",
        borderRadius: 8,
        padding: "12px 16px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: 700,
        minWidth: 210
      }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8", marginBottom: 8, borderBottom: "1px solid #1E293B", paddingBottom: 6 }}>
          {data.label}
        </div>

        {data.kachaRate ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <span style={{ color: "#E2E8F0" }}>Market Kacha:</span>
            <strong style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 800, fontFamily: "'Manrope', sans-serif" }}>
              {inr(data.kachaRate)}
            </strong>
          </div>
        ) : null}

        {data.prevRate ? (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
            <span style={{ color: "#94A3B8" }}>Previous Rate:</span>
            <span style={{ color: "#CBD5E1", fontWeight: 700 }}>{inr(data.prevRate)}</span>
          </div>
        ) : null}

        {data.movement !== "initial" && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginTop: 6,
            paddingTop: 6,
            borderTop: "1px dashed #334155"
          }}>
            <span style={{ color: "#94A3B8" }}>Rate Movement:</span>
            <span style={{
              color: isUp ? "#10B981" : (isDown ? "#EF4444" : "#94A3B8"),
              fontWeight: 800,
              fontSize: 12.5,
              display: "inline-flex",
              alignItems: "center",
              gap: 3
            }}>
              {isUp && "▲ +"}
              {isDown && "▼ "}
              {inr(data.rateDiff)} ({data.rateDiffPct >= 0 ? "+" : ""}{data.rateDiffPct.toFixed(2)}%)
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function PriceGraphPage({ sortedRates, purchases, totals, targetProfit, kachaPerGram, sortOrder = "desc", filterMode = "all" }) {
  const [timeRange, setTimeRange] = useState("7d");
  const [chartType, setChartType] = useState("candle"); // 'candle' (Candlesticks) by default
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth <= 640);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Compute available years from rate & purchase history
  const availableYears = useMemo(() => {
    const years = new Set();
    years.add(new Date().getFullYear().toString());
    (sortedRates || []).forEach((r) => r.date && years.add(r.date.slice(0, 4)));
    (purchases || []).forEach((p) => p.date && years.add(p.date.slice(0, 4)));
    return Array.from(years).sort().reverse();
  }, [sortedRates, purchases]);

  // Ensure rates are sorted chronologically (oldest first)
  const chronologicalRates = useMemo(() => {
    if (!sortedRates || !sortedRates.length) return [];
    return [...sortedRates].sort(compareEntriesAsc);
  }, [sortedRates]);

  // Filter rates by selected timeframe / monthwise / yearwise
  const processedRates = useMemo(() => {
    if (!chronologicalRates || !chronologicalRates.length) return [];
    if (timeRange === "all") return chronologicalRates;

    const now = new Date();
    const cutoff = new Date();
    if (timeRange === "1d") {
      cutoff.setDate(now.getDate() - 1);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      return chronologicalRates.filter((r) => r.date >= cutoffStr);
    } else if (timeRange === "7d") {
      cutoff.setDate(now.getDate() - 7);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      return chronologicalRates.filter((r) => r.date >= cutoffStr);
    } else if (timeRange === "30d") {
      cutoff.setDate(now.getDate() - 30);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      return chronologicalRates.filter((r) => r.date >= cutoffStr);
    } else if (timeRange === "1y") {
      cutoff.setFullYear(now.getFullYear() - 1);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      return chronologicalRates.filter((r) => r.date >= cutoffStr);
    } else if (timeRange === "month") {
      return chronologicalRates.filter((r) => r.date && r.date.startsWith(selectedMonth));
    } else if (timeRange === "year") {
      return chronologicalRates.filter((r) => r.date && r.date.startsWith(selectedYear));
    }
    return chronologicalRates;
  }, [chronologicalRates, timeRange, selectedMonth, selectedYear]);

  // Compute Up/Down movements and chart metrics
  const { chartData, yMin, yMax, currentPrice, priceChange, priceChangePct, stats } = useMemo(() => {
    if (!processedRates || !processedRates.length) {
      return {
        chartData: [],
        yMin: 120000,
        yMax: 170000,
        currentPrice: 0,
        priceChange: 0,
        priceChangePct: 0,
        stats: { open: 0, high: 0, low: 0, close: 0, upCount: 0, downCount: 0, spread: 0 }
      };
    }

    let globalMin = Infinity;
    let globalMax = -Infinity;

    const uniqueDates = new Set(processedRates.map((r) => r.date));
    const isSingleDay = uniqueDates.size === 1;
    const hasMultipleSameDay = uniqueDates.size < processedRates.length;

    const firstYear = processedRates[0]?.date?.slice(0, 4);
    const lastYear = processedRates[processedRates.length - 1]?.date?.slice(0, 4);
    const spansMultipleYears = Boolean(firstYear && lastYear && firstYear !== lastYear);

    let upCount = 0;
    let downCount = 0;
    let equalCount = 0;

    const data = processedRates.map((r, idx) => {
      const dateStr = r.date;
      const close = r.kacha && r.kacha > 0 ? Math.round(r.kacha) : 0;

      const prevEntry = idx > 0 ? processedRates[idx - 1] : null;
      const prevClose = prevEntry && prevEntry.kacha ? Math.round(prevEntry.kacha) : null;
      const open = prevClose !== null ? prevClose : close;

      const rateDiff = prevClose !== null ? close - prevClose : 0;
      const rateDiffPct = prevClose ? ((close - prevClose) / prevClose) * 100 : 0;

      let movement = "initial";
      if (prevClose !== null) {
        if (close > prevClose) {
          movement = "up";
          upCount++;
        } else if (close < prevClose) {
          movement = "down";
          downCount++;
        } else {
          movement = "equal";
          equalCount++;
        }
      }

      const datePart = formatShortDate(dateStr, spansMultipleYears);
      const cleanTime = formatCleanTime(r.time || "");

      // For Tooltip: Full, crystal-clear timestamp
      let fullLabel = formatFullDisplayDate(dateStr);
      if (cleanTime) {
        fullLabel = `${fullLabel} • ${cleanTime}`;
      }

      // Format X-axis tick intelligently:
      // If single day: show the time directly (e.g. 2:20 PM)
      // If multiple updates on same day: two-tier tick with date on top and time below
      // If regular daily records: show clean human-readable date (e.g. 11 Sep)
      let shortLabel = datePart;
      if (isSingleDay) {
        shortLabel = cleanTime || datePart;
      } else if (hasMultipleSameDay && cleanTime) {
        shortLabel = `${datePart}__SEP__${cleanTime}`;
      } else {
        shortLabel = datePart;
      }

      // Realistic slender candlestick wicks
      const spread = Math.abs(close - open) * 0.3 || 400;
      const high = Math.max(open, close) + Math.round(spread * 0.5);
      const low = Math.min(open, close) - Math.round(spread * 0.5);

      [open, close, high, low].forEach((v) => {
        if (v && v > 50000) {
          if (v < globalMin) globalMin = v;
          if (v > globalMax) globalMax = v;
        }
      });

      const isGreen = close >= open;

      return {
        id: r.id || `${dateStr}-${idx}`,
        label: fullLabel,
        shortLabel,
        date: dateStr,
        time: cleanTime,
        datePart,
        cleanTime,
        kachaRate: close,
        prevRate: prevClose,
        rateDiff,
        rateDiffPct,
        movement,
        open,
        high,
        low,
        close,
        candleBody: [Math.min(open, close), Math.max(open, close)],
        isGreen
      };
    });

    const firstPrice = data.length ? data[0].close : 0;
    const lastPrice = data.length ? data[data.length - 1].close : 0;
    const diff = lastPrice - firstPrice;
    const pct = firstPrice ? (diff / firstPrice) * 100 : 0;

    const lower = isFinite(globalMin) ? Math.max(0, Math.floor(globalMin - 2000)) : 130000;
    const upper = isFinite(globalMax) ? Math.ceil(globalMax + 2000) : 165000;

    const statsObj = {
      open: data.length ? data[0].open : 0,
      high: isFinite(globalMax) ? globalMax : 0,
      low: isFinite(globalMin) ? globalMin : 0,
      close: lastPrice,
      upCount,
      downCount,
      equalCount,
      spread: isFinite(globalMax) && isFinite(globalMin) ? globalMax - globalMin : 0
    };

    // Charts always display chronologically from left (oldest) to right (newest)
    const finalChartData = data;

    return {
      chartData: finalChartData,
      yMin: lower,
      yMax: upper,
      currentPrice: lastPrice,
      priceChange: diff,
      priceChangePct: pct,
      stats: statsObj
    };
  }, [processedRates]);

  const navigate = useNavigate();

  if (!sortedRates.length) {
    return (
      <EmptyState
        icon={LineChart}
        iconColor="#2563EB"
        iconBg="linear-gradient(135deg, #EFF6FF 0%, #BFDBFE 100%)"
        badge="Price Graph & Analytics"
        title="No Rate History Recorded Yet"
        subtitle="Log daily Board and Kacha rates on Kacha Update to track real-time price graphs and purchase milestones."
        primaryAction={{
          label: "Log Market Rate",
          icon: Plus,
          onClick: () => navigate("/dashboard")
        }}
        showHighlights={false}
      />
    );
  }

  const isPositive = priceChange >= 0;
  const themeColor = isPositive ? "#00B386" : "#FF5253";

  return (
    <div
      className="gl-card gl-chart-card-wrap"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 480,
        marginBottom: 0,
        padding: isMobile ? "12px 10px" : "18px 20px",
        background: "#FFFFFF"
      }}
    >
      {/* Header Stat & Controls Bar */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "flex-start",
          gap: isMobile ? 12 : 16,
          marginBottom: 12,
          borderBottom: "1px solid #F1F5F9",
          paddingBottom: 12
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: isMobile ? 11 : 13,
                fontWeight: 800,
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              GOLD KACHA MARKET PRICE
            </span>
            <span
              style={{
                fontSize: 10,
                background: "#ECFDF5",
                color: "#059669",
                border: "1px solid #A7F3D0",
                padding: "1px 6px",
                borderRadius: 4,
                fontWeight: 800
              }}
            >
              LIVE
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
            <div
              style={{
                fontSize: isMobile ? 24 : 30,
                fontWeight: 800,
                color: "#0F172A",
                fontFamily: "'Manrope', sans-serif"
              }}
            >
              {inr(currentPrice)}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontSize: isMobile ? 13 : 15,
                fontWeight: 800,
                color: themeColor
              }}
            >
              {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>
                {isPositive ? "+" : ""}
                {inr(priceChange)} ({isPositive ? "+" : ""}
                {priceChangePct.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Controls: Chart Type, Toggle Purchases, Timeframes */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: isMobile ? "stretch" : "flex-end",
            alignItems: isMobile ? "stretch" : "center",
            gap: 8,
            flexWrap: isMobile ? "nowrap" : "wrap",
            width: isMobile ? "100%" : "auto"
          }}
        >
          {/* Chart View Switcher */}
          <div
            style={{
              display: "flex",
              gap: "2px",
              background: "#F8FAFC",
              padding: "2px",
              borderRadius: 6,
              border: "1px solid #E2E8F0",
              width: isMobile ? "100%" : "auto"
            }}
          >
            <button
              className="gl-btn-ghost gl-btn-sm"
              onClick={() => setChartType("area")}
              style={{
                flex: isMobile ? 1 : "initial",
                justifyContent: "center",
                background: chartType === "area" ? "#0F172A" : "transparent",
                color: chartType === "area" ? "#FFFFFF" : "#475569",
                fontWeight: 800,
                fontSize: 11,
                padding: isMobile ? "6px 10px" : "5px 10px",
                borderRadius: 4,
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 5
              }}
            >
              <LineChart size={13} /> Trend Line
            </button>
            <button
              className="gl-btn-ghost gl-btn-sm"
              onClick={() => setChartType("candle")}
              style={{
                flex: isMobile ? 1 : "initial",
                justifyContent: "center",
                background: chartType === "candle" ? "#0F172A" : "transparent",
                color: chartType === "candle" ? "#FFFFFF" : "#475569",
                fontWeight: 800,
                fontSize: 11,
                padding: isMobile ? "6px 10px" : "5px 10px",
                borderRadius: 4,
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 5
              }}
            >
              <BarChart2 size={13} /> Candlesticks
            </button>
          </div>

          {/* Timeframe Selector with Monthwise & Yearwise */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "stretch" : "center",
              gap: isMobile ? 6 : "6px",
              flexWrap: isMobile ? "nowrap" : "wrap",
              width: isMobile ? "100%" : "auto"
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "2px",
                background: "#F1F5F9",
                padding: "2px",
                borderRadius: 6,
                border: "1px solid #CBD5E1",
                width: isMobile ? "100%" : "auto"
              }}
            >
              {[
                { id: "1d", label: "1D" },
                { id: "7d", label: "1W" },
                { id: "30d", label: "1M" },
                { id: "1y", label: "1Y" },
                { id: "month", label: "Month" },
                { id: "year", label: "Year" },
                { id: "all", label: "ALL" }
              ].map((tf) => (
                <button
                  key={tf.id}
                  type="button"
                  className="gl-btn-ghost gl-btn-sm"
                  onClick={() => setTimeRange(tf.id)}
                  style={{
                    flex: isMobile ? 1 : "initial",
                    textAlign: "center",
                    justifyContent: "center",
                    background: timeRange === tf.id ? themeColor : "transparent",
                    color: timeRange === tf.id ? "#FFFFFF" : "#334155",
                    fontWeight: 800,
                    fontSize: isMobile ? 10 : 10.5,
                    padding: isMobile ? "6px 0" : "4px 8px",
                    borderRadius: 4,
                    border: "none",
                    cursor: "pointer",
                    textTransform: "uppercase"
                  }}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Monthwise Picker */}
            {timeRange === "month" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isMobile ? "center" : "flex-start",
                  gap: 6,
                  width: isMobile ? "100%" : "auto",
                  paddingTop: isMobile ? 2 : 0
                }}
              >
                <button
                  type="button"
                  title="Previous Month"
                  onClick={() => {
                    const [y, m] = selectedMonth.split("-").map(Number);
                    const prevDate = new Date(y, m - 2, 1);
                    const ny = prevDate.getFullYear();
                    const nm = String(prevDate.getMonth() + 1).padStart(2, "0");
                    setSelectedMonth(`${ny}-${nm}`);
                  }}
                  style={{
                    background: "#F1F5F9",
                    border: "1px solid #CBD5E1",
                    borderRadius: 4,
                    padding: isMobile ? "4px 10px" : "2px 6px",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#475569"
                  }}
                >
                  ◀
                </button>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{
                    padding: "3px 8px",
                    fontSize: 12,
                    height: 28,
                    fontWeight: 700,
                    borderRadius: 4,
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    color: "#0F172A",
                    cursor: "pointer",
                    maxWidth: isMobile ? 180 : "auto"
                  }}
                />
                <button
                  type="button"
                  title="Next Month"
                  onClick={() => {
                    const [y, m] = selectedMonth.split("-").map(Number);
                    const nextDate = new Date(y, m, 1);
                    const ny = nextDate.getFullYear();
                    const nm = String(nextDate.getMonth() + 1).padStart(2, "0");
                    setSelectedMonth(`${ny}-${nm}`);
                  }}
                  style={{
                    background: "#F1F5F9",
                    border: "1px solid #CBD5E1",
                    borderRadius: 4,
                    padding: isMobile ? "4px 10px" : "2px 6px",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#475569"
                  }}
                >
                  ▶
                </button>
              </div>
            )}

            {/* Yearwise Selector */}
            {timeRange === "year" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isMobile ? "center" : "flex-start",
                  gap: 6,
                  width: isMobile ? "100%" : "auto",
                  paddingTop: isMobile ? 2 : 0
                }}
              >
                <button
                  type="button"
                  title="Previous Year"
                  onClick={() => {
                    setSelectedYear((prev) => String(Number(prev) - 1));
                  }}
                  style={{
                    background: "#F1F5F9",
                    border: "1px solid #CBD5E1",
                    borderRadius: 4,
                    padding: isMobile ? "4px 10px" : "2px 6px",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#475569"
                  }}
                >
                  ◀
                </button>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  style={{
                    padding: "3px 10px",
                    fontSize: 12,
                    height: 28,
                    fontWeight: 700,
                    borderRadius: 4,
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    color: "#0F172A",
                    cursor: "pointer",
                    minWidth: 90
                  }}
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  title="Next Year"
                  onClick={() => {
                    setSelectedYear((prev) => String(Number(prev) + 1));
                  }}
                  style={{
                    background: "#F1F5F9",
                    border: "1px solid #CBD5E1",
                    borderRadius: 4,
                    padding: isMobile ? "4px 10px" : "2px 6px",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#475569"
                  }}
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ width: "100%", height: isMobile ? 390 : 450, minHeight: 320 }}>
        {chartData.length === 0 ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748B",
              padding: "20px"
            }}
          >
            <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: "#475569" }}>No price records found for this period</p>
            <p style={{ fontSize: 12, margin: "6px 0 0 0", color: "#94A3B8" }}>Try selecting another month or year, or choose 'ALL'</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={
                isMobile
                  ? { top: 15, right: 12, left: -8, bottom: 36 }
                  : { top: 20, right: 20, left: 6, bottom: 42 }
              }
            >
              <defs>
                <linearGradient id="kachaRateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={themeColor} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={themeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="2 2" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="shortLabel"
                tick={<CustomXAxisTick isMobile={isMobile} />}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0", strokeWidth: 1 }}
                interval={chartData.length <= 8 ? 0 : "preserveStartEnd"}
                minTickGap={16}
                tickFormatter={(val) => String(val).split("__SEP__")[0] || ""}
              />
              <YAxis
                width={isMobile ? 54 : 70}
                tick={{ fontSize: isMobile ? 10 : 11.5, fill: "#64748B", fontWeight: 700 }}
                domain={[yMin, yMax]}
                tickFormatter={(v) => {
                  if (v == null || isNaN(v)) return "";
                  const spread = yMax - yMin;
                  return spread <= 3000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${(v / 1000).toFixed(0)}k`;
                }}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />

            <Tooltip content={<CustomTooltip />} />

            {/* Current Price Tracking Line */}
            <ReferenceLine
              y={currentPrice}
              stroke={themeColor}
              strokeDasharray="2 2"
              strokeWidth={1.5}
            />

            {/* Trend Line View with Up/Down Color-coded points */}
            {chartType === "area" && (
              <Area
                type="monotone"
                dataKey="kachaRate"
                name="Market Kacha Rate"
                stroke={themeColor}
                strokeWidth={3}
                fill="url(#kachaRateGradient)"
                isAnimationActive={true}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (!cx || !cy || !payload) return null;
                  const isUp = payload.movement === "up";
                  const isDown = payload.movement === "down";
                  const dotColor = isUp ? "#059669" : (isDown ? "#DC2626" : "#2563EB");

                  return (
                    <g key={`trend-dot-${payload.id || cx}`}>
                      <circle cx={cx} cy={cy} r={5} fill="#FFFFFF" stroke={dotColor} strokeWidth={2.5} />
                      <circle cx={cx} cy={cy} r={2} fill={dotColor} />
                    </g>
                  );
                }}
                activeDot={(props) => {
                  const { cx, cy, payload } = props;
                  if (!cx || !cy || !payload) return null;
                  const isUp = payload.movement === "up";
                  const isDown = payload.movement === "down";
                  const dotColor = isUp ? "#059669" : (isDown ? "#DC2626" : "#2563EB");

                  return (
                    <g key={`active-dot-${cx}`}>
                      <circle cx={cx} cy={cy} r={10} fill={dotColor} fillOpacity={0.25} />
                      <circle cx={cx} cy={cy} r={5.5} fill="#FFFFFF" stroke={dotColor} strokeWidth={3} />
                    </g>
                  );
                }}
                connectNulls={true}
              />
            )}

            {/* Candlesticks View with slender, proportional candles */}
            {chartType === "candle" && (
              <Bar
                dataKey="candleBody"
                name="Candlestick OHLC"
                isAnimationActive={true}
                shape={(props) => {
                  const { x, y, width, height, payload } = props;
                  if (!payload) return null;
                  const isGreen = payload.isGreen;
                  const color = isGreen ? "#00B386" : "#FF5253";
                  const w = Math.min(24, Math.max(8, width * 0.35));
                  const candleX = x + (width - w) / 2;

                  return (
                    <g key={`candle-${payload.id || x}`}>
                      {/* High/Low Center Wick */}
                      <line
                        x1={x + width / 2}
                        y1={y - 8}
                        x2={x + width / 2}
                        y2={y + height + 8}
                        stroke={color}
                        strokeWidth={1.8}
                      />
                      {/* Candle Body */}
                      <rect
                        x={candleX}
                        y={y}
                        width={w}
                        height={Math.max(3, height)}
                        fill={color}
                        stroke={color}
                        rx={2}
                      />
                    </g>
                  );
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
