class RomanticWheel {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isSpinning = false;
        this.currentRotation = 0;
        this.prizes = WHEEL_PRIZES;
        this.currentWheel = null;
        this.jokeIdx = 0;
    }

    init() {
        if (this._initialized) return;
        this._initialized = true;
        this.bindSelector();
        this.bindPlayBack();
        this.bindJoke();
    }

    bindSelector() {
        document.querySelectorAll('.wheel-card').forEach(card => {
            card.addEventListener('click', () => {
                const wheelId = card.dataset.wheel;
                this.selectWheel(wheelId);
            });
        });
    }

    bindPlayBack() {
        document.getElementById('wheel-play-back').addEventListener('click', () => {
            document.getElementById('wheel-play').style.display = 'none';
            document.getElementById('wheel-selector').style.display = 'block';
            this.currentWheel = null;
        });
    }

    bindJoke() {
        document.getElementById('wheel-joke-reveal').addEventListener('click', () => this.revealWheelJoke());
        document.getElementById('wheel-joke-next').addEventListener('click', () => this.showWheelJoke());
        this.showWheelJoke();
    }

    showWheelJoke() {
        if (!ROMANTIC_JOKES.length) return;
        this.jokeIdx = Math.floor(Math.random() * ROMANTIC_JOKES.length);
        const joke = ROMANTIC_JOKES[this.jokeIdx];
        document.getElementById('wheel-joke-setup').textContent = joke.setup;
        document.getElementById('wheel-joke-punch').textContent = joke.punch;
        document.getElementById('wheel-joke-punch').style.display = 'none';
        document.getElementById('wheel-joke-reveal').style.display = 'block';
        SFX.play('pop');
    }

    revealWheelJoke() {
        if (!ROMANTIC_JOKES[this.jokeIdx]) return;
        document.getElementById('wheel-joke-punch').style.display = 'block';
        document.getElementById('wheel-joke-reveal').style.display = 'none';
        SFX.play('success');
    }

    selectWheel(wheelId) {
        const wheelData = WHEELS_DATA[wheelId];
        if (!wheelData) return;

        this.currentWheel = wheelId;
        this.prizes = wheelData.prizes;
        this.currentRotation = 0;
        this.isSpinning = false;

        document.getElementById('wheel-selector').style.display = 'none';
        document.getElementById('wheel-play').style.display = 'flex';
        document.getElementById('wheel-play-title').textContent = wheelData.icon + ' ' + wheelData.name;
        SFX.play('click');

        this.canvas = document.getElementById('wheel-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        const cx = 150, cy = 150, r = 140;
        const n = this.prizes.length;
        const sliceAngle = (2 * Math.PI) / n;

        ctx.clearRect(0, 0, 300, 300);

        for (let i = 0; i < n; i++) {
            const startAngle = i * sliceAngle + this.currentRotation;
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = this.prizes[i].color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px serif';
            ctx.fillText(this.prizes[i].icon, r * 0.55, 5);
            ctx.font = 'bold 10px Cairo, sans-serif';
            ctx.fillText(this.prizes[i].text, r * 0.75, 5);
            ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffd700';
        ctx.fill();
        ctx.strokeStyle = '#ffb300';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
    }

    spin() {
        if (this.isSpinning) return;
        this.isSpinning = true;
        document.getElementById('spin-btn').disabled = true;
        SFX.play('spin');

        const extraSpins = 5 + Math.floor(Math.random() * 5);
        const randomAngle = Math.random() * 2 * Math.PI;
        const totalRotation = extraSpins * 2 * Math.PI + randomAngle;
        const duration = 4000;
        const startTime = performance.now();
        const startRotation = this.currentRotation;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            this.currentRotation = startRotation + totalRotation * eased;
            this.draw();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.onSpinComplete(randomAngle);
            }
        };

        requestAnimationFrame(animate);
    }

    onSpinComplete(finalAngle) {
        const n = this.prizes.length;
        const sliceAngle = (2 * Math.PI) / n;
        const normalizedAngle = (2 * Math.PI - (finalAngle % (2 * Math.PI))) % (2 * Math.PI);
        const prizeIndex = Math.floor(normalizedAngle / sliceAngle) % n;
        const prize = this.prizes[prizeIndex];

        this.isSpinning = false;
        document.getElementById('spin-btn').disabled = false;
        SFX.play('spinEnd');

        if (prize.type === 'bonus' && prize.coins) {
            App.addCoins(prize.coins);
        }

        document.getElementById('result-icon').textContent = prize.icon;
        document.getElementById('result-title').textContent = prize.text;
        document.getElementById('result-text').textContent = prize.desc;
        document.getElementById('wheel-result').style.display = 'flex';

        document.getElementById('wheel-coins').textContent = App.getCoins();
    }
}

const wheel = new RomanticWheel();
