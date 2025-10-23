"use client";

import { AuthProvider, useRedirectFunctions, useUser } from "@propelauth/nextjs/client";
import { LoadingOverlay } from "@mantine/core";

type Props = {
  authUrl: string;
  redirectUrl: string;
  children: React.ReactNode;
};

function AuthContent({ redirectUrl, children }: Omit<Props, "authUrl">) {
  const { redirectToLoginPage } = useRedirectFunctions();
  const { loading, isLoggedIn } = useUser();

  if (loading) {
    return <LoadingOverlay visible={true} />;
  }

  if (!isLoggedIn) {
    redirectToLoginPage({ postLoginRedirectPath: redirectUrl });
    return <LoadingOverlay visible={true} />;
  }

  return <>{children}</>;
}

export default function AuthWrapper({ authUrl, children, redirectUrl }: Props) {
  return (
    <AuthProvider authUrl={authUrl}>
      <AuthContent redirectUrl={redirectUrl}>{children}</AuthContent>
    </AuthProvider>
  );
}
