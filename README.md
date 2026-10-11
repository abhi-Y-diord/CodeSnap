# CodeSnap 📸 ➔ 💻

> Turn screenshots of code (from phone camera, gallery, or desktop) into clean, copyable text or intelligently complete truncated code snippets using high-speed Vision AI.

Built with plain **Node.js + Express** (backend) and **Vanilla HTML / CSS / JavaScript** (frontend). No frameworks, no database, no build step. Styled strictly in tactile **Neumorphism (Soft UI)** with a light warm white theme, sleek dark theme, and vibrant orange accents.

---

## Features

- **Neumorphic Soft UI Design:**
  - **Light Theme (Default):** Soft warm white surface (`#F5F1ED`) with dual-tone highlights and shadows, orange accents (`#FF7A1A` to `#FF9A4D`), and dark warm gray typography (`#2B2623`).
  - **Dark Theme:** Low-contrast soft dark surface (`#1E1E1E`), pressed code panels (`#141414`), and warm text (`#F2F2F2`).
  - **Theme Toggle:** Persistent header toggle button switching instantly with zero flash on load.
  - **Text-Only Wordmark:** Clean header wordmark `<span class="brand-code">Code</span><span class="brand-snap">Snap</span>` with zero logo icons or clutter.
- **Three Extraction Modes:**
  1. **Exact Copy:** Transcribes only what is visible, preserving exact indentation and line breaks without altering bugs.
  2. **Complete Missing Code:** Transcribes visible code and completes cut-off functions, loops, or tags. Any lines added by AI end with `// AI-added` (or `# AI-added`, etc.), highlighted with a soft orange stripe and an explanation note.
  3. **Fix Bugs:** Transcribes visible code and automatically diagnoses and fixes typos, syntax errors, and logic bugs, annotating modified lines with `// FIXED` or `// AI-added`.
- **Dual Vision AI Providers with Failover:**
  - **Primary:** Groq (`qwen/qwen3.8-27b`) with native JSON output, 45-second timeout, and auto-retry on 429/5xx.
  - **Optional Backup:** Google Gemini (`gemini-1.5-flash`) automatic fallback if Groq is exhausted.
- **Client-Side Image Optimization:** Automatically downscales images over 2000px using HTML5 Canvas to save bandwidth and speed up processing.
- **Mobile-First Responsiveness:** Fully responsive from 360px width upwards, with safe-area insets, `dvh` units, minimum 44px touch targets, and accessible focus states.
- **Desktop Conveniences:** Drag-and-drop file upload, clipboard paste (`Ctrl+V`), and keyboard shortcuts (`Ctrl+Enter` / `Cmd+Enter` to extract).
- **Abuse Protection & Daily Quotas:**
  - IP-based rate limiting (15 requests/minute per IP) on `/api/extract`.
  - In-memory per-user daily extraction limit (`PER_USER_DAILY_LIMIT`, default 12).
  - Global site-wide daily limit (`DAILY_LIMIT`, default 300).
  - *Note:* Daily counters live strictly in memory and reset automatically every UTC day or when the server restarts. Extractions are only counted **after** they succeed.

---

## Environment Variables

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `GROQ_API_KEY` | **Yes** | — | Groq Cloud API Key for vision model (`qwen/qwen3.8-27b`). |
| `GEMINI_API_KEY` | No | — | Google AI Studio Gemini API Key for backup vision failover (`gemini-1.5-flash`). |
| `ACCESS_CODE` | No | — | Optional passcode required to access `/api/extract`. |
| `PER_USER_DAILY_LIMIT` | No | `12` | Max successful extractions per IP per UTC day. `0` disables the limit (unlimited). |
| `DAILY_LIMIT` | No | `300` | Max total successful extractions for the entire website per UTC day. |
| `PORT` | No | `3000` | Port for the Express HTTP server (fallback when `PORT` not set). |

> **Note on Limits:** All counters live in memory and reset when the server restarts or at 00:00 UTC. Only successful extractions increment the count.

---

## Quick Start (For Beginners)

### 1. Requirements
Make sure you have [Node.js](https://nodejs.org/) (version 18 or higher) installed:
```bash
node -v
```

### 2. Configure Environment Variables
Copy `.env.example` to create your private `.env` file:
```bash
# On Windows PowerShell
Copy-Item .env.example .env

# On Mac / Linux
cp .env.example .env
```

Open `.env` and add your keys:
```env
GROQ_API_KEY=your_actual_groq_api_key_here
GEMINI_API_KEY=
ACCESS_CODE=
PER_USER_DAILY_LIMIT=12
DAILY_LIMIT=300
PORT=3000
```

> **Security Guarantee:** Never commit your `.env` file to version control. It is already added to `.gitignore`.

### 3. Run the App
Start the server:
```bash
npm start
```

Open your browser at:
[http://localhost:3000](http://localhost:3000)

---

## API Endpoints

- `GET /health` — Returns `"ok"`.
- `GET /api/config` — Returns `{ requiresCode, perUserLimit, remaining }`.
- `POST /api/extract` — Processes screenshot:
  - Headers: `Content-Type: application/json`, `x-access-code: <code>` (if required)
  - Body: `{ image: "data:image/jpeg;base64,...", mode: "exact" | "complete" }`
  - Returns: `{ language, code, notes, remaining, perUserLimit }`

---

## License
MIT
