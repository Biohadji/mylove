class WordCrushGame {
    constructor() {
        this.board = [];
        this.gridSize = 6;
        this.words = [];
        this.foundWords = [];
        this.selectedCells = [];
        this.selectedLetters = [];
        this.hints = 3;
        this.stageId = 1;
        this.level = 1;
        this.wordPositions = [];
        this.hintActive = false;
    }

    levelConfig(level) {
        const lvl = LEVELS.find(l => l.id === (level || 1)) || LEVELS[0];
        return lvl;
    }

    init(stage) {
        this.stageId = stage.id;
        this.level = stage.level || 1;
        this.gridSize = stage.gridSize;
        this.words = [...stage.words];
        this.foundWords = [];
        this.selectedCells = [];
        this.selectedLetters = [];
        this.hints = this.levelConfig(this.level).hints;
        this.wordPositions = [];
        this.hintActive = false;
        this.generateBoard();
        this.showStageIntro(stage);
    }

    showStageIntro(stage) {
        const lvl = this.levelConfig(this.level);
        const intro = document.getElementById('stage-intro');
        document.getElementById('intro-number').textContent = 'مستوى ' + lvl.name + ' - المرحلة ' + stage.id;
        document.getElementById('intro-title').textContent = stage.name;
        document.getElementById('intro-desc').textContent = stage.desc;

        const wordsEl = document.getElementById('intro-words');
        wordsEl.innerHTML = '';
        stage.words.forEach(w => {
            const chip = document.createElement('span');
            chip.className = 'intro-word-chip';
            chip.textContent = w;
            wordsEl.appendChild(chip);
        });

        const icons = ['💕','💋','🌹','🌙','💃','📸','☕','❤️','💎','🌸','🏠','✨'];
        document.getElementById('intro-icon').textContent = icons[(stage.id - 1) % icons.length];

        intro.style.display = 'flex';

        document.getElementById('intro-start-btn').onclick = () => {
            intro.style.display = 'none';
            this.render();
            this.updateUI();
        };

        document.getElementById('intro-close-btn').onclick = () => {
            intro.style.display = 'none';
            App.showScreen('home-screen');
            App.renderLevelTabs();
            App.renderStages();
        };
    }

    generateBoard() {
        const size = this.gridSize;
        this.board = [];
        this.wordPositions = [];
        for (let r = 0; r < size; r++) {
            this.board[r] = [];
            for (let c = 0; c < size; c++) {
                this.board[r][c] = { letter: '', found: false, wordIdx: -1 };
            }
        }

        const directions = [
            [0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1]
        ];

        this.words.forEach((word, wi) => {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 200) {
                attempts++;
                const dir = directions[Math.floor(Math.random() * directions.length)];
                const maxR = size - (dir[0] === 1 ? word.length : 0);
                const maxC = dir[1] === 1 ? size - word.length : (dir[1] === -1 ? word.length - 1 : size);
                const minC = dir[1] === -1 ? word.length - 1 : 0;

                if (maxR < 0 || maxC < minC) { attempts++; continue; }

                const startR = Math.floor(Math.random() * Math.max(1, maxR));
                const startC = Math.floor(Math.random() * Math.max(1, maxC - minC)) + minC;

                let canPlace = true;
                for (let i = 0; i < word.length; i++) {
                    const r = startR + dir[0] * i;
                    const c = startC + dir[1] * i;
                    if (r < 0 || r >= size || c < 0 || c >= size) { canPlace = false; break; }
                    if (this.board[r][c].letter && this.board[r][c].letter !== word[i]) { canPlace = false; break; }
                }

                if (canPlace) {
                    const positions = [];
                    for (let i = 0; i < word.length; i++) {
                        const r = startR + dir[0] * i;
                        const c = startC + dir[1] * i;
                        this.board[r][c] = { letter: word[i], found: false, wordIdx: wi };
                        positions.push({ r, c });
                    }
                    this.wordPositions[wi] = {
                        start: { r: startR, c: startC },
                        dir: dir,
                        positions: positions
                    };
                    placed = true;
                }
            }

            if (!placed) {
                const positions = [];
                for (let i = 0; i < word.length; i++) {
                    let r, c, tries = 0;
                    do {
                        r = Math.floor(Math.random() * size);
                        c = Math.floor(Math.random() * size);
                        tries++;
                    } while (this.board[r][c].letter && tries < 100);
                    this.board[r][c] = { letter: word[i], found: false, wordIdx: wi };
                    positions.push({ r, c });
                }
                this.wordPositions[wi] = {
                    start: positions[0],
                    dir: [0, 1],
                    positions: positions
                };
            }
        });

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (!this.board[r][c].letter) {
                    this.board[r][c].letter = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
                }
            }
        }
    }

    render() {
        const boardEl = document.getElementById('game-board');
        boardEl.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        boardEl.innerHTML = '';

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'letter-cell pop';
                cell.style.animationDelay = `${(r * this.gridSize + c) * 30}ms`;
                cell.textContent = this.board[r][c].letter;
                if (this.board[r][c].found) cell.classList.add('found');
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.addEventListener('click', () => this.onCellClick(r, c));
                boardEl.appendChild(cell);
            }
        }

        this.renderTargetWords();
    }

    renderTargetWords() {
        const container = document.getElementById('target-words');
        container.innerHTML = '';
        this.words.forEach((word, i) => {
            const el = document.createElement('div');
            el.className = 'target-word';
            el.dataset.wordIdx = i;
            if (this.foundWords.includes(i)) el.classList.add('found');

            for (const ch of word) {
                const span = document.createElement('span');
                span.className = 'target-letter';
                span.textContent = this.foundWords.includes(i) ? ch : '___';
                if (this.foundWords.includes(i)) span.classList.add('revealed');
                el.appendChild(span);
            }
            container.appendChild(el);
        });
    }

    onCellClick(r, c) {
        if (this.board[r][c].found) return;

        const idx = this.selectedCells.findIndex(s => s.r === r && s.c === c);
        if (idx > -1) {
            this.selectedCells.splice(idx, 1);
            this.selectedLetters.splice(idx, 1);
        } else {
            this.selectedCells.push({ r, c });
            this.selectedLetters.push(this.board[r][c].letter);
            SFX.play('pop');
        }

        this.updateSelection();
        this.checkWord();
    }

    updateSelection() {
        document.querySelectorAll('.letter-cell').forEach(cell => {
            cell.classList.remove('selected');
        });

        this.selectedCells.forEach(s => {
            const el = document.querySelector(`.letter-cell[data-row="${s.r}"][data-col="${s.c}"]`);
            if (el) el.classList.add('selected');
        });

        const selectedEl = document.getElementById('game-selected');
        selectedEl.innerHTML = '';
        this.selectedLetters.forEach(l => {
            const span = document.createElement('span');
            span.className = 'selected-letter';
            span.textContent = l;
            selectedEl.appendChild(span);
        });
    }

    checkWord() {
        const currentWord = this.selectedLetters.join('');

        this.words.forEach((word, i) => {
            if (this.foundWords.includes(i)) return;
            if (currentWord === word || currentWord === word.split('').reverse().join('')) {
                this.foundWords.push(i);

                const wi = i;
                document.querySelectorAll('.letter-cell').forEach(cell => {
                    const r = parseInt(cell.dataset.row);
                    const c = parseInt(cell.dataset.col);
                    if (this.board[r][c].wordIdx === wi) {
                        cell.classList.add('found', 'celebrate');
                        this.board[r][c].found = true;
                        setTimeout(() => cell.classList.remove('celebrate'), 600);
                    }
                });

                const targetEl = document.querySelector(`.target-word[data-word-idx="${wi}"]`);
                if (targetEl) {
                    targetEl.classList.add('celebrate');
                    setTimeout(() => targetEl.classList.remove('celebrate'), 600);
                }

                this.showScorePopup('+' + 10 + ' 💎');
                SFX.play('success');

                this.selectedCells = [];
                this.selectedLetters = [];
                this.updateSelection();
                this.renderTargetWords();
                this.updateProgress();

                if (this.foundWords.length === this.words.length) {
                    setTimeout(() => this.onComplete(), 800);
                }
            }
        });
    }

    showScorePopup(text) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = text;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1300);
    }

    updateProgress() {
        const pct = (this.foundWords.length / this.words.length) * 100;
        document.getElementById('game-progress').style.width = pct + '%';
    }

    updateUI() {
        const lvl = this.levelConfig(this.level);
        document.getElementById('game-stage-label').textContent = lvl.icon + ' مستوى ' + lvl.name + ' - المرحلة ' + this.stageId;
        document.getElementById('hint-count').textContent = this.hints;
        const coins = App.getCoins();
        document.getElementById('game-coins').textContent = coins;
    }

    useHint() {
        if (this.hints <= 0) return;

        const unfound = this.words.map((w, i) => i).filter(i => !this.foundWords.includes(i));
        if (unfound.length === 0) return;

        this.hints--;
        document.getElementById('hint-count').textContent = this.hints;
        SFX.play('reveal');

        this.clearVisualHints();

        const randIdx = unfound[Math.floor(Math.random() * unfound.length)];
        const pos = this.wordPositions[randIdx];
        if (!pos) return;

        this.hintActive = true;

        pos.positions.forEach((p, i) => {
            const cell = document.querySelector(`.letter-cell[data-row="${p.r}"][data-col="${p.c}"]`);
            if (cell) {
                cell.classList.add('hint-glow');
                setTimeout(() => cell.classList.remove('hint-glow'), 4000);
            }
        });

        const firstPos = pos.start;
        const dirText = this.getDirText(pos.dir);
        const firstCell = document.querySelector(`.letter-cell[data-row="${firstPos.r}"][data-col="${firstPos.c}"]`);
        if (firstCell) {
            const arrow = document.createElement('div');
            arrow.className = 'hint-arrow';
            arrow.textContent = dirText.icon;
            arrow.style.top = '-22px';
            arrow.style.left = '50%';
            arrow.style.transform = 'translateX(-50%)';
            firstCell.style.position = 'relative';
            firstCell.appendChild(arrow);
            setTimeout(() => arrow.remove(), 4000);
        }

        const word = this.words[randIdx];
        const targetEl = document.querySelector(`.target-word[data-word-i="${randIdx}"]`);
        if (targetEl) {
            const dirBadge = document.createElement('div');
            dirBadge.className = 'hint-dir-badge';
            dirBadge.innerHTML = `<span class="dir-icon">${dirText.icon}</span> ${dirText.label} - الحرف الأول: ${word[0]}`;
            targetEl.insertAdjacentElement('beforebegin', dirBadge);
            setTimeout(() => dirBadge.remove(), 4000);
        }

        setTimeout(() => { this.hintActive = false; }, 4000);
    }

    getDirText(dir) {
        const [dr, dc] = dir;
        if (dr === 0 && dc === 1) return { icon: '➡️', label: 'أفقي يمين' };
        if (dr === 0 && dc === -1) return { icon: '⬅️', label: 'أفقي يسار' };
        if (dr === 1 && dc === 0) return { icon: '⬇️', label: 'عمودي نزول' };
        if (dr === -1 && dc === 0) return { icon: '⬆️', label: 'عمودي صعود' };
        if (dr === 1 && dc === 1) return { icon: '↘️', label: 'قطري نزول يمين' };
        if (dr === -1 && dc === -1) return { icon: '↖️', label: 'قطري صعود يسار' };
        if (dr === 1 && dc === -1) return { icon: '↙️', label: 'قطري نزول يسار' };
        if (dr === -1 && dc === 1) return { icon: '↗️', label: 'قطري صعود يمين' };
        return { icon: '➡️', label: 'أفقي' };
    }

    clearVisualHints() {
        document.querySelectorAll('.hint-glow').forEach(el => el.classList.remove('hint-glow'));
        document.querySelectorAll('.hint-arrow').forEach(el => el.remove());
        document.querySelectorAll('.hint-dir-badge').forEach(el => el.remove());
    }

    shuffle() {
        const size = this.gridSize;
        const unfoundCells = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (!this.board[r][c].found) {
                    unfoundCells.push({ r, c });
                }
            }
        }

        const letters = unfoundCells.map(p => this.board[p.r][p.c].letter);
        for (let i = letters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [letters[i], letters[j]] = [letters[j], letters[i]];
        }

        unfoundCells.forEach((p, i) => {
            this.board[p.r][p.c].letter = letters[i];
        });

        this.selectedCells = [];
        this.selectedLetters = [];
        this.render();
        SFX.play('shuffle');
    }

    onComplete() {
        const stars = this.foundWords.length >= this.words.length ? 3 :
                      this.foundWords.length >= this.words.length * 0.7 ? 2 : 1;

        SFX.play('win');

        document.getElementById('complete-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        document.getElementById('complete-stage').textContent = 'أكملت المرحلة ' + this.stageId + ' بمستوى ' + this.levelConfig(this.level).name;

        const bonus = this.levelConfig(this.level).bonus;
        const reward = Math.round((10 + (this.stageId * 5)) * bonus);
        document.getElementById('complete-coins').textContent = '+' + reward;
        App.addCoins(reward);

        const stage = STAGES.find(s => s.id === this.stageId);
        const msg = stage ? stage.endMsg : ROMANTIC_MESSAGES[Math.floor(Math.random() * ROMANTIC_MESSAGES.length)];
        document.getElementById('complete-message').textContent = msg;

        App.completeStage(this.stageId, stars);

        App.showScreen('complete-screen');
        App.spawnConfetti();
    }
}

const game = new WordCrushGame();
