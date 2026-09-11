import React, { useState, useRef } from "react";
import { ImagePlus, X, Check } from "lucide-react";
import { todayStr, nowTime, uid, resizeImage } from "../utils/goldHelpers";

export default function AddGoldPage({ kachaPerGram, latestRate, purchases, persistPurchases, rateForDate, saving, setSaving, goToLedger }) {
  const [image, setImage] = useState(null);
  const [grams, setGrams] = useState("");
  const [overallPrice, setOverallPrice] = useState("");
  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef(null);

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

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px", paddingBottom: 40 }}>
      {/* 1. Item Photo Card */}
      <div className="gl-card" style={{ padding: "22px 26px" }}>
        <div className="gl-section-title" style={{ marginBottom: 14, fontSize: 16 }}>Item Photo</div>
        {image ? (
          <div>
            <img src={image} className="gl-preview-img" alt="Gold item preview" style={{ maxHeight: 220, borderRadius: 6, marginBottom: 10 }} />
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

        <div style={{ marginBottom: 18 }}>
          <label className="gl-input-label" style={{ fontSize: 12, marginBottom: 6, fontWeight: 800 }}>Purchase Date</label>
          <input className="gl-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayStr()} style={{ padding: "11px 15px", fontSize: 15 }} />
        </div>

        <div>
          <label className="gl-input-label" style={{ fontSize: 12, marginBottom: 6, fontWeight: 800 }}>Notes / Description (Optional)</label>
          <input className="gl-input" type="text" placeholder="Item description, ornament type..." value={notes} onChange={(e) => setNotes(e.target.value)} style={{ padding: "11px 15px", fontSize: 15 }} />
        </div>

        {error && <p style={{ color: "#B91C1C", fontSize: 13.5, fontWeight: 700, marginTop: 12 }}>{error}</p>}

        <button className="gl-btn" onClick={submit} disabled={saving} style={{ width: "100%", justifyContent: "center", padding: "13px 20px", fontSize: 15, fontWeight: 800, marginTop: 22, background: saving ? "#E2E8F0" : "#107C41" }}>
          <Check size={18} /> {saving ? "Saving Gold Purchase…" : "Save Purchase Entry"}
        </button>
      </div>
    </div>
  );
}
