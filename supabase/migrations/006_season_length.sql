-- Season length: 7 days -> 3 months.

-- 1. Stretch the currently active season.
update seasons
   set ends_at = started_at + interval '3 months'
 where status = 'active';

-- 2. Redefine rollover so every future season lasts 3 months.
create or replace function get_season_state()
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  uid          uuid := auth.uid();
  s            seasons%rowtype;
  ai_total     int;
  human_total  int;
  win          team_side;
  last_row     seasons%rowtype;
  my_wins      int := 0;
begin
  perform pg_advisory_xact_lock(948271);

  select * into s from seasons where status = 'active' order by number desc limit 1;

  if not found then
    insert into seasons (number, started_at, ends_at, status)
    values (coalesce((select max(number) from seasons), 0) + 1, now(), now() + interval '3 months', 'active')
    returning * into s;
  end if;

  if s.ends_at <= now() then
    select coalesce(sum(season_score) filter (where side = 'ai'), 0),
           coalesce(sum(season_score) filter (where side = 'human'), 0)
      into ai_total, human_total
      from profiles;

    win := case
             when ai_total > human_total then 'ai'::team_side
             when human_total > ai_total then 'human'::team_side
             else null
           end;

    update seasons
       set status = 'ended', winner = win, ai_score = ai_total, human_score = human_total
     where id = s.id;

    if win is not null then
      insert into season_wins (user_id, season_id, side)
        select id, s.id, win from profiles where side = win and season_score > 0
        on conflict do nothing;
    end if;

    update profiles set season_score = 0;

    insert into seasons (number, started_at, ends_at, status)
    values (s.number + 1, now(), now() + interval '3 months', 'active')
    returning * into s;
  end if;

  select coalesce(sum(season_score) filter (where side = 'ai'), 0),
         coalesce(sum(season_score) filter (where side = 'human'), 0)
    into ai_total, human_total
    from profiles;

  select * into last_row from seasons where status = 'ended' order by number desc limit 1;

  if uid is not null then
    select count(*) into my_wins from season_wins where user_id = uid;
  end if;

  return json_build_object(
    'number',      s.number,
    'started_at',  s.started_at,
    'ends_at',     s.ends_at,
    'ai_score',    ai_total,
    'human_score', human_total,
    'my_wins',     my_wins,
    'last', case when last_row.id is null then null else json_build_object(
      'number',      last_row.number,
      'winner',      last_row.winner,
      'ai_score',    last_row.ai_score,
      'human_score', last_row.human_score
    ) end
  );
end;
$$;

grant execute on function get_season_state() to authenticated, anon;
