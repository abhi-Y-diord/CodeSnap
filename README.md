# CodeSnap 📸

### Turn code screenshots into clean, copyable code.

CodeSnap is an AI-powered web application that extracts code from screenshots captured on a phone, taken from a gallery, or captured on a desktop. It can transcribe visible code, complete missing sections, and help identify and fix programming errors.

<p align="center">
  <a href="https://codesnap-s3t1.onrender.com/">
    <img src="https://img.shields.io/badge/Visit%20Live%20Website-FF7A1A?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Visit CodeSnap Live Website" />
  </a>
  <a href="https://github.com/abhi-Y-diord/CodeSnap">
    <img src="https://img.shields.io/badge/View%20Source%20Code-24292F?style=for-the-badge&logo=github&logoColor=white" alt="View Source Code" />
  </a>
</p>

---

## ✨ Features

### Three AI-powered extraction modes

- **Exact Copy** — Extracts the code visible in a screenshot while preserving indentation and line breaks, without intentionally correcting mistakes.
- **Complete Missing Code** — Extracts visible code and attempts to complete truncated functions, statements, brackets, and other missing sections. AI-added lines are marked for identification.
- **Fix Errors** — Attempts to identify syntax errors, typos, and logical mistakes, then returns corrected code and explanations of the changes.

### Modern user interface

- Soft neumorphic design with warm white surfaces and orange accents.
- Light and dark themes.
- Responsive, mobile-first layout for phones, tablets, and desktops.
- Drag-and-drop image upload, clipboard paste, and keyboard shortcuts.
- Copyable code output.

### AI processing

- **Primary provider:** Groq Vision using the configured Qwen model.
- **Optional backup:** Google Gemini, used as a fallback when configured.
- Automatic retry for selected temporary provider errors.
- Image optimization in the browser to help reduce processing overhead.

### Usage protection

- Per-IP request rate limiting.
- Configurable daily extraction limits per IP.
- Configurable site-wide daily extraction limit.
- Optional access-code protection.
- Input validation and security headers.

---

## 🚀 Try CodeSnap

**No installation is needed to use the live website.**

1. Open [CodeSnap](https://codesnap-s3t1.onrender.com/).
2. Upload a screenshot containing code, or paste an image from your clipboard where supported.
3. Select **Exact Copy**, **Complete Missing Code**, or **Fix Errors**.
4. Run the extraction and review the result.
5. Copy the extracted or corrected code into your editor.

For best results, use a clear screenshot with readable text, visible indentation, and as much of the relevant code as possible.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express |
| Primary AI provider | Groq API |
| Optional AI provider | Google Gemini API |
| Security | Helmet, request rate limiting, input validation |
| Deployment | Render |
| Package management | npm |

The application uses a lightweight frontend without a large UI framework or a separate database.

---

## ⚙️ Run Locally

### Requirements

- Node.js 18 or later
- npm
- A Groq API key
- Optionally, a Google Gemini API key for backup processing

### 1. Clone the repository

```bash
git clone https://github.com/abhi-Y-diord/CodeSnap.git
cd CodeSnap
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=
ACCESS_CODE=
PER_USER_DAILY_LIMIT=12
DAILY_LIMIT=300
PORT=3000
```

Replace the Groq placeholder with your own API key. Add a Gemini key only if you want to configure the optional backup provider.

**Security:** Never commit `.env` files or API keys to GitHub. Configure production secrets through your hosting provider's environment settings.

### 4. Start the server

```bash
npm start
```

Open the following address in your browser:

http://localhost:3000

---

## 🔐 Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `GROQ_API_KEY` | Yes, unless another provider is available | None | Primary AI provider key |
| `GEMINI_API_KEY` | No | None | Optional backup provider key |
| `ACCESS_CODE` | No | Disabled | Optional extraction access code |
| `PER_USER_DAILY_LIMIT` | No | `12` | Maximum successful extractions per IP per UTC day; `0` disables this limit |
| `DAILY_LIMIT` | No | `300` | Maximum successful extractions across the site per UTC day |
| `PORT` | No | `3000` | HTTP server port; hosting platforms can provide their own value |

### Important usage-limit notes

The current daily usage counters are held in memory. They reset when the server restarts and when the UTC date changes. They are not persistent across restarts or shared across multiple server instances.

The limits help reduce accidental overuse, but in-memory counters are not a substitute for persistent quota enforcement.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check; returns `ok` |
| `GET` | `/api/config` | Returns access-code requirements and current usage information |
| `POST` | `/api/extract` | Processes an image and returns extracted or corrected code |

### Extraction request

Send a JSON request to `/api/extract`:

```json
{
  "image": "data:image/png;base64,BASE64_IMAGE_DATA",
  "mode": "exact"
}
```

Supported modes are:

- `exact`
- `complete`
- `fix`

The endpoint returns the detected programming language, code output, notes, and usage information. Fix mode can also return the original code, corrected code, and a list of identified bugs.

If access-code protection is enabled, include the `x-access-code` header with the configured code.

---

## 🛡️ Security and Privacy

- AI provider keys are configured on the server rather than embedded in frontend code.
- Requests are validated before processing.
- Rate limits help control excessive requests.
- Security headers are configured through Helmet.
- The application does not require a database for its current functionality.

Screenshots submitted for extraction are sent to the configured AI provider for processing. Avoid uploading code or images containing passwords, API keys, personal information, or confidential data.

---

## ☁️ Deployment

CodeSnap is deployed on Render.

**Live application:** https://codesnap-s3t1.onrender.com/

To deploy your own instance:

1. Fork or clone the repository.
2. Create a web service on [Render](https://render.com/).
3. Connect the repository.
4. Use `npm install` as the build command.
5. Use `npm start` as the start command.
6. Configure your API keys and usage limits in the service's environment variables.
7. Deploy and verify the application using `/health`.

Free hosting services may temporarily suspend inactive services, resulting in slower initial requests when they wake up.

---

## 📌 Project Information

- **Project:** CodeSnap
- **Repository:** [abhi-Y-diord/CodeSnap](https://github.com/abhi-Y-diord/CodeSnap)
- **Live website:** [Visit CodeSnap](https://codesnap-s3t1.onrender.com/)
- **License:** MIT

Built to make extracting, understanding, and repairing code from screenshots easier.
