"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Stack,
  Title,
  Text,
  Badge,
  Group,
  Divider,
  Card,
} from "@mantine/core";
import type { InventoryItem, Order } from "@/lib/types";

function groupByParticipant(orders: Order[]): Record<string, Order[]> {
  return orders.reduce<Record<string, Order[]>>((acc, order) => {
    if (!acc[order.participant_name]) acc[order.participant_name] = [];
    acc[order.participant_name].push(order);
    return acc;
  }, {});
}

export default function ViewPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const [invRes, ordRes] = await Promise.all([
      fetch("/api/inventory"),
      fetch("/api/orders"),
    ]);
    setInventory(await invRes.json());
    setOrders(await ordRes.json());
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10_000);
    return () => clearInterval(interval);
  }, [load]);

  const grouped = groupByParticipant(orders);
  const participantNames = Object.keys(grouped).sort();

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Title order={2}>Grill Status</Title>
        <Badge variant="light" color="gray" size="xs">
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
            : "Loading…"}
        </Badge>
      </Group>

      <Stack gap="xs">
        <Text fw={600} size="sm" tt="uppercase" c="dimmed">
          Inventory
        </Text>
        {inventory.length === 0 ? (
          <Text size="sm" c="dimmed">No items.</Text>
        ) : (
          inventory.map((item) => (
            <Group key={item.id} justify="space-between" py={4}>
              <Text size="sm">{item.name}</Text>
              <Badge
                color={item.available_count === 0 ? "red" : "green"}
                variant="light"
                size="sm"
              >
                {item.available_count} / {item.total_count}
              </Badge>
            </Group>
          ))
        )}
      </Stack>

      <Divider />

      <Stack gap="xs">
        <Text fw={600} size="sm" tt="uppercase" c="dimmed">
          In Progress
        </Text>
        {orders.length === 0 ? (
          <Text size="sm" c="dimmed">Nothing in progress.</Text>
        ) : (
          participantNames.map((name) => (
            <Card key={name} withBorder padding="sm">
              <Text fw={700} size="sm" mb={6}>
                {name}
              </Text>
              <Stack gap={4}>
                {grouped[name].map((order) => (
                  <Group key={order.id} gap="xs">
                    <Text size="sm">{order.item_name}</Text>
                    <Badge size="xs" variant="dot" color="blue">
                      ×{order.quantity}
                    </Badge>
                  </Group>
                ))}
              </Stack>
            </Card>
          ))
        )}
      </Stack>
    </Stack>
  );
}
