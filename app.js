// Estado global de la sesión de entrenamiento actual
let currentWorkoutSession = {
    exercises: []
};

// Estado del temporizador global
let timerState = {
    intervalId: null,
    duration: 0,
    timeLeft: 0,
    isRunning: false
};

// Estado del modal de edición de reps
let modalState = {
    exerciseName: null,
    setIndex: null,
    repsValue: 6
};

// Objeto de la gráfica de Chart.js
let progressChartInstance = null;

// Inicialización de la app
document.addEventListener("DOMContentLoaded", () => {
    // Comprobar estado de configuración
    if (Db.isConfigured()) {
        switchView("today");
    } else {
        switchView("setup");
        renderSetupForm();
    }
    
    // Setear la fecha de hoy en la vista de entrenamiento
    const dateElement = document.getElementById("current-workout-date");
    if (dateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.innerText = new Date().toLocaleDateString('es-ES', options);
    }
});

// Cambiar de vista (Pestañas SPA)
function switchView(viewId) {
    // Si no está configurada, bloquear otras pestañas
    if (!Db.isConfigured() && viewId !== "setup") {
        viewId = "setup";
    }

    // Desactivar todas las vistas y botones
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.querySelectorAll("nav .nav-item").forEach(b => b.classList.remove("active"));

    // Activar la vista seleccionada
    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) targetView.classList.add("active");

    // Activar el botón de navegación correspondiente
    const navItems = document.querySelectorAll("nav .nav-item");
    if (viewId === "today" && navItems[0]) navItems[0].classList.add("active");
    if (viewId === "progress" && navItems[1]) {
        navItems[1].classList.add("active");
        renderProgressView();
    }
    if (viewId === "settings" && navItems[2]) {
        navItems[2].classList.add("active");
        renderSettingsView();
    }

    // Ocultar barra de navegación si estamos en el setup
    const navBar = document.querySelector("nav");
    if (navBar) {
        if (viewId === "setup") {
            navBar.style.display = "none";
        } else {
            navBar.style.display = "flex";
        }
    }
    
    // Recrear iconos de Lucide por si hay nuevos elementos inyectados
    lucide.createIcons();
}

// Pintar el formulario inicial de pesos
function renderSetupForm() {
    const exercises = Db.getExercisesConfig();
    const container = document.getElementById("setup-exercises-list");
    if (!container) return;

    container.innerHTML = exercises.map(ex => `
        <div class="setup-row">
            <div class="setup-info">
                <h4>${ex.name}</h4>
                <span>${ex.category} (${ex.sets} series, RIR ${ex.notes.includes('RIR') ? 'objetivo' : '0-1'})</span>
            </div>
            <div class="setup-input-wrapper">
                <input type="number" step="0.5" id="setup-weight-${ex.name.replace(/\s+/g, '_')}" placeholder="0" required>
                <span>kg</span>
            </div>
        </div>
    `).join("");
}

// Guardar los pesos configurados inicialmente
function saveInitialWeights() {
    const exercises = Db.getExercisesConfig();
    const weightsMap = {};

    exercises.forEach(ex => {
        const inputId = `setup-weight-${ex.name.replace(/\s+/g, '_')}`;
        const input = document.getElementById(inputId);
        if (input) {
            weightsMap[ex.name] = parseFloat(input.value) || 0;
        }
    });

    Db.initializeWeights(weightsMap);
    switchView("today");
    startNewWorkoutSession();
}

// Inicializar la sesión de hoy
function startNewWorkoutSession() {
    const config = Db.getExercisesConfig();
    currentWorkoutSession = {
        exercises: config.map(ex => ({
            name: ex.name,
            sets: Array.from({ length: ex.sets }, () => ({
                completed: false,
                repsEdited: null
            }))
        }))
    };

    renderActiveWorkout();
}

// Renderizar la rutina de entrenamiento de hoy con sus series y checks
function renderActiveWorkout() {
    const config = Db.getExercisesConfig();
    const container = document.getElementById("active-exercises-container");
    if (!container) return;

    // Asegurar que la sesión esté inicializada
    if (currentWorkoutSession.exercises.length === 0) {
        startNewWorkoutSession();
        return;
    }

    container.innerHTML = config.map((ex, exIdx) => {
        const sessionEx = currentWorkoutSession.exercises.find(e => e.name === ex.name);
        
        const setsHtml = Array.from({ length: ex.sets }).map((_, setIdx) => {
            const isCompleted = sessionEx.sets[setIdx].completed;
            const repsEdited = sessionEx.sets[setIdx].repsEdited;
            const targetReps = repsEdited !== null ? repsEdited : ex.currentRepsTarget;
            
            return `
                <div class="set-row ${isCompleted ? 'completed' : ''}" id="set-row-${exIdx}-${setIdx}">
                    <div class="set-number">Serie ${setIdx + 1}</div>
                    <div class="set-target">
                        Objetivo: <strong>${ex.currentWeight} kg</strong> x <strong>${targetReps} reps</strong>
                        ${repsEdited !== null ? '<span style="color: var(--accent-cyan); font-size: 0.75rem; margin-left: 0.5rem;">(editado)</span>' : ''}
                    </div>
                    <div class="set-actions">
                        <button class="btn-edit-reps" onclick="openRepsModal('${ex.name}', ${setIdx})">
                            <i data-lucide="edit" style="width: 14px; height: 14px;"></i>
                            ${repsEdited !== null ? repsEdited : 'Reps'}
                        </button>
                        <button class="check-button" onclick="toggleSetCheck(${exIdx}, ${setIdx}, ${ex.rest})">
                            <i data-lucide="check" style="width: 20px; height: 20px;"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join("");

        return `
            <div class="card" style="padding-bottom: 1.25rem;">
                <div class="exercise-header">
                    <div>
                        <div class="exercise-title">${ex.name}</div>
                        <span class="exercise-cat">${ex.category}</span>
                    </div>
                    <div class="exercise-rest-tag">
                        <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
                        Descanso: ${ex.rest / 60} min
                    </div>
                </div>
                ${ex.notes ? `<div class="exercise-notes">${ex.notes}</div>` : ''}
                <div class="sets-container">
                    ${setsHtml}
                </div>
            </div>
        `;
    }).join("");

    lucide.createIcons();
}

// Marcar/Desmarcar una serie como completada
function toggleSetCheck(exIdx, setIdx, restTimeSeconds) {
    const sessionEx = currentWorkoutSession.exercises[exIdx];
    const set = sessionEx.sets[setIdx];
    
    // Cambiar estado
    set.completed = !set.completed;
    
    // Si se ha completado, disparar el temporizador automático
    if (set.completed) {
        startRestTimer(restTimeSeconds);
    } else {
        // Si se desmarca, restablecer reps editadas a null
        set.repsEdited = null;
    }

    renderActiveWorkout();
}

// Lógica del Temporizador de Descanso
function startRestTimer(seconds) {
    // Limpiar intervalo previo
    if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
    }

    timerState.duration = seconds;
    timerState.timeLeft = seconds;
    timerState.isRunning = true;

    const widget = document.getElementById("global-timer-widget");
    if (widget) widget.classList.add("active");

    updateTimerDisplay();

    timerState.intervalId = setInterval(() => {
        timerState.timeLeft--;
        updateTimerDisplay();

        if (timerState.timeLeft <= 0) {
            clearInterval(timerState.intervalId);
            timerState.intervalId = null;
            timerState.isRunning = false;
            
            // Alertar fin
            playTimerBeep();
            triggerTimerVisualAlert();
        }
    }, 1000);
}

// Actualizar widget de temporizador
function updateTimerDisplay() {
    const textDisplay = document.getElementById("timer-text-display");
    const circleProgress = document.getElementById("timer-circle-progress");
    const statusLabel = document.getElementById("timer-status-label");

    const minutes = Math.floor(timerState.timeLeft / 60);
    const seconds = timerState.timeLeft % 60;
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (textDisplay) textDisplay.innerText = timeString;
    if (statusLabel) {
        statusLabel.innerText = timerState.isRunning ? "Descanso" : "Listo";
    }

    if (circleProgress && timerState.duration > 0) {
        // Circunferencia del círculo con r=34 es 2 * PI * 34 = ~213.6
        const strokeDash = 213.6;
        const offset = strokeDash - (timerState.timeLeft / timerState.duration) * strokeDash;
        circleProgress.style.strokeDashoffset = offset;
    }
}

// Pausar / Reanudar o Cerrar temporizador al hacer click
function toggleTimerState() {
    if (timerState.timeLeft <= 0) {
        // Si ya terminó, ocultar
        const widget = document.getElementById("global-timer-widget");
        if (widget) widget.classList.remove("active");
        return;
    }

    if (timerState.isRunning) {
        // Pausar
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
        timerState.isRunning = false;
        const statusLabel = document.getElementById("timer-status-label");
        if (statusLabel) statusLabel.innerText = "Pausa";
    } else {
        // Reanudar
        timerState.isRunning = true;
        const statusLabel = document.getElementById("timer-status-label");
        if (statusLabel) statusLabel.innerText = "Descanso";
        
        timerState.intervalId = setInterval(() => {
            timerState.timeLeft--;
            updateTimerDisplay();

            if (timerState.timeLeft <= 0) {
                clearInterval(timerState.intervalId);
                timerState.intervalId = null;
                timerState.isRunning = false;
                playTimerBeep();
                triggerTimerVisualAlert();
            }
        }, 1000);
    }
}

// Efecto visual al terminar el temporizador
function triggerTimerVisualAlert() {
    const widget = document.getElementById("global-timer-widget");
    if (widget) {
        widget.style.transform = "scale(1.15)";
        widget.style.boxShadow = "0 0 30px var(--accent-violet-glow)";
        document.getElementById("timer-text-display").style.color = "#ef4444";
        
        setTimeout(() => {
            widget.style.transform = "scale(1)";
            widget.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.5)";
            document.getElementById("timer-text-display").style.color = "var(--text-primary)";
        }, 2000);
    }
}

// Sintetizar sonido futurista con Web Audio API
function playTimerBeep() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        
        const ctx = new AudioCtx();
        
        // Primer tono
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime); // Nota La5 (A5)
        gain1.gain.setValueAtTime(0.08, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.15);
        
        // Segundo tono
        setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1174.66, ctx.currentTime); // Nota Re6 (D6)
            gain2.gain.setValueAtTime(0.08, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start();
            osc2.stop(ctx.currentTime + 0.25);
        }, 150);
    } catch (e) {
        console.error("Audio error", e);
    }
}

// Modal de edición de repeticiones (por si falla reps)
function openRepsModal(exerciseName, setIndex) {
    modalState.exerciseName = exerciseName;
    modalState.setIndex = setIndex;
    
    // Obtener las repeticiones objetivo actuales
    const config = Db.getExercisesConfig();
    const ex = config.find(e => e.name === exerciseName);
    const sessionEx = currentWorkoutSession.exercises.find(e => e.name === exerciseName);
    const currentEdited = sessionEx.sets[setIndex].repsEdited;
    
    modalState.repsValue = currentEdited !== null ? currentEdited : ex.currentRepsTarget;

    // Actualizar valor en el modal
    document.getElementById("modal-reps-value").innerText = modalState.repsValue;
    document.getElementById("edit-reps-subtitle").innerText = `Indica las repeticiones logradas para ${exerciseName} (Serie ${setIndex + 1}). Objetivo: ${ex.currentRepsTarget} reps.`;

    document.getElementById("edit-reps-modal").classList.add("active");
}

function adjustModalReps(amount) {
    modalState.repsValue = Math.max(1, modalState.repsValue + amount);
    document.getElementById("modal-reps-value").innerText = modalState.repsValue;
}

function closeRepsModal() {
    document.getElementById("edit-reps-modal").classList.remove("active");
}

function saveRepsModalValue() {
    const sessionEx = currentWorkoutSession.exercises.find(e => e.name === modalState.exerciseName);
    const set = sessionEx.sets[modalState.setIndex];
    
    set.repsEdited = modalState.repsValue;
    // Marcar automáticamente como completado si edita las repeticiones logradas
    set.completed = true;

    closeRepsModal();
    renderActiveWorkout();
}

// Guardar y aplicar el algoritmo de Doble Progresión
function finishWorkout() {
    // Comprobar si al menos una serie está completada
    const hasCompletedAny = currentWorkoutSession.exercises.some(ex => ex.sets.some(s => s.completed));
    if (!hasCompletedAny) {
        alert("Por favor, completa al menos una serie antes de guardar.");
        return;
    }

    // Ejecutar lógica de guardado y progresión
    const result = Db.logWorkout(currentWorkoutSession.exercises);
    
    // Mostrar overlay de resumen de progresión
    const summaryList = document.getElementById("summary-progression-list");
    if (summaryList) {
        summaryList.innerHTML = result.summary.map(item => {
            let itemClass = 'stable';
            if (item.status === 'weight_up') itemClass = 'weight_up';
            if (item.status === 'rep_up') itemClass = 'rep_up';
            
            return `
                <div class="summary-list-item ${itemClass}">
                    <strong>${item.exercise}:</strong> ${item.message}
                </div>
            `;
        }).join("");
    }

    document.getElementById("progression-summary-overlay").classList.add("active");
    
    // Limpiar el temporizador si está corriendo
    if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
        timerState.isRunning = false;
        document.getElementById("global-timer-widget").classList.remove("active");
    }
}

function closeSummaryOverlay() {
    document.getElementById("progression-summary-overlay").classList.remove("active");
    // Inicializar nueva sesión para el futuro
    startNewWorkoutSession();
    // Cambiar a la vista de progreso
    switchView("progress");
}

// Pintar la pestaña de Progreso
function renderProgressView() {
    const config = Db.getExercisesConfig();
    const select = document.getElementById("chart-exercise-select");
    if (!select) return;

    // Rellenar select de ejercicios si está vacío
    if (select.children.length === 0) {
        select.innerHTML = config.map(ex => `
            <option value="${ex.name}">${ex.name}</option>
        `).join("");
    }

    renderProgressChart();
    renderWorkoutHistoryList();
}

// Renderizar la gráfica interactiva de marcas (1RM)
function renderProgressChart() {
    const select = document.getElementById("chart-exercise-select");
    if (!select) return;

    const selectedExercise = select.value;
    const historyData = Db.getExerciseHistory(selectedExercise);

    const ctx = document.getElementById('progressChart');
    if (!ctx) return;

    // Si ya existe una gráfica, destruirla antes de pintar
    if (progressChartInstance) {
        progressChartInstance.destroy();
    }

    if (historyData.length === 0) {
        // Sin datos suficientes
        const chartCtx = ctx.getContext('2d');
        chartCtx.clearRect(0, 0, ctx.width, ctx.height);
        chartCtx.fillStyle = '#71717a';
        chartCtx.font = '14px Outfit';
        chartCtx.textAlign = 'center';
        chartCtx.fillText('Registra entrenamientos para ver tu evolución.', ctx.width / 2, ctx.height / 2);
        return;
    }

    const labels = historyData.map(d => {
        const parts = d.date.split('-');
        return `${parts[2]}/${parts[1]}`; // DD/MM
    });
    const oneRMs = historyData.map(d => d.oneRM);
    const weights = historyData.map(d => d.weight);

    progressChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '1RM Proyectado (kg)',
                    data: oneRMs,
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#06b6d4',
                    pointRadius: 4
                },
                {
                    label: 'Peso Levantado (kg)',
                    data: weights,
                    borderColor: '#8b5cf6',
                    borderWidth: 1.5,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.1,
                    pointBackgroundColor: '#8b5cf6',
                    pointRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#a1a1aa',
                        font: { family: 'Plus Jakarta Sans', size: 10 }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#71717a' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#71717a' }
                }
            }
        }
    });
}

// Renderizar la lista de historial
function renderWorkoutHistoryList() {
    const container = document.getElementById("history-list-container");
    if (!container) return;

    const history = JSON.parse(localStorage.getItem('workout_history') || '[]');
    if (history.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center;">No hay entrenamientos guardados todavía.</p>`;
        return;
    }

    // Listar del más reciente al más antiguo
    const reversedHistory = [...history].reverse();

    container.innerHTML = reversedHistory.map(session => {
        const dateObj = new Date(session.date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
        
        const exercisesList = session.exercises.map(ex => {
            const setMarks = ex.sets.map(s => {
                if (s.completed) {
                    return `<span style="color: var(--success); font-weight:600;">[✓ ${s.repsCompleted}]</span>`;
                } else {
                    return `<span style="color: var(--text-muted);">[✗]</span>`;
                }
            }).join(" ");
            
            return `
                <div class="history-ex-row">
                    <span class="history-ex-name">${ex.name}</span>
                    <span class="history-ex-marks">${ex.weightUsed} kg x ${setMarks}</span>
                </div>
            `;
        }).join("");

        return `
            <div class="history-item">
                <div class="history-header">
                    <span class="history-date">${formattedDate}</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">Torso completado</span>
                </div>
                <div class="history-exercises-list">
                    ${exercisesList}
                </div>
            </div>
        `;
    }).join("");
}

// Pintar la pestaña de Ajustes
function renderSettingsView() {
    const config = Db.getExercisesConfig();
    const container = document.getElementById("settings-exercises-list");
    if (!container) return;

    container.innerHTML = config.map(ex => `
        <div class="setup-row" style="padding: 0.75rem 1rem;">
            <div class="setup-info">
                <h4 style="font-size: 0.9rem;">${ex.name}</h4>
                <span style="font-size: 0.75rem; color: var(--text-muted);">RIR 0-1 (Rango: ${ex.rMin}-${ex.rMax} reps)</span>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <div class="setup-input-wrapper">
                    <input type="number" step="0.5" id="settings-weight-${ex.name.replace(/\s+/g, '_')}" value="${ex.currentWeight || 0}" style="width: 60px; font-size: 0.85rem; padding: 0.35rem;">
                    <span style="font-size: 0.8rem;">kg</span>
                </div>
                <div class="setup-input-wrapper">
                    <input type="number" id="settings-reps-${ex.name.replace(/\s+/g, '_')}" value="${ex.currentRepsTarget}" style="width: 50px; font-size: 0.85rem; padding: 0.35rem;">
                    <span style="font-size: 0.8rem;">reps</span>
                </div>
            </div>
        </div>
    `).join("");
}

// Guardar los ajustes manuales de pesos/reps
function saveManualAdjustments() {
    const config = Db.getExercisesConfig();
    config.forEach(ex => {
        const weightInput = document.getElementById(`settings-weight-${ex.name.replace(/\s+/g, '_')}`);
        const repsInput = document.getElementById(`settings-reps-${ex.name.replace(/\s+/g, '_')}`);
        
        if (weightInput && repsInput) {
            ex.currentWeight = parseFloat(weightInput.value) || 0;
            ex.currentRepsTarget = Math.max(1, parseInt(repsInput.value) || 0);
        }
    });

    Db.saveExercisesConfig(config);
    alert("¡Ajustes actualizados con éxito!");
    switchView("today");
    startNewWorkoutSession();
}

// Confirmar reseteo total
function confirmReset() {
    const conf = confirm("¿Estás completamente seguro de que quieres borrar todos tus progresos? Esto eliminará tus marcas e historial.");
    if (conf) {
        Db.resetDatabase();
        switchView("setup");
        renderSetupForm();
    }
}
