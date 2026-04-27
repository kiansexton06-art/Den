(() => {
'use strict';

// ─── THEME ───────────────────────────────────────────────
const body = document.body;

function setTheme(t) {
    body.className = t;
    localStorage.setItem('den-theme', t);
    // update style option active state
    document.querySelectorAll('.style-opt').forEach(b =>
        b.classList.toggle('active', b.dataset.t === t)
    );
}
setTheme(localStorage.getItem('den-theme') || 'light');

// Style options inside settings modal
document.querySelectorAll('.style-opt').forEach(b =>
    b.addEventListener('click', () => setTheme(b.dataset.t))
);

// ─── SIDEBAR ──────────────────────────────────────────────
const sidebar  = document.getElementById('sidebar');
const overlay  = document.getElementById('overlay');
const burgerBtn= document.getElementById('burgerBtn');
const closeBtn = document.getElementById('closeBtn');

function openSB()  { sidebar.classList.add('open'); overlay.classList.add('show'); }
function closeSB() { sidebar.classList.remove('open'); overlay.classList.remove('show'); }

burgerBtn.addEventListener('click', openSB);
closeBtn.addEventListener('click', closeSB);
overlay.addEventListener('click', closeSB);

// ─── TABS ─────────────────────────────────────────────────
const sbLinks  = document.querySelectorAll('.sb-link');
const pages    = document.querySelectorAll('.page');
const pageTitle= document.getElementById('pageTitle');
const labels   = { about:'About Us', report:'Report Work', calendar:'Calendar' };

function showPage(id) {
    sbLinks.forEach(l => l.classList.toggle('active', l.dataset.tab === id));
    pages.forEach(p => p.classList.toggle('active', p.id === `page-${id}`));
    pageTitle.textContent = labels[id] || '';
    if (window.innerWidth < 901) closeSB();
}
sbLinks.forEach(l => l.addEventListener('click', () => showPage(l.dataset.tab)));

// ─── WORK FEED ────────────────────────────────────────────
const workForm = document.getElementById('workForm');
const nameInp  = document.getElementById('studentName');
const workInp  = document.getElementById('studentWork');
const workFeed = document.getElementById('workFeed');
const workMsg  = document.getElementById('workMsg');

let works = JSON.parse(localStorage.getItem('den-works') || '[]');

function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function renderFeed() {
    if (!works.length) {
        workFeed.innerHTML = '<div class="empty">📭 Nothing shared yet — be the first!</div>';
        return;
    }
    workFeed.innerHTML = works.map(w => `
        <div class="work-item">
            <div class="wi-top">
                <span class="wi-name">👤 ${esc(w.name)}</span>
                <span class="wi-date">${w.date}</span>
            </div>
            <div class="wi-text">${esc(w.content)}</div>
        </div>`).join('');
}

workForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = nameInp.value.trim();
    const content = workInp.value.trim();
    if (!name || !content) return;

    works.unshift({
        id: Date.now(), name, content,
        date: new Date().toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
    });
    if (works.length > 50) works.pop();
    localStorage.setItem('den-works', JSON.stringify(works));
    renderFeed();
    workForm.reset();

    workMsg.textContent = '✅ Work posted!';
    workMsg.className = 'msg ok';
    workMsg.classList.remove('hidden');
    setTimeout(() => workMsg.classList.add('hidden'), 3000);
});

renderFeed();

// ─── SETTINGS MODAL ───────────────────────────────────────
const modalBackdrop   = document.getElementById('modalBackdrop');
const settingsIconBtn = document.getElementById('settingsIconBtn');
const smClose         = document.getElementById('smClose');
const smTabs          = document.querySelectorAll('.sm-tab');
const smPanes         = document.querySelectorAll('.sm-pane');

function openModal()  { modalBackdrop.classList.remove('hidden'); }
function closeModal() { modalBackdrop.classList.add('hidden'); }

settingsIconBtn.addEventListener('click', openModal);
smClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) closeModal(); });

smTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        smTabs.forEach(t => t.classList.remove('active'));
        smPanes.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('stab-' + tab.dataset.stab).classList.add('active');
    });
});

// ─── TEACHER PIN ──────────────────────────────────────────
const PIN      = '1234';
const teacherBar = document.getElementById('teacherBar');
const pinMsg   = document.getElementById('pinMsg');
const pinRow   = document.getElementById('pinRow');
const pinInput = document.getElementById('pinInput');
const pinBtn   = document.getElementById('pinBtn');
const lockBtn  = document.getElementById('lockBtn');

let isTeacher = sessionStorage.getItem('den-teacher') === 'true';

function applyTeacher() {
    if (isTeacher) {
        pinRow.classList.add('hidden');
        lockBtn.classList.remove('hidden');
        teacherBar.classList.remove('hidden');
        pinMsg.innerHTML = '<span style="color:#16a34a">🔓 Teacher Mode Active</span>';
    } else {
        pinRow.classList.remove('hidden');
        lockBtn.classList.add('hidden');
        teacherBar.classList.add('hidden');
        pinMsg.innerHTML = '';
        pinInput.value = '';
    }
    renderCal();
}

pinBtn.addEventListener('click', () => {
    if (pinInput.value === PIN) {
        isTeacher = true;
        sessionStorage.setItem('den-teacher', 'true');
        applyTeacher();
    } else {
        pinMsg.innerHTML = '<span style="color:#dc2626">❌ Incorrect PIN</span>';
    }
});
pinInput.addEventListener('keydown', e => { if (e.key === 'Enter') pinBtn.click(); });
lockBtn.addEventListener('click', () => {
    isTeacher = false;
    sessionStorage.removeItem('den-teacher');
    applyTeacher();
});

// ─── CALENDAR ─────────────────────────────────────────────
const calGrid  = document.getElementById('calGrid');
const calLabel = document.getElementById('calLabel');
const prevMo   = document.getElementById('prevMo');
const nextMo   = document.getElementById('nextMo');
const addEvtForm = document.getElementById('addEvtForm');
const evtDate  = document.getElementById('evtDate');
const evtTitle = document.getElementById('evtTitle');

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
let cy = new Date().getFullYear();
let cm = new Date().getMonth();
let evts = JSON.parse(localStorage.getItem('den-events') || '{}');

function renderCal() {
    // Keep the 7 header cells
    const heads = Array.from(calGrid.querySelectorAll('.ch'));
    calGrid.innerHTML = '';
    heads.forEach(h => calGrid.appendChild(h));

    calLabel.textContent = `${MONTHS[cm]} ${cy}`;

    const today  = new Date();
    const first  = new Date(cy, cm, 1).getDay();
    const days   = new Date(cy, cm + 1, 0).getDate();

    for (let i = 0; i < first; i++) {
        const el = document.createElement('div');
        el.className = 'cd blank';
        calGrid.appendChild(el);
    }

    for (let d = 1; d <= days; d++) {
        const el = document.createElement('div');
        el.className = 'cd';
        const key = `${cy}-${String(cm+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const isToday = today.getFullYear()===cy && today.getMonth()===cm && today.getDate()===d;
        if (isToday) el.classList.add('today');

        let html = `<span class="dn">${d}</span>`;
        (evts[key] || []).forEach(ev => {
            html += `<div class="ev ${isTeacher ? 'can' : ''}" data-k="${key}" data-id="${ev.id}">
                <span>${esc(ev.title)}</span>${isTeacher ? '<span>✕</span>' : ''}
            </div>`;
        });
        el.innerHTML = html;
        calGrid.appendChild(el);
    }

    if (isTeacher) {
        calGrid.querySelectorAll('.ev.can').forEach(el => {
            el.addEventListener('click', () => {
                const k = el.dataset.k;
                const id = Number(el.dataset.id);
                evts[k] = (evts[k] || []).filter(e => e.id !== id);
                if (!evts[k].length) delete evts[k];
                localStorage.setItem('den-events', JSON.stringify(evts));
                renderCal();
            });
        });
    }
}

prevMo.addEventListener('click', () => { cm--; if (cm < 0) { cm=11; cy--; } renderCal(); });
nextMo.addEventListener('click', () => { cm++; if (cm > 11) { cm=0; cy++; } renderCal(); });

addEvtForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!isTeacher) return;
    const k = evtDate.value;
    const title = evtTitle.value.trim();
    if (!k || !title) return;
    if (!evts[k]) evts[k] = [];
    evts[k].push({ id: Date.now(), title });
    localStorage.setItem('den-events', JSON.stringify(evts));
    evtTitle.value = '';
    const d = new Date(k + 'T12:00:00');
    cy = d.getFullYear(); cm = d.getMonth();
    renderCal();
});

// ─── INIT ─────────────────────────────────────────────────
applyTeacher();
renderCal();

})();
