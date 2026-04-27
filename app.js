document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Management ---
    const themeBtns = document.querySelectorAll('.theme-btn');
    const body = document.body;

    // Load saved theme
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
        // Remove all theme classes
        body.classList.remove('theme-light', 'theme-dark', 'theme-modern');
        // Add new theme
        body.classList.add(themeName);

        // Update active button state
        themeBtns.forEach(btn => {
            if(btn.getAttribute('data-theme') === themeName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // --- Work Feed Management ---
    const workForm = document.getElementById('workForm');
    const studentNameInput = document.getElementById('studentName');
    const studentWorkInput = document.getElementById('studentWork');
    const workFeed = document.getElementById('workFeed');

    // Load saved work
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

            // Add to beginning of array
            savedWorks.unshift(newWork);
            
            // Keep only latest 50
            if (savedWorks.length > 50) {
                savedWorks.pop();
            }

            localStorage.setItem('den-works', JSON.stringify(savedWorks));
            
            renderFeed();
            
            // Reset form
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

    // Simple HTML escaper to prevent XSS
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
