"use client";

import { useState } from "react";
import { MessageCircle, Trash2, ShieldCheck } from "lucide-react";
import { replyToReview, deleteReply } from "@/app/destinations/[slug]/actions";

export type ReplyItem = {
  id: string;
  komentar: string;
  created_at: string;
  authorName: string;
  isStaff: boolean;
  canDelete: boolean;
};

export default function ReviewReplies({
  ulasanId,
  wisataSlug,
  isLoggedIn,
  replies,
}: {
  ulasanId: string;
  wisataSlug: string;
  isLoggedIn: boolean;
  replies: ReplyItem[];
}) {
  const [open, setOpen] = useState(false);

  function toggle() {
    if (!isLoggedIn) {
      window.location.href = `/login?redirectTo=${encodeURIComponent(`/destinations/${wisataSlug}`)}`;
      return;
    }
    setOpen((v) => !v);
  }

  return (
    <div className="mt-2">
      <button type="button" onClick={toggle} className="inline-flex items-center gap-1.5 text-xs font-medium text-forest-700 hover:underline">
        <MessageCircle className="h-3.5 w-3.5" /> Balas{replies.length ? ` (${replies.length})` : ""}
      </button>

      {replies.length > 0 && (
        <div className="mt-3 space-y-3 border-l-2 border-forest-100 pl-4">
          {replies.map((r) => (
            <div key={r.id}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-forest-900">
                  {r.authorName}
                  {r.isStaff && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-clay-100 px-2 py-0.5 text-[11px] font-medium text-clay-700">
                      <ShieldCheck className="h-3 w-3" /> Pengelola
                    </span>
                  )}
                  <span className="ml-2 font-normal text-ink/40">
                    {new Date(r.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </p>
                {r.canDelete && (
                  <form action={deleteReply}>
                    <input type="hidden" name="reply_id" value={r.id} />
                    <input type="hidden" name="wisata_slug" value={wisataSlug} />
                    <button type="submit" aria-label="Hapus balasan" className="text-ink/40 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                )}
              </div>
              <p className="mt-1 whitespace-pre-line text-sm text-ink/80">{r.komentar}</p>
            </div>
          ))}
        </div>
      )}

      {open && (
        <form
          action={async (fd) => {
            await replyToReview(fd);
            setOpen(false);
          }}
          className="mt-3"
        >
          <input type="hidden" name="ulasan_id" value={ulasanId} />
          <input type="hidden" name="wisata_slug" value={wisataSlug} />
          <textarea name="komentar" rows={2} required maxLength={1000} placeholder="Tulis balasan..." className="input-field" />
          <div className="mt-2 flex gap-2">
            <button type="submit" className="btn-primary !px-4 !py-1.5 text-xs">Kirim Balasan</button>
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary !px-4 !py-1.5 text-xs">Batal</button>
          </div>
        </form>
      )}
    </div>
  );
}
