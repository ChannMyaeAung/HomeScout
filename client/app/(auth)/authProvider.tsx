"use client";
import React, { useEffect } from "react";
import { Amplify } from "aws-amplify";
import { I18n } from "aws-amplify/utils";

import {
  Authenticator,
  Heading,
  PasswordField,
  Radio,
  RadioGroupField,
  TextField,
  useAuthenticator,
  View,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { fetchAuthSession, signOut } from "aws-amplify/auth";
import { usePathname, useRouter } from "next/navigation";

const usernameConstraintError =
  "1 validation error detected: Value at 'username' failed to satisfy constraint: Member must satisfy regular expression pattern: [\\p{L}\\p{M}\\p{S}\\p{N}\\p{P}]+";
const friendlyUsernameError =
  "Choose a username using letters, numbers, spaces, or common symbols.";

I18n.putVocabularies({
  en: {
    [usernameConstraintError]: friendlyUsernameError,
  },
});

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID!,
      userPoolClientId:
        process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID!,
    },
  },
});

// Custom components for the Authenticator
// Header and Footer(Don't have an account? Sign up Here) are implemented here
// Between Header and Footer we have the formFields defined just below.
// Header() + FormFields + Footer() are passed as props to the Authenticator component in the Auth component below.
const components = {
  Header() {
    return (
      <View className="mt-4 ml-1.5 mb-7">
        <Heading level={3} className="text-2xl! font-bold!">
          HOME
          <span className="text-secondary-500 font-light hover:text-primary-300!">
            SCOUT
          </span>
        </Heading>
        <p className="text-muted-foreground mt-2">
          <span className="font-bold">Welcome!</span> Please sign in to continue
        </p>
      </View>
    );
  },

  SignIn: {
    Footer() {
      const { toSignUp } = useAuthenticator();
      return (
        <View className="text-center mt-4">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              onClick={toSignUp}
              className="text-primary cursor-pointer hover:underline bg-transparent border-none p-0"
            >
              Sign up Here
            </button>
          </p>
        </View>
      );
    },
  },

  // For signup, we want to add an additional field for the user to select their role (tenant or manager)
  SignUp: {
    FormFields() {
      const { validationErrors } = useAuthenticator();
      const signUpFields = [
        {
          name: "username",
          label: "Username",
          placeholder: "Choose a username",
          autoComplete: "username",
          isRequired: true,
        },
        {
          name: "email",
          label: "Email",
          placeholder: "Enter your email",
          autoComplete: "email",
          isRequired: true,
        },
        {
          name: "password",
          label: "Password",
          placeholder: "Enter your password",
          autoComplete: "new-password",
          type: "password" as const,
          isRequired: true,
        },
        {
          name: "confirm_password",
          label: "Confirm Password",
          placeholder: "Confirm your password",
          autoComplete: "new-password",
          type: "password" as const,
          isRequired: true,
        },
      ];

      const getFriendlyError = (error: unknown) => {
        const message = Array.isArray(error) ? error[0] : error;

        if (
          typeof message === "string" &&
          message.includes("'username'") &&
          message.includes("failed to satisfy constraint")
        ) {
          return "Choose a username using letters, numbers, spaces, or common symbols.";
        }

        return message;
      };

      return (
        <>
          {signUpFields.map((field) => {
            const errorMessage = getFriendlyError(
              validationErrors?.[field.name],
            );
            const { type, ...fieldWithoutType } = field;
            const fieldProps = {
              ...fieldWithoutType,
              errorMessage,
              hasError: Boolean(errorMessage),
            };

            return type === "password" ? (
              <PasswordField key={field.name} {...fieldProps} />
            ) : (
              <TextField key={field.name} {...fieldProps} />
            );
          })}
          <RadioGroupField
            legend="Role"
            name="custom:role"
            errorMessage={validationErrors?.["custom:role"]}
            hasError={!!validationErrors?.["custom:role"]}
            isRequired
          >
            <Radio value="tenant">Tenant</Radio>
            <Radio value="manager">Manager</Radio>
          </RadioGroupField>
        </>
      );
    },

    Footer() {
      const { toSignIn } = useAuthenticator();
      return (
        <View className="text-center mt-4">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={toSignIn}
              className="text-primary cursor-pointer hover:underline bg-transparent border-none p-0"
            >
              Sign in
            </button>
          </p>
        </View>
      );
    },
  },
};

// Can be found at https://ui.docs.amplify.aws/react/connected-components/authenticator/customization
const formFields = {
  signIn: {
    username: {
      placeholder: "Enter your username",
      label: "Email",
      isRequired: true,
    },
    password: {
      placeholder: "Enter your password",
      label: "Password",
      isRequired: true,
    },
  },
  signUp: {
    username: {
      order: 1,
      placeholder: "Choose a username",
      label: "Username",
      isRequired: true,
    },
    email: {
      order: 2,
      placeholder: "Enter your email",
      label: "Email",
      isRequired: true,
    },
    password: {
      order: 3,
      placeholder: "Enter your password",
      label: "Password",
      isRequired: true,
    },
    confirm_password: {
      order: 4,
      placeholder: "Confirm your password",
      label: "Confirm Password",
      isRequired: true,
    },
  },
};

const Auth = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthenticator((context) => [context.user]);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname.match(/^\/(signin|signup)$/);
  const isDashboardPage =
    pathname.startsWith("/managers") || pathname.startsWith("/tenants");

  // If Amplify has a cached session but the Cognito account no longer exists,
  // force-refresh the token. On failure, sign out to clear the stale session.
  useEffect(() => {
    if (!user) return;
    fetchAuthSession({ forceRefresh: true }).catch(() => signOut());
  }, [user]);

  useEffect(() => {
    if (user && isAuthPage) {
      router.push("/");
    }
  }, [user, isAuthPage, router]);

  // Allow access to public pages without authentication
  if (!isAuthPage && !isDashboardPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Authenticator
        initialState={pathname.includes("signup") ? "signUp" : "signIn"}
        components={components}
        formFields={formFields}
      >
        {() => <>{children}</>}
      </Authenticator>
    </div>
  );
};

export default Auth;
