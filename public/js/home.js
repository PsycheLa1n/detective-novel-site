// Homepage: Carousel, Featured Authors, Featured Books

let currentSlide = 0;
let carouselData = [];
let autoplayTimer = null;

async function loadHomepage() {
  try {
    const data = await apiGet('/api/books/featured');
    carouselData = data.carousel || [];
    renderCarousel();
    renderAuthors(data.authors || []);
    renderFeaturedBooks(data.recommended || []);
    if (carouselData.length > 1) startAutoplay();
  } catch (e) {
    console.error('Failed to load homepage:', e);
    document.getElementById('carousel-track').innerHTML =
      '<div class="carousel-slide"><div class="slide-content" style="text-align:center;width:100%"><p>加载失败，请刷新页面重试</p></div></div>';
  }
}

function renderCarousel() {
  const track = document.getElementById('carousel-track');
  const indicators = document.getElementById('carousel-indicators');

  if (carouselData.length === 0) {
    track.innerHTML = '<div class="carousel-slide"><div class="slide-content" style="text-align:center;width:100%"><p>暂无推荐</p></div></div>';
    return;
  }

  track.innerHTML = carouselData.map((book, i) => {
    const coverUrl = generateBookCover(book.id, book.title, book.author);
    return `
      <div class="carousel-slide" onclick="window.location.href='/book.html?id=${book.id}'">
        <div class="slide-image">
          <img src="${coverUrl}" alt="${escapeHtml(book.title)}" class="slide-cover-img">
        </div>
        <div class="slide-content">
          <span class="slide-badge">编辑推荐</span>
          <div class="slide-rating">${renderStars(book.rating)} <span style="color:var(--text-secondary);font-size:0.9rem">${book.rating}</span></div>
          <h2 class="slide-title">${escapeHtml(book.title)}</h2>
          <div class="slide-author">✍️ ${escapeHtml(book.author)}</div>
          <div class="slide-year">📅 出版于 ${book.year} 年</div>
          <p class="slide-desc">${escapeHtml(book.description || '')}</p>
          <div class="slide-tags">${(book.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
        </div>
      </div>
    `;
  }).join('');

  indicators.innerHTML = carouselData.map((_, i) =>
    `<span class="dot${i === 0 ? ' active' : ''}" onclick="goToSlide(${i})"></span>`
  ).join('');

  updateSlidePosition();
}

function updateSlidePosition() {
  const track = document.getElementById('carousel-track');
  track.style.transform = `translateX(-${currentSlide * 100}%)`;
  document.querySelectorAll('.carousel-indicators .dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
}

function moveCarousel(dir) {
  if (carouselData.length === 0) return;
  currentSlide = (currentSlide + dir + carouselData.length) % carouselData.length;
  updateSlidePosition();
  resetAutoplay();
}

function goToSlide(index) {
  currentSlide = index;
  updateSlidePosition();
  resetAutoplay();
}

function startAutoplay() {
  autoplayTimer = setInterval(() => {
    currentSlide = (currentSlide + 1) % carouselData.length;
    updateSlidePosition();
  }, 4000);
}

function resetAutoplay() {
  clearInterval(autoplayTimer);
  startAutoplay();
}

function renderAuthors(authors) {
  const container = document.getElementById('featured-authors');
  if (authors.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>暂无数据</p></div>';
    return;
  }

  container.innerHTML = authors.map(a => {
    const avatarUrl = generateAuthorAvatar(a.name);
    return `
      <div class="author-card" onclick="window.location.href='/search.html?author=${encodeURIComponent(a.name)}'">
        <div class="author-avatar">
          <img src="${avatarUrl}" alt="${escapeHtml(a.name)}" class="avatar-img">
        </div>
        <div class="author-name">${escapeHtml(a.name)}</div>
        <div class="author-count">📚 ${a.count} 部作品</div>
        <div class="author-rating">★ ${a.avgRating}</div>
      </div>
    `;
  }).join('');
}

function renderFeaturedBooks(books) {
  const container = document.getElementById('featured-books');
  if (books.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📚</div>暂无推荐书籍</div>';
    return;
  }
  container.innerHTML = books.map(book => createBookCard(book)).join('');
}

// Pause autoplay on hover
document.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.getElementById('carousel');
  if (wrapper) {
    wrapper.addEventListener('mouseenter', () => clearInterval(autoplayTimer));
    wrapper.addEventListener('mouseleave', () => {
      if (carouselData.length > 1) startAutoplay();
    });
  }
});

loadHomepage();
