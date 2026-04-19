import React from "react";
import { Amplify } from "aws-amplify";

import {
  Authenticator,
  components,
  useAuthenticator,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID!,
      userPoolClientId:
        process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID!,
    },
  },
});

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
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Authenticator formFields={formFields}>
        {() => <>{children}</>}
      </Authenticator>
    </div>
  );
};

export default Auth;
