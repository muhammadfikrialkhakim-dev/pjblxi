import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Tiket } from "@/lib/types";
import { promoStatus, type Promo } from "@/lib/promo";
import BookingForm, { type VoucherOption } from "@/components/BookingForm";
import BookingSteps from "@/components/BookingSteps";
import { formatVisitDate } from "@/lib/date";

export default async function BookingPage({
  searchParams,
}: {
  searchParams: { tiket?: string; date?: string; qty?: string; error?: string };
}) {
  if (!searchParams.tiket || !searchParams.date) notFound();

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    redirect(`/login?redirectTo=${encodeURIComponent(`/booking?${params.toString()}`)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

  const { data: tiket } = await supabase
    .from("tiket")
    .select("*, wisata(*)")
    .eq("id", searchParams.tiket)
    .single();

  if (!tiket) notFound();

  const t = tiket as Tiket;
  const qty = Number(searchParams.qty ?? 1);

  const dateLabel = formatVisitDate(searchParams.date!);

  // Kuota bisa berubah sejak pengunjung memilih tiket (pembeli lain). Cek
  // lagi di sini supaya pesan jelas muncul sebelum mengisi data; keputusan
  // akhir tetap di database saat pesanan dibuat.
  let quotaMessage: string | undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(searchParams.date!)) {
    const { data: left } = await supabase.rpc("tiket_remaining", { p_tiket: t.id, p_date: searchParams.date });
    if (typeof left === "number") {
      if (left === 0) quotaMessage = "Maaf, kuota tiket untuk tanggal ini sudah habis. Silakan pilih tanggal lain.";
      else if (qty > left) quotaMessage = `Sisa kuota untuk tanggal ini tinggal ${left} tiket. Kurangi jumlah tiket atau pilih tanggal lain.`;
    }
  }

  // Voucher milik pengunjung yang belum dipakai, masih berlaku, dan cocok
  // dengan wisata ini (promo khusus wisata lain disembunyikan; promo umum
  // tampil). Kelayakan akhir (min. belanja dsb.) dinilai di form dan,
  // yang menentukan, di server saat pesanan dibuat.
  const { data: claimRows } = await supabase
    .from("user_promos")
    .select("id, used_at, promo:promos(*)")
    .eq("user_id", user.id)
    .is("used_at", null);
  const vouchers: VoucherOption[] = ((claimRows ?? []) as unknown as { id: string; promo: Promo | null }[])
    .filter((c) => c.promo && promoStatus(c.promo) === "active" && (!c.promo.wisata_id || c.promo.wisata_id === t.wisata_id))
    .map((c) => ({ claimId: c.id, promo: c.promo as Promo }));

  return (
    <div>
      <BookingSteps current={1} />

      <div className="container-page py-8">
        <BookingForm
          tiketId={t.id}
          wisataId={t.wisata_id}
          vouchers={vouchers}
          errorMessage={searchParams.error ?? quotaMessage}
          visitDate={searchParams.date!}
          quantity={qty}
          unitPrice={t.price}
          defaults={{
            full_name: profile?.full_name ?? "",
            phone: profile?.phone ?? "",
            email: user.email ?? "",
          }}
          summary={{
            wisataName: t.wisata?.name ?? "",
            coverUrl: t.wisata?.cover_image_url ?? null,
            tiketName: t.name,
            dateLabel,
          }}
        />
      </div>
    </div>
  );
}
