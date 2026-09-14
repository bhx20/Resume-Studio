<!--
Sync Impact Report
Version change: unratified template -> 1.0.0
Modified principles:
  - PRINCIPLE_1: Adopted as "I. Strict Single-Column & ATS-Safe Architecture (NON-NEGOTIABLE)"
  - PRINCIPLE_2: Adopted as "II. Semantic Heading Hierarchy & Standard Taxonomy"
  - PRINCIPLE_3: Adopted as "III. Absolute Truthfulness & Zero Fabrication (NON-NEGOTIABLE)"
  - PRINCIPLE_4: Adopted as "IV. Action + Metric STAR Bullet Standard"
  - PRINCIPLE_5: Adopted as "V. Multi-Format Asset Synchronization & Strict 2-Page Budget"
  - PRINCIPLE_6: Adopted as "VI. Recruiter 6-Second Scanability & Technical Credibility"
Added sections:
  - Technical Stack & Formatting Constraints
  - Quality Gates & Verification Workflow
Removed sections: None
Follow-up TODOs: None
-->

# Enterprise ATS Resume System Constitution

## Core Principles

### I. Strict Single-Column & ATS-Safe Architecture (NON-NEGOTIABLE)
Every generated resume format MUST use an uncompromising single-column, top-to-bottom layout. Multi-column tables, sidebars, floating text frames, and graphic canvas elements are strictly prohibited, as they scramble parse orders across enterprise Applicant Tracking Systems (Workday, Taleo, Greenhouse, Lever, iCIMS). All text layers MUST be native selectable UTF-8 text streams (CIDFont / Type 0 TrueType) without rasterization or text embedded in images. Skill bars, rating stars, progress indicators, contact icons, and decorative Unicode symbols are forbidden. Parser reliability MUST always supersede visual decoration.

### II. Semantic Heading Hierarchy & Standard Taxonomy
All documents MUST structure content under globally recognized uppercase section titles: `PROFESSIONAL SUMMARY`, `TECHNICAL SKILLS`, `PROFESSIONAL EXPERIENCE`, `SELECTED PROJECTS`, `CORE ENGINEERING & ACHIEVEMENTS`, and `EDUCATION`. Documents MUST employ native semantic heading structures (`<h1>` for candidate name, `<h2>` for sections, `<h3>` for roles and projects, and native Word `HeadingLevel.HEADING_2`) so that parsing engines reliably extract and categorize career entities without heuristic guesswork.

### III. Absolute Truthfulness & Zero Fabrication (NON-NEGOTIABLE)
Never invent or extrapolate employment, company names, job titles, technologies, certifications, degrees, projects, achievements, metrics, or responsibilities. If specific data or metrics are missing, they MUST be explicitly marked as unconfirmed (e.g., `[Metric not provided — add measurable result if available]`) rather than fabricated. Content enhancements MUST be strictly limited to wording precision, technical clarity, and impact framing grounded in verified experience.

### IV. Action + Metric STAR Bullet Standard
Every experience and project bullet point MUST adhere to the proven structure: `ACTION VERB + TECHNOLOGY/METHOD + WHAT WAS DONE + TECHNICAL/BUSINESS OUTCOME`. Bullet points MUST highlight what was engineered, what architectural complexity was solved, and quantifiable outcomes (e.g., latency reduction, throughput increases, user counts, crash-free session rates, revenue volume) wherever genuinely available. Passive responsibility statements ("responsible for...") are prohibited.

### V. Multi-Format Asset Synchronization & Strict 2-Page Budget
Every modification to candidate data MUST automatically synchronize across all five production export formats: PDF, DOCX, HTML, Markdown, and Plain Text, all residing in the designated `assets/` directory. The generated PDF MUST strictly respect a hard 2-page ceiling with balanced white space, zero line collisions, zero text clipping, and zero spillover onto a 3rd page. Page 1 MUST terminate cleanly after professional experience, dedicating Page 2 to flagship projects, engineering achievements, and education.

### VI. Recruiter 6-Second Scanability & Technical Credibility
Within six seconds of scanning, a human recruiter or engineering manager MUST clearly grasp the candidate's core identity, years of experience, primary technical specialization, architectural depth, and flagship scale. Content MUST demonstrate deep engineering maturity (e.g., memory leak disposal, isolate concurrency, AST parsing, token refresh interceptors) rather than superficial keyword listing.

## Technical Stack & Formatting Constraints

- **Engine & Runtime**: Node.js local management studio, Express API endpoints, headless Chromium/Edge (`--print-to-pdf`, `--disable-gpu`, `--no-pdf-header-footer`) for exact PDF printing.
- **DOCX Generation**: Native programmatic generation via the `docx` package using left-aligned Arial typography, native headings, and standard ATS margin boundaries (0.35–0.45 in).
- **Typography & Scale**: Standard web-safe sans-serif (Arial, Helvetica, Calibri); name at 18–19pt bold; section headers at 10–10.5pt uppercase bold with single hairline bottom border; body copy at 8.5–9pt with 1.25–1.28 line height.
- **Color & Styling**: High-contrast monochrome (#000000 on #ffffff). Hyperlinks MUST be functional via semantic `<a>` tags with clean styling to prevent blue underline clutter in print/PDF.
- **Repository Cleanliness**: The project root MUST remain pristine. All generated export assets, source images, and reference PDFs MUST reside inside `assets/`.

## Quality Gates & Verification Workflow

1. **Pre-Flight Syntax Validation**: Every server and generator change MUST pass syntax checks (`node -c server.js`, `node -c docx-generator.js`) before running.
2. **Deterministic Data Sync**: Updates MUST be saved to `resume-data.json` and mirrored in `default-resume-data.json` before triggering full asset generation.
3. **Visual & OCR Inspection**: Every PDF build MUST be verified with `view_file` to confirm exact page counts, clean page breaks, zero text overlap, and complete OCR extractability.
4. **Keyword Gap & Redundancy Audit**: Prior to final delivery, resumes MUST be audited against target job requirements for keyword relevance, technical depth, and zero duplicate phrases.

## Governance

- This Constitution defines the non-negotiable standards for all resume development, templates, data models, and export pipelines within this project.
- Amendments require explicit documentation of rationale, a semantic version bump, and validation against the 100-point ATS evaluation standard.
- Any pull request, automated refactor, or manual update that introduces multi-column tables, visual fluff, fabricated claims, or page count overflow MUST be rejected.

**Version**: 1.0.0 | **Ratified**: 2026-09-14 | **Last Amended**: 2026-09-14
