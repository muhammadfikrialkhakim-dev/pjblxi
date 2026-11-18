-- ============================================================
-- PERBAIKAN KEAMANAN: cegah user mengubah role-nya sendiri.
--
-- Policy "Profiles: user updates own" mengizinkan user mengupdate baris
-- profilnya sendiri tanpa batasan kolom, jadi lewat anon key di browser
-- siapa pun bisa menjalankan: update profiles set role = 'super_admin'.
-- Trigger ini menolak perubahan kolom role kecuali oleh Super Admin atau
-- koneksi service role / SQL Editor (auth.uid() null).
-- Jalankan di Supabase SQL Editor.
-- ============================================================

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null and not public.is_super_admin() then
      raise exception 'Anda tidak berhak mengubah role akun.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_escalation on public.profiles;
create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();
