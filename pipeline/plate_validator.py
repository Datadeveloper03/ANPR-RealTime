import re
from typing import Optional, Tuple

# Indian License Plate Standard Formats:
# Format: ^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$
# Examples: DL01AB1234, KA05MB4567, MH12DE1433, HR26DK7777, TN09BZ9999
INDIAN_PLATE_PATTERN = re.compile(r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$")

# Common OCR confusion character replacements (e.g., 'O' vs '0', 'I' vs '1')
CHAR_FIXES_STATE = {
    '0': 'O', '1': 'I', '8': 'B', '5': 'S', '2': 'Z'
}
CHAR_FIXES_DIGIT = {
    'O': '0', 'Q': '0', 'D': '0', 'I': '1', 'L': '1', 'Z': '2', 'S': '5', 'B': '8', 'G': '6'
}

def clean_ocr_text(text: str) -> str:
    """Strip spaces, special characters, and uppercase."""
    if not text:
        return ""
    # Remove all non-alphanumeric characters
    cleaned = re.sub(r"[^A-Za-z0-9]", "", text).upper()
    return cleaned

def validate_indian_plate(raw_text: str) -> Tuple[bool, Optional[str]]:
    """
    Validates and normalizes raw OCR text against the Indian plate regex.
    Returns (is_valid, normalized_plate).
    """
    cleaned = clean_ocr_text(raw_text)
    if not cleaned:
        return False, None

    # Direct match check
    if INDIAN_PLATE_PATTERN.match(cleaned):
        return True, cleaned

    # Attempt heuristic cleanup for common OCR mistakes:
    # Length of Indian plates is usually 9 or 10 characters (e.g. KA 05 M 1234 or KA 05 MB 1234)
    if 8 <= len(cleaned) <= 11:
        # First 2 chars must be state code (Alphabets)
        p0 = CHAR_FIXES_STATE.get(cleaned[0], cleaned[0])
        p1 = CHAR_FIXES_STATE.get(cleaned[1], cleaned[1])
        
        # Last 4 chars must be digits
        p_last4 = []
        for ch in cleaned[-4:]:
            p_last4.append(CHAR_FIXES_DIGIT.get(ch, ch))
        
        middle = cleaned[2:-4]
        candidate = f"{p0}{p1}{middle}{''.join(p_last4)}"
        
        if INDIAN_PLATE_PATTERN.match(candidate):
            return True, candidate

    return False, None

if __name__ == "__main__":
    test_cases = [
        ("DL 01 AB 1234", True, "DL01AB1234"),
        ("KA-05-MB-4567", True, "KA05MB4567"),
        ("MH12DE1433", True, "MH12DE1433"),
        ("TN 09 BZ 9999", True, "TN09BZ9999"),
        ("INVALID_TEXT_123", False, None),
        ("HELLO WORLD", False, None),
    ]
    for raw, expected_valid, expected_plate in test_cases:
        valid, plate = validate_indian_plate(raw)
        print(f"Input: '{raw}' -> Valid: {valid}, Plate: '{plate}' (Expected: {expected_valid}, {expected_plate})")
