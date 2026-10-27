"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Trash2, Copy, Check, ExternalLink, Image as ImageIcon, FileText, Zap, Sparkles, RefreshCw, ScanLine, Download, FileSpreadsheet } from "lucide-react";
import { updateCard, deleteCard, reparseCard, getImageUrl, getSingleCardCSVUrl, getSingleCardExcelUrl } from "../utils/api";


export default function CardDetailModal({ card, onClose, onUpdate, onDelete }) {
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  useEffect(() => {
    const check = () => setIsMobileScreen(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const [formData, setFormData] = useState({
    name: card?.name || "",
    title: card?.title || "",
    company: card?.company || "",
    phone: card?.phone || "",
    email: card?.email || "",
    website: card?.website || "",
    address: card?.address || "",
    other_details: card?.other_details || "",
    raw_text: card?.raw_text || ""
  });

  const [selectedImageTab, setSelectedImageTab] = useState(
    card?.dewarped_image_url ? "dewarped" : "original"
  );
  const [activeTab, setActiveTab] = useState("fields"); // 'fields' | 'raw'
  const [saving, setSaving] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);

  if (!card) return null;



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateCard(card.id, formData);
      if (onUpdate) onUpdate(res.card);
      onClose();
    } catch (err) {
      alert("Failed to save card: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this card from CSV?")) {
      try {
        await deleteCard(card.id);
        if (onDelete) onDelete(card.id);
        onClose();
      } catch (err) {
        alert("Failed to delete card: " + err.message);
      }
    }
  };

  const handleReparse = async (engineName) => {
    setReparsing(true);
    try {
      const res = await reparseCard(card.id, engineName);
      const updated = res.card;
      setFormData({
        name: updated.name || "",
        title: updated.title || "",
        company: updated.company || "",
        phone: updated.phone || "",
        email: updated.email || "",
        website: updated.website || "",
        address: updated.address || "",
        other_details: updated.other_details || "",
        raw_text: updated.raw_text || ""
      });
      if (onUpdate) onUpdate(updated);
    } catch (err) {
      alert("Failed to re-analyze: " + err.message);
    } finally {
      setReparsing(false);
    }
  };

  const copyRawToClipboard = async () => {
    await navigator.clipboard.writeText(formData.raw_text);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const currentImageUrl = selectedImageTab === "dewarped" && card.dewarped_image_url
    ? card.dewarped_image_url
    : (card.original_image_url || card.image_url);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(3, 7, 18, 0.82)",
      backdropFilter: "blur(12px)",
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: isMobileScreen ? 8 : 20
    }}>
      <div className="glass-panel" style={{
        width: "100%",
        maxWidth: 920,
        maxHeight: isMobileScreen ? "96vh" : "92vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.85)"
      }}>
        {/* Modal Header */}
        <div style={{
          padding: isMobileScreen ? "12px 16px" : "18px 24px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexWrap: "wrap" }}>
            <span className="badge badge-primary" style={{ fontSize: 10 }}>#{card.id}</span>
            <h3 style={{ fontSize: isMobileScreen ? 15 : 18, fontWeight: 700, whiteSpace: "nowrap" }}>Card Details</h3>
            {card.engine && (
              <span className={`badge ${card.engine.includes("gemini") ? "badge-emerald" : "badge-primary"}`} style={{ fontSize: 9, padding: "1px 6px" }}>
                {card.engine.includes("gemini") ? "🧠 Gemini" : "⚡ Vision ML"}
              </span>
            )}
            {card.card_detected && (
              <span className="badge hide-on-small-mobile" style={{ fontSize: 9, padding: "1px 6px", background: "rgba(16, 185, 129, 0.15)", color: "#34d399", borderColor: "rgba(16, 185, 129, 0.3)" }}>
                📐 Dewarped
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: "50%", width: 32, height: 32, minHeight: 32, padding: 0, flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobileScreen ? "1fr" : (currentImageUrl ? "1fr 1.35fr" : "1fr"),
          gap: isMobileScreen ? 16 : 24,
          padding: isMobileScreen ? 14 : 24,
          overflowY: "auto",
          flex: 1
        }}>
          {/* Card Image Preview Column */}
          {currentImageUrl && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <ImageIcon size={13} />
                  <span>Card Visual Preview</span>
                </div>

                {/* If both dewarped and original exist, provide switcher */}
                {card.dewarped_image_url && card.original_image_url && (
                  <div style={{ display: "flex", gap: 4, background: "rgba(255, 255, 255, 0.06)", padding: 2, borderRadius: 6 }}>
                    <button
                      onClick={() => setSelectedImageTab("dewarped")}
                      style={{
                        padding: "3px 8px",
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 4,
                        background: selectedImageTab === "dewarped" ? "rgba(16, 185, 129, 0.25)" : "transparent",
                        color: selectedImageTab === "dewarped" ? "#34d399" : "var(--text-dim)",
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      Dewarped
                    </button>
                    <button
                      onClick={() => setSelectedImageTab("original")}
                      style={{
                        padding: "3px 8px",
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 4,
                        background: selectedImageTab === "original" ? "rgba(99, 102, 241, 0.25)" : "transparent",
                        color: selectedImageTab === "original" ? "#818cf8" : "var(--text-dim)",
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      Original
                    </button>
                  </div>
                )}
              </div>

              <div style={{
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                border: "1px solid var(--border-subtle)",
                background: "#000000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)"
              }}>
                <img
                  src={getImageUrl(currentImageUrl)}
                  alt="Scanned card"
                  style={{ width: "100%", height: "auto", display: "block", objectFit: "contain" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "var(--text-dim)", marginTop: 10 }}>
                <span>Scanned: {card.scanned_at}</span>
                {card.confidence > 0 && (
                  <span style={{ color: card.confidence >= 90 ? "#34d399" : "#fbbf24", fontWeight: 700 }}>
                    Confidence: {card.confidence}%
                  </span>
                )}
              </div>

              {/* Re-analyze buttons */}
              <div style={{ marginTop: 16, padding: 12, borderRadius: "var(--radius-sm)", background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>
                  Re-Analyze with Engine:
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleReparse("apple_vision")}
                    disabled={reparsing}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, padding: "6px 8px", fontSize: 11 }}
                  >
                    <Zap size={12} color="#818cf8" />
                    <span>Apple Vision ML</span>
                  </button>
                  <button
                    onClick={() => handleReparse("gemini")}
                    disabled={reparsing}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, padding: "6px 8px", fontSize: 11 }}
                  >
                    <Sparkles size={12} color="#34d399" />
                    <span>Gemini AI</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields / Raw Text Column */}
          <div>
            {/* Tab switch */}
            <div style={{
              display: "flex",
              gap: 8,
              borderBottom: "1px solid var(--border-subtle)",
              paddingBottom: 10,
              marginBottom: 16
            }}>
              <button
                onClick={() => setActiveTab("fields")}
                className={`btn btn-sm ${activeTab === "fields" ? "btn-primary" : "btn-secondary"}`}
              >
                Structured Fields
              </button>
              <button
                onClick={() => setActiveTab("raw")}
                className={`btn btn-sm ${activeTab === "raw" ? "btn-primary" : "btn-secondary"}`}
              >
                <FileText size={13} />
                <span>Full Raw OCR Text (100% Verbatim)</span>
              </button>
            </div>

            {activeTab === "fields" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: isMobileScreen ? "1fr" : "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="e.g. Alexander Wright"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
                      Job Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="e.g. Chief Executive Officer"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g. Nova Dynamics Inc."
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobileScreen ? "1fr" : "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
                      Phone Number(s)
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="+1 (415) 890-2341"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
                      Email Address(es)
                    </label>
                    <input
                      type="text"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="alex@novadynamics.io"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
                    Website URL
                  </label>
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="www.novadynamics.io"
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
                    Physical Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    className="input-field"
                    placeholder="500 Howard St, Suite 400, San Francisco, CA 94105"
                    style={{ resize: "vertical" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
                    Other Details / Taglines / Notes
                  </label>
                  <input
                    type="text"
                    name="other_details"
                    value={formData.other_details}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Social handles, services, license numbers"
                  />
                </div>
              </div>
            ) : (
              /* Raw OCR Text View */
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Verbatim OCR text as extracted by the vision engine:
                  </span>
                  <button
                    onClick={copyRawToClipboard}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "4px 8px", fontSize: 11 }}
                  >
                    {copiedRaw ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    <span>{copiedRaw ? "Copied" : "Copy Raw"}</span>
                  </button>
                </div>
                <textarea
                  name="raw_text"
                  value={formData.raw_text}
                  onChange={handleChange}
                  rows={14}
                  className="input-field"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    lineHeight: 1.6,
                    resize: "vertical"
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: isMobileScreen ? "12px 14px" : "16px 24px",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: isMobileScreen ? "column-reverse" : "row",
          justifyContent: "space-between",
          alignItems: isMobileScreen ? "stretch" : "center",
          gap: 10,
          background: "rgba(15, 23, 42, 0.4)"
        }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", width: isMobileScreen ? "100%" : "auto" }}>
            <button
              onClick={handleDelete}
              className="btn btn-danger btn-sm"
              style={{ flex: isMobileScreen ? 1 : "initial", minHeight: 36, fontSize: 12 }}
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>

            <button
              onClick={() => {
                window.location.href = getSingleCardExcelUrl(card.id);
              }}
              className="btn btn-excel btn-sm"
              style={{ flex: isMobileScreen ? 1 : "initial", minHeight: 36, fontSize: 12, fontWeight: 700 }}
              title="Download this specific card as formatted Excel (.xlsx)"
            >
              <FileSpreadsheet size={13} />
              <span>Card Excel</span>
            </button>

            <button
              onClick={() => {
                window.location.href = getSingleCardCSVUrl(card.id);
              }}
              className="btn btn-secondary btn-sm"
              style={{ flex: isMobileScreen ? 1 : "initial", minHeight: 36, fontSize: 12 }}
              title="Download this specific card as an individual CSV"
            >
              <Download size={13} />
              <span>CSV</span>
            </button>
          </div>


          <div style={{ display: "flex", gap: 8, width: isMobileScreen ? "100%" : "auto" }}>
            <button
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: isMobileScreen ? 1 : "initial", minHeight: 38 }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
              style={{ flex: isMobileScreen ? 2 : "initial", minHeight: 38 }}
            >
              {saving ? <RefreshCw size={14} className="spinner" /> : <Save size={14} />}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
