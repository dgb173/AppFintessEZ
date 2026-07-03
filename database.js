// Base de datos local: rutinas, progresion, mesociclos, volumen semanal y dieta.

const STANDARD_REST_SECONDS = 120;

const USER_PROFILE_DEFAULT = {
    heightCm: 178,
    weightKg: 71,
    targetWeightKg: 74,
    age: 25,
    sex: "male",
    goal: "Subir a 74 kg seco y fuerte"
};

const MESOCYCLE_DEFAULTS = {
    startDate: null,
    lengthWeeks: 6,
    plannedTrainingDays: 4,
    standardRestSeconds: STANDARD_REST_SECONDS
};

const ACTIVITY_LEVELS = {
    baja: {
        label: "Baja",
        trainingSteps: 7500,
        restSteps: 9000,
        calorieOffset: -100
    },
    normal: {
        label: "Normal",
        trainingSteps: 9000,
        restSteps: 11000,
        calorieOffset: 0
    },
    alta: {
        label: "Alta",
        trainingSteps: 11000,
        restSteps: 13000,
        calorieOffset: 75
    },
    muy_alta: {
        label: "Muy alta",
        trainingSteps: 13000,
        restSteps: 15000,
        calorieOffset: 150
    }
};

const MUSCLE_VOLUME_TARGETS = {
    pecho: { label: "Pecho", min: 8, target: 10, max: 16 },
    espalda: { label: "Espalda", min: 10, target: 12, max: 18 },
    hombro: { label: "Hombro", min: 4, target: 4, max: 10 },
    biceps: { label: "Biceps", min: 4, target: 4, max: 10 },
    triceps: { label: "Triceps", min: 4, target: 4, max: 10 },
    femoral: { label: "Femoral", min: 4, target: 4, max: 10 },
    gluteo: { label: "Gluteo", min: 4, target: 4, max: 10 },
    cuadriceps: { label: "Cuadriceps", min: 4, target: 4, max: 10 },
    gemelos: { label: "Gemelos", min: 4, target: 4, max: 10 },
    abductores: { label: "Abductores", min: 4, target: 4, max: 8 },
    abdomen: { label: "Abdomen", min: 6, target: 9, max: 12 }
};

const EXERCISE_LIBRARY = [
    {
        id: "tg_inc_press",
        name: "Technogym Incline Chest Press",
        sets: 2,
        rMin: 6,
        rMax: 10,
        rest: STANDARD_REST_SECONDS,
        increment: 2.5,
        category: "Pecho pesado",
        muscleGroup: "pecho",
        notes: "Asiento bajo; foco clavicular; empuja con maxima intencion sin despegar hombros.",
        defaultWeight: 40,
        currentWeight: null,
        currentRepsTarget: 6,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "1-2"
    },
    {
        id: "pure_dip",
        name: "Pure Strength Seated Dip",
        sets: 2,
        rMin: 6,
        rMax: 10,
        rest: STANDARD_REST_SECONDS,
        increment: 2.5,
        category: "Pecho pesado",
        muscleGroup: "pecho",
        notes: "Torso ligeramente inclinado; recorrido estable y codos bajo control.",
        defaultWeight: 50,
        currentWeight: null,
        currentRepsTarget: 6,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "1-2"
    },
    {
        id: "pec_deck",
        name: "Aperturas en Contractora (Pec Deck)",
        sets: 1,
        rMin: 10,
        rMax: 15,
        rest: STANDARD_REST_SECONDS,
        increment: 2.5,
        category: "Pecho aislado",
        muscleGroup: "pecho",
        notes: "Pausa breve en acortamiento; controla la vuelta sin perder tension.",
        defaultWeight: 35,
        currentWeight: null,
        currentRepsTarget: 10,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "0-1"
    },
    {
        id: "lat_raises",
        name: "Elevaciones Laterales",
        sets: 2,
        rMin: 12,
        rMax: 15,
        rest: STANDARD_REST_SECONDS,
        increment: 1.25,
        category: "Deltoide medio",
        muscleGroup: "hombro",
        notes: "Subida limpia sin impulso; hombro lejos de la oreja.",
        defaultWeight: 10,
        currentWeight: null,
        currentRepsTarget: 12,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "0-2"
    },
    {
        id: "bicep_curl",
        name: "Curl de Biceps Alterno (Manc.)",
        sets: 2,
        rMin: 10,
        rMax: 12,
        rest: STANDARD_REST_SECONDS,
        increment: 1.25,
        category: "Biceps",
        muscleGroup: "biceps",
        notes: "Supina fuerte arriba; evita balanceo de cadera.",
        defaultWeight: 14,
        currentWeight: null,
        currentRepsTarget: 10,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "0-1"
    },
    {
        id: "seated_leg_curl",
        name: "Curl Femoral Sentado",
        sets: 2,
        rMin: 10,
        rMax: 12,
        rest: STANDARD_REST_SECONDS,
        increment: 5,
        category: "Femoral",
        muscleGroup: "femoral",
        notes: "Cadera pegada al respaldo; pausa en contraccion.",
        defaultWeight: 45,
        currentWeight: null,
        currentRepsTarget: 10,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "0-2"
    },
    {
        id: "hip_thrust",
        name: "Hip Thrust (Gluteo)",
        sets: 2,
        rMin: 8,
        rMax: 12,
        rest: STANDARD_REST_SECONDS,
        increment: 10,
        category: "Gluteo",
        muscleGroup: "gluteo",
        notes: "Retroversion arriba; bloquea sin hiperextender lumbar.",
        defaultWeight: 80,
        currentWeight: null,
        currentRepsTarget: 8,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "1-2"
    },
    {
        id: "cable_crunch",
        name: "Abdominales en Polea Alta",
        sets: 3,
        rMin: 12,
        rMax: 15,
        rest: STANDARD_REST_SECONDS,
        increment: 5,
        category: "Abdomen",
        muscleGroup: "abdomen",
        notes: "Flexiona columna, no tires con brazos; exhala fuerte abajo.",
        defaultWeight: 30,
        currentWeight: null,
        currentRepsTarget: 12,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "0-2"
    },
    {
        id: "pure_pulldown",
        name: "Technogym Pulldown Pure (Unilat.)",
        sets: 2,
        rMin: 8,
        rMax: 12,
        rest: STANDARD_REST_SECONDS,
        increment: 2.5,
        category: "Dorsal",
        muscleGroup: "espalda",
        notes: "Estabilidad total; guia con el codo y no con la mano.",
        defaultWeight: 30,
        currentWeight: null,
        currentRepsTarget: 8,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "1-2"
    },
    {
        id: "pure_row",
        name: "Technogym Row Pure (De Pie)",
        sets: 2,
        rMin: 8,
        rMax: 12,
        rest: STANDARD_REST_SECONDS,
        increment: 2.5,
        category: "Dorsal",
        muscleGroup: "espalda",
        notes: "Unilateral; evita protraccion excesiva y tira hacia la cadera.",
        defaultWeight: 35,
        currentWeight: null,
        currentRepsTarget: 8,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "1-2"
    },
    {
        id: "tbar_row",
        name: "Remo en T (T-Bar Row)",
        sets: 2,
        rMin: 6,
        rMax: 10,
        rest: STANDARD_REST_SECONDS,
        increment: 5,
        category: "Upper back pesado",
        muscleGroup: "espalda",
        notes: "Agarre ancho; junta escapulas sin perder posicion toracica.",
        defaultWeight: 40,
        currentWeight: null,
        currentRepsTarget: 6,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "1-2"
    },
    {
        id: "hack_squat",
        name: "Sentadilla Hack o Prensa",
        sets: 2,
        rMin: 8,
        rMax: 12,
        rest: STANDARD_REST_SECONDS,
        increment: 10,
        category: "Cuadriceps",
        muscleGroup: "cuadriceps",
        notes: "Profundidad estable; no rebotes abajo.",
        defaultWeight: 60,
        currentWeight: null,
        currentRepsTarget: 8,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "1-2"
    },
    {
        id: "tricep_uni",
        name: "Extensiones Triceps Unilaterales",
        sets: 2,
        rMin: 10,
        rMax: 12,
        rest: STANDARD_REST_SECONDS,
        increment: 2.5,
        category: "Triceps",
        muscleGroup: "triceps",
        notes: "Codo fijo; estira completo sin perder tension.",
        defaultWeight: 15,
        currentWeight: null,
        currentRepsTarget: 10,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "0-1"
    },
    {
        id: "calf_raise",
        name: "Elevacion Talones de Pie",
        sets: 2,
        rMin: 12,
        rMax: 15,
        rest: STANDARD_REST_SECONDS,
        increment: 5,
        category: "Gemelos",
        muscleGroup: "gemelos",
        notes: "Pausa abajo y arriba; no rebotes.",
        defaultWeight: 50,
        currentWeight: null,
        currentRepsTarget: 12,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "0-1"
    },
    {
        id: "abductor_mach",
        name: "Maquina de Abductores",
        sets: 2,
        rMin: 12,
        rMax: 15,
        rest: STANDARD_REST_SECONDS,
        increment: 5,
        category: "Abductores",
        muscleGroup: "abductores",
        notes: "Pausa abierta; pelvis estable.",
        defaultWeight: 40,
        currentWeight: null,
        currentRepsTarget: 12,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "0-2"
    },
    {
        id: "mil_press",
        name: "Press Militar con Mancuerna",
        sets: 2,
        rMin: 8,
        rMax: 10,
        rest: STANDARD_REST_SECONDS,
        increment: 2.5,
        category: "Hombro pesado",
        muscleGroup: "hombro",
        notes: "Costillas abajo; recorrido completo sin chocar mancuernas.",
        defaultWeight: 16,
        currentWeight: null,
        currentRepsTarget: 8,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "1-2"
    },
    {
        id: "cable_bicep",
        name: "Curl de Biceps en Polea Baja",
        sets: 2,
        rMin: 12,
        rMax: 15,
        rest: STANDARD_REST_SECONDS,
        increment: 2.5,
        category: "Biceps",
        muscleGroup: "biceps",
        notes: "Tension continua; codos ligeramente delante del cuerpo.",
        defaultWeight: 20,
        currentWeight: null,
        currentRepsTarget: 12,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "0-1"
    },
    {
        id: "lying_leg_curl",
        name: "Curl Femoral Acostado",
        sets: 2,
        rMin: 10,
        rMax: 12,
        rest: STANDARD_REST_SECONDS,
        increment: 5,
        category: "Femoral",
        muscleGroup: "femoral",
        notes: "No levantes cadera; aprieta abajo.",
        defaultWeight: 35,
        currentWeight: null,
        currentRepsTarget: 10,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "0-2"
    },
    {
        id: "lunges",
        name: "Zancadas Largas / Prensa",
        sets: 2,
        rMin: 10,
        rMax: 12,
        rest: STANDARD_REST_SECONDS,
        increment: 2.5,
        category: "Gluteo y pierna",
        muscleGroup: "gluteo",
        notes: "Paso largo; tronco levemente inclinado; rodilla estable.",
        defaultWeight: 16,
        currentWeight: null,
        currentRepsTarget: 10,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "1-2"
    },
    {
        id: "leg_ext",
        name: "Extensiones Cuadriceps (Leg Ext)",
        sets: 2,
        rMin: 12,
        rMax: 15,
        rest: STANDARD_REST_SECONDS,
        increment: 5,
        category: "Cuadriceps",
        muscleGroup: "cuadriceps",
        notes: "Pausa arriba; controla la bajada.",
        defaultWeight: 40,
        currentWeight: null,
        currentRepsTarget: 12,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "0-1"
    },
    {
        id: "tricep_overhead",
        name: "Extensiones Triceps Tras Nuca",
        sets: 2,
        rMin: 10,
        rMax: 12,
        rest: STANDARD_REST_SECONDS,
        increment: 2.5,
        category: "Triceps",
        muscleGroup: "triceps",
        notes: "Busca estiramiento largo; codos fijos.",
        defaultWeight: 17.5,
        currentWeight: null,
        currentRepsTarget: 10,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "0-1"
    },
    {
        id: "seated_calf",
        name: "Elevacion Talones Sentado",
        sets: 2,
        rMin: 12,
        rMax: 15,
        rest: STANDARD_REST_SECONDS,
        increment: 5,
        category: "Gemelos",
        muscleGroup: "gemelos",
        notes: "Recorrido largo; pausa abajo.",
        defaultWeight: 30,
        currentWeight: null,
        currentRepsTarget: 12,
        consecutiveNoProgress: 0,
        lastPerformanceScore: 0,
        targetRir: "0-1"
    }
];

const WORKOUT_DAYS = {
    "1": {
        id: "1",
        title: "Dia 1: Pecho Focus",
        subtitle: "Pecho + femoral/gluteo/biceps/hombro",
        focusGroups: ["pecho", "femoral", "gluteo"],
        exercises: ["tg_inc_press", "pure_dip", "pec_deck", "lat_raises", "bicep_curl", "seated_leg_curl", "hip_thrust", "cable_crunch"]
    },
    "2": {
        id: "2",
        title: "Dia 2: Espalda Focus",
        subtitle: "Espalda + cuadriceps/triceps/gemelos/abductores",
        focusGroups: ["espalda", "cuadriceps"],
        exercises: ["pure_pulldown", "pure_row", "tbar_row", "hack_squat", "tricep_uni", "calf_raise", "abductor_mach"]
    },
    "3": {
        id: "3",
        title: "Dia 3: Pecho Focus",
        subtitle: "Pecho + hombro/biceps/femoral/gluteo",
        focusGroups: ["pecho", "hombro", "femoral"],
        exercises: ["tg_inc_press", "pure_dip", "pec_deck", "mil_press", "cable_bicep", "lying_leg_curl", "lunges", "cable_crunch"]
    },
    "4": {
        id: "4",
        title: "Dia 4: Espalda Focus",
        subtitle: "Espalda + cuadriceps/triceps/gemelos/abdomen",
        focusGroups: ["espalda", "cuadriceps", "triceps"],
        exercises: ["pure_pulldown", "pure_row", "tbar_row", "leg_ext", "tricep_overhead", "seated_calf", "abductor_mach", "cable_crunch"]
    }
};

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function safeParse(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
}

function toISODate(date = new Date()) {
    const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return local.toISOString().split("T")[0];
}

function parseISODate(dateStr) {
    return new Date(`${dateStr}T00:00:00`);
}

function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

function roundToStep(value, step) {
    if (!step) return parseFloat(value.toFixed(1));
    const rounded = Math.round(value / step) * step;
    return parseFloat(rounded.toFixed(step < 1 ? 2 : 1));
}

function initDatabase() {
    if (!localStorage.getItem("app_fitness_initialized")) {
        localStorage.setItem("workout_config", JSON.stringify(clone(EXERCISE_LIBRARY)));
        localStorage.setItem("workout_history", JSON.stringify([]));
        localStorage.setItem("steps_history", JSON.stringify({}));
        localStorage.setItem("nutrition_history", JSON.stringify({}));
        localStorage.setItem("day_plans", JSON.stringify({}));
        localStorage.setItem("diet_day_type", "entreno");
        localStorage.setItem("active_workout_day", "1");
        localStorage.setItem("user_profile", JSON.stringify(clone(USER_PROFILE_DEFAULT)));
        localStorage.setItem("mesocycle_settings", JSON.stringify({
            ...MESOCYCLE_DEFAULTS,
            startDate: toISODate()
        }));
        localStorage.setItem("is_configured", "false");
        localStorage.setItem("app_fitness_initialized", "true");
    }

    if (!localStorage.getItem("active_workout_day")) {
        localStorage.setItem("active_workout_day", "1");
    }
    if (!localStorage.getItem("user_profile")) {
        localStorage.setItem("user_profile", JSON.stringify(clone(USER_PROFILE_DEFAULT)));
    }
    if (!localStorage.getItem("mesocycle_settings")) {
        localStorage.setItem("mesocycle_settings", JSON.stringify({
            ...MESOCYCLE_DEFAULTS,
            startDate: toISODate()
        }));
    }
    if (!localStorage.getItem("day_plans")) {
        localStorage.setItem("day_plans", JSON.stringify({}));
    }
    if (!localStorage.getItem("nutrition_history")) {
        localStorage.setItem("nutrition_history", JSON.stringify({}));
    }
}

function mergeExerciseState(savedConfig) {
    const savedById = new Map();
    const savedByName = new Map();
    (savedConfig || []).forEach(ex => {
        if (ex.id) savedById.set(ex.id, ex);
        if (ex.name) savedByName.set(ex.name, ex);
    });

    return EXERCISE_LIBRARY.map(template => {
        const saved = savedById.get(template.id) || savedByName.get(template.name) || {};
        return {
            ...clone(template),
            currentWeight: saved.currentWeight ?? template.currentWeight,
            currentRepsTarget: saved.currentRepsTarget ?? template.currentRepsTarget,
            consecutiveNoProgress: saved.consecutiveNoProgress ?? 0,
            lastPerformanceScore: saved.lastPerformanceScore ?? 0
        };
    });
}

function getExercisesConfig() {
    initDatabase();
    const saved = safeParse("workout_config", []);
    const merged = mergeExerciseState(saved);
    localStorage.setItem("workout_config", JSON.stringify(merged));
    return merged;
}

function saveExercisesConfig(config) {
    const merged = mergeExerciseState(config);
    localStorage.setItem("workout_config", JSON.stringify(merged));
}

function getExerciseState(idOrName) {
    return getExercisesConfig().find(ex => ex.id === idOrName || ex.name === idOrName);
}

function getWorkoutDayOptions() {
    return Object.values(WORKOUT_DAYS).map(day => clone(day));
}

function getActiveWorkoutDay() {
    initDatabase();
    const dayId = localStorage.getItem("active_workout_day") || "1";
    return WORKOUT_DAYS[dayId] ? dayId : "1";
}

function setActiveWorkoutDay(dayId) {
    localStorage.setItem("active_workout_day", WORKOUT_DAYS[dayId] ? dayId : "1");
}

function getWorkoutDay(dayId) {
    return clone(WORKOUT_DAYS[dayId || getActiveWorkoutDay()] || WORKOUT_DAYS["1"]);
}

function getWorkoutExercises(dayId) {
    const selectedDay = WORKOUT_DAYS[dayId || getActiveWorkoutDay()] || WORKOUT_DAYS["1"];
    const config = getExercisesConfig();
    const meso = getCurrentMesocycleStatus();
    const deloadMultiplier = meso.phaseKey === "deload" ? 0.6 : 1;

    return selectedDay.exercises
        .map(id => config.find(ex => ex.id === id))
        .filter(Boolean)
        .map(ex => ({
            ...clone(ex),
            sets: Math.max(1, Math.ceil(ex.sets * deloadMultiplier)),
            baseSets: ex.sets,
            dayId: selectedDay.id
        }));
}

function isConfigured() {
    initDatabase();
    return localStorage.getItem("is_configured") === "true";
}

function initializeWeights(weightsMap) {
    const config = getExercisesConfig();
    config.forEach(ex => {
        const inputWeight = weightsMap[ex.id] ?? weightsMap[ex.name];
        if (inputWeight !== undefined && inputWeight !== null) {
            ex.currentWeight = parseFloat(inputWeight) || ex.defaultWeight || 0;
            ex.currentRepsTarget = ex.rMin;
            ex.consecutiveNoProgress = 0;
            ex.lastPerformanceScore = 0;
        }
    });
    saveExercisesConfig(config);
    localStorage.setItem("is_configured", "true");
}

function calculate1RM(weight, reps) {
    if (!weight || !reps) return 0;
    return weight * (1 + (reps / 30));
}

function getUserProfile() {
    initDatabase();
    return {
        ...clone(USER_PROFILE_DEFAULT),
        ...safeParse("user_profile", clone(USER_PROFILE_DEFAULT))
    };
}

function saveUserProfile(profile) {
    localStorage.setItem("user_profile", JSON.stringify({
        ...getUserProfile(),
        ...profile
    }));
}

function getMesocycleSettings() {
    initDatabase();
    const settings = safeParse("mesocycle_settings", {});
    return {
        ...clone(MESOCYCLE_DEFAULTS),
        startDate: settings.startDate || toISODate(),
        lengthWeeks: parseInt(settings.lengthWeeks, 10) || MESOCYCLE_DEFAULTS.lengthWeeks,
        plannedTrainingDays: parseInt(settings.plannedTrainingDays, 10) || MESOCYCLE_DEFAULTS.plannedTrainingDays,
        standardRestSeconds: STANDARD_REST_SECONDS
    };
}

function saveMesocycleSettings(settings) {
    const current = getMesocycleSettings();
    const next = {
        ...current,
        ...settings,
        lengthWeeks: Math.max(3, Math.min(8, parseInt(settings.lengthWeeks, 10) || current.lengthWeeks)),
        plannedTrainingDays: Math.max(3, Math.min(5, parseInt(settings.plannedTrainingDays, 10) || current.plannedTrainingDays)),
        standardRestSeconds: STANDARD_REST_SECONDS
    };
    localStorage.setItem("mesocycle_settings", JSON.stringify(next));
}

function startNewMesocycle() {
    const current = getMesocycleSettings();
    saveMesocycleSettings({
        ...current,
        startDate: toISODate()
    });
}

function getCurrentMesocycleStatus(dateStr) {
    const settings = getMesocycleSettings();
    const today = parseISODate(dateStr || toISODate());
    const start = parseISODate(settings.startDate);
    const diffDays = Math.max(0, Math.floor((today - start) / 86400000));
    const rawWeek = Math.floor(diffDays / 7) + 1;
    const week = Math.min(rawWeek, settings.lengthWeeks);
    const endDate = addDays(start, (settings.lengthWeeks * 7) - 1);

    let phaseKey = "base";
    let phaseLabel = "Base tecnica";
    if (week >= 3 && week < settings.lengthWeeks) {
        phaseKey = "overload";
        phaseLabel = "Sobrecarga";
    }
    if (week === settings.lengthWeeks) {
        phaseKey = "deload";
        phaseLabel = "Descarga";
    }

    return {
        ...settings,
        week,
        rawWeek,
        day: diffDays + 1,
        startDate: settings.startDate,
        endDate: toISODate(endDate),
        phaseKey,
        phaseLabel,
        isComplete: rawWeek > settings.lengthWeeks
    };
}

function getActivityLevelOptions() {
    return Object.entries(ACTIVITY_LEVELS).map(([id, level]) => ({
        id,
        ...clone(level)
    }));
}

function getDefaultStepsTarget(dayType, activityLevel) {
    const isTrainingDay = dayType === "entreno";
    const level = ACTIVITY_LEVELS[activityLevel] || ACTIVITY_LEVELS.normal;
    return isTrainingDay ? level.trainingSteps : level.restSteps;
}

function getDayPlans() {
    initDatabase();
    return safeParse("day_plans", {});
}

function saveDayPlans(plans) {
    localStorage.setItem("day_plans", JSON.stringify(plans || {}));
}

function getDailyPlan(dateStr) {
    initDatabase();
    const date = dateStr || toISODate();
    const plans = getDayPlans();
    const saved = plans[date] || {};
    const dayType = saved.dayType || localStorage.getItem("diet_day_type") || "entreno";
    const activityLevel = saved.activityLevel || "normal";

    return {
        date,
        dayType,
        workoutDayId: WORKOUT_DAYS[saved.workoutDayId] ? saved.workoutDayId : getSuggestedWorkoutDay(date),
        activityLevel,
        plannedSteps: parseInt(saved.plannedSteps, 10) || getDefaultStepsTarget(dayType, activityLevel),
        cheatMealCalories: parseInt(saved.cheatMealCalories, 10) || 0,
        notes: saved.notes || ""
    };
}

function saveDailyPlan(dateStr, plan) {
    initDatabase();
    plan = plan || {};
    const date = dateStr || toISODate();
    const current = getDailyPlan(date);
    const nextDayType = plan.dayType === "descanso" ? "descanso" : "entreno";
    const nextActivity = ACTIVITY_LEVELS[plan.activityLevel] ? plan.activityLevel : current.activityLevel;
    const plans = getDayPlans();
    const explicitSteps = parseInt(plan.plannedSteps, 10);

    const next = {
        ...current,
        ...plan,
        date,
        dayType: nextDayType,
        workoutDayId: WORKOUT_DAYS[plan.workoutDayId] ? plan.workoutDayId : current.workoutDayId,
        activityLevel: nextActivity,
        plannedSteps: explicitSteps > 0 ? explicitSteps : getDefaultStepsTarget(nextDayType, nextActivity),
        cheatMealCalories: Math.max(0, parseInt(plan.cheatMealCalories, 10) || 0),
        notes: plan.notes || current.notes || ""
    };

    plans[date] = next;
    saveDayPlans(plans);

    if (date === toISODate()) {
        localStorage.setItem("diet_day_type", next.dayType);
        if (next.dayType === "entreno") {
            setActiveWorkoutDay(next.workoutDayId);
        }
    }

    return next;
}

function logDailySteps(steps, dateStr) {
    initDatabase();
    const stepsHistory = safeParse("steps_history", {});
    stepsHistory[dateStr || toISODate()] = parseInt(steps, 10) || 0;
    localStorage.setItem("steps_history", JSON.stringify(stepsHistory));
}

function getStepsForDate(dateStr) {
    initDatabase();
    const stepsHistory = safeParse("steps_history", {});
    return stepsHistory[dateStr || toISODate()] || 0;
}

function getNutritionHistory() {
    initDatabase();
    return safeParse("nutrition_history", {});
}

function getDailyNutrition(dateStr) {
    const date = dateStr || toISODate();
    const history = getNutritionHistory();
    return {
        date,
        calories: parseInt(history[date]?.calories, 10) || 0,
        protein: parseInt(history[date]?.protein, 10) || 0,
        carbs: parseInt(history[date]?.carbs, 10) || 0,
        fat: parseInt(history[date]?.fat, 10) || 0,
        weightKg: parseFloat(history[date]?.weightKg) || 0,
        adherenceNote: history[date]?.adherenceNote || ""
    };
}

function saveDailyNutrition(dateStr, data) {
    initDatabase();
    const date = dateStr || toISODate();
    const history = getNutritionHistory();
    const current = getDailyNutrition(date);
    const next = {
        ...current,
        ...data,
        date,
        calories: Math.max(0, parseInt(data?.calories, 10) || 0),
        protein: Math.max(0, parseInt(data?.protein, 10) || 0),
        carbs: Math.max(0, parseInt(data?.carbs, 10) || 0),
        fat: Math.max(0, parseInt(data?.fat, 10) || 0),
        weightKg: Math.max(0, parseFloat(data?.weightKg) || 0),
        adherenceNote: data?.adherenceNote || ""
    };
    history[date] = next;
    localStorage.setItem("nutrition_history", JSON.stringify(history));
    return next;
}

function getNutritionScore(dateStr) {
    const date = dateStr || toISODate();
    const target = getDietPlan(null, date);
    const actual = getDailyNutrition(date);
    if (!actual.calories && !actual.protein && !actual.carbs && !actual.fat) {
        return {
            score: 0,
            label: "Sin registrar",
            kcalDelta: 0,
            proteinDelta: 0,
            carbsDelta: 0,
            fatDelta: 0,
            message: "Registra tu dieta real para que la app puntúe adherencia y ajuste decisiones."
        };
    }

    const kcalDelta = actual.calories - target.calories;
    const proteinDelta = actual.protein - target.protein;
    const carbsDelta = actual.carbs - target.carbs;
    const fatDelta = actual.fat - target.fat;
    const kcalPenalty = Math.min(40, Math.abs(kcalDelta) / 12);
    const proteinPenalty = actual.protein >= target.protein ? 0 : Math.min(25, (target.protein - actual.protein) * 0.9);
    const carbsPenalty = Math.min(18, Math.abs(carbsDelta) / 10);
    const fatPenalty = actual.fat > target.fat + 15 ? Math.min(17, (actual.fat - target.fat - 15) * 0.7) : 0;
    const score = Math.round(clamp(100 - kcalPenalty - proteinPenalty - carbsPenalty - fatPenalty, 0, 100));

    let label = "Excelente";
    if (score < 85) label = "Bien";
    if (score < 70) label = "Mejorable";
    if (score < 50) label = "Fuera de plan";

    let message = "Plan clavado: mantén la misma estructura.";
    if (proteinDelta < 0) message = `Sube proteína: faltan ${Math.abs(proteinDelta)} g.`;
    else if (Math.abs(kcalDelta) > 250) message = kcalDelta > 0 ? `Te pasaste ${Math.round(kcalDelta)} kcal: compensa con pasos o baja grasa mañana.` : `Te faltaron ${Math.abs(Math.round(kcalDelta))} kcal: añade carbohidrato limpio.`;
    else if (Math.abs(carbsDelta) > 60) message = carbsDelta > 0 ? "Carbohidratos altos: vigila que sean alrededor del entreno." : "Carbohidratos bajos: puede caer el rendimiento.";

    return {
        score,
        label,
        kcalDelta: Math.round(kcalDelta),
        proteinDelta,
        carbsDelta,
        fatDelta,
        message
    };
}

function getMondayOfCurrentWeek(dateStr) {
    const d = parseISODate(dateStr || toISODate());
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function getWeeklyWorkoutCount(dateStr) {
    const history = safeParse("workout_history", []);
    const monday = getMondayOfCurrentWeek(dateStr);
    const sunday = addDays(monday, 7);
    return history.filter(session => {
        const sessionDate = parseISODate(session.date);
        return sessionDate >= monday && sessionDate < sunday;
    }).length;
}

function getWeeklyVolume(dateStr) {
    const history = safeParse("workout_history", []);
    const config = getExercisesConfig();
    const monday = getMondayOfCurrentWeek(dateStr);
    const sunday = addDays(monday, 7);
    const volumeByGroup = {};

    Object.keys(MUSCLE_VOLUME_TARGETS).forEach(group => {
        volumeByGroup[group] = 0;
    });

    history.forEach(session => {
        const sessionDate = parseISODate(session.date);
        if (sessionDate < monday || sessionDate >= sunday) return;

        (session.exercises || []).forEach(ex => {
            const state = config.find(item => item.id === ex.id || item.name === ex.name);
            const group = ex.muscleGroup || state?.muscleGroup;
            if (!group || volumeByGroup[group] === undefined) return;

            (ex.sets || []).forEach(set => {
                if (!set.completed) return;
                let setWeight = 1;
                if (set.repsCompleted < ex.repsTarget) {
                    setWeight = Math.max(0.5, set.repsCompleted / Math.max(1, ex.repsTarget));
                }
                volumeByGroup[group] += setWeight;
            });
        });
    });

    const groups = Object.keys(MUSCLE_VOLUME_TARGETS).map(group => ({
        id: group,
        ...MUSCLE_VOLUME_TARGETS[group],
        completed: parseFloat(volumeByGroup[group].toFixed(1)),
        remaining: parseFloat(Math.max(0, MUSCLE_VOLUME_TARGETS[group].target - volumeByGroup[group]).toFixed(1))
    }));

    return {
        groups,
        byGroup: groups.reduce((acc, group) => {
            acc[group.id] = group;
            return acc;
        }, {})
    };
}

function getFallbackNextDay() {
    const history = safeParse("workout_history", []);
    const lastSession = history[history.length - 1];
    if (!lastSession?.dayId) return "1";
    const next = String((parseInt(lastSession.dayId, 10) % 4) + 1);
    return WORKOUT_DAYS[next] ? next : "1";
}

function getSuggestedWorkoutDay(dateStr) {
    const volume = getWeeklyVolume(dateStr);
    const byGroup = volume.byGroup;
    let bestDay = getFallbackNextDay();
    let bestScore = -1;

    Object.values(WORKOUT_DAYS).forEach(day => {
        const uniqueGroups = new Set();
        day.exercises.forEach(id => {
            const ex = EXERCISE_LIBRARY.find(item => item.id === id);
            if (ex) uniqueGroups.add(ex.muscleGroup);
        });
        let score = 0;
        uniqueGroups.forEach(group => {
            const data = byGroup[group];
            if (!data) return;
            score += Math.max(0, data.target - data.completed) / Math.max(1, data.target);
        });
        if (score > bestScore) {
            bestScore = score;
            bestDay = day.id;
        }
    });

    return bestDay;
}

function getWeeklyPlanner(dateStr) {
    const settings = getMesocycleSettings();
    const meso = getCurrentMesocycleStatus(dateStr);
    const weeklyVolume = getWeeklyVolume(dateStr);
    const completedWorkouts = getWeeklyWorkoutCount(dateStr);
    const remainingTrainingDays = Math.max(1, settings.plannedTrainingDays - completedWorkouts);
    const suggestedDayId = getSuggestedWorkoutDay(dateStr);

    return {
        settings,
        mesocycle: meso,
        completedWorkouts,
        remainingTrainingDays,
        plannedTrainingDays: settings.plannedTrainingDays,
        weeklyVolume,
        suggestedDayId,
        suggestedDay: getWorkoutDay(suggestedDayId),
        perNextSession: weeklyVolume.groups.map(group => ({
            id: group.id,
            label: group.label,
            targetNow: parseFloat((group.remaining / remainingTrainingDays).toFixed(1))
        }))
    };
}

function logWorkout(sessionExercises, dayId) {
    const config = getExercisesConfig();
    const selectedDay = getWorkoutDay(dayId || getActiveWorkoutDay());
    const meso = getCurrentMesocycleStatus();
    const progressionSummary = [];
    const date = toISODate();
    const isDeloadWeek = meso.phaseKey === "deload";

    const processedExercises = sessionExercises.map(exResult => {
        const exConfig = config.find(e => e.id === exResult.id || e.name === exResult.name);
        if (!exConfig) return exResult;

        const prevWeight = parseFloat(exConfig.currentWeight || exConfig.defaultWeight || 0);
        const prevRepsTarget = exConfig.currentRepsTarget || exConfig.rMin;
        const completedSets = (exResult.sets || []).filter(s => s.completed);
        const allCompleted = exResult.sets.length > 0 &&
            exResult.sets.every(s => s.completed && (s.repsEdited === null || s.repsEdited >= prevRepsTarget));
        const totalCompletedReps = completedSets.reduce((sum, set) => {
            return sum + (set.repsEdited !== null ? set.repsEdited : prevRepsTarget);
        }, 0);
        const performanceScore = prevWeight * totalCompletedReps;

        if (isDeloadWeek) {
            progressionSummary.push({
                exercise: exConfig.name,
                status: "stable",
                message: `Semana de descarga: mantén ${prevWeight} kg x ${prevRepsTarget} reps y acumula tecnica sin forzar la progresion.`
            });
        } else if (allCompleted) {
            exConfig.consecutiveNoProgress = 0;
            exConfig.lastPerformanceScore = performanceScore;

            if (exConfig.currentRepsTarget < exConfig.rMax) {
                exConfig.currentRepsTarget += 1;
                progressionSummary.push({
                    exercise: exConfig.name,
                    status: "rep_up",
                    message: `Consolidado. Proxima sesion: ${prevWeight} kg x ${exConfig.currentRepsTarget} reps.`
                });
            } else {
                exConfig.currentWeight = roundToStep(prevWeight + exConfig.increment, exConfig.increment);
                exConfig.currentRepsTarget = exConfig.rMin;
                progressionSummary.push({
                    exercise: exConfig.name,
                    status: "weight_up",
                    message: `Sobrecarga completada. Proxima sesion: ${exConfig.currentWeight} kg x ${exConfig.currentRepsTarget} reps.`
                });
            }
        } else {
            const improvedPartial = performanceScore > (exConfig.lastPerformanceScore || 0);
            if (improvedPartial && completedSets.length > 0) {
                exConfig.consecutiveNoProgress = 0;
                exConfig.lastPerformanceScore = performanceScore;
                progressionSummary.push({
                    exercise: exConfig.name,
                    status: "stable",
                    message: `Rendimiento parcial mejorado. Mantén ${prevWeight} kg x ${prevRepsTarget} reps hasta completar todas las series.`
                });
            } else {
                exConfig.consecutiveNoProgress += 1;
                if (exConfig.consecutiveNoProgress >= 2) {
                    const reduced = roundToStep(prevWeight * 0.95, exConfig.increment);
                    exConfig.currentWeight = Math.max(0, reduced);
                    exConfig.currentRepsTarget = exConfig.rMin;
                    exConfig.consecutiveNoProgress = 0;
                    exConfig.lastPerformanceScore = 0;
                    progressionSummary.push({
                        exercise: exConfig.name,
                        status: "deload_trigger",
                        message: `Estancamiento real detectado. Reset -5%: ${exConfig.currentWeight} kg x ${exConfig.currentRepsTarget} reps.`
                    });
                } else {
                    progressionSummary.push({
                        exercise: exConfig.name,
                        status: "stable",
                        message: `Objetivo mantenido: ${prevWeight} kg x ${prevRepsTarget} reps.`
                    });
                }
            }
        }

        return {
            id: exConfig.id,
            name: exConfig.name,
            muscleGroup: exConfig.muscleGroup,
            weightUsed: prevWeight,
            repsTarget: prevRepsTarget,
            sets: exResult.sets.map((s, idx) => {
                const repsCompleted = s.completed ? (s.repsEdited !== null ? s.repsEdited : prevRepsTarget) : 0;
                return {
                    setIndex: idx + 1,
                    completed: s.completed,
                    repsCompleted,
                    oneRM: s.completed ? calculate1RM(prevWeight, repsCompleted) : 0
                };
            })
        };
    });

    saveExercisesConfig(config);

    const history = safeParse("workout_history", []);
    const sessionRecord = {
        id: Date.now(),
        date,
        dayId: selectedDay.id,
        dayTitle: selectedDay.title,
        mesocycleWeek: meso.week,
        mesocyclePhase: meso.phaseLabel,
        exercises: processedExercises
    };
    history.push(sessionRecord);
    localStorage.setItem("workout_history", JSON.stringify(history));

    return {
        summary: progressionSummary,
        session: sessionRecord
    };
}

function getExerciseHistory(exerciseIdOrName) {
    const history = safeParse("workout_history", []);
    const dataPoints = [];

    history.forEach(session => {
        const ex = (session.exercises || []).find(e => e.id === exerciseIdOrName || e.name === exerciseIdOrName);
        if (ex) {
            const max1RM = Math.max(...(ex.sets || []).map(s => s.oneRM), 0);
            dataPoints.push({
                date: session.date,
                oneRM: parseFloat(max1RM.toFixed(2)),
                weight: ex.weightUsed
            });
        }
    });

    return dataPoints;
}

function setDietDayType(dayType, dateStr) {
    const normalized = dayType === "descanso" ? "descanso" : "entreno";
    localStorage.setItem("diet_day_type", normalized);
    const date = dateStr || toISODate();
    saveDailyPlan(date, {
        ...getDailyPlan(date),
        dayType: normalized
    });
}

function calculateBmr(profile) {
    const base = (10 * profile.weightKg) + (6.25 * profile.heightCm) - (5 * profile.age);
    return profile.sex === "female" ? base - 161 : base + 5;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function roundTo25(value) {
    return Math.round(value / 25) * 25;
}

function getCheatMealRecommendation(cheatMealCalories, flexBudget, profile) {
    const extraCalories = Math.max(0, cheatMealCalories - flexBudget);
    const kcalPerStep = Math.max(0.035, profile.weightKg * 0.00055);
    const extraSteps = extraCalories > 0
        ? Math.min(12000, Math.ceil((extraCalories / kcalPerStep) / 500) * 500)
        : 0;
    const coveredBySteps = Math.round(extraSteps * kcalPerStep);
    const remaining = Math.max(0, extraCalories - coveredBySteps);
    const cardioMinutes = remaining > 0 ? Math.ceil((remaining / 8) / 5) * 5 : 0;

    let message = "Sin cheat meal registrado: mantén el plan normal.";
    if (cheatMealCalories > 0 && extraCalories === 0) {
        message = "Cheat meal dentro del margen flexible: mantén proteína y pasos objetivo.";
    }
    if (extraCalories > 0) {
        message = `Exceso estimado de ${extraCalories} kcal: añade ${extraSteps.toLocaleString("es-ES")} pasos${cardioMinutes ? ` y ${cardioMinutes} min de cardio suave` : ""}.`;
    }

    return {
        flexBudget,
        extraCalories,
        extraSteps,
        cardioMinutes,
        message
    };
}

function getDietPlan(dayType, dateStr) {
    const date = typeof dateStr === "string" ? dateStr : toISODate();
    const dailyPlan = getDailyPlan(date);
    const type = dayType || dailyPlan.dayType || localStorage.getItem("diet_day_type") || "entreno";
    const profile = getUserProfile();
    const isTrainingDay = type === "entreno";
    const activityLevel = ACTIVITY_LEVELS[dailyPlan.activityLevel] ? dailyPlan.activityLevel : "normal";
    const plannedSteps = dailyPlan.plannedSteps || getDefaultStepsTarget(type, activityLevel);
    const loggedSteps = getStepsForDate(date);
    const stepsForFuel = loggedSteps > 0 ? loggedSteps : plannedSteps;
    const bmr = calculateBmr(profile);
    const maintenance = isTrainingDay ? bmr * 1.55 : bmr * 1.42;
    const baseSurplus = isTrainingDay ? 225 : 100;
    const stepsTarget = plannedSteps;
    const activityOffset = (ACTIVITY_LEVELS[activityLevel] || ACTIVITY_LEVELS.normal).calorieOffset;
    const stepAdjustment = clamp(Math.round((stepsForFuel - getDefaultStepsTarget(type, "normal")) / 1000) * 40, -200, 250);
    const calories = roundTo25(maintenance + baseSurplus + activityOffset + stepAdjustment);
    const protein = Math.round((profile.targetWeightKg * 2.15) / 5) * 5;
    const fat = isTrainingDay ? 70 : 75;
    const carbs = Math.max(0, Math.round((calories - (protein * 4) - (fat * 9)) / 4));
    const flexBudget = isTrainingDay ? 500 : 400;
    const cheatMealCalories = dailyPlan.cheatMealCalories || 0;
    const cheat = getCheatMealRecommendation(cheatMealCalories, flexBudget, profile);
    const cleanCalories = Math.max(1200, calories - cheatMealCalories);
    const cleanCarbs = Math.max(0, Math.round((cleanCalories - (protein * 4) - (fat * 9)) / 4));
    const totalSuggestedSteps = Math.min(24000, stepsTarget + cheat.extraSteps);

    const trainingMeals = [
        { name: "Comida 1", text: "Carbohidrato base + 35-45 g de proteina. Mantén fibra moderada si entrenas pronto." },
        { name: "Pre-entreno", text: "60-100 g de carbohidratos y 25-35 g de proteina 1-2 h antes. Baja grasa para digerir mejor." },
        { name: "Post-entreno", text: "Arroz, patata, pasta o pan con proteina magra. Aquí concentra carbohidratos si los pasos son altos." },
        { name: "Cena", text: "Proteina completa, verduras y el carbohidrato restante. Si hubo cheat meal, baja grasas añadidas." }
    ];

    const restMeals = [
        { name: "Comida 1", text: "Proteina alta y carbohidrato moderado. Evita empezar el día con grasas sin medir." },
        { name: "Comida 2", text: "Carne magra, pescado o legumbre con verduras y una racion de arroz, patata o pan." },
        { name: "Merienda", text: "Lacteo alto en proteina o whey. Frutos secos solo si encajan en grasas." },
        { name: "Cena", text: "Proteina completa, verduras y carbohidrato ajustado a pasos. Si descansas, no elimines carbohidratos: dosificalos." }
    ];

    return {
        date,
        title: isTrainingDay ? "Día de entrenamiento: volumen limpio" : "Día de descanso: superávit controlado",
        dayType: type,
        calories,
        protein,
        carbs,
        fat,
        stepsTarget,
        plannedSteps,
        loggedSteps,
        todaySteps: loggedSteps,
        stepsForFuel,
        stepAdjustment,
        activityLevel,
        activityLabel: ACTIVITY_LEVELS[activityLevel].label,
        cheatMealCalories,
        cleanCalories,
        cleanCarbs,
        totalSuggestedSteps,
        cheat,
        weeklyGainTarget: "0.15-0.30 kg/semana",
        meals: isTrainingDay ? trainingMeals : restMeals
    };
}

function getDashboardSummary(dateStr) {
    const date = dateStr || toISODate();
    const dailyPlan = getDailyPlan(date);
    const diet = getDietPlan(dailyPlan.dayType, date);
    const nutrition = getDailyNutrition(date);
    const nutritionScore = getNutritionScore(date);
    const planner = getWeeklyPlanner(date);
    const meso = getCurrentMesocycleStatus(date);
    const workoutDay = getWorkoutDay(dailyPlan.workoutDayId);
    const weeklyVolume = getWeeklyVolume(date);
    const volumeTarget = weeklyVolume.groups.reduce((sum, group) => sum + group.target, 0);
    const volumeDone = weeklyVolume.groups.reduce((sum, group) => sum + Math.min(group.completed, group.target), 0);
    const volumeScore = volumeTarget > 0 ? volumeDone / volumeTarget : 0;
    const stepScore = Math.min(1, (diet.stepsForFuel || 0) / Math.max(1, diet.totalSuggestedSteps || diet.stepsTarget));
    const cheatPenalty = diet.cheat.extraCalories > 0 ? Math.min(0.2, diet.cheat.extraCalories / 3000) : 0;
    const readinessScore = Math.round(clamp((volumeScore * 45) + (stepScore * 35) + 20 - (cheatPenalty * 100), 0, 100));
    const actions = [];

    if (dailyPlan.dayType === "entreno") {
        actions.push({
            tone: "primary",
            title: `Entrenar ${workoutDay.title.replace("Dia ", "D")}`,
            text: workoutDay.subtitle
        });
    } else {
        actions.push({
            tone: "neutral",
            title: "Día de descanso",
            text: "Mantén pasos, proteína y movilidad. No fuerces series extra si el volumen semanal ya va cubierto."
        });
    }

    if (planner.completedWorkouts < planner.plannedTrainingDays) {
        actions.push({
            tone: "primary",
            title: `${planner.plannedTrainingDays - planner.completedWorkouts} entrenos pendientes esta semana`,
            text: `Si dudas, prioriza ${planner.suggestedDay.title.replace("Dia ", "D")} por volumen pendiente.`
        });
    }

    if (diet.cheatMealCalories > 0) {
        actions.push({
            tone: diet.cheat.extraCalories > 0 ? "warning" : "neutral",
            title: `Cheat meal: ${diet.cheatMealCalories} kcal`,
            text: diet.cheat.message
        });
    }

    if (!diet.loggedSteps) {
        actions.push({
            tone: "neutral",
            title: "Registra pasos al final del día",
            text: `El plan usa ${diet.plannedSteps.toLocaleString("es-ES")} pasos previstos hasta que guardes los reales.`
        });
    }

    if (!nutrition.calories) {
        actions.push({
            tone: "primary",
            title: "Apunta la dieta real",
            text: "Mete kcal, proteína, carbohidratos y peso para que la app puntúe adherencia."
        });
    } else {
        actions.push({
            tone: nutritionScore.score >= 70 ? "neutral" : "warning",
            title: `Dieta ${nutritionScore.label}: ${nutritionScore.score}/100`,
            text: nutritionScore.message
        });
    }

    if (meso.phaseKey === "deload") {
        actions.push({
            tone: "warning",
            title: "Semana de descarga",
            text: "La app reduce series y bloquea la progresión agresiva para disipar fatiga."
        });
    }

    return {
        date,
        dailyPlan,
        diet,
        nutrition,
        nutritionScore,
        planner,
        mesocycle: meso,
        workoutDay,
        weeklyVolume,
        readinessScore,
        actions
    };
}

function getDateRangeEnding(dateStr, days) {
    const end = parseISODate(dateStr || toISODate());
    return Array.from({ length: days }, (_, index) => {
        const date = addDays(end, index - (days - 1));
        return toISODate(date);
    });
}

function getDashboardChartData(dateStr) {
    const dates = getDateRangeEnding(dateStr || toISODate(), 14);
    const workoutHistory = safeParse("workout_history", []);
    const bestOneRmByDate = {};

    workoutHistory.forEach(session => {
        let best = 0;
        (session.exercises || []).forEach(ex => {
            (ex.sets || []).forEach(set => {
                best = Math.max(best, set.oneRM || 0);
            });
        });
        if (best > 0) {
            bestOneRmByDate[session.date] = Math.max(bestOneRmByDate[session.date] || 0, best);
        }
    });

    return {
        labels: dates.map(date => {
            const parts = date.split("-");
            return `${parts[2]}/${parts[1]}`;
        }),
        caloriesTarget: dates.map(date => getDietPlan(null, date).calories),
        caloriesActual: dates.map(date => getDailyNutrition(date).calories || null),
        carbsTarget: dates.map(date => getDietPlan(null, date).carbs),
        carbsActual: dates.map(date => getDailyNutrition(date).carbs || null),
        bodyWeight: dates.map(date => getDailyNutrition(date).weightKg || null),
        bestOneRm: dates.map(date => bestOneRmByDate[date] ? parseFloat(bestOneRmByDate[date].toFixed(1)) : null)
    };
}

function resetDatabase() {
    localStorage.removeItem("workout_config");
    localStorage.removeItem("workout_history");
    localStorage.removeItem("steps_history");
    localStorage.removeItem("nutrition_history");
    localStorage.removeItem("day_plans");
    localStorage.removeItem("diet_day_type");
    localStorage.removeItem("active_workout_day");
    localStorage.removeItem("user_profile");
    localStorage.removeItem("mesocycle_settings");
    localStorage.removeItem("is_configured");
    localStorage.removeItem("app_fitness_initialized");
    initDatabase();
}

window.Db = {
    getExercisesConfig,
    saveExercisesConfig,
    getExerciseState,
    getWorkoutDayOptions,
    getWorkoutDay,
    getWorkoutExercises,
    getActiveWorkoutDay,
    setActiveWorkoutDay,
    getSuggestedWorkoutDay,
    isConfigured,
    initializeWeights,
    logWorkout,
    getExerciseHistory,
    calculate1RM,
    getDietPlan,
    setDietDayType,
    getActivityLevelOptions,
    getDailyPlan,
    saveDailyPlan,
    getDashboardSummary,
    getDashboardChartData,
    getDailyNutrition,
    saveDailyNutrition,
    getNutritionScore,
    logDailySteps,
    getStepsForDate,
    getWeeklyVolume,
    getWeeklyPlanner,
    getMesocycleSettings,
    saveMesocycleSettings,
    startNewMesocycle,
    getCurrentMesocycleStatus,
    getUserProfile,
    saveUserProfile,
    resetDatabase
};
