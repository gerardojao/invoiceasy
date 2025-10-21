import * as React from "react";

type StickyActionsProps = {
  totalText: string;
  onShare: () => void | Promise<void>;
  onPdf: () => void | Promise<void>;
};

const StickyActions: React.FC<StickyActionsProps> = ({ totalText, onShare, onPdf }) => {
  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t px-3 py-2 flex items-center gap-2"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}
    >
      <div className="flex-1">
        <div className="text-[11px] leading-none text-slate-500">Total</div>
        <div className="font-semibold">{totalText}</div>
      </div>
      <button
        onClick={onShare}
        className="rounded-lg bg-sky-600 text-white px-3 py-2 text-sm font-medium hover:bg-sky-700"
        type="button"
      >
        Compartir
      </button>
      <button
        onClick={onPdf}
        className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm font-medium hover:bg-emerald-700"
        type="button"
      >
        PDF
      </button>
    </div>
  );
};

export default StickyActions;
