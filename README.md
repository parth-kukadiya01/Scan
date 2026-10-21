# CardPulse - Smart ML Business Card Scanner & CSV Exporter

An intelligent, full-stack Business Card Scanner application powered by **Apple Vision Neural Engine ML**, **Google Gemini Multimodal AI**, and **Metal GPU Perspective Dewarping** with a high-performance **Next.js (Turbopack + Vanilla CSS)** frontend.

Designed to scan business cards one by one (via live camera or batch file upload), automatically detect card edges, dewarp perspective into clean rectangular scans, extract structured contact information with near-100% accuracy, preserve unaltered raw OCR text, and maintain a cumulative CSV file ready for download.

---

## 🚀 Key Features

- **Proper Document Scanner (CamScanner-style Edge Detection & Dewarping)**:
  - Automatic quadrilateral card border detection (`VNDetectRectanglesRequest`).
  - Metal GPU-accelerated 4-point perspective warp (`CIPerspectiveCorrection`) to flatten angled or tilted cards into crisp 3.5:2 ratio scans.
  - Document illumination and contrast optimization to eliminate shadows and glare.
  - Dual image storage: saves both the original photo and the clean dewarped scan.

- **Dual/Triple ML Extraction Pipeline**:
  - ⚡ **Apple Vision ML (Neural Engine)**: Native macOS Neural Engine OCR running locally with zero latency, zero cost, and 100% offline privacy.
  - 🧠 **Google Gemini Vision AI**: Direct multimodal 2.5 Flash / 1.5 Flash vision extraction for complex, artistic, multi-language, or handwritten cards.
  - ⚙️ **Enhanced Tesseract OCR**: Universal fallback engine with multi-PSM segmentation voting.

- **2D Spatial Layout & NLP Information Extractor**:
  - Uses bounding-box spatial coordinates $(x, y, w, h)$ to separate multi-column layouts.
  - Keeps multi-line addresses together instead of mixing them into phone/email fields.
  - Detects person names by font prominence, honorifics (Dr., Eng., Mr., Ms.), credentials (MD, PhD, CPA), and proximity to job titles.
  - Extracts 150+ modern job titles and legal company suffixes (Inc, LLC, Ltd, GmbH, etc.).
  - Extracts clean phone numbers (international, direct, mobile, WhatsApp) without duplicate repetitions.
  - Preserves 100% verbatim unaltered raw text for compliance.

- **Live Camera Scanner with Laser Viewfinder**:
  - Live video viewfinder tailored to the standard business card aspect ratio (3.5" × 2").
  - Animated laser sweep scanning indicator and corner guides.
  - Camera flip toggle (front vs. rear camera).
  - **Continuous Scanning Mode**: snap a card → automatically processes & appends to CSV → camera instantly resets.

- **1-Click Instant Demo Cards**:
  - Pre-rendered test cards (Tech Executive, Medical Director, Design Principal) to test the ML scanner and CSV generation immediately.

- **Real-Time CSV Export Engine**:
  - Cards are appended directly to `backend/data/business_cards.csv`.
  - **RFC-4180 Compliant** with **UTF-8 Byte Order Mark (BOM)** ensuring Microsoft Excel, Numbers, and Google Sheets open the file with zero character corruption.
  - 1-Click "Download CSV" and "Copy CSV to Clipboard" buttons.

- **Obsidian Glassmorphic UI**:
  - Rich obsidian theme (`#090d16`), electric indigo & emerald accents, sound effects via Web Audio API, and confetti bursts on export.
  - Before/After dewarped image switcher in card details modal.
  - 1-Click "Re-Analyze Card" with Gemini AI or Apple Vision ML.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.14, FastAPI, Uvicorn, Apple Vision Framework (Swift 6), CoreImage Metal GPU, Pytesseract, Pillow, Pydantic
- **Frontend**: Next.js 16 (Turbopack), React 19, Lucide Icons, Canvas Confetti, Vanilla CSS
- **ML Engines**: Apple Vision Neural Engine (`VNRecognizeTextRequest`), Google Gemini Vision API

---

## ⚡ Quick Start

### Option 1: One-Command Launch (Recommended)
Run the root startup script which compiles the native ML scanner binary and starts both services:

```bash
./start.sh
```

- **Frontend App**: [http://localhost:3001](http://localhost:3001)
- **FastAPI Backend**: [http://localhost:8080](http://localhost:8080)
- **Swagger API Docs**: [http://localhost:8080/docs](http://localhost:8080/docs)

---

### Option 2: Running Services Independently

#### 1. Compile Apple Vision Scanner Binary:
```bash
cd backend
swiftc -O scanner_tool.swift -o scanner_tool
```

#### 2. Python FastAPI Backend:
```bash
cd backend
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

#### 3. Next.js Frontend:
```bash
cd frontend
npm run dev
```

---

## 📂 Project Structure

```
scaner/
├── backend/
│   ├── main.py              # FastAPI endpoints (scan, cards, config, reparse, export)
│   ├── ocr_engine.py        # Master ML scanner pipeline & engine dispatcher
│   ├── scanner_tool.swift   # Native Apple Vision + CoreImage Metal GPU dewarper
│   ├── scanner_tool         # Compiled ARM64 native binary (<50ms execution)
│   ├── card_parser.py       # 2D spatial layout and NLP entity extractor
│   ├── gemini_service.py    # Google Gemini Vision API integration
│   ├── csv_service.py       # RFC-4180 CSV builder with UTF-8 BOM
│   ├── storage.py           # Persistent card storage (original + dewarped images)
│   ├── sample_cards.py      # Programmatic test card generator
│   └── data/
│       ├── business_cards.csv # Cumulative master CSV file
│       ├── cards.json         # Master JSON database
│       └── images/            # Stored original & dewarped card snapshots
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.js    # Root layout & Google Fonts
│   │   │   ├── page.js      # Main dashboard with engine switcher
│   │   │   └── globals.css  # Obsidian glassmorphic design system
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Header & CSV download button
│   │   │   ├── EngineSelectorBar.jsx # ML engine selector & Dewarp toggle
│   │   │   ├── SettingsModal.jsx     # Gemini API key & engine configuration
│   │   │   ├── CameraScanner.jsx     # Live camera viewfinder & laser
│   │   │   ├── FileUploader.jsx      # Drag & drop multi-card queue
│   │   │   ├── SampleCardsBanner.jsx # 1-click test cards
│   │   │   ├── StatsBar.jsx          # Live metric counters
│   │   │   ├── CardsTable.jsx        # Searchable cards table with ML badges
│   │   │   └── CardDetailModal.jsx   # Dewarped snapshot & field editor
│   │   └── utils/
│   │       ├── api.js       # Backend API client
│   │       └── audio.js     # Web Audio API sound effects
│   └── package.json
├── package.json             # Root npm scripts
├── start.sh                 # Launcher script
└── README.md
```

---

## 📊 CSV Export Format

The generated CSV includes the following columns:
1. `ID`
2. `Full Name`
3. `Job Title`
4. `Company`
5. `Phone Number`
6. `Email Address`
7. `Website`
8. `Address`
9. `Other Details`
10. `Scanned At` (Timestamp)
11. `Raw Extracted Text` (Complete verbatim OCR output)
