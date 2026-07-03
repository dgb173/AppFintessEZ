# App Fitness EZ

Dashboard de progresion de gimnasio, mesociclos, dieta autoregulada, cheat meal y sincronizacion local/web.

## Base de alimentos

Incluye `food-database.js` con 153 alimentos por 100 g, imagen generada local para cada alimento y buscador dentro de la vista Dieta.

- Mi dieta: pollo, pavo, soja texturizada, crema de cacahuete, cacahuete desgrasado, crema de arroz, arroz, patata, avena y huevos.
- Tortitas: Mercadona, Carrefour, Lidl y Caprabo/Eroski.
- Barritas: Hacendado, Barebells, Grenade, Quest, MyProtein, Prozis, Foodspring, PowerBar, Enervit, Aptonia, Amix, Lidl, Carrefour y Weider.
- Verduras, carbohidratos, frutas y extras para completar comidas.

Los valores son promedios por 100 g. Los genericos estan basados en referencias tipo USDA/FoodData Central; los productos comerciales son aproximaciones de etiquetas publicas/Open Food Facts cuando hay datos disponibles.

## Local

```bash
npm install
npm start
```

Abre `http://localhost:3000`.

Tambien puedes abrir `index.html` directamente, pero la sincronizacion cloud necesita configurar una URL de API de Render en Ajustes.

## Render

El repo incluye `render.yaml` para desplegar:

- Web service Node.
- Render Postgres.
- `SYNC_SECRET` generado automaticamente.
- `DATABASE_URL` conectado a la base de datos.

En Render, crea un Blueprint desde el repo y selecciona `render.yaml`.

## Sincronizacion

La app sincroniza estos datos:

- pesos y objetivos actuales
- historial de entrenos
- pasos
- dieta real
- calendario diario
- ajustes de mesociclo

En la web de Render usa la API del mismo dominio. En local puedes pegar la URL de Render en Ajustes para que local y web usen el mismo backend.
