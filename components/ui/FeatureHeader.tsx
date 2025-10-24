"use client";

import { Fragment } from "react";
import { Flex, Group, Stack, Tooltip } from "@mantine/core";
import { ButtonIcon } from "@/components/ui/ButtonIcon";
import { TextVariants } from "@/components/ui/TextVariants";
import { IconType } from "@/shared/utils/branding";

export type FeatureHeaderProps = {
  title: string;
  description?: string | string[];
  type?: "Feature" | "Section" | "Label";
  icon?: React.ReactNode;
  fontSize?: number | string;
  titleButtonIcon?: IconType;
  titleButtonTooltip?: string;
  rightSection?: React.ReactNode;
  onClick?: () => any;
  alignCenter?: boolean;
  applyFzToDescription?: boolean;
  iconPosition?: "flex-start" | "flex-end" | "center";
};

export const FeatureHeader = ({
  title,
  description,
  type = "Feature",
  icon,
  fontSize,
  titleButtonIcon,
  titleButtonTooltip,
  onClick,
  alignCenter = false,
  rightSection,
  applyFzToDescription = false,
  iconPosition = "center",
}: FeatureHeaderProps) => {
  const Header = TextVariants[type];

  const TitleButtonWrapper = titleButtonTooltip ? Tooltip : Fragment;

  if (typeof description === "string") {
    description = [description];
  }

  const textAlignObj = alignCenter
    ? { textAlign: "center" as const }
    : undefined;

  const descriptionRenderer = description?.map((item, index) => (
    <TextVariants.Description
      key={index}
      description={item}
      {...textAlignObj}
      size={
        applyFzToDescription && typeof fontSize === "string"
          ? fontSize
          : undefined
      }
    />
  ));

  const titleRenderer = (
    <Stack gap="xs" align={alignCenter ? "center" : undefined}>
      <Group gap="xs">
        <Header title={title} fontSize={fontSize} />
        {onClick && titleButtonIcon && (
          <TitleButtonWrapper label={titleButtonTooltip}>
            <ButtonIcon
              icon={titleButtonIcon}
              onClick={onClick}
              variant="subtle"
              color="dark"
            />
          </TitleButtonWrapper>
        )}
      </Group>
      {description && descriptionRenderer}
    </Stack>
  );

  return (
    <Flex
      align={!description ? "center" : "flex-start"}
      w={alignCenter ? undefined : "100%"}
      gap="xl"
    >
      <Group gap="sm" align={iconPosition}>
        {icon && icon}
        {titleRenderer}
      </Group>
      {rightSection && rightSection}
    </Flex>
  );
};
