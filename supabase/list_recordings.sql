-- Listing function deployed by include_vivienne_in_student_recordings.
-- Keep audio access behind the existing per-recording policies.
create or replace function recordings_site_private.list_recordings()
returns table(name text, start_time_pacific timestamp without time zone, playback_url text)
language sql stable security definer
set search_path = ''
as $function$
  select r.name, r.start_time_pacific, r.playback_url
  from (
    select id, name, start_time_pacific, playback_url from public.brady_torah_passage_recordings_v1
    union all
    select id, name, start_time_pacific, playback_url from public.vivienne_torah_passage_recordings_v1
  ) r
  order by r.start_time_pacific desc nulls last, r.id
$function$;
