import {
  ActionIconProps,
  ActionIcon as MantineButtonIcon,
  MantineSize,
} from "@mantine/core";
import { BaseIcon } from "@/components/ui/BaseIcon";
import { IconType } from "@/shared/utils/branding";

export type ButtonIconProps = {
  icon: IconType;
  size?: number | MantineSize;
  isIconOnly?: boolean;
  withBorder?: boolean;
} & ActionIconProps &
  React.ComponentPropsWithoutRef<"button">;

export function ButtonIcon({
  icon,
  size,
  isIconOnly,
  color,
  withBorder = false,
  ...props
}: ButtonIconProps) {
  return (
    <MantineButtonIcon
      {...props}
      size={size}
      color={color}
      {...(isIconOnly && { variant: "transparent" })}
      {...(!withBorder && { bd: 0 })}
    >
      <BaseIcon icon={icon} color={isIconOnly ? color : undefined} />
    </MantineButtonIcon>
  );
}
