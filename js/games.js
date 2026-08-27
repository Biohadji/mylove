class RomanticGames {
    constructor() {
        this.currentGame = null;
        this.storyWords = [];
        this.storyStep = 0;
        this.storyResult = [];
        this.compatAnswers = {};
        this.compatQ = 0;
        this.todIdx = 0;
        this.todType = null;
        this.wyrIdx = 0;
        this.emotionCards = [];
        this.emotionFlipped = [];
        this.emotionMatched = 0;
        this.bottleSpinning = false;
        this.challengeInterval = null;
        this.jokePunch = '';
    }

    init() {
        if (this._initialized) return;
        this._initialized = true;
        this.bindMenu();
        document.getElementById('game-back-menu').addEventListener('click', () => this.backToMenu());
    }

    bindMenu() {
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const game = card.dataset.game;
                this.startGame(game);
            });
        });
    }

    startGame(gameId) {
        this.currentGame = gameId;
        document.getElementById('games-menu').style.display = 'none';
        document.getElementById('game-play-area').style.display = 'flex';

        const titles = {
            'truth-dare': '🔥 صراحة أم تحدٍ',
            'would-you': '🤔 أفضّل',
            'bottle': '🍾 لفّة الزجاجة',
            'story': '📖 قصة الحب',
            'emotions': '🎭 مطابقة المشاعر',
            'compat': '💖 اختبار التوافق',
            'memory8': '🧠 ذاكرة الحب',
            'challenge': '⚡ تحدي الأزواج',
            'jokes': '😂 نكت رومانسية'
        };
        document.getElementById('game-play-title').textContent = titles[gameId] || '';

        const content = document.getElementById('game-play-content');
        content.innerHTML = '';

        switch(gameId) {
            case 'truth-dare': this.initTruthDare(content); break;
            case 'would-you': this.initWouldYou(content); break;
            case 'bottle': this.initBottle(content); break;
            case 'story': this.initStory(content); break;
            case 'emotions': this.initEmotions(content); break;
            case 'compat': this.initCompat(content); break;
            case 'memory8': this.initMemory8(content); break;
            case 'challenge': this.initChallenge(content); break;
            case 'jokes': this.initJokes(content); break;
        }
    }

    backToMenu() {
        if (this.challengeInterval) clearInterval(this.challengeInterval);
        this.currentGame = null;
        document.getElementById('games-menu').style.display = 'block';
        document.getElementById('game-play-area').style.display = 'none';
    }

    /* =================== 1. TRUTH OR DARE =================== */
    initTruthDare(el) {
        this.todIdx = 0;
        this.todType = null;
        this.showTodCard(el);
    }

    showTodCard(el) {
        const truths = TRUTH_DARE_DATA.truths;
        const dares = TRUTH_DARE_DATA.dares;
        let q, answers;

        if (this.todType === 'truth') {
            const truthObj = truths[this.todIdx % truths.length];
            q = truthObj.q;
            answers = truthObj.answers;
        } else if (this.todType === 'dare') {
            q = dares[this.todIdx % dares.length];
            answers = null;
        }

        el.innerHTML = `
            <div class="tod-card">
                <div class="tod-type-badge ${this.todType || 'truth'}">
                    ${this.todType === 'truth' ? '💬 صراحة' : this.todType === 'dare' ? '🔥 تحدٍ' : 'اختر نوع السؤال'}
                </div>
                <div class="tod-question">${this.todType ? q : 'هل تريد صراحة أم تحدٍ؟'}</div>
                ${answers && this.todType === 'truth' ? `
                    <div class="tod-answers">
                        <div class="tod-answers-title">اختر إجابة أو أجب بحرية:</div>
                        ${answers.map((a, i) => `
                            <button class="tod-answer-btn" data-comment="${a.comment.replace(/"/g,'&quot;')}" onclick="games.selectTodAnswer(this)">${a.text}</button>
                        `).join('')}
                    </div>
                    <div id="tod-comment" class="tod-comment"></div>
                ` : ''}
                <div class="tod-buttons">
                    ${this.todType ? `
                        <button class="tod-btn truth-btn" onclick="games.todType='truth';games.todIdx++;games.showTodCard(document.getElementById('game-play-content'))">💬 صراحة</button>
                        <button class="tod-btn dare-btn" onclick="games.todType='dare';games.todIdx++;games.showTodCard(document.getElementById('game-play-content'))">🔥 تحدٍ</button>
                    ` : `
                        <button class="tod-btn truth-btn" onclick="games.todType='truth';games.todIdx=0;games.showTodCard(document.getElementById('game-play-content'))">💬 صراحة</button>
                        <button class="tod-btn dare-btn" onclick="games.todType='dare';games.todIdx=0;games.showTodCard(document.getElementById('game-play-content'))">🔥 تحدٍ</button>
                    `}
                </div>
            </div>
        `;
        App.addCoins(1);
    }

    selectTodAnswer(btn) {
        const container = btn.closest('.tod-answers');
        const commentDiv = document.getElementById('tod-comment');
        const comment = btn.dataset.comment;

        container.querySelectorAll('.tod-answer-btn').forEach(b => {
            b.style.pointerEvents = 'none';
            b.classList.add('selected');
        });
        btn.classList.add('selected-correct');

        commentDiv.innerHTML = `
            <div class="tod-comment-box">
                <div class="tod-comment-icon">💕</div>
                <div class="tod-comment-text">${comment}</div>
            </div>
        `;
        SFX.play('reveal');
    }

    /* =================== 2. WOULD YOU RATHER =================== */
    initWouldYou(el) {
        this.wyrIdx = 0;
        this.showWyrCard(el);
    }

    showWyrCard(el) {
        const q = WOULD_YOU_DATA[this.wyrIdx % WOULD_YOU_DATA.length];
        el.innerHTML = `
            <div class="wyr-card">
                <div class="wyr-question">${this.wyrIdx + 1}. أيهما تفضّل؟</div>
                <div class="wyr-options">
                    <button class="wyr-option" onclick="games.selectWyr(this, 0, '${q.a.replace(/'/g,"\\'")}', '${q.r1.replace(/'/g,"\\'")}')">${q.a}</button>
                    <button class="wyr-option" onclick="games.selectWyr(this, 1, '${q.b.replace(/'/g,"\\'")}', '${q.r2.replace(/'/g,"\\'")}')">${q.b}</button>
                </div>
                <div id="wyr-result"></div>
            </div>
        `;
    }

    selectWyr(btn, idx, choice, reason) {
        const options = btn.parentElement.querySelectorAll('.wyr-option');
        options.forEach((o, i) => {
            o.style.pointerEvents = 'none';
            if (i === idx) o.classList.add('selected-correct');
            else o.classList.add('selected-wrong');
        });
        document.getElementById('wyr-result').innerHTML = `
            <div class="wyr-result">${reason}</div>
            <button class="game-action-btn gold" style="margin-top:12px;" onclick="games.wyrIdx++;games.showWyrCard(document.getElementById('game-play-content'))">التالي ➡️</button>
        `;
        App.addCoins(1);
        SFX.play('pop');
    }

    /* =================== 3. BOTTLE SPIN =================== */
    initBottle(el) {
        this.bottleSpinning = false;
        const actions = BOTTLE_ACTIONS;
        el.innerHTML = `
            <div class="bottle-container">
                <div class="bottle-circle" id="bottle-circle">
                    <div class="bottle-pointer">▼</div>
                    <div class="bottle-center" id="bottle-center">🍾</div>
                </div>
                <button class="spin-bottle-btn" id="spin-bottle-btn" onclick="games.spinBottle()">🎰 لفّ الزجاجة!</button>
                <div id="bottle-result"></div>
            </div>
        `;
    }

    spinBottle() {
        if (this.bottleSpinning) return;
        this.bottleSpinning = true;
        const btn = document.getElementById('spin-bottle-btn');
        btn.disabled = true;

        const circle = document.getElementById('bottle-circle');
        const extraSpins = 3 + Math.floor(Math.random() * 4);
        const randomDeg = Math.random() * 360;
        const totalDeg = extraSpins * 360 + randomDeg;
        const duration = 3000;
        const startTime = performance.now();
        const startDeg = 0;

        const animate = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            circle.style.transform = `rotate(${startDeg + totalDeg * eased}deg)`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.bottleSpinning = false;
                btn.disabled = false;
                SFX.play('spinEnd');
                const actionIdx = Math.floor((randomDeg / 360) * BOTTLE_ACTIONS.length) % BOTTLE_ACTIONS.length;
                const action = BOTTLE_ACTIONS[actionIdx];
                document.getElementById('bottle-result').innerHTML = `
                    <div class="bottle-result-card">
                        <div class="bottle-result-icon">${action.icon}</div>
                        <div class="bottle-result-text">${action.text}</div>
                        <button class="game-action-btn gold" onclick="games.spinBottle()">لفّ مرة أخرى 🔄</button>
                    </div>
                `;
                App.addCoins(2);
            }
        };
        requestAnimationFrame(animate);
    }

    /* =================== 4. LOVE STORY =================== */
    initStory(el) {
        this.storyStep = 0;
        this.storyResult = [];
        this.showStoryStep(el);
    }

    showStoryStep(el) {
        const step = STORY_STEPS[this.storyStep];
        if (!step) { this.showStoryResult(el); return; }

        el.innerHTML = `
            <div class="story-card">
                <div class="story-progress">
                    ${STORY_STEPS.map((_, i) => `<div class="story-dot ${i < this.storyStep ? 'done' : i === this.storyStep ? 'current' : ''}"></div>`).join('')}
                </div>
                <div class="story-prompt">${step.prompt}</div>
                <input type="text" class="story-input" id="story-input" placeholder="${step.placeholder}" maxlength="40">
                <button class="game-action-btn primary" onclick="games.saveStoryWord()">التالي ➡️</button>
            </div>
        `;
        setTimeout(() => document.getElementById('story-input').focus(), 100);
    }

    saveStoryWord() {
        const input = document.getElementById('story-input');
        const word = input.value.trim() || '....';
        this.storyResult.push(word);
        this.storyStep++;
        this.showStoryStep(document.getElementById('game-play-content'));
        App.addCoins(1);
    }

    showStoryResult(el) {
        const story = STORY_TEMPLATE.map((t, i) => t + (this.storyResult[i] || '...')).join(' ');
        el.innerHTML = `
            <div class="story-card">
                <div class="story-prompt">📖 قصتكما الرومانسية</div>
                <div class="story-result"><p>${story}</p></div>
                <button class="game-action-btn gold" style="margin-top:14px;" onclick="games.initStory(document.getElementById('game-play-content'))">قصة جديدة 🔄</button>
            </div>
        `;
        App.addCoins(5);
        SFX.play('success');
    }

    /* =================== 5. EMOTION MATCH =================== */
    initEmotions(el) {
        this.emotionFlipped = [];
        this.emotionMatched = 0;
        const pairs = EMOTION_PAIRS.slice(0, 6);
        const cards = [];
        pairs.forEach(p => {
            cards.push({ id: p[0], emoji: p[0], label: p[1] });
            cards.push({ id: p[1], emoji: p[0], label: p[1] });
        });
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        this.emotionCards = cards;

        el.innerHTML = `
            <div class="emotion-grid" id="emotion-grid">
                ${cards.map((c, i) => `
                    <div class="emotion-card" data-idx="${i}" onclick="games.flipEmotion(${i})">
                        <span style="opacity:0">?</span>
                    </div>
                `).join('')}
            </div>
            <p style="color:rgba(255,255,255,0.7);font-size:13px;text-align:center;">طابقوا الأزواج المتشابهة 🎭</p>
        `;
    }

    flipEmotion(idx) {
        if (this.emotionFlipped.length >= 2) return;
        const card = document.querySelector(`.emotion-card[data-idx="${idx}"]`);
        if (!card || card.classList.contains('flipped') || card.classList.contains('matched')) return;

        card.classList.add('flipped');
        card.innerHTML = this.emotionCards[idx].emoji;
        this.emotionFlipped.push({ idx, card });

        if (this.emotionFlipped.length === 2) {
            const [a, b] = this.emotionFlipped;
            const ca = this.emotionCards[a.idx];
            const cb = this.emotionCards[b.idx];

            if (ca.id === cb.id && a.idx !== b.idx) {
                setTimeout(() => {
                    a.card.classList.add('matched');
                    b.card.classList.add('matched');
                    this.emotionMatched++;
                    this.emotionFlipped = [];
                    App.addCoins(3);
                    SFX.play('pop');
                    if (this.emotionMatched === EMOTION_PAIRS.length) {
                        App.addCoins(10);
                        SFX.play('win');
                        alert('ممتاز! لقد أكملت مطابقة المشاعر 🎭 +10 جواهر');
                    }
                }, 400);
            } else {
                setTimeout(() => {
                    a.card.classList.remove('flipped');
                    b.card.innerHTML = '<span style="opacity:0">?</span>';
                    b.card.classList.remove('flipped');
                    this.emotionFlipped = [];
                }, 800);
            }
        }
    }

    /* =================== 6. COMPATIBILITY TEST =================== */
    initCompat(el) {
        this.compatQ = 0;
        this.compatAnswers = {};
        this.showCompatQ(el);
    }

    showCompatQ(el) {
        const q = COMPAT_QUESTIONS[this.compatQ];
        if (!q) { this.showCompatResult(el); return; }

        el.innerHTML = `
            <div class="compat-card">
                <div style="font-size:13px;color:var(--text-light);margin-bottom:8px;">${this.compatQ + 1} / ${COMPAT_QUESTIONS.length}</div>
                <div class="compat-question">${q.q}</div>
                <div class="compat-answers">
                    ${q.options.map((o, i) => `
                        <button class="compat-answer" onclick="games.selectCompat(${i}, '${o.replace(/'/g,"\\'")}')">${o}</button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    selectCompat(idx, answer) {
        this.compatAnswers[this.compatQ] = answer;
        document.querySelectorAll('.compat-answer').forEach((b, i) => {
            b.style.pointerEvents = 'none';
            if (i === idx) b.classList.add('selected');
        });
        setTimeout(() => {
            this.compatQ++;
            this.showCompatQ(document.getElementById('game-play-content'));
        }, 500);
    }

    showCompatResult(el) {
        const total = COMPAT_QUESTIONS.length;
        const matched = Object.keys(this.compatAnswers).length;
        const pct = Math.round((matched / total) * 100);
        let msg = '';
        if (pct >= 80) msg = 'أنتما توأم الروح! نسبتكما عالية جداً 💕';
        else if (pct >= 50) msg = 'توافق جيد! أنتما متشابهان في أشياء كثيرة 😊';
        else msg = 'اختلافكم يجعل العلاقة أكثر إثارة! 💖';

        el.innerHTML = `
            <div class="compat-card">
                <div class="compat-question">نتيجة التوافق</div>
                <div style="font-size:48px;font-weight:900;color:var(--primary);margin:16px 0;">${pct}%</div>
                <div class="compat-result">${msg}</div>
                <div style="margin-top:14px;">
                    ${Object.entries(this.compatAnswers).map(([k, v]) => `<div style="font-size:13px;color:var(--text-light);margin:4px 0;">${COMPAT_QUESTIONS[k].q.substring(0, 30)}... → ${v}</div>`).join('')}
                </div>
                <button class="game-action-btn gold" style="margin-top:14px;" onclick="games.initCompat(document.getElementById('game-play-content'))">إعادة الاختبار 🔄</button>
            </div>
        `;
        App.addCoins(5);
    }

    /* =================== 7. LOVE MEMORY (8 pairs) =================== */
    initMemory8(el) {
        this.emotionFlipped = [];
        this.emotionMatched = 0;
        const pairs = MEMORY_PAIRS;
        const cards = [];
        pairs.forEach(p => {
            cards.push({ id: p[0], emoji: p[0], label: p[1] });
            cards.push({ id: p[1], emoji: p[0], label: p[1] });
        });
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        this.emotionCards = cards;

        el.innerHTML = `
            <div class="emotion-grid" id="emotion-grid" style="grid-template-columns: repeat(4, 1fr);">
                ${cards.map((c, i) => `
                    <div class="emotion-card" data-idx="${i}" onclick="games.flipEmotion(${i})">
                        <span style="opacity:0">?</span>
                    </div>
                `).join('')}
            </div>
            <p style="color:rgba(255,255,255,0.7);font-size:13px;text-align:center;">طابقوا الأزواج المتشابهة 🧠</p>
        `;
    }

    /* =================== 8. COUPLE CHALLENGE =================== */
    initChallenge(el) {
        const ch = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
        let timeLeft = ch.time || 60;

        el.innerHTML = `
            <div class="challenge-card">
                <div class="challenge-icon">${ch.icon}</div>
                <div class="challenge-title">${ch.title}</div>
                <div class="challenge-desc">${ch.desc}</div>
                <div class="challenge-timer" id="challenge-timer">${this.formatTime(timeLeft)}</div>
                <button class="challenge-done-btn" id="challenge-done" onclick="games.completeChallenge()">نجحت! ✅</button>
                <button class="game-action-btn gold" style="margin-top:10px;" onclick="games.initChallenge(document.getElementById('game-play-content'))">تحدي آخر 🔄</button>
            </div>
        `;

        if (this.challengeInterval) clearInterval(this.challengeInterval);
        this.challengeInterval = setInterval(() => {
            timeLeft--;
            const timerEl = document.getElementById('challenge-timer');
            if (timerEl) timerEl.textContent = this.formatTime(timeLeft);
            if (timeLeft <= 0) {
                clearInterval(this.challengeInterval);
                const doneBtn = document.getElementById('challenge-done');
                if (doneBtn) doneBtn.style.display = 'none';
            }
        }, 1000);
    }

    completeChallenge() {
        if (this.challengeInterval) clearInterval(this.challengeInterval);
        App.addCoins(10);
        SFX.play('win');
        alert('أحسنت! لقد أكملت التحدي 🎉 +10 جواهر');
    }

    formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    /* =================== 9. ROMANTIC JOKES =================== */
    initJokes(el) {
        if (!ROMANTIC_JOKES.length) return;
        this.jokePunch = '';
        this.showJoke(el);
    }

    showJoke(el) {
        const joke = ROMANTIC_JOKES[Math.floor(Math.random() * ROMANTIC_JOKES.length)];
        this.jokePunch = joke.punch;
        el.innerHTML = `
            <div class="joke-card">
                <div class="joke-card-head">😂 نكتة رومانسية</div>
                <div class="joke-setup">${joke.setup}</div>
                <button class="joke-reveal-btn" id="joke-reveal" onclick="games.revealJoke()">أظهر البونطة 🙊</button>
                <div class="joke-punch" id="joke-punch" style="display:none;"></div>
                <button class="game-action-btn gold" style="margin-top:14px;" onclick="games.showJoke(document.getElementById('game-play-content'))">نكتة أخرى 🔄</button>
            </div>
        `;
        App.addCoins(1);
        SFX.play('pop');
    }

    revealJoke() {
        const punchEl = document.getElementById('joke-punch');
        if (!punchEl) return;
        punchEl.textContent = this.jokePunch || '';
        punchEl.style.display = 'block';
        const btn = document.getElementById('joke-reveal');
        if (btn) btn.style.display = 'none';
        SFX.play('success');
    }
}

const games = new RomanticGames();
