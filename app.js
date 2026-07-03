let currentWorkoutSession = {
    dayId: null,
    exercises: []
};

let timerState = {
    intervalId: null,
    duration: 0,
    timeLeft: 0,
    isRunning: false
};

let modalState = {
    exerciseId: null,
    setIndex: null,
    repsValue: 6
};

let progressChartInstance = null;
let dashboardNutritionChartInstance = null;
let dashboardProgressChartInstance = null;
let selectedDashboardDate = getTodayISO();
let selectedDietDate = getTodayISO();
let currentFoodMeal = [];

const SyncClient = (() => {
    const STATE_KEYS = [
        "workout_config",
        "workout_history",
        "steps_history",
        "nutrition_history",
        "day_plans",
        "diet_day_type",
        "active_workout_day",
        "user_profile",
        "mesocycle_settings",
        "is_configured",
        "app_fitness_initialized"
    ];

    function defaultEndpoint() {
        if (window.location.protocol.startsWith("http")) {
            return window.location.origin;
        }
        return localStorage.getItem("sync_endpoint") || "";
    }

    function getSettings() {
        return {
            endpoint: (localStorage.getItem("sync_endpoint") || defaultEndpoint()).replace(/\/$/, ""),
            key: localStorage.getItem("sync_key") || "app-fitness-main",
            secret: localStorage.getItem("sync_secret") || ""
        };
    }

    function saveSettings({ endpoint, key, secret }) {
        localStorage.setItem("sync_endpoint", (endpoint || "").replace(/\/$/, ""));
        localStorage.setItem("sync_key", key || "app-fitness-main");
        localStorage.setItem("sync_secret", secret || "");
    }

    function parseValue(value) {
        if (value === null || value === undefined) return null;
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    function stringifyValue(value) {
        return typeof value === "string" ? value : JSON.stringify(value);
    }

    function exportState() {
        const keys = {};
        STATE_KEYS.forEach(key => {
            keys[key] = parseValue(localStorage.getItem(key));
        });
        return {
            version: 1,
            exportedAt: Date.now(),
            keys
        };
    }

    function importState(state) {
        if (!state?.keys) return;
        STATE_KEYS.forEach(key => {
            if (state.keys[key] !== undefined && state.keys[key] !== null) {
                localStorage.setItem(key, stringifyValue(state.keys[key]));
            }
        });
    }

    function mergeWorkoutHistory(remoteValue, localValue) {
        const map = new Map();
        [...(remoteValue || []), ...(localValue || [])].forEach(item => {
            const id = item.id || `${item.date}-${item.dayId}-${JSON.stringify(item.exercises || [])}`;
            map.set(id, item);
        });
        return Array.from(map.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    }

    function mergeState(remoteState, localState) {
        const merged = {
            version: 1,
            exportedAt: Date.now(),
            keys: {
                ...(remoteState?.keys || {}),
                ...(localState?.keys || {})
            }
        };

        ["steps_history", "nutrition_history", "day_plans"].forEach(key => {
            merged.keys[key] = {
                ...((remoteState?.keys || {})[key] || {}),
                ...((localState?.keys || {})[key] || {})
            };
        });

        merged.keys.workout_history = mergeWorkoutHistory(
            (remoteState?.keys || {}).workout_history,
            (localState?.keys || {}).workout_history
        );

        return merged;
    }

    function hashState(state) {
        const text = JSON.stringify(state?.keys || {});
        let hash = 2166136261;
        for (let i = 0; i < text.length; i++) {
            hash ^= text.charCodeAt(i);
            hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }
        return (hash >>> 0).toString(16);
    }

    function setStatus(message) {
        localStorage.setItem("sync_last_status", message);
        const node = document.getElementById("sync-status-text");
        if (node) node.innerText = message;
    }

    async function request(method, settings, body) {
        if (!settings.endpoint) throw new Error("Falta la URL de API Render.");
        const url = `${settings.endpoint}/api/sync/${encodeURIComponent(settings.key)}`;
        const headers = { "content-type": "application/json" };
        if (settings.secret) headers["x-sync-secret"] = settings.secret;
        const res = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) throw new Error(`Sync ${res.status}`);
        return res.json();
    }

    async function syncNow({ silent = false } = {}) {
        const settings = getSettings();
        if (!settings.endpoint) {
            if (!silent) setStatus("Configura la URL de Render para sincronizar.");
            return false;
        }

        const localState = exportState();
        const localHash = hashState(localState);
        const lastPushedHash = localStorage.getItem("sync_last_pushed_hash") || "";
        const lastRemoteAt = Number(localStorage.getItem("sync_remote_updated_at") || 0);

        try {
            const remote = await request("GET", settings);
            const remoteHasNewer = remote?.state && Number(remote.updatedAt || 0) > lastRemoteAt;

            if (remoteHasNewer && localHash !== lastPushedHash) {
                const merged = mergeState(remote.state, localState);
                importState(merged);
                const pushed = await request("PUT", settings, { state: merged, updatedAt: Date.now() });
                localStorage.setItem("sync_remote_updated_at", String(pushed.updatedAt || Date.now()));
                localStorage.setItem("sync_last_pushed_hash", hashState(merged));
                setStatus("Sincronizado con mezcla local/web.");
                return true;
            }

            if (remoteHasNewer) {
                importState(remote.state);
                localStorage.setItem("sync_remote_updated_at", String(remote.updatedAt || Date.now()));
                localStorage.setItem("sync_last_pushed_hash", hashState(remote.state));
                setStatus("Datos descargados desde la nube.");
                return true;
            }

            if (localHash !== lastPushedHash) {
                const pushed = await request("PUT", settings, { state: localState, updatedAt: Date.now() });
                localStorage.setItem("sync_remote_updated_at", String(pushed.updatedAt || Date.now()));
                localStorage.setItem("sync_last_pushed_hash", localHash);
                setStatus("Datos subidos a la nube.");
                return true;
            }

            setStatus("Todo sincronizado.");
            return true;
        } catch (error) {
            setStatus(`Sync pendiente: ${error.message}`);
            if (!silent) console.error(error);
            return false;
        }
    }

    function init() {
        if (!localStorage.getItem("sync_endpoint") && window.location.protocol.startsWith("http")) {
            localStorage.setItem("sync_endpoint", window.location.origin);
        }
        window.addEventListener("online", () => syncNow({ silent: true }).then(refreshAfterSync));
        window.addEventListener("visibilitychange", () => {
            if (!document.hidden) syncNow({ silent: true }).then(refreshAfterSync);
        });
        setInterval(() => syncNow({ silent: true }).then(refreshAfterSync), 30000);
    }

    return { getSettings, saveSettings, syncNow, init };
})();

document.addEventListener("DOMContentLoaded", () => {
    setTodayDate();
    SyncClient.init();
    renderHeaderStatus();
    renderWorkoutDaySelector();

    switchView("dashboard");
    if (Db.isConfigured()) {
        startNewWorkoutSession();
    } else {
        renderSetupForm();
    }
    SyncClient.syncNow({ silent: true }).then(refreshAfterSync);
});

function getTodayISO() {
    const now = new Date();
    const local = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    return local.toISOString().split("T")[0];
}

function setTodayDate() {
    const dateElement = document.getElementById("current-workout-date");
    if (!dateElement) return;

    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    dateElement.innerText = new Date().toLocaleDateString("es-ES", options);
}

function formatKg(value) {
    const parsed = parseFloat(value || 0);
    return Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(1).replace(".0", "");
}

function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
    }
}

function refreshAfterSync() {
    renderHeaderStatus();
    const activeView = document.querySelector(".view.active")?.id?.replace("view-", "") || "dashboard";
    if (activeView === "dashboard") renderDashboardView();
    if (activeView === "diet") renderDietView();
    if (activeView === "progress") renderProgressView();
    if (activeView === "today" && Db.isConfigured()) {
        renderWorkoutDaySelector();
        renderActiveWorkout();
    }
    if (activeView === "settings") renderSettingsView();
}

function queueCloudSync() {
    SyncClient.syncNow({ silent: true });
}

function renderHeaderStatus() {
    const headerText = document.getElementById("header-status-text");
    if (!headerText || !window.Db) return;

    const meso = Db.getCurrentMesocycleStatus();
    const day = Db.getWorkoutDay(Db.getActiveWorkoutDay());
    headerText.innerText = `S${meso.week}/${meso.lengthWeeks} · ${day.title.replace("Dia ", "D")}`;
}

function switchView(viewId) {
    const configured = Db.isConfigured();
    const lockedViews = ["today", "progress"];
    if (!configured && lockedViews.includes(viewId)) {
        viewId = "dashboard";
    }

    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.querySelectorAll("nav .nav-item").forEach(b => b.classList.remove("active"));

    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) targetView.classList.add("active");

    const navItems = document.querySelectorAll("nav .nav-item");
    if (viewId === "dashboard" && navItems[0]) {
        navItems[0].classList.add("active");
        renderDashboardView();
    }
    if (viewId === "today" && navItems[1]) {
        navItems[1].classList.add("active");
        renderWorkoutDaySelector();
        renderActiveWorkout();
    }
    if (viewId === "progress" && navItems[2]) {
        navItems[2].classList.add("active");
        renderProgressView();
    }
    if (viewId === "strategies" && navItems[2]) navItems[2].classList.add("active");
    if (viewId === "diet" && navItems[3]) {
        navItems[3].classList.add("active");
        renderDietView();
    }
    if (viewId === "settings" && navItems[4]) {
        navItems[4].classList.add("active");
        renderSettingsView();
    }

    const navBar = document.querySelector("nav");
    if (navBar) navBar.style.display = viewId === "setup" ? "none" : "flex";

    renderHeaderStatus();
    refreshIcons();
}

function formatInt(value) {
    return Math.round(value || 0).toLocaleString("es-ES");
}

function formatMacro(value) {
    const parsed = Number(value || 0);
    const rounded = parsed >= 10 ? Math.round(parsed) : Math.round(parsed * 10) / 10;
    return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1).replace(".0", "");
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function shortWorkoutTitle(title) {
    return (title || "").replace("Dia ", "D");
}

function renderWorkoutOptions(select, activeId) {
    if (!select) return;
    const days = Db.getWorkoutDayOptions();
    select.innerHTML = days.map(day => `
        <option value="${day.id}" ${day.id === activeId ? "selected" : ""}>${day.title}</option>
    `).join("");
}

function renderActivityOptions(select, activeId) {
    if (!select) return;
    const levels = Db.getActivityLevelOptions();
    select.innerHTML = levels.map(level => `
        <option value="${level.id}" ${level.id === activeId ? "selected" : ""}>${level.label}</option>
    `).join("");
}

function renderCheatAdvice(containerId, diet) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const tone = diet.cheat.extraCalories > 0 ? "warning" : "neutral";
    container.className = `cheat-advice ${tone}`;
    container.innerHTML = `
        <div>
            <strong>${diet.cheat.message}</strong>
            <span>Pasos sugeridos hoy: ${formatInt(diet.totalSuggestedSteps)} · kcal limpias restantes: ${formatInt(diet.cleanCalories)} · carbs limpios: ${diet.cleanCarbs}g</span>
        </div>
    `;
}

function renderDashboardView() {
    const summary = Db.getDashboardSummary(selectedDashboardDate);
    const plan = summary.dailyPlan;
    const diet = summary.diet;
    const nutrition = summary.nutrition;
    const nutritionScore = summary.nutritionScore;
    const configured = Db.isConfigured();

    const dateInput = document.getElementById("dashboard-date-input");
    const dayTypeSelect = document.getElementById("dashboard-day-type");
    const workoutSelect = document.getElementById("dashboard-workout-day");
    const activitySelect = document.getElementById("dashboard-activity-level");
    const plannedStepsInput = document.getElementById("dashboard-planned-steps");
    const cheatInput = document.getElementById("dashboard-cheat-calories");

    if (dateInput) dateInput.value = selectedDashboardDate;
    if (dayTypeSelect) dayTypeSelect.value = plan.dayType;
    renderWorkoutOptions(workoutSelect, plan.workoutDayId);
    renderActivityOptions(activitySelect, plan.activityLevel);
    if (plannedStepsInput) plannedStepsInput.value = plan.plannedSteps;
    if (cheatInput) cheatInput.value = plan.cheatMealCalories || "";
    const setupCard = document.getElementById("dashboard-setup-card");
    if (setupCard) setupCard.style.display = configured ? "none" : "block";

    document.getElementById("dashboard-score").innerText = summary.readinessScore;
    document.getElementById("dash-kcal").innerText = formatInt(diet.calories);
    document.getElementById("dash-carbs").innerText = `${diet.carbs}g`;
    document.getElementById("dash-steps").innerText = formatInt(diet.totalSuggestedSteps);
    document.getElementById("dash-workout").innerText = plan.dayType === "entreno" ? shortWorkoutTitle(summary.workoutDay.title) : "Descanso";
    document.getElementById("dash-clean-kcal").innerText = formatInt(diet.cleanCalories);
    document.getElementById("dash-clean-carbs").innerText = `${diet.cleanCarbs}g`;
    document.getElementById("dash-protein").innerText = `${diet.protein}g`;

    const subtitle = document.getElementById("dashboard-subtitle");
    if (subtitle) {
        subtitle.innerText = `${diet.activityLabel} · ${diet.dayType === "entreno" ? "día de entreno" : "día de descanso"} · mesociclo semana ${summary.mesocycle.week}/${summary.mesocycle.lengthWeeks}`;
    }

    renderCheatAdvice("dashboard-cheat-result", diet);
    renderDashboardABC(summary, configured);
    renderNutritionLog(nutrition, nutritionScore);
    renderDashboardActions(summary.actions);
    renderDashboardCharts();
    renderHeaderStatus();
    refreshIcons();
}

function renderDashboardABC(summary, configured) {
    const workoutTitle = document.getElementById("abc-training-title");
    const workoutText = document.getElementById("abc-training-text");
    const dietTitle = document.getElementById("abc-diet-title");
    const dietText = document.getElementById("abc-diet-text");
    const activityTitle = document.getElementById("abc-activity-title");
    const activityText = document.getElementById("abc-activity-text");

    if (workoutTitle) workoutTitle.innerText = configured ? (summary.dailyPlan.dayType === "entreno" ? shortWorkoutTitle(summary.workoutDay.title) : "Descanso") : "Configura pesos";
    if (workoutText) workoutText.innerText = configured ? (summary.dailyPlan.dayType === "entreno" ? summary.workoutDay.subtitle : "Movilidad, pasos y recuperación.") : "Mete cargas iniciales una vez para activar progresión.";
    if (dietTitle) dietTitle.innerText = `${summary.diet.calories} kcal · ${summary.diet.protein}g proteína`;
    if (dietText) dietText.innerText = `${summary.diet.carbs}g carbs objetivo · ${summary.nutritionScore.score ? `dieta ${summary.nutritionScore.score}/100` : "sin apuntar todavía"}.`;
    if (activityTitle) activityTitle.innerText = `${formatInt(summary.diet.totalSuggestedSteps)} pasos`;
    if (activityText) activityText.innerText = summary.diet.cheat.extraCalories > 0 ? summary.diet.cheat.message : "Cierra pasos y deja el cheat meal planificado si toca.";
}

function renderNutritionLog(nutrition, nutritionScore) {
    const fields = {
        "diet-log-calories": nutrition.calories || "",
        "diet-log-protein": nutrition.protein || "",
        "diet-log-carbs": nutrition.carbs || "",
        "diet-log-fat": nutrition.fat || "",
        "diet-log-weight": nutrition.weightKg || "",
        "diet-log-note": nutrition.adherenceNote || ""
    };

    Object.entries(fields).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input && document.activeElement !== input) input.value = value;
    });

    const scoreBox = document.getElementById("dashboard-diet-score");
    if (!scoreBox) return;

    if (!nutritionScore.score) {
        scoreBox.className = "diet-score-box";
        scoreBox.innerHTML = `<strong>Sin puntuación</strong><span>Apunta tu dieta real para recibir feedback automático.</span>`;
        return;
    }

    scoreBox.className = `diet-score-box ${nutritionScore.score >= 70 ? "good" : "warning"}`;
    scoreBox.innerHTML = `
        <strong>${nutritionScore.label}: ${nutritionScore.score}/100</strong>
        <span>${nutritionScore.message} · kcal ${nutritionScore.kcalDelta > 0 ? "+" : ""}${nutritionScore.kcalDelta}, proteína ${nutritionScore.proteinDelta > 0 ? "+" : ""}${nutritionScore.proteinDelta}g.</span>
    `;
}

function saveNutritionLogFromDashboard() {
    Db.saveDailyNutrition(selectedDashboardDate, {
        calories: document.getElementById("diet-log-calories")?.value,
        protein: document.getElementById("diet-log-protein")?.value,
        carbs: document.getElementById("diet-log-carbs")?.value,
        fat: document.getElementById("diet-log-fat")?.value,
        weightKg: document.getElementById("diet-log-weight")?.value,
        adherenceNote: document.getElementById("diet-log-note")?.value
    });
    renderDashboardView();
    queueCloudSync();
}

function renderDashboardCharts() {
    if (!window.Chart) return;

    const data = Db.getDashboardChartData(selectedDashboardDate);
    const nutritionCanvas = document.getElementById("dashboardNutritionChart");
    const progressCanvas = document.getElementById("dashboardProgressChart");

    if (nutritionCanvas) {
        if (dashboardNutritionChartInstance) dashboardNutritionChartInstance.destroy();
        dashboardNutritionChartInstance = new Chart(nutritionCanvas, {
            type: "line",
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: "Kcal objetivo",
                        data: data.caloriesTarget,
                        borderColor: "#06b6d4",
                        backgroundColor: "rgba(6, 182, 212, 0.06)",
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.3
                    },
                    {
                        label: "Kcal reales",
                        data: data.caloriesActual,
                        borderColor: "#10b981",
                        borderWidth: 2,
                        pointRadius: 3,
                        tension: 0.3
                    },
                    {
                        label: "Carbs objetivo",
                        data: data.carbsTarget,
                        borderColor: "#a855f7",
                        borderDash: [4, 4],
                        borderWidth: 1.5,
                        pointRadius: 0,
                        yAxisID: "y1",
                        tension: 0.3
                    },
                    {
                        label: "Carbs reales",
                        data: data.carbsActual,
                        borderColor: "#f43f5e",
                        borderWidth: 1.5,
                        pointRadius: 3,
                        yAxisID: "y1",
                        tension: 0.3
                    }
                ]
            },
            options: getDashboardChartOptions("kcal", "g carbs")
        });
    }

    if (progressCanvas) {
        if (dashboardProgressChartInstance) dashboardProgressChartInstance.destroy();
        dashboardProgressChartInstance = new Chart(progressCanvas, {
            type: "line",
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: "Peso corporal",
                        data: data.bodyWeight,
                        borderColor: "#06b6d4",
                        backgroundColor: "rgba(6, 182, 212, 0.06)",
                        borderWidth: 2,
                        pointRadius: 3,
                        tension: 0.3
                    },
                    {
                        label: "Mejor 1RM",
                        data: data.bestOneRm,
                        borderColor: "#a855f7",
                        borderWidth: 2,
                        pointRadius: 3,
                        yAxisID: "y1",
                        tension: 0.3
                    }
                ]
            },
            options: getDashboardChartOptions("kg peso", "kg 1RM")
        });
    }
}

function getDashboardChartOptions(leftLabel, rightLabel) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
            legend: {
                labels: {
                    color: "#cbd5e1",
                    font: { family: "Plus Jakarta Sans", size: 10, weight: 700 }
                }
            }
        },
        scales: {
            x: {
                grid: { color: "rgba(255, 255, 255, 0.03)" },
                ticks: { color: "#64748b", maxRotation: 0 }
            },
            y: {
                title: { display: true, text: leftLabel, color: "#64748b" },
                grid: { color: "rgba(255, 255, 255, 0.04)" },
                ticks: { color: "#64748b" }
            },
            y1: {
                position: "right",
                title: { display: true, text: rightLabel, color: "#64748b" },
                grid: { drawOnChartArea: false },
                ticks: { color: "#64748b" }
            }
        }
    };
}

function renderDashboardActions(actions) {
    const container = document.getElementById("dashboard-actions-list");
    if (!container) return;

    container.innerHTML = actions.map(action => `
        <div class="action-item ${action.tone}">
            <div>
                <strong>${action.title}</strong>
                <span>${action.text}</span>
            </div>
        </div>
    `).join("");
}

function readDashboardPlanInputs() {
    return {
        date: document.getElementById("dashboard-date-input")?.value || selectedDashboardDate,
        dayType: document.getElementById("dashboard-day-type")?.value || "entreno",
        workoutDayId: document.getElementById("dashboard-workout-day")?.value || Db.getSuggestedWorkoutDay(),
        activityLevel: document.getElementById("dashboard-activity-level")?.value || "normal",
        plannedSteps: parseInt(document.getElementById("dashboard-planned-steps")?.value, 10) || 0,
        cheatMealCalories: parseInt(document.getElementById("dashboard-cheat-calories")?.value, 10) || 0
    };
}

function updateDashboardPlanFromUI(showAlert) {
    const data = readDashboardPlanInputs();
    const current = Db.getDailyPlan(data.date);
    if ((data.activityLevel !== current.activityLevel || data.dayType !== current.dayType) && data.plannedSteps === current.plannedSteps) {
        data.plannedSteps = 0;
    }
    selectedDashboardDate = data.date;
    Db.saveDailyPlan(data.date, data);
    if (data.date === getTodayISO() && data.dayType === "entreno") {
        Db.setActiveWorkoutDay(data.workoutDayId);
        startNewWorkoutSession();
    }
    renderDashboardView();
    queueCloudSync();
    if (showAlert) alert("Plan del día guardado.");
}

function saveDashboardPlanFromUI() {
    updateDashboardPlanFromUI(true);
}

function changeDashboardDate(date) {
    selectedDashboardDate = date || getTodayISO();
    renderDashboardView();
}

function selectDashboardWorkoutAndTrain() {
    const plan = Db.getDailyPlan(selectedDashboardDate);
    if (plan.dayType === "entreno") {
        Db.setActiveWorkoutDay(plan.workoutDayId);
        startNewWorkoutSession();
    }
    switchView("today");
}

function renderWorkoutDaySelector() {
    const select = document.getElementById("workout-day-select");
    const title = document.getElementById("current-workout-title");
    const subtitle = document.getElementById("workout-day-subtitle");
    const strip = document.getElementById("today-mesocycle-strip");
    if (!select) return;

    const days = Db.getWorkoutDayOptions();
    const activeDayId = Db.getActiveWorkoutDay();
    const activeDay = Db.getWorkoutDay(activeDayId);
    const planner = Db.getWeeklyPlanner();

    select.innerHTML = days.map(day => `
        <option value="${day.id}" ${day.id === activeDayId ? "selected" : ""}>${day.title}</option>
    `).join("");

    if (title) title.innerText = activeDay.title;
    if (subtitle) subtitle.innerText = activeDay.subtitle;

    if (strip) {
        strip.innerHTML = `
            <span>Semana ${planner.mesocycle.week}/${planner.mesocycle.lengthWeeks}</span>
            <span>${planner.mesocycle.phaseLabel}</span>
            <span>${planner.completedWorkouts}/${planner.plannedTrainingDays} entrenos</span>
            <span>Recomendado: ${planner.suggestedDay.title.replace("Dia ", "D")}</span>
        `;
    }
}

function changeWorkoutDay(dayId) {
    Db.setActiveWorkoutDay(dayId);
    startNewWorkoutSession();
    renderHeaderStatus();
    renderWorkoutDaySelector();
    queueCloudSync();
}

function selectSuggestedWorkoutDay() {
    const planner = Db.getWeeklyPlanner();
    changeWorkoutDay(planner.suggestedDayId);
    switchView("today");
}

function renderSetupForm() {
    const exercises = Db.getExercisesConfig();
    const container = document.getElementById("setup-exercises-list");
    if (!container) return;

    container.innerHTML = exercises.map(ex => `
        <div class="setup-row">
            <div class="setup-info">
                <h4>${ex.name}</h4>
                <span>${ex.category} · ${ex.rMin}-${ex.rMax} reps · RIR ${ex.targetRir}</span>
            </div>
            <div class="setup-input-wrapper">
                <input type="number" step="0.5" id="setup-weight-${ex.id}" placeholder="${ex.defaultWeight || 0}" value="${ex.currentWeight ?? ex.defaultWeight ?? ""}" required>
                <span>kg</span>
            </div>
        </div>
    `).join("");
}

function saveInitialWeights() {
    const exercises = Db.getExercisesConfig();
    const weightsMap = {};

    exercises.forEach(ex => {
        const input = document.getElementById(`setup-weight-${ex.id}`);
        if (input) weightsMap[ex.id] = parseFloat(input.value || ex.defaultWeight || 0);
    });

    Db.initializeWeights(weightsMap);
    queueCloudSync();
    renderWorkoutDaySelector();
    switchView("dashboard");
    startNewWorkoutSession();
}

function startNewWorkoutSession() {
    const dayId = Db.getActiveWorkoutDay();
    const config = Db.getWorkoutExercises(dayId);

    currentWorkoutSession = {
        dayId,
        exercises: config.map(ex => ({
            id: ex.id,
            name: ex.name,
            sets: Array.from({ length: ex.sets }, () => ({
                completed: false,
                repsEdited: null
            }))
        }))
    };

    renderWorkoutDaySelector();
    renderActiveWorkout();
}

function renderActiveWorkout() {
    const container = document.getElementById("active-exercises-container");
    if (!container || !Db.isConfigured()) return;

    const dayId = currentWorkoutSession.dayId || Db.getActiveWorkoutDay();
    const config = Db.getWorkoutExercises(dayId);

    if (currentWorkoutSession.dayId !== dayId || currentWorkoutSession.exercises.length === 0) {
        startNewWorkoutSession();
        return;
    }

    container.innerHTML = config.map((ex, exIdx) => {
        const sessionEx = currentWorkoutSession.exercises.find(e => e.id === ex.id);
        if (!sessionEx) return "";

        const setsHtml = sessionEx.sets.map((set, setIdx) => {
            const targetReps = set.repsEdited !== null ? set.repsEdited : ex.currentRepsTarget;
            return `
                <div class="set-row ${set.completed ? "completed" : ""}" id="set-row-${exIdx}-${setIdx}">
                    <div class="set-number">Serie ${setIdx + 1}</div>
                    <div class="set-target">
                        Objetivo: <strong>${formatKg(ex.currentWeight ?? ex.defaultWeight)} kg</strong> x <strong>${targetReps} reps</strong>
                        ${set.repsEdited !== null ? '<span class="edited-reps-label">(editado)</span>' : ""}
                    </div>
                    <div class="set-actions">
                        <button class="btn-edit-reps" onclick="openRepsModal('${ex.id}', ${setIdx})" title="Editar repeticiones">
                            <i data-lucide="edit" style="width: 14px; height: 14px;"></i>
                            ${set.repsEdited !== null ? set.repsEdited : "Reps"}
                        </button>
                        <button class="check-button" onclick="toggleSetCheck(${exIdx}, ${setIdx}, ${ex.rest})" title="Marcar serie">
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
                        <span class="exercise-cat">${ex.category} · ${ex.muscleGroup} · RIR ${ex.targetRir}</span>
                    </div>
                    <div class="exercise-rest-tag">
                        <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
                        2 min
                    </div>
                </div>
                ${ex.notes ? `<div class="exercise-notes">${ex.notes}</div>` : ""}
                <div class="exercise-range-row">
                    <span>Rango ${ex.rMin}-${ex.rMax}</span>
                    <span>Microcarga +${formatKg(ex.increment)} kg</span>
                    <span>${ex.sets}/${ex.baseSets} series</span>
                </div>
                <div class="sets-container">${setsHtml}</div>
            </div>
        `;
    }).join("");

    refreshIcons();
}

function toggleSetCheck(exIdx, setIdx, restTimeSeconds) {
    const sessionEx = currentWorkoutSession.exercises[exIdx];
    if (!sessionEx) return;

    const set = sessionEx.sets[setIdx];
    set.completed = !set.completed;

    if (set.completed) {
        startRestTimer(restTimeSeconds);
    } else {
        set.repsEdited = null;
    }

    renderActiveWorkout();
}

function startRestTimer(seconds) {
    if (timerState.intervalId) clearInterval(timerState.intervalId);

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
    const timeString = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    if (textDisplay) textDisplay.innerText = timeString;
    if (statusLabel) statusLabel.innerText = timerState.isRunning ? "Descanso" : "Listo";

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
    const timerText = document.getElementById("timer-text-display");
    if (!widget || !timerText) return;

    widget.style.transform = "scale(1.15)";
    widget.style.boxShadow = "0 0 30px var(--accent-violet-glow)";
    timerText.style.color = "#ef4444";

    setTimeout(() => {
        widget.style.transform = "scale(1)";
        widget.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.5)";
        timerText.style.color = "var(--text-primary)";
    }, 2000);
}

function playTimerBeep() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        gain1.gain.setValueAtTime(0.08, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.15);

        setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = "sine";
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

function openRepsModal(exerciseId, setIndex) {
    modalState.exerciseId = exerciseId;
    modalState.setIndex = setIndex;

    const ex = Db.getWorkoutExercises(currentWorkoutSession.dayId).find(item => item.id === exerciseId);
    const sessionEx = currentWorkoutSession.exercises.find(item => item.id === exerciseId);
    if (!ex || !sessionEx) return;

    const currentEdited = sessionEx.sets[setIndex].repsEdited;
    modalState.repsValue = currentEdited !== null ? currentEdited : ex.currentRepsTarget;

    document.getElementById("modal-reps-value").innerText = modalState.repsValue;
    document.getElementById("edit-reps-subtitle").innerText =
        `Repeticiones logradas en ${ex.name} (Serie ${setIndex + 1}). Objetivo: ${ex.currentRepsTarget} reps.`;

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
    const sessionEx = currentWorkoutSession.exercises.find(e => e.id === modalState.exerciseId);
    if (!sessionEx) return;

    const set = sessionEx.sets[modalState.setIndex];
    set.repsEdited = modalState.repsValue;
    set.completed = true;

    closeRepsModal();
    startRestTimer(120);
    renderActiveWorkout();
}

function finishWorkout() {
    const hasCompletedAny = currentWorkoutSession.exercises.some(ex => ex.sets.some(s => s.completed));
    if (!hasCompletedAny) {
        alert("Completa al menos una serie antes de guardar.");
        return;
    }

    const result = Db.logWorkout(currentWorkoutSession.exercises, currentWorkoutSession.dayId);
    const summaryList = document.getElementById("summary-progression-list");

    if (summaryList) {
        summaryList.innerHTML = result.summary.map(item => {
            let itemClass = "stable";
            if (item.status === "weight_up") itemClass = "weight_up";
            if (item.status === "rep_up") itemClass = "rep_up";
            if (item.status === "deload_trigger") itemClass = "deload";

            return `
                <div class="summary-list-item ${itemClass}">
                    <strong>${item.exercise}:</strong> ${item.message}
                </div>
            `;
        }).join("");
    }

    document.getElementById("progression-summary-overlay").classList.add("active");

    if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
        timerState.isRunning = false;
        document.getElementById("global-timer-widget").classList.remove("active");
    }

    renderHeaderStatus();
    queueCloudSync();
}

function closeSummaryOverlay() {
    document.getElementById("progression-summary-overlay").classList.remove("active");
    startNewWorkoutSession();
    switchView("dashboard");
}

function renderProgressView() {
    const planner = Db.getWeeklyPlanner();
    renderWeeklyPlanSummary(planner);
    renderWeeklyVolume(planner.weeklyVolume);
    renderForecast();
    renderProgressChartSelect();
    renderProgressChart();
    renderWorkoutHistoryList();
    refreshIcons();
}

function renderWeeklyPlanSummary(planner) {
    const container = document.getElementById("weekly-plan-summary");
    if (!container) return;

    container.innerHTML = `
        <div class="plan-pill">
            <span>Mesociclo</span>
            <strong>Semana ${planner.mesocycle.week}/${planner.mesocycle.lengthWeeks}</strong>
        </div>
        <div class="plan-pill">
            <span>Fase</span>
            <strong>${planner.mesocycle.phaseLabel}</strong>
        </div>
        <div class="plan-pill">
            <span>Entrenos</span>
            <strong>${planner.completedWorkouts}/${planner.plannedTrainingDays}</strong>
        </div>
        <button class="plan-action" onclick="selectSuggestedWorkoutDay()">
            <i data-lucide="wand-sparkles"></i>
            ${planner.suggestedDay.title.replace("Dia ", "D")}
        </button>
    `;
}

function renderWeeklyVolume(volume) {
    const container = document.getElementById("weekly-volume-container");
    if (!container) return;

    container.innerHTML = volume.groups.map(group => {
        const percent = Math.min(100, (group.completed / group.target) * 100);
        const status = group.completed >= group.target ? "Volumen objetivo alcanzado" : `Restan ${group.remaining} series`;
        const overMax = group.completed > group.max;
        return `
            <div class="volume-bar-wrapper ${overMax ? "over-max" : ""}">
                <div class="volume-header">
                    <span class="volume-name">${group.label}</span>
                    <span class="volume-score">${group.completed} / ${group.target} series</span>
                </div>
                <div class="volume-bar-bg">
                    <div class="volume-bar-fill" style="width:${percent}%"></div>
                </div>
                <div class="volume-footer">
                    <span>Mín: ${group.min}</span>
                    <span>${overMax ? "Supera el máximo útil" : status}</span>
                    <span>Máx: ${group.max}</span>
                </div>
            </div>
        `;
    }).join("");
}

function renderForecast() {
    const activeDay = Db.getWorkoutDay(Db.getActiveWorkoutDay());
    const config = Db.getWorkoutExercises(activeDay.id);
    const forecastContainer = document.getElementById("forecast-exercises-container");
    if (!forecastContainer) return;

    forecastContainer.innerHTML = `
        <div class="forecast-day-title">${activeDay.title} · ${activeDay.subtitle}</div>
        ${config.map(ex => {
            let badgeClass = "consolidation";
            let badgeText = "Consolidando";
            let strategyText = `Mantener ${formatKg(ex.currentWeight ?? ex.defaultWeight)} kg y subir reps hasta ${ex.rMax}.`;

            if (ex.currentRepsTarget === ex.rMax) {
                badgeText = "Carga lista";
                strategyText = `Si completas todas las series, sube +${formatKg(ex.increment)} kg y vuelve a ${ex.rMin} reps.`;
            }
            if (ex.consecutiveNoProgress > 0) {
                badgeClass = "deload";
                badgeText = "Fatiga";
                strategyText = "Si vuelve a no mejorar, reset -5% para relanzar el ciclo.";
            }

            return `
                <div class="forecast-card">
                    <div class="forecast-info">
                        <h5>${ex.name}</h5>
                        <span class="forecast-badge ${badgeClass}">${badgeText}</span>
                        <div class="forecast-strategy">${strategyText}</div>
                    </div>
                    <div class="forecast-target">
                        <div class="forecast-target-value">${formatKg(ex.currentWeight ?? ex.defaultWeight)} kg x ${ex.currentRepsTarget}</div>
                        <div style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">${ex.sets} series · 2 min</div>
                    </div>
                </div>
            `;
        }).join("")}
    `;
}

function renderProgressChartSelect() {
    const select = document.getElementById("chart-exercise-select");
    if (!select) return;

    const config = Db.getExercisesConfig();
    const currentValue = select.value;
    select.innerHTML = config.map(ex => `<option value="${ex.id}">${ex.name}</option>`).join("");
    if (currentValue && config.some(ex => ex.id === currentValue)) {
        select.value = currentValue;
    }
}

function renderProgressChart() {
    const select = document.getElementById("chart-exercise-select");
    if (!select) return;

    const selectedExercise = select.value;
    const historyData = Db.getExerciseHistory(selectedExercise);
    const ctx = document.getElementById("progressChart");
    if (!ctx) return;

    if (progressChartInstance) {
        progressChartInstance.destroy();
    }

    if (historyData.length === 0) {
        const chartCtx = ctx.getContext("2d");
        chartCtx.clearRect(0, 0, ctx.width, ctx.height);
        chartCtx.fillStyle = "#64748b";
        chartCtx.font = "14px Outfit";
        chartCtx.textAlign = "center";
        chartCtx.fillText("Registra entrenamientos para ver tu evolución.", ctx.width / 2, ctx.height / 2);
        return;
    }

    const labels = historyData.map(d => {
        const parts = d.date.split("-");
        return `${parts[2]}/${parts[1]}`;
    });

    progressChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "1RM proyectado (kg)",
                    data: historyData.map(d => d.oneRM),
                    borderColor: "#06b6d4",
                    backgroundColor: "rgba(6, 182, 212, 0.08)",
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: "#06b6d4",
                    pointRadius: 4
                },
                {
                    label: "Peso usado (kg)",
                    data: historyData.map(d => d.weight),
                    borderColor: "#a855f7",
                    borderWidth: 1.5,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.1,
                    pointBackgroundColor: "#a855f7",
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
                        color: "#cbd5e1",
                        font: { family: "Plus Jakarta Sans", size: 10, weight: 600 }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: "rgba(255, 255, 255, 0.03)" },
                    ticks: { color: "#64748b" }
                },
                y: {
                    grid: { color: "rgba(255, 255, 255, 0.03)" },
                    ticks: { color: "#64748b" }
                }
            }
        }
    });
}

function renderWorkoutHistoryList() {
    const container = document.getElementById("history-list-container");
    if (!container) return;

    const history = JSON.parse(localStorage.getItem("workout_history") || "[]");
    if (history.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center;">No hay entrenamientos guardados todavía.</p>`;
        return;
    }

    container.innerHTML = [...history].reverse().map(session => {
        const dateObj = new Date(`${session.date}T00:00:00`);
        const formattedDate = dateObj.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
        const exercisesList = (session.exercises || []).map(ex => {
            const marks = (ex.sets || []).map(s => {
                return s.completed
                    ? `<span style="color: var(--success); font-weight:700;">[${s.repsCompleted}]</span>`
                    : `<span style="color: var(--text-muted);">[x]</span>`;
            }).join(" ");

            return `
                <div class="history-ex-row">
                    <span class="history-ex-name">${ex.name}</span>
                    <span class="history-ex-marks">${formatKg(ex.weightUsed)} kg x ${marks}</span>
                </div>
            `;
        }).join("");

        return `
            <div class="history-item">
                <div class="history-header">
                    <span class="history-date">${formattedDate}</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-weight:600;">${session.dayTitle || "Entreno"} · S${session.mesocycleWeek || "-"}</span>
                </div>
                <div class="history-exercises-list">${exercisesList}</div>
            </div>
        `;
    }).join("");
}

function renderDietView() {
    const dailyPlan = Db.getDailyPlan(selectedDietDate);
    const activeTabType = dailyPlan.dayType;
    document.querySelectorAll(".dieta-btn").forEach(b => b.classList.remove("active"));

    const activeBtn = document.getElementById(`dieta-tab-${activeTabType}`);
    if (activeBtn) activeBtn.classList.add("active");

    renderDietPlannerControls(dailyPlan);

    const plan = Db.getDietPlan(activeTabType, selectedDietDate);
    document.getElementById("macro-kcal").innerText = plan.calories;
    document.getElementById("macro-protein").innerText = `${plan.protein}g`;
    document.getElementById("macro-carbs").innerText = `${plan.carbs}g`;
    document.getElementById("macro-fat").innerText = `${plan.fat}g`;

    const descElement = document.getElementById("diet-steps-desc");
    if (descElement) {
        const adjustmentText = plan.stepAdjustment === 0
            ? "Sin ajuste por pasos todavía."
            : `Ajuste por pasos: ${plan.stepAdjustment > 0 ? "+" : ""}${plan.stepAdjustment} kcal.`;
        descElement.innerText = `Objetivo base: ${plan.stepsTarget.toLocaleString("es-ES")} pasos. Objetivo con cheat/activity: ${plan.totalSuggestedSteps.toLocaleString("es-ES")}. Ganancia buscada: ${plan.weeklyGainTarget}. ${adjustmentText}`;
    }

    const stepsInput = document.getElementById("steps-input-value");
    const stepsStatus = document.getElementById("today-logged-steps-status");
    const todaySteps = Db.getStepsForDate(selectedDietDate);
    if (stepsStatus) stepsStatus.innerText = `${todaySteps.toLocaleString("es-ES")} pasos`;
    if (stepsInput) stepsInput.value = todaySteps > 0 ? todaySteps : "";
    renderCheatAdvice("diet-cheat-result", plan);

    const mealsContainer = document.getElementById("meals-list-container");
    if (mealsContainer) {
        document.getElementById("diet-meals-title").innerText = plan.title;
        mealsContainer.innerHTML = plan.meals.map(m => `
            <div class="meal-row">
                <div class="meal-name">${m.name}</div>
                <div class="meal-text">${m.text}</div>
            </div>
        `).join("");
    }
    renderFoodDatabaseView();
    refreshIcons();
}

function changeDietTab(type) {
    Db.setDietDayType(type, selectedDietDate);
    renderDietView();
    if (selectedDietDate === selectedDashboardDate) renderDashboardView();
}

function renderDietPlannerControls(plan) {
    const dateInput = document.getElementById("diet-date-input");
    const activitySelect = document.getElementById("diet-activity-level");
    const plannedStepsInput = document.getElementById("diet-planned-steps");
    const cheatInput = document.getElementById("diet-cheat-calories");

    if (dateInput) dateInput.value = selectedDietDate;
    renderActivityOptions(activitySelect, plan.activityLevel);
    if (plannedStepsInput) plannedStepsInput.value = plan.plannedSteps;
    if (cheatInput) cheatInput.value = plan.cheatMealCalories || "";
}

function readDietPlanInputs() {
    const current = Db.getDailyPlan(selectedDietDate);
    return {
        date: document.getElementById("diet-date-input")?.value || selectedDietDate,
        dayType: current.dayType,
        workoutDayId: current.workoutDayId,
        activityLevel: document.getElementById("diet-activity-level")?.value || current.activityLevel,
        plannedSteps: parseInt(document.getElementById("diet-planned-steps")?.value, 10) || current.plannedSteps,
        cheatMealCalories: parseInt(document.getElementById("diet-cheat-calories")?.value, 10) || 0
    };
}

function updateDietPlanFromUI(showAlert) {
    const data = readDietPlanInputs();
    const current = Db.getDailyPlan(data.date);
    if (data.activityLevel !== current.activityLevel && data.plannedSteps === current.plannedSteps) {
        data.plannedSteps = 0;
    }
    selectedDietDate = data.date;
    Db.saveDailyPlan(data.date, data);
    renderDietView();
    if (selectedDietDate === selectedDashboardDate) renderDashboardView();
    queueCloudSync();
    if (showAlert) alert("Dieta recalculada.");
}

function saveDietPlanFromUI() {
    updateDietPlanFromUI(true);
}

function changeDietDate(date) {
    selectedDietDate = date || getTodayISO();
    renderDietView();
}

function saveSteps() {
    const input = document.getElementById("steps-input-value");
    if (!input) return;

    const stepsVal = parseInt(input.value, 10) || 0;
    if (stepsVal < 0) {
        alert("Introduce un número de pasos válido.");
        return;
    }

    Db.logDailySteps(stepsVal, selectedDietDate);
    renderDietView();
    if (selectedDietDate === selectedDashboardDate) renderDashboardView();
    queueCloudSync();
    alert("Pasos registrados.");
}

function renderFoodDatabaseView() {
    const container = document.getElementById("food-results-container");
    if (!container) return;

    const note = document.getElementById("food-source-note");
    const categorySelect = document.getElementById("food-category-select");
    const count = document.getElementById("food-db-count");

    if (!window.FoodDB) {
        container.innerHTML = `<p class="empty-food-state">Base de alimentos no cargada.</p>`;
        return;
    }

    if (note) note.innerText = window.FoodDB.sourceNote;
    if (count) count.innerText = `${window.FoodDB.foods.length} alimentos`;
    if (categorySelect && categorySelect.dataset.ready !== "true") {
        categorySelect.innerHTML = window.FoodDB.categories.map(([id, label]) => `
            <option value="${escapeHtml(id)}">${escapeHtml(label)}</option>
        `).join("");
        categorySelect.dataset.ready = "true";
    }

    renderFoodSearch();
    renderFoodMealBuilder();
}

function renderFoodSearch() {
    const container = document.getElementById("food-results-container");
    if (!container || !window.FoodDB) return;

    const query = document.getElementById("food-search-input")?.value || "";
    const category = document.getElementById("food-category-select")?.value || "all";
    const foods = window.FoodDB.search(query, category);

    if (!foods.length) {
        container.innerHTML = `<p class="empty-food-state">No hay resultados para esa búsqueda.</p>`;
        return;
    }

    container.innerHTML = foods.map(food => `
        <article class="food-card">
            <img src="${food.image}" alt="${escapeHtml(food.name)}" class="food-image" loading="lazy">
            <div class="food-card-body">
                <div>
                    <div class="food-name">${escapeHtml(food.name)}</div>
                    <div class="food-brand">${escapeHtml(food.brand)} · ración ${formatMacro(food.servingG)}g</div>
                </div>
                <div class="food-macro-row">
                    <span>${formatInt(food.kcal)} kcal</span>
                    <span>P ${formatMacro(food.protein)}g</span>
                    <span>C ${formatMacro(food.carbs)}g</span>
                    <span>G ${formatMacro(food.fat)}g</span>
                </div>
                <button class="btn btn-secondary food-add-btn" onclick="addFoodToMeal('${food.id}')">
                    <i data-lucide="plus"></i>
                    Añadir
                </button>
            </div>
        </article>
    `).join("");
    refreshIcons();
}

function addFoodToMeal(foodId) {
    if (!window.FoodDB) return;
    const food = window.FoodDB.foods.find(item => item.id === foodId);
    if (!food) return;
    currentFoodMeal.push({ foodId, grams: food.servingG || 100 });
    renderFoodMealBuilder();
}

function updateFoodMealGrams(index, value) {
    if (!currentFoodMeal[index]) return;
    currentFoodMeal[index].grams = Math.max(0, parseFloat(value) || 0);
    renderFoodMealBuilder();
}

function removeFoodMealItem(index) {
    currentFoodMeal.splice(index, 1);
    renderFoodMealBuilder();
}

function clearFoodMealBuilder() {
    currentFoodMeal = [];
    renderFoodMealBuilder();
}

function renderFoodMealBuilder() {
    const builder = document.getElementById("food-meal-builder");
    if (!builder || !window.FoodDB) return;

    currentFoodMeal = currentFoodMeal.filter(item => window.FoodDB.foods.some(food => food.id === item.foodId));
    if (!currentFoodMeal.length) {
        builder.innerHTML = `<p class="empty-food-state">Añade alimentos para construir una comida.</p>`;
    } else {
        builder.innerHTML = currentFoodMeal.map((item, index) => {
            const food = window.FoodDB.foods.find(f => f.id === item.foodId);
            const scaled = window.FoodDB.scale(food, item.grams);
            return `
                <div class="food-meal-row">
                    <img src="${food.image}" alt="${escapeHtml(food.name)}" class="food-meal-thumb" loading="lazy">
                    <div class="food-meal-main">
                        <strong>${escapeHtml(food.name)}</strong>
                        <span>${formatInt(scaled.kcal)} kcal · P ${formatMacro(scaled.protein)}g · C ${formatMacro(scaled.carbs)}g · G ${formatMacro(scaled.fat)}g</span>
                    </div>
                    <label class="grams-input">
                        <span>g</span>
                        <input type="number" value="${formatMacro(item.grams)}" min="0" step="5" onchange="updateFoodMealGrams(${index}, this.value)">
                    </label>
                    <button class="icon-btn" onclick="removeFoodMealItem(${index})" title="Quitar alimento">
                        <i data-lucide="x"></i>
                    </button>
                </div>
            `;
        }).join("");
    }

    const totals = window.FoodDB.total(currentFoodMeal);
    const kcal = document.getElementById("food-meal-kcal");
    const protein = document.getElementById("food-meal-protein");
    const carbs = document.getElementById("food-meal-carbs");
    const fat = document.getElementById("food-meal-fat");
    if (kcal) kcal.innerText = formatInt(totals.kcal);
    if (protein) protein.innerText = `${formatMacro(totals.protein)}g`;
    if (carbs) carbs.innerText = `${formatMacro(totals.carbs)}g`;
    if (fat) fat.innerText = `${formatMacro(totals.fat)}g`;
    refreshIcons();
}

function applyFoodMealToDietLog() {
    if (!window.FoodDB || !currentFoodMeal.length) {
        alert("Añade al menos un alimento a la comida.");
        return;
    }

    const totals = window.FoodDB.total(currentFoodMeal);
    const current = Db.getDailyNutrition(selectedDietDate);
    Db.saveDailyNutrition(selectedDietDate, {
        calories: current.calories + Math.round(totals.kcal),
        protein: current.protein + Math.round(totals.protein),
        carbs: current.carbs + Math.round(totals.carbs),
        fat: current.fat + Math.round(totals.fat),
        weightKg: current.weightKg,
        adherenceNote: current.adherenceNote
    });

    const message = `${formatInt(totals.kcal)} kcal sumadas a ${selectedDietDate}.`;
    currentFoodMeal = [];
    renderDietView();
    if (selectedDietDate === selectedDashboardDate) renderDashboardView();
    queueCloudSync();
    alert(message);
}

function renderSettingsView() {
    renderMesocycleSettings();
    renderSyncSettings();
    const config = Db.getExercisesConfig();
    const container = document.getElementById("settings-exercises-list");
    if (!container) return;

    container.innerHTML = config.map(ex => `
        <div class="setup-row" style="padding: 0.75rem 1rem;">
            <div class="setup-info">
                <h4 style="font-size: 0.9rem;">${ex.name}</h4>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${ex.muscleGroup} · ${ex.rMin}-${ex.rMax} reps · +${formatKg(ex.increment)} kg</span>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <div class="setup-input-wrapper">
                    <input type="number" step="0.5" id="settings-weight-${ex.id}" value="${formatKg(ex.currentWeight || ex.defaultWeight || 0)}" style="width: 62px; font-size: 0.85rem; padding: 0.35rem;">
                    <span style="font-size: 0.8rem;">kg</span>
                </div>
                <div class="setup-input-wrapper">
                    <input type="number" id="settings-reps-${ex.id}" value="${ex.currentRepsTarget}" style="width: 50px; font-size: 0.85rem; padding: 0.35rem;">
                    <span style="font-size: 0.8rem;">reps</span>
                </div>
            </div>
        </div>
    `).join("");

    refreshIcons();
}

function renderSyncSettings() {
    const settings = SyncClient.getSettings();
    const endpoint = document.getElementById("settings-sync-endpoint");
    const key = document.getElementById("settings-sync-key");
    const secret = document.getElementById("settings-sync-secret");
    const status = document.getElementById("sync-status-text");

    if (endpoint) endpoint.value = settings.endpoint;
    if (key) key.value = settings.key;
    if (secret) secret.value = settings.secret;
    if (status) status.innerText = localStorage.getItem("sync_last_status") || "Sin sincronizar todavía.";
}

function readSyncSettingsFromUI() {
    return {
        endpoint: document.getElementById("settings-sync-endpoint")?.value || "",
        key: document.getElementById("settings-sync-key")?.value || "app-fitness-main",
        secret: document.getElementById("settings-sync-secret")?.value || ""
    };
}

async function saveSyncSettingsFromUI() {
    SyncClient.saveSettings(readSyncSettingsFromUI());
    await SyncClient.syncNow({ silent: false });
    refreshAfterSync();
}

async function syncNowFromUI() {
    await SyncClient.syncNow({ silent: false });
    refreshAfterSync();
}

function renderMesocycleSettings() {
    const settings = Db.getMesocycleSettings();
    const startInput = document.getElementById("settings-meso-start");
    const lengthInput = document.getElementById("settings-meso-length");
    const daysInput = document.getElementById("settings-training-days");

    if (startInput) startInput.value = settings.startDate;
    if (lengthInput) lengthInput.value = settings.lengthWeeks;
    if (daysInput) daysInput.value = settings.plannedTrainingDays;
}

function saveMesocycleSettingsFromUI() {
    const startInput = document.getElementById("settings-meso-start");
    const lengthInput = document.getElementById("settings-meso-length");
    const daysInput = document.getElementById("settings-training-days");

    Db.saveMesocycleSettings({
        startDate: startInput?.value,
        lengthWeeks: lengthInput?.value,
        plannedTrainingDays: daysInput?.value
    });

    alert("Mesociclo actualizado.");
    renderSettingsView();
    renderHeaderStatus();
}

function startNewMesocycleFromUI() {
    Db.startNewMesocycle();
    alert("Nuevo mesociclo iniciado con fecha de hoy.");
    renderSettingsView();
    renderHeaderStatus();
}

function saveManualAdjustments() {
    const config = Db.getExercisesConfig();
    config.forEach(ex => {
        const weightInput = document.getElementById(`settings-weight-${ex.id}`);
        const repsInput = document.getElementById(`settings-reps-${ex.id}`);

        if (weightInput && repsInput) {
            ex.currentWeight = parseFloat(weightInput.value) || 0;
            ex.currentRepsTarget = Math.max(ex.rMin, Math.min(ex.rMax, parseInt(repsInput.value, 10) || ex.rMin));
            ex.consecutiveNoProgress = 0;
        }
    });

    Db.saveExercisesConfig(config);
    queueCloudSync();
    alert("Ajustes actualizados.");
    switchView("dashboard");
    startNewWorkoutSession();
}

function confirmReset() {
    const conf = confirm("¿Seguro que quieres borrar pesos, historial, pasos y mesociclo?");
    if (conf) {
        Db.resetDatabase();
        switchView("setup");
        renderSetupForm();
    }
}
