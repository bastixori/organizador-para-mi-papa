// ==========================================================================
// CONFIGURATION & DUMMY DATA SEED (JIRA CASUAL STYLE)
// ==========================================================================

const DEFAULT_GOALS = [
    {
        id: "goal-1",
        key: "RICH-1",
        title: "Viajar a la Patagonia chilena en familia",
        theme: "theme-purple",
        priority: "alta",
        status: "todo",
        completedDate: null,
        checklist: [
            { id: "sub-1-1", text: "Buscar opciones de cabañas", done: false },
            { id: "sub-1-2", text: "Revisar vuelos y transporte", done: false }
        ]
    },
    {
        id: "goal-2",
        key: "RICH-2",
        title: "Hacer un gran asado de campo para mis amigos",
        theme: "theme-amber",
        priority: "media",
        status: "progress",
        completedDate: null,
        checklist: [
            { id: "sub-2-1", text: "Elegir la fecha ideal", done: true },
            { id: "sub-2-2", text: "Comprar leña de aromo", done: false },
            { id: "sub-2-3", text: "Comprar la carne y acompañamientos", done: false }
        ]
    },
    {
        id: "goal-3",
        key: "RICH-3",
        title: "Visitar a mis primos en el sur y recordar viejos lugares",
        theme: "theme-blue",
        priority: "alta",
        status: "done",
        completedDate: "2026-07-01",
        checklist: []
    },
    {
        id: "goal-4",
        key: "RICH-4",
        title: "Aprender a tocar en guitarra una canción de los Beatles",
        theme: "theme-green",
        priority: "baja",
        status: "todo",
        completedDate: null,
        checklist: [
            { id: "sub-4-1", text: "Aprender los acordes principales (C, G, Am, F)", done: true }
        ]
    },
    {
        id: "goal-5",
        key: "RICH-5",
        title: "Ir a ver un partido de la Selección en el estadio",
        theme: "theme-rose",
        priority: "media",
        status: "progress",
        completedDate: null,
        checklist: []
    }
];

// SVG Icons Constants
const ICONS = {
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`
};

// ==========================================================================
// STATE MANAGEMENT
// ==========================================================================

let goals = [];
let editingId = null; // Track which card is in inline edit mode

// Initialize App
function initApp() {
    const savedGoals = localStorage.getItem("richi_jira_goals");
    if (savedGoals) {
        goals = JSON.parse(savedGoals);
    } else {
        goals = [...DEFAULT_GOALS];
        saveGoals();
    }
    
    setupEventListeners();
    renderStats();
    renderBoard();
}

function saveGoals() {
    localStorage.setItem("richi_jira_goals", JSON.stringify(goals));
}

// Get next ticket key (RICH-X)
function getNextTicketKey() {
    let maxNum = 0;
    goals.forEach(g => {
        if (g.key && g.key.startsWith("RICH-")) {
            const num = parseInt(g.key.split("-")[1]);
            if (!isNaN(num) && num > maxNum) {
                maxNum = num;
            }
        }
    });
    return `RICH-${maxNum + 1}`;
}

// ==========================================================================
// EVENT LISTENERS
// ==========================================================================

function setupEventListeners() {
    // Quick Add Form
    document.getElementById("quick-add-form").addEventListener("submit", (e) => {
        e.preventDefault();
        
        const input = document.getElementById("goal-input");
        const title = input.value.trim();
        if (!title) return;
        
        const priority = document.getElementById("goal-priority").value;
        const selectedThemeEl = document.querySelector('input[name="goal-theme"]:checked');
        const theme = selectedThemeEl ? selectedThemeEl.value : "theme-purple";
        
        const newGoal = {
            id: "goal-" + Date.now(),
            key: getNextTicketKey(),
            title: title,
            theme: theme,
            priority: priority,
            status: "todo",
            completedDate: null,
            checklist: []
        };
        
        goals.push(newGoal); // Add to end (backlog style)
        saveGoals();
        
        input.value = "";
        document.getElementById("goal-priority").value = "media";
        // Reset theme selector to first option
        document.querySelector('input[name="goal-theme"]').checked = true;
        
        renderStats();
        renderBoard();
    });
}

// ==========================================================================
// TICKET WORKFLOW & STATUS OPERATIONS
// ==========================================================================

function changeGoalStatus(id, newStatus, event) {
    const index = goals.findIndex(g => g.id === id);
    if (index === -1) return;
    
    const oldStatus = goals[index].status;
    if (oldStatus === newStatus) return;
    
    goals[index].status = newStatus;
    goals[index].completedDate = newStatus === "done" ? new Date().toISOString().split('T')[0] : null;
    goals[index].completed = newStatus === "done";
    
    // Close editing just in case
    if (editingId === id) editingId = null;
    
    saveGoals();
    renderStats();
    renderBoard();
    
    // Trigger confetti if moved to "done" (Logrado)
    if (newStatus === "done") {
        if (event && event.target) {
            const rect = event.target.getBoundingClientRect();
            triggerConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
        } else {
            triggerConfetti();
        }
    }
}

function deleteGoal(id) {
    if (confirm("¿Estás seguro de que quieres eliminar este ticket de la lista?")) {
        goals = goals.filter(g => g.id !== id);
        if (editingId === id) editingId = null;
        saveGoals();
        renderStats();
        renderBoard();
    }
}

// Inline editing functions
function startInlineEdit(id) {
    editingId = id;
    renderBoard();
    
    // Focus the inline input field
    setTimeout(() => {
        const input = document.getElementById(`inline-input-${id}`);
        if (input) {
            input.focus();
            input.select();
        }
    }, 50);
}

function cancelInlineEdit() {
    editingId = null;
    renderBoard();
}

function saveInlineEdit(id) {
    const input = document.getElementById(`inline-input-${id}`);
    if (!input) return;
    
    const newTitle = input.value.trim();
    if (!newTitle) return;
    
    const index = goals.findIndex(g => g.id === id);
    if (index !== -1) {
        goals[index].title = newTitle;
        saveGoals();
    }
    
    editingId = null;
    renderBoard();
}

// ==========================================================================
// SUB-TASKS CHECKLIST OPERATIONS
// ==========================================================================

function toggleChecklistItem(goalId, itemId) {
    const goalIndex = goals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) return;
    
    const itemIndex = goals[goalIndex].checklist.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;
    
    goals[goalIndex].checklist[itemIndex].done = !goals[goalIndex].checklist[itemIndex].done;
    saveGoals();
    renderStats();
    renderBoard();
}

function addSubtask(goalId, event) {
    if (event) event.preventDefault();
    
    const input = document.getElementById(`subtask-input-${goalId}`);
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    const goalIndex = goals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) return;
    
    const newItem = {
        id: "sub-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        text: text,
        done: false
    };
    
    if (!goals[goalIndex].checklist) {
        goals[goalIndex].checklist = [];
    }
    
    goals[goalIndex].checklist.push(newItem);
    saveGoals();
    
    input.value = "";
    renderBoard();
}

// ==========================================================================
// RENDERING FUNCTIONS
// ==========================================================================

function renderStats() {
    const total = goals.length;
    const completed = goals.filter(g => g.status === "done").length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById("progress-text").textContent = `${completed} de ${total} completados 🌟`;
    document.getElementById("progress-bar-fill").style.width = `${percentage}%`;
    
    // Update badge counters
    document.getElementById("badge-todo").textContent = goals.filter(g => g.status === "todo").length;
    document.getElementById("badge-progress").textContent = goals.filter(g => g.status === "progress").length;
    document.getElementById("badge-done").textContent = completed;
}

function renderBoard() {
    const todoList = document.getElementById("todo-list");
    const progressList = document.getElementById("progress-list");
    const doneList = document.getElementById("done-list");
    
    todoList.innerHTML = "";
    progressList.innerHTML = "";
    doneList.innerHTML = "";
    
    const todoGoals = goals.filter(g => g.status === "todo");
    const progressGoals = goals.filter(g => g.status === "progress");
    const doneGoals = goals.filter(g => g.status === "done");
    
    // Render Column 1 (Ideas / Todo)
    if (todoGoals.length === 0) {
        todoList.innerHTML = `
            <div class="column-empty">
                <div class="column-empty-icon">💡</div>
                <div class="column-empty-text">No hay ideas pendientes.<br>¡Crea una arriba!</div>
            </div>
        `;
    } else {
        todoGoals.forEach(goal => {
            todoList.appendChild(createCardElement(goal));
        });
    }
    
    // Render Column 2 (En Progreso)
    if (progressGoals.length === 0) {
        progressList.innerHTML = `
            <div class="column-empty">
                <div class="column-empty-icon">🏃‍♂️</div>
                <div class="column-empty-text">No hay metas activas.<br>Mueve alguna meta aquí para empezar.</div>
            </div>
        `;
    } else {
        progressGoals.forEach(goal => {
            progressList.appendChild(createCardElement(goal));
        });
    }
    
    // Render Column 3 (Logrados)
    if (doneGoals.length === 0) {
        doneList.innerHTML = `
            <div class="column-empty">
                <div class="column-empty-icon">🎉</div>
                <div class="column-empty-text">Aún no hay logros celebrados.<br>¡Mueve una meta aquí al cumplirla!</div>
            </div>
        `;
    } else {
        doneGoals.forEach(goal => {
            doneList.appendChild(createCardElement(goal));
        });
    }
}

function createCardElement(goal) {
    const card = document.createElement("article");
    card.className = `kanban-card ${goal.theme} ${goal.status === 'done' ? 'is-completed' : ''}`;
    card.id = `card-${goal.id}`;
    
    const isEditing = editingId === goal.id;
    
    if (isEditing) {
        card.innerHTML = `
            <div class="inline-edit-form">
                <label style="font-size:0.75rem; color:var(--text-secondary);">Editar título del ticket:</label>
                <input type="text" class="inline-edit-input" id="inline-input-${goal.id}" value="${escapeHTML(goal.title)}" onkeydown="handleInlineKeyDown('${goal.id}', event)">
                <div class="inline-edit-actions">
                    <button class="btn-inline-save" onclick="saveInlineEdit('${goal.id}')">Guardar</button>
                    <button class="btn-inline-cancel" onclick="cancelInlineEdit()">Cancelar</button>
                </div>
            </div>
        `;
    } else {
        // Build checklist HTML
        const checklist = goal.checklist || [];
        const checkedCount = checklist.filter(item => item.done).length;
        const totalCount = checklist.length;
        
        let checklistHTML = "";
        if (totalCount > 0 || goal.status !== 'done') {
            checklistHTML = `
                <div class="card-checklist-container">
                    <div class="checklist-title-wrapper">
                        <span class="checklist-title">Sub-tareas</span>
                        ${totalCount > 0 ? `<span class="checklist-progress-text">${checkedCount}/${totalCount}</span>` : ''}
                    </div>
                    <ul class="checklist-items-list">
                        ${checklist.map(item => `
                            <li class="checklist-item ${item.done ? 'is-done' : ''}">
                                <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleChecklistItem('${goal.id}', '${item.id}')">
                                <span>${escapeHTML(item.text)}</span>
                            </li>
                        `).join('')}
                    </ul>
                    ${goal.status !== 'done' ? `
                        <form class="add-subtask-form" onsubmit="addSubtask('${goal.id}', event)">
                            <input type="text" class="add-subtask-input" id="subtask-input-${goal.id}" placeholder="Añadir sub-tarea..." autocomplete="off" required>
                            <button type="submit" class="btn-subtask-add">+</button>
                        </form>
                    ` : ''}
                </div>
            `;
        }

        // Build main ticket body
        card.innerHTML = `
            <div class="card-ticket-header">
                <span class="ticket-key">${goal.key}</span>
                <span class="ticket-priority priority-${goal.priority}">
                    ${goal.priority === 'alta' ? '🔥 Urgente' : goal.priority === 'media' ? '⭐ Pronto' : '☕ Con Calma'}
                </span>
            </div>
            
            <span class="card-title-text">${escapeHTML(goal.title)}</span>
            
            ${checklistHTML}
            
            <div class="card-actions">
                <div class="card-actions-left">
                    ${goal.status !== 'done' ? `
                        <button class="btn-card-icon edit" onclick="startInlineEdit('${goal.id}')" title="Editar título">
                            ${ICONS.edit}
                        </button>
                    ` : ''}
                    <button class="btn-card-icon delete" onclick="deleteGoal('${goal.id}')" title="Eliminar ticket">
                        ${ICONS.trash}
                    </button>
                </div>
                
                <!-- Status Workflow Selector -->
                <select class="btn-status-dropdown" onchange="changeGoalStatus('${goal.id}', this.value, event)" title="Cambiar estado del ticket">
                    <option value="todo" ${goal.status === 'todo' ? 'selected' : ''}>💡 Idea</option>
                    <option value="progress" ${goal.status === 'progress' ? 'selected' : ''}>🏃‍♂️ Progreso</option>
                    <option value="done" ${goal.status === 'done' ? 'selected' : ''}>🎉 Logrado</option>
                </select>
            </div>
        `;
    }
    
    return card;
}

// Keydown helper inside inline input
function handleInlineKeyDown(id, event) {
    if (event.key === 'Enter') {
        saveInlineEdit(id);
    } else if (event.key === 'Escape') {
        cancelInlineEdit();
    }
}

// Helpers
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Global scope bindings for actions
window.startInlineEdit = startInlineEdit;
window.cancelInlineEdit = cancelInlineEdit;
window.saveInlineEdit = saveInlineEdit;
window.deleteGoal = deleteGoal;
window.changeGoalStatus = changeGoalStatus;
window.toggleChecklistItem = toggleChecklistItem;
window.addSubtask = addSubtask;
window.handleInlineKeyDown = handleInlineKeyDown;

// ==========================================================================
// CONFETTI SYSTEM ENGINE (CANVAS-BASED)
// ==========================================================================

const canvas = document.getElementById("confetti-canvas");
const ctx = canvas.getContext("2d");
let particles = [];
let animationFrameId = null;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

class ConfettiParticle {
    constructor(x, y, isSideCannon = false, side = 'left') {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 6;
        
        const colors = [
            '#a855f7', '#3b82f6', '#10b981', '#f43f5e', '#eab308', 
            '#06b6d4', '#f97316', '#ff007f', '#39ff14'
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        if (isSideCannon) {
            this.speedX = side === 'left' ? (Math.random() * 8 + 8) : -(Math.random() * 8 + 8);
            this.speedY = -(Math.random() * 12 + 14);
        } else {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 10 + 3;
            this.speedX = Math.cos(angle) * velocity;
            this.speedY = Math.sin(angle) * velocity - 2;
        }
        
        this.gravity = Math.random() * 0.15 + 0.25;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
        this.opacity = 1.0;
        this.fadeSpeed = Math.random() * 0.008 + 0.008;
        this.shape = Math.random() > 0.6 ? 'circle' : (Math.random() > 0.5 ? 'triangle' : 'rect');
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.speedX *= 0.98;
        this.rotation += this.rotationSpeed;
        this.opacity -= this.fadeSpeed;
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        
        ctx.beginPath();
        if (this.shape === 'rect') {
            ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
        } else if (this.shape === 'circle') {
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'triangle') {
            ctx.moveTo(0, -this.size / 2);
            ctx.lineTo(this.size / 2, this.size / 2);
            ctx.lineTo(-this.size / 2, this.size / 2);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
}

function triggerConfetti(clickX = null, clickY = null) {
    if (clickX !== null && clickY !== null) {
        for (let i = 0; i < 35; i++) {
            particles.push(new ConfettiParticle(clickX, clickY));
        }
    }
    
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    for (let i = 0; i < 50; i++) {
        particles.push(new ConfettiParticle(10, screenHeight - 10, true, 'left'));
    }
    
    for (let i = 0; i < 50; i++) {
        particles.push(new ConfettiParticle(screenWidth - 10, screenHeight - 10, true, 'right'));
    }
    
    if (!animationFrameId) {
        loop();
    }
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles = particles.filter(p => p.opacity > 0 && p.y < canvas.height && p.x > 0 && p.x < canvas.width);
    
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    
    if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(loop);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animationFrameId = null;
    }
}

// Start the app
window.onload = initApp;
