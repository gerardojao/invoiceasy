// src/Components/StickyActions.tsx
type Props = {
  totalText: string;
  onShare: () => void;
  onPdf: () => void;
  onNext?: () => void;      // puede venir undefined
  nextDisabled?: boolean;
  nextLabel?: string;
  showActions?: boolean;    // true => mostrar Compartir/PDF; false => mostrar Siguiente
};

export default function StickyActions({
  totalText,
  onShare,
  onPdf,
  onNext,
  nextDisabled,
  nextLabel = "Siguiente",
  showActions = true,
}: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 md:hidden">
      <div className="mx-auto max-w-5xl px-4 py-3">
        {showActions ? (
          // Vista final: total + compartir + pdf
          <div className="flex items-center gap-3">
            <div className="mr-auto text-base font-semibold">Total: {totalText}</div>
            <button
              onClick={onShare}
              className="rounded-xl bg-sky-600 px-4 py-2 text-white hover:bg-sky-700"
            >
              Compartir
            </button>
            <button
              onClick={onPdf}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
            >
              Guardar PDF
            </button>
          </div>
        ) : (
          // Vista intermedia: total + siguiente
          <div className="flex items-center gap-3">
            <div className="mr-auto text-base font-semibold">Total: {totalText}</div>
            <button
              onClick={() => onNext && onNext()} // <- protegido
              disabled={!onNext || nextDisabled} // <- desactivado si falta
              className={`rounded-xl px-4 py-2 text-white transition ${
                !onNext || nextDisabled
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {nextLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
