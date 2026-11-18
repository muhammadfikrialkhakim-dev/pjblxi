import Link from "next/link";
import { Compass, Mail, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary, translateCategoryName } from "@/lib/i18n/dictionary";
import type { Category } from "@/lib/types";

export default async function Footer() {
  const locale = getLocale();
  const t = getDictionary(locale).footer;

  // Nama situs, tagline, kontak, dan metode pembayaran yang aktif diambil dari
  // Pengaturan Situs (khusus Super Admin, lihat app/admin/settings). select("*")
  // + fallback supaya footer tetap tampil walau tabel/kolom belum lengkap.
  const supabase = createClient();
  const [{ data: settings }, { data: categoryRows }] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", true).maybeSingle(),
    supabase.from("categories").select("name, slug").order("name").limit(6),
  ]);

  const siteName = settings?.site_name || "Explore Malang";
  const tagline = settings?.site_tagline || t.tagline;
  const categories = (categoryRows as Pick<Category, "name" | "slug">[] | null) ?? [];

  const whatsappUrl = settings?.contact_whatsapp
    ? `https://wa.me/${String(settings.contact_whatsapp).replace(/[^0-9]/g, "")}`
    : null;
  const mailUrl = settings?.contact_email ? `mailto:${settings.contact_email}` : null;
  // "Hubungi Kami" membuka halaman chat bot (/hubungi-kami); WhatsApp & email
  // tetap tersedia sebagai tautan langsung di bawah dan di dalam halaman itu.
  const contactHref = "/hubungi-kami";

  // Hanya metode pembayaran yang diaktifkan Super Admin yang ditampilkan.
  const enabled = (key: string) => settings?.[key] !== false;
  const payments = [
    { show: enabled("payment_bank_transfer_enabled"), label: t.payBank },
    { show: enabled("payment_ewallet_enabled"), label: t.payEwallet },
    { show: enabled("payment_credit_card_enabled"), label: t.payCard },
    { show: enabled("payment_qris_enabled"), label: t.payQris },
  ].filter((p) => p.show);

  const linkClass = "text-forest-800/75 transition-colors hover:text-clay-600 hover:underline underline-offset-4";

  const columns = [
    {
      title: t.aboutTitle,
      links: [
        { label: t.howToBook, href: "/bantuan" },
        { label: t.contactUs, href: contactHref },
        { label: t.supportHelp, href: "/bantuan" },
      ],
    },
    {
      title: t.exploreTitle,
      links: [
        { label: t.exploreDestinations, href: "/destinations" },
        { label: t.exploreCategories, href: "/categories" },
        ...categories.slice(0, 4).map((c) => ({
          label: translateCategoryName(c.name, c.slug, locale),
          href: `/categories/${c.slug}`,
        })),
      ],
    },
    {
      title: t.othersTitle,
      links: [
        { label: t.myWishlist, href: "/wishlist" },
        { label: t.myOrders, href: "/account" },
        { label: t.supportTerms, href: "/syarat-ketentuan" },
        { label: t.supportPrivacy, href: "/kebijakan-privasi" },
      ],
    },
  ];

  return (
    <footer className="bg-sand text-forest-900 print:hidden">
      {/* Garis aksen di tepi atas */}
      <div className="h-px bg-gradient-to-r from-clay-500 via-clay-400 to-forest-500" />

      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1.25fr_2fr]">
        {/* Kolom brand */}
        <div>
          <Link href="/" className="flex items-center gap-3 font-display text-xl font-semibold text-forest-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-clay-500">
              <Compass className="h-5 w-5 text-white" strokeWidth={2.2} />
            </span>
            {siteName}
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-forest-800/70">{tagline}</p>

          <Link
            href={contactHref}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-clay-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-clay-600"
          >
            {t.contactUs} <MessageCircle className="h-4 w-4" />
          </Link>

          {payments.length > 0 && (
            <p className="mt-8 text-sm text-forest-800/60">
              <span className="text-forest-800/80">{t.paymentTitle}:</span>{" "}
              {payments.map((p) => p.label).join(" · ")}
            </p>
          )}
        </div>

        {/* Kolom tautan */}
        <div className="grid gap-10 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.title}>
              <p className="mb-5 text-lg font-bold text-forest-900">{col.title}</p>
              <ul className="space-y-3.5 text-[15px]">
                {col.links.map((item) => (
                  <li key={`${col.title}-${item.label}`}>
                    <Link href={item.href} className={linkClass}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Kontak di bawah kolom pertama, gaya "Follow us on" */}
              {col.title === t.aboutTitle && (whatsappUrl || mailUrl) && (
                <div className="mt-9">
                  <p className="mb-4 text-lg font-bold text-forest-900">{t.contactUs}</p>
                  <ul className="space-y-3.5 text-[15px]">
                    {whatsappUrl && (
                      <li>
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 ${linkClass}`}>
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366]">
                            <MessageCircle className="h-4 w-4 text-white" />
                          </span>
                          WhatsApp
                        </a>
                      </li>
                    )}
                    {mailUrl && (
                      <li>
                        <a href={mailUrl} className={`flex items-center gap-3 ${linkClass}`}>
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-clay-500">
                            <Mail className="h-4 w-4 text-white" />
                          </span>
                          <span className="break-all">{settings?.contact_email}</span>
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-forest-100">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-forest-800/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {siteName}. {t.rights}
          </p>
          <p>{t.madeFor}</p>
        </div>
      </div>
    </footer>
  );
}
