import {
  InputLabel,
  SegmentedControl,
  SegmentedControlProps,
  Stack,
} from "@mantine/core";
import { TextVariants } from "@/components/ui/TextVariants";

interface Props extends SegmentedControlProps {
  label?: React.ReactNode;
  description?: string;
  required?: boolean;
}

export const SegmentedControlInput = ({
  label,
  description,
  required,
  mt,
  px,
  hidden,
  ...props
}: Props) => {
  if (hidden) return null;

  return (
    <Stack gap={2} mt={mt} px={px} w="auto">
      {label && (
        <InputLabel required={required} size="sm">
          {label}
        </InputLabel>
      )}
      {description && (
        <TextVariants.Description description={description} size="xs" />
      )}
      <SegmentedControl {...props} />
    </Stack>
  );
};
