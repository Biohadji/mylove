const App = {
    coins: 50,
    currentStage: 1,
    selectedLevel: 1,
    completedStages: {},
    highScores: {},
    profile: null,
    genderTouched: false,

    init() {
        this.loadData();
        this.loadProfile();
        this.setupEventListeners();
        this.renderLevelTabs();
        this.renderStages();
        this.updateAllCoins();
        this.populateAge();
        SFX.init();
        this.startHearts();

        setTimeout(() => {
            document.getElementById('splash-screen').classList.remove('active');
            if (this.profile) {
                this.showScreen('home-screen');
                this.updateProfileUI();
            } else {
                this.showScreen('welcome-screen');
            }
            setTimeout(() => this.maybeAudioHint(), 1200);
        }, 2600);
    },

    loadData() {
        try {
            const saved = localStorage.getItem('mylove_save');
            if (saved) {
                const data = JSON.parse(saved);
                this.coins = data.coins || 50;
                this.currentStage = data.currentStage || 1;
                this.completedStages = data.completedStages || {};
                this.highScores = data.highScores || {};
            }
        } catch (e) {}
    },

    saveData() {
        try {
            localStorage.setItem('mylove_save', JSON.stringify({
                coins: this.coins,
                currentStage: this.currentStage,
                completedStages: this.completedStages,
                highScores: this.highScores
            }));
        } catch (e) {}
    },

    /* ==================== PROFILE / AUTH ==================== */
    loadProfile() {
        try {
            const p = localStorage.getItem('mylove_profile');
            this.profile = p ? JSON.parse(p) : null;
        } catch (e) { this.profile = null; }
    },

    saveProfile(profile) {
        this.profile = profile;
        try { localStorage.setItem('mylove_profile', JSON.stringify(profile)); } catch (e) {}
        this.updateProfileUI();
    },

    updateProfileUI() {
        const nameEl = document.getElementById('display-username');
        const avatarEl = document.getElementById('user-avatar');
        if (nameEl) nameEl.textContent = this.profile ? this.profile.name : 'زوجان';
        if (avatarEl) {
            avatarEl.textContent = this.profile ?
                (this.profile.gender === 'female' ? '👩' : this.profile.gender === 'male' ? '👨' : '💑') : '💑';
        }
        const greeting = document.getElementById('home-greeting');
        if (greeting && this.profile) {
            greeting.textContent = 'أهلاً ' + this.profile.name.split(' ')[0] + ' 💕 علاقتكما تستحق الدفء';
        }
    },

    populateAge() {
        const sel = document.getElementById('reg-age');
        if (!sel) return;
        for (let a = 18; a <= 70; a++) {
            const opt = document.createElement('option');
            opt.value = a;
            opt.textContent = a + ' سنة';
            sel.appendChild(opt);
        }
    },

    registerSubmit(e) {
        if (e) e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const age = document.getElementById('reg-age').value;
        const terms = document.getElementById('reg-terms').checked;
        const errorEl = document.getElementById('reg-error');
        const selectedGender = document.querySelector('.gender-btn.active');

        errorEl.textContent = '';

        if (!name) { errorEl.textContent = '⚠️ الرجاء كتابة الاسم'; SFX.play('error'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errorEl.textContent = '⚠️ الرجاء إدخال بريد إلكتروني صحيح'; SFX.play('error'); return; }
        if (!selectedGender) { errorEl.textContent = '⚠️ الرجاء اختيار الجنس'; SFX.play('error'); return; }
        if (!age) { errorEl.textContent = '⚠️ الرجاء اختيار العمر'; SFX.play('error'); return; }
        if (parseInt(age, 10) < 18) { errorEl.textContent = '⚠️ يجب أن تكون في سن 18 أو أكثر'; SFX.play('error'); return; }
        if (!terms) { errorEl.textContent = '⚠️ يجب الموافقة على الشروط العامة للدخول'; SFX.play('error'); return; }

        const gender = selectedGender.dataset.gender;
        this.saveProfile({ name, email, gender, age: parseInt(age, 10), joinedAt: Date.now() });
        SFX.play('win');
        this.showScreen('home-screen');
        this.updateProfileUI();
        this.renderLevelTabs();
        this.renderStages();
        this.spawnConfetti();
    },

    maybeAudioHint() {
        if (this.profile && localStorage.getItem('mylove_audio_hint') !== '1') {
            document.getElementById('audio-hint').style.display = 'flex';
        }
    },

    /* ==================== EVENT LISTENERS ==================== */
    setupEventListeners() {
        // App-starting buttons
        document.getElementById('welcome-start-btn').addEventListener('click', () => {
            SFX.play('click');
            this.showScreen('register-screen');
        });

        document.getElementById('reg-form').addEventListener('submit', (e) => this.registerSubmit(e));
        document.getElementById('register-submit').addEventListener('click', () => this.registerSubmit());

        document.querySelectorAll('.gender-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                SFX.play('click');
            });
        });

        // Terms modal
        const openTerms = () => { document.getElementById('terms-modal').style.display = 'flex'; SFX.play('click'); };
        const closeTerms = () => document.getElementById('terms-modal').style.display = 'none';
        document.getElementById('terms-link').addEventListener('click', (e) => { e.preventDefault(); openTerms(); });
        document.getElementById('terms-close').addEventListener('click', closeTerms);
        document.getElementById('terms-ok').addEventListener('click', () => {
            document.getElementById('reg-terms').checked = true;
            closeTerms();
            SFX.play('success');
        });

        // Audio hint overlay
        document.getElementById('audio-hint-ok').addEventListener('click', () => {
            document.getElementById('audio-hint').style.display = 'none';
            localStorage.setItem('mylove_audio_hint', '1');
            SFX.play('reveal');
        });

        // Sound toggle
        document.getElementById('sound-toggle').addEventListener('click', () => {
            const on = SFX.toggle();
            document.getElementById('sound-toggle').textContent = on ? '🔊' : '🔇';
            SFX.play('click');
        });
        document.getElementById('sound-toggle').textContent = SFX.muted ? '🔇' : '🔊';

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                SFX.play('click');
                const screen = btn.dataset.screen;
                if (screen === 'home') this.showScreen('home-screen');
                else if (screen === 'wheel') { this.showScreen('wheel-screen'); wheel.init(); }
                else if (screen === 'puzzle') { this.showScreen('puzzle-screen'); games.init(); }
                else if (screen === 'quiz') { this.showScreen('quiz-screen'); quiz.init(); }
                else if (screen === 'jokes') { this.showScreen('jokes-screen'); jokes.init(); }
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        document.getElementById('game-back').addEventListener('click', () => {
            document.getElementById('stage-intro').style.display = 'none';
            this.showScreen('home-screen');
            this.renderLevelTabs();
            this.renderStages();
        });

        document.getElementById('wheel-back').addEventListener('click', () => this.showScreen('home-screen'));
        document.getElementById('puzzle-back').addEventListener('click', () => this.showScreen('home-screen'));
        document.getElementById('quiz-back').addEventListener('click', () => this.showScreen('home-screen'));
        document.getElementById('jokes-back').addEventListener('click', () => this.showScreen('home-screen'));

        document.getElementById('spin-btn').addEventListener('click', () => wheel.spin());
        document.getElementById('result-close').addEventListener('click', () => {
            document.getElementById('wheel-result').style.display = 'none';
        });

        document.getElementById('hint-btn').addEventListener('click', () => game.useHint());
        document.getElementById('shuffle-btn').addEventListener('click', () => game.shuffle());

        const crosswordSubmit = document.getElementById('crossword-submit');
        if (crosswordSubmit) {
            crosswordSubmit.addEventListener('click', () => puzzle.submitCrossword());
        }
        const crosswordInput = document.getElementById('crossword-input');
        if (crosswordInput) {
            crosswordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') puzzle.submitCrossword();
            });
        }

        document.getElementById('next-stage-btn').addEventListener('click', () => {
            const nextId = game.stageId + 1;
            if (nextId <= STAGES.length) {
                this.startStage(nextId);
            } else {
                this.showScreen('home-screen');
                this.renderLevelTabs();
                this.renderStages();
            }
        });

        document.getElementById('break-btn').addEventListener('click', () => {
            this.showScreen('wheel-screen');
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('[data-screen="wheel"]').classList.add('active');
            wheel.init();
        });
    },

    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    },

    renderLevelTabs() {
        const tabs = document.getElementById('level-tabs');
        if (!tabs) return;
        tabs.innerHTML = '';
        const current = this.selectedLevel || 1;

        LEVELS.forEach(lvl => {
            const btn = document.createElement('button');
            btn.className = 'level-tab' + (lvl.id === current ? ' active' : '');
            btn.style.setProperty('--level-color', lvl.color);
            btn.innerHTML = `
                <span class="level-tab-icon">${lvl.icon}</span>
                <span class="level-tab-name">${lvl.name}</span>
                <span class="level-tab-desc">${lvl.desc}</span>
            `;
            btn.addEventListener('click', () => {
                SFX.play('click');
                this.selectedLevel = lvl.id;
                this.renderLevelTabs();
                this.renderStages();
            });
            tabs.appendChild(btn);
        });
    },

    renderStages() {
        const map = document.getElementById('stages-map');
        if (!map) return;
        map.innerHTML = '';

        const levelId = this.selectedLevel || 1;
        const lvl = LEVELS.find(l => l.id === levelId) || LEVELS[0];
        const levelStages = STAGES.filter(s => s.level === levelId);

        const header = document.createElement('div');
        header.className = 'level-header';
        header.innerHTML = `
            <span class="level-header-icon">${lvl.icon}</span>
            <span class="level-header-name">مستوى ${lvl.name}</span>
            <span class="level-header-desc">${lvl.desc}</span>
        `;
        map.appendChild(header);

        levelStages.forEach((stage, idx) => {
            if (idx > 0) {
                const connector = document.createElement('div');
                connector.className = 'stage-connector';
                if (this.completedStages[stage.id - 1]) connector.classList.add('completed');
                else connector.classList.add('locked');
                map.appendChild(connector);
            }

            const node = document.createElement('div');
            node.className = 'stage-node';

            const circle = document.createElement('div');
            circle.className = 'stage-circle';
            const isCompleted = this.completedStages[stage.id];
            const isUnlocked = stage.id === 1 || this.completedStages[stage.id - 1];

            if (isCompleted) circle.classList.add('completed');
            else if (isUnlocked) circle.classList.add('unlocked');
            else circle.classList.add('locked');

            const stars = this.highScores[stage.id] || 0;
            circle.innerHTML = `
                <span class="stage-number">${isCompleted ? '✓' : stage.id}</span>
                ${stars > 0 ? `<span class="stage-stars">${'⭐'.repeat(stars)}</span>` : ''}
            `;

            const name = document.createElement('div');
            name.className = 'stage-name';
            name.textContent = stage.name;

            node.appendChild(circle);
            node.appendChild(name);

            if (isUnlocked) {
                node.addEventListener('click', () => this.startStage(stage.id));
            }

            map.appendChild(node);
        });
    },

    startStage(stageId) {
        const stage = STAGES.find(s => s.id === stageId);
        if (!stage) return;

        this.showScreen('game-screen');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        game.init(stage);
    },

    completeStage(stageId, stars) {
        this.completedStages[stageId] = true;
        if (!this.highScores[stageId] || this.highScores[stageId] < stars) {
            this.highScores[stageId] = stars;
        }
        this.currentStage = Math.max(this.currentStage, stageId + 1);
        this.saveData();
        this.updateAllCoins();
    },

    getCoins() { return this.coins; },

    addCoins(amount) {
        this.coins += amount;
        this.saveData();
        this.updateAllCoins();
        SFX.play('coin');
    },

    updateAllCoins() {
        const els = ['coins-count', 'game-coins', 'wheel-coins', 'puzzle-coins', 'quiz-coins', 'jokes-coins'];
        els.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = this.coins;
        });
        const lvl = document.getElementById('display-level');
        if (lvl) lvl.textContent = 'المستوى ' + this.currentStage;
    },

    /* ==================== AMBIENT HEARTS ==================== */
    startHearts() {
        const layer = document.getElementById('hearts-layer');
        const hearts = ['❤️', '💕', '💖', '🌸', '💗', '💞'];
        const spawn = () => {
            const h = document.createElement('div');
            h.className = 'f-heart';
            h.textContent = hearts[Math.floor(Math.random() * hearts.length)];
            h.style.left = Math.random() * 100 + 'vw';
            h.style.fontSize = (12 + Math.random() * 22) + 'px';
            h.style.animationDuration = (8 + Math.random() * 8) + 's';
            h.style.opacity = 0;
            layer.appendChild(h);
            setTimeout(() => h.remove(), 16000);
        };
        this.heartTimer = setInterval(() => {
            if (Math.random() < 0.6) spawn();
        }, 1800);
        for (let i = 0; i < 5; i++) setTimeout(spawn, i * 500);
    },

    spawnConfetti() {
        const colors = ['#e91e63', '#9c27b0', '#ff6f00', '#ffd700', '#4caf50', '#2196f3', '#f44336'];
        for (let i = 0; i < 40; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + 'vw';
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDuration = (2 + Math.random() * 2) + 's';
            piece.style.animationDelay = Math.random() * 1.5 + 's';
            piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            piece.style.width = (6 + Math.random() * 8) + 'px';
            piece.style.height = (6 + Math.random() * 8) + 'px';
            document.body.appendChild(piece);
            setTimeout(() => piece.remove(), 5000);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}