# Plan de Implementación - Extreme Demons List

## Estado actual
- Next.js 14 + Tailwind + Supabase Auth + PostgreSQL
- Roles: `user`, `moderator`, `admin`
- Páginas: home, demon/[id], submit, mod, login, register, profile/[username]
- DB existente: profiles, demons, submissions, moderation_logs, vista completions
- Componentes: AuthProvider, Navbar, DemonCard

## Objetivo
Añadir panel de administración de niveles, flujo de completions, panel de moderación mejorado y seguridad backend, manteniendo el diseño actual.

---

## Fase 1: Base de Datos

### 1.1 Modificar `supabase/schema.sql`

**Cambios en tabla `demons`:**
- Añadir columna `thumbnail_url` ya existe
- Añadir columna `verification_video_url` ya existe
- Añadir columna `description` ya existe
- Añadir columna `created_by` ya existe
- **Añadir columna `updated_at timestamptz`** con default `now()` y trigger para auto-actualizar
- Añadir columna `deleted_at timestamptz` para soft delete (opcional pero recomendado)
- **Añadir constraint único compuesto** `(position)` ya existe, mantenerlo
- Añadir índice en `name` para búsquedas

**Cambios en tabla `submissions`:**
- Revisar que tenga todas las columnas necesarias (ya tiene: demon_id, user_id, gd_username, video_url, fps, refresh_rate, comment, status, rejection_reason, reviewed_by, reviewed_at, created_at)
- **Añadir columna `playback_url`** para el video de reproducción (opcional, puede ser el mismo que video_url)
- **Añadir columna `is_verified boolean default false`** para marcar completions verificadas oficialmente

**Nueva tabla: `demon_edits` (auditoría de ediciones)**
```sql
create table public.demon_edits (
  id uuid primary key default uuid_generate_v4(),
  demon_id uuid not null references public.demons(id) on delete cascade,
  edited_by uuid not null references public.profiles(id),
  previous_values jsonb not null,
  new_values jsonb not null,
  created_at timestamptz not null default now()
);
```

**Nueva tabla: `demon_images` (galería de imágenes por nivel)**
```sql
create table public.demon_images (
  id uuid primary key default uuid_generate_v4(),
  demon_id uuid not null references public.demons(id) on delete cascade,
  url text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
```
- RLS: staff puede CRUD, lectores pueden ver imágenes de demons públicos
- Trigger para asegurar solo 1 imagen primary por demon

**Nueva tabla: `completion_notes` (notas adicionales de completions)**
```sql
create table public.completion_notes (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  content text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
```

**Nueva tabla: `demon_tags` (etiquetas de niveles)**
```sql
create table public.demon_tags (
  id uuid primary key default uuid_generate_v4(),
  demon_id uuid not null references public.demons(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique(demon_id, tag)
);
```

**Funciones nuevas:**
- `reorder_demons(from_pos, to_pos)` - función SQL para reordenar niveles (transaction)
- `update_demon_position(demon_id, new_position)` - wrapper de reorder
- `get_moderation_stats()` - estadísticas para panel

**Triggers nuevos:**
- Trigger en `demons` para actualizar `updated_at` automáticamente
- Trigger en `demon_images` para validar solo 1 primary

**Políticas RLS nuevas/actualizadas:**
- `demons`: staff puede hacer soft delete (update deleted_at)
- `demon_edits`: solo staff puede insertar/ver
- `demon_images`: staff CRUD, público SELECT
- `demon_tags`: staff CRUD, público SELECT
- `completion_notes`: staff puede ver todas, usuario puede ver las suyas
- Actualizar política de `submissions` para permitir que usuarios vean todas las aprobadas (ya está)

**Vista nueva: `moderation_dashboard`**
```sql
create or replace view public.moderation_dashboard as
select
  s.id,
  s.demon_id,
  s.user_id,
  s.gd_username,
  s.video_url,
  s.fps,
  s.refresh_rate,
  s.comment,
  s.status,
  s.rejection_reason,
  s.reviewed_by,
  s.reviewed_at,
  s.created_at,
  d.name as demon_name,
  d.position as demon_position,
  d.thumbnail_url,
  p.username as submitter_username
from public.submissions s
join public.demons d on d.id = s.demon_id
join public.profiles p on p.id = s.user_id
where s.status in ('pending', 'approved', 'rejected');
```

### 1.2 Migración

- Generar script de migración SQL
- Backup de datos actuales
- Ejecutar en Supabase SQL Editor
- Verificar RLS y políticas

---

## Fase 2: Componentes Nuevos/Modificados

### 2.1 Componentes reutilizables

**`components/LevelForm.js`** (nuevo)
- Formulario para crear/editar demon
- Campos: name, creator, level_id, position, difficulty, thumbnail_url, description, verification_video_url
- Reutilizable para create y edit
- Validación básica en cliente
- Estilo consistente con cards existentes

**`components/SubmissionCard.js`** (nuevo)
- Card para mostrar submission en panel de moderación
- Similar a DemonCard pero para submissions
- Muestra: usuario, demon, video, estado, fecha
- Botones de acción (approve/reject/view)

**`components/MediaUploader.js`** (nuevo)
- Componente para subir imágenes a Supabase Storage
- Drag & drop + click
- Preview de imagen
- Validación de tipo (image/*) y tamaño (max 5MB)
- Bucket: `demon-images`

**`components/PositionInput.js`** (nuevo)
- Input para posición/ranking de demon
- Muestra posición actual y permite cambiar
- Validación: número entero positivo, único
- Botones up/down para reordenar rápido

**`components/ConfirmDialog.js`** (nuevo)
- Modal de confirmación para acciones destructivas (borrar)
- Estilo consistente con el tema

### 2.2 Componentes a modificar

**`components/Navbar.js`**
- Añadir link "Administración" → `/admin` (solo admin)
- Reorganizar links condicionales

**`components/AuthProvider.js`**
- Añadir función `refreshProfile()` ya existe, mantener
- Añadir helper `canEditDemons()` = `isStaff`
- Considerar añadir `userRole` para facilitar checks

---

## Fase 3: Páginas Nuevas

### 3.1 Panel de Administración de Niveles

**Ruta: `/admin`**
- Protección: solo admin (no moderator, solo admin)
- Layout: 2 columnas en desktop
  - Izquierda: lista de demons existentes con búsqueda/filtros
  - Derecha: formulario de crear/editar (LevelForm)
- Acciones por demon:
  - Click → editar en formulario derecho
  - Botón eliminar → ConfirmDialog
  - Drag & drop para reordenar (o botones up/down)
- Botón "Nuevo nivel" → limpia formulario
- Submit del formulario:
  - Si es nuevo: INSERT en demons
  - Si es edición: UPDATE en demons
  - Subida de imagen: si hay nueva imagen, upload a Storage y actualizar thumbnail_url
- Reordenar: usar función SQL `reorder_demons` o UPDATE de positions en batch

**Ruta: `/admin/[id]/edit`** (opcional, alternativa a panel)
- Página dedicada de edición de demon
- Misma interfaz que formulario del panel

### 3.2 Panel de Moderación Mejorado

**Ruta: `/mod`** (mejorar existente)
- Tabs: Pendientes | Aprobadas | Rechazadas
- Filtros adicionales: por demon, por usuario, por fecha
- Búsqueda por nombre de usuario o demon
- Tabla/lista con paginación (10-20 por página)
- Modal de detalle al clickear submission:
  - Ver video embebido (YouTube/Vimeo player o link)
  - Ver toda la información del usuario
  - Ver info del demon
  - Aprobar/Rechazar con motivo
- Estadísticas arriba: pendientes, aprobadas hoy, rechazadas hoy
- Acciones bulk: aprobar/rechazar múltiples (opcional)

**Ruta: `/mod/stats`** (opcional)
- Dashboard con estadísticas de moderación
- Gráficos: submissions por día, por demon, por usuario
- Tiempo promedio de revisión

### 3.3 Página de Envío de Completion (mejorar `/submit`)

- Ya existe, pero añadir:
  - Vista previa del demon seleccionado (thumbnail, nombre)
  - Validación de URL de video (YouTube, Twitch, Vimeo)
  - Botón "Ver video" para previsualizar
  - Historial de submissions del usuario (ver estado de envíos anteriores)

### 3.4 Página de Detalle de Demon (mejorar `/demon/[id]`)

- Añadir sección de admin (si isStaff):
  - Botón "Editar nivel" → redirige a /admin con demon cargado
  - Botón "Ver submissions" → ver todas las submissions de este demon
- Añadir galería de imágenes si existe
- Añadir etiquetas/tags si existen

---

## Fase 4: Seguridad Backend

### 4.1 Políticas RLS

**Verificar existentes:**
- profiles: públicas para lectura, update propio o admin ✅
- demons: pública lectura, staff CRUD ✅
- submissions: lectura propia+aprobadas+staff, insert propio, update staff ✅
- moderation_logs: staff lectura, insert auto ✅

**Añadir/Mejorar:**
- `demons`: permitir soft delete solo a admin (update deleted_at)
- `demon_images`: 
  - select: público
  - insert/update/delete: solo staff
- `demon_edits`:
  - select/insert: solo staff
- `demon_tags`:
  - select: público
  - insert/update/delete: solo staff
- `completion_notes`:
  - select: staff ve todas, usuario ve las suyas
  - insert: propio usuario o staff

### 4.2 Funciones de Seguridad

- Asegurar que `is_staff()` es SECURITY DEFINER y solo staff puede ejecutar funciones de admin
- Añadir función `can_edit_demon(demon_id)` que verifique si el usuario puede editar ese demon
- Añadir función `get_user_submissions(user_id, status)` para consultas seguras

### 4.3 Validación de Input

- Cliente: validación básica en formularios (campos requeridos, formato URL, números)
- Backend: constraints en DB (ya existen checks en difficulty, status)
- Considerar añadir triggers para validar URLs de video antes de insert

---

## Fase 5: Diseño y UX

### 5.1 Estilos consistentes

- Usar mismos colores: `base-950/900/800/700/600`, `accent-red/purple`
- Mismas cards: `rounded-2xl border border-base-700/60 bg-base-900`
- Mismos inputs: `rounded-xl border border-base-700 bg-base-800 px-4 py-2.5`
- Mismos botones:
  - Primary: `bg-accent-gradient text-white shadow-glow`
  - Danger: `bg-accent-red text-white`
  - Success: `bg-emerald-600 text-white`
- Mismas animaciones: `animate-fade-in`, `hover:-translate-y-0.5 hover:shadow-glow`

### 5.2 Layout del panel de admin

- Header con título y breadcrumb
- Grid responsive:
  - Desktop: sidebar (lista demons) + main (formulario)
  - Mobile: tabs o stack vertical
- Modal para confirmaciones de eliminación
- Toast notifications para acciones (éxito/error)

### 5.3 Responsive

- Mobile-first approach
- Breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px)
- Tablas responsive: scroll horizontal en mobile
- Formularios: stack vertical en mobile, grid en desktop

---

## Fase 6: Testing y Validación

### 6.1 Pruebas manuales

- Verificar que usuarios normales no pueden acceder a /admin
- Verificar que moderators pueden acceder a /mod pero no a /admin
- Verificar que admins pueden acceder a ambos
- Verificar RLS: intentar INSERT/UPDATE/DELETE desde cliente sin permisos
- Verificar reordenamiento de niveles
- Verificar flujo completo de submission → aprobación → actualización de perfil
- Verificar subida de imágenes a Storage

### 6.2 Pruebas de seguridad

- Probar que un usuario no puede aprobar su propia submission
- Probar que un usuario no puede editar demons
- Probar que un moderator no puede acceder a /admin
- Verificar que las políticas RLS bloquean operaciones no autorizadas

---

## Orden de Implementación

1. **Actualizar schema.sql** (Fase 1)
2. **Crear componentes base** (Fase 2.1)
3. **Modificar Navbar y AuthProvider** (Fase 2.2)
4. **Implementar /admin** (Fase 3.1)
5. **Mejorar /mod** (Fase 3.2)
6. **Mejorar /submit** (Fase 3.3)
7. **Mejorar /demon/[id]** (Fase 3.4)
8. **Verificar seguridad RLS** (Fase 4)
9. **Ajustes de diseño y UX** (Fase 5)
10. **Testing** (Fase 6)

---

## Archivos a crear/modificar

### Nuevos
- `components/LevelForm.js`
- `components/SubmissionCard.js`
- `components/MediaUploader.js`
- `components/PositionInput.js`
- `components/ConfirmDialog.js`
- `app/admin/page.js`
- `app/admin/layout.js` (opcional)
- `lib/supabaseStorage.js` (para uploads)

### Modificar
- `supabase/schema.sql`
- `components/Navbar.js`
- `components/AuthProvider.js`
- `app/mod/page.js`
- `app/submit/page.js`
- `app/demon/[id]/page.js`
- `app/page.js` (opcional, añadir link a admin si es admin)
- `tailwind.config.js` (si necesitamos nuevos colores/componentes)

---

## Consideraciones

- **Storage**: Crear bucket `demon-images` en Supabase con políticas públicas de lectura
- **Imágenes**: Validar tipo y tamaño antes de upload
- **Reordenamiento**: Usar transacción SQL para evitar posiciones duplicadas
- **Paginación**: Implementar en /mod para no cargar todos los registros
- **Cache**: Considerar React Query o SWR para cache de datos (futuro)
- **Performance**: Lazy load de imágenes, optimizar consultas
