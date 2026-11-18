import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, CheckCircle2, ChevronRight, BadgeCheck, Ticket, Zap, Clock, Phone, Sun, Lightbulb, Navigation, Timer, Star, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Wisata, Tiket, Ulasan, lowestPrice, averageRating, formatIDR } from "@/lib/types";
import TiketPicker from "@/components/TiketPicker";
import StarRating from "@/components/StarRating";
import ReviewForm from "@/components/ReviewForm";
import WishlistButton from "@/components/WishlistButton";
import ReviewReactions from "@/components/ReviewReactions";
import ReviewReplies from "@/components/ReviewReplies";
import ImageCarousel from "@/components/ImageCarousel";
import DetailTabs from "@/components/DetailTabs";
import TrendingBadge from "@/components/TrendingBadge";
import ExpandableText from "@/components/ExpandableText";
import ReviewList, { type ReviewListItem } from "@/components/ReviewList";
import { getLocale } from "@/lib/i18n/locale";
import { translateCategoryName } from "@/lib/i18n/dictionary";

export const revalidate = 60;

export default async function WisataDetailPage({ params }: { params: { slug: string } }) {
  const locale = getLocale();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: wisata } = await supabase
    .from("wisata")
    .select("*, tiket(*), category:categories(name, slug)")
    .eq("slug", params.slug)
    .single();

  if (!wisata) notFound();

  const w = wisata as Wisata;
  const tiketList = (w.tiket ?? []).filter((t) => t.is_active) as Tiket[];
  const fromPrice = lowestPrice(tiketList);

  const { data: ulasanList } = await supabase
    .from("ulasan")
    .select("*, profiles(full_name)")
    .eq("wisata_id", w.id)
    .order("created_at", { ascending: false });

  const reviews = (ulasanList ?? []) as Ulasan[];

  // Reaksi jempol baik/buruk per ulasan.
  const { data: reaksiRows } = reviews.length
    ? await supabase.from("ulasan_reaksi").select("ulasan_id, user_id, value").in("ulasan_id", reviews.map((r) => r.id))
    : { data: [] as { ulasan_id: string; user_id: string; value: number }[] };
  // Balasan ulasan (+ nama & peran penulis, untuk lencana "Pengelola").
  const { data: balasanRows } = reviews.length
    ? await supabase
        .from("ulasan_balasan")
        .select("id, ulasan_id, user_id, komentar, created_at, profiles(full_name, role)")
        .in("ulasan_id", reviews.map((r) => r.id))
        .order("created_at", { ascending: true })
    : { data: [] };

  // Nama penulis ulasan & balasan. Tabel profiles dilindungi RLS (pengguna
  // hanya boleh membaca profilnya sendiri), jadi join `profiles(full_name)`
  // di atas kosong untuk ulasan milik ORANG LAIN — akibatnya semua tampil
  // sebagai "Pengunjung". Nama dibaca lewat client service-role di server,
  // dan HANYA kolom id, full_name & role yang diambil (nomor telepon, kota,
  // dsb. tidak ikut terbaca/terkirim ke browser).
  const authorIds = Array.from(
    new Set([
      ...reviews.map((r) => r.customer_id),
      ...((balasanRows ?? []) as { user_id: string }[]).map((b) => b.user_id),
    ].filter(Boolean))
  );
  const authorMap = new Map<string, { full_name: string | null; role: string | null }>();
  if (authorIds.length) {
    try {
      const { data: authors } = await createAdminClient().from("profiles").select("id, full_name, role").in("id", authorIds);
      for (const a of authors ?? []) authorMap.set(a.id, { full_name: a.full_name, role: a.role });
    } catch {
      // SUPABASE_SERVICE_ROLE_KEY belum diset — pakai hasil join bawaan (nama sendiri saja).
    }
  }
  for (const r of reviews) {
    const a = authorMap.get(r.customer_id);
    if (a) r.profiles = { full_name: a.full_name };
  }

  let viewerIsAdmin = false;
  if (user) {
    const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    viewerIsAdmin = me?.role === "super_admin" || me?.role === "admin";
  }
  const repliesFor = (id: string) =>
    ((balasanRows ?? []) as any[])
      .filter((b) => b.ulasan_id === id)
      .map((b) => {
        const prof = authorMap.get(b.user_id) ?? (Array.isArray(b.profiles) ? b.profiles[0] : b.profiles);
        return {
          id: b.id as string,
          komentar: b.komentar as string,
          created_at: b.created_at as string,
          authorName: (prof?.full_name as string) ?? "Pengunjung",
          isStaff: prof?.role === "admin_wisata" || prof?.role === "super_admin" || prof?.role === "admin",
          canDelete: !!user && (b.user_id === user.id || viewerIsAdmin),
        };
      });
  const reactionsFor = (id: string) => {
    const rows = (reaksiRows ?? []).filter((x) => x.ulasan_id === id);
    return {
      likes: rows.filter((x) => x.value === 1).length,
      dislikes: rows.filter((x) => x.value === -1).length,
      mine: (user ? ((rows.find((x) => x.user_id === user.id)?.value ?? 0) as 1 | -1 | 0) : 0),
    };
  };
  const avgRating = averageRating(reviews);
  // Verified purchase: user sudah punya pesanan LUNAS untuk wisata ini.
  let hasPurchased = false;
  let isWishlisted = false;
  if (user) {
    const tiketIds = (w.tiket ?? []).map((t) => t.id);
    if (tiketIds.length) {
      const { data: paid } = await supabase
        .from("orders")
        .select("id")
        .eq("customer_id", user.id)
        .eq("payment_status", "paid")
        .in("tiket_id", tiketIds)
        .limit(1);
      hasPurchased = !!paid?.length;
    }
    const { data: wl } = await supabase
      .from("wishlist")
      .select("id")
      .eq("customer_id", user.id)
      .eq("wisata_id", w.id)
      .maybeSingle();
    isWishlisted = !!wl;
  }
  const myReview = user ? reviews.find((r) => r.customer_id === user.id) ?? null : null;

  // Gabungkan cover + galeri, buang yang kosong/duplikat, maksimal 6 foto.
  const images = Array.from(
    new Set([w.cover_image_url, ...(w.gallery_urls ?? [])].filter(Boolean) as string[])
  ).slice(0, 6);

  const distribution = [5, 4, 3, 2, 1].map((n) => ({
    star: n,
    count: reviews.filter((r) => r.rating === n).length,
  }));
  const initialsOf = (name?: string | null) =>
    (name ?? "P")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0]?.toUpperCase())
      .join("") || "P";

  const reviewItems: ReviewListItem[] = reviews.map((r) => {
    const rx = reactionsFor(r.id);
    return {
      id: r.id,
      rating: r.rating,
      hasComment: !!r.komentar,
      verified: !!r.is_verified_purchase,
      ts: new Date(r.created_at).getTime(),
      node: (
        <article className="rounded-2xl border border-forest-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-100 text-sm font-bold text-forest-800">
                {initialsOf(r.profiles?.full_name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold text-forest-900">{r.profiles?.full_name ?? "Pengunjung"}</p>
                <p className="text-xs text-ink/45">
                  {new Date(r.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-clay-50 px-2.5 py-1 text-xs font-semibold text-clay-700">
              <Star className="h-3.5 w-3.5 fill-clay-500 text-clay-500" /> {r.rating},0 / 5
            </span>
          </div>

          {r.is_verified_purchase && (
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-forest-100 px-2.5 py-0.5 text-[11px] font-semibold text-forest-800">
              <BadgeCheck className="h-3.5 w-3.5" /> Pembelian terverifikasi
            </span>
          )}

          {r.komentar ? (
            <p className="mt-3 text-[15px] leading-relaxed text-ink/80">{r.komentar}</p>
          ) : (
            <p className="mt-3 text-sm italic text-ink/40">Pengunjung ini tidak menulis komentar.</p>
          )}

          <ReviewReactions ulasanId={r.id} wisataSlug={w.slug} likes={rx.likes} dislikes={rx.dislikes} myReaction={rx.mine} />
          <ReviewReplies ulasanId={r.id} wisataSlug={w.slug} isLoggedIn={!!user} replies={repliesFor(r.id)} />
        </article>
      ),
    };
  });

  const ratingWord = (v: number) => (v >= 4.5 ? "Luar biasa" : v >= 4 ? "Sangat baik" : v >= 3 ? "Baik" : "Cukup");
  const mapsUrl =
    w.latitude && w.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${w.latitude},${w.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${w.name} ${w.location ?? ""}`)}`;
  const categoryLabel = w.category ? translateCategoryName(w.category.name, w.category.slug, locale) : null;

  const tabs = [
    { id: "ikhtisar", label: "Ikhtisar" },
    { id: "tiket", label: "Tiket" },
    { id: "lokasi", label: "Lokasi" },
    ...(w.facilities?.length ? [{ id: "fasilitas", label: "Fasilitas" }] : []),
    { id: "ulasan", label: "Ulasan" },
  ];

  const infoRows = [
    w.opening_hours && { Icon: Clock, label: "Jam Operasional", value: w.opening_hours },
    w.estimated_duration && { Icon: Timer, label: "Estimasi Durasi", value: w.estimated_duration },
    w.best_time_to_visit && { Icon: Sun, label: "Waktu Terbaik", value: w.best_time_to_visit },
    w.age_restriction && { Icon: Users, label: "Batasan Umur", value: w.age_restriction },
  ].filter(Boolean) as { Icon: typeof Clock; label: string; value: string }[];

  return (
    <div>
      <div className="container-page pt-4">
        {/* Galeri foto — slideshow interaktif */}
        {images.length > 0 && <ImageCarousel images={images} alt={w.name} />}
      </div>

      {/* Tab menempel + aksi (salin tautan, simpan, ke atas) */}
      {/* Harus anak langsung dari pembungkus halaman supaya sticky bertahan selama halaman di-scroll */}
      <DetailTabs
        tabs={tabs}
        saveLabel="Simpan"
        saveSlot={<WishlistButton wisataId={w.id} wisataSlug={w.slug} initial={isWishlisted} />}
      />

      <div className="container-page py-8">
        {/* Ikhtisar: judul, rating, harga */}
        <section id="ikhtisar" className="scroll-mt-32">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-semibold text-forest-900 sm:text-4xl">{w.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                {categoryLabel && (
                  <span className="rounded-full bg-forest-100 px-3 py-1 text-xs font-semibold text-forest-800">
                    {categoryLabel}
                  </span>
                )}
                {avgRating !== null && (
                  <span className="flex items-center gap-1.5">
                    <StarRating value={avgRating} size={16} />
                    <span className="text-sm font-semibold text-forest-900">{avgRating.toFixed(1)}</span>
                  </span>
                )}
                {w.is_trending && <TrendingBadge label="Trending" variant="inline" />}
              </div>
              {w.location && (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-ink/60">
                  <MapPin className="h-4 w-4 text-clay-500" /> {w.location}
                </p>
              )}
            </div>

            {fromPrice !== null && Number.isFinite(fromPrice) && (
              <div className="flex items-center gap-5">
                <div className="text-right">
                  <p className="text-xs text-ink/55">Harga tiket mulai dari</p>
                  <p className="text-3xl font-bold text-clay-500">{formatIDR(fromPrice)}</p>
                </div>
                <a href="#tiket" className="btn-primary rounded-full px-8 py-3.5 text-base shadow-md shadow-clay-500/25">
                  Lihat Tiket
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Tiga kartu ringkasan: ulasan, lokasi & info, fasilitas */}
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {/* Ulasan */}
          <div className="card relative flex flex-col overflow-hidden p-5">
            {/* Hiasan gelombang di pojok kanan atas */}
            <svg
              className="pointer-events-none absolute right-0 top-0 h-24 w-3/4"
              viewBox="0 0 300 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M300 0H60C110 20 140 60 210 62c40 1 70-14 90-30z" fill="#fdf3ee" />
              <path d="M300 0H150c40 14 70 36 110 38 16 1 30-3 40-8z" fill="#fbe3d6" fillOpacity="0.7" />
            </svg>

            <div className="relative flex items-center gap-3">
              <p className="font-display text-5xl font-bold leading-none text-clay-500">
                {avgRating !== null ? avgRating.toFixed(1).replace(".", ",") : "–"}
                <span className="text-xl font-semibold text-clay-400">/5</span>
              </p>
              <div>
                <p className="text-lg font-bold text-forest-900">
                  {avgRating !== null ? ratingWord(avgRating) : "Belum ada ulasan"}
                </p>
                <a href="#ulasan" className="text-base font-bold text-clay-600 hover:underline">
                  {reviews.length} ulasan ›
                </a>
              </div>
            </div>

            <h2 className="relative mt-5 text-lg font-extrabold text-forest-950">Kata Pengunjung tentang Wisata Ini</h2>

            <div className="mt-3 max-h-[26rem] flex-1 space-y-3 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-forest-200">
              {reviews.slice(0, 8).map((r) => (
                <div key={r.id} className="rounded-2xl border border-forest-100 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[15px] font-bold text-forest-900">
                      {r.profiles?.full_name ?? "Pengunjung"}
                    </p>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-clay-50 px-2.5 py-1 text-xs font-semibold text-clay-700">
                      <Star className="h-3.5 w-3.5 fill-clay-500 text-clay-500" />
                      {r.rating},0 / 5
                    </span>
                  </div>
                  <p className="mt-2.5 line-clamp-3 text-[15px] leading-relaxed text-ink/75">
                    {r.komentar || "Pengunjung ini tidak menulis komentar."}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                    <a href="#ulasan" className="text-sm font-bold text-clay-600 hover:underline">
                      Lihat selengkapnya
                    </a>
                    {r.is_verified_purchase ? (
                      <span className="flex items-center gap-1 font-medium text-forest-700">
                        <BadgeCheck className="h-3.5 w-3.5" /> Pembelian terverifikasi
                      </span>
                    ) : (
                      <span className="italic text-ink/40">
                        {new Date(r.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {!reviews.length && (
                <p className="py-8 text-center text-sm text-ink/40">Jadilah yang pertama menilai wisata ini.</p>
              )}
            </div>
          </div>

          {/* Lokasi & info */}
          <div id="lokasi" className="card scroll-mt-32 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-forest-900">Lokasi & Info</h2>
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-semibold text-clay-600 hover:underline">
                Lihat peta <ChevronRight className="h-4 w-4" />
              </a>
            </div>
            {w.location && (
              <p className="mt-3 flex items-start gap-2 text-sm text-ink/80">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-clay-500" /> {w.location}
              </p>
            )}
            {w.latitude && w.longitude && (
              <div className="mt-3 h-40 overflow-hidden rounded-xl border border-forest-100">
                <iframe
                  className="h-full w-full"
                  loading="lazy"
                  title={`Peta ${w.name}`}
                  src={`https://www.google.com/maps?q=${w.latitude},${w.longitude}&z=14&output=embed`}
                />
              </div>
            )}
            <ul className="mt-4 space-y-3">
              {infoRows.map(({ Icon, label, value }) => (
                <li key={label} className="flex items-start gap-3 text-sm">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" />
                  <div>
                    <p className="text-xs text-ink/50">{label}</p>
                    <p className="text-ink/85">{value}</p>
                  </div>
                </li>
              ))}
              {w.contact_phone && (
                <li className="flex items-start gap-3 text-sm">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" />
                  <div>
                    <p className="text-xs text-ink/50">Kontak Pengelola</p>
                    <a href={`https://wa.me/${w.contact_phone.replace(/\D/g, "")}`} className="text-clay-600 hover:underline">
                      {w.contact_phone}
                    </a>
                  </div>
                </li>
              )}
            </ul>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-forest-200 py-2.5 text-sm font-semibold text-forest-800 hover:bg-forest-50"
            >
              <Navigation className="h-4 w-4" /> Petunjuk arah
            </a>
          </div>

          {/* Fasilitas */}
          <div id="fasilitas" className="card scroll-mt-32 p-5">
            <h2 className="font-display text-lg font-semibold text-forest-900">Fasilitas Utama</h2>
            {w.facilities?.length ? (
              <ul className="mt-4 grid max-h-[26rem] grid-cols-1 gap-x-4 gap-y-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {w.facilities.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-ink/80">
                    <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-forest-600" /> {f}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-ink/40">Informasi fasilitas belum tersedia.</p>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="font-display text-xl font-semibold text-forest-900">Tentang Destinasi</h2>
              <div className="mt-3">
                <ExpandableText text={w.description ?? w.short_description ?? ""} />
              </div>
            </div>

            {!!w.tips?.length && (
              <div className="mt-8 rounded-xl border border-clay-200 bg-clay-50 p-5">
                <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-forest-900">
                  <Lightbulb className="h-5 w-5 text-clay-600" /> Tips Berkunjung
                </h3>
                <ul className="mt-3 space-y-1.5">
                  {w.tips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2 text-sm text-ink/80">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clay-500" /> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Penilaian Publik */}
            <div id="ulasan" className="mt-10 scroll-mt-32">
              <h2 className="font-display text-xl font-semibold text-forest-900">Penilaian Publik</h2>

              {/* Ringkasan: skor + sebaran bintang */}
              <div className="card mt-4 grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="text-center sm:px-4">
                  <p className="font-display text-6xl font-bold leading-none text-clay-500">
                    {avgRating !== null ? avgRating.toFixed(1).replace(".", ",") : "–"}
                  </p>
                  <div className="mt-2 flex justify-center">
                    <StarRating value={avgRating ?? 0} size={18} />
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-forest-900">
                    {avgRating !== null ? ratingWord(avgRating) : "Belum ada ulasan"}
                  </p>
                  <p className="text-xs text-ink/50">{reviews.length} ulasan</p>
                </div>

                <ul className="space-y-2">
                  {distribution.map(({ star, count }) => {
                    const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                    return (
                      <li key={star} className="flex items-center gap-3 text-sm">
                        <span className="flex w-8 shrink-0 items-center gap-1 font-medium text-forest-900">
                          {star} <Star className="h-3.5 w-3.5 fill-clay-500 text-clay-500" />
                        </span>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-forest-50">
                          <div className="h-full rounded-full bg-clay-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 shrink-0 text-right text-ink/55">{count}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="mt-5">
                <ReviewForm
                  wisataId={w.id}
                  wisataSlug={w.slug}
                  isLoggedIn={!!user}
                  hasPurchased={hasPurchased}
                  existingRating={myReview ? { rating: myReview.rating, komentar: myReview.komentar } : null}
                />
              </div>

              <div className="mt-8">
                <ReviewList items={reviewItems} />
              </div>
            </div>
          </div>

          {/* Pemilih tiket — menempel saat di-scroll */}
          <div id="tiket" className="scroll-mt-32">
            <div className="lg:sticky lg:top-36">
              {tiketList.length ? (
                <TiketPicker tiketList={tiketList} wisataSlug={w.slug} isLoggedIn={!!user} />
              ) : (
                <div className="card p-5 text-sm text-ink/60">Belum ada paket tiket tersedia untuk wisata ini.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
