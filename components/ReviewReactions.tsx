"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { reactToReview } from "@/app/destinations/[slug]/actions";

export default function ReviewReactions({
  ulasanId,
  wisataSlug,
  likes,
  dislikes,
  myReaction,
}: {
  ulasanId: string;
  wisataSlug: string;
  likes: number;
  dislikes: number;
  myReaction: 1 | -1 | 0;
}) {
  const [state, setState] = useState({ likes, dislikes, mine: myReaction });
  const [pending, start] = useTransition();
  const router = useRouter();

  function react(value: 1 | -1) {
    start(async () => {
      const res = await reactToReview(ulasanId, value, wisataSlug);
      if (res.ok) {
        setState((s) => {
          let { likes, dislikes } = s;
          if (s.mine === 1) likes--;
          if (s.mine === -1) dislikes--;
          const mine = s.mine === value ? 0 : value;
          if (mine === 1) likes++;
          if (mine === -1) dislikes++;
          return { likes, dislikes, mine };
        });
      } else if ("needsLogin" in res) {
        router.push(`/login?redirectTo=${encodeURIComponent(`/destinations/${wisataSlug}`)}`);
      }
    });
  }

  const base = "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-60";
  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => react(1)}
        aria-pressed={state.mine === 1}
        aria-label="Jempol baik"
        className={`${base} ${state.mine === 1 ? "border-forest-600 bg-forest-100 text-forest-800" : "border-forest-200 text-ink/60 hover:bg-forest-50"}`}
      >
        <ThumbsUp className={`h-3.5 w-3.5 ${state.mine === 1 ? "fill-forest-600" : ""}`} /> {state.likes}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => react(-1)}
        aria-pressed={state.mine === -1}
        aria-label="Jempol buruk"
        className={`${base} ${state.mine === -1 ? "border-red-400 bg-red-50 text-red-700" : "border-forest-200 text-ink/60 hover:bg-forest-50"}`}
      >
        <ThumbsDown className={`h-3.5 w-3.5 ${state.mine === -1 ? "fill-red-500" : ""}`} /> {state.dislikes}
      </button>
    </div>
  );
}
