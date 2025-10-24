import { Text, TextProps, Title } from "@mantine/core";

type Props = {
  title: string;
  fontSize?: string | number;
};

const orders = {
  section: 5 as const,
  feature: 6 as const,
} as const;

// Base component for reuse
const BaseHeading = ({
  title,
  type,
  fontSize,
}: Props & { type: keyof typeof orders }) => {
  const order = orders[type];
  return (
    <Title order={order} size={fontSize}>
      {title}
    </Title>
  );
};

// Main component with variants
export const TextVariants = {
  Section: ({ title, fontSize }: Props) => (
    <BaseHeading title={title} type="section" fontSize={fontSize} />
  ),
  Feature: ({ title, fontSize }: Props) => (
    <BaseHeading title={title} type="feature" fontSize={fontSize} />
  ),
  Value: ({ value }: { value: string | number }) => (
    <Text fw={500} fz="48px" lh="48px" c="primary.4">
      {value}
    </Text>
  ),
  Label: ({ title, fontSize = 16 }: Props) => (
    <Text fz={fontSize} fw={500}>
      {title}
    </Text>
  ),
  Description: ({
    description,
    size = "sm",
    textAlign,
  }: {
    description: string;
    size?: TextProps["size"];
    textAlign?: TextProps["ta"];
  }) => (
    <Text size={size} c="grey.9" ta={textAlign}>
      {description}
    </Text>
  ),
};
