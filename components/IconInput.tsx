import type { InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

/** Input dengan ikon di sisi kiri (dipakai di form Masuk & Daftar). */
export default function IconInput({ icon: Icon, ...props }: { icon: LucideIcon } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
      <input {...props} className="input-field !rounded-lg !py-3 !pl-10" />
    </div>
  );
}
