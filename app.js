// CodeSnap Frontend Client Logic

// State
let currentDataUrl = null;
let currentCode = '';
let currentLanguage = 'plaintext';
let isProcessing = false;
let slowWarningTimeout = null;
let userPerLimit = null;
let userRemaining = null;

// Extension Mapping
const EXTENSION_MAP = {
  javascript: 'js',
  js: 'js',
  typescript: 'ts',
  ts: 'ts',
  python: 'py',
  py: 'py',
  html: 'html',
  css: 'css',
  json: 'json',
  c: 'c',
  cpp: 'cpp',
  'c++': 'cpp',
  csharp: 'cs',
  'c#': 'cs',
  java: 'java',
  rust: 'rs',
  go: 'go',
  php: 'php',
  ruby: 'rb',
  sql: 'sql',
  shell: 'sh',
  bash: 'sh',
  kotlin: 'kt',
  swift: 'swift',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  markdown: 'md',
  plaintext: 'txt'
};

// DOM Elements
const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const dropzoneEmpty = document.getElementById('dropzoneEmpty');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const removeImageBtn = document.getElementById('removeImageBtn');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const wrapToggle = document.getElementById('wrapToggle');
const copyBtn = document.getElementById('copyBtn');
const copyText = document.getElementById('copyText');
const downloadBtn = document.getElementById('downloadBtn');
const codePre = document.getElementById('codePre');
const codeBlock = document.getElementById('codeBlock');
const languageBadge = document.getElementById('languageBadge');
const aiNotesBanner = document.getElementById('aiNotesBanner');
const aiNotesText = document.getElementById('aiNotesText');
const statusMessage = document.getElementById('statusMessage');
const slowWarning = document.getElementById('slowWarning');
const accessCodeWrapper = document.getElementById('accessCodeWrapper');
const accessCodeInput = document.getElementById('accessCodeInput');
const quotaNote = document.getElementById('quotaNote');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIconSun = document.getElementById('themeIconSun');
const themeIconMoon = document.getElementById('themeIconMoon');

// Init
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  setupConfig();
  setupEventListeners();
  initCursorEffect();
});

// 1. Theme Management (Light / Dark Neumorphism)
function initTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  updateThemeIcons(currentTheme);

  themeToggleBtn.addEventListener('click', () => {
    const active = document.documentElement.getAttribute('data-theme') || 'light';
    const next = active === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('codesnap_theme', next);
    } catch (e) {}
    updateThemeIcons(next);
  });
}

function updateThemeIcons(theme) {
  if (theme === 'dark') {
    themeIconMoon.classList.add('hidden');
    themeIconSun.classList.remove('hidden');
    themeToggleBtn.setAttribute('aria-label', 'Switch to light theme');
    themeToggleBtn.setAttribute('title', 'Switch to light theme');
  } else {
    themeIconSun.classList.add('hidden');
    themeIconMoon.classList.remove('hidden');
    themeToggleBtn.setAttribute('aria-label', 'Switch to dark theme');
    themeToggleBtn.setAttribute('title', 'Switch to dark theme');
  }
}

// 2. Fetch Server Config (Access Code requirement & Usage Quota)
async function setupConfig() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data.requiresCode) {
        accessCodeWrapper.classList.remove('hidden');
        const savedCode = localStorage.getItem('codesnap_access_code') || '';
        accessCodeInput.value = savedCode;
      }

      if (typeof data.perUserLimit === 'number') {
        userPerLimit = data.perUserLimit;
        userRemaining = data.remaining;
        updateQuotaDisplay();
      }
    }
  } catch (err) {
    // Silent fail if server down initially
  }
}

function updateQuotaDisplay() {
  if (!userPerLimit || userPerLimit === 0) {
    quotaNote.classList.add('hidden');
    return;
  }

  quotaNote.classList.remove('hidden');
  quotaNote.classList.remove('anim-quota-fade');
  void quotaNote.offsetWidth; // Trigger reflow for animation restart
  quotaNote.classList.add('anim-quota-fade');
  const remaining = typeof userRemaining === 'number' ? userRemaining : userPerLimit;
  quotaNote.textContent = '';
  const strongElem = document.createElement('strong');
  strongElem.textContent = `${remaining} of ${userPerLimit}`;
  quotaNote.appendChild(strongElem);
  quotaNote.appendChild(document.createTextNode(' free extractions left today'));

  if (remaining <= 0) {
    generateBtn.disabled = true;
    showStatus(`You've used your ${userPerLimit} free extractions for today. Please come back tomorrow.`, 'error');
  }
}

// 3. Event Listeners Setup
function setupEventListeners() {
  // Access code persistence
  accessCodeInput.addEventListener('input', () => {
    localStorage.setItem('codesnap_access_code', accessCodeInput.value.trim());
  });

  // Dropzone click opens picker
  dropzone.addEventListener('click', (e) => {
    if (e.target === removeImageBtn || removeImageBtn.contains(e.target)) return;
    fileInput.click();
  });

  // Dropzone keyboard access
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  // File Picker Change
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleSelectedFile(file);
  });

  // Drag and Drop (desktop)
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('drag-active');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('drag-active');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleSelectedFile(file);
    } else {
      showStatus('Please drop a valid image file.', 'error');
    }
  });

  // Paste from clipboard (desktop)
  window.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          handleSelectedFile(file);
          showStatus('Image pasted from clipboard!', 'success');
          break;
        }
      }
    }
  });

  // Remove Image
  removeImageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetImageState();
  });

  // Clear / Reset
  clearBtn.addEventListener('click', resetAll);

  // Generate / Extract
  generateBtn.addEventListener('click', handleExtract);

  // Wrap toggle
  wrapToggle.addEventListener('change', () => {
    if (wrapToggle.checked) {
      codePre.classList.add('wrap-active');
    } else {
      codePre.classList.remove('wrap-active');
    }
  });

  // Copy
  copyBtn.addEventListener('click', handleCopy);

  // Download
  downloadBtn.addEventListener('click', handleDownload);

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (currentDataUrl && !isProcessing) {
        e.preventDefault();
        handleExtract();
      }
    }
  });
}

// 4. Process and Downscale Image Client-side via HTML5 Canvas
function handleSelectedFile(file) {
  if (!file.type.startsWith('image/')) {
    showStatus('Selected file is not an image. Please choose a screenshot.', 'error');
    return;
  }

  showStatus('Preparing image...', 'info');

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const maxDimension = 2000;
      let width = img.width;
      let height = img.height;

      // Downscale if longest side > 2000px
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Export as JPEG with 0.9 quality
      const processedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      currentDataUrl = processedDataUrl;

      // Update Preview UI
      imagePreview.src = processedDataUrl;
      dropzoneEmpty.classList.add('hidden');
      previewContainer.classList.remove('hidden');

      if (userRemaining === null || userRemaining > 0) {
        generateBtn.disabled = false;
      }
      hideStatus();
    };
    img.onerror = () => {
      showStatus('Failed to load image. The file may be corrupted.', 'error');
    };
    img.src = e.target.result;
  };
  reader.onerror = () => {
    showStatus('Failed to read image file.', 'error');
  };
  reader.readAsDataURL(file);
}

// Render code with orange highlighting for "AI-added" and "FIXED" lines
function renderCodeOutput(code) {
  codeBlock.innerHTML = '';
  const lines = code.split('\n');
  lines.forEach((line, index) => {
    const isAiAddedOrFixed = /AI-added|FIXED/i.test(line);
    const lineSpan = document.createElement('span');
    lineSpan.textContent = line;
    if (isAiAddedOrFixed) {
      lineSpan.className = 'ai-added-line';
    }
    codeBlock.appendChild(lineSpan);
    if (index < lines.length - 1) {
      codeBlock.appendChild(document.createTextNode('\n'));
    }
  });
}

// 5. Extract Code from Screenshot
async function handleExtract() {
  if (!currentDataUrl || isProcessing) return;

  if (typeof userRemaining === 'number' && userRemaining <= 0) {
    showStatus(`You've used your ${userPerLimit} free extractions for today. Please come back tomorrow.`, 'error');
    return;
  }

  setLoadingState(true);
  hideStatus();

  // Show "Waking up server..." message if request takes longer than 4.5 seconds
  slowWarningTimeout = setTimeout(() => {
    slowWarning.classList.remove('hidden');
  }, 4500);

  const mode = document.querySelector('input[name="extractMode"]:checked')?.value || 'exact';
  const accessCode = accessCodeInput ? accessCodeInput.value.trim() : '';

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (accessCode) {
      headers['x-access-code'] = accessCode;
    }

    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        image: currentDataUrl,
        mode: mode
      })
    });

    const data = await response.json();

    if (!response.ok) {
      let errorMsg = data.error || 'Extraction failed. Please try again.';
      if (data.retryAfter) {
        errorMsg += ` (Retry after ${data.retryAfter} seconds)`;
      }
      if (typeof data.remaining === 'number') {
        userRemaining = data.remaining;
        updateQuotaDisplay();
      }
      showStatus(errorMsg, 'error');
      return;
    }

    // Success: Update remaining quota
    if (typeof data.remaining === 'number') {
      userRemaining = data.remaining;
      updateQuotaDisplay();
    }

    // Success: Populate output
    currentCode = data.code || '';
    currentLanguage = (data.language || 'plaintext').toLowerCase();

    renderCodeOutput(currentCode);
    languageBadge.textContent = currentLanguage;

    // Trigger Part F result slide-up animation
    const codeViewer = document.querySelector('.code-viewer-container');
    if (codeViewer) {
      codeViewer.classList.remove('anim-result-appear');
      void codeViewer.offsetWidth; // Trigger reflow for animation
      codeViewer.classList.add('anim-result-appear');
    }

    if (data.notes && data.notes.trim()) {
      aiNotesText.textContent = data.notes;
      aiNotesBanner.classList.remove('hidden');
    } else {
      aiNotesBanner.classList.add('hidden');
    }

    copyBtn.disabled = !currentCode;
    downloadBtn.disabled = !currentCode;

    showStatus('Code extracted successfully!', 'success');
  } catch (err) {
    showStatus('Network error: Unable to reach server. Please check your connection.', 'error');
  } finally {
    clearTimeout(slowWarningTimeout);
    slowWarning.classList.add('hidden');
    setLoadingState(false);
  }
}

// 6. Copy with Fallback for Older Mobile Browsers
async function handleCopy() {
  if (!currentCode) return;

  let copied = false;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(currentCode);
      copied = true;
    } catch (err) {
      copied = false;
    }
  }

  // Fallback for older mobile browsers / insecure contexts
  if (!copied) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = currentCode;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      copied = document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch (err) {
      copied = false;
    }
  }

  if (copied) {
    copyBtn.classList.add('copied');
    copyText.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyText.textContent = 'Copy';
    }, 2000);
  } else {
    showStatus('Failed to copy to clipboard.', 'error');
  }
}

// 7. Download with Extension Detection
function handleDownload() {
  if (!currentCode) return;

  const rawExt = EXTENSION_MAP[currentLanguage] || 'txt';
  // Strict sanitization: only allow lowercase a-z and 0-9
  const ext = typeof rawExt === 'string' && /^[a-z0-9]{1,10}$/.test(rawExt) ? rawExt : 'txt';
  const filename = `codesnap-${Date.now()}.${ext}`;
  const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helpers
function setLoadingState(loading) {
  isProcessing = loading;
  if (userRemaining !== null && userRemaining <= 0) {
    generateBtn.disabled = true;
  } else {
    generateBtn.disabled = loading || !currentDataUrl;
  }
  const spinner = generateBtn.querySelector('.btn-spinner');
  const label = generateBtn.querySelector('.btn-label');
  const shortcut = generateBtn.querySelector('.btn-shortcut');

  if (loading) {
    spinner.classList.remove('hidden');
    label.textContent = 'Extracting...';
    if (shortcut) shortcut.classList.add('hidden');
  } else {
    spinner.classList.add('hidden');
    label.textContent = 'Extract Code';
    if (shortcut) shortcut.classList.remove('hidden');
  }
}

function resetImageState() {
  currentDataUrl = null;
  fileInput.value = '';
  imagePreview.src = '';
  previewContainer.classList.add('hidden');
  dropzoneEmpty.classList.remove('hidden');
  generateBtn.disabled = true;
  hideStatus();
}

function resetAll() {
  resetImageState();
  currentCode = '';
  currentLanguage = 'plaintext';
  codeBlock.textContent = '';
  const placeholderSpan = document.createElement('span');
  placeholderSpan.className = 'code-placeholder';
  placeholderSpan.textContent = '// Extracted code will appear here.\n// 1. Upload or paste a code screenshot on the left.\n// 2. Select Exact Copy or Complete Missing mode.\n// 3. Click "Extract Code" or press Ctrl+Enter.';
  codeBlock.appendChild(placeholderSpan);
  languageBadge.textContent = 'plaintext';
  aiNotesBanner.classList.add('hidden');
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
  hideStatus();
}

function showStatus(msg, type = 'info') {
  statusMessage.textContent = msg;
  statusMessage.className = `status-banner banner-${type}`;
  statusMessage.classList.remove('hidden');
}

function hideStatus() {
  statusMessage.classList.add('hidden');
  statusMessage.textContent = '';
}

// ========================================================
// PART G: DESKTOP ORANGE CURSOR EFFECT
// ========================================================
function initCursorEffect() {
  // Only enable when desktop pointer matches and reduced motion is off
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!finePointer.matches || reducedMotion.matches) return;

  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  let mouseX = -100;
  let mouseY = -100;
  let ringX = -100;
  let ringY = -100;
  let isHovering = false;
  let isVisible = false;
  let isRunning = false;
  let rafId = null;

  function renderLoop() {
    if (!isRunning) return;

    // Linear interpolation (lag: ~0.15)
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;

    // Dot is 8px -> offset by -4px
    dot.style.transform = `translate3d(${mouseX - 4}px, ${mouseY - 4}px, 0)`;

    // Ring is 36px -> offset by -18px, scale 1.5 if hovering interactive element
    const scale = isHovering ? 1.5 : 1;
    ring.style.transform = `translate3d(${ringX - 18}px, ${ringY - 18}px, 0) scale(${scale})`;

    rafId = requestAnimationFrame(renderLoop);
  }

  function startLoop() {
    if (!isRunning) {
      isRunning = true;
      rafId = requestAnimationFrame(renderLoop);
    }
  }

  function stopLoop() {
    isRunning = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!isVisible) {
      isVisible = true;
      dot.style.opacity = '1';
      ring.style.opacity = '1';
      ringX = mouseX;
      ringY = mouseY;
    }

    if (!isRunning && !document.hidden) {
      startLoop();
    }

    // Interactive target check (buttons, switches, links, upload zone, etc.)
    const target = e.target;
    if (
      target.closest('button') ||
      target.closest('.dropzone') ||
      target.closest('.segment-option') ||
      target.closest('.neumorphic-switch-label') ||
      target.closest('a') ||
      target.closest('input')
    ) {
      if (!isHovering) {
        isHovering = true;
        ring.classList.add('cursor-hover');
      }
    } else {
      if (isHovering) {
        isHovering = false;
        ring.classList.remove('cursor-hover');
      }
    }
  });

  document.addEventListener('mouseleave', () => {
    isVisible = false;
    dot.style.opacity = '0';
    ring.style.opacity = '0';
    stopLoop();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopLoop();
    } else if (isVisible) {
      startLoop();
    }
  });
}
