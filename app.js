(() => {
'use strict';

// ── Theme ─────────────────────────────────────────────────
const html = document.documentElement;
const themePills = document.querySelectorAll('.theme-pill');

function setTheme(t) {
    html.setAttribute('data-theme', t);
    localStorage.setItem('den-theme', t);
    themePills.forEach(p => p.classList.toggle('active', p.dataset.theme === t));
}
setTheme(localStorage.getItem('den-theme') || 'light');
themePills.forEach(p => p.addEventListener('click', () => setTheme(p.dataset.theme)));

// ── Sidebar ───────────────────────────────────────────────
const sidebar        = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const hamburgerBtn   = document.getElementById('hamburgerBtn');
const sidebarCloseBtn= document.getElementById('sidebarCloseBtn');

function openSidebar()  { sidebar.classList.add('open'); sidebarOverlay.classList.add('show'); }
function closeSidebar() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('show'); }

hamburgerBtn.addEventListener('click', openSidebar);
sidebarCloseBtn.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// ── Tab Navigation ────────────────────────────────────────
const navItems    = document.querySelectorAll('.nav-item');
const tabPanels   = document.querySelectorAll('.tab-panel');
const topbarTitle = document.getElementById('topbarTitle');
const tabTitles   = { about: 'About Us', report: 'Report Work', calendar: 'Calendar', settings: 'Settings' };

function showTab(id) {
    navItems.forEach(n => n.classList.toggle('active', n.dataset.tab === id));
    tabPanels.forEach(p => p.classList.toggle('active', p.id === `tab-${id}`));
    topbarTitle.textContent = tabTitles[id] || '';
    if (window.innerWidth < 1024) closeSidebar();
}

navItems.forEach(n => n.addEventListener('click', () => showTab(n.dataset.tab)));

// ── Work Feed ─────────────────────────────────────────────
const workForm    = document.getElementById('workForm');
const nameInput   = document.getElementById('studentName');
const workInput   = document.getElementById('studentWork');
const workFeed    = document.getElementById('workFeed');
const submitBtn   = document.getElementById('submitWorkBtn');
const feedbackEl  = document.getElementById('workFeedback');

let works = JSON.parse(localStorage.getItem('den-works') || '[]');

function escapeHTML(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function renderFeed() {
    if (!works.length) {
        workFeed.innerHTML = `
          <div class="empty-state">
            <i class="fa-solid fa-inbox"></i>
            <p>Nothing shared yet — be the first!</p>
          </div>`;
        return;
    }
    workFeed.innerHTML = works.map(w => `
      <div class="work-card">
        <div class="work-card-top">
          <span class="work-name"><i class="fa-solid fa-circle-user"></i> ${escapeHTML(w.name)}</span>
          <span class="work-date">${w.date}</span>
        </div>
        <p class="work-body">${escapeHTML(w.content)}</p>
      </div>`).join('');
}

function showFeedback(msg, type) {
    feedbackEl.textContent = msg;
    feedbackEl.className = `form-feedback ${type}`;
    feedbackEl.classList.remove('hidden');
    setTimeout(() => feedbackEl.classList.add('hidden'), 3000);
}

workForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const content = workInput.value.trim();
    if (!name || !content) return;

    works.unshift({
        id: Date.now(),
        name,
        content,
        date: new Date().toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
    });
    if (works.length > 50) works.pop();
    localStorage.setItem('den-works', JSON.stringify(works));
    renderFeed();
    workForm.reset();
    showFeedback('✓ Work posted successfully!', 'success');
});

renderFeed();

// ── Teacher PIN ───────────────────────────────────────────
const TEACHER_PIN      = '1234';
const teacherPanel     = document.getElementById('teacherPanel');
const pinStatusMsg     = document.getElementById('pinStatusMsg');
const pinInputRow      = document.getElementById('pinInputRow');
const teacherPinInput  = document.getElementById('teacherPin');
const submitPinBtn     = document.getElementById('submitPinBtn');
const logoutTeacherBtn = document.getElementById('logoutTeacherBtn');

let isTeacher = sessionStorage.getItem('den-teacher') === 'true';

function applyTeacherMode() {
    if (isTeacher) {
        pinInputRow.classList.add('hidden');
        logoutTeacherBtn.classList.remove('hidden');
        teacherPanel.classList.remove('hidden');
        pinStatusMsg.innerHTML = '<span style="color:#27ae60"><i class="fa-solid fa-lock-open"></i> Teacher Mode Active</span>';
    } else {
        pinInputRow.classList.remove('hidden');
        logoutTeacherBtn.classList.add('hidden');
        teacherPanel.classList.add('hidden');
        pinStatusMsg.innerHTML = '';
        teacherPinInput.value = '';
    }
    renderCalendar();
}

submitPinBtn.addEventListener('click', () => {
    if (teacherPinInput.value === TEACHER_PIN) {
        isTeacher = true;
        sessionStorage.setItem('den-teacher', 'true');
        applyTeacherMode();
    } else {
        pinStatusMsg.innerHTML = '<span style="color:#e74c3c"><i class="fa-solid fa-circle-xmark"></i> Incorrect PIN. Try again.</span>';
    }
});

teacherPinInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitPinBtn.click(); });

logoutTeacherBtn.addEventListener('click', () => {
    isTeacher = false;
    sessionStorage.removeItem('den-teacher');
    applyTeacherMode();
});

// ── Calendar ──────────────────────────────────────────────
const calGrid      = document.getElementById('calGrid');
const calMonthLbl  = document.getElementById('calMonthLabel');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const addEventForm = document.getElementById('addEventForm');
const eventDateInp = document.getElementById('eventDate');
const eventTitleInp= document.getElementById('eventTitle');

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth();
let events   = JSON.parse(localStorage.getItem('den-events') || '{}');

function renderCalendar() {
    // Remove day cells (keep the 7 header cells)
    const heads = Array.from(calGrid.querySelectorAll('.cal-head'));
    calGrid.innerHTML = '';
    heads.forEach(h => calGrid.appendChild(h));

    calMonthLbl.textContent = `${MONTHS[calMonth]} ${calYear}`;

    const today     = new Date();
    const firstDay  = new Date(calYear, calMonth, 1).getDay();
    const daysInMon = new Date(calYear, calMonth + 1, 0).getDate();

    // Blank leading cells
    for (let i = 0; i < firstDay; i++) {
        const el = document.createElement('div');
        el.className = 'cal-day empty';
        calGrid.appendChild(el);
    }

    // Day cells
    for (let d = 1; d <= daysInMon; d++) {
        const el  = document.createElement('div');
        el.className = 'cal-day';
        const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === d;
        if (isToday) el.classList.add('today');

        const dateKey = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dayEvs  = events[dateKey] || [];

        let html = `<span class="day-num">${d}</span>`;
        dayEvs.forEach(ev => {
            html += `<div class="event-pill ${isTeacher ? 'deleteable' : ''}" data-key="${dateKey}" data-id="${ev.id}">
                <span>${escapeHTML(ev.title)}</span>
                ${isTeacher ? '<i class="fa-solid fa-xmark" style="font-size:.7rem"></i>' : ''}
            </div>`;
        });
        el.innerHTML = html;
        calGrid.appendChild(el);
    }

    // Delete listeners
    if (isTeacher) {
        calGrid.querySelectorAll('.event-pill.deleteable').forEach(pill => {
            pill.addEventListener('click', () => {
                const key = pill.dataset.key;
                const id  = Number(pill.dataset.id);
                events[key] = (events[key] || []).filter(ev => ev.id !== id);
                if (!events[key].length) delete events[key];
                localStorage.setItem('den-events', JSON.stringify(events));
                renderCalendar();
            });
        });
    }
}

prevMonthBtn.addEventListener('click', () => {
    calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
});
nextMonthBtn.addEventListener('click', () => {
    calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
});

addEventForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!isTeacher) return;
    const key   = eventDateInp.value;
    const title = eventTitleInp.value.trim();
    if (!key || !title) return;
    if (!events[key]) events[key] = [];
    events[key].push({ id: Date.now(), title });
    localStorage.setItem('den-events', JSON.stringify(events));
    eventTitleInp.value = '';
    // Jump to the month of the added event
    const d = new Date(key + 'T12:00:00');
    calYear = d.getFullYear();
    calMonth = d.getMonth();
    renderCalendar();
});

// ── Init ──────────────────────────────────────────────────
applyTeacherMode();
renderCalendar();

})();
