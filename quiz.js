(() => {
  if (!window.KIDS_QUIZ) return;

  const STORAGE_NAME = 'kidsWikiName';
  const STORAGE_PROGRESS = 'kidsWikiProgress';
  const config = window.KIDS_QUIZ;

  const getName = () => localStorage.getItem(STORAGE_NAME) || '';
  const setName = (n) => localStorage.setItem(STORAGE_NAME, n);

  const getProgress = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_PROGRESS)) || {}; }
    catch { return {}; }
  };
  const saveProgress = (p) => localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(p));

  const askName = () => new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'kw-modal-overlay';
    overlay.innerHTML = `
      <div class="kw-modal">
        <div class="kw-emoji">👋</div>
        <h3>Привет! Как тебя зовут?</h3>
        <p>Чтобы я знал, с кем занимаюсь наукой</p>
        <input type="text" class="kw-input" placeholder="Твоё имя" maxlength="20" autocomplete="off">
        <button class="kw-btn">Поехали!</button>
      </div>
    `;
    document.body.appendChild(overlay);
    const input = overlay.querySelector('.kw-input');
    const btn = overlay.querySelector('.kw-btn');
    setTimeout(() => input.focus(), 100);

    const submit = () => {
      const name = input.value.trim();
      if (name.length < 1) { input.focus(); return; }
      setName(name);
      overlay.remove();
      resolve(name);
    };
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  });

  const renderQuiz = (name) => {
    const articleId = config.articleId;
    const questions = config.questions;

    const section = document.createElement('section');
    section.className = 'block container kw-quiz';

    const greetings = [
      `${name}, проверим, что засело?`,
      `Ну что, ${name}, готов проверить себя?`,
      `${name}, давай посмотрим, что запомнил`,
      `Держись, ${name} — сейчас будет проверка`
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    section.innerHTML = `
      <span class="section-label kw-label">🎯 Проверь себя</span>
      <h2 class="kw-title">${greeting}</h2>
      <p class="kw-sub">За каждый правильный ответ — звезда ⭐ В открытых вопросах сравни свой ответ с эталоном и сам реши, совпадает ли по смыслу.</p>
      <div class="kw-questions"></div>
      <div class="kw-score"></div>
    `;

    const qContainer = section.querySelector('.kw-questions');
    const scoreBox = section.querySelector('.kw-score');

    const maxStars = questions.filter(q => q.type === 'choice').length;
    const openTotal = questions.filter(q => q.type === 'open').length;
    let starsEarned = 0;
    let openDone = 0;

    const updateScore = (persist = true) => {
      const filled = '⭐'.repeat(starsEarned);
      const empty = '☆'.repeat(maxStars - starsEarned);
      const finalMsg = (starsEarned === maxStars && openDone === openTotal && maxStars > 0)
        ? `<div class="kw-final">🔥 Полный разгром, ${name}!</div>`
        : '';
      scoreBox.innerHTML = `
        <div class="kw-stars">${filled}${empty}</div>
        <p>${starsEarned} из ${maxStars} звёзд${openTotal > 0 ? ` · открытых ответов: ${openDone}/${openTotal}` : ''}</p>
        ${finalMsg}
      `;
      if (persist) {
        saveProgress({
          ...getProgress(),
          [articleId]: { stars: starsEarned, maxStars, openDone, openTotal, name, ts: Date.now() }
        });
      }
    };

    questions.forEach((q, idx) => {
      const qEl = document.createElement('div');
      qEl.className = 'kw-q';

      if (q.type === 'choice') {
        qEl.innerHTML = `
          <div class="kw-q-num">Вопрос ${idx + 1}</div>
          <div class="kw-q-text"></div>
          <div class="kw-options"></div>
          <div class="kw-explain" style="display:none"></div>
        `;
        qEl.querySelector('.kw-q-text').textContent = q.q;
        const optsEl = qEl.querySelector('.kw-options');
        const explainEl = qEl.querySelector('.kw-explain');

        q.options.forEach((opt, i) => {
          const b = document.createElement('button');
          b.className = 'kw-opt';
          b.textContent = opt;
          b.addEventListener('click', () => {
            if (qEl.dataset.answered === 'true') return;
            qEl.dataset.answered = 'true';
            qEl.querySelectorAll('.kw-opt').forEach(bb => bb.disabled = true);
            if (i === q.correct) {
              b.classList.add('correct');
              starsEarned++;
              explainEl.innerHTML = `<span class="kw-ok">✅ В точку!</span> ${q.explain || ''}`;
            } else {
              b.classList.add('wrong');
              optsEl.children[q.correct].classList.add('correct');
              explainEl.innerHTML = `<span class="kw-no">❌ Не в этот раз.</span> ${q.explain || ''}`;
            }
            explainEl.style.display = 'block';
            updateScore();
          });
          optsEl.appendChild(b);
        });
      } else {
        qEl.innerHTML = `
          <div class="kw-q-num">Вопрос ${idx + 1} <span class="kw-tag">подумай</span></div>
          <div class="kw-q-text"></div>
          <textarea class="kw-textarea" placeholder="Напиши своими словами..."></textarea>
          <button class="kw-show-btn">Показать эталонный ответ</button>
          <div class="kw-answer-block" style="display:none">
            <div class="kw-answer-label">Эталонный ответ</div>
            <div class="kw-answer-text"></div>
            <div class="kw-self-check">
              <p>Твой ответ был по смыслу примерно таким же?</p>
              <div class="kw-self-btns">
                <button class="kw-self-yes">Да, совпадает ✅</button>
                <button class="kw-self-no">Нет, я думал иначе ❌</button>
              </div>
            </div>
          </div>
        `;
        qEl.querySelector('.kw-q-text').textContent = q.q;
        qEl.querySelector('.kw-answer-text').textContent = q.answer;

        const showBtn = qEl.querySelector('.kw-show-btn');
        const answerBlock = qEl.querySelector('.kw-answer-block');
        const yesBtn = qEl.querySelector('.kw-self-yes');
        const noBtn = qEl.querySelector('.kw-self-no');
        const selfCheck = qEl.querySelector('.kw-self-check');

        showBtn.addEventListener('click', () => {
          answerBlock.style.display = 'block';
          showBtn.style.display = 'none';
        });

        const markDone = (matched) => {
          if (qEl.dataset.selfChecked === 'true') return;
          qEl.dataset.selfChecked = 'true';
          openDone++;
          selfCheck.innerHTML = matched
            ? `<div class="kw-self-result kw-ok-bg">Круто, засчитываем! 🎉</div>`
            : `<div class="kw-self-result kw-muted-bg">Ничего страшного — теперь знаешь 👀</div>`;
          updateScore();
        };
        yesBtn.addEventListener('click', () => markDone(true));
        noBtn.addEventListener('click', () => markDone(false));
      }

      qContainer.appendChild(qEl);
    });

    updateScore(false);

    const backHome = document.querySelector('.back-home');
    const backSection = backHome ? backHome.closest('section') : null;
    const footer = document.querySelector('footer');
    const anchor = backSection || footer;
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(section, anchor);
    } else {
      document.body.appendChild(section);
    }
  };

  const css = `
    .kw-modal-overlay {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(10, 14, 39, 0.88);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      animation: kw-fade 0.25s ease;
    }
    @keyframes kw-fade { from { opacity: 0; } to { opacity: 1; } }
    .kw-modal {
      background: linear-gradient(135deg, #1a2150, #141a3c);
      border: 2px solid rgba(167, 139, 250, 0.5);
      border-radius: 24px;
      padding: 36px 28px;
      max-width: 400px; width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(167, 139, 250, 0.3);
      animation: kw-pop 0.3s ease;
    }
    @keyframes kw-pop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .kw-modal .kw-emoji { font-size: 3rem; margin-bottom: 8px; }
    .kw-modal h3 {
      font-family: 'Fredoka', sans-serif;
      color: #f1f5ff; font-size: 1.5rem; margin-bottom: 8px;
    }
    .kw-modal p { color: #a5b0d9; margin-bottom: 20px; line-height: 1.4; }
    .kw-input {
      width: 100%; padding: 14px 18px;
      background: rgba(255,255,255,0.08);
      border: 2px solid rgba(167, 139, 250, 0.3);
      border-radius: 12px; color: #f1f5ff;
      font-family: 'Nunito', sans-serif;
      font-size: 1.05rem; margin-bottom: 16px;
      outline: none; transition: border-color 0.2s;
      text-align: center;
    }
    .kw-input:focus { border-color: #a78bfa; }
    .kw-btn {
      background: linear-gradient(135deg, #4ecdc4, #a78bfa);
      color: #0a0e27; border: none; cursor: pointer;
      font-family: 'Fredoka', sans-serif;
      font-weight: 700; font-size: 1.05rem;
      padding: 12px 32px; border-radius: 50px;
      transition: transform 0.2s;
    }
    .kw-btn:hover { transform: translateY(-2px); }

    .kw-quiz { margin-top: 40px; }
    .kw-quiz .kw-label {
      display: inline-block;
      background: rgba(167, 139, 250, 0.15);
      border: 1px solid rgba(167, 139, 250, 0.4);
      color: #a78bfa;
      padding: 6px 14px; border-radius: 20px;
      font-family: 'Fredoka', sans-serif; font-weight: 600;
      font-size: 0.9rem; margin-bottom: 16px;
    }
    .kw-title {
      font-family: 'Fredoka', sans-serif;
      color: #ffd93d;
      font-size: clamp(1.5rem, 4vw, 2rem);
      margin-bottom: 8px;
    }
    .kw-sub {
      color: #a5b0d9; margin-bottom: 24px; line-height: 1.5;
    }
    .kw-q {
      background: rgba(26, 33, 80, 0.6);
      border: 1px solid rgba(167, 139, 250, 0.2);
      border-radius: 18px;
      padding: 22px;
      margin-bottom: 18px;
    }
    .kw-q-num {
      color: #a78bfa; font-weight: 700;
      font-size: 0.85rem; margin-bottom: 10px;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .kw-tag {
      background: rgba(255, 217, 61, 0.15);
      color: #ffd93d;
      padding: 2px 8px; border-radius: 10px;
      font-size: 0.7rem;
      margin-left: 6px;
      letter-spacing: 0.3px;
      text-transform: none;
    }
    .kw-q-text {
      font-size: 1.1rem; color: #f1f5ff;
      margin-bottom: 16px; line-height: 1.5;
      font-weight: 600;
    }
    .kw-options {
      display: flex; flex-direction: column; gap: 10px;
    }
    .kw-opt {
      background: rgba(255,255,255,0.04);
      border: 2px solid rgba(167, 139, 250, 0.25);
      color: #f1f5ff;
      padding: 14px 18px;
      border-radius: 14px;
      text-align: left; cursor: pointer;
      font-family: inherit; font-size: 1rem;
      line-height: 1.4;
      transition: all 0.2s;
    }
    .kw-opt:not(:disabled):hover {
      border-color: #a78bfa;
      background: rgba(167, 139, 250, 0.1);
      transform: translateX(3px);
    }
    .kw-opt:disabled { cursor: default; opacity: 0.55; }
    .kw-opt.correct {
      background: rgba(107, 207, 127, 0.18) !important;
      border-color: #6bcf7f !important; opacity: 1 !important;
    }
    .kw-opt.wrong {
      background: rgba(255, 71, 87, 0.18) !important;
      border-color: #ff4757 !important; opacity: 1 !important;
    }
    .kw-explain {
      margin-top: 12px;
      padding: 12px 14px;
      background: rgba(255,255,255,0.04);
      border-radius: 12px;
      line-height: 1.5;
      color: #d1d8ee;
      font-size: 0.95rem;
    }
    .kw-ok { color: #6bcf7f; font-weight: 700; }
    .kw-no { color: #ff6b9d; font-weight: 700; }

    .kw-textarea {
      width: 100%; min-height: 90px;
      background: rgba(255,255,255,0.04);
      border: 2px solid rgba(167, 139, 250, 0.25);
      border-radius: 12px;
      padding: 12px 14px;
      color: #f1f5ff;
      font-family: inherit; font-size: 1rem;
      line-height: 1.5;
      resize: vertical;
      outline: none;
      margin-bottom: 10px;
      display: block;
    }
    .kw-textarea:focus { border-color: #a78bfa; }
    .kw-show-btn {
      background: transparent;
      border: 2px dashed rgba(78, 205, 196, 0.5);
      color: #4ecdc4;
      padding: 10px 18px; border-radius: 50px;
      cursor: pointer; font-family: inherit; font-weight: 700;
      font-size: 0.95rem;
      transition: all 0.2s;
    }
    .kw-show-btn:hover { background: rgba(78, 205, 196, 0.08); }
    .kw-answer-block {
      margin-top: 14px;
      padding: 16px;
      background: rgba(78, 205, 196, 0.06);
      border-left: 3px solid #4ecdc4;
      border-radius: 12px;
    }
    .kw-answer-label {
      font-weight: 700; color: #4ecdc4;
      font-size: 0.8rem; margin-bottom: 6px;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .kw-answer-text {
      color: #f1f5ff;
      line-height: 1.6;
    }
    .kw-self-check {
      margin-top: 14px; padding-top: 14px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .kw-self-check p { color: #a5b0d9; margin-bottom: 10px; font-size: 0.95rem; }
    .kw-self-btns {
      display: flex; flex-wrap: wrap; gap: 8px;
    }
    .kw-self-yes, .kw-self-no {
      padding: 10px 18px;
      border-radius: 50px;
      border: 2px solid; cursor: pointer;
      font-family: inherit; font-weight: 700;
      font-size: 0.9rem;
      background: transparent;
      transition: all 0.2s;
    }
    .kw-self-yes {
      border-color: rgba(107, 207, 127, 0.5);
      color: #6bcf7f;
    }
    .kw-self-yes:hover { background: rgba(107, 207, 127, 0.12); }
    .kw-self-no {
      border-color: rgba(255, 107, 157, 0.5);
      color: #ff6b9d;
    }
    .kw-self-no:hover { background: rgba(255, 107, 157, 0.12); }
    .kw-self-result {
      margin-top: 4px;
      font-weight: 700;
      padding: 12px 14px;
      border-radius: 10px;
    }
    .kw-ok-bg {
      background: rgba(107, 207, 127, 0.12);
      color: #6bcf7f;
    }
    .kw-muted-bg {
      background: rgba(255,255,255,0.04);
      color: #a5b0d9;
    }
    .kw-score {
      margin-top: 24px;
      text-align: center;
      padding: 22px;
      background: linear-gradient(135deg, rgba(255, 217, 61, 0.08), rgba(167, 139, 250, 0.08));
      border: 1px solid rgba(255, 217, 61, 0.25);
      border-radius: 18px;
    }
    .kw-stars {
      font-size: 2rem;
      letter-spacing: 6px;
      margin-bottom: 8px;
    }
    .kw-score p {
      color: #f1f5ff;
      font-family: 'Fredoka', sans-serif;
      font-weight: 600;
      font-size: 1rem;
    }
    .kw-final {
      margin-top: 10px;
      font-family: 'Fredoka', sans-serif;
      font-weight: 700;
      color: #ffd93d;
      font-size: 1.1rem;
    }

    @media (max-width: 600px) {
      .kw-q { padding: 18px; }
      .kw-q-text { font-size: 1rem; }
      .kw-opt { padding: 12px 14px; font-size: 0.95rem; }
      .kw-stars { font-size: 1.6rem; letter-spacing: 4px; }
    }
  `;

  const init = async () => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    let name = getName();
    if (!name) name = await askName();
    renderQuiz(name);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
