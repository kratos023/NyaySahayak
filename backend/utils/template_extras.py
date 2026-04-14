# backend/utils/template_extras.py
import os, tempfile
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

def _sf(v, default="_______________"):
    if not v: return default
    s = str(v).strip()
    return s if s else default

def _doc(filename, story):
    doc = SimpleDocTemplate(filename, pagesize=A4,
        rightMargin=0.7*inch, leftMargin=0.7*inch,
        topMargin=0.6*inch, bottomMargin=0.6*inch)
    doc.build(story)
    with open(filename, "rb") as f: b = f.read()
    os.unlink(filename)
    return b

def _styles():
    s = getSampleStyleSheet()
    title  = ParagraphStyle("T",  parent=s["Heading1"], fontSize=15, alignment=TA_CENTER,
                             textColor=colors.HexColor("#1a3a5c"), spaceAfter=4, fontName="Helvetica-Bold")
    sub    = ParagraphStyle("S",  parent=s["Normal"],   fontSize=11, alignment=TA_CENTER,
                             textColor=colors.grey, spaceAfter=16)
    h2     = ParagraphStyle("H2", parent=s["Heading2"], fontSize=12, fontName="Helvetica-Bold",
                             textColor=colors.HexColor("#1a3a5c"), spaceBefore=12, spaceAfter=4)
    body   = ParagraphStyle("B",  parent=s["Normal"],   fontSize=10, alignment=TA_JUSTIFY,
                             leading=15, spaceAfter=6)
    clause = ParagraphStyle("C",  parent=s["Normal"],   fontSize=10, alignment=TA_JUSTIFY,
                             leading=15, spaceAfter=4, leftIndent=18)
    return title, sub, h2, body, clause


# ── Rental Agreement ──────────────────────────────────────────────────────────
def generate_rental_agreement(data: dict) -> bytes:
    fn = tempfile.mktemp(suffix=".pdf")
    title, sub, h2, body, clause = _styles()
    story = []

    story.append(Paragraph("RENTAL / LEASE AGREEMENT", title))
    story.append(Paragraph("(This agreement is executed at the place and date mentioned below)", sub))

    landlord = _sf(data.get("landlord_name"))
    tenant   = _sf(data.get("tenant_name"))
    address  = _sf(data.get("property_address"))
    rent     = _sf(data.get("monthly_rent"))
    deposit  = _sf(data.get("security_deposit"))
    duration = _sf(data.get("duration_months"), "11")
    start    = _sf(data.get("start_date"), datetime.now().strftime("%d/%m/%Y"))
    city     = _sf(data.get("city"))

    story.append(Paragraph("PARTIES", h2))
    story.append(Paragraph(
        f"This Rental Agreement is entered into on <b>{start}</b> between:<br/><br/>"
        f"<b>LANDLORD:</b> {landlord} (hereinafter referred to as \"Landlord\")<br/>"
        f"<b>TENANT:</b> {tenant} (hereinafter referred to as \"Tenant\")", body))

    story.append(Paragraph("PROPERTY", h2))
    story.append(Paragraph(f"The Landlord agrees to rent the following property to the Tenant:<br/>"
                           f"<b>Address:</b> {address}", body))

    story.append(Paragraph("TERMS & CONDITIONS", h2))
    clauses = [
        f"<b>1. Duration:</b> This agreement is for a period of <b>{duration} months</b> commencing from <b>{start}</b>.",
        f"<b>2. Monthly Rent:</b> The Tenant agrees to pay a monthly rent of <b>₹{rent}/-</b> on or before the 5th of each month.",
        f"<b>3. Security Deposit:</b> The Tenant has paid a refundable security deposit of <b>₹{deposit}/-</b>, which shall be returned upon vacating after deducting legitimate dues.",
        "<b>4. Usage:</b> The premises shall be used for residential purposes only. No commercial activity shall be carried out.",
        "<b>5. Maintenance:</b> The Tenant shall maintain the property in good condition and shall be responsible for minor repairs.",
        "<b>6. Utilities:</b> Electricity, water, and other utility bills shall be paid by the Tenant directly.",
        "<b>7. Sub-letting:</b> The Tenant shall not sub-let, assign, or transfer the premises without prior written consent of the Landlord.",
        "<b>8. Termination:</b> Either party may terminate this agreement by giving <b>one month's written notice</b>.",
        "<b>9. Governing Law:</b> This agreement shall be governed by the laws of India and the relevant State Rent Control Act.",
        "<b>10. Dispute Resolution:</b> Any disputes shall first be resolved through mutual discussion, failing which through arbitration or competent courts.",
    ]
    for c in clauses:
        story.append(Paragraph(c, clause))

    story.append(Spacer(1, 0.4*inch))
    story.append(Paragraph("SIGNATURES", h2))
    sig = [
        ["LANDLORD", "", "TENANT"],
        [landlord, "", tenant],
        ["", "", ""],
        ["Signature: ____________", "", "Signature: ____________"],
        [f"Date: {start}", "", f"Date: {start}"],
        [f"Place: {city}", "", f"Place: {city}"],
    ]
    t = Table(sig, colWidths=[2.5*inch, 1*inch, 2.5*inch])
    t.setStyle(TableStyle([
        ("FONTNAME",  (0,0), (-1,-1), "Helvetica"),
        ("FONTSIZE",  (0,0), (-1,-1), 10),
        ("FONTNAME",  (0,0), (-1,0),  "Helvetica-Bold"),
        ("ALIGN",     (0,0), (-1,-1), "LEFT"),
        ("TOPPADDING",(0,0), (-1,-1), 4),
    ]))
    story.append(t)

    notes = ParagraphStyle("N", parent=getSampleStyleSheet()["Normal"],
                            fontSize=8, textColor=colors.grey, spaceBefore=20)
    story.append(Paragraph(
        "Note: This agreement should be executed on stamp paper of appropriate value as per state law "
        "and registered at the Sub-Registrar's office for agreements exceeding 11 months.", notes))

    return _doc(fn, story)


# ── Sale Agreement ────────────────────────────────────────────────────────────
def generate_sale_agreement(data: dict) -> bytes:
    fn = tempfile.mktemp(suffix=".pdf")
    title, sub, h2, body, clause = _styles()
    story = []

    story.append(Paragraph("AGREEMENT FOR SALE", title))
    story.append(Paragraph("(Subject to Registration under the Registration Act, 1908)", sub))

    seller   = _sf(data.get("seller_name"))
    buyer    = _sf(data.get("buyer_name"))
    property_desc = _sf(data.get("property_description"))
    sale_price = _sf(data.get("sale_price"))
    advance  = _sf(data.get("advance_paid", "0"))
    balance  = _sf(data.get("balance_amount"))
    reg_date = _sf(data.get("registration_date", "within 3 months"))
    city     = _sf(data.get("city"))
    date     = datetime.now().strftime("%d/%m/%Y")

    story.append(Paragraph("PARTIES", h2))
    story.append(Paragraph(
        f"This Agreement for Sale is made on <b>{date}</b> between:<br/><br/>"
        f"<b>SELLER:</b> {seller} (hereinafter referred to as \"Vendor\")<br/>"
        f"<b>BUYER:</b> {buyer} (hereinafter referred to as \"Purchaser\")", body))

    story.append(Paragraph("PROPERTY DESCRIPTION", h2))
    story.append(Paragraph(f"The Vendor agrees to sell and the Purchaser agrees to purchase the following property:<br/>{property_desc}", body))

    story.append(Paragraph("TERMS & CONDITIONS", h2))
    clauses = [
        f"<b>1. Sale Consideration:</b> The total agreed sale price is <b>₹{sale_price}/-</b> (Rupees {sale_price} only).",
        f"<b>2. Advance Payment:</b> The Purchaser has paid an advance of <b>₹{advance}/-</b> as token amount on the date of this agreement.",
        f"<b>3. Balance Payment:</b> The balance amount of <b>₹{balance}/-</b> shall be paid at the time of registration of the Sale Deed.",
        f"<b>4. Registration:</b> The Sale Deed shall be executed and registered <b>{reg_date}</b> at the Sub-Registrar's office.",
        "<b>5. Title:</b> The Vendor declares that the property is free from all encumbrances, charges, liens, and legal disputes.",
        "<b>6. Possession:</b> Physical possession of the property shall be handed over to the Purchaser upon registration of the Sale Deed.",
        "<b>7. Documents:</b> The Vendor shall provide all original title documents, tax receipts, and encumbrance certificate to the Purchaser.",
        "<b>8. Default by Vendor:</b> If the Vendor fails to execute the Sale Deed, the Purchaser shall be entitled to specific performance or refund of double the advance amount.",
        "<b>9. Default by Purchaser:</b> If the Purchaser fails to pay the balance and register the deed, the advance amount shall be forfeited.",
        "<b>10. Stamp Duty & Registration:</b> All costs related to stamp duty, registration, and transfer shall be borne by the Purchaser.",
    ]
    for c in clauses:
        story.append(Paragraph(c, clause))

    story.append(Spacer(1, 0.4*inch))
    sig = [
        ["VENDOR (SELLER)", "", "PURCHASER (BUYER)"],
        [seller, "", buyer],
        ["", "", ""],
        ["Signature: ____________", "", "Signature: ____________"],
        [f"Date: {date}", "", f"Date: {date}"],
        [f"Place: {city}", "", f"Place: {city}"],
        ["Witness 1: ____________", "", "Witness 2: ____________"],
    ]
    t = Table(sig, colWidths=[2.5*inch, 1*inch, 2.5*inch])
    t.setStyle(TableStyle([
        ("FONTNAME",  (0,0), (-1,-1), "Helvetica"),
        ("FONTSIZE",  (0,0), (-1,-1), 10),
        ("FONTNAME",  (0,0), (-1,0),  "Helvetica-Bold"),
        ("TOPPADDING",(0,0), (-1,-1), 4),
    ]))
    story.append(t)
    return _doc(fn, story)


# ── Employment Offer Letter ───────────────────────────────────────────────────
def generate_employment_offer(data: dict) -> bytes:
    fn = tempfile.mktemp(suffix=".pdf")
    title, sub, h2, body, clause = _styles()
    story = []

    company  = _sf(data.get("company_name"))
    caddress = _sf(data.get("company_address"))
    candidate= _sf(data.get("candidate_name"))
    position = _sf(data.get("position"))
    dept     = _sf(data.get("department"))
    salary   = _sf(data.get("annual_ctc"))
    joining  = _sf(data.get("joining_date"))
    reporting= _sf(data.get("reporting_to"))
    probation= _sf(data.get("probation_months", "6"))
    date     = datetime.now().strftime("%d %B %Y")

    story.append(Paragraph(company.upper(), title))
    story.append(Paragraph(caddress, sub))
    story.append(Spacer(1, 0.2*inch))

    story.append(Paragraph(f"Date: {date}", body))
    story.append(Paragraph(f"To,<br/><b>{candidate}</b>", body))
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph(f"Subject: <b>Offer of Employment — {position}</b>", body))
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph(f"Dear {candidate.split()[0]},", body))
    story.append(Paragraph(
        f"We are pleased to offer you the position of <b>{position}</b> in the <b>{dept}</b> department "
        f"at {company}. This offer is subject to the terms and conditions set out below.", body))

    story.append(Paragraph("TERMS OF EMPLOYMENT", h2))
    terms = [
        ["Position",       position],
        ["Department",     dept],
        ["Reporting To",   reporting],
        ["Date of Joining",joining],
        ["Annual CTC",     f"₹{salary}/-"],
        ["Probation Period",f"{probation} months"],
        ["Work Location",  caddress.split(",")[0] if "," in caddress else caddress],
    ]
    t = Table(terms, colWidths=[2*inch, 4*inch])
    t.setStyle(TableStyle([
        ("FONTNAME",  (0,0), (-1,-1), "Helvetica"),
        ("FONTNAME",  (0,0), (0,-1),  "Helvetica-Bold"),
        ("FONTSIZE",  (0,0), (-1,-1), 10),
        ("BACKGROUND",(0,0), (-1,0),  colors.HexColor("#f0f4f8")),
        ("LINEBELOW", (0,0), (-1,-1), 0.5, colors.lightgrey),
        ("TOPPADDING",(0,0), (-1,-1), 5),
        ("BOTTOMPADDING",(0,0),(-1,-1),5),
    ]))
    story.append(t)

    story.append(Paragraph("CONDITIONS", h2))
    conds = [
        "<b>1. Probation:</b> You will be on probation for the period mentioned above, during which either party may terminate with 7 days' notice.",
        "<b>2. Confirmation:</b> Upon satisfactory performance, you will be confirmed as a permanent employee.",
        "<b>3. Notice Period:</b> After confirmation, the notice period shall be 30 days on either side.",
        "<b>4. Confidentiality:</b> You shall maintain confidentiality of all company information during and after employment.",
        "<b>5. Other Employment:</b> You shall not take up any other employment, business, or consultancy without prior written permission.",
        "<b>6. Documents:</b> This offer is subject to verification of your educational and experience documents.",
        "<b>7. Acceptance:</b> Please sign and return a copy of this letter within 7 days to indicate your acceptance.",
    ]
    for c in conds:
        story.append(Paragraph(c, clause))

    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("We look forward to you joining our team. Please feel free to contact HR for any queries.", body))
    story.append(Spacer(1, 0.3*inch))

    sig = [
        ["For " + company, "", "Accepted by"],
        ["", "", ""],
        ["Signature: ____________", "", "Signature: ____________"],
        ["Name: ____________", "", f"Name: {candidate}"],
        [f"Date: {date}", "", "Date: ____________"],
    ]
    t2 = Table(sig, colWidths=[2.5*inch, 1*inch, 2.5*inch])
    t2.setStyle(TableStyle([
        ("FONTNAME",  (0,0), (-1,-1), "Helvetica"),
        ("FONTSIZE",  (0,0), (-1,-1), 10),
        ("FONTNAME",  (0,0), (-1,0),  "Helvetica-Bold"),
        ("TOPPADDING",(0,0), (-1,-1), 4),
    ]))
    story.append(t2)
    return _doc(fn, story)
