(() => {
  const btn = document.createElement('a');
  btn.href = '../index.html';
  btn.className = 'floating-nav';
  btn.setAttribute('aria-label', 'На главную');
  btn.innerHTML = '<span class="fn-icon" aria-hidden="true">📚</span><span class="fn-text">Оглавление</span>';

  const css = `
    .floating-nav {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      background: linear-gradient(135deg, rgba(78, 205, 196, 0.95), rgba(167, 139, 250, 0.95));
      color: #0a0e27;
      font-family: 'Fredoka', 'Nunito', sans-serif;
      font-weight: 700;
      font-size: 0.95rem;
      text-decoration: none;
      border-radius: 50px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 0 24px rgba(78, 205, 196, 0.35);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }
    .floating-nav:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.6), 0 0 32px rgba(167, 139, 250, 0.55);
    }
    .floating-nav:active { transform: translateY(-1px); }
    .floating-nav .fn-icon { font-size: 1.25rem; line-height: 1; }
    @media (max-width: 600px) {
      .floating-nav {
        bottom: 16px;
        right: 16px;
        padding: 14px;
        border-radius: 50%;
      }
      .floating-nav .fn-text { display: none; }
      .floating-nav .fn-icon { font-size: 1.5rem; }
    }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  document.body.appendChild(btn);
})();
