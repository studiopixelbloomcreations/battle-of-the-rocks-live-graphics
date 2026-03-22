# Battle Of The Rocks Live Graphics

Professional cricket broadcast graphics package with:

- Live score bug
- Match intro
- Player cards
- Lower thirds
- Win predictor
- Triggered `4`, `6`, and `Wicket` animations
- Team instance switching for `Maliyadeva College` and `St Anne's College`
- Supabase-ready cross-device sync

## Project Structure

```text
server/                 Node + WebSocket backend
public/                 Frontend files for control + overlay
public/control.html     Control UI
public/overlay.html     Graphics output
public/config.js        Runtime config
public/js/sync.js       Shared sync layer
supabase/setup.sql      Supabase database/storage setup
netlify.toml            Netlify config
vercel.json             Vercel config
render.yaml             Render config
railway.json            Railway config
```

## Local Install

1. Extract the ZIP.
2. Open the project folder in Terminal / PowerShell.
3. Run:

```bash
npm install
npm start
```

4. Open:

- Control UI: `http://localhost:3000/control.html`
- Overlay: `http://localhost:3000/overlay.html`

## If npm Fails

Try:

```bash
npm cache clean --force
npm install
```

If that still fails:

```bash
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

If `npm` is not recognized, install Node.js first:

- https://nodejs.org/

## GitHub Push

Repository:

`https://github.com/studiopixelbloomcreations/battle-of-the-rocks-live-graphics`

If Git shows `dubious ownership`, run:

```bash
git config --global --add safe.directory C:/Users/thenu/Downloads/IPL
```

Then push:

```bash
git add .
git commit -m "Initial commit"
git remote remove origin
git remote add origin https://github.com/studiopixelbloomcreations/battle-of-the-rocks-live-graphics.git
git push -u origin main
```

If `origin` does not exist yet, skip `git remote remove origin`.

## Supabase Setup

This project can use Supabase for:

- cross-device live sync
- shared graphics state
- image uploads

### 1. Open SQL Editor

Run the full file:

- `supabase/setup.sql`

That creates:

- `public.graphic_state`
- public read/write policies
- realtime publication
- `graphics-assets` storage bucket
- storage policies

### 2. Supabase Config

Frontend config lives in:

- `public/config.js`

Current values already point to your Supabase project.

### 3. Verify Setup

Run these queries in Supabase:

```sql
select * from public.graphic_state;
```

```sql
select * 
from pg_publication_tables 
where pubname = 'supabase_realtime' 
and tablename = 'graphic_state';
```

```sql
select * from storage.buckets where id = 'graphics-assets';
```

Expected:

- first query: one row with `id = 'main'`
- second query: one row
- third query: one row

## Deployment Options

### Vercel

Frontend-ready.

Files already added:

- `vercel.json`

### Netlify

Frontend-ready.

Files already added:

- `netlify.toml`

### Render

Backend-ready.

Files already added:

- `render.yaml`

### Railway

Prepared as fallback.

Files already added:

- `railway.json`

## Runtime Modes

The app now supports:

1. Local Node/WebSocket mode
2. Static browser sync mode
3. Supabase mode

If Supabase config is present, the frontend can use Supabase directly for realtime state and uploads.

## Notes

- Team instances are fixed to `Maliyadeva College` and `St Anne's College`
- Instance switching updates names, colors, and logos together
- Score bug, predictor, and event animations are already customized
