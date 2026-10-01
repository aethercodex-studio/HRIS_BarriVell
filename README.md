# HRIS Barri Vell

Gestión de empleados, turnos y horas para pequeños negocios de hostelería con varias empresas y locales.
Interfaz en español, responsive (móvil y escritorio). React + Vite, con Supabase como base de datos (plan gratuito).

## Puesta en marcha

```bash
npm install
cp .env.example .env      # opcional: rellena Supabase (si lo dejas vacío → modo demo)
npm run dev               # http://localhost:5173
npm run build             # versión de producción en /dist
```

**Modo demo** (sin Supabase): los datos se guardan en el navegador (localStorage) y se carga un juego de datos de ejemplo. Se entra con cualquier correo y contraseña.

## Conectar Supabase

1. Crea un proyecto en supabase.com (plan gratuito).
2. SQL Editor → pega y ejecuta `supabase/schema.sql` (tablas, índices y seguridad RLS).
3. Authentication → Users → *Add user*: crea el único usuario que entrará.
4. Project Settings → API → copia `URL` y `anon key` en `.env`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
5. Reinicia `npm run dev`. La app usará el login de Supabase y guardará allí los datos.

## Estructura

```
src/
├── main.jsx                 Punto de entrada
├── App.jsx                  Login ↔ app, registro de páginas
├── config/
│   ├── constants.js         Reglas ajustables: horario nocturno, colores, plantilla, columnas…
│   └── env.js               Variables de entorno (Supabase)
├── lib/                     Utilidades puras sin React
│   ├── dates.js             Fechas 'YYYY-MM-DD', semanas, etiquetas en español
│   ├── time.js              Horas 'HH:MM', cálculo de horas diurnas/nocturnas
│   ├── format.js            Euros, horas, nombres, búsqueda sin acentos
│   ├── template.js          Plantilla de correo a la gestoría + mailto
│   ├── printWeek.js         Hoja imprimible de la semana (A4 horizontal)
│   ├── colors.js            Paleta de grupos
│   └── utils.js             IDs, descargas, CSV, reducción de imágenes
├── domain/                  Reglas de negocio (testeables, sin UI)
│   ├── actions.js           TODAS las modificaciones de datos
│   ├── hours.js             Agregados de horas, coste bruto, nómina / fuera de nómina
│   ├── payroll.js           Informe de horas y nóminas
│   └── calendarLayout.js    Colocación de turnos solapados en el calendario
├── data/                    Persistencia intercambiable
│   ├── index.js             Elige repositorio (Supabase o local)
│   ├── localRepository.js   Modo demo (localStorage)
│   ├── supabaseRepository.js  Supabase: guarda solo lo que cambia
│   ├── mappers.js           camelCase (app) ↔ snake_case (tablas)
│   └── seed.js              Datos de ejemplo
├── state/
│   ├── AppProvider.jsx      Sesión, datos, update(), toast, confirm()
│   ├── NavContext.jsx       Página activa, local activo, ficha abierta
│   └── useLookups.js        Mapas por id y ordenaciones compartidas
├── hooks/                   useIsMobile, useUiPreference
├── components/
│   ├── ui/                  Botones, campos, modal, panel lateral, pills, iconos…
│   └── layout/              Barra lateral (escritorio) y pestañas inferiores (móvil)
├── features/                Una carpeta por pantalla
│   ├── auth/                Login con animación
│   ├── home/                Inicio: quién trabaja hoy + pendientes
│   ├── employees/           Lista, ficha, formulario, correo a gestoría
│   ├── calendar/            Semana (arrastrar/alargar), mes, horas semanales, día libre
│   ├── payroll/             Horas y nóminas + exportación CSV
│   └── settings/            Empresas y locales, grupos, gestoría
└── styles/                  tokens.css (colores, radios, fuentes) + global.css
```

### Cómo fluye un cambio

```
Componente → update(actions.saveShift, {...})
           → AppProvider clona los datos, aplica la acción, re-renderiza
           → repository.save(anterior, nuevo)  (debounce; Supabase solo recibe lo que cambió)
```

Para añadir una regla de negocio, crea una función en `domain/actions.js` y llámala con `update(...)`.
Para añadir una pantalla, crea `features/<nombre>/` y regístrala en `PAGES` (`state/NavContext.jsx`) y en `App.jsx`.

## Reglas de negocio

- **Noche**: de 22:00 a 06:00 (`config/constants.js`). Un turno que pasa de medianoche cuenta para el día en que empieza.
- **€/h nocturna sin informar**: las horas nocturnas se pagan a €/h normal y se muestra el aviso «Este trabajador no tiene el precio por hora nocturna informada».
- **Nómina / fuera de nómina**: las horas hasta el contrato del periodo van a nómina; el resto, fuera. En el mes, el contrato semanal se escala por los días del mes. Sin contrato informado → todo fuera de nómina.
- **Días libres**: no se pagan. Mover un libre a otro día intercambia los turnos de ese día.
- **Fechas automáticas**: alta = día de creación; baja = día de desactivación (y se borran los turnos futuros).
- **Borrar empresa o local**: doble confirmación.
- **Superar el contrato** se permite; solo se muestra.

## Próximos pasos sugeridos

- Envío automático del correo de alta con adjuntos mediante una Edge Function de Supabase (p. ej. con Resend).
- Guardar las imágenes del DNI en Supabase Storage en lugar de en la tabla.
- Tests unitarios de `domain/` (Vitest).
