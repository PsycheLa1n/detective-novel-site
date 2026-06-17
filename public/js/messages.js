// Message board with SSE real-time updates

let messagesLoaded = false;

async function initMessageBoard() {
  await loadMessages();
  if (!messagesLoaded) {
    messagesLoaded = true;
    connectSSE();
    // Update the message input area based on login state
    updateMessageInput();
  }
}

async function updateMessageInput() {
  try {
    const data = await apiGet('/api/me');
    const container = document.getElementById('message-input-container');
    if (!container) return;

    if (data.loggedIn) {
      container.innerHTML = `
        <div class="message-input-area">
          <textarea id="message-input" placeholder="写下你对推理小说的想法..." rows="2"></textarea>
          <button class="btn btn-primary" id="message-send-btn" onclick="sendMessage()">发送</button>
        </div>
      `;
      // Allow Enter to send (Ctrl+Enter for newline)
      const input = document.getElementById('message-input');
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        });
      }
    } else {
      container.innerHTML = `
        <p class="message-login-hint">
          💡 <a href="/login.html">登录</a> 后即可留言 （默认账号：user / password）
        </p>
      `;
    }
  } catch (e) {
    console.error('Failed to check login state:', e);
  }
}

async function loadMessages() {
  try {
    const messages = await apiGet('/api/messages');
    renderMessages(messages);
  } catch (e) {
    console.error('Failed to load messages:', e);
  }
}

function renderMessages(messages) {
  const list = document.getElementById('message-list');
  if (!list) return;

  if (messages.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div>暂无留言，来写第一条吧！</div>';
    return;
  }

  list.innerHTML = messages.map(msg => `
    <div class="message-item" id="msg-${msg.id}">
      <div class="msg-header">
        <span class="msg-user">👤 ${escapeHtml(msg.username)}</span>
        <span class="msg-time">${formatDate(msg.createdAt)}</span>
      </div>
      <div class="msg-content">${escapeHtml(msg.content)}</div>
    </div>
  `).join('');
}

function prependMessage(msg) {
  const list = document.getElementById('message-list');
  if (!list) return;

  // Remove empty state if present
  const emptyState = list.querySelector('.empty-state');
  if (emptyState) emptyState.remove();

  const el = document.createElement('div');
  el.className = 'message-item';
  el.id = `msg-${msg.id}`;
  el.style.animation = 'none';
  el.innerHTML = `
    <div class="msg-header">
      <span class="msg-user">👤 ${escapeHtml(msg.username)}</span>
      <span class="msg-time">${formatDate(msg.createdAt)}</span>
    </div>
    <div class="msg-content">${escapeHtml(msg.content)}</div>
  `;

  list.insertBefore(el, list.firstChild);

  // Highlight effect
  el.style.transition = 'background 0.5s';
  el.style.background = 'rgba(201, 169, 110, 0.15)';
  setTimeout(() => {
    el.style.background = '';
  }, 1500);
}

async function sendMessage() {
  const input = document.getElementById('message-input');
  if (!input) return;

  const content = input.value.trim();
  if (!content) return;

  try {
    const result = await apiPost('/api/messages', { content });
    if (result.success) {
      input.value = '';
    } else {
      alert(result.message || '发送失败');
    }
  } catch (e) {
    alert('发送失败，请重试');
  }
}

function connectSSE() {
  const eventSource = new EventSource('/api/messages/stream');

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'connected') return;
      // New message arrived
      prependMessage(data);
    } catch (e) {
      console.error('SSE parse error:', e);
    }
  };

  eventSource.onerror = () => {
    // Reconnect after a delay
    setTimeout(() => {
      eventSource.close();
      connectSSE();
    }, 3000);
  };
}

// Initialize
initMessageBoard();
