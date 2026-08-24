"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() =>
        signOut({
          callbackUrl: "/login",
        })
      }
      className="border border-white px-5 py-3 text-white hover:bg-white hover:text-black transition"
    >
      Logout
    </button>
  );
}