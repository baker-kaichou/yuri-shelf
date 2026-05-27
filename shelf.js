// Classic embedded sample list used as fallback when fetch() is blocked by CORS/Offline (direct file:// launch)
const OFFLINE_FALLBACK = [
  { "id": 1, "title": "Bloom Into You", "rating": 10, "status": "finished", "pubStatus": "completed", "review": "A masterclass in character development, pacing, and psychological depth. Yuu and Touko's exploration of what love means is beautiful, subtle, and incredibly moving. Nakatani Nio's artwork is clean and expressive. Highly recommended!", "tags": ["Romance", "Drama", "School Life", "High School"] },
  { "id": 2, "title": "Whisper Me a Love Song", "rating": 10, "status": "reading", "pubStatus": "ongoing", "review": "Extremely sweet and cozy. Himari and Yori's romance is adorable and features a wonderful music theme. The art is absolutely gorgeous with high contrast paneling and expressive facial details.", "tags": ["Romance", "Music", "School Life", "Fluff"] },
  { "id": 3, "title": "The Summer You Were There", "rating": 10, "status": "finished", "pubStatus": "finished", "review": "An absolutely heart-wrenching, bittersweet masterpiece. The relationship between Shizuku and Kaori is built on layers of tragedy, writing, and beautiful quiet moments. Keep tissues nearby.", "tags": ["Drama", "Tragedy", "Romance", "Emotional"] },
  { "id": 4, "title": "How Do We Relationship?", "rating": 10, "status": "reading", "pubStatus": "ongoing", "review": "One of the most mature and realistic depictions of a queer relationship in manga history. Miwa and Saeko face actual relationship conflicts, communication barriers, and college social pressures. Deeply relatable.", "tags": ["Drama", "Romance", "College Life", "Realistic"] },
  { "id": 5, "title": "I'm in Love with the Villainess", "rating": 8, "status": "reading", "pubStatus": "ongoing", "review": "A delightful isekai rom-com that has surprising political and social depth. Rei's devotion to Claire is both funny and deeply sincere. The world building builds up elegantly over time.", "tags": ["Isekai", "Fantasy", "Comedy", "Romance"] },
  { "id": 6, "title": "Girl Friends", "rating": 10, "status": "finished", "pubStatus": "completed", "review": "A foundational modern yuri classic. Morinaga Milk's story of Mari and Akiko remains the gold standard for high school romance and self-acceptance. The slow-burn progression is perfect.", "tags": ["Romance", "School Life", "Drama", "Classic"] },
  { "id": 7, "title": "Citrus", "rating": 6, "status": "dropped", "pubStatus": "finished", "review": "Highly dramatic stepsibling romance with stunning artwork, but the early pacing and boundary issues can be quite polarizing. Great fashion and side characters though.", "tags": ["Drama", "Romance", "School Life", "Melodrama"] },
  { "id": 8, "title": "Otherside Picnic", "rating": 10, "status": "reading", "pubStatus": "ongoing", "review": "A unique blend of cosmic horror, Japanese internet urban legends, and slow-burn GL romance. Sorawo and Toriko's chemistry in dangerous anomalies is unmatched. Highly atmospheric.", "tags": ["Sci-Fi", "Mystery", "Adventure", "Horror", "Slow Burn"] },
  { "id": 9, "title": "Adachi and Shimamura", "rating": 8, "status": "paused", "pubStatus": "ongoing", "review": "A quiet, highly introspective slice-of-life that focuses on the distance between two teenage girls. Adachi's intense inner monologues are highly relatable and endearing.", "tags": ["Slice of Life", "Romance", "School Life", "Slow Burn"] }
];

let mangaList = [];
let filteredList = [];
let selectedId = null;
let currentSearch = '';
let lastFocusedCard = null;
const elements = {};

// Initialize application
window.addEventListener('DOMContentLoaded', async () => {
  cacheElements();
  bindEvents();
  renderLoadingSkeleton();
  initTheme();
  await loadMangaData();
});

function cacheElements() {
  elements.grid = document.getElementById('manga-grid');
  elements.countLabel = document.getElementById('manga-count');
  elements.statsSummary = document.getElementById('stats-summary');
  elements.detailModal = document.getElementById('detail-modal');
  elements.detailPanel = document.getElementById('detail-panel');
  elements.toastContainer = document.getElementById('toast-container');
  elements.themeToggle = document.getElementById('theme-toggle');
  elements.searchInput = document.getElementById('search-input');
  elements.statusFilter = document.getElementById('filter-status');
  elements.pubStatusFilter = document.getElementById('filter-pub-status');
  elements.tagFilter = document.getElementById('filter-tag');
  elements.ratingFilter = document.getElementById('filter-rating');
}

function bindEvents() {
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.searchInput.addEventListener('input', event => handleSearch(event.target.value));
  [elements.statusFilter, elements.pubStatusFilter, elements.tagFilter, elements.ratingFilter]
    .forEach(select => select.addEventListener('change', applyFilters));
  elements.grid.addEventListener('click', handleGridClick);
  elements.grid.addEventListener('keydown', handleGridKeydown);
  elements.detailPanel.addEventListener('click', handleDetailClick);
  elements.detailModal.addEventListener('click', handleDetailModalClick);
  document.addEventListener('keydown', handleDocumentKeydown);
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab') trapFocusInPanel(event);
  });
}

function renderIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function renderLoadingSkeleton() {
  elements.grid.setAttribute('aria-busy', 'true');
  elements.grid.classList.add('is-loading');
  elements.countLabel.textContent = 'Loading shelf...';
  elements.statsSummary.innerHTML = `
    <span class="skeleton-line skeleton-stat"></span>
    <span class="skeleton-line skeleton-stat"></span>
    <span class="skeleton-line skeleton-stat"></span>
  `;
  elements.grid.innerHTML = Array.from({ length: 8 }, (_, index) => `
    <article class="card skeleton-card" aria-hidden="true">
      <div class="card-body">
        <span class="skeleton-line skeleton-title"></span>
        <span class="skeleton-line skeleton-meta"></span>
        <span class="skeleton-line skeleton-chip"></span>
      </div>
    </article>
  `).join('');
}

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('yuri-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const nextTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', nextTheme);
  localStorage.setItem('yuri-theme', nextTheme);
  updateThemeIcon(nextTheme);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-icon');
  if (theme === 'dark') {
    icon.setAttribute('data-lucide', 'sun');
  } else {
    icon.setAttribute('data-lucide', 'moon');
  }
  document.getElementById('theme-toggle')?.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  renderIcons();
}

// Load shelf data
async function loadMangaData() {
  try {
    const response = await fetch('manga-data.json');
    if (!response.ok) throw new Error('Failed to load local JSON file.');
    mangaList = await response.json();
    showToast('Shelf loaded successfully!', 'success', 'check-circle');
  } catch (err) {
    console.warn('CORS or file access restriction caught. Utilizing offline embedded backup.', err);
    mangaList = OFFLINE_FALLBACK;
    showToast('Loading local backup shelf list.', 'info', 'info');
  }
  mangaList = normalizeMangaListRatings(mangaList);
  populateTagDropdown();
  applyFilters();
}

// Populate dynamic tags in filter select
function populateTagDropdown() {
  const tagsSet = new Set();
  mangaList.forEach(item => {
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach(tag => tagsSet.add(tag.trim()));
    }
  });

  const sortedTags = Array.from(tagsSet).sort();
  // Preserve first option ("All Genres")
  elements.tagFilter.innerHTML = '<option value="all">All Genres</option>';
  sortedTags.forEach(tag => {
    const opt = document.createElement('option');
    opt.value = tag;
    opt.textContent = tag;
    elements.tagFilter.appendChild(opt);
  });
}

// Filters & Search handling
function handleSearch(val) {
  currentSearch = val.trim().toLowerCase();
  applyFilters();
}

function resetFilters() {
  elements.searchInput.value = '';
  elements.statusFilter.value = 'all';
  elements.pubStatusFilter.value = 'all';
  elements.tagFilter.value = 'all';
  elements.ratingFilter.value = 'all';
  currentSearch = '';
  applyFilters();
  showToast('Filters cleared', 'success', 'rotate-ccw');
}

function applyFilters() {
  const statusFilter = elements.statusFilter.value;
  const pubStatusFilter = elements.pubStatusFilter.value;
  const tagFilter = elements.tagFilter.value;
  const ratingFilter = elements.ratingFilter.value;

  filteredList = mangaList.filter(item => {
    // Search filter
    const searchableText = [
      item.title,
      item.alternateTitle,
      item.author,
      item.scanlator,
      item.licensor
    ].filter(Boolean).join(' ').toLowerCase();

    if (currentSearch && !searchableText.includes(currentSearch)) {
      return false;
    }
    // Reading Status filter
    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false;
    }
    // Publication Status filter
    if (pubStatusFilter !== 'all' && item.pubStatus !== pubStatusFilter) {
      return false;
    }
    // Genre/Tag filter
    if (tagFilter !== 'all') {
      const tags = Array.isArray(item.tags) ? item.tags : [];
      const matchTag = tags.some(t => t.trim().toLowerCase() === tagFilter.toLowerCase());
      if (!matchTag) return false;
    }
    // Rating filter
    if (ratingFilter !== 'all') {
      const minRate = parseInt(ratingFilter, 10);
      if (item.rating < minRate) return false;
    }
    return true;
  });

  syncSelectionWithFilters();
  elements.grid.classList.remove('is-loading');
  elements.grid.setAttribute('aria-busy', 'false');
  renderGrid();
  renderStats();
}

function syncSelectionWithFilters() {
  if (selectedId !== null && !filteredList.some(item => item.id === selectedId)) {
    // Reset state directly â€” renderGrid() is called immediately after, so no need to query cards
    closeDetails();
  }
}

// Grid rendering
function renderGrid() {
  elements.countLabel.textContent = `${filteredList.length} ${filteredList.length === 1 ? 'title' : 'titles'}`;

  if (filteredList.length === 0) {
    elements.grid.innerHTML = `
      <div class="grid-empty">
        <div class="empty">
          <i data-lucide="search-x"></i>
          <div class="empty-title">No Literature Found</div>
          <div class="empty-desc">Try resetting your filters or adjusting your search term to explore other girls' love records.</div>
          <button class="btn btn-secondary" type="button" data-action="reset-filters">Reset Filters</button>
        </div>
      </div>
    `;
    renderIcons();
    return;
  }

  elements.grid.innerHTML = filteredList.map(item => {
    const isActive = selectedId === item.id ? 'active' : '';
    const readingBadge = getReadingBadge(item.status);
    const pubBadge = getPubBadge(item.pubStatus);
    const tags = Array.isArray(item.tags) ? item.tags.slice(0, 4) : [];
    const tagSummary = tags.map(tag => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('');
    const authorLine = item.author ? `<div class="card-author"><i data-lucide="pen-line"></i>${escapeHtml(item.author)}</div>` : '';
    const alternateTitle = item.alternateTitle ? `<div class="card-subtitle">${escapeHtml(item.alternateTitle)}</div>` : '';

    return `
      <article class="card ${isActive}" role="button" tabindex="0" data-id="${item.id}" aria-pressed="${selectedId === item.id}" aria-label="Open details for ${escapeHtml(item.title)}">
        <div class="card-body">
          <div class="card-topline">
            ${getRatingBadge(item.rating)}
            <div class="card-badges">
              ${readingBadge}
              ${pubBadge}
            </div>
          </div>
          <div class="card-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>
          ${alternateTitle}
          ${authorLine}
          <div class="card-meta">
            <div class="card-tags">${tagSummary || '<span class="muted">No tags</span>'}</div>
          </div>
        </div>
      </article>
    `;
  }).join('');
  renderIcons();
}

function renderStats() {
  const statsSource = filteredList;
  const finishedCount = statsSource.filter(m => m.status === 'finished').length;
  const readingCount = statsSource.filter(m => m.status === 'reading').length;
  const avgRating = (statsSource.reduce((acc, m) => acc + m.rating, 0) / (statsSource.length || 1)).toFixed(1);

  elements.statsSummary.innerHTML = `
    <span>Finished: <strong>${finishedCount}</strong></span>
    <span>Reading: <strong>${readingCount}</strong></span>
    <span>Average Rating: <strong>${avgRating}/10</strong></span>
  `;
  renderIcons();
}

function normalizeRating(rating) {
  const parsed = Number.parseInt(rating, 10);
  if (Number.isNaN(parsed)) return 1;
  return Math.min(10, Math.max(1, parsed));
}

function normalizeMangaListRatings(list) {
  const ratings = list.map(item => Number.parseInt(item.rating, 10)).filter(rating => !Number.isNaN(rating));
  const looksLikeFivePointScale = ratings.length > 0 && Math.max(...ratings) <= 5;

  return list.map(item => ({
    ...item,
    rating: looksLikeFivePointScale
      ? normalizeRating((Number.parseInt(item.rating, 10) || 1) * 2)
      : normalizeRating(item.rating)
  }));
}

function getRatingBadge(rating) {
  return `<span class="rating-badge">${normalizeRating(rating)}/10</span>`;
}

// Badges Helpers
function getReadingBadge(status) {
  const map = {
    reading: ['Reading', 'status-reading'],
    finished: ['Finished', 'status-finished'],
    dropped: ['Dropped', 'status-dropped'],
    paused: ['On Hold', 'status-paused']
  };
  const [label, cls] = map[status] || [status, ''];
  return `<span class="badge ${cls}">${label}</span>`;
}

function getPubBadge(pubStatus) {
  const map = {
    completed: ['Completed', 'pub-completed'],
    ongoing: ['Ongoing', 'pub-ongoing'],
    hiatus: ['Hiatus', 'pub-hiatus'],
    'scanlation ongoing': ['Scanlation', 'pub-scanlation'],
    axed: ['Axed', 'pub-axed'],
    finished: ['Finished (JP)', 'pub-finished'],
    licensed: ['Licensed', 'pub-licensed']
  };
  const [label, cls] = map[pubStatus] || [pubStatus, ''];
  return `<span class="badge ${cls}">${label}</span>`;
}

function getOptionalMetaItem(label, icon, value) {
  if (!value || !String(value).trim()) return '';
  return `
    <div class="detail-meta-item">
      <span class="label"><i data-lucide="${icon}"></i> ${label}</span>
      <span class="value">${escapeHtml(value)}</span>
    </div>
  `;
}

// Pop-out Selection
function selectManga(id) {
  lastFocusedCard = document.querySelector(`.card[data-id="${id}"]`);
  const cards = document.querySelectorAll('.card');

  if (selectedId === id) {
    closeDetails();
    return;
  }

  const item = mangaList.find(m => m.id === id);
  if (!item) return;

  selectedId = id;
  cards.forEach(c => {
    c.classList.remove('active');
    c.setAttribute('aria-pressed', 'false');
    if (Number(c.dataset.id) === id) {
      c.classList.add('active');
      c.setAttribute('aria-pressed', 'true');
    }
  });

  renderDetails(item);
  elements.detailModal.classList.add('open');
  elements.detailPanel.classList.remove('hidden');
  elements.detailPanel.setAttribute('aria-hidden', 'false');

  const closeBtn = elements.detailPanel.querySelector('.detail-close-btn');
  if (closeBtn) closeBtn.focus();
}

function handleGridClick(event) {
  const card = event.target.closest('.card[data-id]');
  if (!card) return;
  selectManga(Number(card.dataset.id));
}

function handleGridKeydown(event) {
  const card = event.target.closest('.card[data-id]');
  if (!card) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    selectManga(Number(card.dataset.id));
  }
}

function handleDetailClick(event) {
  const actionTarget = event.target.closest('[data-action="close-details"]');
  if (actionTarget) {
    closeDetails();
    return;
  }

  const tagButton = event.target.closest('.tag-btn[data-tag]');
  if (tagButton) {
    filterByTag(tagButton.dataset.tag);
  }
}

function handleDetailModalClick(event) {
  if (event.target === event.currentTarget) {
    closeDetails();
  }
}

function handleDocumentClick(event) {
  if (event.target.closest('[data-action="reset-filters"]')) {
    resetFilters();
  }
}

function handleDocumentKeydown(event) {
  if (event.key === 'Escape' && elements.detailModal.classList.contains('open')) {
    closeDetails();
  }
}

function closeDetails() {
  selectedId = null;
  elements.detailModal.classList.remove('open');
  elements.detailPanel.classList.add('hidden');
  elements.detailPanel.setAttribute('aria-hidden', 'true');
  document.querySelectorAll('.card').forEach(c => {
    c.classList.remove('active');
    c.setAttribute('aria-pressed', 'false');
  });
  if (lastFocusedCard) {
    lastFocusedCard.focus();
    lastFocusedCard = null;
  }
}

function renderDetails(item) {
  const panel = elements.detailPanel;

  panel.innerHTML = `
    <button class="detail-close-btn" type="button" data-action="close-details" aria-label="Close details" title="Close details">
      <i data-lucide="x"></i>
    </button>
    <div class="detail-body">
      <div class="detail-header">
        <h2 class="detail-title" id="detail-title">${escapeHtml(item.title)}</h2>
        <div class="detail-badges">
          ${getReadingBadge(item.status)}
          ${getPubBadge(item.pubStatus)}
        </div>
      </div>

      <div class="detail-meta-list">
        ${getOptionalMetaItem('Alternate Title', 'languages', item.alternateTitle)}
        ${getOptionalMetaItem('Author', 'pen-line', item.author)}
        ${getOptionalMetaItem('Scanlator', 'scan-text', item.scanlator)}
        ${getOptionalMetaItem('Licensor', 'badge-check', item.licensor)}
        <div class="detail-meta-item">
          <span class="label"><i data-lucide="gauge"></i> Rating</span>
          <span class="value detail-rating-value">
            ${getRatingBadge(item.rating)}
          </span>
        </div>
        <div class="detail-meta-item">
          <span class="label"><i data-lucide="book-open"></i> Reading State</span>
          <span class="value">${escapeHtml(getStatusLabel(item.status))}</span>
        </div>
        <div class="detail-meta-item">
          <span class="label"><i data-lucide="globe"></i> Publication</span>
          <span class="value text-capitalize">${escapeHtml(item.pubStatus)}</span>
        </div>
      </div>

      <div class="detail-section">
        <span class="detail-section-title">Genres & Tags</span>
        <div class="detail-tags">
          ${(Array.isArray(item.tags) ? item.tags : []).map(t => {
            const isActive = elements.tagFilter.value === t.trim() ? ' active' : '';
            return `<button class="tag-btn${isActive}" type="button" data-tag="${escapeHtml(t.trim())}">${escapeHtml(t.trim())}</button>`;
          }).join('')}
        </div>
      </div>

      ${item.review ? `
        <div class="detail-section detail-review-section">
          <span class="detail-section-title">Personal Thoughts</span>
          <p class="detail-review">"${escapeHtml(item.review)}"</p>
        </div>
      ` : ''}
    </div>
  `;
  renderIcons();
}

// Filter list when tag inside detail pop-out is clicked
function filterByTag(tag) {
  elements.tagFilter.value = tag;
  applyFilters();
  showToast(`Filtered by tag: ${tag}`, 'success', 'tag');
}

// Success / Status Toasts
function showToast(message, type = 'success', icon = 'check-circle') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i data-lucide="${icon}" aria-hidden="true"></i><span>${escapeHtml(message)}</span>`;
  
  elements.toastContainer.appendChild(toast);
  
  // Trigger smooth slide in
  setTimeout(() => {
    toast.classList.add('show');
  }, 50);

  // Auto dismiss
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
  
  renderIcons();
}

// Focus trap for detail dialog
function trapFocusInPanel(event) {
  if (!elements.detailModal.classList.contains('open')) return;
  const focusable = elements.detailPanel.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

// Human-readable reading status label
function getStatusLabel(status) {
  const map = { reading: 'Reading', finished: 'Finished', dropped: 'Dropped', paused: 'On Hold' };
  return map[status] || status;
}

// Escape HTML to prevent injection
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
