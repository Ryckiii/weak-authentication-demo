export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
export const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Single timer per simulation. Reset, mode switches and backgrounding stop playback.
export class Stepper {
  constructor({prefix, count, render, onMove = () => {}, delay = 1600}) {
    this.prefix = prefix; this.count = count; this.render = render; this.onMove = onMove;
    this.delay = delay; this.index = 0; this.timer = null;
    $(`#${prefix}-next`).addEventListener('click', () => this.move(1));
    $(`#${prefix}-prev`).addEventListener('click', () => this.move(-1));
    $(`#${prefix}-reset`).addEventListener('click', () => this.reset());
    $(`#${prefix}-play`).addEventListener('click', () => this.timer ? this.stop() : this.play());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.stop(); });
  }
  update() {
    this.render(this.index);
    $(`#${this.prefix}-prev`).disabled = this.index === 0;
    $(`#${this.prefix}-next`).disabled = this.index >= this.count - 1;
    $(`#${this.prefix}-step`).textContent = `STEP ${this.index} / ${this.count - 1}`;
    this.syncPlay();
  }
  syncPlay() {
    const button = $(`#${this.prefix}-play`);
    button.textContent = this.timer ? 'Ⅱ Pause' : this.index === this.count - 1 ? '↺ Replay' : '▶ Play';
    button.setAttribute('aria-label', this.timer ? `Pause ${this.prefix} simulation` : `Play ${this.prefix} simulation`);
    button.setAttribute('aria-pressed', String(!!this.timer));
  }
  move(direction, auto = false) {
    if (!auto) this.stop();
    this.onMove();
    this.index = Math.max(0, Math.min(this.index + direction, this.count - 1));
    this.update();
    if (this.index === this.count - 1) this.stop();
  }
  reset(count = this.count) { this.stop(); this.onMove(); this.count = count; this.index = 0; this.update(); }
  play() {
    this.stop();
    if (this.index === this.count - 1) { this.onMove(); this.index = 0; this.update(); }
    this.timer = setInterval(() => this.move(1, true), this.delay); this.syncPlay();
  }
  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; this.syncPlay(); }
}

export function initTabs(selector, callback) {
  const tabs = $$(selector);
  const select = tab => {
    tabs.forEach(t => { const active = t === tab; t.setAttribute('aria-selected', String(active)); t.tabIndex = active ? 0 : -1; });
    callback(tab);
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault(); select(tabs[next]); tabs[next].focus();
    });
  });
  return index => select(tabs[index]);
}

export const lockDrawing = `<svg viewBox="0 0 140 90" aria-hidden="true"><path class="connection" d="M0 45h34m72 0h34"/><circle cx="9" cy="45" r="3" class="indicator"/><path d="m131 40 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1"/><rect class="gate" x="40" y="6" width="60" height="78" rx="30"/><path class="gate-arc" d="M60 43V34a10 10 0 0 1 20 0v9"/><rect class="gate-body" x="55" y="42" width="30" height="25" rx="5"/><circle class="indicator" cx="70" cy="52" r="2"/><path d="M70 54v5" stroke="currentColor" stroke-width="1.3"/></svg>`;
