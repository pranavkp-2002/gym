import {
  LayoutDashboard,
  History,
  ListChecks,
  LineChart,
  Dumbbell,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Other paths that highlight this item (e.g. the logger belongs to Routines). */
  also?: string[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workouts", label: "Workouts", icon: History },
  { href: "/routines", label: "Routines", icon: ListChecks, also: ["/log"] },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/exercises", label: "Exercises", icon: Dumbbell },
];

/** Kept out of the tab bar: the sidebar footer and the mobile top bar link to it. */
export const SETTINGS_ITEM: NavItem = { href: "/settings", label: "Settings", icon: Settings };

export function isActive(pathname: string, item: NavItem) {
  const match = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return match(item.href) || (item.also ?? []).some(match);
}
