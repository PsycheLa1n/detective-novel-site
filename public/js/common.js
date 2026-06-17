// ===== Common Utilities =====

// Color palettes for book covers (gradient pairs)
const COVER_PALETTES = [
  ['#1a1a3e', '#2d1b69'], ['#16213e', '#0f3460'], ['#1a1a2e', '#533483'],
  ['#1b1b2f', '#3d2c5e'], ['#0f0f23', '#2c3e50'], ['#1d1d3d', '#6b3a3a'],
  ['#1a2a3a', '#4a3a5a'], ['#1c1c2e', '#3a5a4a'], ['#1f1f2e', '#5a3a3a'],
  ['#151530', '#3d4a5c'], ['#1a1a35', '#4a2a4a'], ['#111128', '#2a5a5a'],
  ['#1e1e30', '#5a4a2a'], ['#181830', '#4a2a3a'], ['#1c1c32', '#2a4a2a'],
  ['#131328', '#5a3a6a'], ['#1a1a2a', '#3a3a6a'], ['#141430', '#6a4a3a'],
  ['#1b1b2a', '#3a6a3a'], ['#171728', '#6a3a5a'], ['#1d1d28', '#2a3a6a'],
  ['#191928', '#4a5a3a'], ['#161628', '#3a2a6a'], ['#1c1c28', '#5a2a4a'],
  ['#121228', '#2a6a4a'],
];

// Author avatar colors
const AUTHOR_COLORS = [
  ['#c9a96e', '#8b6914'], ['#e8a87c', '#c47a3a'], ['#d4a574', '#8b5e3c'],
  ['#f0c040', '#c49020'], ['#c9b896', '#8b7d5e'], ['#d4c4a8', '#9b8b6e'],
  ['#e0c088', '#a08048'], ['#c89878', '#886848'], ['#d8b080', '#987050'],
  ['#e8d098', '#a89058'],
];

// Generate a deterministic number from a string
function hashString(str, seed) {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Generate SVG book cover data URI
function generateBookCover(bookId, title, author) {
  const palette = COVER_PALETTES[bookId % COVER_PALETTES.length];
  const [color1, color2] = palette;

  // Safety checks
  const safeTitle = title || '未知书名';
  const safeAuthor = author || '未知作者';

  // Truncate title for display
  const displayTitle = safeTitle.length > 8 ? safeTitle.substring(0, 8) + '...' : safeTitle;
  const displayAuthor = safeAuthor.length > 6 ? safeAuthor.substring(0, 6) + '...' : safeAuthor;

  // Font size depends on title length
  const titleSize = safeTitle.length > 6 ? (safeTitle.length > 10 ? '22' : '28') : '34';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1}"/>
      <stop offset="100%" style="stop-color:${color2}"/>
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.15)"/>
      <stop offset="50%" style="stop-color:rgba(255,255,255,0)"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="400" height="560" rx="8" fill="url(#bg)"/>
  <rect width="400" height="560" rx="8" fill="url(#shine)"/>
  <!-- Decorative line -->
  <line x1="40" y1="120" x2="360" y2="120" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <line x1="40" y1="440" x2="360" y2="440" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <!-- Decorative ornament -->
  <circle cx="200" cy="225" r="80" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <circle cx="200" cy="225" r="60" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <!-- Title -->
  <text x="200" y="240" font-family="Georgia, serif" font-size="${titleSize}" font-weight="bold"
        fill="rgba(255,255,255,0.9)" text-anchor="middle" dominant-baseline="middle">${escapeXml(displayTitle)}</text>
  <!-- Author -->
  <text x="200" y="470" font-family="Segoe UI, sans-serif" font-size="20"
        fill="rgba(255,255,255,0.6)" text-anchor="middle">${escapeXml(displayAuthor)}</text>
  <!-- Year decoration -->
  <text x="200" y="500" font-family="Georgia, serif" font-size="14"
        fill="rgba(255,255,255,0.3)" text-anchor="middle">MYSTERY</text>
</svg>`;

  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// Generate small SVG cover for cards
function generateBookCoverSmall(bookId, title, author) {
  const palette = COVER_PALETTES[(bookId || 1) % COVER_PALETTES.length];
  const [color1, color2] = palette;
  const safeTitle = title || '未知书名';
  const safeAuthor = author || '未知作者';
  const displayTitle = safeTitle.length > 6 ? safeTitle.substring(0, 6) + '…' : safeTitle;
  const titleSize = safeTitle.length > 6 ? '16' : '20';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="260" height="180" viewBox="0 0 260 180">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1}"/>
      <stop offset="100%" style="stop-color:${color2}"/>
    </linearGradient>
  </defs>
  <rect width="260" height="180" rx="6" fill="url(#bg)"/>
  <line x1="20" y1="60" x2="240" y2="60" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>
  <line x1="20" y1="120" x2="240" y2="120" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>
  <circle cx="130" cy="90" r="28" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
  <text x="130" y="95" font-family="Georgia, serif" font-size="${titleSize}" font-weight="bold"
        fill="rgba(255,255,255,0.9)" text-anchor="middle" dominant-baseline="middle">${escapeXml(displayTitle)}</text>
  <text x="130" y="150" font-family="Segoe UI, sans-serif" font-size="12"
        fill="rgba(255,255,255,0.5)" text-anchor="middle">${escapeXml(safeAuthor.length > 5 ? safeAuthor.substring(0, 5) + '…' : safeAuthor)}</text>
</svg>`;

  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// Generate author avatar SVG
function generateAuthorAvatar(authorName) {
  const safeName = authorName || '未知';
  const idx = hashString(safeName, 42) % AUTHOR_COLORS.length;
  const [color1, color2] = AUTHOR_COLORS[idx];
  const initials = safeName.substring(0, 2);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="av" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1}"/>
      <stop offset="100%" style="stop-color:${color2}"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="50" fill="url(#av)"/>
  <text x="50" y="55" font-family="Georgia, serif" font-size="32" font-weight="bold"
        fill="rgba(255,255,255,0.9)" text-anchor="middle" dominant-baseline="middle">${escapeXml(initials)}</text>
</svg>`;

  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// Format date
function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// API helpers
async function apiGet(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

// Check login state
async function checkLoginState() {
  try {
    const data = await apiGet('/api/me');
    const userArea = document.getElementById('user-area');
    if (!userArea) return;
    if (data.loggedIn) {
      userArea.innerHTML = `
        <span class="username">👤 ${escapeHtml(data.username)}</span>
        <button class="btn btn-outline btn-sm" onclick="logout()">退出</button>
      `;
    } else {
      userArea.innerHTML = `<a href="/login.html" class="btn btn-outline btn-sm">登录</a>`;
    }
  } catch (e) {
    console.error('Login check failed:', e);
  }
}

async function logout() {
  await apiPost('/api/logout');
  window.location.reload();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Render star rating
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '☆' : '') + '☆'.repeat(empty);
}

// Create book card HTML (using SVG cover)
function createBookCard(book) {
  const coverUrl = generateBookCoverSmall(book.id, book.title, book.author);
  return `
    <div class="book-card" onclick="window.location.href='/book.html?id=${book.id}'">
      <div class="card-cover">
        <img src="${coverUrl}" alt="${escapeHtml(book.title)}" class="cover-img" loading="lazy">
        <span class="card-rating-badge">★ ${book.rating}</span>
      </div>
      <div class="card-body">
        <div class="card-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</div>
        <div class="card-author">✍️ ${escapeHtml(book.author)}</div>
        <div class="card-year">📅 ${book.year}</div>
        ${book.tags ? `<div class="card-tags">${book.tags.map(t => `<span class="tag">${escapeHtml(typeof t === 'string' ? t : t.name)}</span>`).join('')}</div>` : ''}
      </div>
    </div>
  `;
}

// Create small book card
function createSmallBookCard(book) {
  const coverUrl = generateBookCoverSmall(book.id, book.title, book.author);
  return `
    <div class="book-card" onclick="window.location.href='/book.html?id=${book.id}'" style="width:160px;flex-shrink:0">
      <div class="card-cover" style="height:110px">
        <img src="${coverUrl}" alt="${escapeHtml(book.title)}" class="cover-img" loading="lazy">
      </div>
      <div class="card-body" style="padding:0.7rem">
        <div class="card-title" style="font-size:0.88rem" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</div>
        <div class="card-year">📅 ${book.year}  ★ ${book.rating}</div>
      </div>
    </div>
  `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  checkLoginState();
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === path ||
        (path === '/' && link.getAttribute('href') === '/') ||
        (path.includes('search') && link.getAttribute('href') === '/search.html')) {
      link.classList.add('active');
    }
  });
});
