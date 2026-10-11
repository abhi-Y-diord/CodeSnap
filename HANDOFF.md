# HANDOFF: CodeSnap

## Overview
CodeSnap is a lightweight, zero-framework web app that transcribes code screenshots into clean text or completes truncated/cut-off snippets using Vision LLMs.

- **Stack:** Node.js + Express (Backend) + Vanilla HTML / CSS / JavaScript (Frontend).
- **Styling:** Neumorphism (Soft UI) with dual Light (`#F5F1ED`) and Dark (`#1E1E1E`) themes and vibrant Orange accents (`#FF7A1A` to `#FF9A4D`).
- **Zero Database:** Fully stateless architecture with in-memory abuse controls.

---

## Environment Variables

| Variable | Default | Purpose |
| :--- | :---: | :--- |
| `GROQ_API_KEY` | *(Required)* | Primary vision inference using `qwen/qwen3.8-27b` via Groq Cloud. |
| `GEMINI_API_KEY` | *(Optional)* | Automatic failover vision inference using `gemini-1.5-flash` via Google AI Studio. |
| `ACCESS_CODE` | *(Optional)* | Enforces passcode protection via `x-access-code` header. |
| `PER_USER_DAILY_LIMIT`| `12` | Max successful extractions per IP per UTC day. `0` disables this limit. |
| `DAILY_LIMIT` | `300` | Global max successful extractions across the site per UTC day. |
| `PORT` | `3000` | Server listening port. |

*Note on counters:* Counter data is kept strictly in-memory and automatically resets every UTC day (or when the server restarts). Extractions are only counted **after** they succeed; failed requests do not decrement usage quotas.

---

## Key Architectural & UI Decisions

1. **Neumorphism Design Rules:**
   - Every surface uses soft dual-direction shadows (`8px 8px 18px` dark shadow + `-8px -8px 18px` light highlight).
   - Raised components: Cards, buttons, theme toggle, and unselected modes.
   - Pressed/Inset components: Upload dropzone, active extraction mode, wrap switch track, and code output viewer.
   - High readability: Maintains WCAG AA contrast $\ge 4.5:1$ across both light and dark themes.
   - No blue or purple gradients anywhere.
   - Text-only wordmark (`Code` in neutral, `Snap` in orange) with no logo icon or distracting footer elements.

2. **Text Selection Rules (Part E):**
   - The entire page disables text selection via `-webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent`.
   - Single clear exception: The extracted code output box (`.code-viewer-container`, `.code-pre`, `.code-block`, and child spans) and text/password inputs remain selectable (`user-select: text`).
   - Code box selection highlighted in light orange (`::selection`).
   - Screenshot preview image has `draggable="false"` to prevent drag attempts.

3. **Performance-First Animations (Part F):**
   - On page load, header, input card, and output card slide up ($24\text{px}$) and fade in (700ms–750ms with a smooth decelerating `cubic-bezier(0.22, 1, 0.36, 1)` curve, staggered by ~120ms).
   - Code output box slides up and fades in on new result extraction (600ms).
   - Remaining extractions note fades in smoothly upon update (500ms).
   - Animated **only** with `transform: translate3d(...)` and `opacity` (no box-shadow, filter, blur, width, or top/left layout reflows).
   - Fully disabled when `@media (prefers-reduced-motion: reduce)` is active.

4. **Desktop-Only Orange Cursor Effect (Part G):**
   - Active only when `@media (hover: hover) and (pointer: fine)` matches (never on touch screens).
   - Solid 8px orange dot follows pointer exactly; 36px soft orange ring follows with smooth 0.15 interpolation lag via `requestAnimationFrame`.
   - System cursor remains visible.
   - Ring expands ($1.5\times$) over interactive elements (buttons, switches, dropzone, links, inputs).
   - Automatically pauses animation loop when tab is hidden or mouse leaves the window.

5. **Extraction & AI Pipeline:**
   - **Three Extraction Modes**:
     1. `exact`: Transcribes visible code only with preserved indentation and line breaks, without modifying bugs.
     2. `complete`: Transcribes visible code and completes cut-off parts/functions, tagging added lines with `AI-added`.
     3. `fix`: Transcribes visible code, fixes typos, syntax errors, and logic bugs, tagging modified lines with `FIXED` or `AI-added`.
   - **Groq Primary:** 45-second timeout, JSON mode `{ "language": "...", "code": "...", "notes": "..." }`, 1 retry on 429/5xx (respects `retry-after` $\le 5\text{s}$).
   - **Gemini Fallback:** Invoked if Groq fails and `GEMINI_API_KEY` is present.
   - **Client-Side Canvas Downscaling:** Screenshots with dimensions $>2000\text{px}$ are resized before upload.
   - **AI Completion Highlighting:** Lines marked with `AI-added` or `FIXED` receive a custom orange highlight in the code viewer.

6. **Security & Hardening (Part I):**
   - API keys exist solely in `.env` (ignored by `.gitignore`, verified untracked).
   - Server startup logs output boolean presence flags only (`true`/`false`), never secret values.
   - Minimal request logging: records only HTTP status, mode, and execution time in milliseconds. Never logs payloads, images, headers, or keys.
   - Constant-time string matching (`crypto.timingSafeEqual`) prevents timing attacks on `ACCESS_CODE`, with rate limiting on repeated failed attempts (5 fails per 15 min).

---

## Security Review

### What We Checked
1. **Secrets & Git Tracking:**
   - Searched all tracked files using `git grep` for secret markers (`gsk_`, `AIza`, `sk-`, `Bearer `, hardcoded passwords). Confirmed zero secrets committed.
   - Verified `.gitignore` contains `node_modules/`, `.env`, and `*.log`. Confirmed `.env` is completely untracked.
2. **HTTP Security Headers:**
   - Added `helmet` with strict Content Security Policy (`script-src 'self'`, `style-src 'self' https://fonts.googleapis.com`, `font-src https://fonts.gstatic.com`, `img-src 'self' data: blob:`, `connect-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`).
   - Eliminated inline scripts by moving the theme initializer into `public/theme-init.js`.
   - Enabled HSTS (`maxAge: 31536000`, `includeSubDomains: true`, `preload: true`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a restrictive `Permissions-Policy`.
   - Disabled `X-Powered-By` header.
   - Added automatic 301 HTTPS redirection when deployed in production behind a proxy (`x-forwarded-proto`).
3. **Cross-Site Scripting (XSS) & DOM Safety:**
   - Verified that all untrusted model text, code blocks, notes, language badges, and errors are rendered strictly via `textContent` and safe DOM node creation.
   - Removed all `innerHTML` usage across `app.js`.
   - Hardened file download generation by strictly allowlisting extensions matching `/^[a-z0-9]{1,10}$/` based on detected language.
4. **Input Validation & DoS Protection:**
   - Validated `image` via strict Regex (`/^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/=]+)$/`) and verified binary byte size ($\le 8\text{MB}$).
   - Validated `mode` against exact allowlist (`exact`, `complete`, `fix`).
   - Disallowed unexpected extra request body fields.
   - Configured Node server timeouts (`headersTimeout = 20s`, `requestTimeout = 60s`, `keepAliveTimeout = 5s`) to resist Slowloris / slow-connection attacks.
5. **Abuse & Cost Controls:**
   - Added a concurrency limiter allowing a maximum of 2 active in-flight `/api/extract` requests per IP.
   - Strict Origin header verification: rejects any request where `Origin` doesn't match the application host (preventing CSRF / cross-origin abuse).
   - Bound in-memory counter maps to 50,000 maximum entries with oldest-entry eviction on overflow to prevent memory exhaustion attacks.
   - Enforced `trust proxy = 1` for exact single-hop proxy trust (e.g. Render / Cloudflare), preventing spoofed `X-Forwarded-For` IP headers.
6. **Prompt Injection Defense:**
   - Injected clear system instructions into model prompts directing the vision model to treat screenshot contents as passive OCR text only and to ignore any commands inside the image.
7. **Path Traversal & Static Files:**
   - Express static file server only serves `/public`, ignores dotfiles, and rejects traversal (`/../.env`, `/.env` return 404).

### Manual Steps For You
1. **Set `NODE_ENV=production`**: When deploying online (e.g. on Render or Railway), ensure the environment variable `NODE_ENV=production` is set so Helmet enables HSTS and HTTPS redirects take effect.
2. **Never commit `.env`**: Continue keeping your `.env` private on your local machine and input variables directly into your hosting provider's dashboard settings.
