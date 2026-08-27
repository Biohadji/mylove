class QuizManager {
    constructor() {
        this.currentCategory = 'romantic';
        this.questions = [];
        this.currentQ = 0;
        this.score = 0;
        this.timer = null;
        this.timeLeft = 30;
    }

    init() {
        if (this._initialized) return;
        this._initialized = true;
        this.setupTabs();
        this.loadQuestions();
        document.getElementById('quiz-skip').addEventListener('click', () => this.nextQuestion());
        document.getElementById('quiz-reveal').addEventListener('click', () => this.revealAnswer());
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
        document.getElementById('quiz-number').textContent = `السؤال ${this.currentQ + 1} من ${this.questions.length}`;
        document.getElementById('quiz-question').textContent = q.q;
        document.getElementById('quiz-answer').style.display = 'none';
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

        clearInterval(this.timer);
        requestAnimationFrame(() => {
            bar.style.transition = 'width 30s linear';
            bar.style.width = '0%';
        });

        this.timer = setTimeout(() => {
            this.revealAnswer();
        }, 30000);
    }

    revealAnswer() {
        clearTimeout(this.timer);
        const q = this.questions[this.currentQ];
        document.getElementById('quiz-answer').style.display = 'block';
        document.getElementById('quiz-answer-text').textContent = q.hint;
        document.getElementById('quiz-timer-bar').style.transition = 'none';
        document.getElementById('quiz-timer-bar').style.width = '0%';
        SFX.play('reveal');
    }

    nextQuestion() {
        clearTimeout(this.timer);
        this.score += 10;
        this.updateScore();
        this.currentQ++;
        App.addCoins(2);
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
        document.getElementById('quiz-answer').style.display = 'none';
        SFX.play('win');

        document.querySelector('.quiz-actions').innerHTML = `
            <button class="quiz-action-btn" onclick="quiz.reset()"> إعادة اللعب 🔄</button>
        `;
    }

    reset() {
        this.currentQ = 0;
        this.score = 0;
        this.updateScore();
        document.querySelector('.quiz-actions').innerHTML = `
            <button class="quiz-action-btn" id="quiz-skip">تخطي ⏭️</button>
            <button class="quiz-action-btn" id="quiz-reveal">كشف الإجابة 👁️</button>
        `;
        document.getElementById('quiz-skip').addEventListener('click', () => this.nextQuestion());
        document.getElementById('quiz-reveal').addEventListener('click', () => this.revealAnswer());
        this.loadQuestions();
    }
}

const quiz = new QuizManager();
