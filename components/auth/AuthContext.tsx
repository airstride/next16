"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  OrgMemberInfo,
  User,
  useRefreshAuth,
  useUser,
  UseUserLoggedIn,
} from "@propelauth/nextjs/client";
import { useClearOrgInviteFromMetadata } from "@/hooks/reactQuery/users/useUserMutations";
import { setAccessTokenGetter } from "@/utils/api";

export interface AuthContextType {
  userName: string;
  organizationName: string;
  role: string;
  accessToken?: string | null;
  organizations: OrgMemberInfo[];
  firstName?: string;
  lastName?: string;
  email?: string;
  pictureUrl?: string;
  userId?: string;
  setActiveOrg: (orgId: string) => Promise<User | undefined>;
  activeOrgId: string | undefined;
  activeOrgMetadata: Record<string, any>;
  invitedOrgId?: string | null;
}

const defaultValue = {
  userName: "",
  organizationName: "",
  organizations: [],
  role: "",
  accessToken: null,
  setActiveOrg: async () => undefined,
  activeOrgId: undefined,
  activeOrgMetadata: {},
  invitedOrgId: null,
};

const AuthContext = createContext<AuthContextType>(defaultValue);

export const useRefreshAuthUser = () => {
  const refreshAuth = useRefreshAuth();

  return async () => {
    await refreshAuth();
  };
};

const generateUserInfo = (userInfo: UseUserLoggedIn): AuthContextType => {
  const firstName = userInfo.user?.firstName ?? "";
  const lastName = userInfo.user?.lastName ?? "";
  let userName = `${firstName} ${lastName}`;
  if (!userName.trim()) {
    userName = userInfo.user?.email ?? "";
  }
  const metadata = userInfo.user?.properties?.metadata as Record<string, any>;
  const invitedOrgId = metadata?.org_invite || null;

  const organizations =
    userInfo.user
      ?.getOrgs()
      ?.sort((a: OrgMemberInfo, b: OrgMemberInfo) => a.orgName.localeCompare(b.orgName)) || [];

  const org = organizations.find((org: OrgMemberInfo) => org.orgId === userInfo.user?.activeOrgId);

  const organizationName = org?.orgName || "";
  const role = org?.userAssignedRole || "";

  const { user, accessToken } = userInfo;

  return {
    userId: user?.userId,
    userName,
    firstName,
    lastName,
    email: user?.email,
    pictureUrl: user?.pictureUrl,
    organizationName,
    role,
    organizations,
    setActiveOrg: userInfo.setActiveOrg,
    activeOrgId: user?.activeOrgId,
    accessToken,
    activeOrgMetadata: org?.orgMetadata || {},
    invitedOrgId,
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userInfo, setUserInfo] = useState<AuthContextType>(defaultValue);
  const user = useUser();
  const { mutateAsync: removeOrgInviteProp } = useClearOrgInviteFromMetadata();

  const handleAuthData = async (data: AuthContextType) => {
    setUserInfo(data);
    if (!data.invitedOrgId) return;

    if (data.invitedOrgId !== data.activeOrgId) {
      await data.setActiveOrg(data.invitedOrgId);
    } else {
      await removeOrgInviteProp(data.userId || "");
    }
  };

  useEffect(() => {
    if (user.accessToken) {
      const data = generateUserInfo(user);
      setAccessTokenGetter(() => user.accessToken);
      handleAuthData(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.accessToken, user.user?.activeOrgId]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => userInfo, [userInfo]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
