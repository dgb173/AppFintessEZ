// Mapeo inicial de los ejercicios de Torso basados en la Guía Maestra
const ROUTINE_TEMPLATE = [
    {
        name: "Incline Chest Press",
        sets: 2,
        rMin: 6,
        rMax: 10,
        rest: 180, // 3 min
        increment: 2, // kg
        category: "Compuestos Pesados",
        notes: "Asiento abajo; foco clavicular.",
        currentWeight: null,
        currentRepsTarget: 6
    },
    {
        name: "Pulldown Unilateral",
        sets: 2,
        rMin: 8,
        rMax: 12,
        rest: 150, // 2.5 min
        increment: 2, // kg
        category: "Compuestos de Alta Repetición",
        notes: "Estabilidad total; guía con el codo.",
        currentWeight: null,
        currentRepsTarget: 8
    },
    {
        name: "Seated Dip (Fondos)",
        sets: 2,
        rMin: 6,
        rMax: 10,
        rest: 150, // 2.5 min
        increment: 2, // kg
        category: "Compuestos Pesados",
        notes: "Torso inclinado; énfasis pectoral inferior.",
        currentWeight: null,
        currentRepsTarget: 6
    },
    {
        name: "Row de Pie (Dorsal)",
        sets: 2,
        rMin: 8,
        rMax: 12,
        rest: 150, // 2.5 min
        increment: 2, // kg
        category: "Compuestos de Alta Repetición",
        notes: "Unilateral; evitar protracción escapular.",
        currentWeight: null,
        currentRepsTarget: 8
    },
    {
        name: "Remo en T (Upper Back)",
        sets: 2,
        rMin: 6,
        rMax: 10,
        rest: 180, // 3 min
        increment: 2, // kg
        category: "Compuestos Pesados",
        notes: "Agarre ancho; juntar escápulas.",
        currentWeight: null,
        currentRepsTarget: 6
    },
    {
        name: "Pec Deck (Contractora)",
        sets: 1,
        rMin: 10,
        rMax: 15,
        rest: 120, // 2 min
        increment: 1, // kg
        category: "Aislados / Metabólicos",
        notes: "Pausa isométrica en acortamiento.",
        currentWeight: null,
        currentRepsTarget: 10
    }
];

// Inicializar base de datos local
function initDatabase() {
    if (!localStorage.getItem('app_fitness_initialized')) {
        localStorage.setItem('workout_config', JSON.stringify(ROUTINE_TEMPLATE));
        localStorage.setItem('workout_history', JSON.stringify([]));
        localStorage.setItem('is_configured', 'false');
        localStorage.setItem('app_fitness_initialized', 'true');
    }
}

// Obtener configuración de ejercicios
function getExercisesConfig() {
    initDatabase();
    return JSON.parse(localStorage.getItem('workout_config') || '[]');
}

// Guardar configuración de ejercicios
function saveExercisesConfig(config) {
    localStorage.setItem('workout_config', JSON.stringify(config));
}

// Comprobar si la app ya fue configurada con pesos iniciales
function isConfigured() {
    initDatabase();
    return localStorage.getItem('is_configured') === 'true';
}

// Establecer los pesos iniciales
function initializeWeights(weightsMap) {
    const config = getExercisesConfig();
    config.forEach(ex => {
        const weightInput = weightsMap[ex.name];
        if (weightInput !== undefined && weightInput !== null) {
            ex.currentWeight = parseFloat(weightInput) || 0;
            // Al inicializar, la progresión arranca en el mínimo de repeticiones (fase consolidación)
            ex.currentRepsTarget = ex.rMin;
        }
    });
    saveExercisesConfig(config);
    localStorage.setItem('is_configured', 'true');
}

// Calcular 1RM Proyectado (fórmula matemática de la guía)
function calculate1RM(weight, reps) {
    if (!weight || !reps) return 0;
    return weight * (1 + (reps / 30));
}

// Guardar una sesión de entrenamiento y aplicar Doble Progresión
function logWorkout(sessionExercises) {
    // sessionExercises: [{ name: string, sets: [{ completed: boolean, repsEdited: number|null }] }]
    const config = getExercisesConfig();
    const progressionSummary = [];
    const date = new Date().toISOString().split('T')[0];

    const processedExercises = sessionExercises.map(exResult => {
        const exConfig = config.find(e => e.name === exResult.name);
        if (!exConfig) return exResult;

        // Comprobamos si todas las series del ejercicio se completaron con éxito
        // (y si no se editaron repeticiones a la baja)
        const allCompleted = exResult.sets.length === exConfig.sets && 
                             exResult.sets.every(s => s.completed && (s.repsEdited === null || s.repsEdited >= exConfig.currentRepsTarget));

        const prevWeight = exConfig.currentWeight;
        const prevRepsTarget = exConfig.currentRepsTarget;

        if (allCompleted) {
            // Algoritmo de Doble Progresión
            if (exConfig.currentRepsTarget < exConfig.rMax) {
                // Sube 1 repetición
                exConfig.currentRepsTarget += 1;
                progressionSummary.push({
                    exercise: exConfig.name,
                    status: 'rep_up',
                    message: `📈 ¡CONSOLIDADO! Siguiente objetivo: ${exConfig.currentRepsTarget} reps con ${exConfig.currentWeight} kg.`
                });
            } else {
                // Alcanzó R_max: Incremento de peso y vuelta a R_min
                exConfig.currentWeight += exConfig.increment;
                exConfig.currentRepsTarget = exConfig.rMin;
                progressionSummary.push({
                    exercise: exConfig.name,
                    status: 'weight_up',
                    message: `🔥 ¡SOBRECARGA COMPLETA! Siguiente objetivo: peso sube a ${exConfig.currentWeight} kg, reps reinician a ${exConfig.currentRepsTarget} reps.`
                });
            }
        } else {
            // No completado, se mantiene el objetivo
            progressionSummary.push({
                exercise: exConfig.name,
                status: 'stable',
                message: `⚖️ Objetivo mantenido: ${exConfig.currentRepsTarget} reps con ${exConfig.currentWeight} kg.`
            });
        }

        // Devolvemos el ejercicio procesado con los datos guardados de esta sesión
        return {
            name: exConfig.name,
            weightUsed: prevWeight,
            repsTarget: prevRepsTarget,
            sets: exResult.sets.map((s, idx) => ({
                setIndex: idx + 1,
                completed: s.completed,
                repsCompleted: s.completed ? (s.repsEdited !== null ? s.repsEdited : prevRepsTarget) : 0,
                oneRM: s.completed ? calculate1RM(prevWeight, s.repsEdited !== null ? s.repsEdited : prevRepsTarget) : 0
            }))
        };
    });

    // Guardar la configuración actualizada
    saveExercisesConfig(config);

    // Registrar en el historial
    const history = JSON.parse(localStorage.getItem('workout_history') || '[]');
    const sessionRecord = {
        date: date,
        exercises: processedExercises
    };
    history.push(sessionRecord);
    localStorage.setItem('workout_history', JSON.stringify(history));

    return {
        summary: progressionSummary,
        session: sessionRecord
    };
}

// Obtener datos históricos de un ejercicio para graficar
function getExerciseHistory(exerciseName) {
    const history = JSON.parse(localStorage.getItem('workout_history') || '[]');
    const dataPoints = [];

    history.forEach(session => {
        const ex = session.exercises.find(e => e.name === exerciseName);
        if (ex) {
            // Sacamos el máximo 1RM estimado en esta sesión
            const max1RM = Math.max(...ex.sets.map(s => s.oneRM), 0);
            // Peso máximo usado
            const maxWeight = ex.weightUsed;
            dataPoints.push({
                date: session.date,
                oneRM: parseFloat(max1RM.toFixed(2)),
                weight: maxWeight
            });
        }
    });

    return dataPoints;
}

// Resetear base de datos para empezar de nuevo
function resetDatabase() {
    localStorage.removeItem('workout_config');
    localStorage.removeItem('workout_history');
    localStorage.removeItem('is_configured');
    localStorage.removeItem('app_fitness_initialized');
    initDatabase();
}

// Exponer las funciones globalmente
window.Db = {
    getExercisesConfig,
    isConfigured,
    initializeWeights,
    logWorkout,
    getExerciseHistory,
    calculate1RM,
    resetDatabase
};
