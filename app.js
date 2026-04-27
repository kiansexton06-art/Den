(() => {
'use strict';

// ─── FIREBASE INIT ─────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBi-PMbrCNrID4Sci2DYj7l6ewQaxIqJ4k",
  authDomain: "ubgpro.firebaseapp.com",
  projectId: "ubgpro",
  storageBucket: "ubgpro.firebasestorage.app",
  messagingSenderId: "915266692059",
  appId: "1:915266692059:web:699879598f8d9ad96cbdfe"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ─── SITE ENTRY PIN ───────────────────────────────────────
const SITE_PIN = 'den2024'; // The global PIN
const siteEntryOverlay = document.getElementById('siteEntryOverlay');
const sitePinInput = document.getElementById('sitePinInput');
const sitePinBtn = document.getElementById('sitePinBtn');
const sitePinMsg = document.getElementById('sitePinMsg');

if (localStorage.getItem('den-unlocked') === 'true') {
    siteEntryOverlay.classList.add('unlocked');
} else {
    sitePinBtn.addEventListener('click', () => {
        if (sitePinInput.value === SITE_PIN) {
            localStorage.setItem('den-unlocked', 'true');
            siteEntryOverlay.classList.add('unlocked');
        } else {
            sitePinMsg.textContent = '❌ Incorrect PIN';
        }
    });
    sitePinInput.addEventListener('keydown', e => { if (e.key === 'Enter') sitePinBtn.click(); });
}

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

let works = [];

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

// Global Sync for Works
db.collection('den-works').orderBy('timestamp', 'desc').limit(50).onSnapshot(snap => {
    works = [];
    snap.forEach(doc => {
        const data = doc.data();
        works.push({ id: doc.id, name: data.name, content: data.content, date: data.date });
    });
    renderFeed();
});

workForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = nameInp.value.trim();
    const content = workInp.value.trim();
    if (!name || !content) return;

    const btn = workForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = '⏳ Posting...';

    try {
        await db.collection('den-works').add({
            name,
            content,
            date: new Date().toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        workForm.reset();
        workMsg.textContent = '✅ Work posted globally!';
        workMsg.className = 'msg ok';
        workMsg.classList.remove('hidden');
        setTimeout(() => workMsg.classList.add('hidden'), 3000);
    } catch (err) {
        console.error("Error posting work:", err);
        workMsg.textContent = '❌ Failed to post.';
        workMsg.className = 'msg err';
        workMsg.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.textContent = '🚀 Post My Work';
    }
});

// ─── SETTINGS SCREEN ───────────────────────────────────────
const settingsScreen  = document.getElementById('settingsScreen');
const settingsIconBtn = document.getElementById('settingsIconBtn');
const ssBack          = document.getElementById('ssBack');
const smTabs          = document.querySelectorAll('.sm-tab');
const smPanes         = document.querySelectorAll('.sm-pane');

function openSettings()  { settingsScreen.classList.remove('hidden'); }
function closeSettings() { settingsScreen.classList.add('hidden'); }

settingsIconBtn.addEventListener('click', openSettings);
ssBack.addEventListener('click', closeSettings);

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
const evtDesc  = document.getElementById('evtDesc');

// ─── EVENT POPUP ──────────────────────────────────────────
const evPopupBackdrop = document.getElementById('evPopupBackdrop');
const evPopupClose    = document.getElementById('evPopupClose');
const evPopupDate     = document.getElementById('evPopupDate');
const evPopupTitle    = document.getElementById('evPopupTitle');
const evPopupDesc     = document.getElementById('evPopupDesc');

function showEvPopup(dateKey, ev) {
    const d = new Date(dateKey + 'T12:00:00');
    evPopupDate.textContent = d.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
    evPopupTitle.textContent = ev.title;
    evPopupDesc.textContent = ev.desc || 'No description added.';
    evPopupDesc.style.opacity = ev.desc ? '1' : '0.5';
    evPopupBackdrop.classList.remove('hidden');
}

function closeEvPopup() { evPopupBackdrop.classList.add('hidden'); }
evPopupClose.addEventListener('click', closeEvPopup);
evPopupBackdrop.addEventListener('click', e => { if (e.target === evPopupBackdrop) closeEvPopup(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeEvPopup(); });

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

        const dayOfWeek = new Date(key + 'T12:00:00').getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        if (isWeekend) el.classList.add('weekend');

        let html = `<span class="dn">${d}</span>`;
        (evts[key] || []).forEach(ev => {
            html += `<div class="ev ${isTeacher ? 'can' : 'viewable'}" data-k="${key}" data-id="${ev.id}">
                <span>${esc(ev.title)}</span>${isTeacher ? '<span>✕</span>' : '<span class="ev-info">ℹ</span>'}
            </div>`;
        });
        el.innerHTML = html;

        // Teacher: click cell to auto-fill date
        if (isTeacher && !isWeekend) {
            el.classList.add('clickable-day');
            el.addEventListener('click', ev => {
                // Only trigger if click is on the cell background (not on an event pill)
                if (ev.target.closest('.ev')) return;
                evtDate.value = key;
                evtDate.style.borderColor = '';
                // Highlight selected cell
                calGrid.querySelectorAll('.cd.selected').forEach(c => c.classList.remove('selected'));
                el.classList.add('selected');
                // Scroll form into view and focus title
                evtTitle.focus();
                evtTitle.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        }

        calGrid.appendChild(el);
    }

    if (isTeacher) {
        // Teacher: click event pill to DELETE
        calGrid.querySelectorAll('.ev.can').forEach(pill => {
            pill.addEventListener('click', e => {
                e.stopPropagation();
                const k = pill.dataset.k;
                const id = Number(pill.dataset.id);
                evts[k] = (evts[k] || []).filter(e => e.id !== id);
                if (!evts[k].length) delete evts[k];
                localStorage.setItem('den-events', JSON.stringify(evts));
                renderCal();
            });
        });
    } else {
        // Student: click event pill to VIEW description
        calGrid.querySelectorAll('.ev.viewable').forEach(pill => {
            pill.addEventListener('click', e => {
                e.stopPropagation();
                const k = pill.dataset.k;
                const id = Number(pill.dataset.id);
                const ev = (evts[k] || []).find(e => e.id === id);
                if (ev) showEvPopup(k, ev);
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

    // Block weekends (0 = Sunday, 6 = Saturday)
    const dayOfWeek = new Date(k + 'T12:00:00').getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        evtTitle.setCustomValidity('');
        evtDate.style.borderColor = '#dc2626';
        const existing = document.getElementById('weekendWarn');
        if (!existing) {
            const warn = document.createElement('p');
            warn.id = 'weekendWarn';
            warn.style.cssText = 'color:#dc2626;font-size:.82rem;font-weight:700;margin-top:4px';
            warn.textContent = '⛔ Weekends not allowed — pick a Monday to Friday date.';
            addEvtForm.after(warn);
            setTimeout(() => { warn.remove(); evtDate.style.borderColor = ''; }, 3500);
        }
        return;
    }
    evtDate.style.borderColor = '';

    if (!evts[k]) evts[k] = [];
    evts[k].push({ id: Date.now(), title, desc: evtDesc ? evtDesc.value.trim() : '' });
    localStorage.setItem('den-events', JSON.stringify(evts));
    evtTitle.value = '';
    if (evtDesc) evtDesc.value = '';
    const d = new Date(k + 'T12:00:00');
    cy = d.getFullYear(); cm = d.getMonth();
    renderCal();
});

// ─── INIT ─────────────────────────────────────────────────
applyTeacher();
renderCal();

})();
