import type { Icon as PhosphorIcon, IconWeight } from "@phosphor-icons/react";
import {
  ArrowLeft,
  CashRegister,
  Camera,
  ChartLineUp,
  Check,
  CheckCircle,
  Clock,
  CookingPot,
  FileXls,
  HourglassMedium,
  ShieldCheck,
  Storefront,
  Sun,
  Thermometer,
  Timer,
  Warning,
} from "@phosphor-icons/react";

/**
 * Phosphor icon registry. The design references icons by name (SOP defs,
 * confirm payloads), so we resolve name → component here. Regular weight
 * throughout, per the Nocturne spec.
 */
const REGISTRY: Record<string, PhosphorIcon> = {
  ArrowLeft,
  CashRegister,
  Camera,
  ChartLineUp,
  Check,
  CheckCircle,
  Clock,
  CookingPot,
  FileXls,
  HourglassMedium,
  ShieldCheck,
  Storefront,
  Sun,
  Thermometer,
  Timer,
  Warning,
};

export interface IconProps {
  name: string;
  size?: number;
  weight?: IconWeight;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 18, weight = "regular", color, className, style }: IconProps) {
  const Cmp = REGISTRY[name] ?? CheckCircle;
  return <Cmp size={size} weight={weight} color={color} className={className} style={style} />;
}
