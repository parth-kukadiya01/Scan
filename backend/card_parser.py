import re
from typing import Dict, Any, List, Optional

TITLE_KEYWORDS = [
    'ceo', 'cto', 'cfo', 'coo', 'cmo', 'cio', 'cpo', 'president', 'vice president', 'vp',
    'chief executive officer', 'chief technology officer', 'chief financial officer',
    'chief operating officer', 'chief medical officer', 'chief marketing officer',
    'founder', 'co-founder', 'owner', 'proprietor', 'partner', 'managing partner', 'director',
    'managing director', 'executive director', 'creative director', 'art director',
    'head of', 'general manager', 'project manager', 'product manager', 'account manager',
    'engineer', 'software engineer', 'senior engineer', 'lead engineer', 'architect',
    'principal architect', 'system architect', 'cloud architect',
    'developer', 'full stack developer', 'frontend developer', 'backend developer',
    'designer', 'ui/ux designer', 'graphic designer', 'product designer',
    'consultant', 'senior consultant', 'specialist', 'strategist', 'analyst',
    'doctor', 'dr.', 'dr', 'physician', 'surgeon', 'cardiologist', 'dentist',
    'pediatrician', 'neurologist', 'dermatologist', 'radiologist', 'therapist',
    'attorney', 'lawyer', 'counsel', 'general counsel', 'advocate', 'cpa', 'auditor', 'accountant',
    'sales executive', 'sales director', 'marketing manager', 'business development',
    'representative', 'professor', 'lecturer', 'researcher', 'scientist'
]

COMPANY_SUFFIXES = [
    'inc', 'inc.', 'llc', 'llc.', 'ltd', 'ltd.', 'corp', 'corp.', 'corporation',
    'co', 'co.', 'company', 'technologies', 'technology', 'tech', 'solutions',
    'systems', 'software', 'holdings', 'group', 'ventures', 'partners', 'studio',
    'studios', 'agency', 'media', 'enterprises', 'industries', 'labs', 'consulting',
    'associates', 'services', 'logistics', 'hospital', 'clinic', 'pharmacy', 'realty',
    'properties', 'capital', 'finance', 'foundation', 'health', 'dynamics', 'design',
    'jewellers', 'jewelers', 'jewellery', 'lewellers', 'eweller', 'traders', 'trading', 'foods', 'oil', 'organics',
    'mart', 'store', 'stores', 'shop', 'textiles', 'garments', 'creations', 'prints',
    'exports', 'imports', 'logistics', 'sweets', 'bakers', 'motors', 'automotive'
]

HONORIFICS = ['dr.', 'dr', 'mr.', 'mr', 'ms.', 'ms', 'mrs.', 'mrs', 'prof.', 'prof', 'eng.', 'adv.', 'ca', 'cpa']
CREDENTIALS = ['md', 'phd', 'esq', 'cpa', 'mba', 'jd', 'dds', 'dvm', 'faap', 'facs']

NON_NAME_PHRASES = [
    'free home', 'home delivery', 'free delivery', 'free shipping', 'fast delivery',
    'delivery in', 'delivery', 'in surat', 'specialist in', 'all types', 'all kinds',
    'authorized dealer', 'exclusive showroom', 'wholesale & retail', 'retail & wholesale',
    'sales & service', 'manufacturers', 'importers & exporters', 'iso certified',
    'govt approved', 'estd', 'since', 'open 7 days', 'visit us', 'call us', 'contact us',
    'follow us', 'order now', 'cash on delivery', 'best quality', 'satisfaction guaranteed',
    'office address', 'address', 'location', 'phone', 'email', 'website', 'web'
]

PRODUCT_LIST_WORDS = [
    'gold', 'silver', 'diamond', 'jeweller', 'jewelers', 'jewellery', 'lewellers',
    'hallmark', 'bis 916', 'kdm', 'platinum', 'gemstones', 'watches', 'textile',
    'garments', 'fabrics', 'hardware', 'electronics', 'furniture'
]

NON_COMPANY_PHRASES = [
    'free home', 'home delivery', 'free delivery', 'free shipping', 'fast delivery',
    'delivery in', 'specialist in', 'all types', 'all kinds',
    'authorized dealer', 'exclusive showroom', 'wholesale & retail', 'retail & wholesale',
    'sales & service', 'manufacturers', 'importers & exporters', 'iso certified',
    'govt approved', 'open 7 days', 'visit us', 'call us', 'contact us',
    'follow us', 'order now', 'cash on delivery', 'best quality', 'satisfaction guaranteed',
    'office address', 'location', 'phone', 'email', 'website', 'web'
]

INDIAN_AND_GLOBAL_CITIES = [
    'surat', 'bharuch', 'ahmedabad', 'vadodara', 'baroda', 'rajkot', 'bhavnagar', 'jamnagar',
    'mumbai', 'bombay', 'pune', 'delhi', 'new delhi', 'bangalore', 'bengaluru', 'hyderabad',
    'chennai', 'madras', 'kolkata', 'calcutta', 'jaipur', 'indore', 'bhopal', 'chandigarh',
    'nagpur', 'nashik', 'goa', 'noida', 'gurugram', 'gurgaon', 'san francisco', 'new york',
    'chicago', 'los angeles', 'london', 'toronto', 'dubai', 'singapore'
]

COMMON_FREE_DOMAINS = {
    'gmail', 'yahoo', 'outlook', 'hotmail', 'icloud', 'proton', 'aol', 'rediffmail', 'zoho', 'mail'
}

def clean_lines(raw_text: str) -> List[str]:
    """Cleans up text into non-empty stripped lines."""
    lines = []
    for line in raw_text.splitlines():
        trimmed = line.strip()
        if len(trimmed) > 1 and not re.match(r'^[-_=\s\*\.\:\;•·#\/\\\|]+$', trimmed):
            lines.append(trimmed)
    return lines

def extract_emails(text: str) -> List[str]:
    """Finds all valid email addresses, tolerating minor OCR spaces around @ or dots."""
    # Normalize common OCR space artifacts
    normalized = re.sub(r'([a-zA-Z0-9._%+-]+)\s*@\s*([a-zA-Z0-9.-]+)\s*\.\s*([a-zA-Z]{2,})', r'\1@\2.\3', text)
    # Also tolerate OCR character glitches like ° in contact@s°jlras-com
    normalized = re.sub(r'([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+)[-]([a-zA-Z]{2,})', r'\1@\2.\3', normalized)
    
    pattern = r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b'
    matches = re.findall(pattern, normalized)
    seen = set()
    result = []
    for m in matches:
        lower = m.lower()
        if lower not in seen:
            seen.add(lower)
            result.append(m)
    return result

def extract_phones(lines: List[str]) -> List[str]:
    """
    Extracts phone numbers:
    - Indian Mobile numbers (+91 91069 74380, 91069 74380, 5+5, 10-digit)
    - International formatted numbers (+1, +44, etc.)
    - Multi-number landlines with STD codes: (02642) 241899, 242899, 201099
    """
    # 1. Indian 10-digit mobile (+91 91069 74380 or 91069 74380)
    indian_mobile_pattern = re.compile(
        r'(?:\+?91[-.\s]*)?([6-9]\d{4}[-.\s]*\d{5}\b|[6-9]\d{9}\b)'
    )
    
    # 2. General International numbers with + or 00
    intl_pattern = re.compile(
        r'(?:\+|00)[1-9]\d{0,3}[-.\s]?(?:\(?\d{1,5}\)?[-.\s]?)?\d{2,5}[-.\s]?\d{3,5}(?:[-.\s]?\d{2,5})?'
    )

    # 3. Standard US/Canada/UK formats
    standard_pattern = re.compile(
        r'(?:\+?1[-.\s]*)?(?:\(\d{3}\)|\d{3})[-.\s]*\d{3}[-.\s]*\d{4}\b'
    )

    # 4. Labeled lines: Phone: ... / Mob: ... / WhatsApp: ...
    prefix_pattern = re.compile(
        r'(?:tel|phone|mob|mobile|cell|ph|contact|call|fax|whatsapp|m|c|t|o)[:\.\s;]*([+\d\(\)\s\-\.,/]{7,35})',
        re.IGNORECASE
    )

    candidates = []

    for line in lines:
        cleaned_line = line.strip()

        # Check for STD code landline with multiple extensions/numbers: (02642) 241899, 242899, 201099
        std_match = re.search(r'\((\d{3,5})\)', cleaned_line)
        if std_match and re.search(r'(?:ph|phone|tel)', cleaned_line, re.IGNORECASE):
            std_code = std_match.group(1)
            # Find all 6-8 digit phone numbers in this line
            local_nums = re.findall(r'\b\d{6,8}\b', cleaned_line)
            for num in local_nums:
                candidates.append(f"({std_code}) {num}")

        # Check prefixed pattern
        pm = prefix_pattern.search(cleaned_line)
        if pm:
            chunk = pm.group(1).strip()
            # If line has country code and digits
            digits = re.sub(r'\D', '', chunk)
            if 7 <= len(digits) <= 15:
                # Clean extra trailing symbols
                clean_chunk = re.sub(r'[^+\d\(\)\s\-\.]', '', chunk).strip(' ,;-')
                if len(re.sub(r'\D', '', clean_chunk)) >= 7:
                    candidates.append(clean_chunk)

        # Indian mobile matches
        for m in indian_mobile_pattern.finditer(cleaned_line):
            match_str = m.group(0).strip()
            digits = re.sub(r'\D', '', match_str)
            if len(digits) == 10 or (len(digits) == 12 and digits.startswith('91')):
                candidates.append(match_str)

        # International matches
        for m in intl_pattern.findall(cleaned_line):
            digits = re.sub(r'\D', '', m)
            if 7 <= len(digits) <= 15:
                candidates.append(m.strip(' ,;-'))

        # Standard matches
        for m in standard_pattern.findall(cleaned_line):
            digits = re.sub(r'\D', '', m)
            if 7 <= len(digits) <= 15:
                candidates.append(m.strip(' ,;-'))

    # Deduplicate and sort candidates:
    # Prefer numbers with '+' and longer digit representation
    unique = []
    seen_digit_keys = []

    candidates.sort(key=lambda x: (1 if '+' in x else 0, len(re.sub(r'\D', '', x))), reverse=True)

    for p in candidates:
        digits = re.sub(r'\D', '', p)
        if len(digits) < 7:
            continue
        
        # Check if this number is already covered by a seen key
        already_seen = False
        for s in seen_digit_keys:
            if digits == s or (len(digits) >= 10 and digits.endswith(s[-10:])):
                already_seen = True
                break
            if len(s) >= 10 and len(digits) >= 10 and s[-10:] == digits[-10:]:
                already_seen = True
                break

        if not already_seen:
            seen_digit_keys.append(digits)
            unique.append(p)

    return unique

def extract_websites(lines: List[str]) -> List[str]:
    """Extracts URLs and domain names, ignoring emails."""
    url_pattern = re.compile(
        r'(?:https?:\/\/|www\.)[^\s,;]+|[a-zA-Z0-9-]+\.(?:com|org|net|io|co|ai|dev|app|info|biz|edu|gov|in|uk|ca|de)\b[^\s,;]*',
        re.IGNORECASE
    )
    found = []

    for line in lines:
        parts = line.split()
        for part in parts:
            if '@' in part:
                continue
            for m in url_pattern.findall(part):
                c = m.strip('.,;:()[]{}<>\\/')
                if '@' not in c and len(c) > 3 and c.lower() not in [x.lower() for x in found]:
                    found.append(c)

    return found

def extract_social_links(lines: List[str]) -> List[str]:
    """Extracts social media profiles (Instagram, Facebook, LinkedIn, Twitter/X, YouTube)."""
    social_pattern = re.compile(
        r'(?:linkedin\.com\/in\/[^\s,;]+|github\.com\/[^\s,;]+|x\.com\/[^\s,;]+|twitter\.com\/[^\s,;]+|instagram\.com\/[^\s,;]+|fb\.com\/[^\s,;]+)',
        re.IGNORECASE
    )
    found = []
    for line in lines:
        for m in social_pattern.findall(line):
            c = m.strip('.,;:')
            if c not in found:
                found.append(c)
    return found

def is_phone_line(text: str) -> bool:
    """Returns True if the line is predominantly a phone number."""
    if re.search(r'(?:\+?91[-.\s]*)?[6-9]\d{4}[-.\s]*\d{5}\b', text):
        return True
    if re.search(r'(?:\+|00)[1-9]\d{0,3}[-.\s]?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}', text):
        return True
    if re.search(r'(?:ph|phone|mob|mobile|cell|whatsapp|tel)[:\.\s]*\+?\d+', text, re.IGNORECASE):
        return True
    return False

def is_address_line(text: str) -> bool:
    """Checks whether a single line contains address signals without false-positive phones."""
    # A line that is predominantly a phone number or email MUST NOT be an address
    if is_phone_line(text) or '@' in text:
        return False

    address_keywords = re.compile(
        r'\b(street|st\.|st\b|avenue|ave\.|ave\b|boulevard|blvd\.|road|rd\.|drive|dr\.|lane|ln\.|way|suite|ste\.|ste\b|floor|fl\.|room|rm\.|building|bldg|parkway|pkwy|highway|hwy|box|po box|nagar|society|soc\.|complex|plaza|center|centre|shopping|market|bazaar|gidc|plot|sector|cross|circle|panchbatti|sevasharam)\b',
        re.IGNORECASE
    )
    
    city_keywords = re.compile(
        r'\b(?:in|at|near|opp\.?)\s+([A-Za-z]+)|\b(' + '|'.join(INDIAN_AND_GLOBAL_CITIES) + r')\b',
        re.IGNORECASE
    )

    zip_pattern = re.compile(r'\b[A-Z]{2}\s+\d{5}\b|\b\d{6}\b', re.IGNORECASE)

    if address_keywords.search(text) or city_keywords.search(text) or (zip_pattern.search(text) and len(text) > 12):
        return True
    return False

def extract_brand_from_domain(emails: List[str], websites: List[str]) -> Optional[str]:
    """Extracts custom brand name from website or email domain."""
    candidates = []
    for w in websites:
        m = re.search(r'(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+)\.[a-zA-Z]{2,}', w)
        if m:
            dom = m.group(1).lower()
            if dom not in COMMON_FREE_DOMAINS and len(dom) > 2:
                candidates.append(dom)

    for e in emails:
        m = re.search(r'@([a-zA-Z0-9-]+)\.[a-zA-Z]{2,}', e)
        if m:
            dom = m.group(1).lower()
            if dom not in COMMON_FREE_DOMAINS and len(dom) > 2:
                candidates.append(dom)

    if candidates:
        return candidates[0]
    return None

def parse_card_text(raw_text: str, lines_data: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Intelligent Business Card Information Extractor:
    Uses spatial bounding box layout if lines_data is provided (from Apple Vision ML),
    or robust NLP and regex heuristics if lines_data is not available.
    Preserves 100% of raw_text verbatim.
    """
    if not raw_text or not raw_text.strip():
        return {
            "name": "",
            "title": "",
            "company": "",
            "phone": "",
            "email": "",
            "website": "",
            "address": "",
            "other_details": "",
            "raw_text": raw_text or ""
        }

    emails = extract_emails(raw_text)

    if lines_data and len(lines_data) > 0:
        return _parse_with_spatial_layout(raw_text, lines_data, emails)
    else:
        return _parse_with_heuristics(raw_text, emails)

def _parse_with_spatial_layout(raw_text: str, lines_data: List[Dict[str, Any]], emails: List[str]) -> Dict[str, Any]:
    """Spatial Layout & Machine Learning parsing based on 2D coordinates."""
    # Filter out single-character logo icons (e.g. "N", "K", "A")
    valid_lines = []
    for l in lines_data:
        t = l.get("text", "").strip()
        if len(t) == 1 and t.isalpha():
            continue
        valid_lines.append(l)

    raw_line_texts = [l.get("text", "").strip() for l in valid_lines]
    phones = extract_phones(raw_line_texts)
    websites = extract_websites(raw_line_texts)
    social_links = extract_social_links(raw_line_texts)
    brand_domain = extract_brand_from_domain(emails, websites)

    used_indices = set()

    # 1. Identify Address lines
    address_parts = []
    for idx, l in enumerate(valid_lines):
        text = l.get("text", "").strip()
        
        # Never consider phone numbers or emails as address
        if is_phone_line(text) or any(e.lower() in text.lower() for e in emails):
            continue

        if is_address_line(text):
            used_indices.add(idx)
            cleaned = re.sub(r'^(?:office\s+address:?|address:?|in\s+)', '', text, flags=re.IGNORECASE).strip(' :,')
            # If line is just "In Surat", extract "Surat"
            if cleaned and cleaned not in address_parts:
                address_parts.append(cleaned)

    # 2. Mark lines holding emails, phones, websites, or social links
    for idx, l in enumerate(valid_lines):
        text = l.get("text", "").strip()
        if any(e.lower() in text.lower() for e in emails):
            used_indices.add(idx)
        if any(re.sub(r'\D', '', p) in re.sub(r'\D', '', text) for p in phones if len(re.sub(r'\D', '', p)) >= 7):
            used_indices.add(idx)
        if any(w.lower() in text.lower() for w in websites):
            used_indices.add(idx)
        if any(s.lower() in text.lower() for s in social_links):
            used_indices.add(idx)
        if re.match(r'^(?:office\s+address|address|location)[:\.\s]*$', text, re.IGNORECASE):
            used_indices.add(idx)

    # 3. Detect Job Title first
    title = ""
    title_idx = -1
    title_candidates = []

    for idx, l in enumerate(valid_lines):
        if idx in used_indices:
            continue
        text = l.get("text", "").strip()
        lower = text.lower()

        # Rejection list
        if any(np in lower for np in NON_NAME_PHRASES):
            continue

        if any(k in lower for k in TITLE_KEYWORDS) and len(text) < 70:
            score = 10.0
            title_candidates.append((score, idx, text))

    if title_candidates:
        title_candidates.sort(key=lambda x: x[0], reverse=True)
        title_idx = title_candidates[0][1]
        title = title_candidates[0][2]
        used_indices.add(title_idx)

    # 4. Detect Full Name
    name = ""
    name_idx = -1
    name_candidates = []

    for idx, l in enumerate(valid_lines):
        if idx in used_indices:
            continue
        text = l.get("text", "").strip()
        cand_text = re.sub(r'^[^\w\s]+', '', text).strip()
        cand_text = re.sub(r'[=\-_—~|]+$', '', cand_text).strip()
        if not cand_text:
            continue

        lower = cand_text.lower()

        # Strict rejection for delivery/marketing banners and product lines
        if any(np in lower for np in NON_NAME_PHRASES) or any(pw in lower for pw in PRODUCT_LIST_WORDS):
            continue

        if re.search(r'\d', cand_text) or re.search(r'[@\/\\#\$%\^&\*\<\>\{\}\[\]_—|•·★◆+]', cand_text) or any(c in text for c in ['•', '·', '★', '◆', '+', '&', '✓']):
            continue

        words = [w for w in cand_text.split() if len(w) > 1]
        if not words or len(words) > 5:
            continue

        # Real names do not have random mid-word capitalization like "eiGal"
        if any(re.search(r'[a-z][A-Z]', w) for w in words):
            continue

        # Real names do not have commas between normal words (e.g. "ghee, honey, grains")
        if ',' in cand_text and not any(cand_text.lower().endswith(c) for c in CREDENTIALS):
            continue

        if any(re.search(rf'\b{re.escape(s)}\b', lower) for s in COMPANY_SUFFIXES):
            continue

        # If brand name is in text (e.g. soilras), it's not a person name
        if brand_domain and brand_domain in lower:
            continue

        score = 0.0
        font_h = l.get("height", 0.0)
        score += font_h * 100.0

        if any(lower.startswith(h) or f" {h} " in lower for h in HONORIFICS):
            score += 20.0

        if any(f" {c}" in lower or lower.endswith(c) for c in CREDENTIALS):
            score += 15.0

        if any(k in lower for k in TITLE_KEYWORDS):
            score -= 15.0

        if 2 <= len(words) <= 4:
            score += 8.0

        y = l.get("y", 0.5)
        if y >= 0.70:
            score += 10.0 # Top area of card where owner names typically reside
        elif 0.35 <= y < 0.70:
            score += 5.0

        # Title proximity boost
        if title_idx != -1:
            y_dist = abs(l.get("y", 0.0) - valid_lines[title_idx].get("y", 0.0))
            if y_dist < 0.15:
                score += 10.0

        name_candidates.append((score, idx, cand_text))

    if name_candidates:
        name_candidates.sort(key=lambda x: x[0], reverse=True)
        # Only accept if score is high enough to be an authentic name
        if name_candidates[0][0] >= 5.0:
            name_idx = name_candidates[0][1]
            name = name_candidates[0][2]
            used_indices.add(name_idx)

            # Check if there is a 2nd co-owner / partner on the same header line (e.g. SUNIL SONI and SAGAR SONI)
            if len(name_candidates) > 1 and name_candidates[1][0] >= 10.0:
                y1 = valid_lines[name_idx].get("y", 0.0)
                y2 = valid_lines[name_candidates[1][1]].get("y", 0.0)
                if abs(y1 - y2) < 0.06:
                    name = f"{name}, {name_candidates[1][2]}"
                    used_indices.add(name_candidates[1][1])

    # 5. Detect Company Name
    company = ""
    company_candidates = []

    for idx, l in enumerate(valid_lines):
        if idx in used_indices:
            continue
        text = l.get("text", "").strip()
        lower = text.lower()

        if any(np in lower for np in NON_COMPANY_PHRASES):
            continue

        # Ignore social handles like soilras42
        if re.search(r'^[a-zA-Z]+\d{2,}$', text) or text.startswith('@'):
            continue

        score = 0.0
        font_h = l.get("height", 0.0)
        score += font_h * 60.0

        if any(re.search(rf'\b{re.escape(s)}\b', lower) for s in COMPANY_SUFFIXES):
            score += 25.0

        if brand_domain and brand_domain in lower and not re.search(r'\d', text):
            score += 25.0

        y = l.get("y", 0.0)
        if y > 0.65:
            score += 6.0

        if len(text) < 65 and not re.search(r'\d{3,}', text):
            company_candidates.append((score, idx, text))

    if company_candidates:
        company_candidates.sort(key=lambda x: x[0], reverse=True)
        raw_comp = company_candidates[0][2]
        company = re.sub(r'^[A-Za-z]\s+', '', raw_comp).strip() or raw_comp
        company = re.sub(r'[=\-_—~]+$', '', company).strip()
        used_indices.add(company_candidates[0][1])

    # If company still empty, infer from brand domain
    if not company and brand_domain:
        company = brand_domain.capitalize()

    if company and company.islower():
        company = company.title()

    # Leftover lines
    leftovers = []
    for idx, l in enumerate(valid_lines):
        if idx not in used_indices:
            t = l.get("text", "").strip()
            if t and not re.match(r'^(?:office\s+address:?|address:?)$', t, re.IGNORECASE):
                leftovers.append(t)

    full_address = ", ".join(dict.fromkeys(address_parts))

    return {
        "name": name,
        "title": title,
        "company": company,
        "phone": ", ".join(phones),
        "email": ", ".join(emails),
        "website": ", ".join(websites),
        "address": full_address,
        "other_details": " | ".join(leftovers),
        "raw_text": raw_text
    }

def _parse_with_heuristics(raw_text: str, emails: List[str]) -> Dict[str, Any]:
    """Standard heuristic/regex fallback when spatial layout coordinates are absent."""
    lines = clean_lines(raw_text)
    phones = extract_phones(lines)
    websites = extract_websites(lines)
    brand_domain = extract_brand_from_domain(emails, websites)

    used_indices = set()

    # Address
    address_parts = []
    for idx, line in enumerate(lines):
        if is_phone_line(line) or any(e.lower() in line.lower() for e in emails):
            continue
        if is_address_line(line):
            cleaned = re.sub(r'^(?:office\s+address:?|address:?|in\s+)', '', line, flags=re.IGNORECASE).strip(' :,')
            if cleaned and cleaned not in address_parts:
                address_parts.append(cleaned)
            used_indices.add(idx)

    # Mark contacts
    for idx, line in enumerate(lines):
        if any(e.lower() in line.lower() for e in emails):
            used_indices.add(idx)
        if any(re.sub(r'\D', '', p) in re.sub(r'\D', '', line) for p in phones if len(re.sub(r'\D', '', p)) >= 7):
            used_indices.add(idx)
        if any(w.lower() in line.lower() for w in websites):
            used_indices.add(idx)
        if re.match(r'^(?:office\s+address|address)[:\.\s]*$', line, re.IGNORECASE):
            used_indices.add(idx)

    # Title
    title = ""
    title_idx = -1
    for idx, line in enumerate(lines):
        if idx in used_indices:
            continue
        lower = line.lower()
        if any(np in lower for np in NON_NAME_PHRASES):
            continue
        if any(k in lower for k in TITLE_KEYWORDS) and len(line) < 60:
            title = line
            title_idx = idx
            used_indices.add(idx)
            break

    # Company
    company = ""
    for idx, line in enumerate(lines):
        if idx in used_indices:
            continue
        lower = line.lower()
        if any(np in lower for np in NON_COMPANY_PHRASES):
            continue
        if re.search(r'^[a-zA-Z]+\d{2,}$', line) or line.startswith('@'):
            continue
        if (any(re.search(rf'\b{re.escape(s)}\b', lower) for s in COMPANY_SUFFIXES) or 
            (brand_domain and brand_domain in lower and not re.search(r'\d', line))) and len(line) < 70:
            company = line
            company = re.sub(r'^[A-Za-z]\s+', '', company).strip()
            company = re.sub(r'[=\-_—~]+$', '', company).strip()
            used_indices.add(idx)
            break

    if not company and brand_domain:
        company = brand_domain.capitalize()

    if company and company.islower():
        company = company.title()

    # Name
    name_candidates = []
    for idx, line in enumerate(lines):
        if idx in used_indices:
            continue
        lower = line.lower()
        if any(np in lower for np in NON_NAME_PHRASES) or any(pw in lower for pw in PRODUCT_LIST_WORDS):
            continue
        if re.search(r'\d', line) or re.search(r'[@\/\\#\$%\^&\*\<\>\{\}\[\]_—|•·★◆+]', line) or any(c in line for c in ['•', '·', '★', '◆', '+', '&', '✓']):
            continue
        if brand_domain and brand_domain in lower:
            continue
        if any(re.search(r'[a-z][A-Z]', w) for w in line.split()):
            continue
        if ',' in line and not any(line.lower().endswith(c) for c in CREDENTIALS):
            continue

        words = [w for w in line.split() if len(w) > 1]
        if 2 <= len(words) <= 4 and len(line) <= 45:
            # Base score: names near the top of the card get strong initial score
            score = 6 if idx == 0 else 5 if idx == 1 else 3
            if title_idx != -1 and abs(idx - title_idx) == 1:
                score += 8
            if any(lower.startswith(h) for h in HONORIFICS):
                score += 15
            if any(lower.endswith(c) for c in CREDENTIALS):
                score += 10
            name_candidates.append((score, idx, line))

    name = ""
    if name_candidates:
        name_candidates.sort(key=lambda x: x[0], reverse=True)
        if name_candidates[0][0] >= 5:
            name = name_candidates[0][2]
            name = re.sub(r'[=\-_—~]+$', '', name).strip()
            used_indices.add(name_candidates[0][1])

    leftovers = [line for idx, line in enumerate(lines) if idx not in used_indices]

    return {
        "name": name,
        "title": title,
        "company": company,
        "phone": ", ".join(phones),
        "email": ", ".join(emails),
        "website": ", ".join(websites),
        "address": ", ".join(dict.fromkeys(address_parts)),
        "other_details": " | ".join(leftovers),
        "raw_text": raw_text
    }
