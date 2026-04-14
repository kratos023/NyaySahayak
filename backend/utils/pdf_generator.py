# utils/pdf_generator.py - COMPLETE FIXED VERSION
import os
import tempfile
from datetime import datetime
import re
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak,
    Image as RLImage, ListFlowable
)
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from PIL import Image as PILImage

# Import font setup
try:
    from .font_setup import HINDI_FONT_AVAILABLE, get_best_font_for_text, get_best_bold_font_for_text
except ImportError:
    HINDI_FONT_AVAILABLE = False
    def get_best_font_for_text(text, default="Helvetica"): return default
    def get_best_bold_font_for_text(text, default="Helvetica-Bold"): return default

def clean_text_safe(text):
    """Clean text safely without removing meaningful content"""
    if not text:
        return ""
    
    text = str(text)
    
    # Only remove actual box characters, not meaningful text
    box_chars = '■□▪▫▬▭▮▯▰▱▲△▴▵▶▷'
    for char in box_chars:
        text = text.replace(char, '')
    
    # Clean extra whitespace but preserve structure
    text = re.sub(r'[ \t]+', ' ', text)
    text = text.strip()
    
    return text

def safe_field(value, default="Not Provided"):
    """Safely handle field values"""
    if value is None:
        return default
    
    text = clean_text_safe(str(value))
    
    if not text or text.lower() in ["", "none", "null", "not provided"]:
        return default
    
    return text

def detect_hindi(text):
    """Detect if text contains Hindi characters"""
    if not text or not isinstance(text, str):
        return False
    hindi_range = '\u0900-\u097F'
    return bool(re.search(f'[{hindi_range}]', text))

def create_smart_paragraph(text, base_style, is_heading=False):
    """Create paragraph with intelligent language handling"""
    text = safe_field(text)
    
    # Basic HTML safety
    text = text.replace('&', '&amp;')
    if '<' in text and '>' in text:
        # Preserve existing HTML tags
        text = text.replace('<', '&lt;').replace('>', '&gt;')
    
    text = text.replace('\n', '<br/>')
    
    # Get best font for this text
    if is_heading:
        font_name = get_best_bold_font_for_text(text, "Helvetica-Bold")
        font_size = 14
        leading = 16
    else:
        font_name = get_best_font_for_text(text, "Helvetica")
        font_size = 11
        leading = 14
    
    style = ParagraphStyle(
        'SmartStyle',
        parent=base_style,
        fontName=font_name,
        fontSize=font_size,
        leading=leading,
        alignment=TA_JUSTIFY,
        wordWrap='CJK' if HINDI_FONT_AVAILABLE else 'LTR'
    )
    
    return Paragraph(text, style)

def create_smart_table(data, col_widths):
    """Create table with proper text handling"""
    styles = getSampleStyleSheet()
    normal_style = styles['Normal']
    
    formatted_data = []
    for row in data:
        formatted_row = []
        for cell in row:
            cell_text = safe_field(cell)
            font_name = get_best_font_for_text(cell_text, 'Helvetica')
            
            cell_style = ParagraphStyle(
                'SmartTableCell',
                parent=normal_style,
                fontName=font_name,
                fontSize=9,
                leading=11,
                wordWrap='CJK' if HINDI_FONT_AVAILABLE else 'LTR'
            )
            formatted_row.append(Paragraph(cell_text, cell_style))
        formatted_data.append(formatted_row)
    
    table = Table(formatted_data, colWidths=col_widths)
    
    # Use smart font for header
    header_font = get_best_bold_font_for_text(str(data[0][0]) if data else "", 'Helvetica-Bold')
    
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
        ('BACKGROUND', (0,1), (-1,-1), colors.white),
        ('FONTNAME', (0,0), (-1,0), header_font),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    
    return table

def process_legal_advice(advice_text):
    """Process legal advice into structured format"""
    advice_text = clean_text_safe(advice_text)
    
    # If advice seems empty or problematic, provide fallback
    if not advice_text or "■■■■■■" in advice_text or "repeated instances" in advice_text.lower():
        return [('text', "Legal advice generation is currently being improved. Please consult with a legal professional for detailed guidance.")]
    
    lines = advice_text.strip().split('\n')
    parsed = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Handle headers
        if line.startswith('##'):
            parsed.append(('header', line.replace('##', '').strip()))
        elif line.startswith('**') and line.endswith('**'):
            parsed.append(('header', line.strip('*')))
        elif line.startswith('* ') and not line.startswith('**'):
            bullet = line[2:].strip()
            parsed.append(('bullet', bullet))
        elif line.startswith('- '):
            bullet = line[2:].strip()
            parsed.append(('bullet', bullet))
        else:
            parsed.append(('text', line))
    
    return parsed if parsed else [('text', advice_text)]

def add_watermark(canvas, doc):
    """Add watermark to PDF pages"""
    canvas.saveState()
    canvas.setFont('Helvetica', 16)
    canvas.setFillAlpha(0.03)
    canvas.rotate(45)
    canvas.setFillColor(colors.gray)
    canvas.drawCentredString(400, 100, "LEGAL AI ASSISTANT - CONFIDENTIAL")
    canvas.restoreState()

def add_document_analysis_section(story, document_analysis, styles):
    """Add document analysis section"""
    if not document_analysis:
        return
        
    normal_style = styles['Normal']
    heading_style = styles['Heading2']
    
    story.append(create_smart_paragraph("SECTION 6: DOCUMENT ANALYSIS", heading_style, is_heading=True))
    story.append(Spacer(1, 0.2*inch))
    
    # Document info
    story.append(create_smart_paragraph(f"<b>Document:</b> {safe_field(document_analysis.get('filename'))}", normal_style))
    story.append(Spacer(1, 0.1*inch))
    
    # Analysis content
    analysis_content = document_analysis.get('analysis', 'No analysis available.')
    story.append(create_smart_paragraph("<b>Analysis:</b>", normal_style))
    story.append(create_smart_paragraph(analysis_content, normal_style))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())

def process_image_for_pdf(file_obj, temp_files):
    """Process image for PDF inclusion with proper error handling"""
    try:
        if hasattr(file_obj, 'read'):
            # Reset file pointer
            file_obj.seek(0)
            
            # Create temporary file
            temp_path = tempfile.mktemp(suffix='.jpg')
            
            # Read and process image
            img_data = file_obj.read()
            with open(temp_path, 'wb') as f:
                f.write(img_data)
            
            # Open with PIL to check and resize
            with PILImage.open(temp_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                
                # Calculate new size (max 4 inches width, maintain aspect ratio)
                max_width = 4 * 72  # 4 inches in points
                if img.width > max_width:
                    ratio = max_width / float(img.width)
                    new_height = int(img.height * ratio)
                    img = img.resize((int(max_width), new_height), PILImage.Resampling.LANCZOS)
                
                # Save processed image
                img.save(temp_path, 'JPEG', quality=85)
            
            temp_files.append(temp_path)
            
            # Create ReportLab image
            pdf_img = RLImage(temp_path)
            pdf_img.hAlign = 'CENTER'
            
            return pdf_img
            
    except Exception as e:
        print(f"Image processing error: {e}")
        return None
    
    return None

def generate_comprehensive_report(user_data, legal_advice, intent_label, helplines=None, document_analysis=None):
    """Generate complete PDF report with all fixes"""
    
    # Initialize
    if helplines is None:
        helplines = []
    
    # Clean data properly
    cleaned_data = {}
    for key, value in user_data.items():
        if isinstance(value, str):
            cleaned_data[key] = clean_text_safe(value)
        else:
            cleaned_data[key] = value
    
    legal_advice = clean_text_safe(legal_advice) if legal_advice else "No legal advice generated."
    intent_label = clean_text_safe(intent_label) if intent_label else "Legal Consultation"
    
    # Create PDF
    filename = tempfile.mktemp(suffix='.pdf')
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        rightMargin=0.5*inch,
        leftMargin=0.5*inch,
        topMargin=0.5*inch,
        bottomMargin=0.5*inch
    )
    
    styles = getSampleStyleSheet()
    story = []
    temp_files = []
    
    # ========== COVER PAGE ==========
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Title'],
        fontSize=20,
        fontName='Helvetica-Bold',
        textColor=colors.darkblue,
        alignment=TA_CENTER,
        spaceAfter=20
    )
    
    story.append(Spacer(1, 2*inch))
    story.append(Paragraph("LEGAL AI ASSISTANT REPORT", title_style))
    story.append(Spacer(1, 0.3*inch))
    story.append(create_smart_paragraph(intent_label, styles['Heading2'], is_heading=True))
    story.append(Spacer(1, 0.5*inch))
    
    report_id = f"LA-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    story.append(create_smart_paragraph(f"Report ID: {report_id}", styles['Normal']))
    story.append(create_smart_paragraph(f"Generated: {datetime.now().strftime('%d %B %Y at %I:%M %p')}", styles['Normal']))
    story.append(Spacer(1, 1*inch))
    story.append(Paragraph("CONFIDENTIAL DOCUMENT", ParagraphStyle(
        'Confidential',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.red,
        alignment=TA_CENTER
    )))
    story.append(PageBreak())
    
    # ========== SECTION 1: PERSONAL INFORMATION ==========
    story.append(create_smart_paragraph("SECTION 1: PERSONAL INFORMATION", styles['Heading2'], is_heading=True))
    story.append(Spacer(1, 0.2*inch))
    
    personal_data = [
        ['Full Name:', safe_field(cleaned_data.get('full_name'))],
        ['Age:', f"{safe_field(cleaned_data.get('age'))} years"],
        ['Gender:', safe_field(cleaned_data.get('gender'))],
        ['Contact:', safe_field(cleaned_data.get('contact'))],
        ['Email:', safe_field(cleaned_data.get('email'))]
    ]
    
    story.append(create_smart_table(personal_data, [2*inch, 4*inch]))
    story.append(Spacer(1, 0.3*inch))
    
    # ========== SECTION 2: ADDRESS DETAILS ==========
    story.append(create_smart_paragraph("SECTION 2: ADDRESS DETAILS", styles['Heading2'], is_heading=True))
    story.append(Spacer(1, 0.2*inch))
    
    address_data = [
        ['Address:', safe_field(cleaned_data.get('address_line1'))],
        ['City:', safe_field(cleaned_data.get('city'))],
        ['District:', safe_field(cleaned_data.get('district'))],
        ['State:', safe_field(cleaned_data.get('state'))],
        ['Pincode:', safe_field(cleaned_data.get('pincode'))]
    ]
    
    story.append(create_smart_table(address_data, [1.5*inch, 4.5*inch]))
    story.append(PageBreak())
    
    # ========== SECTION 3: INCIDENT INFORMATION ==========
    story.append(create_smart_paragraph("SECTION 3: INCIDENT INFORMATION", styles['Heading2'], is_heading=True))
    story.append(Spacer(1, 0.2*inch))
    
    incident_data = [
        ['Incident Type:', safe_field(intent_label)],
        ['Date:', safe_field(cleaned_data.get('incident_date'))],
        ['Location:', safe_field(cleaned_data.get('incident_location'))],
        ['Witnesses:', safe_field(cleaned_data.get('witnesses'))],
        ['Previous Complaints:', safe_field(cleaned_data.get('previous_complaints'))]
    ]
    
    story.append(create_smart_table(incident_data, [2*inch, 4*inch]))
    story.append(Spacer(1, 0.3*inch))
    
    # Incident Description
    story.append(create_smart_paragraph("<b>Detailed Incident Description:</b>", styles['Normal']))
    incident_desc = cleaned_data.get('incident_description', 'No description provided.')
    story.append(create_smart_paragraph(incident_desc, styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(create_smart_paragraph(f"<b>Evidence Available:</b> {safe_field(cleaned_data.get('evidence_types'))}", styles['Normal']))
    story.append(PageBreak())
    
    # ========== SECTION 4: UPLOADED EVIDENCE ==========
    uploaded_files = cleaned_data.get('uploaded_files', [])
    if uploaded_files:
        story.append(create_smart_paragraph("SECTION 4: UPLOADED EVIDENCE", styles['Heading2'], is_heading=True))
        story.append(Spacer(1, 0.2*inch))
        
        story.append(create_smart_paragraph(f"Total Files Uploaded: {len(uploaded_files)}", styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        
        for idx, file_obj in enumerate(uploaded_files, 1):
            file_name = getattr(file_obj, 'name', f'File_{idx}')
            story.append(create_smart_paragraph(f"<b>Evidence {idx}:</b> {file_name}", styles['Normal']))
            
            # Try to process and display image
            if hasattr(file_obj, 'type') and file_obj.type.startswith('image'):
                story.append(Spacer(1, 0.1*inch))
                pdf_image = process_image_for_pdf(file_obj, temp_files)
                if pdf_image:
                    story.append(pdf_image)
                    story.append(Spacer(1, 0.2*inch))
            
            story.append(Spacer(1, 0.1*inch))
        
        story.append(PageBreak())
    
    # ========== SECTION 5: LEGAL ANALYSIS & ADVICE ==========
    story.append(create_smart_paragraph("SECTION 5: LEGAL ANALYSIS & ADVICE", styles['Heading2'], is_heading=True))
    story.append(Spacer(1, 0.2*inch))
    
    parsed_advice = process_legal_advice(legal_advice)
    
    for item_type, content in parsed_advice:
        if item_type == 'header':
            story.append(create_smart_paragraph(f"<b>{content}</b>", styles['Normal']))
            story.append(Spacer(1, 0.1*inch))
        elif item_type == 'bullet':
            story.append(create_smart_paragraph(f"• {content}", styles['Normal']))
            story.append(Spacer(1, 0.05*inch))
        elif item_type == 'text':
            story.append(create_smart_paragraph(content, styles['Normal']))
            story.append(Spacer(1, 0.1*inch))
    
    story.append(PageBreak())
    
    # ========== SECTION 6: DOCUMENT ANALYSIS ==========
    if document_analysis:
        add_document_analysis_section(story, document_analysis, styles)
    
    # ========== SECTION 7: HELPLINES & RESOURCES ==========
    if helplines:
        story.append(create_smart_paragraph("SECTION 7: EMERGENCY CONTACTS", styles['Heading2'], is_heading=True))
        story.append(Spacer(1, 0.2*inch))
        
        for helpline in helplines:
            story.append(create_smart_paragraph(f"• {helpline}", styles['Normal']))
            story.append(Spacer(1, 0.05*inch))
        
        story.append(PageBreak())
    
    # ========== DISCLAIMER ==========
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_JUSTIFY
    )
    
    story.append(create_smart_paragraph(
        "DISCLAIMER: This document is generated by an AI-powered legal assistant for informational purposes only. "
        "It does not constitute legal advice and should not be relied upon as such. Please consult with a qualified "
        "legal professional for advice specific to your situation.",
        disclaimer_style
    ))
    
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph(
        "Generated by Legal AI Assistant | Confidential Document",
        ParagraphStyle('Footer', fontSize=7, alignment=TA_CENTER, textColor=colors.grey)
    ))
    
    # Build PDF
    try:
        doc.build(story, onFirstPage=add_watermark, onLaterPages=add_watermark)
    except Exception as e:
        print(f"PDF build error: {e}")
        # Create simple fallback PDF
        simple_story = [
            Paragraph("LEGAL REPORT - GENERATION ERROR", styles['Heading1']),
            Spacer(1, 0.5*inch),
            Paragraph("There was an error generating the full report.", styles['Normal']),
            Paragraph(f"Error: {str(e)}", styles['Normal'])
        ]
        doc.build(simple_story)
    
    # Read PDF
    with open(filename, 'rb') as f:
        pdf_bytes = f.read()
    
    # Cleanup temp files
    for temp_file in temp_files:
        try:
            if os.path.exists(temp_file):
                os.unlink(temp_file)
        except:
            pass
    
    # Cleanup main PDF file
    try:
        os.unlink(filename)
    except:
        pass
    
    return pdf_bytes