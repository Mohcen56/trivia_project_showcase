"use client";
import React, { useRef, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";
import { VerifyIcon } from "@/components/ui/verify-badge";
import { useSession } from "@/providers/SessionProvider";

const Icon = {
  User: (p: React.SVGProps<SVGSVGElement>) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Settings: (p: React.SVGProps<SVGSVGElement>) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6M1 12h6m6 0h6" />
    </svg>
  ),
  CreditCard: (p: React.SVGProps<SVGSVGElement>) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  ),
  Help: (p: React.SVGProps<SVGSVGElement>) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  ),
  LogOut: (p: React.SVGProps<SVGSVGElement>) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  ),
};

interface UserDropdownProps {
  align?: "left" | "right";
}

export default function UserDropdown({ align = "left" }: UserDropdownProps) {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Check if user is premium from the user object itself
  const isPremium = user?.is_premium ?? false;

  const avatarSrc = useMemo(() => {
    if (!user?.avatar || user.avatar === "/avatars/thumbs.svg")
      return "/avatars/thumbs.svg";
    return user.avatar;
  }, [user?.avatar]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutAction();
    router.push("/login");
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
  };

  // Add event listener for clicks outside
  React.useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't render if no user
  if (!user) return null;

  const sideClass = align === "left" ? "left-0" : "right-0";
  const arrowSide = align === "left" ? "left-4" : "right-4";

  return (
    <div className="flex z-50" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-12 h-12 rounded-full overflow-hidden hover:ring-2 hover:ring-offset-2 hover:ring-primary transition-all"
        aria-label="Toggle user profile menu"
        title="Profile menu"
      >
        <Image
          src={avatarSrc}
          alt="Profile"
          width={80}
          height={80}
          className="object-cover w-full h-full"
          unoptimized={true}
          onError={(e) =>
            ((e.target as HTMLImageElement).src = "/avatars/thumbs.svg")
          }
        />
      </button>

      {open && (
        <div
          className={`absolute ${sideClass} left-14 sm:left-25 top-14 w-70 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 z-[9999] p-2`}
        >
          <div
            className={`absolute ${arrowSide} -top-1.5 w-3 h-3 bg-white dark:bg-zinc-900 border-t border-l border-gray-200 dark:border-zinc-700 rotate-45`}
          />

          {/* Header */}
          {user && (
            <div className="px-1 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold">
                  <Image
                    src={avatarSrc}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="object-cover w-full h-full rounded-full"
                    unoptimized={true}
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src =
                        "/avatars/thumbs.svg")
                    }
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    {user.username}
                    {isPremium && (
                      <VerifyIcon type="premium" size="xs" />
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {user.email}
                  </div>
                 
                 
                </div>
              </div>
            </div>
          )}

          {/* Menu */}
          <div className="py-1">
           
              
                <MenuItem
                  icon={<Icon.User />}
                  text="Your Profile"
                  onClick={() => router.push("/profile")}
                />
            
                <MenuItem
                  icon={<Icon.CreditCard />}
                  text="Billing & Plans"
                  onClick={() => router.push("/plans")}
                />
                <div className="my-2 h-px bg-zinc-200 dark:bg-zinc-700" />
                <MenuItem
                  icon={<Icon.LogOut />}
                  text={isLoggingOut ? "Signing out..." : "Sign Out"}
                  danger
                  onClick={handleLogout}
                />
             
            
          </div>
        </div>
      )}
    </div>
  );
}

// Small subcomponent for consistency
function MenuItem({
  icon,
  text,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-3 ${
        danger ? "text-red-600" : "text-zinc-700 dark:text-zinc-300"
      }`}
    >
      {icon}
      {text}
    </button>
  );
}
