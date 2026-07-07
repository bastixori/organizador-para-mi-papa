// ==========================================================================
// CONFIGURATION & SEED DATA (SIMPLE KANBAN EMERALD)
// ==========================================================================

const DEFAULT_GOALS = [
    { id: "goal-1", title: "Querer a la familia", completed: true },
    { id: "goal-2", title: "Divorciarse", completed: true }
];

const SVG_ICONS = {
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    undo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`
};

// ==========================================================================
// STATE MANAGEMENT
// ==========================================================================

let goals = [];

// Initialize App
function initApp() {
    const savedGoals = localStorage.getItem("richi_simple_kanban_goals");
    if (savedGoals) {
        goals = JSON.parse(savedGoals);
    } else {
        goals = [...DEFAULT_GOALS];
        saveGoals();
    }
    
    setupEventListeners();
    renderStats();
    renderBoard();

    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('Service Worker registrado:', reg.scope))
                .catch(err => console.log('Error al registrar Service Worker:', err));
        });
    }
}

function saveGoals() {
    localStorage.setItem("richi_simple_kanban_goals", JSON.stringify(goals));
}

// ==========================================================================
// EVENT LISTENERS
// ==========================================================================

function setupEventListeners() {
    // Add goal form submission
    document.getElementById("add-form").addEventListener("submit", (e) => {
        e.preventDefault();
        
        const input = document.getElementById("goal-input");
        const title = input.value.trim();
        if (!title) return;
        
        const newGoal = {
            id: "goal-" + Date.now(),
            title: title,
            completed: false
        };
        
        goals.unshift(newGoal);
        saveGoals();
        
        input.value = "";
        
        renderStats();
        renderBoard();
    });
}

// ==========================================================================
// OPERATIONS
// ==========================================================================

function toggleComplete(id, event) {
    const index = goals.findIndex(g => g.id === id);
    if (index === -1) return;
    
    const isNowCompleted = !goals[index].completed;
    goals[index].completed = isNowCompleted;
    
    saveGoals();
    renderStats();
    renderBoard();
    
    // Trigger confetti if completed
    if (isNowCompleted) {
        if (event && event.target) {
            const rect = event.target.getBoundingClientRect();
            triggerConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
        } else {
            triggerConfetti();
        }
    }
}

function deleteGoal(id) {
    if (confirm("¿Estás seguro de querer borrar esta meta de tu tablero?")) {
        goals = goals.filter(g => g.id !== id);
        saveGoals();
        renderStats();
        renderBoard();
    }
}

// ==========================================================================
// RENDER FUNCTIONS
// ==========================================================================

function renderStats() {
    const total = goals.length;
    const completed = goals.filter(g => g.completed).length;
    
    document.getElementById("progress-counter").textContent = `${completed} de ${total} logrados`;
}

function renderBoard() {
    const todoList = document.getElementById("todo-list");
    const doneList = document.getElementById("done-list");
    
    todoList.innerHTML = "";
    doneList.innerHTML = "";
    
    const todoGoals = goals.filter(g => !g.completed);
    const doneGoals = goals.filter(g => g.completed);
    
    // Update column badge counters
    document.getElementById("badge-todo").textContent = todoGoals.length;
    document.getElementById("badge-done").textContent = doneGoals.length;
    
    // Render Column 1 (Por Vivir)
    if (todoGoals.length === 0) {
        todoList.innerHTML = `
            <div class="column-empty">
                <div class="column-empty-icon">💡</div>
                <div class="column-empty-text">No hay metas pendientes.<br>¡Añade una arriba!</div>
            </div>
        `;
    } else {
        todoGoals.forEach(goal => {
            todoList.appendChild(createCardElement(goal));
        });
    }
    
    // Render Column 2 (Logrado)
    if (doneGoals.length === 0) {
        doneList.innerHTML = `
            <div class="column-empty">
                <div class="column-empty-icon">✨</div>
                <div class="column-empty-text">Aún no hay logros marcados.<br>¡Pulsa "Logrado!" al cumplirlos!</div>
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
    card.className = `kanban-card ${goal.completed ? 'is-completed' : ''}`;
    
    card.innerHTML = `
        <span class="card-text">${escapeHTML(goal.title)}</span>
        <div class="card-actions">
            <button class="btn-delete" onclick="deleteGoal('${goal.id}')" title="Eliminar meta">
                ${SVG_ICONS.trash}
            </button>
            <button class="btn-move" onclick="toggleComplete('${goal.id}', event)" title="${goal.completed ? 'Mover a Por Vivir' : 'Mover a Logrado!'}">
                ${goal.completed ? SVG_ICONS.undo : SVG_ICONS.check}
                <span>${goal.completed ? 'Por Hacer' : 'Logrado!'}</span>
            </button>
        </div>
    `;
    
    return card;
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Global scope bindings
window.toggleComplete = toggleComplete;
window.deleteGoal = deleteGoal;

// ==========================================================================
// CONFETTI ENGINE (HTML5 CANVAS)
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
            '#10b981', '#34d399', '#059669', '#6ee7b7', '#047857', 
            '#a7f3d0', '#f43f5e', '#3b82f6', '#fbbf24', '#f97316'
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
