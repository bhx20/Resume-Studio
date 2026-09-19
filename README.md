# Resume Studio 📄✨

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![ATS Calibrated](https://img.shields.io/badge/ATS%20Calibration-2026%20Gold%20Standard-success)](#ats-calibration)
[![Offline First](https://img.shields.io/badge/Storage-Local%20First%20%7C%20Zero%20Tracking-orange)](#privacy--offline-first)
[![Netlify Deploy](https://img.shields.io/badge/Deploy-Netlify%20Ready-00C7B7)](https://www.netlify.com)

> **Resume Studio** is a local-first, privacy-focused Resume & Profile Management Studio calibrated for modern **Applicant Tracking Systems (ATS)**. It features an interactive WYSIWYG dual-page A4 canvas, drag-and-drop section reordering, and multi-format document generation for **100% Vector PDF**, genuine **Microsoft Word (`.docx`)**, **Markdown (`.md`)**, **Plain Text (`.txt`)**, and **JSON (`.json`)**.

---

## 🌟 Key Features

* **🎯 ATS 2026 Gold Standard Calibration:** Formatted with standardized typography (Arial / Helvetica, 8.9pt font, 1.28 line height), tight horizontal rule dividers, proper bullet indentations, and explicit section keywords recognized by enterprise ATS parsers (Workday, Greenhouse, Lever, Taleo, iCIMS).
* **📄 Strict A4 2-Page Standard:** Visual page boundaries with dynamic overflow handling. If a section overflows Page 1, it flows smoothly to Page 2 without duplicating section headings.
* **🖱️ Interactive WYSIWYG Canvas:**
  * **Click-to-Edit:** Click any section on the canvas to open the focused right-side contextual drawer.
  * **Drag-and-Drop Reordering:** Drag sections or individual job positions, projects, and skills to rearrange your resume hierarchy on the fly.
  * **Fit Budget Meter:** Real-time percentage indicator showing page capacity consumption per page.
  * **Direct Inline Heading Editing:** Edit section titles directly on the canvas or from the drawer.
* **📦 Multi-Format Document Generation Engine:**
  * **Print-Ready Vector PDF:** Generates clean, crisp vector PDFs with selectable text, clickable hyperlinks, and zero trailing blank pages via browser print or headless Chromium/Edge.
  * **Native Microsoft Word (`.docx`):** Uses OpenXML standards (`docx` library) to create genuine Word documents matching ATS margins (0.35" top/bottom, 0.45" left/right) and font hierarchies.
  * **Plain Text & Markdown:** Instant export for rapid copy-pasting into ATS textarea fields.
  * **JSON Single Source of Truth:** Import and export your entire resume model (`resume-data.json`) with zero loss.
* **🔒 Privacy & Local-First:** Your sensitive resume data never leaves your computer. All edits are automatically saved to your browser's local storage database and synced dynamically.
* **⚡ Zero Heavy Dependencies:** Built with pure Vanilla ES6+ JavaScript, Tailwind CSS, and lightweight native Node.js HTTP server.

---

## 🚀 Quick Start

### Prerequisites

* [Node.js](https://nodejs.org/) (version 18.0.0 or higher)
* Windows, macOS, or Linux

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/bhx20/Resume-Studio.git
cd Resume-Studio

# 2. Install dependencies
npm install

# 3. Start the studio
npm start
```

### Windows One-Click Launch

Double-click [`start.bat`](start.bat) in the project root to start the server and automatically launch the studio in your default browser at `http://localhost:3000`.

---

## 🛠️ Available Scripts

| Command | Description |
| :--- | :--- |
| `npm start` | Starts the local HTTP application server on port `3000`. |
| `npm run dev` | Runs development server. |
| `npm test` | Executes the integration test suite (validates data models, HTML escaping, DOCX buffers, and API routes). |
| `npm run build` | Compiles client assets and generates `dist/` with Netlify `_redirects` for production deployment. |

---

## 🏛️ Project Architecture

```
Resume-Studio/
├── src/
│   ├── client/                  # Frontend Web Application (Vanilla JS + Tailwind CSS)
│   │   ├── js/
│   │   │   ├── editors/         # Modular section editors
│   │   │   │   ├── editor-core.js     # Drawer controls, tab switching, headings
│   │   │   │   ├── exp-editor.js      # Experience editor & compact reordering
│   │   │   │   ├── proj-editor.js     # Projects editor & compact reordering
│   │   │   │   ├── skills-editor.js   # Skills matrix editor & reordering
│   │   │   │   ├── edu-editor.js      # Education & credentials editor
│   │   │   │   └── custom-editor.js   # Dynamic custom sections editor
│   │   │   ├── canvas.js        # Multi-page A4 canvas renderer & overflow pagination
│   │   │   ├── db.js            # Local database persistence, auto-save & JSON I/O
│   │   │   ├── state.js         # Reactive global state management
│   │   │   ├── toolbar.js       # Zoom, print, DOCX, Markdown, plain text exports
│   │   │   └── utils.js         # String escaping (XSS defense), formatting, alerts
│   │   ├── app.js               # Frontend bootstrap and entry point
│   │   └── index.html           # Single-page application shell
│   ├── config/
│   │   ├── defaultResume.js     # Fallback resume template
│   │   └── index.js             # Environment configuration & MIME types
│   ├── data/
│   │   └── resume-data.json     # Master single source of truth data model
│   ├── generators/              # Multi-format document generation engine
│   │   ├── docx.generator.js    # OpenXML Word (.docx) generator
│   │   ├── html.generator.js    # Calibrated ATS HTML generator (XSS hardened)
│   │   ├── pdf.generator.js     # Cross-platform headless browser vector PDF generator
│   │   └── text.generator.js    # Markdown & plain text generators
│   ├── routes/
│   │   └── resume.routes.js     # HTTP API router (/api/resume, /api/download/*)
│   ├── server.js                # Native Node.js HTTP application server
│   └── utils/
│       └── helpers.js           # Shared ATS formatting & tolerant normalization
├── netlify/
│   └── functions/
│       └── api.js               # Serverless API function for Netlify hosting
├── scripts/
│   └── build.js                 # Production build script for static hosting
├── tests/
│   └── resume.test.js           # Comprehensive integration & test suite
├── netlify.toml                 # Netlify deployment configuration
├── package.json                 # Project dependencies & metadata
├── start.bat                    # Windows one-click starter
└── LICENSE                      # Apache 2.0 Open Source License
```

---

## 🌐 Deploying to Netlify

Resume Studio is pre-configured for automated deployment on [Netlify](https://www.netlify.com):

1. Fork or push this repository to your GitHub account.
2. Link your repository in the Netlify Dashboard.
3. Netlify automatically detects settings from [`netlify.toml`](netlify.toml):
   * **Build command:** `npm run build`
   * **Publish directory:** `dist`
   * **Functions directory:** `netlify/functions`
4. Click **Deploy Site** — your studio will be live with full client-side editing, local persistence, and serverless download capabilities!

---

## 🧩 Data Model (`resume-data.json`)

Resume Studio uses a clean JSON schema:

```json
{
  "personal": {
    "name": "Candidate Name",
    "title": "Target Role Title",
    "location": "City, State, Country",
    "phone": "+1 555-0100",
    "email": "candidate@example.com",
    "linkedin": "https://linkedin.com/in/username",
    "github": "https://github.com/username"
  },
  "summary": "Executive summary paragraph...",
  "skills": [
    { "category": "Languages", "skills": "Dart, TypeScript, SQL" }
  ],
  "experience": [
    {
      "company": "Company Name",
      "role": "Lead Engineer",
      "period": "2022 – Present",
      "location": "City, State",
      "bullets": [
        "Accomplished [Impact], measured by [Metric], by engineering [Feature]."
      ]
    }
  ],
  "projects": [],
  "education": [],
  "achievements": [],
  "customSections": []
}
```

---

## 🔒 Privacy & Offline-First

* **No Analytics or Trackers:** Zero third-party telemetry, ads, or cookies.
* **Client-Side Persistence:** When running online or offline, all modifications are saved in your browser's `localStorage`.
* **Export Anytime:** Download your JSON file at any time via **Export JSON** to backup or transfer between computers.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [Issues page](https://github.com/bhx20/Resume-Studio/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the **Apache License 2.0**. See [`LICENSE`](LICENSE) for more information.

---

**Author:** [Sanket Kalathiya](https://github.com/bhx20)
