import { IconLogout } from "@tabler/icons-react";
import { Box, Button, MenuItem } from "@mantine/core";
import { onLogoutConfirmation } from "@/components/auth/LogoutConfirmation";
import { ICON_SIZE_SM } from "@/shared/utils/constants";

export const LogoutButton = () => {
  return (
    <Box p="sm">
      <Button
        variant="default"
        styles={{
          root: {
            borderColor: "transparent",
          },
          inner: { justifyContent: "flex-start" },
        }}
        leftSection={<IconLogout size={ICON_SIZE_SM} />}
        fullWidth
        onClick={onLogoutConfirmation}
      >
        Logout
      </Button>
    </Box>
  );
};

export const LogoutMenuItem = () => {
  return (
    <MenuItem
      leftSection={<IconLogout size={ICON_SIZE_SM} />}
      onClick={onLogoutConfirmation}
    >
      Logout
    </MenuItem>
  );
};
