"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/sops";
import { Icon } from "@/components/icon";

const OPTIONS: { role: Role; label: string; icon: string }[] = [
  { role: "kitchen", label: "Kitchen Staff", icon: "CookingPot" },
  { role: "foh", label: "Front of House", icon: "Storefront" },
  { role: "manager", label: "Manager", icon: "ChartLineUp" },
];

/**
 * Dev-only role preview switcher (prototype chrome). In production this is
 * replaced by authenticated role-based routing — staff land directly on their
 * own view. Kept here so all three role experiences are previewable.
 */
export function RoleSwitcher() {
  const role = useStore((s) => s.role);
  const setRole = useStore((s) => s.setRole);
  const router = useRouter();

  const select = (next: Role) => {
    setRole(next);
    router.push(next === "manager" ? "/manager" : "/today");
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <span
        style={{
          fontSize: 12,
          color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
        }}
      >
        Viewing as
      </span>
      <div className="seg" role="radiogroup" aria-label="Preview role">
        {OPTIONS.map((opt) => {
          const active = role === opt.role;
          return (
            <button
              key={opt.role}
              type="button"
              role="radio"
              aria-checked={active}
              className={`seg-opt${active ? " is-active" : ""}`}
              onClick={() => select(opt.role)}
            >
              <Icon name={opt.icon} size={15} />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
