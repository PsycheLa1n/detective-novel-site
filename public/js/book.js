// Book detail page

async function loadBookDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    document.getElementById('book-detail-container').innerHTML =
      '<div class="empty-state"><div class="empty-icon">⚠️</div>未指定书籍ID</div>';
    return;
  }

  try {
    const res = await fetch(`/api/books/${id}`);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('该书不存在（ID: ' + id + '）');
      }
      throw new Error('服务器错误 (' + res.status + ')');
    }
    const book = await res.json();
    document.title = `${book.title} — 推理小说检索网`;
    renderBookDetail(book);
  } catch (e) {
    console.error('加载书籍详情失败:', e);
    document.getElementById('book-detail-container').innerHTML =
      '<div class="empty-state"><div class="empty-icon">⚠️</div><p>加载失败</p><p style="font-size:0.85rem;color:var(--text-muted)">' + escapeHtml(e.message) + '</p><p style="margin-top:1rem"><a href="/search.html" class="btn btn-outline btn-sm">返回检索页</a></p></div>';
  }
}

function renderBookDetail(book) {
  const coverUrl = generateBookCover(book.id, book.title, book.author);
  const container = document.getElementById('book-detail-container');

  container.innerHTML = `
    <div class="book-detail">
      <div class="detail-cover">
        <img src="${coverUrl}" alt="${escapeHtml(book.title)}" class="detail-cover-img">
      </div>
      <div class="detail-info">
        <h1 class="detail-title">${escapeHtml(book.title)}</h1>
        <div class="detail-author">✍️ ${escapeHtml(book.author)}</div>
        <div class="detail-meta">
          <span>📅 ${book.year} 年出版</span>
        </div>
        <div class="detail-rating">${renderStars(book.rating)} <span style="color:var(--text-primary);font-size:1.3rem">${book.rating}</span></div>
        <div class="detail-tags">
          ${(book.tags || []).map(t => `<span class="tag" style="cursor:pointer" onclick="window.location.href='/search.html?tags=${t.id}'">${escapeHtml(t.name)}</span>`).join('')}
        </div>
        <p class="detail-desc">${escapeHtml(book.description || '暂无简介')}</p>
        <a href="/search.html?author=${encodeURIComponent(book.author)}" class="btn btn-outline">
          📚 查看该作者所有作品
        </a>
      </div>
    </div>

    ${book.sameAuthorBooks && book.sameAuthorBooks.length > 0 ? `
    <div class="same-author" style="margin-top:3rem">
      <h3>✍️ ${escapeHtml(book.author)} 的其他作品</h3>
      <div class="same-author-list">
        ${book.sameAuthorBooks.map(b => createSmallBookCard(b)).join('')}
      </div>
    </div>
    ` : ''}
  `;
}

loadBookDetail();
