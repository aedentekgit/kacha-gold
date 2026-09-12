import React, { useState, useRef, useEffect } from "react";
import { ImagePlus, X, Check, Camera, Sparkles, Coins } from "lucide-react";
import { todayStr, nowTime, uid, resizeImage, inr } from "../utils/goldHelpers";

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
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingBottom: 20 }}>
        {/* Mobile App Section Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 2px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>Add Gold Lot</span>
          </div>
          {kachaPerGram && (
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#059669", background: "#ECFDF5", padding: "3px 8px", borderRadius: 9999, border: "1px solid #A7F3D0" }}>
              Active: {inr(kachaPerGram)}
            </span>
          )}
        </div>

        {/* Unified Native Mobile Form Card */}
        <div className="gl-card" style={{ padding: "16px 14px", margin: 0, borderRadius: 18 }}>
          {/* 1. Compact Tap-to-Attach Photo Tile */}
          <div style={{ marginBottom: 14 }}>
            {image ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "8px 12px" }}>
                <img src={image} className="gl-preview-img gl-image-pop" alt="Gold item preview" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>Photo Attached</div>
                  <div style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>Ready to save with entry</div>
                </div>
                <button
                  type="button"
                  className="gl-btn-ghost gl-btn-sm"
                  onClick={() => setImage(null)}
                  style={{ color: "#DC2626", borderColor: "#FECACA", background: "#FEF2F2", padding: "4px 8px", borderRadius: 8 }}
                >
                  <X size={14} /> Remove
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px 14px",
                  background: "#F8FAFC",
                  border: "1.5px dashed #CBD5E1",
                  borderRadius: 12,
                  cursor: "pointer",
                  color: "#475569"
                }}
              >
                <Camera size={18} color="#D97706" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Tap to add photo of gold item (Optional)</span>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          </div>

          {/* 2. Side-by-side Weight & Price Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label className="gl-input-label" style={{ fontSize: 11.5, fontWeight: 800, color: "#475569", marginBottom: 5 }}>
                Weight (Grams) *
              </label>
              <input
                className="gl-input"
                type="number"
                inputMode="decimal"
                placeholder="e.g. 15.50"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                style={{ fontSize: 15, padding: "10px 12px", fontWeight: 700, borderRadius: 10 }}
              />
            </div>
            <div>
              <label className="gl-input-label" style={{ fontSize: 11.5, fontWeight: 800, color: "#475569", marginBottom: 5 }}>
                Total Buy Price (₹) *
              </label>
              <input
                className="gl-input"
                type="number"
                inputMode="decimal"
                placeholder="e.g. 125000"
                value={overallPrice}
                onChange={(e) => setOverallPrice(e.target.value)}
                style={{ fontSize: 15, padding: "10px 12px", fontWeight: 700, borderRadius: 10 }}
              />
            </div>
          </div>

          {/* Computed Rate Dynamic Highlight */}
          {computedRate && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#ECFDF5",
              border: "1px solid #A7F3D0",
              borderRadius: 10,
              padding: "8px 12px",
              marginBottom: 12
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#065F46" }}>Computed Rate Paid:</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>{inr(computedRate)} /g</span>
            </div>
          )}

          {/* 3. Purchase Date */}
          <div style={{ marginBottom: 12 }}>
            <label className="gl-input-label" style={{ fontSize: 11.5, fontWeight: 800, color: "#475569", marginBottom: 5 }}>
              Purchase Date
            </label>
            <input
              className="gl-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={todayStr()}
              style={{ fontSize: 14, padding: "10px 12px", fontWeight: 700, borderRadius: 10 }}
            />
          </div>

          {/* 4. Notes / Description */}
          <div style={{ marginBottom: 16 }}>
            <label className="gl-input-label" style={{ fontSize: 11.5, fontWeight: 800, color: "#475569", marginBottom: 5 }}>
              Notes / Description (Optional)
            </label>
            <input
              className="gl-input"
              type="text"
              placeholder="e.g. Ring, Chain, Hallmark 916..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ fontSize: 14, padding: "10px 12px", borderRadius: 10 }}
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
              fontWeight: 800,
              borderRadius: 12,
              background: saving ? "#64748B" : "linear-gradient(135deg, #059669 0%, #047857 100%)",
              cursor: saving ? "wait" : "pointer"
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
            <button className="gl-btn-ghost gl-btn-sm" onClick={() => setImage(null)} style={{ padding: "6px 12px", fontSize: 13 }}>
              <X size={14} /> Remove Photo
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
