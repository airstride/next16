import type { MantineSize } from "@mantine/core";
import { theme } from "@/shared/utils/theme";
import * as Icons from "@tabler/icons-react";

export type IconRendererProps = React.ComponentType<{
  size?: number;
  color?: string;
  stroke?: number;
}>;

export type BaseIconComponentProps = {
  icon: keyof typeof Icons;
  size?: number | MantineSize;
  color?: string;
};

export const obtainColorAndIndex = (color: string) => {
  const lastdotIndex = color?.lastIndexOf(".");

  if (!lastdotIndex || lastdotIndex === -1) return { themeColor: color };
  const themeColor = color.substring(0, lastdotIndex);
  const themeIndex = color.substring(lastdotIndex + 1);

  return { themeColor, themeIndex };
};

export function getThemeColor(color?: string) {
  if (!color) return color;
  const { themeColor, themeIndex } = obtainColorAndIndex(color);

  return theme.colors?.[themeColor]?.[Number(themeIndex)] || color;
}
