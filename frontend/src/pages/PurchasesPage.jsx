import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Coins, Pencil, Trash2, TrendingUp, TrendingDown, Eye, X, FilterX, Plus } from "lucide-react";
import { inr, fmtDate, compareEntriesDesc, compareEntriesAsc } from "../utils/goldHelpers";
import TablePagination from "../components/TablePagination";
import CustomSelect from "../components/CustomSelect";
import EmptyState from "../components/EmptyState";

export default function PurchasesPage({ purchases, rateForDate, kachaPerGram, persistPurchases, allPurchases, requestConfirm, onEdit, sortOrder = "desc", onToggleSold }) {
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState("25");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingPurchase, setViewingPurchase] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const performDelete = (p) => {
    setDeletingId(p.id);
    setTimeout(() => {
      persistPurchases(allPurchases.filter((x) => String(x.id) !== String(p.id)));
      setDeletingId(null);
    }, 280);
  };

  const deleteItem = (p) => {
    if (requestConfirm) {
      requestConfirm({
        title: "Delete Purchase Entry?",
        message: `Are you sure you want to delete this purchase entry of ${p.grams.toFixed(2)}g (${inr(p.ratePaid)}/g)? This entry will be permanently removed.`,
        confirmText: "Delete Entry",
        confirmVariant: "danger",
        onConfirm: () => performDelete(p)
      });
    } else if (window.confirm("Delete this purchase entry?")) {
      performDelete(p);
    }
  };

  const sortedPurchasesList = useMemo(() => {
    const list = [...purchases];
    return sortOrder === "asc" ? list.sort(compareEntriesAsc) : list.sort(compareEntriesDesc);
  }, [purchases, sortOrder]);

  const paginatedPurchases = useMemo(() => {
    if (pageSize === "all") return sortedPurchasesList;
    const ps = parseInt(pageSize) || 25;
    const start = (currentPage - 1) * ps;
    return sortedPurchasesList.slice(start, start + ps);
  }, [sortedPurchasesList, pageSize, currentPage]);

  if (!purchases.length) {
    const hasAnyPurchases = allPurchases && allPurchases.length > 0;
    return (
      <EmptyState
        icon={hasAnyPurchases ? FilterX : Coins}
        iconColor={hasAnyPurchases ? "#2563EB" : "#B8860B"}
        iconBg={hasAnyPurchases ? "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)" : "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)"}
        badge={hasAnyPurchases ? "Filter Active • No Matches" : "Gold Portfolio Ledger"}
        title={hasAnyPurchases ? "No Purchases In Selected Date Filter" : "Your Gold Ledger is Empty"}
        subtitle={
          hasAnyPurchases
            ? "There are no purchase entries recorded for this time range. Switch your date filter toolbar above to 'All Time' or select a different date range."
            : "You haven't logged any gold purchases yet. Record your gold purchases to track lot weights, purchase prices, live margins, and sell advice."
        }
        primaryAction={{
          label: hasAnyPurchases ? "Add New Gold Purchase" : "Add Your First Gold Lot",
          icon: Plus,
          onClick: () => navigate("/add")
        }}
        showHighlights={!hasAnyPurchases}
      />
    );
  }

  return (
    <div className="gl-card">
      <div className="gl-section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <span>Purchase Log & History</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569" }}>
          <CustomSelect
            prefix="Show:"
            options={[
              { value: "25", label: "25 per page" },
              { value: "50", label: "50 per page" },
              { value: "100", label: "100 per page" },
              { value: "all", label: `Show All (${purchases.length})` }
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

      {/* Desktop Table View */}
      <div className="gl-desktop-table-wrap gl-table-wrapper">
        <table className="gl-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Date</th>
              <th>Weight</th>
              <th>Buy Price</th>
              <th>Bought Kacha</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPurchases.map((p) => {
              const boughtKacha = p.kachaAtPurchase !== undefined && p.kachaAtPurchase !== null ? p.kachaAtPurchase : (p.ratePaid || null);
              const displayBuyPrice = p.overallPrice ? p.overallPrice : (p.grams && p.ratePaid ? Math.round(p.grams * (p.ratePaid > 50000 ? p.ratePaid / 10 : p.ratePaid)) : 0);

              return (
                <tr
                  key={p.id}
                  className={deletingId === p.id ? "gl-row-deleting" : ""}
                  style={{
                    background: p.isSold ? "#F8FAFC" : "transparent",
                    opacity: p.isSold ? 0.75 : 1,
                    transition: "background-color 0.25s ease, opacity 0.25s ease"
                  }}
                >
                  <td style={{ cursor: "pointer" }} onClick={() => setViewingPurchase(p)} title="Click to view details">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} className="gl-thumb" alt="Gold photo" />
                    ) : (
                      <div className="gl-thumb-placeholder"><Coins size={18} /></div>
                    )}
                  </td>
                  <td>
                    <div
                      style={{ fontWeight: 800, color: "#0F172A", fontSize: "14px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                      onClick={() => setViewingPurchase(p)}
                      title="Click to view details"
                    >
                      {fmtDate(p.date)}
                      {p.isSold && (
                        <span style={{ background: "#DCFCE7", color: "#15803D", border: "1px solid #86EFAC", fontSize: 10, padding: "1px 6px", borderRadius: 3, fontWeight: 900 }}>
                          SOLD
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>{p.notes || "—"}</div>
                  </td>
                  <td style={{ fontWeight: 800, color: "#D97706", fontSize: "14px" }}>{p.grams.toFixed(2)} g</td>
                  <td style={{ fontWeight: 700, fontSize: "14px" }}>{inr(displayBuyPrice)}</td>
                  <td style={{ fontWeight: 700, fontSize: "14px", color: "#059669" }}>{boughtKacha ? inr(boughtKacha) : "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <button
                        className="gl-btn-ghost gl-btn-sm"
                        onClick={() => setViewingPurchase(p)}
                        style={{ color: "#2563EB", padding: "5px 8px", border: "1px solid #BFDBFE", background: "#EFF6FF", borderRadius: 6 }}
                        title="View Full Details"
                      >
                        <Eye size={13} />
                      </button>
                      {p.isSold ? (
                        <button
                          className="gl-btn-ghost gl-btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSold && onToggleSold(p.id);
                          }}
                          style={{ color: "#DC2626", borderColor: "#FCA5A5", background: "#FEF2F2", fontWeight: 800, padding: "4px 8px", fontSize: "11px", borderRadius: 6 }}
                          title="Click to mark back as Active"
                        >
                          SOLD (Active?)
                        </button>
                      ) : (
                        <button
                          className="gl-btn-ghost gl-btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSold && onToggleSold(p.id);
                          }}
                          style={{ color: "#DC2626", borderColor: "#FCA5A5", background: "#FEF2F2", fontWeight: 800, padding: "4px 8px", fontSize: "11px", borderRadius: 6 }}
                          title="Mark lot as Sold (removes from Sell Signals)"
                        >
                          Sold
                        </button>
                      )}
                      <button className="gl-btn-ghost gl-btn-sm" onClick={() => onEdit && onEdit(p)} style={{ color: "#D97706", padding: "5px 8px", border: "1px solid #CBD5E1", background: "#FFFFFF", borderRadius: 6 }} title="Edit Entry">
                        <Pencil size={13} />
                      </button>
                      <button className="gl-btn-ghost gl-btn-sm" onClick={() => deleteItem(p)} style={{ color: "#DC2626", padding: "5px 8px", border: "1px solid #FCA5A5", background: "#FEF2F2", borderRadius: 6 }} title="Delete Entry">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="gl-excel-total-row">
              <td colSpan={2} style={{ fontWeight: 800, textTransform: "uppercase" }}>TOTAL SUMMARY ({purchases.length} LOTS)</td>
              <td style={{ fontWeight: 800, color: "#059669", fontSize: "14px" }}>{purchases.reduce((s, p) => s + (p.grams || 0), 0).toFixed(2)} g</td>
              <td style={{ fontWeight: 800, fontSize: "14px" }}>{inr(purchases.reduce((s, p) => s + (p.overallPrice || ((p.grams || 0) * (p.ratePaid || 0))), 0))}</td>
              <td>—</td>
              <td>—</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className="gl-mobile-cards-list">
        {paginatedPurchases.map((p) => {
          const boughtKacha = p.kachaAtPurchase !== undefined && p.kachaAtPurchase !== null ? p.kachaAtPurchase : (p.ratePaid || null);
          const displayBuyPrice = p.overallPrice ? p.overallPrice : (p.grams && p.ratePaid ? Math.round(p.grams * (p.ratePaid > 50000 ? p.ratePaid / 10 : p.ratePaid)) : 0);

          return (
            <div
              key={p.id}
              className={`gl-mobile-card ${deletingId === p.id ? "gl-row-deleting" : ""}`}
              style={{
                opacity: p.isSold ? 0.75 : 1,
                transition: "background-color 0.25s ease, opacity 0.25s ease"
              }}
            >
              <div className="gl-mobile-card-header">
                <div style={{ display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" }} onClick={() => setViewingPurchase(p)}>
                  {p.thumbnail ? (
                    <img src={p.thumbnail} className="gl-thumb" alt="Gold photo" />
                  ) : (
                    <div className="gl-thumb-placeholder"><Coins size={18} /></div>
                  )}
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#B8860B", display: "flex", alignItems: "center", gap: 6 }}>
                      {p.grams.toFixed(2)} g
                      {p.isSold && (
                        <span style={{ background: "#DCFCE7", color: "#15803D", border: "1px solid #86EFAC", fontSize: 10, padding: "1px 5px", borderRadius: 3, fontWeight: 900 }}>
                          SOLD
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#78716C" }}>{fmtDate(p.date)} · {p.notes || "—"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <button
                    className="gl-btn-ghost gl-btn-sm"
                    onClick={() => setViewingPurchase(p)}
                    style={{ color: "#2563EB", padding: "5px 8px", border: "1px solid #BFDBFE", background: "#EFF6FF", borderRadius: 6 }}
                    title="View Details"
                  >
                    <Eye size={13} />
                  </button>
                  {p.isSold ? (
                    <button
                      className="gl-btn-ghost gl-btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSold && onToggleSold(p.id);
                      }}
                      style={{ color: "#DC2626", borderColor: "#FCA5A5", background: "#FEF2F2", fontWeight: 800, padding: "4px 8px", fontSize: "11px", borderRadius: 6 }}
                    >
                      SOLD
                    </button>
                  ) : (
                    <button
                      className="gl-btn-ghost gl-btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSold && onToggleSold(p.id);
                      }}
                      style={{ color: "#DC2626", borderColor: "#FCA5A5", background: "#FEF2F2", fontWeight: 800, padding: "4px 8px", fontSize: "11px", borderRadius: 6 }}
                    >
                      Sold
                    </button>
                  )}
                  <button className="gl-btn-ghost gl-btn-sm" onClick={() => onEdit && onEdit(p)} style={{ color: "#B8860B", padding: "6px 8px" }}>
                    <Pencil size={14} />
                  </button>
                  <button className="gl-btn-ghost gl-btn-sm" onClick={() => deleteItem(p)} style={{ color: "#B91C1C", padding: "6px 8px" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="gl-mobile-card-row">
                <span className="gl-label">Buy Price:</span>
                <span className="gl-value">{inr(displayBuyPrice)}</span>
              </div>
              <div className="gl-mobile-card-row">
                <span className="gl-label">Bought Kacha:</span>
                <span className="gl-value" style={{ color: "#15803D", fontWeight: 800 }}>{boughtKacha ? inr(boughtKacha) : "—"}</span>
              </div>
            </div>
          );
        })}
      </div>

      <TablePagination
        totalItems={purchases.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />

      {/* View Purchase Details Modal */}
      {viewingPurchase && (
        <div className="gl-modal-overlay" onClick={() => setViewingPurchase(null)}>
          <div className="gl-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="gl-modal-handle" />

            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, borderBottom: "1px solid #E2E8F0", paddingBottom: 12, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ background: "#ECFDF5", width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#059669", flexShrink: 0 }}>
                  <Coins size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0F172A", fontFamily: "'Montserrat', sans-serif" }}>Purchase Entry Details</h3>
                  <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Logged on {fmtDate(viewingPurchase.date)}</span>
                </div>
              </div>
              <button
                onClick={() => setViewingPurchase(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B", padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 2, overscrollBehavior: "contain" }}>
              {/* Photo Preview if exists */}
              {viewingPurchase.thumbnail ? (
                <div style={{ width: "100%", height: "180px", borderRadius: "12px", overflow: "hidden", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #E2E8F0", flexShrink: 0 }}>
                  <img src={viewingPurchase.thumbnail} alt="Gold Purchase" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
              ) : null}

              {/* Status Badge */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: viewingPurchase.isSold ? "#F1F5F9" : "#ECFDF5", borderRadius: "10px", border: viewingPurchase.isSold ? "1px solid #CBD5E1" : "1px solid #A7F3D0" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: viewingPurchase.isSold ? "#475569" : "#047857" }}>Portfolio Status</span>
                <span style={{ fontSize: "11px", fontWeight: 900, background: viewingPurchase.isSold ? "#94A3B8" : "#059669", color: "#FFFFFF", padding: "3px 10px", borderRadius: "20px" }}>
                  {viewingPurchase.isSold ? "SOLD LOT" : "ACTIVE IN PORTFOLIO"}
                </span>
              </div>

              {/* Grid Metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Gold Weight</div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#D97706", marginTop: 2 }}>{viewingPurchase.grams.toFixed(2)} g</div>
                </div>

                <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Total Buy Price</div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
                    {inr(viewingPurchase.overallPrice || (viewingPurchase.grams * (viewingPurchase.ratePaid > 50000 ? viewingPurchase.ratePaid / 10 : viewingPurchase.ratePaid)))}
                  </div>
                </div>

                <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Bought Kacha Rate</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#059669", marginTop: 2 }}>
                    {viewingPurchase.kachaAtPurchase || viewingPurchase.ratePaid ? inr(viewingPurchase.kachaAtPurchase || viewingPurchase.ratePaid) : "—"}
                  </div>
                </div>

                <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Effective Per Gram</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
                    {inr(Math.round((viewingPurchase.overallPrice || (viewingPurchase.grams * (viewingPurchase.ratePaid > 50000 ? viewingPurchase.ratePaid / 10 : viewingPurchase.ratePaid))) / viewingPurchase.grams))} / g
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingPurchase.notes && (
                <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: 4 }}>Notes / Remarks</div>
                  <div style={{ fontSize: "13px", color: "#334155", fontWeight: 600 }}>{viewingPurchase.notes}</div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: 14, paddingTop: 12, borderTop: "1px solid #E2E8F0", flexShrink: 0 }}>
              <button
                onClick={() => {
                  const itemToEdit = viewingPurchase;
                  setViewingPurchase(null);
                  if (onEdit) onEdit(itemToEdit);
                }}
                className="gl-btn-ghost gl-btn-sm"
                style={{ color: "#D97706", border: "1px solid #CBD5E1", background: "#FFFFFF", padding: "8px 14px", fontWeight: 700, borderRadius: 8 }}
              >
                <Pencil size={13} style={{ marginRight: 4 }} /> Edit Entry
              </button>
              <button
                onClick={() => setViewingPurchase(null)}
                className="gl-btn-primary gl-btn-sm"
                style={{ padding: "8px 18px", fontWeight: 800, borderRadius: 8, background: "#059669", color: "#FFFFFF", border: "none", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
