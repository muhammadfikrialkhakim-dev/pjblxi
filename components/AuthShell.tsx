import Image from "next/image";
import { Compass, Heart, ShieldCheck, Ticket } from "lucide-react";

/**
 * Kerangka halaman Masuk & Daftar: kartu besar terpusat di atas latar lembut.
 * Kiri = panel brand bergaya pegunungan (disembunyikan di layar kecil),
 * kanan = form.
 */
export default function AuthShell({
  panelImage,
  title,
  subtitle,
  children,
  footer,
}: {
  /** Foto panel kiri dari Pengaturan Situs (Super Admin). Kosong = ilustrasi pegunungan. */
  panelImage?: string | null;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const perks = [
    { Icon: Ticket, title: "Pesan cepat", text: "Tiket wisata Malang Raya dalam hitungan menit" },
    { Icon: ShieldCheck, title: "Pembayaran aman", text: "E-tiket langsung tersedia di akun Anda" },
    { Icon: Heart, title: "Wishlist", text: "Simpan wisata favorit untuk nanti" },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Latar lembut dengan dua bercak warna */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-clay-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-forest-200/50 blur-3xl" />

      <div className="container-page relative flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-forest-900/10 ring-1 ring-forest-100 md:grid-cols-[1.05fr_1fr]">
          {/* Panel brand */}
          <aside className="relative hidden min-h-[600px] flex-col overflow-hidden bg-gradient-to-b from-forest-950 via-forest-900 to-forest-800 p-10 text-white md:flex">
            {panelImage ? (
              <>
                <Image src={panelImage} alt="" fill priority sizes="(min-width: 768px) 50vw, 0px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-forest-950/55 to-forest-950/75" />
              </>
            ) : (
              <>
                <div className="pointer-events-none absolute bottom-28 right-12 h-36 w-36 rounded-full bg-clay-400/30 blur-2xl" />
                <div className="pointer-events-none absolute bottom-32 right-[4.5rem] h-14 w-14 rounded-full bg-clay-300/80 blur-[2px]" />
              </>
            )}

            <div className="relative flex items-center gap-2 font-display text-lg font-semibold">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <Compass className="h-5 w-5 text-clay-300" strokeWidth={2.2} />
              </span>
              Explore Malang
            </div>

            <div className="relative mt-12">
              <h2 className="font-display text-4xl font-semibold leading-tight">
                Jelajahi pesona <span className="text-clay-300">Malang Raya</span>
              </h2>
              <p className="mt-3 max-w-sm text-sm text-forest-100/80">
                Satu akun untuk memesan tiket wisata, memantau pesanan, dan menyimpan destinasi favorit.
              </p>
              <ul className="mt-8 space-y-3">
                {perks.map(({ Icon, title, text }) => (
                  <li
                    key={title}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-clay-500/90">
                      <Icon className="h-5 w-5 text-white" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="text-xs text-forest-100/75">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Siluet pegunungan di dasar panel */}
            {!panelImage && (
            <svg
              className="pointer-events-none absolute inset-x-0 bottom-0 w-full"
              viewBox="0 0 600 160"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M0 160V90l70-45 60 38 80-62 90 70 70-40 90 55 70-35 70 42v87z" fill="#265336" fillOpacity="0.55" />
              <path d="M0 160v-45l60-30 70 40 90-55 80 60 80-45 90 50 130-45v125z" fill="#1a3624" fillOpacity="0.9" />
              <path d="M0 160v-20l80-25 90 28 100-35 90 30 110-25 130 22v25z" fill="#0d1e13" />
            </svg>
            )}
          </aside>

          {/* Form */}
          <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
            <div className="mb-6 flex items-center gap-2 font-display text-base font-semibold text-forest-900 md:hidden">
              <Compass className="h-5 w-5 text-clay-500" strokeWidth={2.2} /> Explore Malang
            </div>
            <h1 className="font-display text-3xl font-semibold text-forest-900">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">{subtitle}</p>
            <div className="mt-7">{children}</div>
            <p className="mt-7 text-center text-sm text-ink/60">{footer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
