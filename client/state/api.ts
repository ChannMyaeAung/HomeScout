import { createNewUserInDatabase } from "@/lib/utils";
import { Manager, Tenant } from "@/types/prisma/browser";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,

    // Every single RTK request goes through this function,
    // which grabs the stored JWT from Amplify (fetchAuthSession)
    // and attaches it as
    // Authorization: Bearer <token> to the HTTP request header.
    prepareHeaders: async (headers) => {
      const session = await fetchAuthSession();
      const { idToken } = session.tokens ?? {};
      if (idToken) {
        headers.set("Authorization", `Bearer ${idToken}`);
      }
      return headers;
    },
  }),
  reducerPath: "api",
  tagTypes: ["Managers", "Tenants"],
  endpoints: (build) => ({
    // Runs once after signing in to answer "who is this JWT user in our database?"
    // Reads the role from the JWT payload
    // Calls /tenants/:id or /managers/:id on the backend
    // Returns the combined Cognito + databse user object
    getAuthUser: build.query<User, void>({
      queryFn: async (_, _queryApi, _extraoptions, fetchWithBQ) => {
        try {
          const session = await fetchAuthSession();
          const { idToken } = session.tokens ?? {};
          const user = await getCurrentUser(); // Get the current authenticated user
          const userRole = idToken?.payload["custom:role"] as string;
          const endpoint =
            userRole === "manager"
              ? `/managers/${user.userId}`
              : `/tenants/${user.userId}`;

          let userDetailsResponse = await fetchWithBQ(endpoint);

          // if user doesn't exist, create new user
          // we are gonna try and call getTenant in /server/src/controllers/tenantControllers.ts and see if it returns 404, if it does, we will create a new tenant with the same cognitoId as the user
          if (
            userDetailsResponse.error &&
            userDetailsResponse.error.status === 404
          ) {
            userDetailsResponse = await createNewUserInDatabase(
              user,
              idToken,
              userRole,
              fetchWithBQ,
            );
          }

          return {
            data: {
              cognitoInfo: { ...user },
              userInfo: userDetailsResponse.data as Tenant | Manager,
              userRole,
            },
          };
        } catch (error: any) {
          return { error: error.message || "Could not fetch user data." };
        }
      },
    }),

    updateTenantSettings: build.mutation<
      Tenant,
      { cognitoId: string } & Partial<Tenant>
    >({
      query: ({ cognitoId, ...updatedTenant }) => {
        return {
          url: `/tenants/${cognitoId}`,
          method: "PUT",
          body: updatedTenant,
        };
      },
      invalidatesTags: (result) => [{ type: "Tenants", id: result?.id }], // refresh tenant data after update
    }),

    updateManagerSettings: build.mutation<
      Manager,
      { cognitoId: string } & Partial<Manager>
    >({
      query: ({ cognitoId, ...updatedManager }) => {
        return {
          url: `/managers/${cognitoId}`,
          method: "PUT",
          body: updatedManager,
        };
      },
      invalidatesTags: (result) => [{ type: "Managers", id: result?.id }],
    }),
  }),
});

export const {
  useGetAuthUserQuery,
  useUpdateTenantSettingsMutation,
  useUpdateManagerSettingsMutation,
} = api;
