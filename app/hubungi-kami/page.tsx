import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import ChatBot from "@/components/ChatBot";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const locale = getLocale();
  const en = locale === "en";

  // Kontak untuk tombol "hubungi tim" diambil dari Pengaturan Situs.
  const supabase = createClient();
  const { data: settings } = await supabase.from("site_settings").select("*").eq("id", true).maybeSingle();

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-forest-700 via-forest-800 to-forest-900 pb-20 pt-8 text-white sm:pt-10">
        <div className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-clay-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-forest-300/20 blur-3xl" />
        <div className="container-page relative">
          <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            {en ? "Contact Us" : "Hubungi Kami"}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-forest-100/90">
            {en
              ? "Ask our virtual assistant anything about bookings, payments, and e-tickets — or reach our team directly."
              : "Tanya asisten virtual kami soal pemesanan, pembayaran, dan e-tiket — atau hubungi tim kami langsung."}
          </p>
        </div>
      </section>

      <section className="container-page relative z-10 -mt-12 pb-12">
        <div>
          <ChatBot
            locale={locale}
            whatsapp={settings?.contact_whatsapp ?? null}
            email={settings?.contact_email ?? null}
          />
        </div>
      </section>
    </div>
  );
}
