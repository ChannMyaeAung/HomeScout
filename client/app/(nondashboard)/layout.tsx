"use client";
import Navbar from "@/components/Navbar";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import { useGetAuthUserQuery } from "@/state/api";

const Layout = ({ children }: { children: React.ReactNode }) => {
  // This triggers the getAuthUser queryFn in api.ts, which
  // Calls fetchAuthSession to get the JWT from Amplify (stored in browser after sign-in)
  // Calls getCurrentUser to get the Cognito username/userId
  // Reads custom:role from the JWT payload to determine if user is tenant or manager
  // Hits the backend endpoint /tenants/:id or /managers/:id to get the user's database record
  // Returns everything combined as authUser
  const { data: authUser, error, isLoading } = useGetAuthUserQuery();
  console.log(
    "auth User",
    authUser,
    "| error:",
    error,
    "| loading:",
    isLoading,
  );

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
