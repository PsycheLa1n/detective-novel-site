const express = require('express');
const session = require('express-session');
const path = require('path');
const { getDb, saveDb } = require('./database');

const app = express();
const PORT = 3000;

// SSE clients for real-time messages
const sseClients = [];

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'detective-novel-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// ===== AUTH ROUTES =====

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const db = await getDb();

  const result = db.exec("SELECT id, username FROM users WHERE username = ? AND password = ?", [username, password]);
  if (result.length > 0 && result[0].values.length > 0) {
    const user = result[0].values[0];
    req.session.userId = user[0];
    req.session.username = user[1];
    saveDb();
    res.json({ success: true, username: user[1] });
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Get current user
app.get('/api/me', (req, res) => {
  if (req.session.userId) {
    res.json({ loggedIn: true, username: req.session.username });
  } else {
    res.json({ loggedIn: false });
  }
});

// ===== BOOKS ROUTES =====

// Get all tags
app.get('/api/tags', async (req, res) => {
  const db = await getDb();
  const result = db.exec("SELECT id, name FROM tags ORDER BY name");
  const tags = result.length > 0 ? result[0].values.map(row => ({ id: row[0], name: row[1] })) : [];
  res.json(tags);
});

// Get all authors
app.get('/api/authors', async (req, res) => {
  const db = await getDb();
  const result = db.exec("SELECT DISTINCT author FROM books ORDER BY author");
  const authors = result.length > 0 ? result[0].values.map(row => row[0]) : [];
  res.json(authors);
});

// Search/Filter/Sort books
app.get('/api/books', async (req, res) => {
  const db = await getDb();
  const { q, tags, yearFrom, yearTo, author, sort, order, limit, offset } = req.query;

  let sql = `
    SELECT DISTINCT b.id, b.title, b.author, b.year, b.description, b.rating
    FROM books b
  `;
  const params = [];
  const conditions = [];

  // Search by keyword (title or author)
  if (q) {
    conditions.push("(b.title LIKE ? OR b.author LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }

  // Filter by tags (comma-separated tag IDs)
  if (tags) {
    const tagIds = tags.split(',').map(Number).filter(Boolean);
    if (tagIds.length > 0) {
      sql += ` INNER JOIN book_tags bt ON b.id = bt.book_id`;
      conditions.push(`bt.tag_id IN (${tagIds.map(() => '?').join(',')})`);
      params.push(...tagIds);
    }
  }

  // Filter by year range
  if (yearFrom) {
    conditions.push("b.year >= ?");
    params.push(Number(yearFrom));
  }
  if (yearTo) {
    conditions.push("b.year <= ?");
    params.push(Number(yearTo));
  }

  // Filter by author
  if (author) {
    conditions.push("b.author LIKE ?");
    params.push(`%${author}%`);
  }

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  // Sorting
  let orderClause = "";
  switch (sort) {
    case 'title_asc':
      orderClause = " ORDER BY b.title ASC";
      break;
    case 'title_desc':
      orderClause = " ORDER BY b.title DESC";
      break;
    case 'year_asc':
      orderClause = " ORDER BY b.year ASC";
      break;
    case 'year_desc':
      orderClause = " ORDER BY b.year DESC";
      break;
    case 'rating_desc':
      orderClause = " ORDER BY b.rating DESC";
      break;
    case 'rating_asc':
      orderClause = " ORDER BY b.rating ASC";
      break;
    default:
      orderClause = " ORDER BY b.rating DESC";
  }
  sql += orderClause;

  // Limit/offset
  const limitNum = limit ? Number(limit) : 50;
  const offsetNum = offset ? Number(offset) : 0;
  sql += " LIMIT ? OFFSET ?";
  params.push(limitNum, offsetNum);

  // Count total (before limit) for pagination
  let countSql = `SELECT COUNT(DISTINCT b.id) as total FROM books b`;
  if (tags && tags.split(',').filter(Boolean).length > 0) {
    countSql += ` INNER JOIN book_tags bt ON b.id = bt.book_id`;
  }
  if (conditions.length > 0) {
    countSql += " WHERE " + conditions.join(" AND ");
  }
  const countParams = params.slice(0, -2); // remove limit/offset params
  const countResult = db.exec(countSql, countParams);
  const total = countResult[0].values[0][0];

  const result = db.exec(sql, params);
  const books = result.length > 0 ? result[0].values.map(row => ({
    id: row[0],
    title: row[1],
    author: row[2],
    year: row[3],
    description: row[4],
    rating: row[5],
  })) : [];

  // Get tags for each book
  for (const book of books) {
    const tagsResult = db.exec(`
      SELECT t.id, t.name FROM tags t
      INNER JOIN book_tags bt ON t.id = bt.tag_id
      WHERE bt.book_id = ?
    `, [book.id]);
    book.tags = tagsResult.length > 0 ? tagsResult[0].values.map(row => ({ id: row[0], name: row[1] })) : [];
  }

  res.json({ books, total });
});

// Get featured books for homepage
app.get('/api/books/featured', async (req, res) => {
  const db = await getDb();

  // Top rated for carousel
  const carouselResult = db.exec("SELECT id, title, author, year, description, rating FROM books ORDER BY rating DESC LIMIT 8");
  const carousel = carouselResult.length > 0 ? carouselResult[0].values.map(row => ({
    id: row[0], title: row[1], author: row[2], year: row[3], description: row[4], rating: row[5]
  })) : [];

  // Random selection for "recommended books" section
  const recommendedResult = db.exec("SELECT id, title, author, year, rating FROM books ORDER BY RANDOM() LIMIT 8");
  const recommended = recommendedResult.length > 0 ? recommendedResult[0].values.map(row => ({
    id: row[0], title: row[1], author: row[2], year: row[3], rating: row[4]
  })) : [];

  // Top authors (by number of books)
  const authorsResult = db.exec("SELECT author, COUNT(*) as count, AVG(rating) as avg_rating FROM books GROUP BY author ORDER BY count DESC LIMIT 6");
  const authors = authorsResult.length > 0 ? authorsResult[0].values.map(row => ({
    name: row[0], count: row[1], avgRating: Math.round(row[2] * 10) / 10
  })) : [];

  // Get tags for carousel books
  for (const book of carousel) {
    const tagsResult = db.exec(`SELECT t.name FROM tags t INNER JOIN book_tags bt ON t.id = bt.tag_id WHERE bt.book_id = ? LIMIT 3`, [book.id]);
    book.tags = tagsResult.length > 0 ? tagsResult[0].values.map(row => row[0]) : [];
  }

  res.json({ carousel, recommended, authors });
});

// Get single book
app.get('/api/books/:id', async (req, res) => {
  const db = await getDb();
  const id = Number(req.params.id);

  const result = db.exec("SELECT id, title, author, year, description, rating FROM books WHERE id = ?", [id]);
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: '未找到该书' });
  }

  const row = result[0].values[0];
  const book = {
    id: row[0], title: row[1], author: row[2], year: row[3],
    description: row[4], rating: row[5]
  };

  const tagsResult = db.exec(`SELECT t.id, t.name FROM tags t INNER JOIN book_tags bt ON t.id = bt.tag_id WHERE bt.book_id = ?`, [id]);
  book.tags = tagsResult.length > 0 ? tagsResult[0].values.map(row => ({ id: row[0], name: row[1] })) : [];

  // Get other books by same author
  const sameAuthorResult = db.exec("SELECT id, title, author, year, rating FROM books WHERE author = ? AND id != ? LIMIT 5", [book.author, id]);
  book.sameAuthorBooks = sameAuthorResult.length > 0 ? sameAuthorResult[0].values.map(row => ({
    id: row[0], title: row[1], author: row[2], year: row[3], rating: row[4]
  })) : [];

  res.json(book);
});

// ===== AI CHAT ROUTE =====

// API Key 从 config.json 读取（该文件不上传GitHub，见 config.example.json）
const config = require('./config.json');
const DEEPSEEK_API_KEY = config.deepseekApiKey;

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: '消息不能为空' });
  }

  try {
    const db = await getDb();

    // Build book database context for the AI
    const booksResult = db.exec(`
      SELECT b.id, b.title, b.author, b.year, b.rating, b.description,
             GROUP_CONCAT(t.name, '、') as tag_names
      FROM books b
      LEFT JOIN book_tags bt ON b.id = bt.book_id
      LEFT JOIN tags t ON bt.tag_id = t.id
      GROUP BY b.id
      ORDER BY b.rating DESC
    `);

    const allBooks = booksResult[0].values.map(row => ({
      id: row[0], title: row[1], author: row[2], year: row[3],
      rating: row[4], desc: (row[5] || '').substring(0, 80), tags: row[6] || ''
    }));

    const tagsResult = db.exec("SELECT name FROM tags ORDER BY name");
    const allTags = tagsResult[0].values.map(row => row[0]);

    // Build system prompt with full book database
    const bookList = allBooks.map(b =>
      `《${b.title}》|${b.author}|${b.year}年|评分${b.rating}|标签:${b.tags}|${b.desc}`
    ).join('\n');

    const systemPrompt = `你是一个推理小说推荐专家。以下是网站数据库中全部的${allBooks.length}本推理小说：

${bookList}

可用的标签: ${allTags.join('、')}

规则：
1. 根据用户的偏好和问题，从数据库中推荐最匹配的推理小说（至少推荐3本）
2. 每次推荐必须包含书名、作者、年份、评分、推荐理由（结合简介说明为什么适合用户）
3. 如果用户问的是推理小说相关知识，可以自由回答
4. 回答要专业、热情，像一个资深的推理小说爱好者
5. 控制在300字以内`;

    const deepseekRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 800,
        temperature: 0.7
      })
    });

    const data = await deepseekRes.json();
    if (data.choices && data.choices[0]) {
      res.json({ reply: data.choices[0].message.content });
    } else {
      res.status(500).json({ error: 'AI 响应异常，请重试' });
    }
  } catch (e) {
    console.error('Chat error:', e);
    res.status(500).json({ error: 'AI 服务暂时不可用: ' + e.message });
  }
});

// ===== MESSAGES ROUTES =====

// Get messages
app.get('/api/messages', async (req, res) => {
  const db = await getDb();
  const result = db.exec(`
    SELECT m.id, m.content, m.created_at, u.username
    FROM messages m
    JOIN users u ON m.user_id = u.id
    ORDER BY m.created_at DESC
    LIMIT 100
  `);
  const messages = result.length > 0 ? result[0].values.map(row => ({
    id: row[0], content: row[1], createdAt: row[2], username: row[3]
  })) : [];
  res.json(messages);
});

// Post a message
app.post('/api/messages', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: '留言内容不能为空' });
  }

  const db = await getDb();
  const result = db.exec("INSERT INTO messages (user_id, content) VALUES (?, ?)", [req.session.userId, content.trim()]);
  saveDb();

  const newId = result[0] && result[0].values ? db.exec("SELECT last_insert_rowid()")[0].values[0][0] : Date.now();

  const msgData = JSON.stringify({
    id: newId,
    content: content.trim(),
    username: req.session.username,
    createdAt: new Date().toISOString()
  });

  // Broadcast to all SSE clients
  sseClients.forEach(client => {
    client.write(`data: ${msgData}\n\n`);
  });

  res.json({ success: true });
});

// SSE endpoint for real-time messages
app.get('/api/messages/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  res.write('data: {"type":"connected"}\n\n');

  sseClients.push(res);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`推理小说检索网站已启动: http://localhost:${PORT}`);
});
