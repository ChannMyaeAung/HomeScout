import { cleanParams, createNewUserInDatabase, withToast } from "@/lib/utils";
import { Manager, Property, Tenant } from "@/types/prisma/browser";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { FiltersState } from ".";

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
  tagTypes: ["Managers", "Tenants", "Properties"],
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

    // property related endpoints
    getProperties: build.query<
      Property[],
      Partial<FiltersState> & { favoriteIds?: number[] }
    >({
      // query builds the HTTP request
      // takes the filters, strips out any empty/null values via cleanParams
      // then sends a GET /properties?location=... request
      // The params obj is automatically serialized
      // into query string params by RTK Query
      query: (filters) => {
        const params = cleanParams({
          location: filters.location,
          priceMin: filters.priceRange?.[0],
          priceMax: filters.priceRange?.[1],
          beds: filters.beds,
          baths: filters.baths,
          propertyType: filters.propertyType,
          squareFeetMin: filters.squareFeet?.[0],
          squareFeetMax: filters.squareFeet?.[1],
          amenities: filters.amenities?.join(","),
          availableFrom: filters.availableFrom,
          favoriteIds: filters.favoriteIds?.join(","),
          latitude: filters.coordinates?.[1],
          longitude: filters.coordinates?.[0],
        });
        return { url: "properties", params };
      },

      // cache tagging
      // tells RTK Query what the data represens in the cache
      // {type: "Properties", id: 123}
      // If property 123 is later mutated, a mutation can invalidate this tag, which tells RTK Query to refetch any queries that provided this tag
      // If result is undefined (request failed)
      // it still registers "LIST" so future invalidations still work
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Properties" as const, id })),
              { type: "Properties", id: "LIST" },
            ]
          : [{ type: "Properties", id: "LIST" }],

      // side effect on error
      // Hooks into the request lifecycle
      // queryFulfilled is a promise that resolves on success and rejects on error
      // withToast is a utility that shows a toast notification based on the promise result
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch properties",
        });
      },
    }),
  }),
});

export const {
  useGetAuthUserQuery,
  useGetPropertiesQuery,
  useUpdateTenantSettingsMutation,
  useUpdateManagerSettingsMutation,
} = api;
