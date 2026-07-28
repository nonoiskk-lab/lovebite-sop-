-- Pin the trigger function's search_path (addresses the database linter's
-- "function_search_path_mutable" warning). The function only touches NEW, so an
-- empty search_path is safe.
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
