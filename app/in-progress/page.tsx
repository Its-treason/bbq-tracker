"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Stack,
  Title,
  Text,
  Card,
  Group,
  Badge,
  ActionIcon,
  Button,
  Tooltip,
  Modal,
  Slider,
  SegmentedControl,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import type { Order } from "@/lib/types";

function groupByParticipant(orders: Order[]): Record<string, Order[]> {
  return orders.reduce<Record<string, Order[]>>((acc, order) => {
    if (!acc[order.participant_name]) acc[order.participant_name] = [];
    acc[order.participant_name].push(order);
    return acc;
  }, {});
}

function aggregateByItem(orders: Order[]): { item_name: string; quantity: number }[] {
  const totals = new Map<string, number>();
  for (const order of orders) {
    totals.set(order.item_name, (totals.get(order.item_name) ?? 0) + order.quantity);
  }
  return [...totals.entries()]
    .map(([item_name, quantity]) => ({ item_name, quantity }))
    .sort((a, b) => a.item_name.localeCompare(b.item_name));
}

type ViewMode = "by-participant" | "by-item";

export default function InProgressPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [confirmAll, setConfirmAll] = useState(false);
  const [actioning, setActioning] = useState<number | null>(null);
  const [completingAll, setCompletingAll] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelQty, setCancelQty] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("by-participant");

  const load = useCallback(async () => {
    const res = await fetch("/api/orders");
    setOrders(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCancelModal = (order: Order) => {
    setCancelTarget(order);
    setCancelQty(order.quantity);
  };

  const closeCancelModal = () => {
    setCancelTarget(null);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setActioning(cancelTarget.id);
    const res = await fetch(`/api/orders/${cancelTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled", cancel_quantity: cancelQty }),
    });
    setActioning(null);
    closeCancelModal();
    if (!res.ok) {
      const d = await res.json();
      notifications.show({ color: "red", message: d.error });
    } else {
      load();
    }
  };

  const completeOrder = async (id: number) => {
    setActioning(id);
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    setActioning(null);
    if (!res.ok) {
      const d = await res.json();
      notifications.show({ color: "red", message: d.error });
    } else {
      load();
    }
  };

  const completeAll = async () => {
    setCompletingAll(true);
    await fetch("/api/orders/complete-all", { method: "POST" });
    setCompletingAll(false);
    setConfirmAll(false);
    notifications.show({ color: "green", message: "All orders completed." });
    load();
  };

  const grouped = groupByParticipant(orders);
  const participantNames = Object.keys(grouped).sort();
  const itemTotals = aggregateByItem(orders);

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={2}>In Progress</Title>
          {orders.length > 0 && (
            <Button
              color="green"
              size="sm"
              leftSection={<IconCheck size={16} />}
              onClick={() => setConfirmAll(true)}
              loading={completingAll}
            >
              Complete All
            </Button>
          )}
        </Group>

        {orders.length > 0 && (
          <SegmentedControl
            fullWidth
            value={viewMode}
            onChange={(v) => setViewMode(v as ViewMode)}
            data={[
              { label: "By Participant", value: "by-participant" },
              { label: "By Item", value: "by-item" },
            ]}
          />
        )}

        {orders.length === 0 ? (
          <Text c="dimmed" size="sm">
            No orders in progress.
          </Text>
        ) : viewMode === "by-participant" ? (
          participantNames.map((name) => (
            <Card key={name} withBorder padding="sm">
              <Text fw={700} mb="xs" size="sm" tt="uppercase" c="dimmed">
                {name}
              </Text>
              <Stack gap={6}>
                {grouped[name].map((order) => (
                  <Group key={order.id} justify="space-between" align="center" wrap="nowrap">
                    <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" truncate>
                        {order.item_name}
                      </Text>
                      <Badge size="sm" variant="light" color="blue">
                        ×{order.quantity}
                      </Badge>
                    </Group>
                    <Group gap={4}>
                      <Tooltip label="Complete">
                        <ActionIcon
                          color="green"
                          variant="light"
                          size="lg"
                          onClick={() => completeOrder(order.id)}
                          loading={actioning === order.id}
                          aria-label="Complete order"
                        >
                          <IconCheck size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Cancel">
                        <ActionIcon
                          color="red"
                          variant="light"
                          size="lg"
                          onClick={() => openCancelModal(order)}
                          loading={actioning === order.id}
                          aria-label="Cancel order"
                        >
                          <IconX size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                ))}
              </Stack>
            </Card>
          ))
        ) : (
          <Card withBorder padding="sm">
            <Stack gap={6}>
              {itemTotals.map(({ item_name, quantity }) => (
                <Group key={item_name} justify="space-between" align="center" wrap="nowrap">
                  <Text size="sm" truncate style={{ flex: 1, minWidth: 0 }}>
                    {item_name}
                  </Text>
                  <Badge size="lg" variant="light" color="blue">
                    ×{quantity}
                  </Badge>
                </Group>
              ))}
            </Stack>
          </Card>
        )}
      </Stack>

      {/* Cancel modal */}
      <Modal
        opened={cancelTarget !== null}
        onClose={closeCancelModal}
        title="Cancel order"
        size="sm"
      >
        {cancelTarget && (
          <Stack gap="lg">
            <Text size="sm">
              <Text span fw={600}>{cancelTarget.participant_name}</Text>
              {" — "}
              <Text span fw={600}>{cancelTarget.item_name}</Text>
              {" ×"}
              {cancelTarget.quantity}
            </Text>

            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm">How many to cancel?</Text>
                <Text fw={700} size="lg">{cancelQty}</Text>
              </Group>
              <Slider
                min={1}
                max={cancelTarget.quantity}
                value={cancelQty}
                onChange={setCancelQty}
                step={1}
                marks={cancelTarget.quantity <= 10
                  ? Array.from({ length: cancelTarget.quantity }, (_, i) => ({ value: i + 1, label: String(i + 1) }))
                  : [
                      { value: 1, label: "1" },
                      { value: cancelTarget.quantity, label: String(cancelTarget.quantity) },
                    ]
                }
                mb="lg"
              />
            </Stack>

            <Group justify="flex-end">
              <Button variant="default" onClick={closeCancelModal}>
                Never mind
              </Button>
              <Button
                color="red"
                onClick={confirmCancel}
                loading={actioning === cancelTarget.id}
              >
                Cancel {cancelQty === cancelTarget.quantity ? "all" : cancelQty}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Complete all confirm */}
      <Modal
        opened={confirmAll}
        onClose={() => setConfirmAll(false)}
        title="Complete all orders?"
        size="sm"
      >
        <Stack>
          <Text size="sm">
            Mark all {orders.length} in-progress order{orders.length !== 1 ? "s" : ""} as completed?
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmAll(false)}>
              Cancel
            </Button>
            <Button color="green" onClick={completeAll} loading={completingAll}>
              Complete All
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
