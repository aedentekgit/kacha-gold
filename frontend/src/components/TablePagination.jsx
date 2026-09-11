import React, { useState, useEffect } from "react";
import CustomSelect from "./CustomSelect";

export default function TablePagination({ totalItems, currentPage, setCurrentPage, pageSize, setPageSize }) {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth <= 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (totalItems === 0) return null;

  const totalPages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(totalItems / (parseInt(pageSize) || 25)));
  const startItem = pageSize === "all" ? 1 : (currentPage - 1) * (parseInt(pageSize) || 25) + 1;
  const endItem = pageSize === "all" ? totalItems : Math.min(currentPage * (parseInt(pageSize) || 25), totalItems);

  return (
    <div style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      justifyContent: "space-between",
      alignItems: isMobile ? "stretch" : "center",
      gap: isMobile ? "10px" : "12px",
      marginTop: 16,
      marginBottom: isMobile ? 12 : 0,
      paddingTop: 12,
      borderTop: "1px solid #E2E8F0",
      fontSize: isMobile ? 12 : 12.5,
      color: "#475569"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: isMobile ? "space-between" : "flex-start", gap: 8, width: isMobile ? "100%" : "auto", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <CustomSelect
            prefix="Show:"
            dropUp={true}
            options={[
              { value: "25", label: "25 per page" },
              { value: "50", label: "50 per page" },
              { value: "100", label: "100 per page" },
              { value: "all", label: `Show All (${totalItems})` }
            ]}
            value={pageSize}
            onChange={(val) => {
              setPageSize(val);
              setCurrentPage(1);
            }}
            size="sm"
          />
        </div>

        <span style={{ fontSize: isMobile ? 11.5 : 12.5, color: "#64748B", fontWeight: 700 }}>
          Showing <strong style={{ color: "#0F172A" }}>{startItem}–{endItem}</strong> of <strong style={{ color: "#0F172A" }}>{totalItems}</strong> items
        </span>
      </div>

      {pageSize !== "all" && totalPages > 1 && (
        <div style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          justifyContent: isMobile ? "center" : "flex-end",
          width: isMobile ? "100%" : "auto",
          background: isMobile ? "#F8FAFC" : "transparent",
          padding: isMobile ? "8px 12px" : 0,
          borderRadius: isMobile ? 8 : 0,
          border: isMobile ? "1px solid #E2E8F0" : "none"
        }}>
          <button
            className="gl-filter-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            style={{
              padding: isMobile ? "6px 16px" : "4px 10px",
              fontSize: 12,
              fontWeight: 800,
              borderRadius: 6,
              border: "1px solid #CBD5E1",
              background: "#FFFFFF",
              color: "#0F172A",
              cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              opacity: currentPage <= 1 ? 0.4 : 1
            }}
          >
            Previous
          </button>

          <span style={{ fontSize: 12, fontWeight: 900, padding: "0 8px", color: "#107C41" }}>
            {currentPage} / {totalPages}
          </span>

          <button
            className="gl-filter-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            style={{
              padding: isMobile ? "6px 16px" : "4px 10px",
              fontSize: 12,
              fontWeight: 800,
              borderRadius: 6,
              border: "1px solid #CBD5E1",
              background: "#FFFFFF",
              color: "#0F172A",
              cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              opacity: currentPage >= totalPages ? 0.4 : 1
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
