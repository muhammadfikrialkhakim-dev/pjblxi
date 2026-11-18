import Link from "next/link";
import { BadgePercent, Gift, LogIn, Sparkles, Ticket, TicketPercent } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { promoStatus, type Promo } from "@/lib/promo";
import PromoCard from "@/components/PromoCard";
import ClaimPromoButton, { type ClaimState } from "@/components/ClaimPromoButton";
import ClaimCodeForm from "@/components/ClaimCodeForm";
import BannerBackground from "@/components/BannerBackground";
import { getPageBanners } from "@/lib/page-banners";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promo & Voucher — Explore Malang" };

type Claim = { id: string; promo_id: string; used_at: string | null; promo: Promo | null };

export default async function PromoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const banners = await getPageBanners();

  // RLS hanya mengizinkan pengunjung melihat promo yang aktif & sedang berlaku,
  // tapi staf melihat semuanya — jadi saring lagi di sini supaya halaman
  // publik tidak pernah menampilkan promo nonaktif/kedaluwarsa.
  const { data: promoRows } = await supabase
    .from("promos")
    .select("*, wisata:wisata(name, slug)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  const promos = ((promoRows ?? []) as unknown as Promo[]).filter((p) => promoStatus(p) === "active");

  // Voucher milik user (RLS: hanya miliknya). Promo yang sudah tidak aktif ikut
  // tersembunyi otomatis oleh RLS — memang tidak bisa dipakai lagi.
  let claims: Claim[] = [];
  if (user) {
    const { data } = await supabase
      .from("user_promos")
      .select("id, promo_id, used_at, promo:promos(*, wisata:wisata(name, slug))")
      .eq("user_id", user.id)
      .order("claimed_at", { ascending: false });
    claims = (data ?? []) as unknown as Claim[];
  }
  const claimByPromo = new Map(claims.map((c) => [c.promo_id, c]));

  // Sisa kuota: butuh menghitung klaim SEMUA user (tidak terlihat lewat RLS).
  const claimCounts = new Map<string, number>();
  const quotaIds = promos.filter((p) => p.claim_quota).map((p) => p.id);
  if (quotaIds.length) {
    try {
      const { data } = await createAdminClient().from("user_promos").select("promo_id").in("promo_id", quotaIds);
      (data ?? []).forEach((r: { promo_id: string }) => claimCounts.set(r.promo_id, (claimCounts.get(r.promo_id) ?? 0) + 1));
    } catch {
      // Tanpa service role key, sisa kuota tidak ditampilkan; server tetap menegakkan kuota saat klaim.
    }
  }
  const remainingOf = (p: Promo) =>
    p.claim_quota && claimCounts.size ? Math.max(0, p.claim_quota - (claimCounts.get(p.id) ?? 0)) : null;

  const myVouchers = claims.filter((c) => !c.used_at && c.promo && promoStatus(c.promo) === "active");
  const usedCount = claims.filter((c) => c.used_at).length;

  function stateFor(p: Promo): ClaimState {
    const c = claimByPromo.get(p.id);
    if (c) return c.used_at ? "used" : "claimed";
    if (!user) return "login";
    const rem = remainingOf(p);
    if (rem !== null && rem <= 0) return "soldout";
    return "claim";
  }

  const steps = [
    { icon: Gift, title: "Klaim promo", text: "Pilih promo di bawah atau masukkan kode, lalu klaim ke akun Anda." },
    { icon: Ticket, title: "Pesan tiket", text: "Pilih wisata, tanggal, dan jumlah tiket seperti biasa." },
    { icon: TicketPercent, title: "Pakai voucher", text: "Pilih voucher di halaman pemesanan — potongan langsung terhitung." },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-forest-700 via-forest-800 to-forest-900 pb-24 pt-10 text-white sm:pt-14">
        <div className="pointer-events-none absolute -right-16 -top-10 h-72 w-72 rounded-full bg-clay-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-forest-300/20 blur-3xl" />
        <BannerBackground image={banners.promo} />
        <div className="container-page relative grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-clay-200 ring-1 ring-white/15">
              <BadgePercent className="h-4 w-4" aria-hidden /> Promo &amp; Voucher
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
              Hemat untuk liburan Anda
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-forest-100/90 sm:text-lg">
              Klaim promo yang tersedia, lalu pakai saat memesan tiket. Voucher yang sudah diklaim muncul otomatis di
              halaman pemesanan.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15">
                <Sparkles className="h-4 w-4 text-clay-300" aria-hidden />
                <b className="font-semibold text-white">{promos.length}</b> promo aktif
              </span>
              {user && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15">
                  <Ticket className="h-4 w-4 text-clay-300" aria-hidden />
                  <b className="font-semibold text-white">{myVouchers.length}</b> voucher siap dipakai
                </span>
              )}
            </div>
          </div>

          {/* Klaim lewat kode */}
          <div className="rounded-2xl bg-white p-5 text-ink shadow-xl shadow-black/20 sm:p-6">
            {user ? (
              <ClaimCodeForm />
            ) : (
              <div className="text-center sm:text-left">
                <p className="font-display text-lg font-semibold text-forest-900">Masuk untuk mengklaim</p>
                <p className="mt-1 text-sm text-ink/65">
                  Anda perlu masuk dulu untuk mengklaim promo dan memakai voucher saat memesan.
                </p>
                <Link href="/login?redirectTo=/promo" className="btn-primary mt-4 w-full sm:w-auto">
                  <LogIn className="h-4 w-4" aria-hidden /> Masuk / Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container-page -mt-12 pb-14">
        {/* Cara pakai */}
        <ol className="relative z-10 grid gap-3 sm:grid-cols-3">
          {steps.map((st, i) => (
            <li key={st.title} className="flex gap-3.5 rounded-xl border border-forest-100 bg-white p-4 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-clay-50 text-clay-600">
                <st.icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-forest-900">
                  <span className="mr-1.5 text-clay-500">{i + 1}.</span>
                  {st.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink/60">{st.text}</p>
              </div>
            </li>
          ))}
        </ol>

        {user && (
          <section className="mt-12" aria-labelledby="voucher-saya">
            <div className="flex items-center gap-2.5">
              <h2 id="voucher-saya" className="font-display text-2xl font-semibold text-forest-900">
                Voucher Saya
              </h2>
              {myVouchers.length > 0 && (
                <span className="rounded-full bg-forest-100 px-2.5 py-0.5 text-xs font-semibold text-forest-800">
                  {myVouchers.length}
                </span>
              )}
            </div>
            {myVouchers.length ? (
              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                {myVouchers.map((c) => (
                  <PromoCard
                    key={c.id}
                    promo={c.promo as Promo}
                    action={
                      <Link href="/destinations" className="btn-primary px-4 py-2 text-sm">
                        Pakai sekarang
                      </Link>
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-forest-200 bg-white/70 px-4 py-10 text-center">
                <Ticket className="mx-auto h-8 w-8 text-forest-300" aria-hidden />
                <p className="mt-2 text-sm font-medium text-forest-900">Belum ada voucher yang bisa dipakai</p>
                <p className="mt-0.5 text-sm text-ink/55">Klaim promo di bawah ini untuk mulai berhemat.</p>
              </div>
            )}
            {usedCount > 0 && <p className="mt-3 text-xs text-ink/50">{usedCount} voucher lain sudah dipakai.</p>}
          </section>
        )}

        <section className="mt-12" aria-labelledby="promo-tersedia">
          <div className="flex items-center gap-2.5">
            <h2 id="promo-tersedia" className="font-display text-2xl font-semibold text-forest-900">
              Promo Tersedia
            </h2>
            {promos.length > 0 && (
              <span className="rounded-full bg-clay-50 px-2.5 py-0.5 text-xs font-semibold text-clay-700">{promos.length}</span>
            )}
          </div>
          {promos.length ? (
            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              {promos.map((p) => {
                const state = stateFor(p);
                return (
                  <PromoCard
                    key={p.id}
                    promo={p}
                    remaining={remainingOf(p)}
                    dimmed={state === "soldout" || state === "used"}
                    action={<ClaimPromoButton promoId={p.id} state={state} />}
                  />
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-forest-200 bg-white/70 px-4 py-14 text-center">
              <BadgePercent className="mx-auto h-9 w-9 text-forest-300" aria-hidden />
              <p className="mt-2 text-sm font-medium text-forest-900">Belum ada promo yang sedang berlangsung</p>
              <p className="mt-0.5 text-sm text-ink/55">Cek lagi nanti ya, promo baru sering hadir!</p>
              <Link href="/destinations" className="btn-secondary mt-5">
                Jelajahi destinasi
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
