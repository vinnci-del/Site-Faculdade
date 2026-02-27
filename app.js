// --- Constants & State ---
let currentUser = JSON.parse(sessionStorage.getItem('uniplan_user')) || null;

let tasks = JSON.parse(localStorage.getItem('uniplan_tasks')) || [
    {
        id: 1,
        title: "Pesquisa Inicial de Referências",
        owner: "Josué",
        status: "list-done",
        priority: "fluxo",
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        title: "Definição do Design System",
        owner: "Membro 2",
        status: "list-doing",
        priority: "foco",
        createdAt: new Date().toISOString()
    },
    {
        id: 3,
        title: "Implementação da API Mock",
        owner: "Membro 3",
        status: "list-backlog",
        priority: "urgente",
        createdAt: new Date().toISOString()
    }
];

// --- DOM Elements ---
const authApp = document.getElementById('auth-app');
const mainApp = document.getElementById('main-app');
const authForm = document.getElementById('auth-form');
const taskForm = document.getElementById('task-form');
const taskModal = document.getElementById('task-modal');
const btnNewTask = document.getElementById('btn-new-task');
const btnLogout = document.getElementById('btn-logout');
const btnCloseModal = document.getElementById('btn-close-modal');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    renderBoard();
});

function checkAuth() {
    if (currentUser) {
        authApp.style.display = 'none';
        mainApp.style.display = 'flex';
        document.getElementById('current-user-name').textContent = currentUser.name;
        document.getElementById('current-user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
    } else {
        authApp.style.display = 'flex';
        mainApp.style.display = 'none';
    }
}

// --- Auth Operations ---
authForm.onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('user-id').value;
    const pass = document.getElementById('group-pass').value;

    // Simple simulation of group access
    if (pass.length >= 4) {
        currentUser = { name: name, role: 'membro' };
        sessionStorage.setItem('uniplan_user', JSON.stringify(currentUser));
        checkAuth();
    } else {
        alert("Senha do grupo incorreta ou muito curta (mínimo 4 caracteres).");
    }
};

btnLogout.onclick = () => {
    sessionStorage.removeItem('uniplan_user');
    currentUser = null;
    checkAuth();
};

// --- Task Modal ---
btnNewTask.onclick = () => taskModal.classList.add('active');
btnCloseModal.onclick = () => taskModal.classList.remove('active');

// --- Board Operations ---
taskForm.onsubmit = (e) => {
    e.preventDefault();

    const newTask = {
        id: Date.now(),
        title: document.getElementById('task-title').value,
        owner: document.getElementById('task-owner').value,
        priority: document.getElementById('task-priority').value,
        status: 'list-backlog',
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    saveAndRefresh();
    taskForm.reset();
    taskModal.classList.remove('active');
};

function moveTask(id, newStatus) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.status = newStatus;
        saveAndRefresh();
    }
}

function deleteTask(id) {
    if (confirm("Tem certeza que deseja excluir esta tarefa do grupo?")) {
        tasks = tasks.filter(t => t.id !== id);
        saveAndRefresh();
    }
}

function saveAndRefresh() {
    localStorage.setItem('uniplan_tasks', JSON.stringify(tasks));
    renderBoard();
}

// --- Rendering Logic ---
function renderBoard() {
    const columns = ['list-backlog', 'list-doing', 'list-review', 'list-done'];

    columns.forEach(colId => {
        const listElement = document.getElementById(colId);
        const columnTasks = tasks.filter(t => t.status === colId);

        // Update badge count
        const badge = listElement.previousElementSibling.querySelector('.badge');
        badge.textContent = columnTasks.length;

        listElement.innerHTML = columnTasks.map(t => `
            <div class="task-card" draggable="true">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div class="task-title" style="font-size: 0.95rem;">${t.title}</div>
                    <button onclick="deleteTask(${t.id})" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer;">×</button>
                </div>
                
                <div class="task-tags">
                    <span class="tag ${t.priority}">${t.priority}</span>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div class="member-avatar">${t.owner.charAt(0)}</div>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">${t.owner}</span>
                    </div>
                    <div class="task-actions">
                        ${getNextActionButtons(t)}
                    </div>
                </div>
            </div>
        `).join('');
    });
}

function getNextActionButtons(task) {
    const statusMap = {
        'list-backlog': { next: 'list-doing', icon: '▶️', label: 'Iniciar' },
        'list-doing': { next: 'list-review', icon: '👁️', label: 'Revisar' },
        'list-review': { next: 'list-done', icon: '✅', label: 'Finalizar' },
        'list-done': { next: 'list-doing', icon: '↩️', label: 'Retornar' }
    };

    const action = statusMap[task.status];
    return `<button onclick="moveTask(${task.id}, '${action.next}')" 
            title="${action.label}" 
            style="background: var(--bg-glass); border: 1px solid var(--border-glass); border-radius: 4px; padding: 4px 8px; color: var(--text-main); cursor:pointer; font-size: 0.8rem;">
            ${action.icon}
        </button>`;
}
