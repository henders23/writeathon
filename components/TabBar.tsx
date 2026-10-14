"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Flame, Grid, Users } from "./Icons";

const tabs = [
  { href: "/", label: "Today", Icon: Flame },
  { href: "/pattern", label: "Pattern", Icon: Grid },
  { href: "/bank", label: "Bank", Icon: Bookmark },
  { href: "/group", label: "Group", Icon: Users },
];

export default function TabBar() {
  const path = usePathname();
  return (
    <nav className="tabbar" aria-label="Main">
      {tabs.map(({ href, label, Icon }) => {
        const active = path === href;
        return (
          <Link key={href} href={href} className="tab" aria-current={active ? "page" : undefined}>
            <Icon />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
