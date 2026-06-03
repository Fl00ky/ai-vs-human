-- Make upgrade/overclock return the full looter state, and include gear in the
-- overclock burst rate.

create or replace function agent_apply(p_uid uuid, p_seconds numeric)
returns json language plpgsql security definer set search_path = public as $$
declare a agents%rowtype; rate numeric; gained bigint; war bigint; gp int;
begin
  select * into a from agents where user_id = p_uid for update;
  gp := agent_gear_power(p_uid);
  rate := a.level * (1 + 0.5 * a.power) * (1 + 0.04 * gp);
  gained := floor(rate * p_seconds)::bigint;
  if gained < 0 then gained := 0; end if;

  a.shards := a.shards + gained;
  a.xp := a.xp + gained::int;
  while a.xp >= 100 * a.level loop
    a.xp := a.xp - 100 * a.level; a.level := a.level + 1;
  end loop;
  war := floor(gained * 0.2)::bigint;
  a.war_contributed := a.war_contributed + war;

  update agents set level = a.level, xp = a.xp, shards = a.shards,
                    war_contributed = a.war_contributed
   where user_id = p_uid;
  if war > 0 then
    update profiles set season_score = season_score + war, total_score = total_score + war
     where id = p_uid;
  end if;
  return json_build_object('gained', gained, 'war', war);
end; $$;

create or replace function agent_upgrade()
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); a agents%rowtype; cost bigint;
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  select * into a from agents where user_id = uid for update;
  if not found then return json_build_object('error','no_agent'); end if;
  cost := 50 * (a.power + 1) * (a.power + 1);
  if a.shards < cost then return json_build_object('error','insufficient','cost',cost); end if;
  update agents set shards = shards - cost, power = power + 1 where user_id = uid;
  return agent_full_state();
end; $$;

create or replace function agent_overclock()
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); a agents%rowtype;
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  select * into a from agents where user_id = uid for update;
  if not found then return json_build_object('error','no_agent'); end if;
  if extract(epoch from (now() - a.last_overclock)) < 300 then
    return json_build_object('error','cooldown',
      'ready_in', (300 - extract(epoch from (now() - a.last_overclock))::int));
  end if;
  perform agent_apply(uid, 60);
  update agents set last_overclock = now() where user_id = uid;
  return agent_full_state();
end; $$;
