class QuizManager {
    constructor() {
        this.currentCategory = 'romantic';
        this.questions = [];
        this.currentQ = 0;
        this.score = 0;
        this.timer = null;
        this.timeLeft = 30;
        this.answered = false;
    }

    init() {
        if (this._initialized) return;
        this._initialized = true;
        this.setupTabs();
        this.loadQuestions();
        document.getElementById('quiz-next').addEventListener('click', () => this.nextQuestion());
    }

    setupTabs() {
        document.querySelectorAll('.quiz-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.quiz-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentCategory = tab.dataset.category;
                this.currentQ = 0;
                this.score = 0;
                this.answered = false;
                this.updateScore();
                this.loadQuestions();
            });
        });
    }

    loadQuestions() {
        this.questions = [...QUIZ_DATA[this.currentCategory]];
        for (let i = this.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
        }
        this.questions = this.questions.slice(0, 10);
        this.showQuestion();
    }

    showQuestion() {
        if (this.currentQ >= this.questions.length) {
            this.showFinalScore();
            return;
        }

        const q = this.questions[this.currentQ];
        this.answered = false;
        document.getElementById('quiz-number').textContent = `السؤال ${this.currentQ + 1} من ${this.questions.length}`;
        document.getElementById('quiz-question').textContent = q.q;
        document.getElementById('quiz-answer').style.display = 'none';

        const opts = document.getElementById('quiz-options');
        opts.innerHTML = q.options.map((opt, i) => `
            <button class="quiz-option" onclick="quiz.selectAnswer(${i})">
                <span class="quiz-option-letter">${['أ','ب','ج','د'][i]}</span>
                <span class="quiz-option-text">${opt}</span>
            </button>
        `).join('');

        document.getElementById('quiz-card').style.animation = 'none';
        requestAnimationFrame(() => {
            document.getElementById('quiz-card').style.animation = 'slideUp 0.4s ease';
        });

        this.startTimer();
    }

    startTimer() {
        this.timeLeft = 30;
        const bar = document.getElementById('quiz-timer-bar');
        bar.style.width = '100%';
        bar.style.transition = 'none';

        clearTimeout(this.timer);
        requestAnimationFrame(() => {
            bar.style.transition = 'width 30s linear';
            bar.style.width = '0%';
        });

        this.timer = setTimeout(() => {
            if (!this.answered) this.selectAnswer(-1);
        }, 30000);
    }

    selectAnswer(idx) {
        if (this.answered) return;
        this.answered = true;
        clearTimeout(this.timer);
        document.getElementById('quiz-timer-bar').style.transition = 'none';
        document.getElementById('quiz-timer-bar').style.width = '0%';

        const q = this.questions[this.currentQ];
        const optionBtns = document.querySelectorAll('.quiz-option');
        const correct = idx === q.answer;
        const answeredIdx = idx === -1 ? q.answer : idx;

        optionBtns.forEach((btn, i) => {
            btn.classList.add('disabled');
            btn.disabled = true;
            if (i === q.answer) btn.classList.add('correct');
            else if (i === answeredIdx) btn.classList.add('wrong');
        });

        if (correct) {
            this.score += 10;
            this.updateScore();
            App.addCoins(2);
            SFX.play('success');
        } else {
            SFX.play('error');
        }

        document.getElementById('quiz-answer').style.display = 'block';
        document.getElementById('quiz-answer-text').textContent = q.hint;
        const modelEl = document.getElementById('quiz-answer-model');
        if (modelEl) modelEl.textContent = '✓ الإجابة النموذجية: ' + q.options[q.answer];
        if (correct) document.querySelector('.quiz-feedback-label').textContent = 'أحسنتما! إجابة صحيحة 🎉';
        else if (idx === -1) document.querySelector('.quiz-feedback-label').textContent = 'انتهى الوقت! هذه الإجابة النموذجية ⏰';
        else document.querySelector('.quiz-feedback-label').textContent = 'إجابة نموذجية بديلة 💡';
    }

    nextQuestion() {
        clearTimeout(this.timer);
        this.currentQ++;
        this.showQuestion();
    }

    updateScore() {
        document.getElementById('score-value').textContent = this.score;
    }

    showFinalScore() {
        const total = this.questions.length * 10;
        const pct = Math.round((this.score / total) * 100);
        let msg = '';
        if (pct >= 80) msg = 'ممتاز! أنتما زوجان مترابطان جداً 💕';
        else if (pct >= 50) msg = 'جيد! تعرفان بعضكما جيداً 😊';
        else msg = 'حاولوا التعرف على بعض أكثر! الحب يحتاج فضول 💖';

        document.getElementById('quiz-question').textContent = `النتيجة: ${this.score} من ${total}\n${msg}`;
        document.getElementById('quiz-number').textContent = 'انتهت الأسئلة!';
        document.getElementById('quiz-options').innerHTML = `
            <button class="quiz-action-btn" onclick="quiz.reset()"> إعادة اللعب 🔄</button>
        `;
        document.getElementById('quiz-answer').style.display = 'none';
        SFX.play('win');
    }

    reset() {
        this.currentQ = 0;
        this.score = 0;
        this.answered = false;
        this.updateScore();
        this.loadQuestions();
    }
}

const quiz = new QuizManager();