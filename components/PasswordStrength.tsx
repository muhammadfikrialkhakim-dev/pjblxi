"use client";

type Level = 0 | 1 | 2 | 3; // 0 = kosong, 1 = lemah, 2 = sedang, 3 = kuat

/**
 * Menilai kekuatan kata sandi dari 5 kriteria: panjang ≥ 8, panjang ≥ 12,
 * campuran huruf besar & kecil, angka, dan simbol.
 *   skor ≤ 2 (atau < 6 karakter) → Lemah, 3 → Sedang, ≥ 4 → Kuat.
 */
export function evaluatePassword(password: string): { level: Level; tips: string[] } {
  if (!password) return { level: 0, tips: [] };

  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const score =
    (password.length >= 8 ? 1 : 0) +
    (password.length >= 12 ? 1 : 0) +
    (hasMixedCase ? 1 : 0) +
    (hasDigit ? 1 : 0) +
    (hasSymbol ? 1 : 0);

  const level: Level = password.length < 6 || score <= 2 ? 1 : score === 3 ? 2 : 3;

  const tips: string[] = [];
  if (password.length < 8) tips.push("minimal 8 karakter");
  if (!hasMixedCase) tips.push("huruf besar dan kecil");
  if (!hasDigit) tips.push("angka");
  if (!hasSymbol) tips.push("simbol (mis. ! @ #)");

  return { level, tips };
}

const META: Record<1 | 2 | 3, { label: string; bar: string; text: string }> = {
  1: { label: "Lemah", bar: "bg-red-500", text: "text-red-600" },
  2: { label: "Sedang", bar: "bg-amber-500", text: "text-amber-600" },
  3: { label: "Kuat", bar: "bg-green-600", text: "text-green-700" },
};

export default function PasswordStrength({ password }: { password: string }) {
  const { level, tips } = evaluatePassword(password);
  if (level === 0) return null;
  const meta = META[level];

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1.5">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i <= level ? meta.bar : "bg-forest-100"}`}
            />
          ))}
        </div>
        <span className={`text-xs font-semibold ${meta.text}`}>{meta.label}</span>
      </div>
      {level < 3 && tips.length > 0 && (
        <p className="mt-1.5 text-xs text-ink/50">Tambahkan: {tips.join(", ")}.</p>
      )}
    </div>
  );
}
