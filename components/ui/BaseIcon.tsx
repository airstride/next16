import * as Icons from "@tabler/icons-react";
import { BaseIconComponentProps } from "@/shared/utils/branding";
import { getThemeColor } from "@/shared/utils/branding";

export function BaseIcon({ icon, size = 20, color }: BaseIconComponentProps) {
  const IconRenderer = Icons[icon] as React.ElementType;

  if (!IconRenderer) return null;
  const c = getThemeColor(color);

  return <IconRenderer size={size} {...(color && { color: c })} />;
}
