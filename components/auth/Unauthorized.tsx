import { Center, Divider, Group, Text, Title } from "@mantine/core";

export function Unauthorized() {
  return (
    <Center h="calc(100vh - 172px)">
      <Group>
        <Title order={5} fw={500}>
          401
        </Title>
        <Divider orientation="vertical" />
        <Text>You&apos;re not authorized to access this page.</Text>
      </Group>
    </Center>
  );
}
