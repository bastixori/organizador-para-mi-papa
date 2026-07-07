// ==========================================================================
// CONFIGURATION & DUMMY DATA SEED
// ==========================================================================

const DEFAULT_GOALS = [
    {
        id: "seed-1",
        title: "Viajar a la Patagonia chilena en familia",
        theme: "theme-purple",
        completed: false,
        completedDate: null
    },
    {
        id: "seed-2",
        title: "Hacer un gran asado de campo para todos mis amigos",
        theme: "theme-amber",
        completed: false,
        completedDate: null
    },
    {
        id: "seed-3",
        title: "Visitar a mis primos en el sur y recorrer viejos lugares",
        theme: "theme-blue",
        completed: true,
        completedDate: "2026-07-01"
    },
    {
        id: "seed-4",
        title: "Aprender a tocar en guitarra una canción de los Beatles",
        theme: "theme-green",
        completed: false,
        completedDate: null
    },
    {
        id: "seed-5",
        title: "Ir a ver un partido de la Selección en el estadio",
        theme: "theme-rose",
        completed: false,
        completedDate: null
    }
];

// SVG Icons Constants
const ICONS = {
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    undo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>`
};

// ==========================================================================
// STATE MANAGEMENT
// ==========================================================================

let goals = [];
let editingId = null; // Track which card is in inline edit mode

// Initialize App
function initApp() {
    const savedGoals = localStorage.getItem("richi_kanban_goals");
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
    localStorage.setItem("richi_kanban_goals", JSON.stringify(goals));
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
        
        const selectedThemeEl = document.querySelector('input[name="goal-theme"]:checked');
        const theme = selectedThemeEl ? selectedThemeEl.value : "theme-purple";
        
        const newGoal = {
            id: "goal-" + Date.now(),
            title: title,
            theme: theme,
            completed: false,
            completedDate: null
        };
        
        goals.unshift(newGoal);
        saveGoals();
        
        input.value = "";
        // Reset theme selector to first option
        document.querySelector('input[name="goal-theme"]').checked = true;
        
        renderStats();
        renderBoard();
    });
}

// ==========================================================================
// CARD OPERATIONS
// ==========================================================================

function toggleComplete(id, event) {
    const index = goals.findIndex(g => g.id === id);
    if (index === -1) return;
    
    const isNowCompleted = !goals[index].completed;
    goals[index].completed = isNowCompleted;
    goals[index].completedDate = isNowCompleted ? new Date().toISOString().split('T')[0] : null;
    
    // Cancel editing if we toggle
    if (editingId === id) {
        editingId = null;
    }
    
    saveGoals();
    renderStats();
    renderBoard();

    // Trigger confetti from the location of the action or screen corners
    if (isNowCompleted) {
        if (event) {
            const rect = event.target.getBoundingClientRect();
            triggerConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
        } else {
            triggerConfetti();
        }
    }
}

function deleteGoal(id) {
    if (confirm("¿Estás seguro de que quieres eliminar esta meta de la lista?")) {
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
// RENDER BOARD FUNCTIONS
// ==========================================================================

function renderStats() {
    const total = goals.length;
    const completed = goals.filter(g => g.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById("progress-text").textContent = `${completed} de ${total} logrados 🌟`;
    document.getElementById("progress-bar-fill").style.width = `${percentage}%`;
    
    // Update badge counters
    document.getElementById("badge-todo").textContent = total - completed;
    document.getElementById("badge-done").textContent = completed;
}

function renderBoard() {
    const todoList = document.getElementById("todo-list");
    const doneList = document.getElementById("done-list");
    
    // Clean list contents
    todoList.innerHTML = "";
    doneList.innerHTML = "";
    
    const todoGoals = goals.filter(g => !g.completed);
    const doneGoals = goals.filter(g => g.completed);
    
    // Render Todo column
    if (todoGoals.length === 0) {
        todoList.innerHTML = `
            <div class="column-empty">
                <div class="column-empty-icon">📝</div>
                <div class="column-empty-text">No hay metas por ahora.<br>¡Escribe una arriba!</div>
            </div>
        `;
    } else {
        todoGoals.forEach(goal => {
            const card = createCardElement(goal);
            todoList.appendChild(card);
        });
    }
    
    // Render Done column
    if (doneGoals.length === 0) {
        doneList.innerHTML = `
            <div class="column-empty">
                <div class="column-empty-icon">✨</div>
                <div class="column-empty-text">Aún no hay logros marcados.<br>¡A por ellos!</div>
            </div>
        `;
    } else {
        doneGoals.forEach(goal => {
            const card = createCardElement(goal);
            doneList.appendChild(card);
        });
    }
}

function createCardElement(goal) {
    const card = document.createElement("article");
    card.className = `kanban-card ${goal.theme} ${goal.completed ? 'is-completed' : ''}`;
    card.id = `card-${goal.id}`;
    
    const isEditing = editingId === goal.id;
    
    if (isEditing) {
        card.innerHTML = `
            <div class="inline-edit-form">
                <input type="text" class="inline-edit-input" id="inline-input-${goal.id}" value="${escapeHTML(goal.title)}" onkeydown="handleInlineKeyDown('${goal.id}', event)">
                <button class="btn-inline-save" onclick="saveInlineEdit('${goal.id}')">Guardar</button>
                <button class="btn-inline-cancel" onclick="cancelInlineEdit()">X</button>
            </div>
        `;
    } else {
        card.innerHTML = `
            <div class="card-content-area">
                <span class="card-text">${escapeHTML(goal.title)}</span>
            </div>
            <div class="card-actions">
                <div class="card-actions-left">
                    ${!goal.completed ? `
                        <button class="btn-card-icon edit" onclick="startInlineEdit('${goal.id}')" title="Editar meta">
                            ${ICONS.edit}
                        </button>
                    ` : ''}
                    <button class="btn-card-icon delete" onclick="deleteGoal('${goal.id}')" title="Eliminar de la lista">
                        ${ICONS.trash}
                    </button>
                </div>
                <button class="btn-toggle-status" onclick="toggleComplete('${goal.id}', event)" title="${goal.completed ? 'Desmarcar logro y devolver a Metas' : '¡Logrado! Marcar como completado'}">
                    ${goal.completed ? ICONS.undo : ICONS.check}
                    <span>${goal.completed ? 'Deshacer' : 'Logrado!'}</span>
                </button>
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
window.toggleComplete = toggleComplete;
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
