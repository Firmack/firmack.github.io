"""
generate_pdf.py
---------------
Reads README.md and produces Serhii_Zelenskyi_CV.pdf.
Run with:  python generate_pdf.py

Requirements: pip install reportlab
"""

import re
from pathlib import Path

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_LEFT, TA_CENTER
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
        Table, TableStyle, KeepTogether, PageBreak,
    )
    from reportlab.platypus.flowables import Flowable
    from reportlab.pdfbase.pdfmetrics import stringWidth
except ImportError:
    import sys, subprocess
    print("Installing reportlab...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab", "-q"])
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_LEFT, TA_CENTER
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
        Table, TableStyle, KeepTogether, PageBreak,
    )
    from reportlab.platypus.flowables import Flowable
    from reportlab.pdfbase.pdfmetrics import stringWidth

ROOT        = Path(__file__).parent
README_FILE = ROOT / "README.md"
OUTPUT_FILE = ROOT / "Serhii_Zelenskyi_CV.pdf"

# ── Colours ────────────────────────────────────────────────────────────────────
C_BLACK    = colors.HexColor("#0a0a0a")
C_DARK     = colors.HexColor("#1a1a1a")
C_BODY     = colors.HexColor("#333333")
C_MID      = colors.HexColor("#888888")
C_LIGHT    = colors.HexColor("#dddddd")
C_WHITE    = colors.HexColor("#f5f5f5")
C_ACCENT   = colors.HexColor("#C49230")   # amber — matches website
C_BADGE_BG = colors.HexColor("#f0f0f0")


# ── Custom flowables ───────────────────────────────────────────────────────────

class HeroBlock(Flowable):
    """Full-width header: name + role on left, contact items on right."""

    def __init__(self, name: str, role: str, contacts: list, width: float, margin: float = 0):
        super().__init__()
        self.name     = name
        self.role     = role
        self.contacts = contacts   # list of (label, value, url)
        self._w       = width
        self._margin  = margin     # page margin to bleed background left/right
        self.height   = 50 * mm

    def draw(self):
        c = self.canv
        h = self.height

        # ── Left column: name + role ──────────────────────────────────────────
        c.setFillColor(C_DARK)
        c.setFont("Helvetica-Bold", 26)
        c.drawString(0, h - 20 * mm, self.name)

        c.setFillColor(C_ACCENT)
        c.setFont("Helvetica", 11)
        c.drawString(0, h - 28 * mm, self.role)

        # ── Vertical separator ────────────────────────────────────────────────
        sep_x = self._w * 0.56
        c.setStrokeColor(C_LIGHT)
        c.setLineWidth(0.5)
        c.line(sep_x, 5 * mm, sep_x, h - 5 * mm)

        # ── Right column: contact items ───────────────────────────────────────
        n = len(self.contacts)
        block_h = n * 5.5 * mm
        # vertically center the block in the hero
        y = (h - block_h) / 2 + block_h - 3 * mm

        for label, value, url in self.contacts:
            # amber bullet dot
            c.setFillColor(C_ACCENT)
            c.circle(sep_x + 4 * mm, y + 1.5 * mm, 0.8 * mm, fill=1, stroke=0)

            # amber label (small caps style)
            c.setFont("Helvetica-Bold", 6.5)
            c.drawString(sep_x + 7 * mm, y, label.upper())

            # dark value, right-aligned
            c.setFillColor(C_BODY)
            c.setFont("Helvetica", 8)
            c.drawRightString(self._w, y, value)

            y -= 5.5 * mm


class SectionTitle(Flowable):
    """Amber left bar + uppercase section label + hairline rule."""

    def __init__(self, text: str, width: float):
        super().__init__()
        self._text = text.upper()
        self._w    = width
        self.height = 11 * mm

    def draw(self):
        c = self.canv
        # Amber left accent bar
        c.setFillColor(C_ACCENT)
        c.rect(0, 3 * mm, 2.5 * mm, 5.5 * mm, fill=1, stroke=0)
        # Label
        c.setFillColor(C_DARK)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(5 * mm, 5.5 * mm, self._text)
        # Hairline rule
        c.setStrokeColor(C_LIGHT)
        c.setLineWidth(0.5)
        c.line(0, 2 * mm, self._w, 2 * mm)


class BadgeRow(Flowable):
    """Skill chips that auto-wrap across lines."""

    PAD_X  = 4   * mm
    H      = 6   * mm
    GAP    = 2   * mm
    LINE_G = 2.5 * mm

    def __init__(self, badges: list, width: float):
        super().__init__()
        self._badges = badges
        self._w      = width
        self.height  = self._calc_height()

    def _calc_height(self) -> float:
        x, rows = 0.0, 1
        for b in self._badges:
            bw = stringWidth(b, "Helvetica", 8) + self.PAD_X * 2
            if x + bw > self._w:
                rows += 1
                x = 0
            x += bw + self.GAP
        return rows * (self.H + self.LINE_G) + self.LINE_G

    def draw(self):
        c = self.canv
        c.setFont("Helvetica", 8)
        x, y = 0.0, self.height - self.H - self.LINE_G

        for b in self._badges:
            bw = stringWidth(b, "Helvetica", 8) + self.PAD_X * 2
            if x + bw > self._w:
                x = 0.0
                y -= self.H + self.LINE_G

            c.setFillColor(C_BADGE_BG)
            c.setStrokeColor(C_LIGHT)
            c.setLineWidth(0.3)
            c.roundRect(x, y, bw, self.H, 1.5 * mm, fill=1, stroke=1)
            c.setFillColor(C_BODY)
            c.drawString(x + self.PAD_X, y + 1.8 * mm, b)
            x += bw + self.GAP


# ── Styles ─────────────────────────────────────────────────────────────────────

def make_styles() -> dict:
    base = getSampleStyleSheet()

    def ps(**kw) -> ParagraphStyle:
        return ParagraphStyle("_", parent=base["Normal"], **kw)

    return {
        "tagline":   ps(fontSize=9,   textColor=C_BODY,   leading=13, spaceBefore=4),
        "body":      ps(fontSize=9.5, textColor=C_BODY,   leading=14, spaceBefore=2),
        "bullet":    ps(fontSize=9,   textColor=C_BODY,   leading=13,
                        leftIndent=10, firstLineIndent=-10, spaceBefore=1),
        "info_lab":  ps(fontSize=9,   textColor=C_MID,    leading=13,
                        fontName="Helvetica-Bold"),
        "info_val":  ps(fontSize=9,   textColor=C_BODY,   leading=13),
        "role_h":    ps(fontSize=11,  textColor=C_DARK,   leading=14,
                        fontName="Helvetica-Bold", spaceBefore=4),
        "company":   ps(fontSize=9.5, textColor=C_BODY,   leading=12),
        "date":      ps(fontSize=8.5, textColor=C_MID,    leading=12,
                        fontName="Helvetica-Oblique"),
        "grp_title": ps(fontSize=9,   textColor=C_DARK,   leading=12,
                        fontName="Helvetica-Bold", spaceBefore=4),
        "contact_l": ps(fontSize=9,   textColor=C_DARK,   leading=13,
                        fontName="Helvetica-Bold"),
        "contact_v": ps(fontSize=9,   textColor=C_ACCENT, leading=13),
        "copyright": ps(fontSize=8,   textColor=C_MID,    leading=11,
                        alignment=TA_CENTER, fontName="Helvetica-Oblique"),
    }


# ── README parser ──────────────────────────────────────────────────────────────

def clean(s: str) -> str:
    s = re.sub(r"\*\*(.*?)\*\*", r"\1", s)
    s = re.sub(r"\*(.*?)\*",     r"\1", s)
    s = re.sub(r"`([^`]+)`",     r"\1", s)
    return re.sub(r"\s+", " ", s).strip()


def markup(s: str) -> str:
    """Convert markdown bold/italic to ReportLab XML tags."""
    s = re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"\*(.*?)\*",     r"<i>\1</i>", s)
    s = re.sub(r"`([^`]+)`",     r"\1", s)
    return re.sub(r"\s+", " ", s).strip()


def split_em(s: str) -> list:
    for sep in [" \u2014 ", " - "]:
        if sep in s:
            return [p.strip() for p in s.split(sep, 1)]
    return [s.strip()]


def parse_readme(text: str) -> dict:
    data = dict(name="", role="", tagline="",
                about=[], info=[], skills=[], jobs=[], contact=[])
    lines = text.splitlines()
    i = 0

    while i < len(lines):
        line = lines[i].rstrip()

        if line.startswith("# ") and not data["name"]:
            p = split_em(line[2:])
            data["name"] = p[0]
            data["role"] = p[1] if len(p) > 1 else ""

        elif line.startswith("> "):
            data["tagline"] = line[2:].strip()

        elif line.startswith("## "):
            section = line[3:].strip().lower()

            if "about" in section:
                i += 1
                para_buf = []

                def flush_para():
                    if para_buf:
                        data["about"].append(("para", markup(" ".join(para_buf))))
                        para_buf.clear()

                while i < len(lines) and not lines[i].startswith("## "):
                    ln = lines[i].rstrip()
                    if ln.startswith("- "):
                        flush_para()
                        data["about"].append(("bullet", markup(ln[2:])))
                    elif ln.startswith("| ") and "---" not in ln:
                        flush_para()
                        cols = [c.strip() for c in ln.strip("|").split("|")]
                        if len(cols) == 2:
                            lab, val = clean(cols[0]), clean(cols[1])
                            if lab and val:
                                data["info"].append((lab, val))
                    elif ln and not ln.startswith("|") and not ln.startswith("#") and ln != "---":
                        para_buf.append(ln.strip())
                    else:
                        flush_para()
                    i += 1
                flush_para()
                continue

            elif "skills" in section:
                i += 1
                while i < len(lines) and not lines[i].startswith("## "):
                    ln = lines[i].rstrip()
                    if ln.startswith("### "):
                        data["skills"].append((ln[4:].strip(), []))
                    elif ln and not ln.startswith("#") and "---" not in ln:
                        badges = re.findall(r"`([^`]+)`", ln)
                        if badges and data["skills"]:
                            data["skills"][-1][1].extend(badges)
                    i += 1
                continue

            elif "experience" in section:
                i += 1
                while i < len(lines) and not lines[i].startswith("## "):
                    ln = lines[i].rstrip()
                    if ln.startswith("### "):
                        p = split_em(ln[4:])
                        role_s    = p[0]
                        company_s = p[1] if len(p) > 1 else ""
                        j, date_s = i + 1, ""
                        while j < len(lines):
                            dl = lines[j].rstrip()
                            if dl:
                                date_s = clean(dl)
                                break
                            j += 1
                        data["jobs"].append((role_s, company_s, date_s, []))
                    elif ln.startswith("- ") and data["jobs"]:
                        data["jobs"][-1][3].append(clean(ln[2:]))
                    i += 1
                continue

            elif "contact" in section:
                i += 1
                while i < len(lines) and not lines[i].startswith("## "):
                    ln = lines[i].rstrip()
                    if ln.startswith("|") and "---" not in ln:
                        cols = [c.strip() for c in ln.strip("|").split("|")]
                        if len(cols) == 2 and cols[0] and cols[1]:
                            label = re.sub(r"[^\w\s&.]", "", cols[0]).strip()
                            m = re.search(r"\[([^\]]+)\]\(([^)]+)\)", cols[1])
                            if m:
                                display, url = m.group(1), m.group(2)
                            else:
                                display, url = clean(cols[1]), ""
                            if label and display and label != "Platform" and display != "Download CV":
                                data["contact"].append((label, display, url))
                    i += 1
                continue

        i += 1
    return data


# ── PDF builder ────────────────────────────────────────────────────────────────

def build_story(data: dict, page_w: float, margins: float) -> list:
    usable = page_w - 2 * margins
    S = make_styles()
    story = []

    # Hero
    story.append(HeroBlock(data["name"], data["role"], data["contact"], usable, margins))
    story.append(Spacer(1, 5 * mm))

    # Tagline
    if data["tagline"]:
        story.append(Paragraph(data["tagline"], S["tagline"]))
        story.append(Spacer(1, 3 * mm))

    # About
    story.append(SectionTitle("About Me", usable))
    story.append(Spacer(1, 1 * mm))
    for kind, content in data["about"]:
        if kind == "para" and content:
            story.append(Paragraph(content, S["body"]))
            story.append(Spacer(1, 1 * mm))
        elif kind == "bullet":
            story.append(Paragraph(f"\u2013\u00a0\u00a0{content}", S["bullet"]))

    if data["info"]:
        story.append(Spacer(1, 3 * mm))
        for lab, val in data["info"]:
            row = Table(
                [[Paragraph(lab, S["info_lab"]), Paragraph(val, S["info_val"])]],
                colWidths=[35 * mm, usable - 35 * mm],
            )
            row.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
            story.append(row)

    # Skills
    story.append(SectionTitle("Skills & Tools", usable))
    story.append(Spacer(1, 1 * mm))
    for grp_name, badges in data["skills"]:
        if not badges:
            continue
        story.append(Paragraph(grp_name, S["grp_title"]))
        story.append(Spacer(1, 1.5 * mm))
        story.append(BadgeRow(badges, usable))
        story.append(Spacer(1, 2 * mm))

    # Experience
    story.append(PageBreak())
    story.append(SectionTitle("Experience", usable))
    story.append(Spacer(1, 1 * mm))
    for idx, (role, company, date, bullets) in enumerate(data["jobs"]):
        block = [
            Paragraph(role, S["role_h"]),
            Paragraph(company, S["company"]),
            Paragraph(date, S["date"]),
            Spacer(1, 2 * mm),
        ]
        for b in bullets:
            block.append(Paragraph(f"\u2013\u00a0\u00a0{b}", S["bullet"]))
        if idx < len(data["jobs"]) - 1:
            block.append(Spacer(1, 3 * mm))
            block.append(HRFlowable(
                width="100%", thickness=0.5, color=C_LIGHT, spaceAfter=2 * mm
            ))
        story.append(KeepTogether(block))

    # Footer
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph(
        "\u00a9 Serhii Zelenskyi. All rights reserved.", S["copyright"]
    ))
    return story


def main():
    if not README_FILE.exists():
        print(f"ERROR: {README_FILE} not found. Run generate_readme.py first.")
        return

    text = README_FILE.read_text(encoding="utf-8")
    data = parse_readme(text)

    margin  = 12 * mm
    hero_h  = 50 * mm
    page_w, page_h = A4

    def draw_hero_bars(canvas, doc):
        """Draw full-bleed amber bars on the raw canvas, bypassing frame clipping."""
        canvas.saveState()
        canvas.setFillColor(C_ACCENT)
        canvas.rect(0, page_h - margin - 2 * mm, page_w, 2 * mm, fill=1, stroke=0)
        canvas.rect(0, page_h - margin - hero_h,  page_w, 2 * mm, fill=1, stroke=0)
        canvas.restoreState()

    doc = SimpleDocTemplate(
        str(OUTPUT_FILE),
        pagesize=A4,
        leftMargin=margin, rightMargin=margin,
        topMargin=margin,  bottomMargin=margin,
        title=f"{data['name']} \u2014 Portfolio",
        author=data["name"],
    )

    story = build_story(data, A4[0], margin)
    doc.build(story, onFirstPage=draw_hero_bars, onLaterPages=lambda c, d: None)
    print(f"OK: {OUTPUT_FILE.name} generated ({OUTPUT_FILE.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
