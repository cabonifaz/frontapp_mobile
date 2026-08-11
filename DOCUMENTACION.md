# AVO Sports — Documentación Funcional

> Generado a partir del análisis completo de prototipos (imágenes 25–136).
> Stack: React Native + Expo SDK 54, JavaScript.

---

## Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Paleta de colores y diseño](#2-paleta-de-colores-y-diseño)
3. [Módulo de Autenticación](#3-módulo-de-autenticación)
4. [Módulo Home](#4-módulo-home)
5. [Módulo Ranking](#5-módulo-ranking)
6. [Módulo Resultados](#6-módulo-resultados)
7. [Módulo Partidos](#7-módulo-partidos)
8. [Módulo Clases](#8-módulo-clases)
9. [Módulo Perfil](#9-módulo-perfil)
10. [Módulo Chat](#10-módulo-chat)
11. [Pantallas de éxito y recompensa](#11-pantallas-de-éxito-y-recompensa)
12. [Navegación completa](#12-navegación-completa)
13. [Componentes reutilizables](#13-componentes-reutilizables)
14. [Estructura de datos](#14-estructura-de-datos)
15. [Reglas de negocio](#15-reglas-de-negocio)

---

## 1. Arquitectura general

```
App
├── NavigationContainer
│   └── Stack.Navigator (initialRoute: "Login")
│       ├── Login
│       ├── Register
│       ├── ForgotPassword
│       └── MainTabs (Tab.Navigator)
│           ├── Home
│           ├── Ranking
│           ├── Resultados
│           ├── Partidos
│           └── Perfil
│
│       (pantallas que se apilan sobre los tabs)
│       ├── FriendlyMatch  → BuscarPartidoScreen { tab: 'Amistoso' }
│       ├── RankedMatch    → BuscarPartidoScreen { tab: 'Rankeado' }
│       ├── CrearPartido
│       ├── RetarJugador
│       ├── MisSolicitudes
│       ├── DetallePartido
│       ├── ColocarResultados
│       ├── TomarClase
│       ├── ProfesoresDisponibles
│       ├── DetalleClase
│       ├── EditProfile
│       └── PlayerProfile
```

**Patrón de datos:** Mock data estático como fallback + llamada real al servicio API. Si la API falla o devuelve vacío, se muestran los datos mock.

---

## 2. Paleta de colores y diseño

| Token | Valor | Uso |
|---|---|---|
| `colors.dark` | `#0D1C27` | Header oscuro, botones activos, tab bar |
| `colors.accent` | `#F5B800` | Botones primarios (CTA), indicadores activos |
| `colors.background` | `#FFFFFF` | Fondo general de pantallas |
| `colors.surface` | `#F2F2F2` | Tarjetas, inputs, chips inactivos |
| `colors.textPrimary` | `#0D1C27` | Texto principal |
| `colors.textSecondary` | `#888888` | Subtítulos, metadata |
| `colors.error` | rojo | Punto "live" en partidos/clases en curso |
| `colors.primary` | oscuro/negro | Texto en botones amarillos |
| `colors.border` | gris claro | Bordes de separadores |

**Tipografía:** Sistema (sin fuente personalizada). Pesos: 400 normal, 500 medium, 600 semibold, 700 bold, 800+ extra-bold para headings.

**Bordes redondeados:** Chips 24–30px, tarjetas 14–16px, avatares circulares.

**Sombras:** No se usan sombras pronunciadas — el diseño usa fondos surface para elevar tarjetas.

---

## 3. Módulo de Autenticación

### 3.1 SplashScreen / Bienvenida
- Logo AVO Sports centrado
- Tagline de la app
- Dos botones: **"Iniciar sesión"** (primario amarillo) + **"Registrarse"** (secundario outline)

### 3.2 LoginScreen
**Ruta:** `Login`

**Campos:**
- Email (TextInput, keyboardType email-address)
- Contraseña (TextInput, secureTextEntry)

**Acciones:**
- Botón "Iniciar sesión" → valida campos → navega a `MainTabs`
- Link "Olvidé mi contraseña" → navega a `ForgotPassword`
- Opciones de login social (Google / Apple) — botones de íconos

**Validaciones:**
- Email no vacío y con formato válido
- Contraseña no vacía

### 3.3 RegisterScreen — Wizard de 4 pasos
**Ruta:** `Register`

El registro es un flujo de 4 pasos con un indicador de progreso (stepper) en la parte superior.

#### Paso 1 — Información básica
Campos obligatorios:
- Nombre
- Apellido
- Género (selector: Masculino / Femenino)
- Edad (TextInput numérico)
- Correo electrónico
- Número de celular
- Checkbox "Acepto los términos y condiciones"

Botón "Siguiente" habilitado solo cuando todos los campos están completos y el checkbox marcado.

#### Paso 2 — Determina tu nivel
Campos:
- Nivel de juego (radio buttons): Principiante / Intermedio / Avanzado / Elite
- Partidos por semana (selector numérico o radio)
- ¿Has tomado lecciones? (radio: Sí / No)
- Nivel físico (radio: Bajo / Medio / Alto)
- Checkbox "Deseo ser profesor" — activa el perfil de instructor
- Textarea "Mayores logros" (texto libre)

Botón "Siguiente".

#### Paso 3 — Foto de perfil
- Círculo de avatar grande con ícono de cámara
- Al tocar: abre selector de imagen (cámara o galería)
- Preview de la imagen seleccionada
- Botón "Siguiente" (la foto puede ser opcional)

#### Paso 4 — Éxito / Bienvenida
- Mensaje "¡Bienvenido a AVO Sports!"
- Avatar del usuario
- Botón "Empezar" → navega a `MainTabs`

### 3.4 ForgotPasswordScreen
**Ruta:** `ForgotPassword`

- Campo email
- Botón "Enviar instrucciones"
- Mensaje de confirmación inline tras el envío
- Link "Volver al login"

---

## 4. Módulo Home

### HomeScreen
**Ruta:** `Home` (tab principal)

**Componente SharedHeader** (dark, `#0D1C27`):
- Avatar del usuario (circular, navegable al perfil)
- Sport label: "Tenis"
- Saludo: "Hola [Nombre]"
- Estadísticas: Ranking (trofeo + número) + Rating de estrellas (4.5)
- Círculo de nivel derecho: número de nivel grande (ej. 17) con anillo de progreso amarillo + puntos totales debajo (ej. 1050 pts)

**Sección de estadísticas rápidas** (bajo el header):
- Partidos jugados
- Puntos acumulados
- Posición en ranking

**Grid de 4 acciones (2x2):**

| Card | Ícono | Badge | Destino |
|---|---|---|---|
| Partido amistoso | foto de cancha | "50 online" | `FriendlyMatch` |
| Partido rankeado | foto de cancha | "50 online" | `RankedMatch` |
| Visitar tienda | foto tienda | — | (externo / en desarrollo) |
| Tomar clase | foto clase | badge notificación roja | `TomarClase` |

**Sección "Resultados recientes":** Preview de últimos 2-3 partidos con score compacto.

---

## 5. Módulo Ranking

### RankingScreen
**Ruta:** `Ranking` (tab)

**SharedHeader** con datos del usuario actual.

**Controles:**
- Título "Ranking" + selector de temporada dropdown (ej. "Verano 2024 ▼")
- Barra de búsqueda: "Buscar jugador" (filtra la lista en tiempo real)
- Tabs de género: **General** | **Masculino** | **Femenino** (toggle pills)

**Podio top 3** (visual tipo podio):
- Posición #1 al centro (avatar más grande, badge amarillo con "1")
- Posición #2 a la izquierda
- Posición #3 a la derecha
- Cada uno muestra: nombre + puntos

**Lista de posiciones 4 en adelante:**
- Número de posición | Avatar | Nombre | Puntos
- Al tocar un jugador → navega a `PlayerProfile`

**Modal "Seleccionar temporada"** (al tocar el dropdown):
- Radio buttons: Verano 2024 / Invierno 2023 / Verano 2023 / Invierno 2022
- Botón "Filtrar" (amarillo)
- X para cerrar

**Lógica de filtrado:**
- El tab de género filtra la lista (General muestra todos)
- La temporada cambia el dataset completo
- La búsqueda filtra por nombre sobre la lista activa

---

## 6. Módulo Resultados

### ResultadosScreen
**Ruta:** `Resultados` (tab)

**SharedHeader** con datos del usuario.

**Controles:**
- Título "Resultados"
- Barra de búsqueda: "Buscar jugador"
- Filter chips de tiempo: **Hoy** | **Ayer** | **Esta Semana** (uno activo a la vez, estilo pill oscuro)

**Lista de resultados agrupados por fecha:**
- Encabezado de fecha (ej. "Mar 11 Feb, 2024")
- Tarjeta de partido:
  - Fecha grande izquierda (día + mes)
  - Dos jugadores (avatar + nombre)
  - Scores por set (ej. 6 5 4 / 4 7 6)

**Lógica:**
- "Hoy" → partidos del día actual
- "Ayer" → partidos del día anterior
- "Esta Semana" → partidos de los últimos 7 días
- La búsqueda filtra por nombre de jugador

---

## 7. Módulo Partidos

### 7.1 PartidosScreen
**Ruta:** `Partidos` (tab)

**SharedHeader** con datos del usuario.

**Tabs internos:**
- **Partidos** | **Clases** (underline indicator amarillo)

#### Tab Partidos
Lista de partidos programados agrupados por fecha.

Tarjeta `AppointmentCard`:
- Avatar del rival (circular 60px)
- Nombre + ícono trofeo + ranking del rival
- Club (itálica, color secundario)
- Fecha (calendario icon) + Hora (reloj icon)
- Punto rojo `liveDot` si el partido está en curso

Al tocar → `DetallePartido` con el objeto `partido` como parámetro.

**Datos desde API:** `partidoService.listarMisPartidos()` con fallback a `PARTIDOS_DATA` mock.

#### Tab Clases
Lista de clases programadas, mismo formato de tarjeta pero muestra el profesor.

Al tocar → `DetalleClase` con el objeto `clase` como parámetro.

### 7.2 BuscarPartidoScreen
**Ruta:** `FriendlyMatch` (tab: 'Amistoso') / `RankedMatch` (tab: 'Rankeado')

**Tabs superiores:** Amistoso | Rankeado (el que corresponda activo por defecto)

**Chips de filtro activos:**
- **Cancha** → abre modal de selección de cancha
- **Fecha** → abre modal de selección de fecha (grid de días)
- **Hora** → abre modal de selección de hora (chips)
- **Tipo** → abre modal de tipo de juego (1 vs 1 / 2 vs 2)

Cada chip muestra el valor seleccionado (ej. "Cancha · Terrazas") y un X para limpiar.

**Lista de partidos disponibles:** Tarjetas de jugadores que buscan rival:
- Avatar + nombre + ranking + puntos
- Club + fecha + hora
- Botón "Retar" (outline) → `RetarJugador`
- Contador de jugadores disponibles filtrando en tiempo real

**Modales de filtro:**

*Modal Cancha:*
- Header "Selecciona una cancha" + X cierre
- Barra de búsqueda "Buscar cancha"
- Lista de canchas: foto (80px) + nombre + dirección (location icon)
  - Canchas disponibles: Terrazas Miraflores, Club Real Lima, Complejo Deportivo San Isidro

*Modal Fecha:*
- Grid de días (próximos 14 días)
- Cada chip: número de día grande + mes abreviado
- Un solo día seleccionable a la vez

*Modal Hora:*
- Chips horizontales con horas disponibles (07:00 – 20:00)
- Un solo horario seleccionable

*Modal Tipo de juego:*
- Radio buttons: **1 vs 1** | **2 vs 2**
- Botón confirmar

### 7.3 RetarScreen
**Ruta:** `RetarJugador`

Flujo para retar a un jugador específico:
- Muestra datos del jugador rival (avatar, nombre, ranking, pts)
- Selector de cancha, fecha, hora (igual que CrearPartido)
- Botón "Enviar reto"
- Al aceptar el reto el rival → pantalla de éxito (131): "¡Genial! [Nombre] ha aceptado tu reto"

### 7.4 CrearPartidoScreen
**Ruta:** `CrearPartido`

Permite al usuario publicar un partido para que otros lo encuentren en BuscarPartido.

**Campos:**
1. **Cancha** — tarjeta clickeable que abre `CanchaModal` (foto + nombre + "Toca para cambiar")
2. **Fecha** — scroll horizontal de chips (próximos 14 días, un chip activo a la vez)
3. **Hora** — scroll horizontal de chips (07:00–20:00, un chip activo a la vez)
4. **Tipo de juego** — toggle pill: **1 vs 1** | **2 vs 2**

**Nota obligatoria:** "Es mandatorio para el anfitrión del partido separar la cancha elegida por un medio independiente."

**Lógica habilitación del botón:**
```js
const canConfirm = !!cancha && !!fecha && !!hora;
```

Botón "Confirmar" amarillo (deshabilitado = surface gris hasta cumplir condición).

**Estado de éxito** (inline, reemplaza el formulario):
- Ícono de tenis en círculo gris
- "¡Genial! Has creado una partida"
- Subtítulo: "Acepta al jugador con el que desees jugar desde 'Mis Solicitudes'"
- Botón "Ir a mis solicitudes" → `MisSolicitudes`

### 7.5 MisSolicitudesScreen
**Ruta:** `MisSolicitudes`

Dos secciones:

**Sección superior — Mis partidos creados:**
- Tarjeta con foto de cancha + nombre + fecha/hora
- Botón X (cancelar) a la derecha

**Sección "Solicitudes en espera":**
- Jugadores que solicitaron unirse a mi partido creado
- Tarjeta: avatar + nombre + ranking + club + fecha/hora
- Sin botones visibles en el prototipo (se asume que al tocar se puede aceptar/rechazar)

### 7.6 DetallePartidoScreen
**Ruta:** `DetallePartido`

**Parámetros recibidos:** `{ partido: { name, ranking, pts, avatar, club, date, time } }`

**Layout:**
1. **Cover** — ImageBackground de la cancha (200px alto) con botón back circular semitransparente
2. **Sheet** (panel deslizante con bordes redondeados, sobrelapando el cover)
   - **Sección jugadores VS:**
     - Yo (izquierda): avatar + badge ranking + nombre + pts
     - "vs" centrado
     - Rival (derecha): avatar + badge ranking + nombre + pts
   - **Detalles del partido:**
     - Tarjeta: nombre del club + dirección (location icon)
     - Tarjetas en fila: fecha (calendar icon) | hora (clock icon)
   - **Nota obligatoria:** "Es mandatorio para los competidores colocar los resultados hasta 12 hrs luego del encuentro."
   - **Botones:**
     - "Cancelar partido" (outline, vuelve atrás)
     - "Colocar resultados" (amarillo) → `ColocarResultados`

### 7.7 ColocarResultadosScreen
**Ruta:** `ColocarResultados`

**Parámetros:** `{ partido: { name, avatar, pts, ranking, club, date, time } }`

**Estado 1 — Formulario de resultados:**

Layout: yo (izquierda, avatar 64px + nombre + pts) | scores (centro) | rival (derecha)

**Scores:** 3 filas `ScoreRow`:
- Label "Set 1 / 2 / 3"
- TextInput mi score (número, 52px ancho)
- Separador ":"
- TextInput score rival

**Habilitación del botón:**
```js
const canConfirm = scores.some(s => s.my !== '' || s.rival !== '');
```

**Sección rating:**
- "¿Qué tal fue jugar con [rival]?"
- `StarRating` — 5 estrellas tocables (color oscuro si activa)

**Sección comentario:**
- "Deja un comentario de tu rival"
- TextInput multiline, 4 líneas, "50 palabras como máximo."

**Sección fotos:**
- "Sube fotos del encuentro"
- Box placeholder con ícono + "Toca para subir fotos"

**Botón fijo bottom:** "Confirmar resultados" (habilitado cuando hay al menos un score)

---

**Estado 2 — Confirmación del rival:**

Al presionar "Confirmar resultados" (`setConfirmed(true)`), la pantalla cambia al estado de confirmación:

- Texto: "[Rival] ha publicado estos resultados, ¿estás de acuerdo con ellos?"
- Tarjeta de scores de solo lectura (Set 1/2/3 con valores ingresados)
- Botón "No, deseo revisión" (outline) → `goBack()`
- Botón "Sí, de acuerdo" (amarillo) → `navigate('MainTabs', { screen: 'Partidos' })`

---

## 8. Módulo Clases

### 8.1 TomarClaseScreen
**Ruta:** `TomarClase`

**Dos modos de entrada:**

**Modo Alumno — "Tomar clase":**
Muestra formulario de búsqueda:
1. **Cancha** — tarjeta clickeable (abre CanchaModal) con foto + nombre
2. **Nota:** "Es mandatorio para el usuario que busca tomar una clase separar la cancha elegida por medio de un proveedor independiente."
3. **Fecha** — scroll horizontal de chips (próximos 14 días)
4. **Hora** — scroll horizontal de chips (07:00–20:00), permite seleccionar múltiples horas
5. Botón "Buscar profesores" (amarillo) → `ProfesoresDisponibles`

**Modo Instructor — "Dictar clase":**
Formulario para que el profesor publique su disponibilidad:
- Mismos campos (cancha, fecha, hora)
- Botón "Publicar disponibilidad"

### 8.2 ProfesoresDisponiblesScreen
**Ruta:** `ProfesoresDisponibles`

Lista de profesores que tienen disponibilidad en el horario buscado.

**Tarjeta de profesor (modo búsqueda desde alumno):**
- Avatar + nombre + ranking (trofeo icon) + club
- Fecha + hora de disponibilidad
- Tiempo transcurrido desde que publicó ("Hace 15 min.")
- Botón "Solicitar" (outline) → envía solicitud al profesor

**Tarjeta de profesor (modo lista estándar):**
- Avatar + nombre + especialidad deportiva
- Rating de estrellas
- Precio por hora

Al tocar la tarjeta → `DetalleClase`

### 8.3 DetalleClaseScreen
**Ruta:** `DetalleClase`

**Vista Alumno (reservar clase):**
1. Foto cover grande del profesor / cancha
2. Avatar del profesor sobrelapando el cover
3. Nombre + rating de estrellas
4. Bio / descripción completa
5. Horarios disponibles del profesor
6. Botón "Reservar clase" (amarillo, CTA principal)

**Vista después de aceptada la clase (Estado éxito — prototipo 124):**
- Avatar del profesor
- "¡Genial! [Nombre] ha aceptado la clase"
- Subtítulo: "Ponte de acuerdo con él desde 'Mis partidos'."
- Botón "Ir a mis partidos" → `MainTabs { screen: 'Partidos' }`

**Vista del profesor — Detalle de clase propia (prototipo 128):**
- Cover foto + back button + menú "..."
- Avatar del profesor + ranking badge + label "Profesor"
- **Detalles de la clase:**
  - Club + dirección
  - Fecha | Hora
- **Botones de acción:**
  - "Cancelar clase" (outline)
  - "Clase completada" (amarillo) → flujo de puntos ganados

---

## 9. Módulo Perfil

### 9.1 ProfileScreen
**Ruta:** `Perfil` (tab)

**Header de perfil:**
- Foto de portada (ImageBackground)
- Avatar circular sobrelapando el borde inferior del cover
- Nombre completo
- Badge de ranking
- Botón "Editar perfil" → `EditProfile`

**3 tabs de contenido:**

**Tab Estadísticas:**
- Gráfico de anillo (donut chart) — % de victorias
- Contador de partidos ganados / perdidos
- Racha actual (win streak)
- Total de puntos

**Tab Detalles:**
- Deporte favorito
- Club habitual
- Bio / "Sobre mí" (texto libre)

**Tab Resultados:**
- Lista de partidos jugados con score por sets
- Similar a ResultadosScreen pero solo del perfil del usuario

### 9.2 EditProfileScreen
**Ruta:** `EditProfile`

Formulario de edición de:
- Foto de perfil (avatar clickeable)
- Nombre / Apellido
- Bio / Sobre mí
- Deporte favorito
- Club
- Nivel de juego
- Información de contacto

Botón "Guardar cambios".

### 9.3 PlayerProfileScreen
**Ruta:** `PlayerProfile`

Perfil público de otro jugador. Mismo layout que ProfileScreen pero:
- Sin botón "Editar perfil"
- Botón "Retar" → `RetarJugador` con datos del jugador
- Botón "Ver historial de partidos"

---

## 10. Módulo Chat

### ChatScreen
**Ruta:** no registrada aún en AppNavigator (pendiente de implementar)

Se accede desde el detalle de un partido o clase después de que el oponente/profesor acepta.

**Layout:**
- Header oscuro: back button + avatar circular + nombre del contacto + ícono de acceso rápido ("Clase" o "Partido") en la derecha
- Área de mensajes (ScrollView):
  - Burbuja izquierda (gris claro, recibido): texto + timestamp
  - Burbuja derecha (oscuro, enviado): texto + timestamp
- Bottom bar: TextInput "Enviar mensaje" + botón de envío (ícono flecha)

**Lógica:**
- Se abre desde `DetalleClase` o `DetallePartido` tras aceptación
- El ícono de acceso rápido en el header (Clase/Partido) permite volver al detalle de la actividad relacionada

---

## 11. Pantallas de éxito y recompensa

Estas pantallas aparecen como estado inline o como pantalla nueva tras completar una acción importante.

### Partido creado exitosamente
- Ícono de tenis en círculo gris
- "¡Genial! Has creado una partida"
- "Acepta al jugador con el que desees jugar desde 'Mis Solicitudes'"
- Botón "Ir a mis solicitudes"

### Reto aceptado por rival
- Avatar del rival
- "¡Genial! [Nombre] ha aceptado tu reto"
- "Ponte de acuerdo con él desde 'Mis partidos'."
- Botón "Ir a mis partidos"

### Clase aceptada por profesor
- Avatar del profesor
- "¡Genial! [Nombre] ha aceptado la clase"
- "Ponte de acuerdo con él desde 'Mis partidos'."
- Botón "Ir a mis partidos"

### Subida de posición en ranking
- Ícono trofeo grande
- "¡Genial! Subiste al puesto X en el ranking"
- "+N puestos"
- Botón "Ver ranking" → `Ranking`

### Puntos ganados (tras clase completada)
- Estrella grande en círculo amarillo claro
- "¡Genial! Has ganado 100 pts."
- "Completa más clases o juega más partidas para ganar más."
- Botón "Volver"

---

## 12. Navegación completa

### Flujo de Autenticación
```
Splash → Login → MainTabs
Splash → Register (wizard 4 pasos) → MainTabs
Login → ForgotPassword → Login
```

### Flujo Partido Amistoso / Rankeado
```
Home (card) → BuscarPartido (tab Amistoso/Rankeado)
  └─ Filtrar → Modales (cancha, fecha, hora, tipo)
  └─ Card jugador → RetarJugador → [Éxito reto enviado]
  └─ Crear partido → CrearPartido → [Éxito] → MisSolicitudes

MisSolicitudes → (aceptar solicitud entrante)
PartidosScreen → DetallePartido → ColocarResultados → [Confirmación] → MainTabs/Partidos
```

### Flujo Clases
```
Home (card Tomar clase) → TomarClase
  └─ [Modo alumno]
      └─ BuscarProfesores → ProfesoresDisponibles
          └─ Solicitar → DetalleClase → Reservar → [Éxito clase aceptada]
          └─ [Clase activa] → Chat con profesor
  └─ [Modo instructor]
      └─ Publicar disponibilidad → [Aparece en ProfesoresDisponibles]

PartidosScreen (tab Clases) → DetalleClase
  └─ [Vista alumno] → Chat, Cancelar
  └─ [Vista instructor] → Clase completada → [Puntos ganados]
```

### Flujo Perfil
```
Tab Perfil → ProfileScreen
  └─ Editar → EditProfile → ProfileScreen
  └─ Tab Stats / Detalles / Resultados

Ranking → (tocar jugador) → PlayerProfile → RetarJugador
```

---

## 13. Componentes reutilizables

### SharedHeader
Usado en: Home, Ranking, Resultados, Partidos.

Props implícitas (lee de estado global / PROFILE_MOCK):
- Avatar, nombre, deporte, ranking, rating, nivel, pts

Layout: fondo oscuro `colors.dark`, datos del usuario, anillo de nivel.

### AppointmentCard
Props: `{ item, onPress }`

Item shape:
```js
{
  id, avatar, name, ranking, club, date, time, live
}
```

Muestra punto rojo si `item.live === true`.

### ScoreRow
Props: `{ index, myScore, rivalScore, onChangeMyScore, onChangeRivalScore }`

Input numérico por set.

### StarRating
Props: `{ rating, onRate }`

5 estrellas tocables. Activas = color oscuro, inactivas = gris.

### CanchaModal
Props: `{ visible, onClose, onSelect }`

Modal fullscreen con búsqueda y lista de canchas.

### Chip de fecha
Props: `{ day, month, active, onPress }`

68x72px. Activo = fondo dark, inactivo = surface.

### Chip de hora
Props: `{ hora, active, onPress }`

Pill redondeado. Activo = dark, inactivo = surface.

### ConfirmationView (ColocarResultados)
Props: `{ scores, rivalName, onReview, onAgree }`

Muestra resultados publicados por el rival y pide confirmación.

---

## 14. Estructura de datos

### Usuario / Perfil
```js
{
  nombre: string,       // "Javier García"
  avatar: string,       // URL imagen
  deporte: string,      // "Tenis"
  ranking: number,      // posición en ranking, ej. 33
  pts: number,          // puntos totales, ej. 1050
  nivel: number,        // nivel de juego 1-20+, ej. 17
  rating: number,       // rating como rival, ej. 4.5
  club: string,
  bio: string,
  logros: string,
  esProfesor: boolean,
}
```

### Partido
```js
{
  id: string,
  tipo: 'Amistoso' | 'Rankeado',
  rival: { name, avatar, ranking, pts },
  club: string,
  address: string,
  date: string,         // "12 Feb 2024"
  time: string,         // "15:00"
  live: boolean,
  scores: [             // después del partido
    { my: string, rival: string }  // por set
  ]
}
```

### Clase
```js
{
  id: string,
  profesor: { name, avatar, ranking, rating, especialidad, precioPorHora },
  alumno: { name, avatar },
  club: string,
  address: string,
  date: string,
  time: string,
  live: boolean,
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada',
}
```

### Cancha
```js
{
  id: string,
  name: string,         // "Terrazas Miraflores"
  address: string,      // "Malecón 28 de Julio 390"
  uri: string,          // URL imagen de la cancha
}
```

### Solicitud (MisSolicitudes)
```js
{
  id: string,
  tipo: 'entrante' | 'saliente',
  jugador: { name, avatar, ranking },
  partido: { club, date, time },
  estado: 'espera' | 'aceptada' | 'rechazada',
}
```

### Resultado (ResultadosScreen)
```js
{
  id: string,
  fecha: Date,
  jugador1: { name, avatar },
  jugador2: { name, avatar },
  scores: [number],     // scores por set, ej. [6, 5, 4]
  scoresRival: [number] // ej. [4, 7, 6]
}
```

### Ranking entry
```js
{
  posicion: number,
  nombre: string,
  avatar: string,
  pts: number,
  genero: 'M' | 'F',
  temporada: string,    // "Verano 2024"
}
```

---

## 15. Reglas de negocio

### Sistema de puntos
- Ganar un partido rankeado → suma puntos al total
- Completar una clase → gana 100 pts (configurable)
- Los puntos determinan la posición en el ranking
- El ranking se calcula por temporada (Verano / Invierno)

### Obligaciones del jugador
- **Creador de partido:** debe separar la cancha por medio independiente (no lo gestiona la app)
- **Jugadores post-partido:** deben colocar resultados dentro de las 12 horas siguientes al encuentro
- **Usuario tomando clase:** debe separar la cancha elegida por medio independiente

### Registro de resultados
- Cualquiera de los dos jugadores puede cargar primero los resultados
- El segundo jugador ve los resultados cargados por el primero y debe confirmar
- Si no está de acuerdo → solicita revisión (flujo de disputa, por implementar)
- Tras confirmación mutual → los puntos se actualizan y el partido aparece en Resultados

### Perfil de instructor
- El usuario puede marcar "Deseo ser profesor" en el paso 2 del registro
- Si es profesor, puede publicar disponibilidad desde TomarClase → Modo "Dictar clase"
- Su perfil aparece en ProfesoresDisponibles cuando hay match de horario/cancha
- Desde DetalleClase puede marcar "Clase completada" → el alumno gana puntos

### Estados del partido / clase
```
creado → con solicitudes → confirmado (aceptado) → en curso (live) → completado → resultados confirmados
```

### Live indicator
- Punto rojo en la tarjeta cuando `item.live === true`
- Significa que el partido o clase está ocurriendo en este momento

### Chat
- Se habilita entre dos usuarios una vez que el partido/clase es confirmado
- El header del chat incluye acceso directo al detalle del partido/clase relacionado

### Ranking y temporadas
- El ranking puede filtrarse por: General / Masculino / Femenino
- Existe historial por temporada (Verano / Invierno)
- El usuario actual ve su propia posición resaltada en la lista

### Tienda (Visitar tienda)
- Card visible en Home pero flujo no detallado en prototipos
- Se asume link externo o módulo futuro

---

*Fin del documento. Generado el 10 de agosto de 2026 a partir del análisis de prototipos AVO Sports.*
