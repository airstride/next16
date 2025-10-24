"use client";

import {
  localStorageColorSchemeManager,
  MantineColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { BaseIcon } from "@/components/ui/BaseIcon";
import { SegmentedControlInput } from "@/components/ui/SegmentedControlInput";

export const colorSchemeManager = localStorageColorSchemeManager({
  key: "airstride-color-scheme",
});

export function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <SegmentedControlInput
      mt="md"
      mb="xs"
      px="sm"
      data={[
        { label: <BaseIcon icon="IconSun" />, value: "light" },
        { label: <BaseIcon icon="IconMoon" />, value: "dark" },
        { label: <BaseIcon icon="IconDeviceLaptop" />, value: "auto" },
      ]}
      value={colorScheme}
      onChange={(value) => setColorScheme(value as MantineColorScheme)}
    />
  );
}
