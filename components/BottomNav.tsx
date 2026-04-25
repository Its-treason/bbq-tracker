"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  IconShoppingCart,
  IconPackage,
  IconClock,
  IconEye,
} from "@tabler/icons-react";
import classes from "./BottomNav.module.css";

const tabs = [
  { href: "/", label: "Order", icon: IconShoppingCart },
  { href: "/inventory", label: "Inventory", icon: IconPackage },
  { href: "/in-progress", label: "In Progress", icon: IconClock },
  { href: "/view", label: "View", icon: IconEye },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className={classes.nav}>
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <button
            key={href}
            className={`${classes.tab} ${active ? classes.active : ""}`}
            onClick={() => router.push(href)}
          >
            <Icon size={22} stroke={active ? 2.2 : 1.5} />
            <span className={classes.label}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
