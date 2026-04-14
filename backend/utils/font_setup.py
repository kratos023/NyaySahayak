# utils/font_setup.py
import os
import sys
import requests
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

def download_hindi_font():
    """Download Noto Sans Devanagari font from Google Fonts"""
    try:
        font_dir = os.path.dirname(__file__)
        font_path = os.path.join(font_dir, 'NotoSansDevanagari-Regular.ttf')
        
        if os.path.exists(font_path):
            return font_path
            
        print("📥 Downloading Hindi font from Google Fonts...")
        
        # Direct download URL for Noto Sans Devanagari Regular
        url = "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf"
        
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        with open(font_path, 'wb') as f:
            f.write(response.content)
            
        print(f"✅ Hindi font downloaded: {font_path}")
        return font_path
        
    except Exception as e:
        print(f"❌ Font download failed: {e}")
        return None

def setup_fonts():
    """Setup Hindi font - call this once at app startup"""
    try:
        # Try multiple font sources
        font_paths = [
            # Local bundled font
            os.path.join(os.path.dirname(__file__), 'NotoSansDevanagari-Regular.ttf'),
            os.path.join(os.path.dirname(__file__), 'NotoSansDevanagari.ttf'),
            
            # System fonts (Ubuntu/Debian)
            '/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            
            # System fonts (CentOS/RHEL)
            '/usr/share/fonts/google-noto/NotoSansDevanagari-Regular.ttf',
            '/usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf',
            
            # Alpine Linux
            '/usr/share/fonts/ttf-dejavu/DejaVuSans.ttf',
        ]
        
        font_path = None
        
        # First, try existing paths
        for path in font_paths:
            if os.path.exists(path):
                font_path = path
                break
        
        # If not found, try to download
        if not font_path:
            font_path = download_hindi_font()
        
        if font_path and os.path.exists(font_path):
            # Register the font
            pdfmetrics.registerFont(TTFont('NotoSansDevanagari', font_path))
            
            # Also register a bold variant (using same font for now)
            pdfmetrics.registerFont(TTFont('NotoSansDevanagari-Bold', font_path))
            
            print(f"✅ Hindi font registered: {font_path}")
            return True
        else:
            # Fallback: try to register DejaVu Sans which has some Unicode support
            try:
                from reportlab.pdfbase.pdfmetrics import registerFontFamily
                # Register Helvetica family with Unicode support if available
                pdfmetrics.registerFont(TTFont('DejaVu-Sans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
                pdfmetrics.registerFont(TTFont('DejaVu-Sans-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
                print("✅ DejaVu Sans registered as fallback for Hindi")
                return True
            except:
                pass
                
            print("❌ Hindi font not available - PDFs will show boxes for Hindi text")
            return False
            
    except Exception as e:
        print(f"❌ Font setup error: {e}")
        return False

def get_best_font_for_text(text, default_font="Helvetica"):
    """Get the best available font for given text"""
    if not text:
        return default_font
        
    # Check if text contains Hindi/Devanagari characters
    hindi_range = range(0x0900, 0x097F + 1)  # Devanagari Unicode range
    has_hindi = any(ord(char) in hindi_range for char in text)
    
    if has_hindi:
        # Try Noto Sans first
        if HINDI_FONT_AVAILABLE:
            return 'NotoSansDevanagari'
        # Fallback to DejaVu if available
        try:
            from reportlab.pdfbase.pdfmetrics import _fonts
            if 'DejaVu-Sans' in _fonts:
                return 'DejaVu-Sans'
        except:
            pass
    
    return default_font

def get_best_bold_font_for_text(text, default_font="Helvetica-Bold"):
    """Get the best available bold font for given text"""
    if not text:
        return default_font
        
    # Check if text contains Hindi/Devanagari characters
    hindi_range = range(0x0900, 0x097F + 1)
    has_hindi = any(ord(char) in hindi_range for char in text)
    
    if has_hindi:
        # Try Noto Sans Bold first
        if HINDI_FONT_AVAILABLE:
            return 'NotoSansDevanagari-Bold'
        # Fallback to DejaVu Bold if available
        try:
            from reportlab.pdfbase.pdfmetrics import _fonts
            if 'DejaVu-Sans-Bold' in _fonts:
                return 'DejaVu-Sans-Bold'
        except:
            pass
    
    return default_font

# Check if font is available
HINDI_FONT_AVAILABLE = setup_fonts()
