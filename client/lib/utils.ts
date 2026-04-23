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
      name: user.name,
      email: idToken?.payload.email || "",
      phoneNumber: "", // we don't get phone number from cognito, so we can just set it to empty string for now
    },
  });

  if (createUserResponse.error) {
    throw new Error("Failed to create user record");
  }

  return createUserResponse;
};
