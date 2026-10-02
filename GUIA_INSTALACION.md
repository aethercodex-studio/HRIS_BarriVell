# Guía paso a paso · HRIS Barri Vell

De cero a la web funcionando con base de datos real. Calcula unos 30–40 minutos.
No hace falta saber programar: solo copiar, pegar y hacer clic.

**Qué vas a necesitar**
- Una cuenta de **GitHub** (gratis) → github.com
- Una cuenta de **Supabase** (gratis) → supabase.com (puedes entrar con tu cuenta de GitHub)
- La carpeta del proyecto `hris-barri-vell` (la que has descargado)

---

## Parte 1 · Crear la base de datos en Supabase

### 1.1 Crear el proyecto
1. Entra en **supabase.com** → **Start your project** → inicia sesión.
2. **New project**.
   - **Name:** `hris-barri-vell`
   - **Database Password:** pulsa *Generate a password* y **guárdala** en un sitio seguro.
   - **Region:** *West EU (Ireland)* o la más cercana.
   - **Plan:** Free.
3. **Create new project** y espera 1–2 minutos a que termine.

### 1.2 Crear las tablas
1. En el menú de la izquierda: **SQL Editor** → **New query**.
2. Abre el archivo `supabase/schema.sql` del proyecto con el Bloc de notas, **copia todo** y pégalo.
3. Pulsa **Run** (abajo a la derecha). Debe aparecer *Success. No rows returned*.

Esto crea las tablas (empresas, locales, grupos, trabajadores, turnos, días libres, ficheros, nóminas y ajustes), la seguridad y el espacio para guardar ficheros. También crea las empresas **TrescientascuarentaSL** y **Valadri24SL**, los locales **Vermuteria**, **Lola** y **River** y los grupos **Camarero** y **Cocinero**.

> Puedes comprobarlo en **Table Editor**: verás todas las tablas en la lista.

### 1.3 Importar los datos del documento (Vermuteria y River)
1. **Antes de nada**, abre `supabase/import_vermuteria_river.sql` y revisa las 3 fechas del principio:
   ```sql
   semana_v1 date := '2026-02-02';   -- Vermuteria, tabla 1
   semana_v2 date := '2026-02-09';   -- Vermuteria, tabla 2
   semana_r1 date := '2026-01-19';   -- River
   ```
   El documento dice "SEMANA 6" y "SEMANA 4" pero no el año. Si las semanas eran otras, cambia la fecha por el **lunes** correcto (formato `AAAA-MM-DD`).
2. **SQL Editor** → **New query** → pega el archivo completo → **Run**.
3. Abajo verás el resultado: **21 trabajadores** y **116 turnos**.

Qué importa: 16 trabajadores de Vermuteria y 5 de River con su €/h, y todos los turnos de las tres semanas.
Lo que el documento no tenía (apellidos, DNI, teléfono, horas de contrato…) lo completas después desde la ficha de cada trabajador.
Todos entran como **Camarero**: cambia a **Cocinero** a quien corresponda.

> Si lo ejecutas dos veces no pasa nada: actualiza a los trabajadores y vuelve a crear los turnos importados.

### 1.4 Crear el usuario que entrará en la web
1. Menú izquierdo: **Authentication** → **Users** → **Add user** → **Create new user**.
2. Escribe el **correo** y una **contraseña**. Marca **Auto Confirm User**.
3. **Create user**.

### 1.5 ⚠ Cerrar el registro (muy importante)
Así nadie más puede crearse una cuenta y ver los datos.
1. **Authentication** → **Sign In / Providers** (en algunas versiones: *Providers → Email*).
2. Desactiva **Allow new users to sign up**.
3. **Save**.

### 1.6 Copiar las claves de conexión
1. Menú izquierdo: **Project Settings** (rueda dentada) → **API** (o **Data API**).
2. Copia y guarda estos dos valores:
   - **Project URL** → algo como `https://abcdefgh.supabase.co`
   - **anon public** key → un texto largo que empieza por `eyJ…`

> La clave *anon* puede ir en la web: la seguridad la ponen las reglas creadas en el paso 1.2 y el registro cerrado del 1.5. **Nunca** uses la clave *service_role*.

---

## Parte 2 · Publicar la web en GitHub Pages

### 2.1 Subir el proyecto a GitHub
1. En **github.com** → **New repository**.
   - **Repository name:** `hris-barri-vell`
   - **Public** (GitHub Pages gratis necesita repositorio público).
   - No marques nada más → **Create repository**.
2. En la página del repositorio vacío: **uploading an existing file**.
3. Arrastra **el contenido** de la carpeta `hris-barri-vell` (no la carpeta entera): `src`, `public`, `supabase`, `index.html`, `package.json`, `vite.config.js`, etc.
4. **Importante:** la carpeta oculta **`.github`** también tiene que subirse. Si tu ordenador no la muestra:
   - Windows: Explorador → **Vista** → **Mostrar** → **Elementos ocultos**.
   - Mac: en Finder pulsa **Cmd + Mayús + .**
   - Si aun así no se sube, crea el archivo a mano en GitHub: **Add file → Create new file**, nombre `.github/workflows/deploy.yml`, y pega el contenido del archivo.
5. **Commit changes**.

### 2.2 Guardar las claves de Supabase en GitHub
1. En el repositorio: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
2. Crea dos secretos:
   - Nombre `VITE_SUPABASE_URL` → valor: la **Project URL** del paso 1.6
   - Nombre `VITE_SUPABASE_ANON_KEY` → valor: la **anon public key** del paso 1.6

> Sin estos secretos la web funciona en **modo demo** (datos de ejemplo guardados en el navegador).

### 2.3 Activar GitHub Pages
1. **Settings** → **Pages**.
2. En **Build and deployment → Source** elige **GitHub Actions**.

### 2.4 Lanzar la publicación
1. Pestaña **Actions** → **Deploy to GitHub Pages** → **Run workflow** → **Run workflow**.
   (A partir de ahora se publica sola cada vez que subas cambios.)
2. Espera 1–2 minutos hasta que salga el **círculo verde**.
3. Tu web estará en: **`https://<tu-usuario>.github.io/hris-barri-vell/`**
   (también aparece en **Settings → Pages**).

### 2.5 Avisar a Supabase de la dirección de la web
1. Supabase → **Authentication** → **URL Configuration**.
2. **Site URL:** `https://<tu-usuario>.github.io/hris-barri-vell/` → **Save**.

---

## Parte 3 · Primer acceso y comprobaciones

1. Abre la web y entra con el correo y la contraseña del paso 1.4.
2. En la barra lateral, abajo, debe poner **Conectado a Supabase** (si pone *Modo demo*, revisa el paso 2.2 y vuelve a lanzar el 2.4).
3. **Calendario** → Vermuteria → navega hasta la semana importada (por ejemplo, 2 de febrero de 2026) y comprueba los turnos.
4. **Empleados** → abre cada ficha → **Editar** → completa apellidos, DNI, teléfono, grupo y **horas de contrato**.
5. **Configuración → Alta gestoría / Solicitud PRL** → pon el correo real de la gestoría y revisa las plantillas.

---

## Problemas frecuentes

| Qué ves | Qué hacer |
|---|---|
| Página en blanco y error `main.jsx 404` | GitHub Pages está sirviendo el código sin compilar. Revisa **2.3** (Source = GitHub Actions) y que exista `.github/workflows/deploy.yml`. |
| La acción sale en **rojo** | Abre la acción → mira el paso que falla. Lo más habitual: falta `package.json` o un archivo no se subió. |
| Pone *Modo demo* | Faltan los secretos del **2.2** o tienen otro nombre. Corrígelos y vuelve a lanzar **2.4**. |
| *Correo o contraseña incorrectos* | Revisa el usuario en **Authentication → Users** (debe estar *Confirmed*). |
| *Error al guardar* | Comprueba que se ejecutó `schema.sql` entero sin errores. |
| No sube un fichero | Máximo 3 MB por fichero. El bucket `ficheros` lo crea `schema.sql`. |

## Límites del plan gratuito de Supabase
- 500 MB de base de datos y 1 GB de ficheros: de sobra para un equipo pequeño.
- Si el proyecto pasa **7 días sin usarse**, Supabase lo pausa. Se reactiva desde el panel con **Restore**. Entrar en la web una vez por semana lo evita.

## Copias de seguridad (recomendado una vez al mes)
Supabase → **Database → Backups** (en el plan gratuito, descarga manual desde **Table Editor → Export to CSV** de cada tabla), o exporta desde **Horas y nóminas → Exportar Excel**.
