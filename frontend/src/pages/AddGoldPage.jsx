import React, { useState, useRef, useEffect } from "react";
import { ImagePlus, X, Check, Camera, Sparkles, Coins, ArrowRight, Plus } from "lucide-react";
import { todayStr, nowTime, uid, resizeImage, inr, fmtDate } from "../utils/goldHelpers";

export default function AddGoldPage({ kachaPerGram, latestRate, purchases, persistPurchases, rateForDate, saving, setSaving, goToLedger }) {
  const [image, setImage] = useState(null);
  const [grams, setGrams] = useState("");
  const [overallPrice, setOverallPrice] = useState("");
  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth <= 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const applicableRate = rateForDate(date);
  const applicableKachaRate = applicableRate ? applicableRate.kacha : null;

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file);
      setImage(dataUrl);
    } catch (err) { console.error(err); }
  };

  const computedRate = grams && overallPrice && parseFloat(grams) > 0 && parseFloat(overallPrice) > 0
    ? Math.round(parseFloat(overallPrice) / parseFloat(grams))
    : null;

  const submit = async () => {
    setError("");
    if (!grams || parseFloat(grams) <= 0) { setError("Enter a valid gold weight in grams."); return; }
    if (!overallPrice || parseFloat(overallPrice) <= 0) { setError("Enter the buy overall price."); return; }
    setSaving(true);
    const g = parseFloat(grams);
    const tot = parseFloat(overallPrice);
    const computedRatePaid = tot / g;

    const entry = {
      id: uid("pur"),
      date,
      time: nowTime(),
      grams: g,
      ratePaid: computedRatePaid,
      overallPrice: tot,
      thumbnail: image,
      notes,
      createdAt: Date.now(),
      kachaAtPurchase: applicableKachaRate,
      boardAtPurchase: applicableRate ? applicableRate.board : null,
    };
    await persistPurchases([...purchases, entry]);
    setImage(null); setGrams(""); setOverallPrice(""); setDate(todayStr()); setNotes(""); setSaving(false);
    goToLedger();
  };

  // NATIVE MOBILE FORM UI
  if (isMobile) {
    const marginVsMarket = computedRate && kachaPerGram ? kachaPerGram - computedRate : null;
    const recentPurchases = purchases && purchases.length > 0 ? [...purchases].reverse().slice(0, 3) : [];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingBottom: 24 }}>
        {/* 1. Mobile App Header with Live Market Indicator */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 2px 0" }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.3px" }}>
              Add Gold Lot
            </h1>
            <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500, marginTop: 2 }}>
              Log purchase to track live margin & profit
            </div>
          </div>
          {kachaPerGram && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              background: "#ECFDF5",
              border: "1px solid #A7F3D0",
              padding: "4px 10px",
              borderRadius: 10
            }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: "#047857", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                Active Market
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#065F46" }}>
                {inr(kachaPerGram)}<span style={{ fontSize: 10, fontWeight: 600 }}>/g</span>
              </span>
            </div>
          )}
        </div>

        {/* 2. Unified Native Mobile Form Card */}
        <div className="gl-card" style={{ padding: "16px 14px", margin: 0, borderRadius: 16, boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)" }}>
          {/* Photo Attachment Tile */}
          <div style={{ marginBottom: 14 }}>
            {image ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "8px 12px" }}>
                <img src={image} className="gl-preview-img gl-image-pop" alt="Gold item preview" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 4 }}>
                    <Check size={13} color="#059669" /> Photo Attached
                  </div>
                  <div style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>Saved with this entry</div>
                </div>
                <button
                  type="button"
                  className="gl-btn-ghost gl-btn-sm"
                  onClick={() => setImage(null)}
                  style={{
                    color: "#DC2626",
                    borderColor: "#FECACA",
                    background: "#FEF2F2",
                    padding: "5px 10px",
                    borderRadius: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    lineHeight: 1
                  }}
                >
                  <X size={13} style={{ display: "block", flexShrink: 0 }} />
                  <span style={{ display: "inline-block", lineHeight: 1 }}>Remove</span>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 13px",
                  background: "#F8FAFC",
                  border: "1.5px dashed #CBD5E1",
                  borderRadius: 12,
                  cursor: "pointer"
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#FEF3C7",
                  border: "1px solid #FDE68A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#B45309",
                  flexShrink: 0
                }}>
                  <Camera size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>
                    Attach Photo of Item <span style={{ fontSize: 11, fontWeight: 500, color: "#94A3B8" }}>(Optional)</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 500, marginTop: 1 }}>
                    Tap to take photo or choose from gallery
                  </div>
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          </div>

          {/* Side-by-side Weight & Price Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label className="gl-input-label" style={{ fontSize: 11.5, fontWeight: 700, color: "#334155", marginBottom: 5, display: "flex", justifyContent: "space-between" }}>
                <span>Weight *</span>
                <span style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600 }}>Grams (g)</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className="gl-input"
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  style={{ fontSize: 15.5, padding: "10px 28px 10px 12px", fontWeight: 700, borderRadius: 10, width: "100%" }}
                />
                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 700, color: "#94A3B8", pointerEvents: "none" }}>
                  g
                </span>
              </div>
            </div>

            <div>
              <label className="gl-input-label" style={{ fontSize: 11.5, fontWeight: 700, color: "#334155", marginBottom: 5, display: "flex", justifyContent: "space-between" }}>
                <span>Total Price *</span>
                <span style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600 }}>Rupees (₹)</span>
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 700, color: "#94A3B8", pointerEvents: "none" }}>
                  ₹
                </span>
                <input
                  className="gl-input"
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={overallPrice}
                  onChange={(e) => setOverallPrice(e.target.value)}
                  style={{ fontSize: 15.5, padding: "10px 12px 10px 24px", fontWeight: 700, borderRadius: 10, width: "100%" }}
                />
              </div>
            </div>
          </div>

          {/* Computed Rate & Margin Live Feedback */}
          {computedRate ? (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)",
              border: "1px solid #A7F3D0",
              borderRadius: 12,
              padding: "10px 12px",
              marginBottom: 12
            }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  Computed Buy Rate
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#047857", marginTop: 2 }}>
                  {inr(computedRate)} <span style={{ fontSize: 11, fontWeight: 600 }}>/gram</span>
                </div>
              </div>
              {marginVsMarket !== null && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    Initial Margin
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: marginVsMarket >= 0 ? "#059669" : "#DC2626", marginTop: 2 }}>
                    {marginVsMarket >= 0 ? "+" : ""}{inr(marginVsMarket)}/g
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#F8FAFC",
              border: "1px solid #F1F5F9",
              borderRadius: 10,
              padding: "8px 12px",
              marginBottom: 12,
              fontSize: 11.5,
              color: "#64748B",
              fontWeight: 500
            }}>
              <Sparkles size={13} color="#94A3B8" />
              <span>Enter weight and total price to auto-calculate rate/gram</span>
            </div>
          )}

          {/* Purchase Date */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <label className="gl-input-label" style={{ fontSize: 11.5, fontWeight: 700, color: "#334155", margin: 0 }}>
                Purchase Date
              </label>
              {date !== todayStr() && (
                <button
                  type="button"
                  onClick={() => setDate(todayStr())}
                  style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#047857", fontSize: 10.5, fontWeight: 700, borderRadius: 6, padding: "2px 7px", cursor: "pointer" }}
                >
                  Set Today
                </button>
              )}
            </div>
            <input
              className="gl-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={todayStr()}
              style={{ fontSize: 14, padding: "10px 12px", fontWeight: 700, borderRadius: 10, width: "100%" }}
            />
          </div>

          {/* Notes / Description */}
          <div style={{ marginBottom: 16 }}>
            <label className="gl-input-label" style={{ fontSize: 11.5, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
              Notes / Description (Optional)
            </label>
            <input
              className="gl-input"
              type="text"
              placeholder="e.g. 22K Chain, Hallmark 916, Ring..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ fontSize: 14, padding: "10px 12px", borderRadius: 10, width: "100%" }}
            />
          </div>

          {error && (
            <div style={{ color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, fontWeight: 700, marginBottom: 14 }}>
              {error}
            </div>
          )}

          {/* Full-width Touch Button */}
          <button
            type="button"
            className="gl-btn"
            onClick={submit}
            disabled={saving}
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "13px 18px",
              fontSize: 15,
              fontWeight: 700,
              borderRadius: 12,
              background: saving ? "#64748B" : "linear-gradient(135deg, #059669 0%, #047857 100%)",
              cursor: saving ? "wait" : "pointer",
              boxShadow: "0 3px 10px rgba(5, 150, 105, 0.25)"
            }}
          >
            {saving ? (
              <>
                <div className="gl-spin" style={{ width: 16, height: 16, border: "2px solid #FFFFFF", borderTopColor: "transparent", borderRadius: "50%" }} />
                Saving Gold Lot…
              </>
            ) : (
              <>
                <Check size={18} /> Save Gold Lot
              </>
            )}
          </button>
        </div>

        {/* 3. Recent Purchases Quick Glance */}
        {recentPurchases.length > 0 && (
          <div style={{ marginTop: 2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "0 2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Coins size={14} color="#64748B" />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#334155" }}>
                  Recent Lots Added ({recentPurchases.length})
                </span>
              </div>
              <button
                type="button"
                onClick={goToLedger}
                style={{ background: "transparent", border: "none", color: "#059669", fontSize: 11.5, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3, padding: 0 }}
              >
                View Ledger{purchases.length > 3 ? ` (${purchases.length})` : ""} <ArrowRight size={12} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentPurchases.map((p) => {
                const buyPrice = p.overallPrice || (p.grams && p.ratePaid ? Math.round(p.grams * (p.ratePaid > 50000 ? p.ratePaid / 10 : p.ratePaid)) : 0);
                return (
                  <div
                    key={p.id}
                    onClick={goToLedger}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: 12,
                      padding: "9px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt="Lot" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", flexShrink: 0 }}>
                          <Coins size={15} />
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 900, color: "#D97706", display: "flex", alignItems: "center", gap: 6, letterSpacing: "-0.2px" }}>
                          <span style={{ fontWeight: 900 }}>{p.grams.toFixed(2)} g</span>
                          <span style={{ fontSize: 10.5, fontWeight: 500, color: "#64748B" }}>
                            • {fmtDate(p.date)}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748B", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.notes || "Gold Lot"}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>
                        {inr(buyPrice)}
                      </div>
                      <div style={{ fontSize: 10.5, color: "#059669", fontWeight: 700 }}>
                        {p.grams ? `${inr(Math.round(buyPrice / p.grams))}/g` : "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // DESKTOP FORM UI
  return (
    <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px", paddingBottom: 40 }}>
      {/* 1. Item Photo Card */}
      <div className="gl-card" style={{ padding: "22px 26px" }}>
        <div className="gl-section-title" style={{ marginBottom: 14, fontSize: 16 }}>Item Photo</div>
        {image ? (
          <div>
            <img src={image} className="gl-preview-img gl-image-pop" alt="Gold item preview" style={{ maxHeight: 220, borderRadius: 6, marginBottom: 10 }} />
            <button
              type="button"
              className="gl-btn-ghost gl-btn-sm"
              onClick={() => setImage(null)}
              style={{
                padding: "6px 12px",
                fontSize: 13,
                color: "#DC2626",
                borderColor: "#FECACA",
                background: "#FEF2F2",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                lineHeight: 1
              }}
            >
              <X size={14} style={{ display: "block", flexShrink: 0 }} />
              <span style={{ display: "inline-block", lineHeight: 1 }}>Remove Photo</span>
            </button>
          </div>
        ) : (
          <div 
            className="gl-upload-box" 
            onClick={() => fileRef.current?.click()}
            style={{ 
              padding: "36px 20px", 
              border: "2px dashed #CBD5E1", 
              borderRadius: 6, 
              textAlign: "center", 
              background: "#F8FAFC", 
              cursor: "pointer", 
              transition: "all 0.2s ease" 
            }}
          >
            <ImagePlus size={28} color="#B8860B" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#334155" }}>Tap or click to attach photo of gold item</div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      </div>

      {/* 2. Purchase Details Card & Submit Button */}
      <div className="gl-card" style={{ padding: "22px 26px" }}>
        <div className="gl-section-title" style={{ marginBottom: 16, fontSize: 16 }}>Purchase Details</div>
        <div className="gl-grid2" style={{ marginBottom: 18, gap: "16px" }}>
          <div>
            <label className="gl-input-label" style={{ fontSize: 12, marginBottom: 6, fontWeight: 800 }}>Weight (Grams)</label>
            <input className="gl-input" type="number" inputMode="decimal" placeholder="Enter Weight" value={grams} onChange={(e) => setGrams(e.target.value)} style={{ padding: "11px 15px", fontSize: 15 }} />
          </div>
          <div>
            <label className="gl-input-label" style={{ fontSize: 12, marginBottom: 6, fontWeight: 800 }}>Buy Overall Price (₹)</label>
            <input className="gl-input" type="number" inputMode="decimal" placeholder="Enter Amount" value={overallPrice} onChange={(e) => setOverallPrice(e.target.value)} style={{ padding: "11px 15px", fontSize: 15 }} />
          </div>
        </div>

        {computedRate && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8, padding: "8px 14px", marginBottom: 16 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#065F46" }}>Computed Rate Paid:</span>
            <span style={{ fontSize: 14.5, fontWeight: 800, color: "#059669" }}>{inr(computedRate)} /g</span>
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <label className="gl-input-label" style={{ fontSize: 12, marginBottom: 6, fontWeight: 800 }}>Purchase Date</label>
          <input className="gl-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayStr()} style={{ padding: "11px 15px", fontSize: 15 }} />
        </div>

        <div>
          <label className="gl-input-label" style={{ fontSize: 12, marginBottom: 6, fontWeight: 800 }}>Notes / Description (Optional)</label>
          <input className="gl-input" type="text" placeholder="Item description, ornament type..." value={notes} onChange={(e) => setNotes(e.target.value)} style={{ padding: "11px 15px", fontSize: 15 }} />
        </div>

        {error && <p style={{ color: "#B91C1C", fontSize: 13.5, fontWeight: 700, marginTop: 12 }}>{error}</p>}

        <button className="gl-btn" onClick={submit} disabled={saving} style={{ width: "100%", justifyContent: "center", padding: "13px 20px", fontSize: 15, fontWeight: 800, marginTop: 22, background: saving ? "#64748B" : "#107C41", cursor: saving ? "wait" : "pointer" }}>
          {saving ? (
            <>
              <div className="gl-spin" style={{ width: 16, height: 16, border: "2px solid #FFFFFF", borderTopColor: "transparent", borderRadius: "50%" }} />
              Saving Gold Purchase…
            </>
          ) : (
            <>
              <Check size={18} /> Save Purchase Entry
            </>
          )}
        </button>
      </div>
    </div>
  );
}
