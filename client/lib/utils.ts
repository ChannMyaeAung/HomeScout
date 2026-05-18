import { clsx, type ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind classes, resolving conflicts via tailwind-merge. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Creates a user record in the backend after Cognito sign-up.
 * Routes to /managers or /tenants based on the Cognito group role.
 */
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

/**
 * Strips filter fields that represent "no selection" before building query params.
 * Redux state always carries a value for every field, so without this step the
 * API would receive noise like `beds=any` or `priceRange=null,null`.
 */
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

/** Formats a price bound for display (e.g. 1500 → "$1.5k+", null → "Any Min Price"). */
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

/**
 * Converts a PascalCase enum key into a spaced, human-readable label.
 * e.g. "AirConditioning" → "Air Conditioning", "WiFi" → "Wi Fi"
 */
export function formatEnumString(str: string) {
  // Insert a space before every uppercase letter, then strip any leading space.
  return str.replace(/([A-Z])/g, " $1").trim();
}

type MutationMessages = {
  success?: string;
  error: string;
};

/**
 * Wraps an async mutation with toast feedback.
 * Shows a success toast on resolve or an error toast on rejection,
 * then re-throws so the caller can still handle the error if needed.
 */
export const withToast = async <T>(
  mutationFn: Promise<T>,
  messages: Partial<MutationMessages>,
) => {
  const { success, error } = messages;

  try {
    const result = await mutationFn;
    if (success) toast.success(success);
    return result;
  } catch (err) {
    if (error) toast.error(error);
    throw err;
  }
};
