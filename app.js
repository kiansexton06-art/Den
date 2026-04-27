document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Management ---
    const themeBtns = document.querySelectorAll('.theme-btn');
    const body = document.body;

    const savedTheme = localStorage.getItem('den-theme') || 'theme-light';
    setTheme(savedTheme);

    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            setTheme(theme);
            localStorage.setItem('den-theme', theme);
        });
    });

    function setTheme(themeName) {
        body.classList.remove('theme-light', 'theme-dark', 'theme-modern');
        body.classList.add(themeName);

        themeBtns.forEach(btn => {
            if(btn.getAttribute('data-theme') === themeName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // --- Sidebar & Navigation ---
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('openSidebarBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const mainContent = document.getElementById('mainContent');
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    openSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        sidebar.classList.toggle('open');
        mainContent.classList.toggle('expanded');
    });

    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('collapsed');
        sidebar.classList.remove('open');
        mainContent.classList.add('expanded');
    });

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active btn
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show target tab
            const target = btn.getAttribute('data-target');
            tabPanes.forEach(pane => {
                if (pane.id === target) {
                    pane.classList.add('active');
                } else {
                    pane.classList.remove('active');
                }
            });

            // On mobile, close sidebar after clicking
            if (window.innerWidth < 992) {
                sidebar.classList.remove('open');
            }
        });
    });

    // --- Work Feed Management ---
    const workForm = document.getElementById('workForm');
    const studentNameInput = document.getElementById('studentName');
    const studentWorkInput = document.getElementById('studentWork');
    const workFeed = document.getElementById('workFeed');

    let savedWorks = JSON.parse(localStorage.getItem('den-works')) || [];
    renderFeed();

    workForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = studentNameInput.value.trim();
        const work = studentWorkInput.value.trim();

        if (name && work) {
            const newWork = {
                id: Date.now(),
                name: name,
                content: work,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })
            };
            savedWorks.unshift(newWork);
            if (savedWorks.length > 50) savedWorks.pop(); // keep last 50
            localStorage.setItem('den-works', JSON.stringify(savedWorks));
            renderFeed();
            workForm.reset();
        }
    });

    function renderFeed() {
        workFeed.innerHTML = '';
        if (savedWorks.length === 0) {
            workFeed.innerHTML = '<div class="empty-state">No work has been shared yet. Be the first!</div>';
            return;
        }
        savedWorks.forEach(work => {
            const workEl = document.createElement('div');
            workEl.className = 'work-item';
            workEl.innerHTML = `
                <div class="work-item-header">
                    <span class="work-item-name">${escapeHTML(work.name)}</span>
                    <span class="work-item-date">${work.date}</span>
                </div>
                <div class="work-item-content">${escapeHTML(work.content)}</div>
            `;
            workFeed.appendChild(workEl);
        });
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- Teacher PIN & Authentication ---
    const TEACHER_PIN = '1234'; 
    let isTeacher = sessionStorage.getItem('den-isTeacher') === 'true';

    const teacherPinInput = document.getElementById('teacherPin');
    const submitPinBtn = document.getElementById('submitPinBtn');
    const logoutTeacherBtn = document.getElementById('logoutTeacherBtn');
    const pinInputGroup = document.getElementById('pinInputGroup');
    const pinStatus = document.getElementById('pinStatus');
    const teacherCalendarControls = document.getElementById('teacherCalendarControls');

    function updateTeacherUI() {
        if (isTeacher) {
            pinInputGroup.classList.add('hidden');
            logoutTeacherBtn.classList.remove('hidden');
            pinStatus.innerHTML = '<span style="color: #2ecc71;">✓ Unlocked. You have Teacher access.</span>';
            teacherCalendarControls.classList.remove('hidden');
        } else {
            pinInputGroup.classList.remove('hidden');
            logoutTeacherBtn.classList.add('hidden');
            pinStatus.innerHTML = '';
            teacherCalendarControls.classList.add('hidden');
            teacherPinInput.value = '';
        }
        renderCalendar(); // Re-render to show/hide event delete buttons
    }

    submitPinBtn.addEventListener('click', () => {
        if (teacherPinInput.value === TEACHER_PIN) {
            isTeacher = true;
            sessionStorage.setItem('den-isTeacher', 'true');
            updateTeacherUI();
        } else {
            pinStatus.innerHTML = '<span style="color: #e74c3c;">✗ Incorrect PIN.</span>';
        }
    });

    logoutTeacherBtn.addEventListener('click', () => {
        isTeacher = false;
        sessionStorage.removeItem('den-isTeacher');
        updateTeacherUI();
    });

    updateTeacherUI();

    // --- Calendar Management ---
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    const calendarDays = document.getElementById('calendarDays');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    
    // Format: { '2023-10-15': [{id: 1, title: 'Math Test'}] }
    let calendarEvents = JSON.parse(localStorage.getItem('den-events')) || {};

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    function renderCalendar() {
        calendarDays.innerHTML = '';
        currentMonthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Empty cells for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-day empty';
            calendarDays.appendChild(emptyDiv);
        }

        // Real days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            let html = `<span class="day-number">${i}</span><div class="events-container">`;
            
            if (calendarEvents[dateStr]) {
                calendarEvents[dateStr].forEach(ev => {
                    html += `<div class="event-label ${isTeacher ? 'deleteable' : ''}" data-date="${dateStr}" data-id="${ev.id}">
                        <span>${escapeHTML(ev.title)}</span>
                        ${isTeacher ? '<span>&times;</span>' : ''}
                    </div>`;
                });
            }
            
            html += `</div>`;
            dayDiv.innerHTML = html;
            calendarDays.appendChild(dayDiv);
        }

        // Add event listeners to delete buttons if teacher
        if (isTeacher) {
            document.querySelectorAll('.event-label.deleteable').forEach(el => {
                el.addEventListener('click', function() {
                    if(confirm('Delete this event?')) {
                        const date = this.getAttribute('data-date');
                        const id = Number(this.getAttribute('data-id'));
                        calendarEvents[date] = calendarEvents[date].filter(ev => ev.id !== id);
                        if (calendarEvents[date].length === 0) delete calendarEvents[date];
                        localStorage.setItem('den-events', JSON.stringify(calendarEvents));
                        renderCalendar();
                    }
                });
            });
        }
    }

    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar();
    });

    // Add Event
    const addEventForm = document.getElementById('addEventForm');
    const eventDateInput = document.getElementById('eventDate');
    const eventTitleInput = document.getElementById('eventTitle');

    addEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const date = eventDateInput.value;
        const title = eventTitleInput.value.trim();

        if (date && title && isTeacher) {
            if (!calendarEvents[date]) {
                calendarEvents[date] = [];
            }
            calendarEvents[date].push({ id: Date.now(), title: title });
            localStorage.setItem('den-events', JSON.stringify(calendarEvents));
            
            // Re-render if added in currently viewed month
            const eventMonth = new Date(date).getMonth();
            const eventYear = new Date(date).getFullYear();
            if (eventMonth === currentMonth && eventYear === currentYear) {
                renderCalendar();
            }
            
            eventTitleInput.value = '';
        }
    });

    // Initial render
    renderCalendar();
});
