"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown, Heart, User, Ticket, LayoutDashboard, LogOut } from "lucide-react";
import { swalConfirm } from "@/lib/swal";

/**
 * Menu dropdown yang muncul saat ikon/nama pengguna di navbar diklik,
 * berisi jalan pintas ke Profil, Pesanan Saya, (Panel Admin kalau staf),
 * dan Keluar. Menggantikan span nama + tombol keluar terpisah yang
 * sebelumnya langsung tampil di navbar.
 */
export default function UserMenu({
  name,
  isStaff,
  labels,
  logoutAction,
}: {
  name: string;
  isStaff: boolean;
  labels: {
    profile: string;
    myOrders: string;
    wishlist: string;
    adminPanel: string;
    logout: string;
    logoutConfirm: { title: string; text: string; yes: string; cancel: string };
  };
  logoutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [loggingOut, startLogout] = useTransition();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative z-[70]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded border border-forest-200 px-3 py-1.5 text-sm font-medium text-forest-800 hover:bg-forest-50 group-data-[transparent=true]:border-white/50 group-data-[transparent=true]:text-white group-data-[transparent=true]:hover:bg-white/15"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <User className="h-4 w-4" />
        <span className="hidden max-w-[9rem] truncate sm:inline">{name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-ink/50 group-data-[transparent=true]:text-white/80" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-[70] mt-1.5 w-52 overflow-hidden rounded border border-forest-100 bg-white py-1 shadow-lg"
        >
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink/80 hover:bg-forest-50"
            role="menuitem"
          >
            <User className="h-4 w-4 text-forest-700" /> {labels.profile}
          </Link>
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink/80 hover:bg-forest-50"
            role="menuitem"
          >
            <Ticket className="h-4 w-4 text-forest-700" /> {labels.myOrders}
          </Link>
          {!isStaff && (
            <Link
              href="/wishlist"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink/80 hover:bg-forest-50"
              role="menuitem"
            >
              <Heart className="h-4 w-4 text-forest-700" /> {labels.wishlist}
            </Link>
          )}
          {isStaff && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink/80 hover:bg-forest-50"
              role="menuitem"
            >
              <LayoutDashboard className="h-4 w-4 text-forest-700" /> {labels.adminPanel}
            </Link>
          )}
          <div className="my-1 border-t border-forest-100" />
          {/* Konfirmasi dulu. Aksi dipanggil langsung (bukan submit form) karena menu
              ikut tertutup saat dialog diklik, dan form yang sudah terlepas tidak bisa dikirim. */}
          <button
            type="button"
            disabled={loggingOut}
            onClick={async () => {
              const ok = await swalConfirm({
                icon: "question",
                title: labels.logoutConfirm.title,
                text: labels.logoutConfirm.text,
                confirmText: labels.logoutConfirm.yes,
                cancelText: labels.logoutConfirm.cancel,
              });
              if (ok) {
                startLogout(() => {
                  void logoutAction();
                });
              }
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
            role="menuitem"
          >
            <LogOut className="h-4 w-4" /> {labels.logout}
          </button>
        </div>
      )}
    </div>
  );
}
