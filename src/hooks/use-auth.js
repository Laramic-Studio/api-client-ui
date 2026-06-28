import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getClient } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/errors";
import { authKeys } from "@/lib/api/query-keys";
import { clearSession, fetchSession, applyOnboardingComplete } from "@/lib/api/session";
import * as authApi from "@/lib/api/auth-api";
import { completeOnboarding } from "@/lib/api/onboarding-api";
import { mapApiUser } from "@/lib/api/map-user";
import { getAccessToken } from "@/lib/auth/tokens";
import { useAppStore } from "@/store/useAppStore";

export { getErrorMessage } from "@/lib/api/errors";

/** Restore session on app load (runs inside AuthGate). */
export function useAuthBootstrap() {
  const finishAuthBootstrap = useAppStore((s) => s.finishAuthBootstrap);
  const hasToken = Boolean(getAccessToken());
  const enabled = hasToken;
  const finished = useRef(false);

  const { isFetched, isError } = useQuery({
    queryKey: authKeys.session(),
    queryFn: fetchSession,
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (finished.current) return;

    if (!hasToken) {
      clearSession();
      finishAuthBootstrap();
      finished.current = true;
      return;
    }

    if (isFetched) {
      if (isError) clearSession();
      finishAuthBootstrap();
      finished.current = true;
    }
  }, [finishAuthBootstrap, hasToken, isFetched, isError]);
}

export function useSession() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: fetchSession,
    enabled: Boolean(getAccessToken()),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials) => getClient().login(credentials),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.session(), user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => getClient().register(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.session(), user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => getClient().logout(),
    onSettled: () => {
      clearSession();
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload) => authApi.forgotPassword(payload),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload) => authApi.resetPassword(payload),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: ({ code }) => authApi.verifyEmail({ code }),
    onSuccess: () => {
      useAppStore.getState().updateUser({ emailVerified: true });
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: () => authApi.resendVerificationEmail(),
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const data = await completeOnboarding(payload);
      const user = await applyOnboardingComplete(data);
      return { ...data, user };
    },
    onSuccess: (result) => {
      queryClient.setQueryData(authKeys.session(), result.user);
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const currentTeam = useAppStore((s) => s.currentTeam);

  return useMutation({
    mutationFn: (payload) => authApi.updateProfile(payload),
    onSuccess: (data) => {
      const user = mapApiUser(data.user, currentTeam);
      useAppStore.getState().updateUser(user);
      queryClient.setQueryData(authKeys.session(), user);
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (payload) => authApi.updatePassword(payload),
  });
}
