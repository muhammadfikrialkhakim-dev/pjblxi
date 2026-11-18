-- ============================================================
-- Super Admin permanen: role tidak bisa diturunkan & akun tidak bisa dihapus
-- Jalankan di Supabase SQL Editor.
-- ============================================================

create or replace function public.protect_super_admin()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    if old.role = 'super_admin' then
      raise exception 'Super Admin bersifat permanen dan tidak dapat dihapus.';
    end if;
    return old;
  end if;

  -- UPDATE: tolak jika role super_admin diubah menjadi role lain
  if old.role = 'super_admin' and new.role is distinct from old.role then
    raise exception 'Role Super Admin bersifat permanen dan tidak dapat diubah.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_super_admin on public.profiles;
create trigger trg_protect_super_admin
  before update or delete on public.profiles
  for each row execute function public.protect_super_admin();
