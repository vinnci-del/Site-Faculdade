// State Management
const scannedActivities = [
    {
        "id": 1740064000001,
        "title": "Atividade 1 (Trabalho)",
        "subject": "Gestão Da Propaganda",
        "deadline": "2026-03-23",
        "priority": "high",
        "completed": false,
        "createdAt": new Date().toISOString()
    },
    {
        "id": 1740064000002,
        "title": "Atividade 1 (Trabalho)",
        "subject": "Inteligência Artificial",
        "deadline": "2026-03-23",
        "priority": "medium",
        "completed": true,
        "createdAt": new Date().toISOString()
    },
    {
        "id": 1740064000003,
        "title": "Atividade 1 (Trabalho)",
        "subject": "Introdução À Publicidade E Propaganda",
        "deadline": "2026-03-23",
        "priority": "medium",
        "completed": true,
        "createdAt": new Date().toISOString()
    }
];

let activities = JSON.parse(localStorage.getItem('activities')) || scannedActivities;
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

    // Heuristic: Detecting patterns from Belas Artes screenshots
    // Keywords for activities/deadlines
    const activityKeywords = ['Atividade', 'Prova', 'Entrega', 'Trabalho', 'Avaliação', 'Projeto', 'Mentoria', 'Slide'];
    const dateRegex = /(\d{2})[\/\- ](\d{2})[\/\- ]?(\d{2,4})?/;

    let currentSubject = "Geral";

    // Attempt to extract subject from lines like "PP.20261... | NOME DA DISCIPLINA"
    const subjectRegex = /PP\.\d{5}\..*?\|\s*(.*)/i;

    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.length < 3) return;

        // Match subject name
        const subMatch = trimmed.match(subjectRegex);
        if (subMatch) {
            currentSubject = subMatch[1].trim();
            return;
        }

        const hasKeyword = activityKeywords.some(key => trimmed.toLowerCase().includes(key.toLowerCase()));
        const dateMatch = trimmed.match(dateRegex);

        if (hasKeyword || dateMatch) {
            let deadline = dateMatch ? formatDateForInput(dateMatch[0]) : new Date().toISOString().split('T')[0];

            // If it's just "Aula X - Slides", it might not be a "deadline" task but a content
            // We'll mark it as low priority unless "Prova" or "Entrega" is mentioned
            let priority = 'low';
            if (/prova|entrega|trabalho|avaliação/i.test(trimmed)) priority = 'high';
            else if (/projeto|atividade/i.test(trimmed)) priority = 'medium';

            // Clean title
            let title = trimmed.replace(dateRegex, '').replace(/[|•-]/g, '').trim();
            if (title.length > 5) {
                detected.push({
                    id: Math.random(),
                    title: title,
                    subject: currentSubject,
                    deadline: deadline,
                    priority: priority,
                    completed: false,
                    createdAt: new Date().toISOString()
                });
            }
        }
    });

    // Deduplicate by title within the same subject
    return detected.filter((v, i, a) => a.findIndex(t => (t.title === v.title && t.subject === v.subject)) === i);
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
