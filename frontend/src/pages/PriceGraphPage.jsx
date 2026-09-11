import React, { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from "recharts";
import { inr, fmtDate, compareEntriesAsc } from "../utils/goldHelpers";
import { TrendingUp, TrendingDown, LineChart, BarChart2 } from "lucide-react";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        background: "#0F172A",
        border: "1.5px solid #334155",
        borderRadius: 6,
        padding: "10px 14px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: 700,
        minWidth: 170
      }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "#94A3B8", marginBottom: 6, borderBottom: "1px solid #1E293B", paddingBottom: 4 }}>
          {data.label}
        </div>

        {data.kachaRate ? (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
            <span style={{ color: "#E2E8F0" }}>Market Kacha:</span>
            <strong style={{ color: "#00B386", fontWeight: 900 }}>{inr(data.kachaRate)}</strong>
          </div>
        ) : null}


        {data.boughtKacha ? (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 4, paddingTop: 4, borderTop: "1px dashed #334155" }}>
            <span style={{ color: "#FDE047" }}>Bought Kacha:</span>
            <strong style={{ color: "#FDE047", fontWeight: 900 }}>{inr(data.boughtKacha)}</strong>
          </div>
        ) : null}
      </div>
    );
  }
  return null;
};

export default function PriceGraphPage({ sortedRates, purchases, totals, targetProfit, kachaPerGram, sortOrder = "desc", filterMode = "all" }) {
  const [timeRange, setTimeRange] = useState("all"); // '1d', '7d', '30d' (1M), '1y', 'all' - default to 'all' so top FilterToolbar works seamlessly
  const [chartType, setChartType] = useState("candle"); // 'candle' or 'area'
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth <= 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Ensure rates are sorted chronologically (oldest first) for OHLC and prevEntry calculations
  const chronologicalRates = useMemo(() => {
    if (!sortedRates || !sortedRates.length) return [];
    return [...sortedRates].sort(compareEntriesAsc);
  }, [sortedRates]);

  // Filter rates by selected timeframe (if top toolbar is in 'all' mode)
  const processedRates = useMemo(() => {
    if (!chronologicalRates || !chronologicalRates.length) return [];
    if (filterMode !== "all" || timeRange === "all") return chronologicalRates;

    const now = new Date();
    const cutoff = new Date();
    if (timeRange === "1d") {
      cutoff.setDate(now.getDate() - 1);
    } else if (timeRange === "7d") {
      cutoff.setDate(now.getDate() - 7);
    } else if (timeRange === "30d") {
      cutoff.setDate(now.getDate() - 30);
    } else if (timeRange === "1y") {
      cutoff.setFullYear(now.getFullYear() - 1);
    }

    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return chronologicalRates.filter((r) => r.date >= cutoffStr);
  }, [chronologicalRates, filterMode, timeRange]);

  // Compute OHLC (Open, High, Low, Close) and chart bounds
  const { chartData, yMin, yMax, currentPrice, priceChange, priceChangePct, stats } = useMemo(() => {
    if (!processedRates || !processedRates.length) {
      return { chartData: [], yMin: 120000, yMax: 170000, currentPrice: 0, priceChange: 0, priceChangePct: 0, stats: { open: 0, high: 0, low: 0, close: 0 } };
    }

    let globalMin = Infinity;
    let globalMax = -Infinity;

    const data = processedRates.map((r, idx) => {
      const dateStr = r.date;
      const close = r.kacha && r.kacha > 0 ? Math.round(r.kacha) : 0;
      
      // Calculate Open as previous day's close or initial rate
      const prevEntry = idx > 0 ? processedRates[idx - 1] : null;
      const open = prevEntry && prevEntry.kacha ? Math.round(prevEntry.kacha) : close;

      // Estimate intraday High & Low for candlestick wicks
      const spread = Math.abs(close - open) * 0.4 || 600;
      const high = Math.max(open, close) + Math.round(spread * 0.7);
      const low = Math.min(open, close) - Math.round(spread * 0.7);

      const matchingPurchases = purchases.filter((p) => p.date === dateStr);
      const buyRateOnDate = matchingPurchases.length
        ? Math.round(matchingPurchases.reduce((s, p) => s + (p.kachaAtPurchase || p.ratePaid || 0), 0) / matchingPurchases.length)
        : null;

      [open, close, high, low, buyRateOnDate].forEach((v) => {
        if (v && v > 50000) {
          if (v < globalMin) globalMin = v;
          if (v > globalMax) globalMax = v;
        }
      });

      const isGreen = close >= open;

      return {
        label: fmtDate(dateStr),
        date: dateStr,
        kachaRate: close,
        open,
        high,
        low,
        close,
        candleBody: [Math.min(open, close), Math.max(open, close)],
        isGreen,
        boughtKacha: buyRateOnDate,
        purchaseCount: matchingPurchases.length
      };
    });

    const firstPrice = data.length ? data[0].open : 0;
    const lastPrice = data.length ? data[data.length - 1].close : 0;
    const diff = lastPrice - firstPrice;
    const pct = firstPrice ? (diff / firstPrice) * 100 : 0;

    const lower = isFinite(globalMin) ? Math.max(0, Math.floor(globalMin - 2000)) : 130000;
    const upper = isFinite(globalMax) ? Math.ceil(globalMax + 2000) : 165000;

    const statsObj = {
      open: data.length ? data[0].open : 0,
      high: isFinite(globalMax) ? globalMax : 0,
      low: isFinite(globalMin) ? globalMin : 0,
      close: lastPrice
    };

    // Apply sort order for display on chart (asc: Old to New, desc: New to Old)
    const finalChartData = sortOrder === "desc" ? [...data].reverse() : data;

    return {
      chartData: finalChartData,
      yMin: lower,
      yMax: upper,
      currentPrice: lastPrice,
      priceChange: diff,
      priceChangePct: pct,
      stats: statsObj
    };
  }, [processedRates, purchases, sortOrder]);

  if (!sortedRates.length) {
    return <div className="gl-empty">Log daily market rates to view the Groww/Zerodha Kacha price graph.</div>;
  }

  const isPositive = priceChange >= 0;
  const themeColor = isPositive ? "#00B386" : "#FF5253";

  return (
    <div className="gl-card gl-chart-card-wrap" style={{ display: "flex", flexDirection: "column", minHeight: 480, height: isMobile ? "auto" : "calc(100vh - 170px)", maxHeight: isMobile ? "none" : 720, marginBottom: 0, padding: isMobile ? "12px 10px" : "18px 20px", background: "#FFFFFF" }}>
      
      {/* Zerodha / Groww Header Stat Bar */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-start", gap: isMobile ? 12 : 16, marginBottom: 12, borderBottom: "1px solid #F1F5F9", paddingBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              GOLD KACHA MARKET PRICE
            </span>
            <span style={{ fontSize: 10, background: "#F1F5F9", color: "#475569", padding: "1px 6px", borderRadius: 3, fontWeight: 800 }}>
              LIVE
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
            <div style={{ fontSize: isMobile ? 24 : 30, fontWeight: 900, color: "#0F172A", fontFamily: "'Consolas', monospace, sans-serif" }}>
              {inr(currentPrice)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: isMobile ? 13 : 15, fontWeight: 800, color: themeColor }}>
              {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{isPositive ? "+" : ""}{inr(priceChange)} ({isPositive ? "+" : ""}{priceChangePct.toFixed(2)}%)</span>
            </div>
          </div>

          {/* Stat Pill Strip */}
          <div style={{ display: "flex", gap: isMobile ? 8 : 14, marginTop: 6, flexWrap: "wrap", fontSize: isMobile ? 11 : 12, color: "#64748B", fontWeight: 700 }}>
            <span>Period High: <strong style={{ color: "#00B386" }}>{inr(stats.high)}</strong></span>
            <span>Period Low: <strong style={{ color: "#FF5253" }}>{inr(stats.low)}</strong></span>
          </div>
        </div>

        {/* Controls: Chart Type Toggle & Timeframes */}
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Chart View Switcher (Area Line vs Candlesticks) */}
          <div style={{ display: "flex", gap: "2px", background: "#F8FAFC", padding: "2px", borderRadius: 4, border: "1px solid #E2E8F0" }}>
            <button
              className="gl-btn-ghost gl-btn-sm"
              onClick={() => setChartType("area")}
              style={{
                background: chartType === "area" ? "#0F172A" : "transparent",
                color: chartType === "area" ? "#FFFFFF" : "#475569",
                fontWeight: 800,
                fontSize: 11,
                padding: "4px 8px",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <LineChart size={13} /> Area Line
            </button>
            <button
              className="gl-btn-ghost gl-btn-sm"
              onClick={() => setChartType("candle")}
              style={{
                background: chartType === "candle" ? "#0F172A" : "transparent",
                color: chartType === "candle" ? "#FFFFFF" : "#475569",
                fontWeight: 800,
                fontSize: 11,
                padding: "4px 8px",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <BarChart2 size={13} /> Candlesticks
            </button>
          </div>

          {/* Timeframe Selector (1D, 1W, 1M, 1Y, ALL) */}
          <div style={{ display: "flex", gap: "2px", background: "#F1F5F9", padding: "2px", borderRadius: 4, border: "1px solid #CBD5E1" }}>
            {["1d", "7d", "30d", "1y", "all"].map((tf) => (
              <button
                key={tf}
                className="gl-btn-ghost gl-btn-sm"
                onClick={() => setTimeRange(tf)}
                style={{
                  background: timeRange === tf ? themeColor : "transparent",
                  color: timeRange === tf ? "#FFFFFF" : "#334155",
                  fontWeight: 800,
                  fontSize: 10.5,
                  padding: "3px 7px",
                  border: "none",
                  textTransform: "uppercase"
                }}
              >
                {tf === "7d" ? "1W" : tf === "30d" ? "1M" : tf === "1y" ? "1Y" : tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ width: "100%", height: isMobile ? 380 : 440, minHeight: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={isMobile ? { top: 10, right: 8, left: -14, bottom: 25 } : { top: 15, right: 15, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="growwGreenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={themeColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={themeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="2 2" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: isMobile ? 9.5 : 11.5, fill: "#64748B", fontWeight: 700 }}
              interval="preserveStartEnd"
              minTickGap={15}
              axisLine={{ stroke: "#CBD5E1" }}
            />
            <YAxis
              width={isMobile ? 50 : 75}
              tick={{ fontSize: isMobile ? 10 : 11.5, fill: "#64748B", fontWeight: 700 }}
              domain={[yMin, yMax]}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              axisLine={{ stroke: "#CBD5E1" }}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Current Price Horizontal Tracking Line */}
            <ReferenceLine
              y={currentPrice}
              stroke={themeColor}
              strokeDasharray="3 3"
              strokeWidth={1.5}
            />

            {/* Groww Area Line View */}
            {chartType === "area" && (
              <Area
                type="monotone"
                dataKey="kachaRate"
                name="Market Kacha Rate"
                stroke={themeColor}
                strokeWidth={3}
                fill="url(#growwGreenGradient)"
                dot={{ r: 4, strokeWidth: 2, fill: "#FFFFFF", stroke: themeColor }}
                activeDot={{ r: 7, strokeWidth: 2, fill: themeColor }}
                connectNulls={true}
                isAnimationActive={true}
              />
            )}

            {/* Zerodha Candlesticks View */}
            {chartType === "candle" && (
              <>
                <Bar
                  dataKey="candleBody"
                  name="Candlestick OHLC"
                  isAnimationActive={true}
                  shape={(props) => {
                    const { x, y, width, height, payload } = props;
                    if (!payload) return null;
                    const isGreen = payload.isGreen;
                    const color = isGreen ? "#00B386" : "#FF5253";
                    const w = Math.max(8, width * 0.5);
                    const candleX = x + (width - w) / 2;

                    return (
                      <g>
                        {/* High/Low Wick */}
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
                          rx={1}
                        />
                      </g>
                    );
                  }}
                />
              </>
            )}

            {/* Purchased Gold Marker Dots */}
            <Scatter
              dataKey="boughtKacha"
              name="Gold Bought Kacha Rate"
              fill="#B45309"
              shape="circle"
              size={180}
              isAnimationActive={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
