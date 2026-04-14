# backend/utils/rti_generator.py
import os
import tempfile
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer


def generate_rti_application(data: dict) -> bytes:
    """
    Generate a proper RTI application PDF.
    data keys: applicant_name, address, city, state, pincode, phone, email,
               department, information_sought, preferred_format, language,
               bpl_card (bool), date
    """
    filename = tempfile.mktemp(suffix=".pdf")
    doc = SimpleDocTemplate(
        filename, pagesize=A4,
        rightMargin=0.8*inch, leftMargin=0.8*inch,
        topMargin=0.7*inch, bottomMargin=0.7*inch
    )
    styles = getSampleStyleSheet()
    story  = []

    # Header
    header_style = ParagraphStyle(
        "RTIHeader", parent=styles["Heading1"],
        fontSize=15, fontName="Helvetica-Bold",
        alignment=TA_CENTER,
        textColor=colors.HexColor("#1a3a5c"),
        spaceAfter=6
    )
    sub_style = ParagraphStyle(
        "RTISub", parent=styles["Normal"],
        fontSize=11, alignment=TA_CENTER,
        textColor=colors.grey
    )
    story.append(Paragraph("APPLICATION UNDER RIGHT TO INFORMATION ACT, 2005", header_style))
    story.append(Paragraph("(Section 6(1) of the RTI Act, 2005)", sub_style))
    story.append(Spacer(1, 0.3*inch))

    # To section
    section_style = ParagraphStyle(
        "Section", parent=styles["Normal"],
        fontSize=12, fontName="Helvetica-Bold",
        textColor=colors.HexColor("#1a3a5c"), spaceAfter=4
    )
    normal = ParagraphStyle("N", parent=styles["Normal"], fontSize=11, spaceAfter=3)

    story.append(Paragraph("To,", section_style))
    story.append(Paragraph(f"The Central/State Public Information Officer", normal))
    story.append(Paragraph(f"<b>{data.get('department', '[Department Name]')}</b>", normal))
    story.append(Spacer(1, 0.15*inch))
    story.append(Paragraph("Subject: <b>Application for Information under RTI Act, 2005</b>", normal))
    story.append(Spacer(1, 0.15*inch))
    story.append(Paragraph("Sir/Madam,", normal))
    story.append(Spacer(1, 0.1*inch))

    intro_text = (
        "I, the undersigned, being a citizen of India, hereby request the following information "
        "under the Right to Information Act, 2005. I am providing my details and the application fee "
        "as required under the Act."
    )
    story.append(Paragraph(intro_text, ParagraphStyle("Intro", parent=styles["Normal"], fontSize=11, alignment=TA_JUSTIFY)))
    story.append(Spacer(1, 0.2*inch))

    # Applicant details table
    story.append(Paragraph("1. APPLICANT DETAILS", section_style))
    app_data = [
        ["Full Name:",    data.get("applicant_name", "")],
        ["Address:",      data.get("address", "")],
        ["City / State:", f"{data.get('city', '')} — {data.get('state', '')}"],
        ["Pincode:",      data.get("pincode", "")],
        ["Phone:",        data.get("phone", "")],
        ["Email:",        data.get("email", "Not provided")],
    ]
    t = Table(app_data, colWidths=[2*inch, 4.2*inch])
    t.setStyle(TableStyle([
        ("FONTNAME",  (0,0), (-1,-1), "Helvetica"),
        ("FONTSIZE",  (0,0), (-1,-1), 10),
        ("VALIGN",    (0,0), (-1,-1), "TOP"),
        ("TEXTCOLOR", (0,0), (0,-1), colors.HexColor("#374151")),
        ("FONTNAME",  (0,0), (0,-1), "Helvetica-Bold"),
        ("LINEBELOW", (0,-1), (-1,-1), 0.5, colors.lightgrey),
        ("TOPPADDING", (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.2*inch))

    # Information sought
    story.append(Paragraph("2. INFORMATION SOUGHT", section_style))
    sought = data.get("information_sought", "")
    story.append(Paragraph(sought, ParagraphStyle("Sought", parent=styles["Normal"], fontSize=11,
                                                   alignment=TA_JUSTIFY, leading=16)))
    story.append(Spacer(1, 0.2*inch))

    # Preferred format
    fmt = data.get("preferred_format", "Certified copies of documents")
    story.append(Paragraph("3. PREFERRED FORMAT OF INFORMATION", section_style))
    story.append(Paragraph(fmt, normal))
    story.append(Spacer(1, 0.2*inch))

    # Fee
    story.append(Paragraph("4. APPLICATION FEE", section_style))
    if data.get("bpl_card"):
        fee_text = (
            "I am a Below Poverty Line (BPL) cardholder and am therefore exempt from "
            "paying the application fee as per RTI (Fee and Cost) Rules, 2005. "
            "A copy of my BPL card is enclosed."
        )
    else:
        fee_text = (
            "I am enclosing an application fee of <b>₹10/-</b> by way of "
            "[Indian Postal Order / Cash / Court Fee Stamp / Demand Draft] "
            "payable to the Accounts Officer of the department."
        )
    story.append(Paragraph(fee_text, ParagraphStyle("Fee", parent=styles["Normal"],
                                                      fontSize=11, alignment=TA_JUSTIFY)))
    story.append(Spacer(1, 0.2*inch))

    # Declaration
    story.append(Paragraph("5. DECLARATION", section_style))
    declaration = (
        "I hereby declare that I am a citizen of India and the information sought is not "
        "related to matters exempted under Section 8 of the RTI Act, 2005. "
        "I request you to provide the information within the stipulated time of 30 days "
        "as mandated under Section 7(1) of the RTI Act, 2005."
    )
    story.append(Paragraph(declaration, ParagraphStyle("Decl", parent=styles["Normal"],
                                                         fontSize=11, alignment=TA_JUSTIFY)))
    story.append(Spacer(1, 0.35*inch))

    # Signature
    date_str = data.get("date", datetime.now().strftime("%d/%m/%Y"))
    sig_data = [
        ["Date: " + date_str, ""],
        ["Place: " + data.get("city", ""), "Signature of Applicant"],
        ["", ""],
        ["", data.get("applicant_name", "")],
    ]
    sig_t = Table(sig_data, colWidths=[3.1*inch, 3.1*inch])
    sig_t.setStyle(TableStyle([
        ("FONTNAME",  (0,0), (-1,-1), "Helvetica"),
        ("FONTSIZE",  (0,0), (-1,-1), 11),
        ("ALIGN",     (1,0), (1,-1), "CENTER"),
        ("LINEABOVE", (1,2), (1,2), 0.5, colors.black),
    ]))
    story.append(sig_t)
    story.append(Spacer(1, 0.25*inch))

    # Notes
    notes_style = ParagraphStyle("Notes", parent=styles["Normal"], fontSize=8,
                                  textColor=colors.grey, leading=12)
    notes = """Important Notes:
• Keep a copy of this application and the fee receipt for your records.
• If no response within 30 days, file First Appeal to First Appellate Authority in the same department.
• For Second Appeal, approach Central Information Commission (CIC) or State Information Commission (SIC).
• RTI can also be filed online at: rtionline.gov.in"""
    story.append(Paragraph(notes, notes_style))

    doc.build(story)

    with open(filename, "rb") as f:
        pdf_bytes = f.read()
    os.unlink(filename)
    return pdf_bytes
