"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { LogOut, Moon, Sun, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/theme-provider";
import type { UserRole } from "@/generated/prisma/enums";

type RoleColor = "super" | "admin" | "leader" | "mentor" | "student";
const roleColor: Record<UserRole, RoleColor> = {
  SUPER: "super",
  ADMIN: "admin",
  LEADER: "leader",
  MENTOR: "mentor",
  STUDENT: "student",
};

/** Where the avatar's "Profile settings" link points, per role. */
const PROFILE_HREF: Record<UserRole, string> = {
  SUPER: "/super/settings",
  ADMIN: "/admin/settings",
  LEADER: "/leader/settings",
  MENTOR: "/mentor/profile",
  STUDENT: "/student/profile",
};

const subscribeNever = () => () => {};

const itemClass =
  "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground";

interface UserMenuProps {
  role: UserRole;
  userName: string | null;
  initials: string;
  avatarUrl?: string | null;
  signOutAction: () => Promise<void>;
}

function UserMenu({ role, userName, initials, avatarUrl, signOutAction }: UserMenuProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger
        className={cn(
          "relative inline-flex items-center gap-2 rounded-full p-0.5 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40",
        )}
        aria-label="User menu"
      >
        <Avatar size="md">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="Your photo" />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner sideOffset={8} align="end" className="z-50">
          <MenuPrimitive.Popup
            className={cn(
              "min-w-56 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none",
            )}
          >
            <div className="flex flex-col gap-1 px-2 py-2">
              {userName && (
                <span className="truncate text-sm font-medium text-foreground">
                  {userName}
                </span>
              )}
              <Badge role={roleColor[role]} className="w-fit">
                {role}
              </Badge>
            </div>
            <MenuPrimitive.Separator className="my-1 h-px bg-border" />
            <MenuPrimitive.Item
              render={<Link href={PROFILE_HREF[role]} className={itemClass} />}
            >
              <UserRound className="size-4" />
              Profile settings
            </MenuPrimitive.Item>
            <MenuPrimitive.Item
              closeOnClick={false}
              render={
                <button
                  type="button"
                  className={itemClass}
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                />
              }
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {isDark ? "Light mode" : "Dark mode"}
            </MenuPrimitive.Item>
            <MenuPrimitive.Separator className="my-1 h-px bg-border" />
            <form action={signOutAction}>
              <MenuPrimitive.Item render={<button type="submit" className={itemClass} />}>
                <LogOut className="size-4" />
                Sign out
              </MenuPrimitive.Item>
            </form>
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}

export { UserMenu };
