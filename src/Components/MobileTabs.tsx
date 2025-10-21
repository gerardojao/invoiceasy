import * as React from "react";
import type { TabItem } from "../types/ui";

type MobileTabsProps = {
  tabs: TabItem[];
  value: string;
  onChange: (key: string) => void;
};

const MobileTabs: React.FC<MobileTabsProps> = ({ tabs, value, onChange }) => {
  return (
    <div className="md:hidden sticky top-0 z-50 bg-white/95 backdrop-blur border-b">
      <div className="grid grid-cols-4">
        {tabs.map((t) => {
          const active = value === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={`py-3 text-sm font-medium ${
                active
                  ? "text-emerald-700 border-b-2 border-emerald-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              type="button"
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileTabs;
