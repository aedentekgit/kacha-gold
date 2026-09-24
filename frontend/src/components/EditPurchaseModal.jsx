import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Pencil, X, Camera } from "lucide-react";
import { todayStr, inr } from "../utils/goldHelpers";

export default function EditPurchaseModal({ item, isOpen, onClose, onSave }) {
  const [grams, setGrams] = useState("");
  const [overallPrice, setOverallPrice] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    if (item) {
      setGrams(item.grams ? item.grams.toString() : "");
      const tot = item.overallPrice ? item.overallPrice : (item.grams && item.ratePaid ? item.grams * item.ratePaid : "");
      setOverallPrice(tot ? Math.round(tot).toString() : "");
      setDate(item.date || todayStr());
      setNotes(item.notes || "");
      setImage(item.thumbnail || null);
      setError("");
    }
  }, [item]);

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

  if (!isOpen || !item) return null;

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setImage(event.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const g = parseFloat(grams);
    const tot = parseFloat(overallPrice);
    if (!g || g <= 0 || !tot || tot <= 0) {
      setError("Please enter valid positive numbers for weight and buy overall price.");
      return;
    }
    const r = tot / g;
    onSave({
      ...item,
      grams: g,
      ratePaid: r,
      overallPrice: tot,
      date,
      notes: notes.trim(),
      thumbnail: image
    });
    onClose();
  };

  const gramsNum = parseFloat(grams);
  const overallNum = parseFloat(overallPrice);
  const calculatedRate = gramsNum > 0 && overallNum > 0 ? overallNum / gramsNum : 0;

  const modalContent = (
    <div className="gl-modal-overlay" onClick={onClose}>
      <div className="gl-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="gl-modal-handle" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #F0EAE1", paddingBottom: 12, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "#FEF3C7", border: "1px solid #FDE68A",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#B8860B"
            }}>
              <Pencil size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1C1917", fontFamily: "'Manrope', sans-serif" }}>
              Edit Purchase Entry
            </h3>
          </div>
          <button className="gl-btn-ghost gl-btn-sm" onClick={onClose} style={{ padding: "4px 8px" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, paddingRight: 4, overscrollBehavior: "contain" }}>
          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", padding: "10px 12px", borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <div>
            <label className="gl-input-label">Weight (Grams)</label>
            <input className="gl-input" type="number" step="0.01" value={grams} onChange={(e) => setGrams(e.target.value)} />
          </div>

          <div>
            <label className="gl-input-label">Buy Overall Price (₹)</label>
            <input className="gl-input" type="number" step="1" value={overallPrice} onChange={(e) => setOverallPrice(e.target.value)} />
          </div>

          <div>
            <label className="gl-input-label">Purchase Date</label>
            <input className="gl-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <label className="gl-input-label">Notes / Description</label>
            <input className="gl-input" type="text" placeholder="e.g. 22K Gold Chain" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div>
            <label className="gl-input-label">Item Photo</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {image ? (
                <img src={image} className="gl-image-pop" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", border: "1px solid #E8DFD1" }} alt="Preview" />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 8, background: "#F5F0E6", display: "flex", alignItems: "center", justifyContent: "center", color: "#A8A29E" }}>
                  <Camera size={20} />
                </div>
              )}
              <button className="gl-btn-ghost gl-btn-sm" onClick={() => fileRef.current?.click()} style={{ borderColor: "#E5C378", color: "#B8860B" }}>
                {image ? "Change Photo" : "Upload Photo"}
              </button>
              {image && (
                <button
                  type="button"
                  className="gl-btn-ghost gl-btn-sm"
                  onClick={() => setImage(null)}
                  style={{
                    borderColor: "#FECACA",
                    color: "#DC2626",
                    background: "#FEF2F2",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    padding: "5px 10px",
                    lineHeight: 1
                  }}
                >
                  <X size={13} style={{ display: "block", flexShrink: 0 }} />
                  <span style={{ display: "inline-block", lineHeight: 1 }}>Remove</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14, paddingTop: 14, borderTop: "1px solid #F0EAE1", flexShrink: 0 }}>
          <button className="gl-btn-ghost" onClick={onClose} style={{ padding: "8px 16px" }}>
            Cancel
          </button>
          <button className="gl-btn" onClick={handleSave} style={{ padding: "8px 20px" }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
}
