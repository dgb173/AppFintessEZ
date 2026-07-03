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

// Inicialización de la app al cargar
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
    if (viewId === "strategies" && navItems[2]) {
        navItems[2].classList.add("active");
    }
    if (viewId === "diet" && navItems[3]) {
        navItems[3].classList.add("active");
        renderDietView();
    }
    if (viewId === "settings" && navItems[4]) {
        navItems[4].classList.add("active");
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
    
    // Recrear iconos de Lucide
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
                <span>${ex.category} (${ex.sets} series, RIR ${ex.name.includes('Pec') ? '0' : '0-1'})</span>
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

// Renderizar la rutina de entrenamiento con sus series y checks
function renderActiveWorkout() {
    const config = Db.getExercisesConfig();
    const container = document.getElementById("active-exercises-container");
    if (!container) return;

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
                        ${repsEdited !== null ? '<span style="color: var(--accent-cyan); font-size: 0.75rem; margin-left: 0.5rem; font-weight:700;">(editado)</span>' : ''}
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
    
    set.completed = !set.completed;
    
    if (set.completed) {
        startRestTimer(restTimeSeconds);
    } else {
        set.repsEdited = null;
    }

    renderActiveWorkout();
}

// Lógica del Temporizador de Descanso
function startRestTimer(seconds) {
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
            
            playTimerBeep();
            triggerTimerVisualAlert();
        }
    }, 1000);
}

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
        const strokeDash = 213.6;
        const offset = strokeDash - (timerState.timeLeft / timerState.duration) * strokeDash;
        circleProgress.style.strokeDashoffset = offset;
    }
}

function toggleTimerState() {
    if (timerState.timeLeft <= 0) {
        const widget = document.getElementById("global-timer-widget");
        if (widget) widget.classList.remove("active");
        return;
    }

    if (timerState.isRunning) {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
        timerState.isRunning = false;
        const statusLabel = document.getElementById("timer-status-label");
        if (statusLabel) statusLabel.innerText = "Pausa";
    } else {
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

function playTimerBeep() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        
        const ctx = new AudioCtx();
        
        // Primer beep
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        gain1.gain.setValueAtTime(0.08, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.15);
        
        // Segundo beep
        setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1174.66, ctx.currentTime);
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

// Modal de edición de repeticiones
function openRepsModal(exerciseName, setIndex) {
    modalState.exerciseName = exerciseName;
    modalState.setIndex = setIndex;
    
    const config = Db.getExercisesConfig();
    const ex = config.find(e => e.name === exerciseName);
    const sessionEx = currentWorkoutSession.exercises.find(e => e.name === exerciseName);
    const currentEdited = sessionEx.sets[setIndex].repsEdited;
    
    modalState.repsValue = currentEdited !== null ? currentEdited : ex.currentRepsTarget;

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
    set.completed = true;

    closeRepsModal();
    renderActiveWorkout();
}

// Guardar entrenamiento y aplicar Doble Progresión
function finishWorkout() {
    const hasCompletedAny = currentWorkoutSession.exercises.some(ex => ex.sets.some(s => s.completed));
    if (!hasCompletedAny) {
        alert("Por favor, completa al menos una serie antes de guardar.");
        return;
    }

    const result = Db.logWorkout(currentWorkoutSession.exercises);
    
    // Renderizar overlay de resumen de progresión
    const summaryList = document.getElementById("summary-progression-list");
    if (summaryList) {
        summaryList.innerHTML = result.summary.map(item => {
            let itemClass = 'stable';
            if (item.status === 'weight_up') itemClass = 'weight_up';
            if (item.status === 'rep_up') itemClass = 'rep_up';
            if (item.status === 'deload_trigger') itemClass = 'stable'; // Usamos color naranja para deload
            
            return `
                <div class="summary-list-item ${itemClass}">
                    <strong>${item.exercise}:</strong> ${item.message}
                </div>
            `;
        }).join("");
    }

    document.getElementById("progression-summary-overlay").classList.add("active");
    
    // Limpiar el temporizador
    if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
        timerState.isRunning = false;
        document.getElementById("global-timer-widget").classList.remove("active");
    }
}

function closeSummaryOverlay() {
    document.getElementById("progression-summary-overlay").classList.remove("active");
    startNewWorkoutSession();
    switchView("progress");
}

// Pintar la pestaña de Progresiones y Volumen
function renderProgressView() {
    // 1. Barras de volumen semanal efectivas
    const volume = Db.getWeeklyVolume();
    
    // Pecho
    const pechoPercent = Math.min(100, (volume.pecho / volume.pechoTarget) * 100);
    document.getElementById("volume-score-pecho").innerText = `${volume.pecho} / ${volume.pechoTarget} series`;
    document.getElementById("volume-bar-pecho").style.width = `${pechoPercent}%`;
    document.getElementById("volume-remaining-pecho").innerText = 
        volume.pecho >= volume.pechoTarget ? "¡Volumen óptimo alcanzado!" : `Restan ${(volume.pechoTarget - volume.pecho).toFixed(1)} series`;

    // Espalda
    const espaldaPercent = Math.min(100, (volume.espalda / volume.espaldaTarget) * 100);
    document.getElementById("volume-score-espalda").innerText = `${volume.espalda} / ${volume.espaldaTarget} series`;
    document.getElementById("volume-bar-espalda").style.width = `${espaldaPercent}%`;
    document.getElementById("volume-remaining-espalda").innerText = 
        volume.espalda >= volume.espaldaTarget ? "¡Volumen óptimo alcanzado!" : `Restan ${(volume.espaldaTarget - volume.espalda).toFixed(1)} series`;

    // 2. Previsión lógicas para siguiente sesión
    const config = Db.getExercisesConfig();
    const forecastContainer = document.getElementById("forecast-exercises-container");
    if (forecastContainer) {
        forecastContainer.innerHTML = config.map(ex => {
            let badgeClass = 'consolidation';
            let badgeText = 'Consolidando';
            let strategyText = `Mantener peso y buscar aumentar repeticiones hasta alcanzar las ${ex.rMax} reps.`;

            if (ex.currentRepsTarget === ex.rMax) {
                badgeText = 'Trigger Activo';
                strategyText = `¡Último escalón! Si logras completar las ${ex.rMax} reps en todas las series, el peso subirá **+${ex.increment} kg** en la siguiente sesión.`;
            }
            if (ex.consecutiveNoProgress > 0) {
                badgeClass = 'deload';
                badgeText = 'Fatiga registrada';
                strategyText = `Llevas 1 sesión sin progresar. Si vuelves a estancarte en esta sesión, se activará un **Reset del -5% de peso** para disipar fatiga de tendón.`;
            }

            return `
                <div class="forecast-card">
                    <div class="forecast-info">
                        <h5>${ex.name}</h5>
                        <span class="forecast-badge ${badgeClass}">${badgeText}</span>
                        <div class="forecast-strategy">${strategyText}</div>
                    </div>
                    <div class="forecast-target">
                        <div class="forecast-target-value">${ex.currentWeight} kg x ${ex.currentRepsTarget} reps</div>
                        <div style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">Objetivo de Serie</div>
                    </div>
                </div>
            `;
        }).join("");
    }

    // 3. Gráficas de 1RM
    const select = document.getElementById("chart-exercise-select");
    if (select) {
        if (select.children.length === 0) {
            select.innerHTML = config.map(ex => `
                <option value="${ex.name}">${ex.name}</option>
            `).join("");
        }
    }

    renderProgressChart();
    renderWorkoutHistoryList();
}

function renderProgressChart() {
    const select = document.getElementById("chart-exercise-select");
    if (!select) return;

    const selectedExercise = select.value;
    const historyData = Db.getExerciseHistory(selectedExercise);

    const ctx = document.getElementById('progressChart');
    if (!ctx) return;

    if (progressChartInstance) {
        progressChartInstance.destroy();
    }

    if (historyData.length === 0) {
        const chartCtx = ctx.getContext('2d');
        chartCtx.clearRect(0, 0, ctx.width, ctx.height);
        chartCtx.fillStyle = '#64748b';
        chartCtx.font = '14px Outfit';
        chartCtx.textAlign = 'center';
        chartCtx.fillText('Registra entrenamientos para ver tu evolución.', ctx.width / 2, ctx.height / 2);
        return;
    }

    const labels = historyData.map(d => {
        const parts = d.date.split('-');
        return `${parts[2]}/${parts[1]}`;
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
                    backgroundColor: 'rgba(6, 182, 212, 0.08)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#06b6d4',
                    pointRadius: 4
                },
                {
                    label: 'Peso Levantado (kg)',
                    data: weights,
                    borderColor: '#a855f7',
                    borderWidth: 1.5,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.1,
                    pointBackgroundColor: '#a855f7',
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
                        color: '#cbd5e1',
                        font: { family: 'Plus Jakarta Sans', size: 10, weight: 600 }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#64748b' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#64748b' }
                }
            }
        }
    });
}

function renderWorkoutHistoryList() {
    const container = document.getElementById("history-list-container");
    if (!container) return;

    const history = JSON.parse(localStorage.getItem('workout_history') || '[]');
    if (history.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center;">No hay entrenamientos guardados todavía.</p>`;
        return;
    }

    const reversedHistory = [...history].reverse();

    container.innerHTML = reversedHistory.map(session => {
        const dateObj = new Date(session.date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
        
        const exercisesList = session.exercises.map(ex => {
            const setMarks = ex.sets.map(s => {
                if (s.completed) {
                    return `<span style="color: var(--success); font-weight:700;">[✓ ${s.repsCompleted}]</span>`;
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
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-weight:600;">Torso completado</span>
                </div>
                <div class="history-exercises-list">
                    ${exercisesList}
                </div>
            </div>
        `;
    }).join("");
}

// Pintar la pestaña de Dieta y Pasos
function renderDietView() {
    const activeTabType = localStorage.getItem('diet_day_type') || 'entreno';
    
    // Actualizar botones de tipo de día
    document.querySelectorAll(".dieta-btn").forEach(b => b.classList.remove("active"));
    const activeBtn = document.getElementById(`dieta-tab-${activeTabType}`);
    if (activeBtn) activeBtn.classList.add("active");

    const plan = Db.getDietPlan(activeTabType);
    
    // Pintar macros
    document.getElementById("macro-kcal").innerText = plan.calories;
    document.getElementById("macro-protein").innerText = `${plan.protein}g`;
    document.getElementById("macro-carbs").innerText = `${plan.carbs}g`;
    document.getElementById("macro-fat").innerText = `${plan.fat}g`;

    // Pintar descripción y pasos objetivo
    const descElement = document.getElementById("diet-steps-desc");
    if (descElement) {
        descElement.innerText = `Objetivo del día: ${plan.stepsTarget.toLocaleString('es-ES')} pasos. ${activeTabType === 'entreno' ? 'Mantener la actividad ayuda a bombear metabolitos y disipar fatiga muscular.' : 'Mayor actividad cardiovascular ligera para favorecer el flujo sanguíneo y la recuperación activa.'}`;
    }

    // Pintar pasos guardados hoy
    const stepsInput = document.getElementById("steps-input-value");
    const stepsStatus = document.getElementById("today-logged-steps-status");
    const todaySteps = Db.getStepsForDate();
    if (stepsStatus) stepsStatus.innerText = `${todaySteps.toLocaleString('es-ES')} pasos`;
    if (stepsInput && todaySteps > 0) stepsInput.value = todaySteps;
    else if (stepsInput) stepsInput.value = "";

    // Pintar comidas
    const mealsContainer = document.getElementById("meals-list-container");
    if (mealsContainer) {
        document.getElementById("diet-meals-title").innerText = `Distribución: ${plan.title}`;
        mealsContainer.innerHTML = plan.meals.map(m => `
            <div class="meal-row">
                <div class="meal-name">${m.name}</div>
                <div class="meal-text">${m.text}</div>
            </div>
        `).join("");
    }
}

// Cambiar pestaña de dieta
function changeDietTab(type) {
    Db.setDietDayType(type);
    renderDietView();
}

// Guardar pasos
function saveSteps() {
    const input = document.getElementById("steps-input-value");
    if (!input) return;

    const stepsVal = parseInt(input.value) || 0;
    if (stepsVal < 0) {
        alert("Introduce un número de pasos válido.");
        return;
    }

    Db.logDailySteps(stepsVal);
    
    const stepsStatus = document.getElementById("today-logged-steps-status");
    if (stepsStatus) stepsStatus.innerText = `${stepsVal.toLocaleString('es-ES')} pasos`;

    alert("¡Pasos registrados correctamente!");
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
                <span style="font-size: 0.75rem; color: var(--text-muted);">Rango: ${ex.rMin}-${ex.rMax} reps</span>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <div class="setup-input-wrapper">
                    <input type="number" step="0.5" id="settings-weight-${ex.name.replace(/\s+/g, '_')}" value="${ex.currentWeight || 0}" style="width: 55px; font-size: 0.85rem; padding: 0.35rem;">
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
            ex.consecutiveNoProgress = 0; // Resetear estancamiento al ajustar a mano
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
