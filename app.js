// State Management
let activities = JSON.parse(localStorage.getItem('activities')) || [];
let activeFilter = 'all';

// DOM Elements
const activitiesList = document.getElementById('activities-list');
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');
const statOverdue = document.getElementById('stat-overdue');
const pendingCountText = document.getElementById('pending-count-text');

const importModal = document.getElementById('import-modal');
const taskModal = document.getElementById('task-modal');
const btnOpenImport = document.getElementById('btn-open-import');
const btnAddTask = document.getElementById('btn-add-task');
const closeButtons = document.querySelectorAll('.close-modal');

const taskForm = document.getElementById('task-form');
const importData = document.getElementById('import-data');
const btnProcessImport = document.getElementById('btn-process-import');

const searchInput = document.getElementById('search-input');
const filterTabs = document.querySelectorAll('.filter-tab');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderActivities();
    updateStats();
});

// Modal Toggles
btnOpenImport.onclick = () => importModal.classList.add('active');
btnAddTask.onclick = () => taskModal.classList.add('active');
closeButtons.forEach(btn => {
    btn.onclick = () => {
        importModal.classList.remove('active');
        taskModal.classList.remove('active');
    };
});

window.onclick = (event) => {
    if (event.target === importModal) importModal.classList.remove('active');
    if (event.target === taskModal) taskModal.classList.remove('active');
};

// Form Submission
taskForm.onsubmit = (e) => {
    e.preventDefault();
    const newTask = {
        id: Date.now(),
        title: document.getElementById('task-title').value,
        subject: document.getElementById('task-subject').value,
        deadline: document.getElementById('task-deadline').value,
        priority: document.getElementById('task-priority').value,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    activities.unshift(newTask);
    saveAndRefresh();
    taskForm.reset();
    taskModal.classList.remove('active');
};

// Import Logic (Simple Heuristic Parser)
btnProcessImport.onclick = () => {
    const rawData = importData.value;
    if (!rawData.trim()) return;

    // Pattern matching for activities (Simplified example)
    // Looking for strings like "Tarefa: XXX", "Prazo: XX/XX", etc.
    const newItems = parseActivitiesFromText(rawData);
    
    if (newItems.length > 0) {
        activities = [...newItems, ...activities];
        saveAndRefresh();
        importModal.classList.remove('active');
        importData.value = '';
    } else {
        alert("Não consegui encontrar atividades no texto fornecido. Tente copiar a tabela de atividades inteira.");
    }
};

function parseActivitiesFromText(text) {
    const lines = text.split('\n');
    const detected = [];
    
    // Simple logic: If it looks like a Moodle "Tarefa" or similar
    // We can iterate and try to find correlations.
    // For now, let's look for common keywords in Brazilian LMS
    
    // Heuristic: Many LMS show activities in rows. 
    // We'll try to find sequences that look like (Subject -> Task -> Date)
    
    // Mocking a simple line-by-line check
    // If we find a date-like string and a title-like string
    
    const dateRegex = /(\d{2})[\/\- ](\d{2})[\/\- ](\d{2,4})/;
    
    let currentSubject = "Geral";
    
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.length < 3) return;
        
        // If line is short and uppercase, might be a subject
        if (trimmed.length < 30 && trimmed === trimmed.toUpperCase() && !dateRegex.test(trimmed)) {
            currentSubject = trimmed;
        }

        const dateMatch = trimmed.match(dateRegex);
        if (dateMatch) {
            // It's a task if it has a date and some text
            const title = trimmed.replace(dateRegex, '').replace(/Prazo|Vencimento|Atividade|Tarefa/gi, '').trim();
            if (title.length > 3) {
                detected.push({
                    id: Math.random(),
                    title: title,
                    subject: currentSubject,
                    deadline: formatDateForInput(dateMatch[0]),
                    priority: 'medium',
                    completed: false,
                    createdAt: new Date().toISOString()
                });
            }
        }
    });

    return detected;
}

function formatDateForInput(dateStr) {
    // Converts DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD
    const parts = dateStr.split(/[\/\- ]/);
    if (parts.length === 3) {
        let day = parts[0];
        let month = parts[1];
        let year = parts[2];
        if (year.length === 2) year = '20' + year;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return new Date().toISOString().split('T')[0];
}

// Rendering Logic
function renderActivities() {
    const query = searchInput.value.toLowerCase();
    
    const filtered = activities.filter(a => {
        const matchesQuery = a.title.toLowerCase().includes(query) || a.subject.toLowerCase().includes(query);
        const matchesTab = activeFilter === 'all' || 
                         (activeFilter === 'pending' && !a.completed) || 
                         (activeFilter === 'completed' && a.completed);
        return matchesQuery && matchesTab;
    });

    if (filtered.length === 0) {
        activitiesList.innerHTML = `<div class="empty-state">
            <div class="empty-icon">📂</div>
            <p>Nenhuma atividade encontrada.</p>
        </div>`;
        return;
    }

    activitiesList.innerHTML = filtered.map(a => `
        <div class="activity-item" data-id="${a.id}">
            <div class="activity-checkbox ${a.completed ? 'checked' : ''}" onclick="toggleStatus(${a.id})"></div>
            <div class="activity-details">
                <div class="activity-title" style="${a.completed ? 'text-decoration: line-through; opacity: 0.6' : ''}">${a.title}</div>
                <div class="activity-meta">
                    <span class="activity-subject">${a.subject}</span>
                    <span class="activity-deadline">📅 Vence em: ${formatDisplayDate(a.deadline)}</span>
                    <span class="priority-badge priority-${a.priority}">${a.priority}</span>
                </div>
            </div>
            <button class="btn-delete" onclick="deleteTask(${a.id})" style="background: transparent; color: var(--text-dim); padding: 5px;">🗑️</button>
        </div>
    `).join('');
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return 'Sem data';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR');
}

function toggleStatus(id) {
    const act = activities.find(a => a.id === id);
    if (act) {
        act.completed = !act.completed;
        saveAndRefresh();
    }
}

function deleteTask(id) {
    activities = activities.filter(a => a.id !== id);
    saveAndRefresh();
}

function updateStats() {
    const total = activities.length;
    const pending = activities.filter(a => !a.completed).length;
    const completed = activities.filter(a => a.completed).length;
    
    const today = new Date().toISOString().split('T')[0];
    const overdue = activities.filter(a => !a.completed && a.deadline < today).length;

    statTotal.textContent = total;
    statPending.textContent = pending;
    statCompleted.textContent = completed;
    statOverdue.textContent = overdue;
    pendingCountText.textContent = pending;
}

function saveAndRefresh() {
    localStorage.setItem('activities', JSON.stringify(activities));
    renderActivities();
    updateStats();
}

// Filters & Search
searchInput.oninput = () => renderActivities();

filterTabs.forEach(tab => {
    tab.onclick = () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeFilter = tab.dataset.filter;
        renderActivities();
    };
});
