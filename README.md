# AI Background Removal

Frontend app for background removal with editing, batch processing, and downloadable export workflows.

## Developer API Endpoints (Feature #12)

Serverless endpoints are available under `/api/v1` for external integrations.

### `GET /api/v1/health`

Returns API uptime metadata.

Example response:

```json
{
	"status": "ok",
	"service": "snap-background-api",
	"timestamp": "2026-04-08T12:34:56.000Z"
}
```

### `POST /api/v1/remove-background`

Forwards binary image input to background-removal pipeline.

Headers:
- `Content-Type`: image mime type (e.g. `image/png`)
- `X-File-Name`: optional original filename
- `x-api-key`: optional, required only when `API_SECRET_KEY` is configured

Body:
- Raw binary image bytes

Example with curl:

```bash
curl -X POST "https://YOUR_DOMAIN/api/v1/remove-background" \
	-H "Content-Type: image/png" \
	-H "X-File-Name: product.png" \
	--data-binary "@./product.png"
```

### `GET /api/v1/history?ownerEmail=...&limit=30`

Fetches persisted history rows for a user.

### `POST /api/v1/history`

Replaces all history rows for a user.

Payload:

```json
{
	"ownerEmail": "user@example.com",
	"items": [
		{
			"id": "uuid",
			"createdAt": "2026-04-08T12:00:00.000Z",
			"originalName": "photo.png",
			"originalPreview": "data:image/png;base64,...",
			"resultUrl": "https://..."
		}
	]
}
```

### `DELETE /api/v1/history?ownerEmail=...`

Clears all history rows for a user.

### `POST /api/v1/notify`

Sends completion emails for processing workflows.

Payload:

```json
{
	"to": "user@example.com",
	"subject": "Background Removed Successfully",
	"message": "Your image is ready to download."
}
```

### `POST /api/v1/suggestions`

Returns AI-powered editing suggestions based on file metadata.

Payload:

```json
{
	"fileName": "portrait-session.jpg",
	"width": 1080,
	"height": 1350
}
```

Example response:

```json
{
	"success": true,
	"suggestion": {
		"title": "Portrait Highlight",
		"reason": "Detected portrait/headshot naming.",
		"exportFormat": "png",
		"socialPresetKey": "instagram-story",
		"watermarkEnabled": false,
		"watermarkText": "SnapBackground Enterprise",
		"filters": {
			"blur": 0,
			"brightness": 106,
			"contrast": 104,
			"saturation": 110,
			"hueRotate": 0,
			"opacity": 100
		}
	}
}
```

### API Environment Variables

- `REMOVE_BG_WEBHOOK_URL`: Optional override for the remove-background webhook.
- `API_SECRET_KEY`: Optional API key required in `x-api-key` header.
- `API_ALLOWED_ORIGIN`: Optional CORS allow-origin value (defaults to `*`).
- `EMAIL_PROVIDER_WEBHOOK_URL`: Optional webhook for custom email provider.
- `RESEND_API_KEY`: Used when webhook is not configured.
- `EMAIL_FROM`: Sender email for Resend mode (e.g. `SnapBackground <noreply@yourdomain.com>`).
- `SUPABASE_URL` or `VITE_SUPABASE_URL`: Supabase project URL.
- `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY`: Supabase anon key.

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
