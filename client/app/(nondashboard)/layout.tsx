"use client";
import Navbar from "@/components/Navbar";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import { useGetAuthUserQuery } from "@/state/api";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  // This triggers the getAuthUser queryFn in api.ts, which
  // Calls fetchAuthSession to get the JWT from Amplify (stored in browser after sign-in)
  // Calls getCurrentUser to get the Cognito username/userId
  // Reads custom:role from the JWT payload to determine if user is tenant or manager
  // Hits the backend endpoint /tenants/:id or /managers/:id to get the user's database record
  // Returns everything combined as authUser
  const {
    data: authUser,
    error,
    isLoading: authLoading,
  } = useGetAuthUserQuery();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      const userRole = authUser.userRole.toLowerCase();
      if (
        (userRole === "manager" && pathname.startsWith("/search")) ||
        (userRole === "manager" && pathname === "/")
      ) {
        router.push("/managers/properties", { scroll: false });
      }
    }
  }, [authUser, router, pathname]);

  if (authLoading || isLoading) return <>Loading...</>;

  if (!authUser?.userRole) return null;

  return (
    <div className="h-full w-full">
      <Navbar />
      <main
        className={`h-full flex w-full flex-col`}
        style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
