create table if not exists public.graphic_state (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.graphic_state (id, state)
values (
  'main',
  '{
    "matchType": "T20",
    "venue": "Wankhede Stadium",
    "battingTeam": {
      "name": "Maliyadeva College",
      "shortName": "MCC",
      "color": "#d61f2c",
      "logoUrl": ""
    },
    "bowlingTeam": {
      "name": "St Anne''s College",
      "shortName": "SAC",
      "color": "#17a34a",
      "logoUrl": ""
    },
    "winPredictor": {
      "team1": 68,
      "team2": 32,
      "label": "Win Predictor",
      "team1GradientColors": ["#7a0710", "#d61f2c", "#ff9a7a"],
      "team2GradientColors": ["#0f5a2a", "#17a34a", "#9af0b0"]
    }
  }'::jsonb
)
on conflict (id) do nothing;

alter table public.graphic_state enable row level security;

drop policy if exists "public read graphic_state" on public.graphic_state;
create policy "public read graphic_state"
on public.graphic_state
for select
to anon
using (true);

drop policy if exists "public update graphic_state" on public.graphic_state;
create policy "public update graphic_state"
on public.graphic_state
for update
to anon
using (true)
with check (true);

drop policy if exists "public insert graphic_state" on public.graphic_state;
create policy "public insert graphic_state"
on public.graphic_state
for insert
to anon
with check (true);

alter publication supabase_realtime add table public.graphic_state;

insert into storage.buckets (id, name, public)
values ('graphics-assets', 'graphics-assets', true)
on conflict (id) do nothing;

drop policy if exists "public read graphics assets" on storage.objects;
create policy "public read graphics assets"
on storage.objects
for select
to public
using (bucket_id = 'graphics-assets');

drop policy if exists "public upload graphics assets" on storage.objects;
create policy "public upload graphics assets"
on storage.objects
for insert
to public
with check (bucket_id = 'graphics-assets');

drop policy if exists "public update graphics assets" on storage.objects;
create policy "public update graphics assets"
on storage.objects
for update
to public
using (bucket_id = 'graphics-assets')
with check (bucket_id = 'graphics-assets');
