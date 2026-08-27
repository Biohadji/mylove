class PuzzleManager {
    constructor() {
        this.currentTab = 'word';
        this.memoryCards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.currentClueIdx = 0;
        this.solvedClues = [];
    }

    init() {
        this.setupTabs();
        this.initCrossword();
        this.initMemory();
    }

    setupTabs() {
        document.querySelectorAll('.puzzle-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.puzzle-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentTab = tab.dataset.tab;
                document.querySelectorAll('.puzzle-type').forEach(p => p.classList.remove('active'));
                document.getElementById(this.currentTab === 'word' ? 'crossword-puzzle' : 'memory-puzzle').classList.add('active');
            });
        });
    }

    initCrossword() {
        const puzzle = CROSSWORD_DATA[Math.floor(Math.random() * CROSSWORD_DATA.length)];
        this.solvedClues = [];
        this.currentClueIdx = 0;

        const cluesEl = document.getElementById('crossword-clues');
        cluesEl.innerHTML = '';
        puzzle.clues.forEach((clue, i) => {
            const el = document.createElement('div');
            el.className = 'clue-item';
            el.innerHTML = `<span class="clue-number">${clue.n}</span><span class="clue-text">${clue.text}</span>`;
            el.addEventListener('click', () => this.selectClue(i, clue));
            cluesEl.appendChild(el);
        });

        this.renderCrosswordGrid(puzzle);
    }

    renderCrosswordGrid(puzzle) {
        const gridEl = document.getElementById('crossword-grid');
        let maxR = 0, maxC = 0;
        puzzle.clues.forEach(clue => {
            if (clue.dir === 'across') {
                maxR = Math.max(maxR, clue.row);
                maxC = Math.max(maxC, clue.col + clue.answer.length);
            } else {
                maxR = Math.max(maxR, clue.row + clue.answer.length);
                maxC = Math.max(maxC, clue.col);
            }
        });

        const rows = maxR + 1;
        const cols = maxC + 1;
        gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        gridEl.innerHTML = '';

        const grid = [];
        for (let r = 0; r < rows; r++) {
            grid[r] = [];
            for (let c = 0; c < cols; c++) {
                grid[r][c] = null;
            }
        }

        puzzle.clues.forEach((clue, ci) => {
            for (let i = 0; i < clue.answer.length; i++) {
                const r = clue.dir === 'across' ? clue.row : clue.row + i;
                const c = clue.dir === 'across' ? clue.col + i : clue.col;
                if (!grid[r]) grid[r] = [];
                grid[r][c] = { letter: clue.answer[i], clueIdx: ci, revealed: false };
            }
        });

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'crossword-cell';
                if (!grid[r][c]) {
                    cell.classList.add('empty');
                } else {
                    cell.dataset.row = r;
                    cell.dataset.col = c;
                    cell.dataset.answer = grid[r][c].letter;
                    cell.dataset.clueIdx = grid[r][c].clueIdx;
                    if (this.solvedClues.includes(grid[r][c].clueIdx)) {
                        cell.textContent = grid[r][c].letter;
                        cell.classList.add('filled');
                    }
                    cell.addEventListener('click', () => {
                        if (!cell.classList.contains('filled')) {
                            this.selectClue(grid[r][c].clueIdx, puzzle.clues[grid[r][c].clueIdx]);
                        }
                    });
                }
                gridEl.appendChild(cell);
            }
        }

        this.currentPuzzle = puzzle;
    }

    selectClue(idx, clue) {
        this.currentClueIdx = idx;
        document.querySelectorAll('.clue-item').forEach((el, i) => {
            el.classList.toggle('active', i === idx);
        });

        if (!this.solvedClues.includes(idx)) {
            const inputArea = document.getElementById('crossword-input-area');
            inputArea.style.display = 'block';
            document.getElementById('crossword-clue-text').textContent = clue.text;
            document.getElementById('crossword-input').value = '';
            document.getElementById('crossword-input').focus();

            document.querySelectorAll('.crossword-cell.active').forEach(c => c.classList.remove('active'));

            if (clue.dir === 'across') {
                for (let i = 0; i < clue.answer.length; i++) {
                    const cell = document.querySelector(`.crossword-cell[data-row="${clue.row}"][data-col="${clue.col + i}"]`);
                    if (cell) cell.classList.add('active');
                }
            } else {
                for (let i = 0; i < clue.answer.length; i++) {
                    const cell = document.querySelector(`.crossword-cell[data-row="${clue.row + i}"][data-col="${clue.col}"]`);
                    if (cell) cell.classList.add('active');
                }
            }
        }
    }

    submitCrossword() {
        const input = document.getElementById('crossword-input').value.trim();
        const clue = this.currentPuzzle.clues[this.currentClueIdx];

        if (input === clue.answer || input.split('').reverse().join('') === clue.answer) {
            this.solvedClues.push(this.currentClueIdx);

            if (clue.dir === 'across') {
                for (let i = 0; i < clue.answer.length; i++) {
                    const cell = document.querySelector(`.crossword-cell[data-row="${clue.row}"][data-col="${clue.col + i}"]`);
                    if (cell) { cell.textContent = clue.answer[i]; cell.classList.add('filled'); cell.classList.remove('active'); }
                }
            } else {
                for (let i = 0; i < clue.answer.length; i++) {
                    const cell = document.querySelector(`.crossword-cell[data-row="${clue.row + i}"][data-col="${clue.col}"]`);
                    if (cell) { cell.textContent = clue.answer[i]; cell.classList.add('filled'); cell.classList.remove('active'); }
                }
            }

            document.querySelectorAll('.clue-item')[this.currentClueIdx].classList.add('solved');
            document.getElementById('crossword-input-area').style.display = 'none';
            App.addCoins(5);

            if (this.solvedClues.length === this.currentPuzzle.clues.length) {
                App.addCoins(15);
                alert('أحسنت! لقد حلت اللغز كاملاً 🎉 +15 جوهرة');
            }
        } else {
            document.getElementById('crossword-input').style.borderColor = '#f44336';
            setTimeout(() => {
                document.getElementById('crossword-input').style.borderColor = 'rgba(255,255,255,0.3)';
            }, 1000);
        }
    }

    initMemory() {
        this.memoryCards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;

        const pairs = MEMORY_PAIRS.slice(0, 6);
        const cards = [];
        pairs.forEach(pair => {
            cards.push({ id: pair[0], emoji: pair[0], label: pair[1] });
            cards.push({ id: pair[1], emoji: pair[0], label: pair[1] });
        });

        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }

        this.memoryCards = cards;
        this.renderMemory();
    }

    renderMemory() {
        const grid = document.getElementById('memory-grid');
        grid.innerHTML = '';

        this.memoryCards.forEach((card, idx) => {
            const el = document.createElement('div');
            el.className = 'memory-card';
            el.innerHTML = `
                <div class="memory-card-back">❓</div>
                <div class="memory-card-front">${card.emoji}<br><small>${card.label}</small></div>
            `;
            el.addEventListener('click', () => this.flipCard(idx, el));
            grid.appendChild(el);
        });
    }

    flipCard(idx, el) {
        if (this.flippedCards.length >= 2) return;
        if (el.classList.contains('flipped') || el.classList.contains('matched')) return;

        el.classList.add('flipped');
        this.flippedCards.push({ idx, el });

        if (this.flippedCards.length === 2) {
            const [a, b] = this.flippedCards;
            const cardA = this.memoryCards[a.idx];
            const cardB = this.memoryCards[b.idx];

            if (cardA.id === cardB.id && a.idx !== b.idx) {
                setTimeout(() => {
                    a.el.classList.add('matched');
                    b.el.classList.add('matched');
                    this.matchedPairs++;
                    this.flippedCards = [];
                    App.addCoins(3);

                    if (this.matchedPairs === MEMORY_PAIRS.length) {
                        App.addCoins(10);
                        setTimeout(() => alert('ممتاز! لقد أكملت لعبة الذاكرة 🧠 +10 جواهر'), 500);
                    }
                }, 500);
            } else {
                setTimeout(() => {
                    a.el.classList.remove('flipped');
                    b.el.classList.remove('flipped');
                    this.flippedCards = [];
                }, 1000);
            }
        }
    }
}

const puzzle = new PuzzleManager();
