// --- State Management ---
let tasks = JSON.parse(localStorage.getItem('workflow_tasks')) || [
    {
        id: 1,
        title: "Pesquisa de Mercado - Projeto X",
        category: "trabalho",
        priority: "foco",
        date: "2026-03-05",
        completed: false
    },
    {
        id: 2,
        title: "Relatórios de IA Belas Artes",
        category: "faculdade",
        priority: "urgente",
        date: "2026-03-02",
        completed: true
    }
];

let activeFilter = 'all';

// --- DOM Elements ---
const tasksList = document.getElementById('tasks-list');
const taskForm = document.getElementById('task-form');
const taskModal = document.getElementById('task-modal');
const btnNewTask = document.getElementById('btn-new-task');
const btnCloseModal = document.getElementById('btn-close-modal');
const filterBtns = document.querySelectorAll('.filter-btn');

// Stats Elements
const statsTotal = document.getElementById('stats-total');
const statsProgress = document.getElementById('stats-progress');
const statsCompleted = document.getElementById('stats-completed');
const pendingCountText = document.getElementById('pending-count');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    renderTasks();
    updateStats();
});

// --- Modal Logic ---
btnNewTask.onclick = () => taskModal.classList.add('active');
btnCloseModal.onclick = () => taskModal.classList.remove('active');

window.onclick = (e) => {
    if (e.target === taskModal) taskModal.classList.remove('active');
};

// --- CRUD Operations ---
taskForm.onsubmit = (e) => {
    e.preventDefault();

    const newTask = {
        id: Date.now(),
        title: document.getElementById('task-title').value,
        category: document.getElementById('task-category').value,
        priority: document.getElementById('task-priority').value,
        date: document.getElementById('task-date').value,
        completed: false
    };

    tasks.unshift(newTask);
    saveAndRefresh();
    taskForm.reset();
    taskModal.classList.remove('active');
};

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveAndRefresh();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveAndRefresh();
}

function saveAndRefresh() {
    localStorage.setItem('workflow_tasks', JSON.stringify(tasks));
    renderTasks();
    updateStats();
}

// --- Rendering Logic ---
function renderTasks() {
    const filtered = tasks.filter(t => {
        if (activeFilter === 'all') return true;
        return t.category === activeFilter;
    });

    if (filtered.length === 0) {
        tasksList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <p>Nenhum trabalho encontrado nesta categoria.</p>
            </div>
        `;
        return;
    }

    tasksList.innerHTML = filtered.map(t => `
        <div class="task-card ${t.completed ? 'completed' : ''}" data-id="${t.id}">
            <div class="task-checkbox" onclick="toggleTask(${t.id})">
                ${t.completed ? '✓' : ''}
            </div>
            <div class="task-content">
                <div class="task-title">${t.title}</div>
                <div class="task-meta">
                    <span class="badge ${t.priority}">${t.priority}</span>
                    <span>📁 ${t.category}</span>
                    <span>📅 ${formatDate(t.date)}</span>
                </div>
            </div>
            <button onclick="deleteTask(${t.id})" style="background:transparent; border:none; cursor:pointer; font-size: 1.2rem; opacity: 0.5;">🗑️</button>
        </div>
    `).join('');
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const progress = total - completed;

    statsTotal.textContent = total;
    statsProgress.textContent = progress;
    statsCompleted.textContent = completed;
    pendingCountText.textContent = progress;
}

function formatDate(dateStr) {
    const options = { day: '2-digit', month: 'short' };
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', options);
}

// --- Filtering Logic ---
filterBtns.forEach(btn => {
    btn.onclick = () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        renderTasks();
    };
});
