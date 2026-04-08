# AI Background Removal

Frontend app for background removal with editing, batch processing, and downloadable export workflows.

## Real Database Setup (Feature #11)

This project now supports cloud history persistence using Supabase.

1. Create a Supabase project.
2. Run this SQL in the Supabase SQL editor:

```sql
create table if not exists public.image_history (
	id text primary key,
	owner_email text not null,
	created_at timestamptz not null default now(),
	original_name text not null,
	original_preview text not null,
	result_url text not null
);

create index if not exists image_history_owner_created_idx
	on public.image_history (owner_email, created_at desc);
```

3. Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

4. Restart the dev server.

If env vars are not provided, the app falls back to localStorage history automatically.
