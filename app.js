// ==========================================================================
// CONFIGURATION & SEED DATA (CLOUD-SYNC KANBAN EMERALD)
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

const API_BASE = "https://jsonbin-zeta.vercel.app/api/bins";

// ==========================================================================
// STATE MANAGEMENT
// ==========================================================================

let goals = [];
let binId = null;
let syncIntervalId = null;

// Initialize App
async function initApp() {
    setupEventListeners();
    
    // Parse URL query parameter "?id=..."
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get("id");
    
    if (idParam) {
        binId = idParam;
        localStorage.setItem("richi_cloud_bin_id", binId);
        
        // Show share banner with link
        setupShareLink();
        
        // Load data from Cloud Database
        await loadCloudData();
        
        // Start auto-sync interval (every 10 seconds to detect changes from other devices)
        startAutoSync();
    } else {
        // No ID in URL. Check if we have a saved ID in localStorage
        const savedBinId = localStorage.getItem("richi_cloud_bin_id");
        if (savedBinId) {
            // Redirect to URL with ID to enable sharing
            window.location.search = `?id=${savedBinId}`;
        } else {
            // No saved ID. Create a new cloud bin database on the fly!
            await createCloudDatabase();
        }
    }
    
    setupMusic();
}

// Create new cloud bin database
async function createCloudDatabase() {
    const progressCounter = document.getElementById("progress-counter");
    progressCounter.textContent = "Creando base de datos...";
    
    try {
        const response = await fetch(API_BASE, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ goals: DEFAULT_GOALS })
        });
        
        if (!response.ok) throw new Error("Error creating bin");
        
        const result = await response.json();
        binId = result.id;
        
        localStorage.setItem("richi_cloud_bin_id", binId);
        
        // Redirect to URL with ID
        window.location.search = `?id=${binId}`;
    } catch (err) {
        console.error("Failed to initialize cloud database:", err);
        progressCounter.textContent = "Error al conectar con la nube";
        // Fallback to local storage
        goals = [...DEFAULT_GOALS];
        renderStats();
        renderBoard();
    }
}

// Load goals from Cloud Database
async function loadCloudData() {
    const progressCounter = document.getElementById("progress-counter");
    const originalText = progressCounter.textContent;
    progressCounter.textContent = "Cargando...";
    
    try {
        const response = await fetch(`${API_BASE}/${binId}`);
        if (!response.ok) throw new Error("Error loading data");
        
        const result = await response.json();
        
        // npoint/jsonbin compatibility: make sure we load goals correctly
        goals = result.goals || [];
        
        renderStats();
        renderBoard();
    } catch (err) {
        console.error("Failed to load cloud data:", err);
        progressCounter.textContent = "Error de conexión 📶";
        // Load fallback from local backup if available
        const backup = localStorage.getItem("richi_local_backup");
        if (backup) {
            goals = JSON.parse(backup);
            renderStats();
            renderBoard();
        }
    }
}

// Save goals to Cloud Database (called on every action)
async function saveGoals() {
    // Save local backup first
    localStorage.setItem("richi_local_backup", JSON.stringify(goals));
    
    if (!binId) return;
    
    try {
        await fetch(`${API_BASE}/${binId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ goals: goals })
        });
    } catch (err) {
        console.error("Failed to save goals to cloud:", err);
    }
}

// Auto-sync loop: checks if database changed in background
function startAutoSync() {
    if (syncIntervalId) clearInterval(syncIntervalId);
    
    syncIntervalId = setInterval(async () => {
        if (!binId) return;
        
        try {
            const response = await fetch(`${API_BASE}/${binId}`);
            if (!response.ok) return;
            
            const result = await response.json();
            const cloudGoals = result.goals || [];
            
            // Compare stringified versions. If different, update & re-render.
            // This prevents flickering and only updates when actual changes occur!
            if (JSON.stringify(cloudGoals) !== JSON.stringify(goals)) {
                console.log("Cambios detectados en la nube. Sincronizando...");
                goals = cloudGoals;
                renderStats();
                renderBoard();
            }
        } catch (e) {
            // Silently ignore sync connection errors
        }
    }, 10000); // Sync every 10 seconds
}

// Setup the share link banner
function setupShareLink() {
    const shareBanner = document.getElementById("share-banner");
    const shareUrlInput = document.getElementById("share-url");
    const btnCopy = document.getElementById("btn-copy");
    
    if (!shareBanner || !shareUrlInput || !btnCopy) return;
    
    const currentUrl = window.location.href;
    shareUrlInput.value = currentUrl;
    shareBanner.style.display = "flex";
    
    btnCopy.addEventListener("click", () => {
        shareUrlInput.select();
        shareUrlInput.setSelectionRange(0, 99999); // Mobile compatibility
        
        navigator.clipboard.writeText(currentUrl).then(() => {
            btnCopy.textContent = "¡Copiado!";
            btnCopy.style.background = "#059669";
            btnCopy.style.color = "#fff";
            
            setTimeout(() => {
                btnCopy.textContent = "Copiar";
                btnCopy.style.background = "";
                btnCopy.style.color = "";
            }, 2000);
        }).catch(err => {
            console.error("Error al copiar enlace:", err);
        });
    });
}

// ==========================================================================
// EVENT LISTENERS
// ==========================================================================

function setupEventListeners() {
    // Add goal form submission
    document.getElementById("add-form").addEventListener("submit", async (e) => {
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
        
        // Optimistic UI update
        renderStats();
        renderBoard();
        
        input.value = "";
        
        // Save to cloud in background
        await saveGoals();
    });
}

// ==========================================================================
// OPERATIONS
// ==========================================================================

async function toggleComplete(id, event) {
    const index = goals.findIndex(g => g.id === id);
    if (index === -1) return;
    
    const isNowCompleted = !goals[index].completed;
    goals[index].completed = isNowCompleted;
    
    // Optimistic UI update
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
    
    // Save to cloud
    await saveGoals();
}

async function deleteGoal(id) {
    if (confirm("¿Estás seguro de querer borrar esta meta de tu tablero?")) {
        goals = goals.filter(g => g.id !== id);
        
        // Optimistic UI update
        renderStats();
        renderBoard();
        
        // Save to cloud
        await saveGoals();
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

// ==========================================================================
// BACKGROUND MUSIC CONTROL
// ==========================================================================

function setupMusic() {
    const music = document.getElementById("bg-music");
    const btn = document.getElementById("btn-music");
    if (!music || !btn) return;
    
    music.volume = 0.12; // Pleasant background volume
    
    let isPlaying = false;
    
    function playMusic() {
        music.play().then(() => {
            isPlaying = true;
            btn.textContent = "🔊";
            btn.setAttribute("title", "Silenciar música");
        }).catch(err => {
            console.log("Autoplay bloqueado. Esperando interacción...");
        });
    }
    
    function pauseMusic() {
        music.pause();
        isPlaying = false;
        btn.textContent = "🔇";
        btn.setAttribute("title", "Activar música");
    }
    
    btn.addEventListener("click", () => {
        if (isPlaying) {
            pauseMusic();
        } else {
            playMusic();
        }
    });
    
    // Auto-play workaround: play on first click/tap on screen
    const startOnInteraction = () => {
        if (!isPlaying) {
            playMusic();
        }
        document.removeEventListener("click", startOnInteraction);
        document.removeEventListener("touchstart", startOnInteraction);
    };
    
    document.addEventListener("click", startOnInteraction);
    document.addEventListener("touchstart", startOnInteraction);
}

// Start the app
window.onload = initApp;
