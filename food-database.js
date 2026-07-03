(function () {
    const sourceNote = "Valores medios por 100 g. Genericos basados en medias USDA/FoodData Central; productos comerciales aproximados desde etiquetas/Open Food Facts cuando hay datos publicos.";

    const rows = [
        // Dieta habitual y proteinas principales
        ["habitual", "Pechuga de pollo cruda", "Generico", 110, 23.1, 0, 1.2, 0, 150, ["pollo", "carne", "proteina"]],
        ["habitual", "Pechuga de pollo cocinada", "Generico", 165, 31, 0, 3.6, 0, 150, ["pollo", "carne", "proteina"]],
        ["habitual", "Contramuslo de pollo sin piel crudo", "Generico", 144, 19.7, 0, 6.9, 0, 150, ["pollo", "carne", "proteina"]],
        ["habitual", "Contramuslo de pollo sin piel cocinado", "Generico", 209, 26, 0, 10.9, 0, 150, ["pollo", "carne", "proteina"]],
        ["habitual", "Pechuga de pavo cruda", "Generico", 104, 23, 0, 1, 0, 150, ["pavo", "carne", "proteina"]],
        ["habitual", "Pechuga de pavo cocinada", "Generico", 135, 29, 0, 1.6, 0, 150, ["pavo", "carne", "proteina"]],
        ["habitual", "Contramuslo de pavo crudo", "Generico", 135, 20.5, 0, 5.5, 0, 150, ["pavo", "carne", "proteina"]],
        ["habitual", "Contramuslo de pavo cocinado", "Generico", 190, 28, 0, 8, 0, 150, ["pavo", "carne", "proteina"]],
        ["habitual", "Soja texturizada seca", "Generico", 335, 50, 31, 1.2, 17, 60, ["soja", "proteina", "vegano"]],
        ["habitual", "Soja texturizada hidratada", "Generico", 110, 16, 10, 0.5, 5, 180, ["soja", "proteina", "vegano"]],
        ["habitual", "Crema de cacahuete 100%", "Generico", 610, 26, 12, 50, 8, 20, ["cacahuete", "grasas"]],
        ["habitual", "Cacahuete desgrasado en polvo", "Generico", 380, 45, 25, 10, 12, 20, ["cacahuete", "proteina"]],
        ["habitual", "Crema de arroz en polvo", "Generico", 366, 7, 82, 1, 2, 80, ["arroz", "carbohidrato"]],
        ["habitual", "Arroz blanco cocido", "Generico", 130, 2.7, 28, 0.3, 0.4, 250, ["arroz", "carbohidrato"]],
        ["habitual", "Arroz basmati cocido", "Generico", 121, 3, 25.2, 0.4, 0.4, 250, ["arroz", "carbohidrato"]],
        ["habitual", "Patata cocida", "Generico", 87, 1.9, 20, 0.1, 1.8, 300, ["patata", "carbohidrato"]],
        ["habitual", "Boniato asado", "Generico", 90, 2, 21, 0.2, 3.3, 250, ["boniato", "carbohidrato"]],
        ["habitual", "Avena", "Generico", 389, 16.9, 66, 6.9, 10.6, 80, ["avena", "carbohidrato"]],
        ["habitual", "Claras de huevo", "Generico", 52, 10.9, 0.7, 0.2, 0, 200, ["huevo", "proteina"]],
        ["habitual", "Huevo entero", "Generico", 143, 12.6, 0.7, 9.5, 0, 100, ["huevo", "proteina"]],

        // Tortitas de arroz y maiz por supermercado/marca
        ["tortitas", "Tortitas de arroz", "Hacendado Mercadona", 385, 7.8, 81, 3, 3.5, 30, ["mercadona", "arroz"]],
        ["tortitas", "Tortitas de arroz con chocolate", "Hacendado Mercadona", 475, 6.5, 70, 18, 3, 30, ["mercadona", "arroz", "chocolate"]],
        ["tortitas", "Tortitas de arroz integral", "Hacendado Mercadona", 382, 8, 80, 3.2, 4.2, 30, ["mercadona", "arroz"]],
        ["tortitas", "Tortitas de maiz", "Hacendado Mercadona", 390, 8.5, 79, 4.2, 4.5, 30, ["mercadona", "maiz"]],
        ["tortitas", "Tortitas de arroz", "Carrefour", 382, 7.6, 81, 2.8, 3.5, 30, ["carrefour", "arroz"]],
        ["tortitas", "Tortitas de arroz con chocolate negro", "Carrefour", 472, 6.8, 69, 18, 3.8, 30, ["carrefour", "arroz", "chocolate"]],
        ["tortitas", "Tortitas de maiz", "Carrefour", 392, 8.1, 79, 4, 4.3, 30, ["carrefour", "maiz"]],
        ["tortitas", "Tortitas de arroz sin sal", "Carrefour Bio", 380, 7.5, 81, 2.7, 3.8, 30, ["carrefour", "bio", "arroz"]],
        ["tortitas", "Tortitas de arroz", "Lidl Crownfield", 386, 7.9, 82, 2.8, 3.2, 30, ["lidl", "arroz"]],
        ["tortitas", "Tortitas de maiz", "Lidl Snack Day", 395, 8, 79, 4.6, 4.2, 30, ["lidl", "maiz"]],
        ["tortitas", "Tortitas de arroz con chocolate", "Lidl Crownfield", 478, 6.7, 68, 19, 3.1, 30, ["lidl", "arroz", "chocolate"]],
        ["tortitas", "Tortitas de arroz integral", "Lidl Bio Organic", 381, 8.2, 80, 3, 4.4, 30, ["lidl", "bio", "arroz"]],
        ["tortitas", "Tortitas de arroz", "Caprabo", 383, 7.7, 81, 2.9, 3.5, 30, ["caprabo", "arroz"]],
        ["tortitas", "Tortitas de maiz", "Caprabo", 392, 8.4, 79, 4.3, 4.2, 30, ["caprabo", "maiz"]],
        ["tortitas", "Tortitas de arroz chocolate", "Caprabo", 475, 6.5, 69, 18.5, 3.2, 30, ["caprabo", "arroz", "chocolate"]],
        ["tortitas", "Tortitas arroz integral", "Eroski Caprabo", 381, 8, 80, 3, 4, 30, ["caprabo", "eroski", "arroz"]],

        // Barritas de proteina habituales
        ["barritas", "Protein Bar Chocolate", "Hacendado Mercadona", 372, 32, 36, 12, 8, 50, ["barrita", "mercadona"]],
        ["barritas", "Protein Bar Cookies", "Hacendado Mercadona", 378, 31, 37, 12, 8, 50, ["barrita", "mercadona"]],
        ["barritas", "Protein Bar Yogur", "Hacendado Mercadona", 365, 32, 35, 11, 8, 50, ["barrita", "mercadona"]],
        ["barritas", "Barebells Cookies & Cream", "Barebells", 362, 36, 34, 14, 7, 55, ["barrita", "barebells"]],
        ["barritas", "Barebells Caramel Cashew", "Barebells", 368, 36, 33, 15, 7, 55, ["barrita", "barebells"]],
        ["barritas", "Barebells Salty Peanut", "Barebells", 375, 36, 32, 16, 7, 55, ["barrita", "barebells"]],
        ["barritas", "Grenade Carb Killa Chocolate Chip", "Grenade", 386, 36, 28, 16, 8, 60, ["barrita", "grenade"]],
        ["barritas", "Grenade Carb Killa White Chocolate", "Grenade", 383, 36, 29, 15, 8, 60, ["barrita", "grenade"]],
        ["barritas", "Quest Bar Chocolate Brownie", "Quest", 350, 35, 40, 8, 25, 60, ["barrita", "quest"]],
        ["barritas", "Quest Bar Cookies & Cream", "Quest", 352, 35, 39, 9, 24, 60, ["barrita", "quest"]],
        ["barritas", "MyProtein Layered Bar", "MyProtein", 390, 30, 35, 15, 6, 60, ["barrita", "myprotein"]],
        ["barritas", "MyProtein Impact Bar", "MyProtein", 360, 38, 29, 12, 7, 60, ["barrita", "myprotein"]],
        ["barritas", "Prozis Zero Snack Bar", "Prozis", 370, 31, 32, 14, 10, 50, ["barrita", "prozis"]],
        ["barritas", "Prozis Protein Bar", "Prozis", 390, 32, 35, 15, 8, 50, ["barrita", "prozis"]],
        ["barritas", "Foodspring Protein Bar", "Foodspring", 380, 33, 34, 14, 8, 60, ["barrita", "foodspring"]],
        ["barritas", "PowerBar Protein Plus", "PowerBar", 365, 32, 38, 10, 3, 55, ["barrita", "powerbar"]],
        ["barritas", "Enervit Protein Bar", "Enervit", 390, 33, 36, 14, 5, 50, ["barrita", "enervit"]],
        ["barritas", "Aptonia Protein Bar", "Decathlon Aptonia", 378, 32, 34, 13, 6, 60, ["barrita", "aptonia"]],
        ["barritas", "Amix Zero Hero", "Amix", 370, 35, 28, 14, 10, 65, ["barrita", "amix"]],
        ["barritas", "Lidl High Protein Bar", "Lidl", 375, 32, 35, 13, 7, 50, ["barrita", "lidl"]],
        ["barritas", "Carrefour Protein Bar Chocolate", "Carrefour", 380, 31, 36, 14, 7, 50, ["barrita", "carrefour"]],
        ["barritas", "Weider 60% Protein Bar", "Weider", 350, 50, 22, 8, 4, 45, ["barrita", "weider"]],

        // Verduras y hortalizas
        ["verduras", "Calabaza", "Generico", 26, 1, 6.5, 0.1, 0.5, 250, ["verdura"]],
        ["verduras", "Berenjena", "Generico", 25, 1, 5.9, 0.2, 3, 250, ["verdura"]],
        ["verduras", "Calabacin", "Generico", 17, 1.2, 3.1, 0.3, 1, 250, ["verdura"]],
        ["verduras", "Brocoli", "Generico", 34, 2.8, 6.6, 0.4, 2.6, 250, ["verdura"]],
        ["verduras", "Coliflor", "Generico", 25, 1.9, 5, 0.3, 2, 250, ["verdura"]],
        ["verduras", "Judias verdes", "Generico", 31, 1.8, 7, 0.1, 3.4, 250, ["verdura"]],
        ["verduras", "Espinacas", "Generico", 23, 2.9, 3.6, 0.4, 2.2, 200, ["verdura"]],
        ["verduras", "Acelgas", "Generico", 19, 1.8, 3.7, 0.2, 1.6, 250, ["verdura"]],
        ["verduras", "Lechuga romana", "Generico", 17, 1.2, 3.3, 0.3, 2.1, 100, ["verdura"]],
        ["verduras", "Rucula", "Generico", 25, 2.6, 3.7, 0.7, 1.6, 80, ["verdura"]],
        ["verduras", "Tomate", "Generico", 18, 0.9, 3.9, 0.2, 1.2, 200, ["verdura"]],
        ["verduras", "Tomate cherry", "Generico", 18, 0.9, 3.9, 0.2, 1.2, 150, ["verdura"]],
        ["verduras", "Pepino", "Generico", 15, 0.7, 3.6, 0.1, 0.5, 200, ["verdura"]],
        ["verduras", "Pimiento rojo", "Generico", 31, 1, 6, 0.3, 2.1, 200, ["verdura"]],
        ["verduras", "Pimiento verde", "Generico", 20, 0.9, 4.6, 0.2, 1.7, 200, ["verdura"]],
        ["verduras", "Pimiento amarillo", "Generico", 27, 1, 6.3, 0.2, 0.9, 200, ["verdura"]],
        ["verduras", "Cebolla", "Generico", 40, 1.1, 9.3, 0.1, 1.7, 120, ["verdura"]],
        ["verduras", "Cebolla morada", "Generico", 42, 1.1, 9.5, 0.1, 1.8, 120, ["verdura"]],
        ["verduras", "Ajo", "Generico", 149, 6.4, 33, 0.5, 2.1, 5, ["verdura"]],
        ["verduras", "Zanahoria", "Generico", 41, 0.9, 9.6, 0.2, 2.8, 200, ["verdura"]],
        ["verduras", "Champinon", "Generico", 22, 3.1, 3.3, 0.3, 1, 200, ["verdura"]],
        ["verduras", "Setas", "Generico", 33, 3.3, 6, 0.4, 2.3, 200, ["verdura"]],
        ["verduras", "Esparragos", "Generico", 20, 2.2, 3.9, 0.1, 2.1, 200, ["verdura"]],
        ["verduras", "Alcachofa", "Generico", 47, 3.3, 10.5, 0.2, 5.4, 200, ["verdura"]],
        ["verduras", "Remolacha", "Generico", 43, 1.6, 9.6, 0.2, 2.8, 200, ["verdura"]],
        ["verduras", "Col lombarda", "Generico", 31, 1.4, 7.4, 0.2, 2.1, 200, ["verdura"]],
        ["verduras", "Repollo", "Generico", 25, 1.3, 5.8, 0.1, 2.5, 200, ["verdura"]],
        ["verduras", "Kale", "Generico", 49, 4.3, 8.8, 0.9, 3.6, 150, ["verdura"]],
        ["verduras", "Puerro", "Generico", 61, 1.5, 14, 0.3, 1.8, 150, ["verdura"]],
        ["verduras", "Apio", "Generico", 16, 0.7, 3, 0.2, 1.6, 150, ["verdura"]],
        ["verduras", "Rabanos", "Generico", 16, 0.7, 3.4, 0.1, 1.6, 120, ["verdura"]],
        ["verduras", "Nabo", "Generico", 28, 0.9, 6.4, 0.1, 1.8, 200, ["verdura"]],
        ["verduras", "Guisantes cocidos", "Generico", 84, 5.4, 15.6, 0.2, 5.5, 150, ["verdura", "legumbre"]],
        ["verduras", "Maiz dulce", "Generico", 96, 3.4, 21, 1.5, 2.4, 120, ["verdura", "carbohidrato"]],
        ["verduras", "Ensalada mezclum", "Generico", 18, 1.5, 3, 0.2, 1.8, 100, ["verdura"]],
        ["verduras", "Menestra verduras", "Generico", 55, 2.7, 9, 0.7, 3.5, 250, ["verdura"]],
        ["verduras", "Verduras parrillada congelada", "Generico", 42, 1.7, 7, 0.4, 2.5, 250, ["verdura"]],
        ["verduras", "Coles de Bruselas", "Generico", 43, 3.4, 9, 0.3, 3.8, 200, ["verdura"]],
        ["verduras", "Endivia", "Generico", 17, 1.3, 3.4, 0.2, 3.1, 150, ["verdura"]],
        ["verduras", "Escarola", "Generico", 17, 1.3, 3.4, 0.2, 3.1, 150, ["verdura"]],

        // Carbohidratos, cereales y legumbres
        ["carbohidratos", "Pasta cocida", "Generico", 157, 5.8, 30.9, 0.9, 1.8, 250, ["pasta"]],
        ["carbohidratos", "Pasta integral cocida", "Generico", 149, 5.9, 30, 1.1, 3.9, 250, ["pasta"]],
        ["carbohidratos", "Cuscus cocido", "Generico", 112, 3.8, 23, 0.2, 1.4, 250, ["cuscus"]],
        ["carbohidratos", "Quinoa cocida", "Generico", 120, 4.4, 21.3, 1.9, 2.8, 220, ["quinoa"]],
        ["carbohidratos", "Pan blanco", "Generico", 265, 9, 49, 3.2, 2.7, 80, ["pan"]],
        ["carbohidratos", "Pan integral", "Generico", 247, 13, 41, 4.2, 7, 80, ["pan"]],
        ["carbohidratos", "Pan de centeno", "Generico", 259, 8.5, 48, 3.3, 5.8, 80, ["pan"]],
        ["carbohidratos", "Tortilla trigo", "Generico", 310, 8.2, 50, 8, 3, 60, ["wrap"]],
        ["carbohidratos", "Tortilla maiz", "Generico", 218, 5.7, 45, 2.9, 6.3, 60, ["wrap"]],
        ["carbohidratos", "Lentejas cocidas", "Generico", 116, 9, 20, 0.4, 7.9, 250, ["legumbre"]],
        ["carbohidratos", "Garbanzos cocidos", "Generico", 164, 8.9, 27, 2.6, 7.6, 250, ["legumbre"]],
        ["carbohidratos", "Alubias cocidas", "Generico", 127, 8.7, 22.8, 0.5, 6.4, 250, ["legumbre"]],
        ["carbohidratos", "Copos de maiz", "Generico", 357, 7.5, 84, 0.4, 3.3, 60, ["cereal"]],
        ["carbohidratos", "Muesli", "Generico", 370, 10, 63, 8, 8, 80, ["cereal"]],
        ["carbohidratos", "Harina de trigo", "Generico", 364, 10, 76, 1, 2.7, 100, ["harina"]],
        ["carbohidratos", "Harina de avena", "Generico", 389, 16, 66, 7, 10, 80, ["harina"]],
        ["carbohidratos", "Gnocchi patata", "Generico", 150, 4, 32, 0.5, 2, 250, ["patata"]],
        ["carbohidratos", "Arroz jazmin cocido", "Generico", 130, 2.4, 28.7, 0.2, 0.4, 250, ["arroz"]],
        ["carbohidratos", "Arroz integral cocido", "Generico", 111, 2.6, 23, 0.9, 1.8, 250, ["arroz"]],
        ["carbohidratos", "Fideos de arroz cocidos", "Generico", 109, 1.8, 24.9, 0.2, 0.9, 250, ["arroz"]],

        // Frutas
        ["frutas", "Platano", "Generico", 89, 1.1, 22.8, 0.3, 2.6, 120, ["fruta"]],
        ["frutas", "Manzana", "Generico", 52, 0.3, 13.8, 0.2, 2.4, 180, ["fruta"]],
        ["frutas", "Pera", "Generico", 57, 0.4, 15.2, 0.1, 3.1, 180, ["fruta"]],
        ["frutas", "Naranja", "Generico", 47, 0.9, 11.8, 0.1, 2.4, 200, ["fruta"]],
        ["frutas", "Mandarina", "Generico", 53, 0.8, 13.3, 0.3, 1.8, 150, ["fruta"]],
        ["frutas", "Kiwi", "Generico", 61, 1.1, 14.7, 0.5, 3, 150, ["fruta"]],
        ["frutas", "Fresas", "Generico", 32, 0.7, 7.7, 0.3, 2, 250, ["fruta"]],
        ["frutas", "Arandanos", "Generico", 57, 0.7, 14.5, 0.3, 2.4, 150, ["fruta"]],
        ["frutas", "Frambuesas", "Generico", 52, 1.2, 12, 0.7, 6.5, 150, ["fruta"]],
        ["frutas", "Moras", "Generico", 43, 1.4, 10, 0.5, 5.3, 150, ["fruta"]],
        ["frutas", "Uvas", "Generico", 69, 0.7, 18, 0.2, 0.9, 150, ["fruta"]],
        ["frutas", "Melon", "Generico", 34, 0.8, 8.2, 0.2, 0.9, 250, ["fruta"]],
        ["frutas", "Sandia", "Generico", 30, 0.6, 7.6, 0.2, 0.4, 300, ["fruta"]],
        ["frutas", "Mango", "Generico", 60, 0.8, 15, 0.4, 1.6, 200, ["fruta"]],
        ["frutas", "Pina", "Generico", 50, 0.5, 13.1, 0.1, 1.4, 200, ["fruta"]],
        ["frutas", "Melocoton", "Generico", 39, 0.9, 9.5, 0.3, 1.5, 180, ["fruta"]],
        ["frutas", "Nectarina", "Generico", 44, 1.1, 10.6, 0.3, 1.7, 180, ["fruta"]],
        ["frutas", "Ciruela", "Generico", 46, 0.7, 11.4, 0.3, 1.4, 150, ["fruta"]],
        ["frutas", "Caqui", "Generico", 70, 0.6, 18.6, 0.2, 3.6, 180, ["fruta"]],
        ["frutas", "Datiles", "Generico", 282, 2.5, 75, 0.4, 8, 30, ["fruta"]],

        // Lacteos, suplementos y extras no carnicos
        ["extras", "Yogur griego 0%", "Generico", 59, 10, 3.6, 0.4, 0, 250, ["lacteo"]],
        ["extras", "Queso fresco batido 0%", "Generico", 48, 8.5, 3.5, 0.2, 0, 250, ["lacteo"]],
        ["extras", "Skyr natural", "Generico", 63, 11, 4, 0.2, 0, 200, ["lacteo"]],
        ["extras", "Leche desnatada", "Generico", 34, 3.4, 5, 0.1, 0, 250, ["lacteo"]],
        ["extras", "Leche semidesnatada", "Generico", 46, 3.3, 4.8, 1.6, 0, 250, ["lacteo"]],
        ["extras", "Bebida de soja sin azucar", "Generico", 33, 3.3, 0.7, 1.8, 0.6, 250, ["soja"]],
        ["extras", "Whey protein", "Generico", 390, 78, 8, 6, 0, 30, ["suplemento"]],
        ["extras", "Caseina", "Generico", 370, 80, 7, 3, 0, 30, ["suplemento"]],
        ["extras", "Aceite de oliva", "Generico", 884, 0, 0, 100, 0, 10, ["grasas"]],
        ["extras", "Aguacate", "Generico", 160, 2, 8.5, 14.7, 6.7, 100, ["grasas"]],
        ["extras", "Almendras", "Generico", 579, 21, 22, 50, 12.5, 25, ["grasas"]],
        ["extras", "Nueces", "Generico", 654, 15, 14, 65, 6.7, 25, ["grasas"]],
        ["extras", "Miel", "Generico", 304, 0.3, 82, 0, 0.2, 15, ["azucar"]],
        ["extras", "Mermelada light", "Generico", 85, 0.3, 20, 0.1, 1, 20, ["dulce"]],
        ["extras", "Chocolate negro 85%", "Generico", 598, 11, 19, 51, 11, 20, ["chocolate"]]
    ];

    const palette = {
        habitual: "#10b981",
        tortitas: "#f59e0b",
        barritas: "#a855f7",
        verduras: "#22c55e",
        carbohidratos: "#06b6d4",
        frutas: "#f43f5e",
        extras: "#64748b"
    };

    function img(label, category) {
        const bg = palette[category] || "#06b6d4";
        const safe = String(label).replace(/[<&>]/g, "");
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240" viewBox="0 0 360 240"><rect width="360" height="240" rx="28" fill="#07111f"/><circle cx="292" cy="42" r="66" fill="${bg}" opacity=".22"/><circle cx="62" cy="192" r="76" fill="${bg}" opacity=".16"/><rect x="28" y="34" width="304" height="172" rx="22" fill="${bg}" opacity=".16" stroke="${bg}" stroke-opacity=".42"/><text x="44" y="100" fill="#f8fafc" font-family="Arial, sans-serif" font-size="25" font-weight="800">${safe.slice(0, 22)}</text><text x="44" y="134" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="16" font-weight="700">por 100 g</text><text x="44" y="168" fill="${bg}" font-family="Arial, sans-serif" font-size="15" font-weight="800">App Fitness EZ</text></svg>`;
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }

    const foods = rows.map((r, index) => ({
        id: `${r[0]}-${index + 1}`,
        category: r[0],
        name: r[1],
        brand: r[2],
        kcal: r[3],
        protein: r[4],
        carbs: r[5],
        fat: r[6],
        fiber: r[7],
        servingG: r[8],
        tags: r[9],
        unit: "100g",
        image: img(r[1], r[0]),
        source: sourceNote
    }));

    function normalize(text) {
        return String(text || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function search(query, category) {
        const q = normalize(query);
        return foods
            .filter(food => !category || category === "all" || food.category === category)
            .filter(food => {
                if (!q) return true;
                const haystack = normalize(`${food.name} ${food.brand} ${(food.tags || []).join(" ")}`);
                return q.split(/\s+/).every(part => haystack.includes(part));
            })
            .slice(0, 80);
    }

    function scale(food, grams) {
        const factor = (parseFloat(grams) || 0) / 100;
        return {
            kcal: food.kcal * factor,
            protein: food.protein * factor,
            carbs: food.carbs * factor,
            fat: food.fat * factor,
            fiber: food.fiber * factor
        };
    }

    function total(items) {
        return items.reduce((acc, item) => {
            const food = foods.find(f => f.id === item.foodId);
            if (!food) return acc;
            const s = scale(food, item.grams);
            acc.kcal += s.kcal;
            acc.protein += s.protein;
            acc.carbs += s.carbs;
            acc.fat += s.fat;
            acc.fiber += s.fiber;
            return acc;
        }, { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
    }

    window.FoodDB = {
        foods,
        categories: [
            ["all", "Todos"],
            ["habitual", "Mi dieta"],
            ["tortitas", "Tortitas"],
            ["barritas", "Barritas"],
            ["verduras", "Verduras"],
            ["carbohidratos", "Carbos"],
            ["frutas", "Frutas"],
            ["extras", "Extras"]
        ],
        sourceNote,
        search,
        scale,
        total
    };
})();
