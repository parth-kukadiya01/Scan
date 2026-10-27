import base64
import os
import re
from typing import Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from ocr_engine import run_card_scanner, run_ocr_on_image, SCANNER_TOOL_BIN
from card_parser import parse_card_text
from csv_service import generate_csv_bytes
from excel_service import generate_excel_bytes
import storage
from sample_cards import SAMPLE_PRESETS, generate_sample_card_image

app = FastAPI(
    title="CardPulse Smart ML Business Card Scanner API",
    description="Intelligent Card Scanner with Apple Vision Neural Engine ML and Tesseract OCR"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Base64ScanRequest(BaseModel):
    image: str
    engine: Optional[str] = "auto"
    dewarp: Optional[bool] = True

class UpdateCardRequest(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    other_details: Optional[str] = None
    raw_text: Optional[str] = None

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "CardPulse Smart Business Card Scanner Backend",
        "apple_vision_ml_available": os.path.exists(SCANNER_TOOL_BIN),
        "tesseract_available": True
    }

@app.get("/api/config")
def get_system_config():
    """Returns engine availability and configuration status."""
    has_apple_vision = os.path.exists(SCANNER_TOOL_BIN)
    return {
        "apple_vision_ml_available": has_apple_vision,
        "default_engine": "apple_vision" if has_apple_vision else "tesseract"
    }

@app.get("/api/cards")
def get_all_cards():
    """Returns the list of all scanned business cards."""
    return storage.load_cards()

@app.post("/api/scan")
async def scan_uploaded_file(
    file: UploadFile = File(...),
    engine: str = Form("auto"),
    dewarp: bool = Form(True)
):
    """
    Scans an uploaded business card image.
    Uses Apple Vision Neural Engine / Tesseract OCR with document perspective dewarping.
    Appends the card directly to the cumulative CSV.
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    try:
        scanned = run_card_scanner(contents, engine=engine, dewarp=dewarp)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scanner pipeline failed: {str(e)}")

    dewarped_bytes = scanned.pop("dewarped_image_bytes", None)
    saved_card = storage.add_card(scanned, image_bytes=contents, dewarped_image_bytes=dewarped_bytes)

    return {
        "success": True,
        "message": f"Card scanned successfully via {saved_card.get('engine', 'ML')}",
        "card": saved_card
    }

@app.post("/api/scan-base64")
async def scan_base64_image(payload: Base64ScanRequest):
    """
    Accepts base64 encoded image (captured from live camera/webcam).
    Runs ML scanner, dewarps card perspective, and appends to CSV.
    """
    image_str = payload.image
    if "," in image_str:
        image_str = image_str.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(image_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    try:
        scanned = run_card_scanner(
            image_bytes,
            engine=payload.engine or "auto",
            dewarp=payload.dewarp if payload.dewarp is not None else True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scanner pipeline failed: {str(e)}")

    dewarped_bytes = scanned.pop("dewarped_image_bytes", None)
    saved_card = storage.add_card(scanned, image_bytes=image_bytes, dewarped_image_bytes=dewarped_bytes)

    return {
        "success": True,
        "message": f"Camera card scanned via {saved_card.get('engine', 'ML')}",
        "card": saved_card
    }

@app.get("/api/sample-cards")
def get_sample_cards_list():
    """Lists available pre-configured test business cards."""
    return [{"id": p["id"], "label": p["label"], "name": p["name"], "company": p["company"]} for p in SAMPLE_PRESETS]

@app.post("/api/scan-sample/{sample_id}")
def scan_sample_card(
    sample_id: str,
    engine: str = Query("auto"),
    dewarp: bool = Query(True)
):
    """Generates and scans a sample business card with the selected ML engine."""
    image_bytes = generate_sample_card_image(sample_id)
    scanned = run_card_scanner(image_bytes, engine=engine, dewarp=dewarp)
    dewarped_bytes = scanned.pop("dewarped_image_bytes", None)

    saved_card = storage.add_card(scanned, image_bytes=image_bytes, dewarped_image_bytes=dewarped_bytes)
    return {
        "success": True,
        "message": f"Sample card scanned via {saved_card.get('engine', 'ML')}",
        "card": saved_card
    }

@app.post("/api/cards/{card_id}/reparse")
def reparse_card(
    card_id: str,
    engine: str = Query("auto")
):
    """Re-scans and re-parses an existing card using the requested engine."""
    cards = storage.load_cards()
    card = next((c for c in cards if c.get("id") == card_id), None)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    image_filename = f"card_{card_id}.png"
    image_path = os.path.join(storage.IMAGES_DIR, image_filename)
    if not os.path.exists(image_path):
        raise HTTPException(status_code=400, detail="Original image not found for this card")

    with open(image_path, "rb") as f:
        image_bytes = f.read()

    scanned = run_card_scanner(image_bytes, engine=engine, dewarp=True)
    scanned.pop("dewarped_image_bytes", None)

    updated = storage.update_card(card_id, scanned)
    return {
        "success": True,
        "message": f"Card re-analyzed using {scanned.get('engine', 'ML')}",
        "card": updated
    }

@app.put("/api/cards/{card_id}")
def update_card_details(card_id: str, payload: UpdateCardRequest):
    """Allows user to fine-tune or edit any field on a card."""
    updated = storage.update_card(card_id, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"success": True, "card": updated}

@app.delete("/api/cards/{card_id}")
def delete_single_card(card_id: str):
    """Deletes a single card and updates the CSV file."""
    deleted = storage.delete_card(card_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"success": True, "message": "Card deleted and CSV refreshed"}

@app.delete("/api/cards")
def clear_all_scanned_cards():
    """Clears all cards and resets the CSV file."""
    storage.clear_all_cards()
    return {"success": True, "message": "All cards cleared and CSV reset"}

@app.get("/api/export/csv")
def download_csv_export(ids: Optional[str] = Query(None)):
    """
    Downloads CSV containing all cards or specific cards specified by comma-separated ids.
    Contains RFC-4180 formatting and UTF-8 BOM for instant Excel and Sheets viewing.
    """
    cards = storage.load_cards()
    filename = "business_cards.csv"

    if ids:
        id_list = [i.strip() for i in ids.split(",") if i.strip()]
        cards = [c for c in cards if c.get("id") in id_list]
        if len(id_list) == 1:
            first_card = cards[0] if cards else {}
            safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', first_card.get("name") or first_card.get("company") or id_list[0]).strip('_')
            filename = f"card_{safe_name}.csv"
        else:
            filename = f"selected_business_cards_{len(cards)}.csv"

    csv_bytes = generate_csv_bytes(cards)

    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Cache-Control": "no-cache"
        }
    )

@app.get("/api/cards/{card_id}/csv")
def download_single_card_csv(card_id: str):
    """Downloads a single specific card as an individual CSV file."""
    cards = storage.load_cards()
    card = next((c for c in cards if c.get("id") == card_id), None)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', card.get("name") or card.get("company") or card_id).strip('_')
    csv_bytes = generate_csv_bytes([card])
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=card_{safe_name}.csv",
            "Cache-Control": "no-cache"
        }
    )

@app.get("/api/export/excel")
def download_excel_export(ids: Optional[str] = Query(None)):
    """
    Downloads properly styled Microsoft Excel (.xlsx) file containing all cards or specific cards.
    Includes styled dark navy headers, auto-filters, freeze panes, text-formatted phone numbers,
    word wrapping for addresses/raw text, and alternating zebra rows.
    """
    cards = storage.load_cards()
    filename = "business_cards.xlsx"

    if ids:
        id_list = [i.strip() for i in ids.split(",") if i.strip()]
        cards = [c for c in cards if c.get("id") in id_list]
        if len(id_list) == 1:
            first_card = cards[0] if cards else {}
            safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', first_card.get("name") or first_card.get("company") or id_list[0]).strip('_')
            filename = f"card_{safe_name}.xlsx"
        else:
            filename = f"selected_business_cards_{len(cards)}.xlsx"

    excel_bytes = generate_excel_bytes(cards)

    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Cache-Control": "no-cache"
        }
    )

@app.get("/api/cards/{card_id}/excel")
def download_single_card_excel(card_id: str):
    """Downloads a single specific card as an individual formatted Excel (.xlsx) file."""
    cards = storage.load_cards()
    card = next((c for c in cards if c.get("id") == card_id), None)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', card.get("name") or card.get("company") or card_id).strip('_')
    excel_bytes = generate_excel_bytes([card])
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=card_{safe_name}.xlsx",
            "Cache-Control": "no-cache"
        }
    )


@app.get("/api/images/{filename}")
def get_card_image(filename: str):
    """Serves the stored card image thumbnail."""
    file_path = os.path.join(storage.IMAGES_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
