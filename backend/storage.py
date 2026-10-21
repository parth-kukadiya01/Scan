import json
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from csv_service import write_cards_to_csv_file, append_single_card_to_csv_file

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
IMAGES_DIR = os.path.join(DATA_DIR, "images")
CARDS_FILE = os.path.join(DATA_DIR, "cards.json")
CSV_FILE = os.path.join(DATA_DIR, "business_cards.csv")

os.makedirs(IMAGES_DIR, exist_ok=True)

def load_cards() -> List[Dict[str, Any]]:
    """Loads all cards from local JSON file."""
    if not os.path.exists(CARDS_FILE):
        return []
    try:
        with open(CARDS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_cards(cards: List[Dict[str, Any]]) -> None:
    """Saves cards to both JSON file and the master CSV file."""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(CARDS_FILE, "w", encoding="utf-8") as f:
        json.dump(cards, f, indent=2, ensure_ascii=False)
    # Synchronize master CSV file
    write_cards_to_csv_file(cards, CSV_FILE)

def add_card(
    card_data: Dict[str, Any],
    image_bytes: Optional[bytes] = None,
    dewarped_image_bytes: Optional[bytes] = None
) -> Dict[str, Any]:
    """Adds a newly scanned card, saves its image(s), and appends to CSV."""
    card_id = str(uuid.uuid4())[:8]
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    original_filename = None
    if image_bytes:
        original_filename = f"card_{card_id}.png"
        image_path = os.path.join(IMAGES_DIR, original_filename)
        with open(image_path, "wb") as f:
            f.write(image_bytes)

    dewarped_filename = None
    if dewarped_image_bytes:
        dewarped_filename = f"card_{card_id}_dewarped.png"
        dewarped_path = os.path.join(IMAGES_DIR, dewarped_filename)
        with open(dewarped_path, "wb") as f:
            f.write(dewarped_image_bytes)

    primary_image_filename = dewarped_filename or original_filename

    card = {
        "id": card_id,
        "name": card_data.get("name", ""),
        "title": card_data.get("title", ""),
        "company": card_data.get("company", ""),
        "phone": card_data.get("phone", ""),
        "email": card_data.get("email", ""),
        "website": card_data.get("website", ""),
        "address": card_data.get("address", ""),
        "other_details": card_data.get("other_details", ""),
        "raw_text": card_data.get("raw_text", ""),
        "confidence": card_data.get("confidence", 0),
        "engine": card_data.get("engine", "apple_vision_ml"),
        "card_detected": card_data.get("card_detected", False),
        "image_url": f"/api/images/{primary_image_filename}" if primary_image_filename else None,
        "dewarped_image_url": f"/api/images/{dewarped_filename}" if dewarped_filename else None,
        "original_image_url": f"/api/images/{original_filename}" if original_filename else None,
        "scanned_at": timestamp
    }

    cards = load_cards()
    cards.insert(0, card)  # newest first
    save_cards(cards)

    return card

def update_card(card_id: str, updated_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Updates an existing card (e.g. user corrected a spelling)."""
    cards = load_cards()
    for i, c in enumerate(cards):
        if c.get("id") == card_id:
            for k in ["name", "title", "company", "phone", "email", "website", "address", "other_details", "raw_text"]:
                if k in updated_data:
                    c[k] = updated_data[k]
            cards[i] = c
            save_cards(cards)
            return c
    return None

def delete_card(card_id: str) -> bool:
    """Deletes a card by ID."""
    cards = load_cards()
    initial_len = len(cards)
    cards = [c for c in cards if c.get("id") != card_id]
    if len(cards) != initial_len:
        save_cards(cards)
        return True
    return False

def clear_all_cards() -> None:
    """Clears all cards."""
    save_cards([])
