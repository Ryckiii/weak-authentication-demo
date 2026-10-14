import { $, $$, escapeHTML as esc, Stepper, initTabs, lockDrawing } from './components.js?v=20261014-r3';
import { attacks, attackResult, defenses, defenseFrame } from './scenarios.js?v=20261014-r3';

// Default-credential mini-demo.
const defaultFeedback = $('#default-feedback');
function defaultMessage(kind, mark, message) {
  defaultFeedback.className = `lab-feedback ${kind}`;
  $('.feedback-symbol', defaultFeedback).textContent = mark;
  $('p', defaultFeedback).textContent = message;
}
function resetDefault() {
  $('#change-defaults').checked = false;
  defaultMessage('', '?', 'Try admin / admin.');
}
$('#default-login').addEventListener('click', () => {
  if ($('#change-defaults').checked) defaultMessage('bad', '×', 'No match. The default password was changed.');
  else defaultMessage('good', '✓', 'Logged in. Anyone who knows admin / admin can get in.');
});
$('#change-defaults').addEventListener('change', event => defaultMessage('', '↺', event.target.checked ? 'Password changed. Try admin / admin again.' : 'Try admin / admin.'));
$('#default-reset').addEventListener('click', resetDefault);

// Attack patterns: data determines both the visual state and verdict.
let attackMode = 'brute';
function renderAttack(index) {
  const s = attacks[attackMode], completed = s.attempts.slice(0,index), current = completed.at(-1);
  $('#candidate-label').textContent = attackMode === 'stuffing' ? 'Stolen from Website A' : attackMode === 'dictionary' ? 'Common + personal guesses' : 'Password attempts';
  $('#account-label').textContent = attackMode === 'stuffing' ? 'Try the same pair' : attackMode === 'spraying' ? 'Accounts' : 'Account';
  $('#attack-panel').setAttribute('aria-labelledby', `attack-tab-${attackMode}`);
  $('#candidate-list').innerHTML = attackMode === 'stuffing' ? `<div class="stolen-pair ${index ? 'in-use' : ''}"><span class="stolen-owner">Attacker has:</span><div><span>Username</span><code>${esc(s.stolen.username)}</code></div><div><span>Password</span><code>${esc(s.stolen.password)}</code></div></div>` : s.candidates.map((candidate,i) => {
    const active = current?.candidate === i;
    const done = completed.some(a => a.candidate === i) && !active;
    return `<div class="candidate-token ${active?'current':done?'done':''}"><span class="token-num">${String(i+1).padStart(2,'0')}</span><span class="token-text">${esc(candidate)}</span><span class="token-icon" aria-hidden="true">${active?'→':done?'·':''}</span></div>`;
  }).join('');
  $('#account-list').innerHTML = s.accounts.map((account,i) => {
    const relevant = completed.filter(a => a.account === i), last = relevant.at(-1);
    const match = relevant.some(a => attackResult(s,a));
    const targeted = current?.account === i;
    let status = 'READY', cls = '';
    if (match) { status = '✓ LOGGED IN'; cls = 'matched'; }
    else if(last) { status = '× NO MATCH'; cls = 'rejected'; }
    return `<div class="account-card ${s.accounts.length===1?'single':''} ${cls} ${targeted?'targeted':''}"><span class="avatar" aria-hidden="true">${esc(account.letter || account.name[0])}</span><div class="account-info"><strong>${esc(account.name)}</strong>${s.accounts.length===1?`<span class="correct-password"><span>Correct password</span><code>${esc(account.secret)}</code></span>`:attackMode==='stuffing'?`<small>${esc(account.username)}</small>`:''}</div><span class="account-state">${status}</span></div>`;
  }).join('');
  const stage = $('.attack-stage');
  stage.classList.toggle('stuffing-stage', attackMode === 'stuffing');
  stage.dataset.activeTarget = current ? String(current.account) : '';
  requestAnimationFrame(drawAttackLinks);
  stage.classList.remove('pulse');
  if (index) { void stage.offsetWidth; stage.classList.add('pulse'); }
}
// Connect the unchanged stolen pair to each website. Only the current request is highlighted.
function drawAttackLinks() {
  const stage = $('.attack-stage');
  let wires = $('.stuffing-wires', stage);
  if (attackMode !== 'stuffing') { wires?.remove(); return; }
  if (!wires) {
    wires = document.createElementNS('http://www.w3.org/2000/svg','svg');
    wires.setAttribute('class','stuffing-wires'); wires.setAttribute('aria-hidden','true');
    stage.prepend(wires);
  }
  const origin = $('.stolen-pair').getBoundingClientRect(), bounds = stage.getBoundingClientRect();
  wires.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
  const x1 = origin.right-bounds.left, y1 = origin.top+origin.height/2-bounds.top;
  wires.innerHTML = $$('.account-card',stage).map((card,i)=>{
    const r=card.getBoundingClientRect(), x2=r.left-bounds.left, y2=r.top+r.height/2-bounds.top, mid=(x1+x2)/2;
    const active=stage.dataset.activeTarget===String(i);
    const kind=card.classList.contains('matched')?'matched':card.classList.contains('rejected')?'rejected':'';
    return `<path class="site-wire ${active?'active':''} ${kind}" d="M${x1} ${y1} H${mid-5} Q${mid} ${y1} ${mid} ${y1+(y2>y1?5:-5)} V${y2+(y2>y1?-5:5)} Q${mid} ${y2} ${mid+5} ${y2} H${x2}"/><circle class="site-end ${active?'active':''} ${kind}" cx="${x2-4}" cy="${y2}" r="3"/>`;
  }).join('');
}
if ('ResizeObserver' in window) new ResizeObserver(drawAttackLinks).observe($('.attack-stage'));
window.addEventListener('resize',drawAttackLinks);
const attackStepper = new Stepper({prefix:'attack',count:attacks.brute.attempts.length+1,render:renderAttack,delay:1500});
const selectAttack = initTabs('[data-attack]', tab => { attackMode = tab.dataset.attack; attackStepper.reset(attacks[attackMode].attempts.length+1); });
attackStepper.update();

// Defense comparisons are paired snapshots of the same input under two policies.
let defenseMode = 'rate', legitimate = false;
$('#before-visual').innerHTML = lockDrawing;
$('#after-visual').innerHTML = lockDrawing;
function renderDefense(index) {
  const s = defenses[defenseMode], frame = defenseFrame(defenseMode,index,legitimate);
  $('#defense-name').textContent = s.title;
  $('#defense-panel').setAttribute('aria-labelledby',`defense-tab-${defenseMode}`);
  $('#before-title').textContent = s.before; $('#after-title').textContent = s.after;
  $('#defense-evidence-label').textContent = defenseMode === 'rate' ? 'Correct password' : defenseMode === 'unique' ? 'Leaked login · Site A' : '';
  $('#defense-input').textContent = defenseMode === 'rate' ? '004' : defenseMode === 'unique' ? 'maya / cedar!42' : legitimate ? 'The owner has both factors.' : 'The attacker has the correct password.';
  for (const [side,key] of [['before','left'],['after','right']]) {
    const value = frame[key], status = $(`#${side}-status`);
    status.className = `outcome ${value.kind}`;
    status.textContent = value.status;
    let credential = '', event = '';
    if (defenseMode === 'rate') {
      const guesses = ['—','000','001','002','003','004','—','004'];
      credential = index === 6 ? 'Wait ends' : `Try: ${guesses[index]}`;
      if (side === 'after' && index >= 3 && index <= 5) event = '3 failed tries → wait';
      else if (index === 7) event = side === 'after' ? 'Slower, not stopped' : 'Already logged in';
    } else if (defenseMode === 'unique') {
      credential = side === 'before' ? 'maya / cedar!42' : 'maya / ocean!73';
      event = index === 1 ? 'Site A password leaked' : index >= 2 ? 'Try: maya / cedar!42' : 'Stored login · Site B';
    } else {
      credential = side === 'before' ? 'Password' : 'Password + device code';
      if (legitimate) event = 'Both factors provided';
      else if (index >= 1) event = side === 'after' ? 'Password ✓ · device code ×' : 'Password ✓';
    }
    $(`#${side}-credential`).textContent = credential;
    $(`#${side}-event`).textContent = event;
    $(`#${side}-visual`).dataset.state = value.kind;
  }
  $('#mfa-user-controls').hidden = defenseMode !== 'mfa';
  $('#mfa-legitimate').textContent = legitimate ? 'Back to the attacker →' : 'Try with both factors →';
}
const defenseStepper = new Stepper({prefix:'defense',count:defenses.rate.frames.length,render:renderDefense,onMove:()=>{ legitimate=false; },delay:2000});
const selectDefense = initTabs('[data-defense]', tab => { defenseMode = tab.dataset.defense; defenseStepper.reset(defenses[defenseMode].frames.length); });
defenseStepper.update();
$('#mfa-legitimate').addEventListener('click', () => {
  defenseStepper.stop(); legitimate = !legitimate; renderDefense(defenseStepper.index);
  // Hide step controls only while the alternate owner outcome is visible.
  syncOwnerControls();
});
function syncOwnerControls() {
  $('#defense-next').disabled = legitimate || defenseStepper.index >= defenseStepper.count - 1;
  $('#defense-prev').disabled = legitimate || defenseStepper.index === 0;
  $('#defense-play').disabled = legitimate;
  $('#defense-step').textContent = legitimate ? 'OWNER PATH' : `STEP ${defenseStepper.index} / ${defenseStepper.count - 1}`;
}
// Reset and tab changes must also restore controls disabled by the alternate path.
const originalDefenseUpdate = defenseStepper.update.bind(defenseStepper);
defenseStepper.update = () => { originalDefenseUpdate(); syncOwnerControls(); };

// Only run playback while the experiment is visible.
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) (entry.target.classList.contains('attack-lab')?attackStepper:defenseStepper).stop();
  }), {threshold:0});
  io.observe($('.attack-lab')); io.observe($('.defense-lab'));
}

// One retryable classroom quiz. No user information or scores are stored.
const quizFeedback = $('#quiz-feedback');
let quizDone = false;
const quizExplanations = {
  brute:'Look at how one password is tried on many accounts.',
  dictionary:'The key here is one password across many accounts.',
  stuffing:'Stuffing uses stolen login pairs. This is one common password.'
};
$$('[data-answer]').forEach(button => button.addEventListener('click', () => {
  if (quizDone || button.disabled) return;
  if (button.dataset.answer === 'spraying') {
    quizDone = true; button.classList.add('correct'); $('.answer-mark',button).textContent='✓';
    quizFeedback.className='quiz-feedback good'; quizFeedback.textContent='Exactly. Password spraying = one common password, many accounts.';
    $$('[data-answer]').forEach(b=>{ b.disabled=true; });
  } else {
    button.classList.add('wrong'); $('.answer-mark',button).textContent='×'; button.disabled=true;
    quizFeedback.className='quiz-feedback bad'; quizFeedback.textContent=quizExplanations[button.dataset.answer]+' Try another answer.';
  }
}));
function resetQuiz() { quizDone=false; $$('[data-answer]').forEach(b=>{b.disabled=false;b.classList.remove('wrong','correct');$('.answer-mark',b).textContent='';});quizFeedback.className='quiz-feedback';quizFeedback.textContent='Choose an answer.'; }
$('#quiz-reset').addEventListener('click',resetQuiz);

// Autolooping hero animation. Pause when hidden/offscreen and honor reduced motion.
const hero = $('.hero-art');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let heroVisible = true, heroPaused = false;
const heroToggle = $('#hero-replay');
function syncHeroAnimation() {
  hero.classList.toggle('is-running', !motionPreference.matches);
  hero.classList.toggle('motion-paused', heroPaused || !heroVisible || document.hidden);
  heroToggle.textContent = heroPaused ? '▶' : 'Ⅱ';
  heroToggle.setAttribute('aria-label', heroPaused ? 'Play login animation' : 'Pause login animation');
  heroToggle.title = heroPaused ? 'Play login animation' : 'Pause login animation';
  heroToggle.setAttribute('aria-pressed', String(heroPaused));
  heroToggle.hidden = motionPreference.matches;
}
heroToggle.addEventListener('click', () => { heroPaused = !heroPaused; syncHeroAnimation(); });
motionPreference.addEventListener('change', syncHeroAnimation);
document.addEventListener('visibilitychange', syncHeroAnimation);
if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
  heroVisible = entries[0].isIntersecting; syncHeroAnimation();
}).observe(hero);
syncHeroAnimation();

let toastTimer;
$('#reset-all').addEventListener('click',()=>{
  resetDefault();selectAttack(0);selectDefense(0);resetQuiz();
  const toast=$('#toast');toast.textContent='Demos reset.';toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),2800);
});
const chapterLinks=$$('.chapter-inner>a'), sections=chapterLinks.map(a=>$(a.getAttribute('href')));
let scrollQueued=false;
function updateReading(){
  const line=window.scrollY+150;let current=0;
  sections.forEach((section,i)=>{if(section.offsetTop<=line)current=i;});
  chapterLinks.forEach((link,i)=>{link.classList.toggle('active',i===current);if(i===current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  const top=$('.hero').offsetTop+$('.hero').offsetHeight, max=document.documentElement.scrollHeight-window.innerHeight-top;
  $('#reading-progress').style.width=`${Math.max(0,Math.min(100,(window.scrollY-top)/Math.max(1,max)*100))}%`;
  scrollQueued=false;
}
window.addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateReading);}},{passive:true});
window.addEventListener('resize',updateReading);updateReading();
