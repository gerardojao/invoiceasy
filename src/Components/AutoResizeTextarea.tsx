import { useEffect, useRef } from "react";

export default function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  maxLength = 200,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`; // hasta ~200px
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`w-full border rounded px-3 py-2 leading-snug resize-y
                  min-h-[44px] max-h-[200px] whitespace-pre-wrap break-words
                  ${className}`}
    />
  );
}
