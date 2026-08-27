/* ==================== نكت المتزوجين حسب البلدان ==================== */

const JokesManager = {
    _initialized: false,
    currentCountryId: null,
    index: 0,

    init() {
        if (!this._initialized) {
            this._initialized = true;
            this.bindTabs();
            document.getElementById('jokes-prev').addEventListener('click', () => this.prev());
            document.getElementById('jokes-next').addEventListener('click', () => this.next());
            document.getElementById('jokes-shuffle').addEventListener('click', () => this.shuffle());
        }
        if (!this.currentCountryId && JOKES_BY_COUNTRY.length) {
            this.selectCountry(JOKES_BY_COUNTRY[0].id);
        } else {
            this.render();
        }
    },

    bindTabs() {
        const container = document.getElementById('jokes-tabs');
        if (!container) return;
        const current = this.currentCountryId || (JOKES_BY_COUNTRY.length ? JOKES_BY_COUNTRY[0].id : null);
        container.innerHTML = JOKES_BY_COUNTRY.map(c => `
            <button class="jokes-tab ${c.id === current ? 'active' : ''}" data-country="${c.id}">
                <span class="jokes-tab-flag">${c.flag}</span>
                <span class="jokes-tab-name">${c.name}</span>
            </button>
        `).join('');
        container.querySelectorAll('.jokes-tab').forEach(btn => {
            btn.addEventListener('click', () => this.selectCountry(btn.dataset.country));
        });
    },

    selectCountry(id) {
        this.currentCountryId = id;
        this.index = 0;
        document.querySelectorAll('.jokes-tab').forEach(b => b.classList.toggle('active', b.dataset.country === id));
        this.render();
        SFX.play('click');
    },

    getCountry() {
        return JOKES_BY_COUNTRY.find(c => c.id === this.currentCountryId) || JOKES_BY_COUNTRY[0];
    },

    next() {
        const c = this.getCountry();
        if (!c) return;
        this.index = (this.index + 1) % c.jokes.length;
        this.render();
        SFX.play('pop');
    },

    prev() {
        const c = this.getCountry();
        if (!c) return;
        this.index = (this.index - 1 + c.jokes.length) % c.jokes.length;
        this.render();
        SFX.play('pop');
    },

    shuffle() {
        const c = this.getCountry();
        if (!c) return;
        this.index = Math.floor(Math.random() * c.jokes.length);
        this.render();
        SFX.play('pop');
    },

    render() {
        const c = this.getCountry();
        if (!c || !c.jokes.length) return;
        const titleEl = document.getElementById('jokes-country-title');
        const textEl = document.getElementById('jokes-text');
        const counterEl = document.getElementById('jokes-counter');
        if (titleEl) titleEl.textContent = `${c.flag} ${c.name}`;
        if (textEl) textEl.textContent = c.jokes[this.index];
        if (counterEl) counterEl.textContent = `${this.index + 1} / ${c.jokes.length}`;

        const card = document.getElementById('jokes-card');
        if (card) {
            card.style.animation = 'none';
            requestAnimationFrame(() => { card.style.animation = 'slideUp 0.4s ease'; });
        }
    }
};

const jokes = JokesManager;