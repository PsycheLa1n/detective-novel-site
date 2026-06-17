// Search page: filters, sorting, results

let filterTimeout = null;

async function loadSearchPage() {
  // Load tags
  try {
    const tags = await apiGet('/api/tags');
    renderTagCheckboxes(tags);
  } catch (e) {
    console.error('Failed to load tags:', e);
  }

  // Load authors
  try {
    const authors = await apiGet('/api/authors');
    renderAuthorSelect(authors);
  } catch (e) {
    console.error('Failed to load authors:', e);
  }

  // Check URL params for pre-filled filters
  const params = new URLSearchParams(window.location.search);
  if (params.get('author')) {
    document.getElementById('filter-author').value = params.get('author');
  }
  if (params.get('q')) {
    document.getElementById('filter-q').value = params.get('q');
  }

  // Initial search
  doSearch();
}

function renderTagCheckboxes(tags) {
  const container = document.getElementById('tag-checkboxes');
  container.innerHTML = tags.map(tag => `
    <label>
      <input type="checkbox" value="${tag.id}" onchange="onFilterChange()">
      ${escapeHtml(tag.name)}
    </label>
  `).join('');
}

function renderAuthorSelect(authors) {
  const select = document.getElementById('filter-author');
  const currentValue = select.value;
  select.innerHTML = '<option value="">全部作家</option>' +
    authors.map(a => `<option value="${escapeHtml(a)}" ${a === currentValue ? 'selected' : ''}>${escapeHtml(a)}</option>`).join('');
}

function onFilterChange() {
  // Debounce the search
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(doSearch, 300);
}

function getFilterParams() {
  const q = document.getElementById('filter-q').value.trim();
  const author = document.getElementById('filter-author').value;
  const yearFrom = document.getElementById('filter-year-from').value;
  const yearTo = document.getElementById('filter-year-to').value;
  const sort = document.getElementById('sort-select').value;

  const checkedTags = document.querySelectorAll('#tag-checkboxes input:checked');
  const tags = Array.from(checkedTags).map(cb => cb.value).join(',');

  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (author) params.set('author', author);
  if (yearFrom) params.set('yearFrom', yearFrom);
  if (yearTo) params.set('yearTo', yearTo);
  if (tags) params.set('tags', tags);
  params.set('sort', sort);

  return params.toString();
}

async function doSearch() {
  const grid = document.getElementById('search-results-grid');
  grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div>搜索中...</div>';

  try {
    const params = getFilterParams();
    const data = await apiGet(`/api/books?${params}`);
    document.getElementById('search-count').innerHTML = `共 <strong>${data.total}</strong> 本推理小说`;

    if (data.books.length === 0) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>没有找到匹配的推理小说</p><p style="font-size:0.85rem">试试调整筛选条件或关键词</p></div>';
    } else {
      grid.innerHTML = data.books.map(book => createBookCard(book)).join('');
    }
  } catch (e) {
    console.error('Search failed:', e);
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div>搜索失败，请刷新页面重试</div>';
  }
}

function resetFilters() {
  document.getElementById('filter-q').value = '';
  document.getElementById('filter-author').value = '';
  document.getElementById('filter-year-from').value = '';
  document.getElementById('filter-year-to').value = '';
  document.getElementById('sort-select').value = 'rating_desc';
  document.querySelectorAll('#tag-checkboxes input:checked').forEach(cb => cb.checked = false);
  doSearch();
}

// Initialize
loadSearchPage();
