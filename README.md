# Extreme Demons List

Web comunitaria de Extreme Demons de Geometry Dash, inspirada en AREDL. Hecha con **Next.js 14 (App Router)** + **Supabase** (auth, base de datos y Row Level Security).

## Flujo principal implementado

```
Lista de Extreme Demons → Login → Enviar completion → Moderador revisa → Aprobar/Rechazar → Completion aparece en el perfil
```

## 1. Crear el proyecto en Supabase

1. Ve a https://supabase.com y crea un proyecto nuevo (gratis).
2. Abre **SQL Editor** → pega **todo** el contenido de `supabase/schema.sql` → Run.
   - Esto crea las tablas `profiles`, `demons`, `submissions`, `moderation_logs`, la vista `completions`,
     los triggers automáticos y todas las políticas de **Row Level Security**.
   - Incluye 3 demons de ejemplo al final; puedes borrar ese bloque si no los quieres.
3. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public key`

## 2. Configurar el proyecto localmente

```bash
npm install
cp .env.example .env.local
```

Rellena `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

```bash
npm run dev
```

Abre http://localhost:3000

## 3. Convertir un usuario en moderador o admin

Por defecto, todo el que se registra tiene el rol `user`. Para dar permisos de moderador/admin,
en el **SQL Editor** de Supabase ejecuta:

```sql
update public.profiles set role = 'moderator' where username = 'nombre_del_usuario';
-- o
update public.profiles set role = 'admin' where username = 'nombre_del_usuario';
```

Los moderadores y admins verán la pestaña "Moderación" en la barra de navegación y podrán entrar a `/mod`.

## 4. Añadir / editar demons de la lista

Ahora mismo no hay un panel visual para gestionar demons (a propósito, para mantener el proyecto pequeño),
se hace directamente desde SQL Editor o desde la tabla `demons` en el **Table Editor** de Supabase:

```sql
insert into public.demons (position, name, creator, level_id, difficulty, thumbnail_url)
values (4, 'Nombre del nivel', 'Creador', '123456789', 'Extreme Demon', 'https://url-de-la-imagen.jpg');
```

Puedes editar la posición de cualquier demon (por ejemplo si insertas uno nuevo en medio de la lista y
quieres reordenar) actualizando el campo `position` de los demons afectados.

> Nota sobre la API de AREDL: la API pública de AREDL (`api.aredl.net`) no permite uso libre/comercial
> ni redistribución directa de sus miniaturas fuera de su propia web, así que aquí se usa un campo
> `thumbnail_url` genérico que tú rellenas con la imagen que quieras (por ejemplo, una captura del nivel
> o la miniatura oficial de GDBrowser: `https://gdbrowser.com/api/level/thumbnail/<ID>`, que sí es de uso
> público). Así evitas problemas de licencias y mantienes control total sobre la lista.

## 5. Seguridad (Row Level Security)

- Cualquiera puede leer la lista de demons y las completions **aprobadas**.
- Un usuario solo puede crear submissions a su propio nombre y solo puede ver las suyas (además de las
  aprobadas de todos, que son públicas).
- **Ningún usuario puede aprobar/rechazar su propia submission**: la política de `update` exige
  `role in ('moderator','admin') AND user_id <> auth.uid()`.
- Al aprobar/rechazar, un trigger guarda automáticamente el registro en `moderation_logs`.

## 6. Estructura del proyecto

```
app/
  page.js                  → Lista principal (buscador + filtros)
  demon/[id]/page.js       → Detalle de un demon + jugadores que lo completaron
  login/page.js            → Login
  register/page.js         → Registro
  submit/page.js           → Formulario de envío de completion
  mod/page.js              → Panel de moderación (solo staff)
  profile/[username]/page.js → Perfil público de un jugador
components/
  AuthProvider.js          → Contexto global de sesión/perfil/rol
  Navbar.js
  DemonCard.js
lib/
  supabaseClient.js        → Cliente de Supabase para el navegador
supabase/
  schema.sql               → Esquema completo + RLS (pégalo en Supabase)
```

## 7. Desplegar

Funciona directo en **Vercel**: importa el repo, añade las mismas variables de entorno
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en el dashboard de Vercel, y deploy.

## Diseño

Dark mode con acentos rojo/morado en degradado, cards para cada demon, animaciones sutiles de
entrada (`fadeInUp`) y hover, y totalmente responsive (mobile/desktop).
