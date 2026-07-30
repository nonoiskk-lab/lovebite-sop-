import type { Icon as PhosphorIcon, IconWeight } from "@phosphor-icons/react";
import {
  ArrowCircleDown,
  ArrowCircleUp,
  ArrowLeft,
  CashRegister,
  Camera,
  ChartLineUp,
  Check,
  CheckCircle,
  Clock,
  ClockCountdown,
  CookingPot,
  FileXls,
  HourglassMedium,
  MagnifyingGlass,
  Package,
  Plus,
  ShieldCheck,
  Storefront,
  Sun,
  Thermometer,
  Timer,
  Users,
  Warning,
  X,
} from "@phosphor-icons/react";

/**
 * Phosphor icon registry. The design references icons by name (SOP defs,
 * confirm payloads), so we resolve name → component here. Regular weight
 * throughout, per the Nocturne spec.
 */
const REGISTRY: Record<string, PhosphorIcon> = {
  ArrowCircleDown,
  ArrowCircleUp,
  ArrowLeft,
  CashRegister,
  Camera,
  ChartLineUp,
  Check,
  CheckCircle,
  Clock,
  ClockCountdown,
  CookingPot,
  FileXls,
  HourglassMedium,
  MagnifyingGlass,
  Package,
  Plus,
  ShieldCheck,
  Storefront,
  Sun,
  Thermometer,
  Timer,
  Users,
  Warning,
  X,
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
