"""
generate_readme.py
------------------
Reads index.html in the same directory and regenerates README.md.
Run with:  python generate_readme.py

Requirements: pip install beautifulsoup4
"""

from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).parent
HTML_FILE = ROOT / "index.html"
README_FILE = ROOT / "README.md"


def text(tag):
    """Clean inner text from a tag."""
    return tag.get_text(" ", strip=True) if tag else ""


def build_readme(soup: BeautifulSoup) -> str:
    lines: list[str] = []

    # ── Header ────────────────────────────────────────────────────────────────
    name = text(soup.select_one(".hero-title"))
    role = soup.select_one(".hero-role")
    role_text = role.get_text(" / ", strip=True).replace(" / ", " & ", 1) if role else ""
    desc = soup.select_one('meta[name="description"]')
    desc_text = desc["content"] if desc else ""

    lines += [
        f"# {name} — {role_text}",
        "",
        f"> {desc_text}",
        "",
        "---",
        "",
    ]

    # ── About Me ──────────────────────────────────────────────────────────────
    about_section = soup.select_one("#about")
    if about_section:
        lines += ["## About Me", ""]

        # Main bio block (first about-text-block inside about-content)
        bio_block = about_section.select_one(".about-content .about-text-block")
        if bio_block:
            for child in bio_block.children:
                if not hasattr(child, "name"):
                    continue
                if child.name == "p":
                    lines += [child.get_text(" ", strip=True), ""]
                elif child.name == "ul":
                    for li in child.find_all("li"):
                        strong = li.find("strong")
                        rest = li.get_text(" ", strip=True)
                        if strong:
                            bold = strong.get_text(strip=True)
                            rest = rest.replace(bold, f"**{bold}**", 1)
                        lines.append(f"- {rest}")
                    lines.append("")

        # Info table: Location / Language / Education
        subsections = about_section.select(".section-header h3")
        table_rows = []
        for h3 in subsections:
            label = text(h3)
            # find the sibling about-text-block
            parent = h3.find_parent()
            block = parent.find_next_sibling()
            if block:
                inner = block.select_one(".about-text-block")
                if inner:
                    val = inner.get_text(" ", strip=True)
                    table_rows.append((label, val))

        if table_rows:
            lines += ["| | |", "|---|---|"]
            for label, val in table_rows:
                lines.append(f"| **{label}** | {val} |")
            lines += ["", "---", ""]

    # ── Skills ────────────────────────────────────────────────────────────────
    skills_section = soup.select_one("#skills")
    if skills_section:
        lines += ["## Skills & Tools", ""]
        for group in skills_section.select(".skills-group"):
            group_title = text(group.select_one(".skills-group-title"))
            if group_title:
                lines += [f"### {group_title}", ""]
            badges = [text(b) for b in group.select(".skill-badge")]
            lines += [" ".join(f"`{b}`" for b in badges), ""]
        lines += ["---", ""]

    # ── Experience ────────────────────────────────────────────────────────────
    projects_section = soup.select_one("#projects")
    if projects_section:
        lines += ["## Experience", ""]
        for card in projects_section.select(".project-detail-card"):
            role_el = card.select_one(".detail-project-role")
            company_el = card.select_one(".detail-project-company")
            date_el = card.select_one(".detail-project-date")
            achievements = card.select(".project-achievements li")

            role_str = text(role_el)
            company_str = text(company_el)
            date_str = text(date_el)

            if not role_str:
                continue

            lines += [f"### {role_str} — {company_str}"]
            lines += [f"**{date_str}**", ""]
            for li in achievements:
                lines.append(f"- {text(li)}")
            lines += ["", "---", ""]

    # ── Contact ───────────────────────────────────────────────────────────────
    contact_section = soup.select_one("#contact")
    if contact_section:
        lines += ["## Contact", ""]

        icon_map = {
            "Email": "📧",
            "WhatsApp": "💬",
            "Telegram": "✈️",
            "GitHub": "🐙",
            "LinkedIn": "💼",
            "Download CV": "📄",
        }

        lines += ["| Platform | Link |", "|---|---|"]
        for a in contact_section.select(".contact-badge"):
            title = a.get("title", a.get("aria-label", ""))
            href = a.get("href", "#")
            icon = icon_map.get(title, "🔗")
            span = a.find("span")
            label = text(span) if span else title

            if title == "Email":
                lines.append(f"| {icon} {title} | [{href.replace('mailto:', '')}]({href}) |")
            elif title == "Download CV":
                lines.append(f"| {icon} CV | [Download CV]({href}) |")
            else:
                display = href.replace("https://", "").replace("http://", "").rstrip("/")
                lines.append(f"| {icon} {title} | [{display}]({href}) |")

        lines += [""]

    # ── Footer ────────────────────────────────────────────────────────────────
    lines += ["---", "", "*© Serhii Zelenskyi. All rights reserved.*"]

    return "\n".join(lines) + "\n"


def main():
    if not HTML_FILE.exists():
        print(f"ERROR: {HTML_FILE} not found.")
        return

    html = HTML_FILE.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")

    readme = build_readme(soup)
    README_FILE.write_text(readme, encoding="utf-8")
    print(f"✓ README.md updated ({len(readme):,} chars)")


if __name__ == "__main__":
    main()
