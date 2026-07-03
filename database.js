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
        muscleGroup: "pecho",
        notes: "Asiento abajo; foco clavicular.",
        currentWeight: null,
        currentRepsTarget: 6,
        consecutiveNoProgress: 0 // Track para la regla de las 2 sesiones de estancamiento
    },
    {
        name: "Pulldown Unilateral",
        sets: 2,
        rMin: 8,
        rMax: 12,
        rest: 150, // 2.5 min
        increment: 2, // kg
        category: "Compuestos de Alta Repetición",
        muscleGroup: "espalda",
        notes: "Estabilidad total; guía con el codo.",
        currentWeight: null,
        currentRepsTarget: 8,
        consecutiveNoProgress: 0
    },
    {
        name: "Seated Dip (Fondos)",
        sets: 2,
        rMin: 6,
        rMax: 10,
        rest: 150, // 2.5 min
        increment: 2, // kg
        category: "Compuestos Pesados",
        muscleGroup: "pecho",
        notes: "Torso inclinado; énfasis pectoral inferior.",
        currentWeight: null,
        currentRepsTarget: 6,
        consecutiveNoProgress: 0
    },
    {
        name: "Row de Pie (Dorsal)",
        sets: 2,
        rMin: 8,
        rMax: 12,
        rest: 150, // 2.5 min
        increment: 2, // kg
        category: "Compuestos de Alta Repetición",
        muscleGroup: "espalda",
        notes: "Unilateral; evitar protracción escapular.",
        currentWeight: null,
        currentRepsTarget: 8,
        consecutiveNoProgress: 0
    },
    {
        name: "Remo en T (Upper Back)",
        sets: 2,
        rMin: 6,
        rMax: 10,
        rest: 180, // 3 min
        increment: 2, // kg
        category: "Compuestos Pesados",
        muscleGroup: "espalda",
        notes: "Agarre ancho; juntar escápulas.",
        currentWeight: null,
        currentRepsTarget: 6,
        consecutiveNoProgress: 0
    },
    {
        name: "Pec Deck (Contractora)",
        sets: 1,
        rMin: 10,
        rMax: 15,
        rest: 120, // 2 min
        increment: 1, // kg
        category: "Aislados / Metabólicos",
        muscleGroup: "pecho",
        notes: "Pausa isométrica en acortamiento.",
        currentWeight: null,
        currentRepsTarget: 10,
        consecutiveNoProgress: 0
    }
];

// Estructuras de dieta para usuario (72kg, 178cm, ganar fuerza/hipertrofia)
const DIET_PLAN = {
    entreno: {
        title: "Día de Entrenamiento (Alta Energía)",
        calories: 2750,
        protein: 160,
        carbs: 360,
        fat: 70,
        stepsTarget: 10000,
        meals: [
            { name: "Desayuno (Carga Inicial)", text: "100g de avena cocida, 30g de proteína de suero (whey), 1 plátano mediano, 200ml de leche desnatada o agua." },
            { name: "Comida (Anabolismo)", text: "150g de pechuga de pollo o pavo a la plancha, 120g de arroz integral en seco (aprox. 300g cocido), verduras al vapor (brócoli/espárragos), 1 cucharada sopera de aceite de oliva." },
            { name: "Pre-Entreno (1.5h antes)", text: "1 manzana grande + 5 tortitas de arroz inflado con 15g de miel." },
            { name: "Post-Entreno (Ventana Sintética)", text: "30g de proteína de suero aislada + 40g de amilopectina o ciclodextrina disueltos en agua." },
            { name: "Cena (Recuperación Nocturna)", text: "180g de ternera magra o salmón a la plancha, 350g de patata cocida o boniato al horno, ensalada verde grande con aderezo ligero de limón." }
        ]
    },
    descanso: {
        title: "Día de Descanso (Recuperación y Sensibilidad)",
        calories: 2200,
        protein: 160,
        carbs: 210,
        fat: 80,
        stepsTarget: 12000,
        meals: [
            { name: "Desayuno (Grasas y Proteínas)", text: "3 huevos enteros medianos revueltos, 2 rebanadas de pan de centeno integral tostado, 100g de arándanos frescos." },
            { name: "Comida (Nutrientes Limpios)", text: "160g de lomo de cerdo magro o pechuga de pollo, ensalada mixta grande con 60g de aguacate fresco, 1.5 cucharadas de aceite de oliva." },
            { name: "Merienda (Anticatabólica)", text: "250g de queso fresco batido 0%, 25g de nueces o almendras crudas." },
            { name: "Cena (Reparación Celular)", text: "200g de filete de merluza, bacalao o lubina al horno, verduras asadas variadas (calabacín, champiñones, pimiento) con 1 cucharada de aceite de oliva." }
        ]
    }
};

// Inicializar base de datos local
function initDatabase() {
    if (!localStorage.getItem('app_fitness_initialized')) {
        localStorage.setItem('workout_config', JSON.stringify(ROUTINE_TEMPLATE));
        localStorage.setItem('workout_history', JSON.stringify([]));
        localStorage.setItem('steps_history', JSON.stringify({})); // { 'YYYY-MM-DD': steps }
        localStorage.setItem('diet_day_type', 'entreno'); // Tipo de día por defecto
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
            ex.currentRepsTarget = ex.rMin;
            ex.consecutiveNoProgress = 0;
        }
    });
    saveExercisesConfig(config);
    localStorage.setItem('is_configured', 'true');
}

// Calcular 1RM Proyectado
function calculate1RM(weight, reps) {
    if (!weight || !reps) return 0;
    return weight * (1 + (reps / 30));
}

// Obtener dieta del día
function getDietPlan(dayType) {
    return DIET_PLAN[dayType || localStorage.getItem('diet_day_type') || 'entreno'];
}

// Cambiar tipo de día
function setDietDayType(dayType) {
    localStorage.setItem('diet_day_type', dayType);
}

// Registrar pasos diarios
function logDailySteps(steps) {
    const stepsHistory = JSON.parse(localStorage.getItem('steps_history') || '{}');
    const date = new Date().toISOString().split('T')[0];
    stepsHistory[date] = parseInt(steps) || 0;
    localStorage.setItem('steps_history', JSON.stringify(stepsHistory));
}

// Obtener pasos de una fecha
function getStepsForDate(dateStr) {
    const stepsHistory = JSON.parse(localStorage.getItem('steps_history') || '{}');
    const date = dateStr || new Date().toISOString().split('T')[0];
    return stepsHistory[date] || 0;
}

// Obtener la fecha del lunes de la semana actual
function getMondayOfCurrentWeek() {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuste si es domingo
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

// Calcular Volumen de Series Efectivas Semanales completadas en la semana en curso (Lunes a Domingo)
function getWeeklyVolume() {
    const history = JSON.parse(localStorage.getItem('workout_history') || '[]');
    const monday = getMondayOfCurrentWeek();
    
    let pechoSeries = 0;
    let espaldaSeries = 0;

    history.forEach(session => {
        const sessionDate = new Date(session.date + 'T00:00:00');
        if (sessionDate >= monday) {
            session.exercises.forEach(ex => {
                // Buscamos a qué grupo pertenece el ejercicio en nuestra plantilla
                const exTemplate = ROUTINE_TEMPLATE.find(t => t.name === ex.name);
                if (!exTemplate) return;

                ex.sets.forEach(set => {
                    if (set.completed) {
                        // Serie efectiva ponderada por intensidad:
                        // Si completó las reps objetivo con el peso objetivo = 1.0 serie
                        // Si hizo menos reps de las marcadas, penaliza proporcionalmente (ej. 8 reps logradas de 10 reps target = 0.8 series)
                        let setWeight = 1.0;
                        if (set.repsCompleted < ex.repsTarget) {
                            setWeight = Math.max(0.5, set.repsCompleted / ex.repsTarget);
                        }

                        if (exTemplate.muscleGroup === 'pecho') {
                            pechoSeries += setWeight;
                        } else if (exTemplate.muscleGroup === 'espalda') {
                            espaldaSeries += setWeight;
                        }
                    }
                });
            });
        }
    });

    return {
        pecho: parseFloat(pechoSeries.toFixed(1)),
        pechoTarget: 10, // Series semanales óptimas
        espalda: parseFloat(espaldaSeries.toFixed(1)),
        espaldaTarget: 12
    };
}

// Guardar entrenamiento con Doble Progresión y Regla de Estancamiento
function logWorkout(sessionExercises) {
    const config = getExercisesConfig();
    const progressionSummary = [];
    const date = new Date().toISOString().split('T')[0];

    const processedExercises = sessionExercises.map(exResult => {
        const exConfig = config.find(e => e.name === exResult.name);
        if (!exConfig) return exResult;

        // Comprobamos si todas las series se completaron al 100% de la carga objetivo y reps objetivo
        const allCompleted = exResult.sets.length === exConfig.sets && 
                             exResult.sets.every(s => s.completed && (s.repsEdited === null || s.repsEdited >= exConfig.currentRepsTarget));

        const prevWeight = exConfig.currentWeight;
        const prevRepsTarget = exConfig.currentRepsTarget;

        if (allCompleted) {
            // Reiniciar contador de estancamiento al progresar con éxito
            exConfig.consecutiveNoProgress = 0;

            // Algoritmo de Doble Progresión
            if (exConfig.currentRepsTarget < exConfig.rMax) {
                // Sube 1 repetición
                exConfig.currentRepsTarget += 1;
                progressionSummary.push({
                    exercise: exConfig.name,
                    status: 'rep_up',
                    message: `📈 ¡CONSOLIDADO! Siguiente sesión sube repetición: **${exConfig.currentWeight} kg x ${exConfig.currentRepsTarget} reps**.`
                });
            } else {
                // Alcanzó R_max: Trigger de Sobrecarga
                exConfig.currentWeight += exConfig.increment;
                exConfig.currentRepsTarget = exConfig.rMin;
                progressionSummary.push({
                    exercise: exConfig.name,
                    status: 'weight_up',
                    message: `🔥 ¡SOBRECARGA COMPLETA! Siguiente sesión sube carga: **${exConfig.currentWeight} kg x ${exConfig.currentRepsTarget} reps** (fase consolidación).`
                });
            }
        } else {
            // No progresó de manera óptima (dejó series sin marcar o hizo menos reps)
            exConfig.consecutiveNoProgress += 1;

            // Regla de Estancamiento de las 2 Sesiones consecutivas sin progresar
            if (exConfig.consecutiveNoProgress >= 2) {
                const oldWeight = exConfig.currentWeight;
                // Descarga del 5% del peso y reinicio de reps al mínimo
                exConfig.currentWeight = Math.max(0, parseFloat((oldWeight * 0.95).toFixed(1)));
                exConfig.currentRepsTarget = exConfig.rMin;
                exConfig.consecutiveNoProgress = 0; // Resetear contador

                progressionSummary.push({
                    exercise: exConfig.name,
                    status: 'deload_trigger',
                    message: `⚠️ ¡ESTANCAMIENTO DETECTADO (2 sesiones)! Estrategia: Descarga ligera del -5% en peso para recuperar inercia. Siguiente objetivo: **${exConfig.currentWeight} kg x ${exConfig.currentRepsTarget} reps**.`
                });
            } else {
                progressionSummary.push({
                    exercise: exConfig.name,
                    status: 'stable',
                    message: `⚖️ Objetivo mantenido: **${exConfig.currentWeight} kg x ${exConfig.currentRepsTarget} reps**. Busca consolidarlo en la próxima sesión.`
                });
            }
        }

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

    saveExercisesConfig(config);

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

// Obtener datos históricos de un ejercicio
function getExerciseHistory(exerciseName) {
    const history = JSON.parse(localStorage.getItem('workout_history') || '[]');
    const dataPoints = [];

    history.forEach(session => {
        const ex = session.exercises.find(e => e.name === exerciseName);
        if (ex) {
            const max1RM = Math.max(...ex.sets.map(s => s.oneRM), 0);
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

// Reiniciar base de datos
function resetDatabase() {
    localStorage.removeItem('workout_config');
    localStorage.removeItem('workout_history');
    localStorage.removeItem('steps_history');
    localStorage.removeItem('diet_day_type');
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
    getDietPlan,
    setDietDayType,
    logDailySteps,
    getStepsForDate,
    getWeeklyVolume,
    resetDatabase
};
