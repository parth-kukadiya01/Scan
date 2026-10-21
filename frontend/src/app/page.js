"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import EngineSelectorBar from "../components/EngineSelectorBar";
import SettingsModal from "../components/SettingsModal";
import SampleCardsBanner from "../components/SampleCardsBanner";
import StatsBar from "../components/StatsBar";
import CameraScanner from "../components/CameraScanner";
import FileUploader from "../components/FileUploader";
import CardsTable from "../components/CardsTable";
import CardDetailModal from "../components/CardDetailModal";
import { fetchCards, deleteCard, clearAllCards, fetchConfig } from "../utils/api";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function HomePage() {
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [backendStatus, setBackendStatus] = useState("checking");
  const [toast, setToast] = useState(null);

  // ML Scanner Engine & Dewarp States
  const [selectedEngine, setSelectedEngine] = useState("apple_vision");
  const [autoDewarp, setAutoDewarp] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [config, setConfig] = useState({
    apple_vision_ml_available: true,
    gemini_available: false,
    default_engine: "apple_vision"
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadCards = async () => {
    try {
      setBackendStatus("checking");
      const [cardsData, configData] = await Promise.all([
        fetchCards(),
        fetchConfig().catch(() => null)
      ]);
      setCards(cardsData);
      if (configData) {
        setConfig(configData);
        if (!configData.apple_vision_ml_available && configData.default_engine) {
          setSelectedEngine(configData.default_engine);
        } else if (configData.gemini_available && selectedEngine === "auto") {
          setSelectedEngine("gemini");
        }
      }
      setBackendStatus("online");
    } catch (err) {
      console.warn("Could not connect to FastAPI backend:", err);
      setBackendStatus("offline");
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleCardScanned = (newCard) => {
    setCards((prev) => [newCard, ...prev.filter((c) => c.id !== newCard.id)]);
    const engineLabel = newCard.engine?.includes("gemini")
      ? "Google Gemini AI"
      : newCard.engine?.includes("apple_vision")
      ? "Apple Vision ML"
      : "ML Scanner";
    
    const dewarpNote = newCard.card_detected ? " (Dewarpped)" : "";
    showCardNotification(newCard, engineLabel, dewarpNote);
  };

  const showCardNotification = (newCard, engineLabel, dewarpNote) => {
    const contactName = newCard.name || newCard.company || "Contact";
    showToast(`"${contactName}" added to CSV via ${engineLabel}${dewarpNote}!`, "success");
  };

  const handleCardUpdated = (updatedCard) => {
    setCards((prev) =>
      prev.map((c) => (c.id === updatedCard.id ? updatedCard : c))
    );
    showToast("Card details updated in CSV!", "success");
  };

  const handleCardDeleted = async (cardId) => {
    try {
      await deleteCard(cardId);
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      showToast("Card removed from CSV", "info");
    } catch (err) {
      showToast("Failed to delete card: " + err.message, "error");
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllCards();
      setCards([]);
      showToast("All cards cleared from CSV", "info");
    } catch (err) {
      showToast("Failed to clear cards: " + err.message, "error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: "fixed",
          top: 76,
          right: 16,
          left: "auto",
          maxWidth: "calc(100vw - 32px)",
          zIndex: 100,
          background: toast.type === "error" ? "rgba(244, 63, 94, 0.96)" : "rgba(16, 185, 129, 0.96)",
          color: "#ffffff",
          padding: "10px 18px",
          borderRadius: "var(--radius-md)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 13,
          fontWeight: 600,
          animation: "pulseGlow 2s infinite"
        }}>
          {toast.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        cardCount={cards.length}
        onRefresh={loadCards}
        backendStatus={backendStatus}
      />

      {/* Main Content */}
      <main className="container" style={{ flex: 1, paddingBottom: 60, paddingTop: 16 }}>
        {/* ML Scanner Engine Selector Bar */}
        <EngineSelectorBar
          selectedEngine={selectedEngine}
          onSelectEngine={(eng) => {
            setSelectedEngine(eng);
            if (eng === "gemini" && !config.gemini_available) {
              setIsSettingsOpen(true);
            }
          }}
          autoDewarp={autoDewarp}
          onToggleDewarp={(val) => setAutoDewarp(val)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          geminiAvailable={config.gemini_available}
        />

        {/* Sample card test banner */}
        <SampleCardsBanner
          onCardScanned={handleCardScanned}
          onError={(msg) => showToast(msg, "error")}
          engine={selectedEngine}
          dewarp={autoDewarp}
        />

        {/* Real-time stats */}
        <StatsBar cards={cards} />

        {/* Scan Input Grid: Camera (Left) + Upload (Right) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: 20,
          marginBottom: 28
        }}>
          <CameraScanner
            onCardScanned={handleCardScanned}
            onError={(msg) => showToast(msg, "error")}
            engine={selectedEngine}
            dewarp={autoDewarp}
          />

          <FileUploader
            onCardScanned={handleCardScanned}
            onError={(msg) => showToast(msg, "error")}
            engine={selectedEngine}
            dewarp={autoDewarp}
          />
        </div>

        {/* Master CSV Scanned Cards Table */}
        <CardsTable
          cards={cards}
          onSelectCard={(c) => setSelectedCard(c)}
          onDeleteCard={handleCardDeleted}
          onClearAll={handleClearAll}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigSaved={loadCards}
      />

      {/* Detail / Verification Modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleCardUpdated}
          onDelete={handleCardDeleted}
        />
      )}

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border-subtle)",
        padding: "24px 20px",
        textAlign: "center",
        fontSize: 13,
        color: "var(--text-dim)",
        background: "rgba(9, 13, 22, 0.6)"
      }}>
        CardPulse Business Card Scanner • Apple Vision ML & Google Gemini AI + Next.js • RFC-4180 CSV
      </footer>
    </div>
  );
}
