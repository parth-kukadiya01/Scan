import csv
import io
import os
from typing import List, Dict, Any

CSV_HEADERS = [
    "ID",
    "Full Name",
    "Job Title",
    "Company",
    "Phone Number",
    "Email Address",
    "Website",
    "Address",
    "Other Details",
    "Scanned At",
    "Raw Extracted Text"
]

def format_card_row(card: Dict[str, Any]) -> List[str]:
    """Formats a card dictionary into a CSV row matching headers."""
    return [
        str(card.get("id", "")),
        str(card.get("name", "")),
        str(card.get("title", "")),
        str(card.get("company", "")),
        str(card.get("phone", "")),
        str(card.get("email", "")),
        str(card.get("website", "")),
        str(card.get("address", "")),
        str(card.get("other_details", "")),
        str(card.get("scanned_at", "")),
        str(card.get("raw_text", ""))
    ]

def write_cards_to_csv_file(cards: List[Dict[str, Any]], filepath: str) -> None:
    """Writes the full list of cards to a CSV file on disk with UTF-8 BOM."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    # 'utf-8-sig' automatically writes the \ufeff BOM
    with open(filepath, mode='w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
        writer.writerow(CSV_HEADERS)
        for card in cards:
            writer.writerow(format_card_row(card))

def append_single_card_to_csv_file(card: Dict[str, Any], filepath: str) -> None:
    """Appends a single card directly to the CSV file as it is scanned one by one."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    file_exists = os.path.exists(filepath) and os.path.getsize(filepath) > 0

    with open(filepath, mode='a', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
        if not file_exists:
            writer.writerow(CSV_HEADERS)
        writer.writerow(format_card_row(card))

def generate_csv_bytes(cards: List[Dict[str, Any]]) -> bytes:
    """Generates in-memory CSV file bytes with UTF-8 BOM for HTTP download."""
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    writer.writerow(CSV_HEADERS)
    for card in cards:
        writer.writerow(format_card_row(card))

    csv_str = output.getvalue()
    # Prepend UTF-8 BOM
    return ('\ufeff' + csv_str).encode('utf-8')
