import { MapPinned } from "lucide-react";

export default function UnassignedWisataAdminPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <MapPinned className="h-10 w-10 text-ink/30" />
      <h1 className="mt-4 font-display text-xl font-semibold text-forest-900">
        Belum Ada Wisata yang Ditugaskan
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink/60">
        Akun Anda berperan sebagai Admin Wisata, tapi belum ditugaskan mengelola wisata mana pun.
        Hubungi Super Admin untuk menugaskan Anda ke sebuah wisata.
      </p>
    </div>
  );
}
