# backend/utils/fir_generator.py
"""
Official FIR format — Form 24.1 under Section 154 CrPC / Section 173 BNSS.
Matches the actual numbered box format used by Indian police stations.
"""
import os, io, tempfile, base64
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable, Image as RLImage
)

# Import font support
try:
    from .font_setup import get_best_font_for_text, get_best_bold_font_for_text
except ImportError:
    def get_best_font_for_text(text, default="Helvetica"): return default
    def get_best_bold_font_for_text(text, default="Helvetica-Bold"): return default


def sf(v, default=""):
    if v is None: return default
    s = str(v).strip()
    return s if s and s.lower() not in ["none", "null", "not provided"] else default

def smart_paragraph(text, size=8.5, is_label=False):
    """Create paragraph with proper font for the text"""
    text = sf(text)
    if is_label:
        font_name = get_best_bold_font_for_text(text, "Helvetica-Bold")
        size = 8
    else:
        font_name = get_best_font_for_text(text, "Helvetica")
    
    return ParagraphStyle(
        f"Smart{size}",
        fontName=font_name,
        fontSize=size,
        leading=size + 2.5,
        wordWrap='CJK'
    )


def _tbl(data, col_widths, extra=None):
    base = [
        ("FONTNAME",      (0,0),(-1,-1),"Helvetica"),
        ("FONTSIZE",      (0,0),(-1,-1),8),
        ("GRID",          (0,0),(-1,-1),0.5,colors.black),
        ("VALIGN",        (0,0),(-1,-1),"TOP"),
        ("TOPPADDING",    (0,0),(-1,-1),3),
        ("BOTTOMPADDING", (0,0),(-1,-1),3),
        ("LEFTPADDING",   (0,0),(-1,-1),4),
        ("RIGHTPADDING",  (0,0),(-1,-1),4),
    ]
    if extra: base.extend(extra)
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle(base))
    return t


def generate_fir_document(user_data: dict, proof_images: list = None) -> bytes:
    fn  = tempfile.mktemp(suffix=".pdf")
    W   = A4[0] - 3*cm
    doc = SimpleDocTemplate(fn, pagesize=A4,
          rightMargin=1.5*cm, leftMargin=1.5*cm,
          topMargin=1.2*cm, bottomMargin=1.2*cm)

    # Create smart styles that auto-detect fonts
    def get_lbl_style(text=""): 
        return ParagraphStyle("L", fontName=get_best_bold_font_for_text(text, "Helvetica-Bold"), fontSize=8, leading=10)
    
    def get_val_style(text=""):
        return ParagraphStyle("V", fontName=get_best_font_for_text(text, "Helvetica"), fontSize=8.5, leading=11)
    
    def get_bold_style(text=""):
        return ParagraphStyle("B", fontName=get_best_bold_font_for_text(text, "Helvetica-Bold"), fontSize=9, leading=11)

    story = []

    # Header - check if any content is in Hindi to pick the right font
    sample_text = user_data.get("full_name", "") + user_data.get("incident_description", "")
    header_font = get_best_bold_font_for_text(sample_text, "Helvetica-Bold")
    
    def smart_para(text, style_type="val"):
        """Create smart paragraph with auto font detection"""
        if style_type == "lbl":
            return Paragraph(sf(text), get_lbl_style(text))
        elif style_type == "bold": 
            return Paragraph(sf(text), get_bold_style(text))
        else:
            return Paragraph(sf(text), get_val_style(text))
    
    story.append(Paragraph("FIRST INFORMATION REPORT",
        ParagraphStyle("H", fontName=header_font, fontSize=14, alignment=TA_CENTER)))
    story.append(Paragraph(
        "(Under Section 154 of the Code of Criminal Procedure, 1973 / "
        "Section 173 of Bharatiya Nagarik Suraksha Sanhita, 2023)",
        ParagraphStyle("SH", fontName="Helvetica", fontSize=7.5, alignment=TA_CENTER, spaceAfter=2)))
    story.append(HRFlowable(width=W, thickness=1.5, color=colors.black))
    story.append(Spacer(1,3))

    # 1. District / PS / Year / FIR No / Date
    story.append(_tbl([
        [Paragraph("1. District:", lbl), Paragraph(sf(user_data.get("district")), val),
         Paragraph("Police Station:", lbl), Paragraph(sf(user_data.get("police_station")), val),
         Paragraph("Year:", lbl), Paragraph(sf(user_data.get("year"), datetime.now().strftime("%Y")), val)],
        [Paragraph("FIR No.:", lbl), Paragraph(sf(user_data.get("fir_no"), "(Police to fill)"), val),
         Paragraph("Date:", lbl), Paragraph(sf(user_data.get("fir_date"), datetime.now().strftime("%d/%m/%Y")), val),
         Paragraph("State:", lbl), Paragraph(sf(user_data.get("state")), val)],
    ], [2*cm, 5*cm, 3.5*cm, 4.5*cm, 1.5*cm, 1.5*cm]))

    # 2. Act / Section
    story.append(_tbl([[
        Paragraph("2. Act(s):", lbl), Paragraph(sf(user_data.get("act"), "IPC / BNS 2023"), val),
        Paragraph("Section(s):", lbl),
        Paragraph(sf(user_data.get("sections_applicable"), "(To be filled by police)"), val),
    ]], [2*cm, 5*cm, 3*cm, 8*cm]))

    # 3. Occurrence
    story.append(_tbl([[Paragraph("3. Occurrence of Offence:", bold),
                        Paragraph("", val), Paragraph("", val), Paragraph("", val)]],
                      [W], [("SPAN",(0,0),(-1,0))]))
    odate = sf(user_data.get("incident_date"))
    otime = sf(user_data.get("incident_time"))
    story.append(_tbl([[
        Paragraph("(a) Day:", lbl), Paragraph(sf(user_data.get("incident_day")), val),
        Paragraph("Date From:", lbl), Paragraph(odate, val),
        Paragraph("To:", lbl), Paragraph(odate, val),
        Paragraph("Time From:", lbl), Paragraph(otime, val),
        Paragraph("To:", lbl), Paragraph(otime, val),
    ]], [1.5*cm, 2.5*cm, 2*cm, 2.5*cm, 1*cm, 2.5*cm, 2*cm, 2*cm, 1*cm, 1*cm]))
    story.append(_tbl([[
        Paragraph("(b) Information received at P.S.:", lbl),
        Paragraph(sf(user_data.get("info_received_at"), datetime.now().strftime("%d/%m/%Y %I:%M %p")), val),
        Paragraph("(c) G.D. Reference Entry No.:", lbl),
        Paragraph(sf(user_data.get("gd_reference"), "___"), val),
    ]], [5*cm, 5*cm, 5*cm, 3*cm]))

    # 4. Place
    story.append(_tbl([[
        Paragraph("4. Type of Information:", lbl),
        Paragraph(sf(user_data.get("info_type"), "Written"), val),
        Paragraph("Place of Occurrence:", lbl),
        Paragraph(sf(user_data.get("incident_location")), val),
    ]], [3.5*cm, 3*cm, 3.5*cm, 8*cm]))
    story.append(_tbl([[
        Paragraph("(a) Direction & Distance from P.S.:", lbl),
        Paragraph(sf(user_data.get("distance_from_ps")), val),
        Paragraph("Beat No.:", lbl),
        Paragraph(sf(user_data.get("beat_no")), val),
    ]], [5.5*cm, 7*cm, 2.5*cm, 3*cm]))
    story.append(_tbl([[
        Paragraph("(b) Full Address of Place of Occurrence:", lbl),
        Paragraph(sf(user_data.get("incident_address",
                   user_data.get("incident_location", ""))), val),
    ]], [7*cm, 11*cm]))

    # 5. Complainant
    story.append(_tbl([[Paragraph("5. Complainant / Informant:", bold),
                        Paragraph("", val), Paragraph("", val), Paragraph("", val)]],
                      [W], [("SPAN",(0,0),(-1,0))]))
    story.append(_tbl([[
        Paragraph("(a) Name:", lbl), Paragraph(sf(user_data.get("full_name")), val),
        Paragraph("(b) Father's / Husband's Name:", lbl),
        Paragraph(sf(user_data.get("father_name")), val),
    ]], [2*cm, 6.5*cm, 5*cm, 4.5*cm]))
    story.append(_tbl([[
        Paragraph("(c) DOB:", lbl), Paragraph(sf(user_data.get("dob")), val),
        Paragraph("Age:", lbl), Paragraph(sf(user_data.get("age")), val),
        Paragraph("(d) Nationality:", lbl), Paragraph(sf(user_data.get("nationality"), "Indian"), val),
        Paragraph("(e) Passport No.:", lbl), Paragraph(sf(user_data.get("passport_no"), "N/A"), val),
    ]], [2*cm, 3*cm, 1*cm, 1.5*cm, 3*cm, 3*cm, 2.5*cm, 2*cm]))
    story.append(_tbl([[
        Paragraph("(f) Occupation:", lbl), Paragraph(sf(user_data.get("occupation")), val),
        Paragraph("(g) Address:", lbl),
        Paragraph(
            f"{sf(user_data.get('address_line1'))} {sf(user_data.get('address_line2'))}, "
            f"{sf(user_data.get('city'))}, {sf(user_data.get('district'))}, "
            f"{sf(user_data.get('state'))} - {sf(user_data.get('pincode'))}",
            val),
    ]], [2.5*cm, 3.5*cm, 2.5*cm, 9.5*cm]))
    story.append(_tbl([[
        Paragraph("Phone:", lbl), Paragraph(sf(user_data.get("contact")), val),
        Paragraph("Email:", lbl), Paragraph(sf(user_data.get("email")), val),
        Paragraph("Gender:", lbl), Paragraph(sf(user_data.get("gender")), val),
    ]], [2*cm, 5*cm, 2*cm, 5*cm, 2*cm, 2*cm]))

    # 6. Accused
    accused = sf(user_data.get("accused_details"),
                 "Unknown — to be ascertained during investigation")
    story.append(_tbl([
        [Paragraph("6. Details of Known/Suspected/Unknown Accused:", bold)],
        [Paragraph(accused, val)],
    ], [W], [("SPAN",(0,0),(-1,0))]))

    # 7. Delay reason
    story.append(_tbl([[
        Paragraph("7. Reasons for delay in reporting:", lbl),
        Paragraph(sf(user_data.get("delay_reason"), "No delay in reporting"), val),
    ]], [6*cm, 12*cm]))

    # 8. Property
    prop = sf(user_data.get("property_involved"), "Not applicable")
    story.append(_tbl([
        [Paragraph("8. Particulars of Properties Stolen / Involved:", bold)],
        [Paragraph(prop, val)],
    ], [W], [("SPAN",(0,0),(-1,0))]))

    # 9-10
    story.append(_tbl([[
        Paragraph("9. Total Value of Property Stolen (INR):", lbl),
        Paragraph(sf(user_data.get("property_value"), "N/A"), val),
        Paragraph("10. Inquest Report / U.D. Case No.:", lbl),
        Paragraph(sf(user_data.get("inquest_ref"), "N/A"), val),
    ]], [6*cm, 3.5*cm, 5.5*cm, 3*cm]))

    # 11. FIR Contents
    desc = sf(user_data.get("incident_description"), "")
    story.append(_tbl([
        [Paragraph("11. F.I.R. Contents:", bold)],
        [Paragraph(desc, ParagraphStyle("FD", fontName="Helvetica", fontSize=8.5,
                                         alignment=TA_JUSTIFY, leading=13))],
    ], [W], [("SPAN",(0,0),(-1,0))]))

    # 12. Witnesses
    witnesses = sf(user_data.get("witnesses"), "None / To be identified")
    story.append(_tbl([[
        Paragraph("12. Witnesses (if any):", lbl),
        Paragraph(witnesses, val),
    ]], [4.5*cm, 13.5*cm]))

    # 13. Action taken
    story.append(_tbl([
        [Paragraph("13. Action Taken (since the above report reveals commission of offence):", bold)],
        [Paragraph(
            "(i) Registered the case and took up investigation  YES / NO\n"
            f"(ii) Directed (Name of I.O.): {sf(user_data.get('io_name'))}   "
            f"Rank: {sf(user_data.get('io_rank'))}   No.: {sf(user_data.get('io_number'))}\n"
            "(iii) Refused investigation due to: _______________",
            val)],
    ], [W], [("SPAN",(0,0),(-1,0))]))

    # Signature block
    story.append(Spacer(1, 8))
    story.append(_tbl([[
        Paragraph("Signature / Seal of\nOfficer-in-Charge P.S.\n\n\nName:\nRank:\nNo.:", val),
        Paragraph("", val),
        Paragraph(
            "Signature / Thumb Impression\nof Complainant / Informant\n\n\n\n"
            f"Name: {sf(user_data.get('full_name'))}\n"
            f"Date: {datetime.now().strftime('%d/%m/%Y')}",
            val),
    ]], [6.5*cm, 3*cm, 8.5*cm]))

    # Evidence images
    if proof_images:
        story.append(Spacer(1, 10))
        story.append(Paragraph("DOCUMENTARY EVIDENCE / PROOF ATTACHED",
            ParagraphStyle("EH", fontName="Helvetica-Bold", fontSize=10, alignment=TA_CENTER)))
        story.append(HRFlowable(width=W, thickness=0.5, color=colors.black))
        story.append(Spacer(1, 5))
        for idx, img_b64 in enumerate(proof_images, 1):
            try:
                img_bytes = base64.b64decode(
                    img_b64.split(",")[-1] if "," in img_b64 else img_b64
                )
                img_io = io.BytesIO(img_bytes)
                img = RLImage(img_io, width=12*cm, height=9*cm, kind="proportional")
                story.append(Paragraph(f"Exhibit {idx}:", lbl))
                story.append(img)
                story.append(Spacer(1, 5))
            except Exception:
                story.append(Paragraph(f"Exhibit {idx}: [image could not be embedded]",
                    ParagraphStyle("Err", fontName="Helvetica", fontSize=8, textColor=colors.red)))

    # Footer
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Note: This is a computer-generated FIR draft in official Form 24.1 format. "
        "Submit at your police station. You are entitled to a free copy of the registered FIR under Section 154(3) CrPC. "
        "If police refuse to register, approach the Superintendent of Police or the Judicial Magistrate directly. "
        "Zero FIR can be filed at ANY police station regardless of jurisdiction.",
        ParagraphStyle("Note", fontName="Helvetica", fontSize=7,
                       textColor=colors.grey, alignment=TA_JUSTIFY)))

    doc.build(story)
    with open(fn, "rb") as f: b = f.read()
    os.unlink(fn)
    return b


def generate_zero_fir_document(user_data: dict, proof_images: list = None) -> bytes:
    return generate_fir_document(user_data, proof_images)
