"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FLASHES } from "@/lib/flash";
import { swalFire } from "@/lib/swal";

/**
 * Menampilkan dialog hasil aksi (berhasil menambah/mengubah/menghapus, dst.)
 * berdasarkan ?flash=<kode> di URL, lalu membersihkan parameternya supaya
 * dialog tidak muncul lagi saat halaman di-refresh. Dipasang sekali di
 * layout admin.
 */
export default function FlashAlert() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    const code = params.get("flash");
    if (!code) {
      handled.current = null;
      return;
    }
    const name = params.get("n");
    const key = `${code}|${name}`;
    if (handled.current === key) return; // cegah dobel di React Strict Mode
    handled.current = key;

    const def = FLASHES[code];
    if (def) {
      const english = def.en && document.documentElement.lang.toLowerCase().startsWith("en");
      void swalFire({
        icon: def.icon,
        title: english ? def.en!.title : def.title,
        text: english ? def.en!.text : def.text(name ? name.slice(0, 80) : null),
        timer: def.icon === "success" ? 2800 : undefined,
      });
    }

    const next = new URLSearchParams(params.toString());
    next.delete("flash");
    next.delete("n");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  return null;
}
