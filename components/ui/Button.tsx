"use client";

import {
  Loader,
  Button as MantineButton,
  type MantineSize,
  type ButtonProps,
} from "@mantine/core";
import { BaseIcon } from "@/components/ui/BaseIcon";
import { IconType } from "@/shared/utils/branding";

export type ButtonComponentProps = ButtonProps &
  React.ComponentPropsWithoutRef<"button"> & {
    children: React.ReactNode;
    icon?: IconType;
    iconSize?: number | MantineSize;
    rightIcon?: IconType;
  };

export type CancelButtonProps = {
  onClose: () => void;
  title?: string;
};

function Button({
  children,
  loading,
  icon,
  iconSize,
  rightIcon,
  ...props
}: ButtonComponentProps) {
  const loaderColor = props?.variant === "filled" ? "white" : "dark";
  const SECTION = loading ? (
    <Loader type="oval" color={loaderColor} size="xs" />
  ) : icon ? (
    <BaseIcon icon={icon} size={iconSize} />
  ) : null;
  const RIGHT_SECTION = rightIcon ? (
    <BaseIcon icon={rightIcon} size={iconSize} />
  ) : null;
  const buttonProps = { leftSection: SECTION, rightSection: RIGHT_SECTION };

  return (
    <MantineButton {...buttonProps} {...props}>
      {children}
    </MantineButton>
  );
}

export const PrimaryButton = ({ children, ...props }: ButtonComponentProps) => {
  return (
    <Button variant="filled" {...props}>
      {children}
    </Button>
  );
};

export const SecondaryButton = ({
  children,
  ...props
}: ButtonComponentProps) => {
  return (
    <Button variant="default" {...props}>
      {children}
    </Button>
  );
};

export const DangerButton = ({ children, ...props }: ButtonComponentProps) => {
  return (
    <Button variant="filled" color="red" {...props}>
      {children}
    </Button>
  );
};

export const SubtleDangerButton = ({
  children,
  ...props
}: ButtonComponentProps) => {
  return (
    <Button variant="light" color="red" {...props}>
      {children}
    </Button>
  );
};

export const TertiaryButton = ({
  children,
  ...props
}: ButtonComponentProps) => {
  return (
    <Button variant="outline" {...props}>
      {children}
    </Button>
  );
};

export const SubtleButton = ({ children, ...props }: ButtonComponentProps) => {
  return (
    <Button variant="subtle" {...props}>
      {children}
    </Button>
  );
};

export function CancelButton({ onClose, title = "Cancel" }: CancelButtonProps) {
  return <SecondaryButton onClick={onClose}>{title}</SecondaryButton>;
}

export const BadgeButton = ({ children, ...props }: ButtonComponentProps) => {
  return (
    <Button
      variant="filled"
      color="border.6"
      c="black"
      fz={12}
      fw={500}
      {...props}
    >
      {children}
    </Button>
  );
};
