// ==========================================================================
// CONFIGURATION & DUMMY DATA SEED
// ==========================================================================

const DEFAULT_DREAMS = [
    {
        id: "seed-1",
        title: "Viajar a la Patagonia chilena en familia",
        category: "viaje",
        priority: "alta",
        date: "Próximo verano",
        notes: "Ver los glaciares, alquilar una cabaña frente al lago y hacer caminatas cortas todos juntos.",
        theme: "theme-purple",
        completed: false,
        completedDate: null
    },
    {
        id: "seed-2",
        title: "Hacer un gran asado de campo para todos mis amigos",
        category: "crear",
        priority: "media",
        date: "Primavera 2026",
        notes: "Aprender a hacer cordero al palo con leña de aromo y pasar toda la tarde conversando.",
        theme: "theme-amber",
        completed: false,
        completedDate: null
    },
    {
        id: "seed-3",
        title: "Visitar a mis primos en el sur y recorrer viejos lugares",
        category: "familia",
        priority: "alta",
        date: "Octubre 2026",
        notes: "Llevar la cámara de fotos y recolectar anécdotas de la infancia.",
        theme: "theme-blue",
        completed: true,
        completedDate: "2026-07-01"
    },
    {
        id: "seed-4",
        title: "Aprender a tocar en guitarra mi canción favorita de los Beatles",
        category: "crear",
        priority: "baja",
        date: "Sin prisa",
        notes: "Practicar 15 minutos al día. Pedirle ayuda a los chicos si me cuesta algún acorde.",
        theme: "theme-green",
        completed: false,
        completedDate: null
    },
    {
        id: "seed-5",
        title: "Ir a ver un partido de la Selección en el estadio nacional",
        category: "deseo",
        priority: "media",
        date: "Próximas eliminatorias",
        notes: "Vivir el ambiente del estadio, comer algo rico afuera y gritar los goles.",
        theme: "theme-rose",
        completed: false,
        completedDate: null
    }
];

// SVG Icons Constants
const ICONS = {
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="18" y2="10"></line></svg>`,
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
};

const CATEGORIES = {
    viaje: { label: "Viajes & Aventuras", emoji: "✈️" },
    familia: { label: "Familia & Amigos", emoji: "👥" },
    crear: { label: "Aprender & Crear", emoji: "💡" },
    deseo: { label: "Sueños & Deseos", emoji: "🌟" }
};

// ==========================================================================
// STATE MANAGEMENT
// ==========================================================================

let dreams = [];
let currentFilters = {
    search: "",
    status: "all",
    category: "all"
};

// Initialize App
function initApp() {
    const savedDreams = localStorage.getItem("richi_dreams");
    if (savedDreams) {
        dreams = JSON.parse(savedDreams);
    } else {
        dreams = [...DEFAULT_DREAMS];
        saveDreams();
    }
    
    setupEventListeners();
    renderStats();
    renderDreams();
}

function saveDreams() {
    localStorage.setItem("richi_dreams", JSON.stringify(dreams));
}

// ==========================================================================
// EVENT LISTENERS
// ==========================================================================

function setupEventListeners() {
    // Add Dream Modals Triggers
    document.getElementById("btn-add-dream-header").addEventListener("click", () => openModal());
    document.getElementById("btn-add-dream-empty").addEventListener("click", () => openModal());
    
    // Modal Close Triggers
    document.getElementById("btn-close-modal").addEventListener("click", closeModal);
    document.getElementById("btn-cancel-modal").addEventListener("click", closeModal);
    
    // Modal Form Submit
    document.getElementById("dream-form").addEventListener("submit", handleFormSubmit);
    
    // Search input
    document.getElementById("search-input").addEventListener("input", (e) => {
        currentFilters.search = e.target.value.toLowerCase().trim();
        renderDreams();
    });

    // Status Filter Tabs
    const statusTabs = document.querySelectorAll("#status-filters .filter-tab");
    statusTabs.forEach(tab => {
        tab.addEventListener("click", (e) => {
            statusTabs.forEach(t => t.classList.remove("active"));
            e.target.classList.add("active");
            currentFilters.status = e.target.getAttribute("data-status");
            renderDreams();
        });
    });

    // Category Filter Buttons
    const catButtons = document.querySelectorAll("#category-filters .category-btn");
    catButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            catButtons.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            currentFilters.category = e.target.getAttribute("data-category");
            renderDreams();
        });
    });

    // Close modal on background click
    document.getElementById("dream-modal").addEventListener("click", (e) => {
        if (e.target.id === "dream-modal") {
            closeModal();
        }
    });
}

// ==========================================================================
// MODAL LOGIC
// ==========================================================================

function openModal(dreamId = null) {
    const modal = document.getElementById("dream-modal");
    const form = document.getElementById("dream-form");
    const titleEl = document.getElementById("modal-title");
    
    form.reset();
    document.getElementById("dream-id").value = "";
    
    if (dreamId) {
        titleEl.textContent = "Editar mi Sueño";
        const dream = dreams.find(d => d.id === dreamId);
        if (dream) {
            document.getElementById("dream-id").value = dream.id;
            document.getElementById("dream-title").value = dream.title;
            document.getElementById("dream-category").value = dream.category;
            document.getElementById("dream-priority").value = dream.priority;
            document.getElementById("dream-date").value = dream.date || "";
            document.getElementById("dream-notes").value = dream.notes || "";
            
            // Set active theme
            const themeRadios = form.querySelectorAll('input[name="dream-theme"]');
            themeRadios.forEach(radio => {
                radio.checked = radio.value === dream.theme;
            });
        }
    } else {
        titleEl.textContent = "Agregar Nuevo Sueño";
    }
    
    modal.classList.add("is-active");
    document.body.style.overflow = "hidden"; // Prevent background scroll
    
    // Focus on title
    setTimeout(() => {
        document.getElementById("dream-title").focus();
    }, 100);
}

function closeModal() {
    const modal = document.getElementById("dream-modal");
    modal.classList.remove("is-active");
    document.body.style.overflow = "";
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById("dream-id").value;
    const title = document.getElementById("dream-title").value.trim();
    const category = document.getElementById("dream-category").value;
    const priority = document.getElementById("dream-priority").value;
    const date = document.getElementById("dream-date").value.trim();
    const notes = document.getElementById("dream-notes").value.trim();
    const theme = document.querySelector('input[name="dream-theme"]:checked').value;
    
    if (id) {
        // Edit existing
        const index = dreams.findIndex(d => d.id === id);
        if (index !== -1) {
            dreams[index] = {
                ...dreams[index],
                title,
                category,
                priority,
                date,
                notes,
                theme
            };
        }
    } else {
        // Add new
        const newDream = {
            id: 'dream-' + Date.now(),
            title,
            category,
            priority,
            date,
            notes,
            theme,
            completed: false,
            completedDate: null
        };
        dreams.unshift(newDream);
    }
    
    saveDreams();
    closeModal();
    renderStats();
    renderDreams();
}

// ==========================================================================
// CARD OPERATIONS
// ==========================================================================

function toggleComplete(id, event) {
    const index = dreams.findIndex(d => d.id === id);
    if (index === -1) return;
    
    const isNowCompleted = !dreams[index].completed;
    dreams[index].completed = isNowCompleted;
    dreams[index].completedDate = isNowCompleted ? new Date().toISOString().split('T')[0] : null;
    
    saveDreams();
    renderStats();
    renderDreams();

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

function deleteDream(id) {
    if (confirm("¿Estás seguro de que quieres eliminar este sueño del diario?")) {
        dreams = dreams.filter(d => d.id !== id);
        saveDreams();
        renderStats();
        renderDreams();
    }
}

// ==========================================================================
// RENDER & FILTER FUNCTIONS
// ==========================================================================

function renderStats() {
    const total = dreams.length;
    const completed = dreams.filter(d => d.completed).length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Animate stats numbers
    animateValue("stat-total", parseInt(document.getElementById("stat-total").textContent) || 0, total, 600);
    animateValue("stat-completed", parseInt(document.getElementById("stat-completed").textContent) || 0, completed, 600);
    animateValue("stat-pending", parseInt(document.getElementById("stat-pending").textContent) || 0, pending, 600);
    
    // Update progress bar
    const progressFill = document.getElementById("progress-bar-fill");
    const progressLabel = document.getElementById("progress-percentage");
    
    progressFill.style.width = `${percentage}%`;
    progressLabel.textContent = `${percentage}%`;
}

function animateValue(id, start, end, duration) {
    if (start === end) {
        document.getElementById(id).textContent = end;
        return;
    }
    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range)) || 20;
    const timer = setInterval(() => {
        current += increment;
        document.getElementById(id).textContent = current;
        if (current == end) {
            clearInterval(timer);
        }
    }, stepTime);
}

function renderDreams() {
    const board = document.getElementById("dreams-board");
    const emptyState = document.getElementById("empty-state");
    
    // Filter the dreams
    const filtered = dreams.filter(dream => {
        // Status filter
        if (currentFilters.status === "pending" && dream.completed) return false;
        if (currentFilters.status === "completed" && !dream.completed) return false;
        
        // Category filter
        if (currentFilters.category !== "all" && dream.category !== currentFilters.category) return false;
        
        // Search filter
        if (currentFilters.search) {
            const inTitle = dream.title.toLowerCase().includes(currentFilters.search);
            const inNotes = dream.notes && dream.notes.toLowerCase().includes(currentFilters.search);
            if (!inTitle && !inNotes) return false;
        }
        
        return true;
    });
    
    // Clean dynamic cards
    const existingCards = board.querySelectorAll(".dream-card");
    existingCards.forEach(c => c.remove());
    
    if (filtered.length === 0) {
        emptyState.style.display = "flex";
        if (dreams.length > 0) {
            emptyState.querySelector("h3").textContent = "No se encontraron resultados";
            emptyState.querySelector("p").textContent = "Prueba a cambiar los filtros de búsqueda o categoría.";
            document.getElementById("btn-add-dream-empty").style.display = "none";
        } else {
            emptyState.querySelector("h3").textContent = "El diario está en blanco";
            emptyState.querySelector("p").textContent = "Comienza a escribir los sueños y planes que quieres realizar. ¡El viaje empieza hoy!";
            document.getElementById("btn-add-dream-empty").style.display = "inline-flex";
        }
    } else {
        emptyState.style.display = "none";
        
        filtered.forEach(dream => {
            const card = createCardElement(dream);
            board.appendChild(card);
        });
    }
}

function createCardElement(dream) {
    const card = document.createElement("article");
    card.className = `dream-card ${dream.theme} ${dream.completed ? 'is-completed' : ''}`;
    card.id = `card-${dream.id}`;
    
    const cat = CATEGORIES[dream.category] || { label: "General", emoji: "✨" };
    
    // Build HTML Content safely
    card.innerHTML = `
        <div class="card-header">
            <span class="card-category-badge">
                <span>${cat.emoji}</span> ${cat.label}
            </span>
            <span class="card-priority priority-${dream.priority}">
                ${dream.priority === 'alta' ? '🔥 Esencial' : dream.priority === 'media' ? '⭐ Importante' : '⏳ Con calma'}
            </span>
        </div>
        <div class="card-body">
            <h3 class="card-title">${escapeHTML(dream.title)}</h3>
            ${dream.notes ? `<p class="card-desc">${escapeHTML(dream.notes)}</p>` : ''}
            ${dream.date ? `
                <div class="card-date">
                    ${ICONS.calendar}
                    <span>${escapeHTML(dream.date)}</span>
                </div>
            ` : ''}
            ${dream.completed && dream.completedDate ? `
                <div class="card-date" style="color: #10b981;">
                    ${ICONS.check}
                    <span>Cumplido el ${formatDate(dream.completedDate)}</span>
                </div>
            ` : ''}
        </div>
        <div class="card-footer">
            <div class="action-left">
                ${!dream.completed ? `
                    <button class="btn-card-action edit" onclick="openModal('${dream.id}')" title="Editar sueño">
                        ${ICONS.edit}
                    </button>
                ` : ''}
                <button class="btn-card-action delete" onclick="deleteDream('${dream.id}')" title="Eliminar sueño">
                    ${ICONS.trash}
                </button>
            </div>
            <button class="btn-complete" onclick="toggleComplete('${dream.id}', event)">
                ${ICONS.check}
                <span>${dream.completed ? 'Cumplido' : 'Cumplir'}</span>
            </button>
        </div>
    `;
    
    return card;
}

// Helpers
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

function formatDate(dateStr) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    try {
        const date = new Date(dateStr + "T00:00:00");
        return date.toLocaleDateString('es-ES', options);
    } catch (e) {
        return dateStr;
    }
}

// Attach functions to window scope to allow inline onclick handlers
window.openModal = openModal;
window.deleteDream = deleteDream;
window.toggleComplete = toggleComplete;

// ==========================================================================
// CONFETTI SYSTEM ENGINE (CANVAS-BASED)
// ==========================================================================

const canvas = document.getElementById("confetti-canvas");
const ctx = canvas.getContext("2d");
let particles = [];
let animationFrameId = null;

// Resize canvas
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
        
        // Curated vibrant colors
        const colors = [
            '#a855f7', '#3b82f6', '#10b981', '#f43f5e', '#eab308', 
            '#06b6d4', '#f97316', '#ff007f', '#00f6ff', '#39ff14'
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        if (isSideCannon) {
            // Shoots from corners upwards and inwards
            this.speedX = side === 'left' ? (Math.random() * 8 + 8) : -(Math.random() * 8 + 8);
            this.speedY = -(Math.random() * 12 + 14);
        } else {
            // Shoots in a radial circle (like from the card click)
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 12 + 4;
            this.speedX = Math.cos(angle) * velocity;
            this.speedY = Math.sin(angle) * velocity - 3; // biased upwards
        }
        
        this.gravity = Math.random() * 0.15 + 0.25;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
        this.opacity = 1.0;
        this.fadeSpeed = Math.random() * 0.008 + 0.008;
        
        // Random shapes (rectangle, circle, triangle)
        this.shape = Math.random() > 0.6 ? 'circle' : (Math.random() > 0.5 ? 'triangle' : 'rect');
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.speedX *= 0.98; // Drag
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
    // If specific coordinates are provided, spawn some there
    if (clickX !== null && clickY !== null) {
        for (let i = 0; i < 40; i++) {
            particles.push(new ConfettiParticle(clickX, clickY));
        }
    }
    
    // Dual side cannons for massive epic effect
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Left Cannon
    for (let i = 0; i < 60; i++) {
        particles.push(new ConfettiParticle(10, screenHeight - 10, true, 'left'));
    }
    
    // Right Cannon
    for (let i = 0; i < 60; i++) {
        particles.push(new ConfettiParticle(screenWidth - 10, screenHeight - 10, true, 'right'));
    }
    
    // Start loop if not already running
    if (!animationFrameId) {
        loop();
    }
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
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
