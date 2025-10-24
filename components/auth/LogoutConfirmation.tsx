"use client";

import { useLogoutFunction } from "@propelauth/nextjs/client";
import { Group, Stack, Text } from "@mantine/core";
import {
  closeAllModals,
  ContextModalProps,
  openContextModal,
} from "@mantine/modals";
import { DangerButton, SecondaryButton } from "@/components/ui/Button";
import { FeatureHeader } from "@/components/ui/FeatureHeader";

type Props = Record<string, never>;

export const onLogoutConfirmation = () =>
  openContextModal({
    modal: "logoutConfirmation",
    title: <FeatureHeader title="Confirm Logout" />,
    innerProps: {},
    withCloseButton: true,
    onClose: closeAllModals,
  });

export function LogoutConfirmation({ context, id }: ContextModalProps<Props>) {
  const logout = useLogoutFunction();

  const onClose = () => context.closeModal(id);

  const onConfirmLogout = () => {
    onClose();
    logout();
  };

  return (
    <Stack gap="xl">
      <Text size="sm" c="dimmed">
        Are you sure you want to log out? Any unsaved changes may be lost.
      </Text>

      <Group justify="flex-end">
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <DangerButton onClick={onConfirmLogout}>Log out</DangerButton>
      </Group>
    </Stack>
  );
}
