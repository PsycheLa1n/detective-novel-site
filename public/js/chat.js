// AI Chatbot Widget

let chatOpen = false;
let chatTyping = false;

function initChatWidget() {
  const widget = document.createElement('div');
  widget.id = 'chat-widget';
  widget.innerHTML = `
    <div class="chat-bubble" id="chat-bubble" onclick="toggleChat()">
      <span class="chat-bubble-icon">🤖</span>
      <span class="chat-bubble-text">AI 荐书</span>
    </div>
    <div class="chat-window" id="chat-window" style="display:none">
      <div class="chat-header">
        <span>🤖 推理小说推荐助手</span>
        <div class="chat-header-actions">
          <button class="chat-btn-clear" onclick="clearChat()" title="清空对话">🔄</button>
          <button class="chat-btn-close" onclick="toggleChat()">✕</button>
        </div>
      </div>
      <div class="chat-messages" id="chat-messages">
        <div class="chat-msg assistant">
          <div class="chat-msg-content">
            你好！我是推理小说推荐助手 🤖<br><br>
            你可以告诉我你的偏好，我来为你推荐合适的推理小说。比如：<br>
            🔹 "我喜欢密室杀人类型的"<br>
            🔹 "推荐几本东野圭吾风格的小说"<br>
            🔹 "有没有恐怖+民俗的推理小说？"<br>
            🔹 "新本格派入门看什么？"
          </div>
        </div>
      </div>
      <div class="chat-typing" id="chat-typing" style="display:none">
        <span></span><span></span><span></span>
      </div>
      <div class="chat-input-area">
        <input type="text" id="chat-input" placeholder="输入你的阅读偏好..." onkeydown="if(event.key==='Enter')sendChat()">
        <button onclick="sendChat()">发送</button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);
}

function toggleChat() {
  chatOpen = !chatOpen;
  const window = document.getElementById('chat-window');
  const bubble = document.getElementById('chat-bubble');
  window.style.display = chatOpen ? 'flex' : 'none';
  bubble.style.display = chatOpen ? 'none' : 'flex';
  if (chatOpen) {
    document.getElementById('chat-input').focus();
  }
}

async function sendChat() {
  if (chatTyping) return;
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;

  // Add user message
  addMessage('user', message);
  input.value = '';
  showTyping(true);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    showTyping(false);
    if (data.reply) {
      addMessage('assistant', data.reply);
    } else {
      addMessage('assistant', '抱歉，AI 服务暂时不可用，请稍后重试 😔');
    }
  } catch (e) {
    showTyping(false);
    addMessage('assistant', '网络错误，请检查网络后重试 😔');
  }
}

function addMessage(role, content) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  // Convert markdown-like formatting
  const html = content
    .replace(/《([^》]+)》/g, '<strong>《$1》</strong>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/🔹/g, '<br>🔹');
  div.innerHTML = `<div class="chat-msg-content">${html}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showTyping(show) {
  chatTyping = show;
  document.getElementById('chat-typing').style.display = show ? 'flex' : 'none';
  const container = document.getElementById('chat-messages');
  container.scrollTop = container.scrollHeight;
}

function clearChat() {
  document.getElementById('chat-messages').innerHTML = `
    <div class="chat-msg assistant">
      <div class="chat-msg-content">
        对话已清空。有什么我可以帮你的吗？
      </div>
    </div>
  `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initChatWidget);
