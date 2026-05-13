import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const createNewUserInDatabase = async (
  user: any,
  idToken: any,
  userRole: string,
  fetchWithBQ: any,
) => {
  const createEndpoint =
    userRole?.toLowerCase() === "manager" ? "/managers" : "/tenants";

  const createUserResponse = await fetchWithBQ({
    url: createEndpoint,
    method: "POST",
    body: {
      cognitoId: user.userId,
      name: user.username,
      email: idToken?.payload.email || "",
      phoneNumber: "", // we don't get phone number from cognito, so we can just set it to empty string for now
    },
  });

  if (createUserResponse.error) {
    throw new Error("Failed to create user record");
  }

  return createUserResponse;
};

// Strips filter fields that represent "no selection" before they are sent as
// query params. Redux state always has a value for every field, so without this
// step the API would receive noise like `beds=any` or `priceRange=null,null`.
export function cleanParams(params: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([_, value]) =>
        value !== undefined &&
        value !== "any" && // dropdown sentinel: user picked nothing
        value !== "" &&
        // For tuple ranges [min, max]: keep only if at least one bound is set.
        // For scalars: drop nulls.
        (Array.isArray(value) ? value.some((v) => v !== null) : value !== null),
    ),
  );
}

export function formatPriceValue(value: number | null, isMin: boolean) {
  if (value === null || value === 0) {
    return isMin ? "Any Min Price" : "Any Max Price";
  }
  if (value >= 1000) {
    const kValue = value / 1000;
    return isMin ? `$${kValue}k+` : `<$${kValue}k`;
  }
  return isMin ? `$${value}+` : `<$${value}`;
}
