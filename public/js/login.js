// Login page

async function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  errorEl.style.display = 'none';

  if (!username || !password) {
    errorEl.textContent = '请输入用户名和密码';
    errorEl.style.display = 'block';
    return;
  }

  try {
    const result = await apiPost('/api/login', { username, password });
    if (result.success) {
      window.location.href = '/';
    } else {
      errorEl.textContent = result.message || '登录失败';
      errorEl.style.display = 'block';
    }
  } catch (e) {
    errorEl.textContent = '网络错误，请重试';
    errorEl.style.display = 'block';
  }
}
