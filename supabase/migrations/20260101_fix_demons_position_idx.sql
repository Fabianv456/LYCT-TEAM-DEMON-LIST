-- Migración: soluciona duplicate key al reordenar demonios
drop index if exists public.demons_position_idx;

create index if not exists demons_position_idx on public.demons(position);

create or replace function public.reorder_demons(from_position int, to_position int)
returns void
language plpgsql
security definer
as $$
begin
  if from_position = to_position then
    return;
  end if;

  if from_position < to_position then
    update public.demons
    set position = -position
    where position = from_position;

    update public.demons
    set position = position - 1
    where position > from_position and position <= to_position;

    update public.demons
    set position = to_position
    where position = -from_position;
  else
    update public.demons
    set position = -position
    where position = from_position;

    update public.demons
    set position = position + 1
    where position >= to_position and position < from_position;

    update public.demons
    set position = to_position
    where position = -from_position;
  end if;
end;
$$;

revoke all on function public.reorder_demons(int, int) from public, anon, authenticated;
grant execute on function public.reorder_demons(int, int) to authenticated;
