"use client";

import React, { useState, useEffect } from "react";
import { Download, Search, Trash2, Edit3, Eye, Copy, Check, FileSpreadsheet, Building2, Phone, Mail, Globe, MapPin, CheckSquare, Square, MinusSquare, LayoutGrid, Table as TableIcon } from "lucide-react";
import confetti from "canvas-confetti";
import { getCSVDownloadUrl, getSingleCardCSVUrl, getImageUrl } from "../utils/api";

export default function CardsTable({
  cards = [],
  onSelectCard,
  onDeleteCard,
  onClearAll
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewMode, setViewMode] = useState("auto"); // "auto" | "cards" | "table"
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const effectiveViewMode = viewMode === "auto" ? (isMobileScreen ? "cards" : "table") : viewMode;

  // Filter cards by search term
  const filteredCards = cards.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.company && c.company.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      (c.raw_text && c.raw_text.toLowerCase().includes(q))
    );
  });

  // Toggle selection for a single card
  const toggleSelectCard = (cardId, e) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  // Toggle select all filtered cards
  const toggleSelectAll = () => {
    const allFilteredIds = filteredCards.map((c) => c.id);
    const allSelected = allFilteredIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const isAllSelected = filteredCards.length > 0 && filteredCards.every((c) => selectedIds.includes(c.id));
  const isPartiallySelected = filteredCards.some((c) => selectedIds.includes(c.id)) && !isAllSelected;

  // Download All Cards as CSV
  const handleDownloadAll = () => {
    if (cards.length === 0) return;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.3 },
      colors: ['#6366f1', '#10b981', '#06b6d4', '#f59e0b']
    });
    window.location.href = getCSVDownloadUrl();
  };

  // Download Specific Selected Cards as CSV
  const handleDownloadSelected = () => {
    if (selectedIds.length === 0) return;
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.3 },
      colors: ['#10b981', '#6366f1', '#3b82f6', '#f59e0b']
    });
    window.location.href = getCSVDownloadUrl(selectedIds);
  };

  // Download a Single Specific Card as CSV
  const handleDownloadSingleCard = (cardId, e) => {
    e.stopPropagation();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.35 },
      colors: ['#10b981', '#34d399', '#6366f1']
    });
    window.location.href = getSingleCardCSVUrl(cardId);
  };

  const copyCSVToClipboard = async () => {
    if (cards.length === 0) return;
    try {
      const url = selectedIds.length > 0 ? getCSVDownloadUrl(selectedIds) : getCSVDownloadUrl();
      const res = await fetch(url);
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedCsv(true);
      setTimeout(() => setCopiedCsv(false), 2000);
    } catch (err) {
      alert("Failed to copy CSV: " + err.message);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected cards from CSV?`)) {
      for (const id of selectedIds) {
        await onDeleteCard(id);
      }
      setSelectedIds([]);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: "16px" }}>
      {/* Header Bar */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        marginBottom: 16
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{
              width: 34,
              height: 34,
              minWidth: 34,
              borderRadius: "var(--radius-sm)",
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <FileSpreadsheet size={18} color="#818cf8" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, whiteSpace: "nowrap" }}>Scanned Cards</h2>
                <span className="badge badge-primary" style={{ fontSize: 10, padding: "1px 6px" }}>{cards.length} Recorded</span>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Auto-saved sequentially to master CSV file
              </p>
            </div>
          </div>

          {/* View Mode Switcher (Cards vs Table) */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
            <button
              onClick={() => setViewMode(effectiveViewMode === "cards" ? "table" : "cards")}
              className="btn btn-secondary btn-sm"
              style={{ padding: "5px 9px", minHeight: 32, fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}
              title={effectiveViewMode === "cards" ? "Switch to Table View" : "Switch to Card View"}
            >
              {effectiveViewMode === "cards" ? <TableIcon size={13} /> : <LayoutGrid size={13} />}
              <span>{effectiveViewMode === "cards" ? "Table View" : "Card View"}</span>
            </button>
          </div>
        </div>

        {/* Search & Global Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", width: "100%" }}>
          {/* Search Box */}
          <div style={{ position: "relative", flex: "1 1 180px", minWidth: 150 }}>
            <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 30, fontSize: 12, height: 36 }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {/* Copy CSV */}
            <button
              onClick={copyCSVToClipboard}
              disabled={cards.length === 0}
              className="btn btn-secondary btn-sm"
              title="Copy CSV to clipboard"
              style={{ padding: "6px 10px", minHeight: 36, fontSize: 12 }}
            >
              {copiedCsv ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              <span>{copiedCsv ? "Copied" : selectedIds.length > 0 ? `Copy (${selectedIds.length})` : "Copy CSV"}</span>
            </button>

            {/* Download All CSV */}
            <button
              onClick={handleDownloadAll}
              disabled={cards.length === 0}
              className="btn btn-emerald btn-sm"
              title="Download full CSV with all cards"
              style={{ padding: "6px 10px", minHeight: 36, fontSize: 12 }}
            >
              <Download size={13} />
              <span>All CSV</span>
            </button>

            {/* Clear All */}
            {cards.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to clear all scanned cards?")) {
                    onClearAll();
                    setSelectedIds([]);
                  }
                }}
                className="btn btn-danger btn-sm"
                title="Clear all cards"
                style={{ padding: "6px 10px", minHeight: 36 }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Selection Banner when specific cards are selected */}
      {selectedIds.length > 0 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          padding: "10px 14px",
          background: "linear-gradient(90deg, rgba(16, 185, 129, 0.15), rgba(99, 102, 241, 0.15))",
          border: "1px solid rgba(16, 185, 129, 0.35)",
          borderRadius: "var(--radius-md)",
          marginBottom: 14
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="badge badge-emerald" style={{ fontSize: 11, padding: "2px 7px" }}>
              {selectedIds.length} of {cards.length} Selected
            </span>
            <span className="hide-on-small-mobile" style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>
              Specific export ready
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", width: "100%", maxWidth: 360 }}>
            <button
              onClick={handleDownloadSelected}
              className="btn btn-emerald btn-sm"
              style={{ fontWeight: 700, flex: "1 1 auto", minHeight: 32, fontSize: 11 }}
              title="Download CSV containing only the checked cards"
            >
              <Download size={13} />
              <span>Export ({selectedIds.length}) CSV</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 11, minHeight: 32 }}
            >
              Deselect
            </button>

            <button
              onClick={handleDeleteSelected}
              className="btn btn-danger btn-sm"
              style={{ fontSize: 11, minHeight: 32 }}
              title="Delete selected cards"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      {cards.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 16px" }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px auto"
          }}>
            <FileSpreadsheet size={26} color="var(--text-dim)" />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-main)", marginBottom: 4 }}>
            No Business Cards Scanned Yet
          </h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 320, margin: "0 auto" }}>
            Scan cards using your camera or upload files to populate the database and CSV.
          </p>
        </div>
      ) : effectiveViewMode === "cards" ? (
        /* Mobile / Cards View */
        <div>
          {/* Select all bar for card view */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 10px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "var(--radius-sm)",
            marginBottom: 10,
            fontSize: 12
          }}>
            <button
              onClick={toggleSelectAll}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: isAllSelected ? "#10b981" : "var(--text-muted)",
                fontSize: 12,
                fontWeight: 600
              }}
            >
              {isAllSelected ? (
                <CheckSquare size={16} color="#10b981" />
              ) : isPartiallySelected ? (
                <MinusSquare size={16} color="#818cf8" />
              ) : (
                <Square size={16} />
              )}
              <span>{isAllSelected ? "Deselect All Cards" : "Select All Cards"}</span>
            </button>
            <span style={{ color: "var(--text-dim)", fontSize: 11 }}>
              {filteredCards.length} {filteredCards.length === 1 ? "card" : "cards"}
            </span>
          </div>

          {/* Cards List Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            {filteredCards.map((card, idx) => {
              const isSelected = selectedIds.includes(card.id);
              return (
                <div
                  key={card.id || idx}
                  className={`mobile-card-item ${isSelected ? "selected" : ""}`}
                  style={{
                    border: `1px solid ${isSelected ? "rgba(16, 185, 129, 0.4)" : "var(--border-subtle)"}`,
                    borderRadius: "var(--radius-md)",
                    background: isSelected ? "rgba(16, 185, 129, 0.08)" : "rgba(15, 23, 42, 0.6)",
                    padding: 12
                  }}
                >
                  {/* Card Header: Checkbox + Thumbnail + Name/Title */}
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                    {/* Row Checkbox */}
                    <button
                      onClick={(e) => toggleSelectCard(card.id, e)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px 2px",
                        color: isSelected ? "#10b981" : "var(--text-dim)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      title={isSelected ? "Uncheck card" : "Check card for export"}
                    >
                      {isSelected ? <CheckSquare size={18} color="#10b981" /> : <Square size={18} />}
                    </button>

                    {/* Thumbnail */}
                    {card.image_url ? (
                      <div
                        onClick={() => onSelectCard(card)}
                        style={{
                          width: 54,
                          height: 36,
                          minWidth: 54,
                          borderRadius: 6,
                          overflow: "hidden",
                          background: "#000",
                          border: `1px solid ${isSelected ? "#10b981" : "var(--border-subtle)"}`,
                          cursor: "pointer"
                        }}
                        title="Click to view full card"
                      >
                        <img
                          src={getImageUrl(card.image_url)}
                          alt="Card"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    ) : null}

                    {/* Name, Title, Badges */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: "var(--text-main)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {card.name || <span style={{ color: "var(--text-dim)", fontStyle: "italic" }}>Not detected</span>}
                        </span>
                        {card.confidence > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: card.confidence >= 90 ? "#34d399" : "#fbbf24", flexShrink: 0 }}>
                            {card.confidence}%
                          </span>
                        )}
                      </div>

                      {card.title && (
                        <div style={{
                          color: "#818cf8",
                          fontSize: 11,
                          marginTop: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {card.title}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                        {card.engine?.includes("gemini") ? (
                          <span className="badge badge-emerald" style={{ fontSize: 9, padding: "1px 5px" }}>🧠 Gemini</span>
                        ) : card.engine?.includes("apple_vision") ? (
                          <span className="badge badge-primary" style={{ fontSize: 9, padding: "1px 5px" }}>⚡ Vision ML</span>
                        ) : null}
                        {card.card_detected && (
                          <span className="badge" style={{ fontSize: 9, padding: "1px 5px", background: "rgba(16, 185, 129, 0.15)", color: "#34d399", borderColor: "rgba(16, 185, 129, 0.3)" }}>
                            📐 Dewarped
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Body details */}
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    fontSize: 12,
                    padding: "8px 10px",
                    background: "rgba(0, 0, 0, 0.25)",
                    borderRadius: "var(--radius-sm)",
                    marginBottom: 8
                  }}>
                    {card.company && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-main)" }}>
                        <Building2 size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {card.company}
                        </span>
                      </div>
                    )}
                    {card.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#34d399", fontWeight: 600 }}>
                        <Phone size={12} style={{ flexShrink: 0 }} />
                        <a href={`tel:${card.phone}`} style={{ color: "inherit", textDecoration: "none" }}>{card.phone}</a>
                      </div>
                    )}
                    {card.email && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#60a5fa" }}>
                        <Mail size={12} style={{ flexShrink: 0 }} />
                        <a href={`mailto:${card.email}`} style={{ color: "inherit", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.email}</a>
                      </div>
                    )}
                    {card.website && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 11 }}>
                        <Globe size={11} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.website}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Card Action Buttons */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button
                      onClick={(e) => handleDownloadSingleCard(card.id, e)}
                      className="btn btn-emerald btn-sm"
                      style={{ flex: 1, padding: "5px 8px", fontSize: 11, minHeight: 32 }}
                      title="Download this card as CSV"
                    >
                      <Download size={12} />
                      <span>CSV</span>
                    </button>
                    <button
                      onClick={() => onSelectCard(card)}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, padding: "5px 8px", fontSize: 11, minHeight: 32 }}
                      title="View & Edit"
                    >
                      <Eye size={12} />
                      <span>Details</span>
                    </button>
                    <button
                      onClick={() => onDeleteCard(card.id)}
                      className="btn btn-danger btn-sm"
                      style={{ padding: "5px 9px", minHeight: 32 }}
                      title="Delete card"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Traditional Desktop Data Table */
        <div style={{ overflowX: "auto", margin: "0 -16px", padding: "0 16px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13, minWidth: 680 }}>
            <thead>
              <tr style={{
                borderBottom: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                {/* Select All Checkbox */}
                <th style={{ padding: "10px 12px", width: 36, textAlign: "center" }}>
                  <button
                    onClick={toggleSelectAll}
                    style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: isAllSelected ? "#10b981" : "var(--text-dim)", padding: 0 }}
                    title={isAllSelected ? "Deselect all cards" : "Select all cards for export"}
                  >
                    {isAllSelected ? (
                      <CheckSquare size={17} color="#10b981" />
                    ) : isPartiallySelected ? (
                      <MinusSquare size={17} color="#818cf8" />
                    ) : (
                      <Square size={17} />
                    )}
                  </button>
                </th>
                <th style={{ padding: "10px 14px" }}>Card</th>
                <th style={{ padding: "10px 14px" }}>Name / Title</th>
                <th style={{ padding: "10px 14px" }}>Company</th>
                <th style={{ padding: "10px 14px" }}>Phone</th>
                <th style={{ padding: "10px 14px" }}>Email</th>
                <th style={{ padding: "10px 14px" }}>Website & Address</th>
                <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map((card, idx) => {
                const isSelected = selectedIds.includes(card.id);
                return (
                  <tr
                    key={card.id || idx}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      background: isSelected
                        ? "rgba(16, 185, 129, 0.08)"
                        : idx % 2 === 0
                        ? "transparent"
                        : "rgba(255, 255, 255, 0.015)",
                      transition: "background 0.15s ease"
                    }}
                  >
                    {/* Row Checkbox */}
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <button
                        onClick={(e) => toggleSelectCard(card.id, e)}
                        style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: isSelected ? "#10b981" : "var(--text-dim)", padding: 0 }}
                        title={isSelected ? "Uncheck card" : "Check card for specific export"}
                      >
                        {isSelected ? <CheckSquare size={16} color="#10b981" /> : <Square size={16} />}
                      </button>
                    </td>

                    {/* Thumbnail */}
                    <td style={{ padding: "10px 14px" }}>
                      {card.image_url ? (
                        <div
                          onClick={() => onSelectCard(card)}
                          style={{
                            width: 52,
                            height: 32,
                            borderRadius: 4,
                            overflow: "hidden",
                            background: "#000",
                            border: `1px solid ${isSelected ? "#10b981" : "var(--border-subtle)"}`,
                            cursor: "pointer"
                          }}
                          title="Click to view full card"
                        >
                          <img
                            src={getImageUrl(card.image_url)}
                            alt="Card"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                      ) : (
                        <div style={{
                          width: 52,
                          height: 32,
                          borderRadius: 4,
                          background: "rgba(255, 255, 255, 0.05)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          color: "var(--text-dim)"
                        }}>
                          CARD
                        </div>
                      )}
                    </td>

                    {/* Name & Title */}
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, color: "var(--text-main)", fontSize: 13 }}>
                          {card.name || <span style={{ color: "var(--text-dim)", fontStyle: "italic" }}>Not detected</span>}
                        </span>
                        {card.engine?.includes("gemini") ? (
                          <span className="badge badge-emerald" style={{ fontSize: 9, padding: "1px 5px" }}>🧠 Gemini</span>
                        ) : card.engine?.includes("apple_vision") ? (
                          <span className="badge badge-primary" style={{ fontSize: 9, padding: "1px 5px" }}>⚡ Neural ML</span>
                        ) : null}
                        {card.card_detected && (
                          <span className="badge" style={{ fontSize: 9, padding: "1px 5px", background: "rgba(16, 185, 129, 0.15)", color: "#34d399", borderColor: "rgba(16, 185, 129, 0.3)" }}>
                            📐 Dewarped
                          </span>
                        )}
                        {card.confidence > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: card.confidence >= 90 ? "#34d399" : "#fbbf24" }}>
                            {card.confidence}%
                          </span>
                        )}
                      </div>
                      {card.title && (
                        <div style={{ color: "#818cf8", fontSize: 11, marginTop: 2 }}>
                          {card.title}
                        </div>
                      )}
                    </td>

                    {/* Company */}
                    <td style={{ padding: "10px 14px", color: "var(--text-main)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Building2 size={13} color="var(--text-muted)" />
                        <span style={{ fontWeight: 600 }}>{card.company || "—"}</span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      {card.phone ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#34d399", fontWeight: 600 }}>
                          <Phone size={13} />
                          <a href={`tel:${card.phone}`} style={{ color: "inherit", textDecoration: "none" }}>{card.phone}</a>
                        </div>
                      ) : "—"}
                    </td>

                    {/* Email */}
                    <td style={{ padding: "10px 14px" }}>
                      {card.email ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#60a5fa" }}>
                          <Mail size={13} />
                          <a href={`mailto:${card.email}`} style={{ color: "inherit", textDecoration: "none" }}>{card.email}</a>
                        </div>
                      ) : "—"}
                    </td>

                    {/* Website & Address */}
                    <td style={{ padding: "10px 14px", maxWidth: 220 }}>
                      {card.website && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-muted)", fontSize: 11 }}>
                          <Globe size={11} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {card.website}
                          </span>
                        </div>
                      )}
                      {card.address && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-dim)", fontSize: 11, marginTop: 2 }}>
                          <MapPin size={11} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {card.address}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 5 }}>
                        <button
                          onClick={(e) => handleDownloadSingleCard(card.id, e)}
                          className="btn btn-emerald btn-sm"
                          style={{ padding: "5px 8px" }}
                          title="Download this specific card as CSV"
                        >
                          <Download size={13} />
                        </button>

                        <button
                          onClick={() => onSelectCard(card)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "5px 8px" }}
                          title="View Details & Edit"
                        >
                          <Eye size={13} />
                        </button>

                        <button
                          onClick={() => onDeleteCard(card.id)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: "5px 8px" }}
                          title="Delete Card"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
