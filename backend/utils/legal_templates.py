import os
import tempfile
from datetime import datetime
from reportlab.lib.pagesizes import A4, LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, 
    PageBreak, ListFlowable
)
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


def clean_text(text):
    """Remove unwanted characters from text"""
    if not text:
        return ""
    text = str(text)
    bad_chars = '■□▪▫▬▭▮▯▰▱▲△▴▵▶▷█▓▒░'
    for char in bad_chars:
        text = text.replace(char, '')
    text = ' '.join(text.split())
    return text.strip()


def safe_field(value, default="Not Provided"):
    if value is None:
        return default
    text = clean_text(str(value))
    if not text or text in ["", "None", "null", "/", "//", "Not Provided"]:
        return default
    return text


def generate_legal_notice(notice_data):
    """
    Generate a legal notice document
    
    Args:
        notice_data: Dictionary containing notice information
        
    Returns:
        bytes: PDF file content
    """
    filename = tempfile.mktemp(suffix='.pdf')
    doc = SimpleDocTemplate(filename, pagesize=A4, 
                          rightMargin=0.5*inch, leftMargin=0.5*inch, 
                          topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    styles = getSampleStyleSheet()
    story = []
    
    # Header
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Heading1'],
        fontSize=16,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER,
        textColor=colors.HexColor('#DC3232'),
        spaceAfter=20
    )
    
    story.append(Paragraph("LEGAL NOTICE", header_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Sender Details
    story.append(Paragraph("FROM:", styles['Heading2']))
    sender_data = [
        ['Name:', safe_field(notice_data.get('sender_name'))],
        ['Address:', safe_field(notice_data.get('sender_address'))]
    ]
    sender_table = Table(sender_data, colWidths=[1.5*inch, 5*inch])
    sender_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(sender_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Recipient Details
    story.append(Paragraph("TO:", styles['Heading2']))
    recipient_data = [
        ['Name:', safe_field(notice_data.get('recipient_name'))],
        ['Address:', safe_field(notice_data.get('recipient_address'))]
    ]
    recipient_table = Table(recipient_data, colWidths=[1.5*inch, 5*inch])
    recipient_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(recipient_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Subject
    subject_style = ParagraphStyle(
        'Subject',
        parent=styles['Heading2'],
        fontSize=12,
        fontName='Helvetica-Bold',
        textColor=colors.black,
        spaceAfter=10
    )
    story.append(Paragraph(f"SUBJECT: {safe_field(notice_data.get('subject'))}", subject_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Notice Content
    story.append(Paragraph("Dear Sir/Madam,", styles['Normal']))
    story.append(Spacer(1, 0.1*inch))
    
    # Main content
    content_style = ParagraphStyle(
        'Content',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_JUSTIFY,
        leading=14
    )
    
    notice_content = safe_field(notice_data.get('content', ''))
    story.append(Paragraph(notice_content, content_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Demands/Claims
    if notice_data.get('amount_claimed', 0) > 0:
        story.append(Paragraph("In view of the above, you are hereby called upon to:", styles['Heading3']))
        claim_text = f"Pay the amount of ₹{notice_data.get('amount_claimed'):,} within {notice_data.get('days_to_comply', 15)} days from the date of this notice."
        story.append(Paragraph(claim_text, content_style))
    
    story.append(Spacer(1, 0.2*inch))
    
    # Warning
    warning_style = ParagraphStyle(
        'Warning',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.red,
        alignment=TA_JUSTIFY
    )
    
    warning_text = f"""
    Please take note that if you fail to comply with the demands made in this notice within {notice_data.get('days_to_comply', 15)} days, 
    we shall be constrained to initiate appropriate legal proceedings against you in the competent court of law at your risk as to cost and consequences.
    """
    story.append(Paragraph(warning_text, warning_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Closing
    story.append(Paragraph("Thanking you,", styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("Yours faithfully,", styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph(safe_field(notice_data.get('sender_name')), styles['Normal']))
    
    story.append(Spacer(1, 0.5*inch))
    
    # Date and Place
    date_place_data = [
        ['Place:', safe_field(notice_data.get('place', 'City'))],
        ['Date:', datetime.now().strftime("%d %B, %Y")]
    ]
    date_table = Table(date_place_data, colWidths=[1.5*inch, 5*inch])
    date_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
    ]))
    story.append(date_table)
    
    # Disclaimer
    story.append(PageBreak())
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_JUSTIFY
    )
    
    disclaimer_text = """
    IMPORTANT DISCLAIMER: This legal notice is generated by an AI-powered legal assistant for informational purposes only. 
    It is recommended to consult with a qualified legal professional before sending any legal notice. 
    The sender assumes full responsibility for the contents of this notice. 
    This document does not constitute formal legal advice and should not be relied upon as such.
    """
    story.append(Paragraph(disclaimer_text, disclaimer_style))
    
    # Build PDF
    doc.build(story)
    
    # Read and return PDF bytes
    with open(filename, 'rb') as f:
        pdf_bytes = f.read()
    
    # Clean up temporary file
    os.unlink(filename)
    
    return pdf_bytes


def generate_legal_petition(petition_data):
    """
    Generate a court petition document
    
    Args:
        petition_data: Dictionary containing petition information
        
    Returns:
        bytes: PDF file content
    """
    filename = tempfile.mktemp(suffix='.pdf')
    doc = SimpleDocTemplate(filename, pagesize=A4, 
                          rightMargin=0.5*inch, leftMargin=0.5*inch, 
                          topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    styles = getSampleStyleSheet()
    story = []
    
    # Header - Court Name
    court_style = ParagraphStyle(
        'CourtHeader',
        parent=styles['Heading1'],
        fontSize=14,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER,
        textColor=colors.HexColor('#2E86AB'),
        spaceAfter=10
    )
    
    story.append(Paragraph(safe_field(petition_data.get('court_name', 'IN THE COURT OF ...')), court_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Case Title
    case_title_style = ParagraphStyle(
        'CaseTitle',
        parent=styles['Heading2'],
        fontSize=12,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER,
        spaceAfter=15
    )
    
    petitioner = safe_field(petition_data.get('petitioner_name'))
    respondent = safe_field(petition_data.get('respondent_name'))
    case_type = safe_field(petition_data.get('case_type', 'Civil'))
    
    case_title = f"{case_type} Case No. ___________ of {datetime.now().strftime('%Y')}"
    story.append(Paragraph(case_title, case_title_style))
    
    parties_title = f"{petitioner} ... Petitioner(s)\nVs.\n{respondent} ... Respondent(s)"
    story.append(Paragraph(parties_title, case_title_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Petition Heading
    story.append(Paragraph("PETITION UNDER APPROPRIATE LAW", styles['Heading2']))
    story.append(Spacer(1, 0.2*inch))
    
    # Petitioner Details
    story.append(Paragraph("PETITIONER(S):", styles['Heading3']))
    petitioner_data = [
        ['Name:', safe_field(petition_data.get('petitioner_name'))],
        ['Address:', safe_field(petition_data.get('petitioner_address'))],
        ['Contact:', safe_field(petition_data.get('petitioner_contact', 'Not Provided'))]
    ]
    petitioner_table = Table(petitioner_data, colWidths=[1.5*inch, 5*inch])
    petitioner_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.black),
    ]))
    story.append(petitioner_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Respondent Details
    story.append(Paragraph("RESPONDENT(S):", styles['Heading3']))
    respondent_data = [
        ['Name:', safe_field(petition_data.get('respondent_name'))],
        ['Address:', safe_field(petition_data.get('respondent_address'))]
    ]
    respondent_table = Table(respondent_data, colWidths=[1.5*inch, 5*inch])
    respondent_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.black),
    ]))
    story.append(respondent_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Facts of the Case
    story.append(Paragraph("FACTS OF THE CASE:", styles['Heading3']))
    facts_style = ParagraphStyle(
        'Facts',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_JUSTIFY,
        leading=14
    )
    
    facts_content = safe_field(petition_data.get('facts_of_case', ''))
    story.append(Paragraph(facts_content, facts_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Grounds/Relief Sought
    story.append(Paragraph("GROUNDS/RELIEF SOUGHT:", styles['Heading3']))
    relief_content = safe_field(petition_data.get('relief_sought', ''))
    story.append(Paragraph(relief_content, facts_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Prayer
    story.append(Paragraph("PRAYER:", styles['Heading3']))
    prayer_style = ParagraphStyle(
        'Prayer',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_JUSTIFY,
        leading=14,
        textColor=colors.HexColor('#DC3232')
    )
    
    prayer_content = safe_field(petition_data.get('prayer', ''))
    story.append(Paragraph(prayer_content, prayer_style))
    story.append(Spacer(1, 0.5*inch))
    
    # Signature Section
    signature_data = [
        ['', ''],
        ['Place: ' + safe_field(petition_data.get('place', 'City')), ''],
        ['Date: ' + datetime.now().strftime("%d %B, %Y"), 'Signature of Petitioner'],
        ['', safe_field(petition_data.get('petitioner_name'))]
    ]
    
    signature_table = Table(signature_data, colWidths=[3*inch, 3*inch])
    signature_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(signature_table)
    
    # Verification (on new page)
    story.append(PageBreak())
    story.append(Paragraph("VERIFICATION", styles['Heading2']))
    story.append(Spacer(1, 0.2*inch))
    
    verification_text = f"""
    I, {safe_field(petition_data.get('petitioner_name'))}, son/daughter/wife of __________________, 
    resident of {safe_field(petition_data.get('petitioner_address'))}, do hereby solemnly affirm and declare:
    
    1. That the contents of this petition are true and correct to my knowledge and belief.
    2. That no part of this petition is false and nothing material has been concealed therefrom.
    3. That this petition is filed in good faith and not with any ulterior motive.
    
    I further declare that I am competent to swear this affidavit.
    """
    
    story.append(Paragraph(verification_text, facts_style))
    story.append(Spacer(1, 0.5*inch))
    
    # Affidavit signature
    affidavit_data = [
        ['', ''],
        ['Deponent:', ''],
        ['', ''],
        ['Place: ' + safe_field(petition_data.get('place', 'City')), ''],
        ['Date: ' + datetime.now().strftime("%d %B, %Y"), '']
    ]
    
    affidavit_table = Table(affidavit_data, colWidths=[3*inch, 3*inch])
    affidavit_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
    ]))
    story.append(affidavit_table)
    
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("Before me:", facts_style))
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("Notary Public/Oath Commissioner", facts_style))
    
    # Disclaimer
    story.append(PageBreak())
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_JUSTIFY
    )
    
    disclaimer_text = """
    IMPORTANT DISCLAIMER: This court petition is generated by an AI-powered legal assistant for informational purposes only. 
    It is strongly recommended to consult with a qualified legal professional before filing any petition in court. 
    The format and content may need to be modified based on specific court rules, jurisdiction, and the nature of the case. 
    This document does not constitute formal legal advice and should not be relied upon as such.
    """
    story.append(Paragraph(disclaimer_text, disclaimer_style))
    
    # Build PDF
    doc.build(story)
    
    # Read and return PDF bytes
    with open(filename, 'rb') as f:
        pdf_bytes = f.read()
    
    # Clean up temporary file
    os.unlink(filename)
    
    return pdf_bytes


def generate_affidavit(affidavit_data):
    """
    Generate an affidavit document
    
    Args:
        affidavit_data: Dictionary containing affidavit information
        
    Returns:
        bytes: PDF file content
    """
    filename = tempfile.mktemp(suffix='.pdf')
    doc = SimpleDocTemplate(filename, pagesize=A4)
    
    styles = getSampleStyleSheet()
    story = []
    
    # Header
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Heading1'],
        fontSize=16,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER,
        textColor=colors.HexColor('#2E86AB'),
        spaceAfter=20
    )
    
    story.append(Paragraph("AFFIDAVIT", header_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Deponent Details
    normal_style = styles['Normal']
    
    deponent_info = f"""
    I, {safe_field(affidavit_data.get('deponent_name'))}, son/daughter/wife of {safe_field(affidavit_data.get('father_name', '_________'))}, 
    aged about {safe_field(affidavit_data.get('age', '__'))} years, resident of {safe_field(affidavit_data.get('address'))}, 
    do hereby solemnly affirm and declare on oath as under:
    """
    
    story.append(Paragraph(deponent_info, normal_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Affidavit Content
    content_style = ParagraphStyle(
        'Content',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_JUSTIFY,
        leading=14,
        leftIndent=20
    )
    
    affidavit_content = safe_field(affidavit_data.get('content', ''))
    paragraphs = affidavit_content.split('\n')
    
    for i, para in enumerate(paragraphs):
        if para.strip():
            story.append(Paragraph(f"{i+1}. {para}", content_style))
            story.append(Spacer(1, 0.1*inch))
    
    story.append(Spacer(1, 0.3*inch))
    
    # Declaration
    declaration_text = """
    I further declare that this affidavit is made conscientiously believing the same to be true and correct.
    """
    story.append(Paragraph(declaration_text, normal_style))
    story.append(Spacer(1, 0.5*inch))
    
    # Signature Section
    signature_data = [
        ['', ''],
        ['Deponent:', ''],
        ['', ''],
        ['Place: ' + safe_field(affidavit_data.get('place', 'City')), ''],
        ['Date: ' + datetime.now().strftime("%d %B, %Y"), '']
    ]
    
    signature_table = Table(signature_data, colWidths=[3*inch, 3*inch])
    signature_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
    ]))
    story.append(signature_table)
    
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("Before me:", normal_style))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("Notary Public/Oath Commissioner", normal_style))
    
    # Build PDF
    doc.build(story)
    
    # Read and return PDF bytes
    with open(filename, 'rb') as f:
        pdf_bytes = f.read()
    
    # Clean up temporary file
    os.unlink(filename)
    
    return pdf_bytes


def get_available_templates():
    """Return list of available legal document templates"""
    return {
        "Legal Notice": "For sending formal legal notices",
        "Court Petition": "For filing petitions in court", 
        "Affidavit": "For sworn statements and declarations",
        "Rental Agreement": "For landlord-tenant agreements",
        "Sale Agreement": "For property sale agreements"
    }


def generate_rental_agreement(agreement_data):
    """Generate rental agreement (placeholder)"""
    # This would be a comprehensive rental agreement generator
    # Implementation would be similar to above functions
    pass


def generate_sale_agreement(agreement_data):
    """Generate sale agreement (placeholder)"""
    # This would be a comprehensive sale agreement generator
    # Implementation would be similar to above functions
    pass