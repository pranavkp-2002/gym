import {
  LayoutDashboard,
  History,
  Plus,
  LineChart,
  Dumbbell,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workouts", label: "Workouts", icon: History },
  { href: "/log", label: "Log Workout", icon: Plus },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
