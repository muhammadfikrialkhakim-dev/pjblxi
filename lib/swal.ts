/**
 * Dialog & notifikasi bergaya SweetAlert — tanpa library tambahan.
 *
 *   await swalFire({ icon: "success", title: "Tersimpan", text: "…", timer: 2500 });
 *   if (await swalConfirm({ title: "Hapus?", text: "…", danger: true })) { … }
 *
 * Hanya untuk dipanggil di browser (event handler / useEffect). Semua teks
 * dimasukkan lewat textContent, bukan innerHTML, jadi aman untuk teks dari
 * pengguna. Gayanya ada di app/globals.css (kelas .swal-*).
 */

export type SwalIcon = "success" | "error" | "warning" | "question" | "info";

export type SwalOptions = {
  icon?: SwalIcon;
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  /** Tampilkan tombol Batal (mode konfirmasi). */
  showCancel?: boolean;
  /** Tombol konfirmasi berwarna merah dan fokus awal ke Batal — untuk aksi merusak seperti hapus. */
  danger?: boolean;
  /** Tutup otomatis setelah sekian milidetik (dengan garis hitung mundur). */
  timer?: number;
};

const SVG_NS = "http://www.w3.org/2000/svg";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function svg(tag: string, attrs: Record<string, string>, className?: string) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (className) node.setAttribute("class", className);
  return node;
}

function buildIcon(icon: SwalIcon): HTMLElement {
  const wrap = el("div", `swal-icon swal-icon-${icon}`);
  wrap.setAttribute("aria-hidden", "true");
  const root = svg("svg", { viewBox: "0 0 80 80", fill: "none" });
  root.appendChild(svg("circle", { cx: "40", cy: "40", r: "36", "stroke-width": "4" }, "swal-ring"));

  if (icon === "success") {
    root.appendChild(
      svg("path", { d: "M24 41l11 11 21-23", "stroke-width": "5", "stroke-linecap": "round", "stroke-linejoin": "round" }, "swal-glyph swal-check")
    );
  } else if (icon === "error") {
    root.appendChild(svg("path", { d: "M28 28l24 24M52 28L28 52", "stroke-width": "5", "stroke-linecap": "round" }, "swal-glyph swal-cross"));
  } else {
    const glyph = svg("text", { x: "40", y: "54", "text-anchor": "middle", "font-size": "40", "font-weight": "700" }, "swal-text-glyph");
    glyph.textContent = icon === "warning" ? "!" : icon === "question" ? "?" : "i";
    root.appendChild(glyph);
  }
  wrap.appendChild(root);
  return wrap;
}

let uid = 0;

function open(opts: SwalOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(false);
      return;
    }

    const icon = opts.icon ?? "info";
    const id = `swal-${++uid}`;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;

    const overlay = el("div", "swal-overlay");
    const box = el("div", "swal-box");
    box.setAttribute("role", opts.showCancel ? "alertdialog" : "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", `${id}-title`);
    if (opts.text) box.setAttribute("aria-describedby", `${id}-text`);

    box.appendChild(buildIcon(icon));
    const title = el("h2", "swal-title", opts.title);
    title.id = `${id}-title`;
    box.appendChild(title);
    if (opts.text) {
      const text = el("p", "swal-text", opts.text);
      text.id = `${id}-text`;
      box.appendChild(text);
    }

    const actions = el("div", "swal-actions");
    let cancelBtn: HTMLButtonElement | null = null;
    if (opts.showCancel) {
      cancelBtn = el("button", "swal-btn swal-btn-cancel", opts.cancelText ?? "Batal");
      cancelBtn.type = "button";
      actions.appendChild(cancelBtn);
    }
    const confirmBtn = el(
      "button",
      `swal-btn ${opts.danger ? "swal-btn-danger" : "swal-btn-confirm"}`,
      opts.confirmText ?? (opts.showCancel ? "Ya, lanjutkan" : "OK")
    );
    confirmBtn.type = "button";
    actions.appendChild(confirmBtn);
    box.appendChild(actions);

    let timerId: ReturnType<typeof setTimeout> | undefined;
    if (opts.timer && opts.timer > 0) {
      const bar = el("div", "swal-timer");
      bar.style.animationDuration = `${opts.timer}ms`;
      box.appendChild(bar);
    }

    overlay.appendChild(box);

    let finished = false;
    function close(result: boolean) {
      if (finished) return;
      finished = true;
      if (timerId) clearTimeout(timerId);
      document.removeEventListener("keydown", onKey, true);
      overlay.classList.add("swal-closing");
      setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = prevOverflow;
        previouslyFocused?.focus?.();
        resolve(result);
      }, 150);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        close(false);
        return;
      }
      if (e.key === "Tab") {
        // Fokus dikurung di dalam dialog.
        const items = Array.from(box.querySelectorAll<HTMLElement>("button"));
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !box.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !box.contains(active))) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    confirmBtn.addEventListener("click", () => close(true));
    cancelBtn?.addEventListener("click", () => close(false));
    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) close(false);
    });
    document.addEventListener("keydown", onKey, true);

    document.body.style.overflow = "hidden";
    document.body.appendChild(overlay);
    // Aksi merusak: fokus awal ke Batal supaya Enter tidak langsung menghapus.
    (opts.danger && cancelBtn ? cancelBtn : confirmBtn).focus();

    if (opts.timer && opts.timer > 0) timerId = setTimeout(() => close(true), opts.timer);
  });
}

// Satu dialog pada satu waktu — yang lain mengantre.
let chain: Promise<unknown> = Promise.resolve();
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task, task);
  chain = run.catch(() => undefined);
  return run;
}

/** Pemberitahuan dengan satu tombol (sukses, gagal, info). */
export function swalFire(opts: SwalOptions): Promise<boolean> {
  return enqueue(() => open({ ...opts, showCancel: false }));
}

/** Konfirmasi dengan tombol Batal. Resolve true kalau pengguna menekan konfirmasi. */
export function swalConfirm(opts: Omit<SwalOptions, "showCancel" | "timer">): Promise<boolean> {
  return enqueue(() => open({ icon: "warning", ...opts, showCancel: true }));
}
