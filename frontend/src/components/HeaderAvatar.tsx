"use client";

import Image from "next/image";
import { useSession } from "@/providers/SessionProvider";

export default function HeaderAvatar() {
  const { user } = useSession();
  const avatar = user?.avatar && user?.avatar !== "/avatars/thumbs.svg"
    ? user.avatar
    : "/avatars/thumbs.svg";

  return (
    <div className="absolute top-6 left-6 lg:top-8 lg:left-8">
      <div className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden border-2 border-white">
        <Image
          src={avatar}
          alt="Profile"
          width={80}
          height={80}
          className="object-cover w-full h-full"
          unoptimized={true}
        />
      </div>
    </div>
  );
}
