"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Stack,
  Group,
  Title,

  Button,
  Card,
  Text,
  ActionIcon,
  Badge,
  Modal,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconMinus } from "@tabler/icons-react";
import type { InventoryItem, Participant } from "@/lib/types";

export default function OrderPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [newName, setNewName] = useState("");
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [addingLoading, setAddingLoading] = useState(false);

  const load = useCallback(async () => {
    const [invRes, parRes] = await Promise.all([
      fetch("/api/inventory"),
      fetch("/api/participants"),
    ]);
    setInventory(await invRes.json());
    setParticipants(await parRes.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);

  const handleAddParticipant = async () => {
    if (!newName.trim()) return;
    setAddingLoading(true);
    const res = await fetch("/api/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    setParticipants((prev) => [...prev, { id: data.id, name: newName.trim() }]);
    setParticipantId(String(data.id));
    setNewName("");
    setAddingParticipant(false);
    setAddingLoading(false);
  };

  const handleAssign = async () => {
    if (!participantId || totalItems === 0) return;
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, quantity]) => ({ item_id: Number(itemId), quantity }));

    setAssigning(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participant_id: Number(participantId), items }),
    });
    const data = await res.json();
    setAssigning(false);

    if (!res.ok) {
      notifications.show({
        color: "red",
        title: "Could not assign",
        message: data.error,
      });
      return;
    }

    setQuantities({});
    setParticipantId(null);
    notifications.show({
      color: "green",
      title: "Order assigned",
      message: `${totalItems} item${totalItems !== 1 ? "s" : ""} added to in progress`,
    });
    load();
  };

  const setQty = (itemId: number, val: number) =>
    setQuantities((prev) => ({ ...prev, [itemId]: val }));

  return (
    <>
      <Stack gap="md">
        <Title order={2}>Take Order</Title>

        <Stack gap={6}>
          <Group justify="space-between" align="center">
            <Text size="sm" fw={600}>Participant</Text>
            <Button
              size="xs"
              variant="light"
              leftSection={<IconPlus size={13} />}
              onClick={() => setAddingParticipant(true)}
            >
              New
            </Button>
          </Group>
          {participants.length === 0 ? (
            <Text size="sm" c="dimmed">No participants yet — add one first.</Text>
          ) : (
            <Group gap="xs" wrap="wrap">
              {participants.map((p) => {
                const active = participantId === String(p.id);
                return (
                  <Button
                    key={p.id}
                    variant={active ? "filled" : "default"}
                    onClick={() => setParticipantId(active ? null : String(p.id))}
                    size="sm"
                    radius="md"
                  >
                    {p.name}
                  </Button>
                );
              })}
            </Group>
          )}
        </Stack>

        {inventory.length === 0 ? (
          <Text c="dimmed" size="sm">
            No inventory set up yet. Go to Inventory to add items.
          </Text>
        ) : (
          <Stack gap="xs">
            <Text fw={600} size="sm">
              Items
            </Text>
            {inventory.map((item) => {
              const qty = quantities[item.id] ?? 0;
              const soldOut = item.available_count === 0;
              return (
                <Card key={item.id} padding="sm" withBorder opacity={soldOut ? 0.5 : 1}>
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text fw={500} truncate>
                        {item.name}
                      </Text>
                      <Group gap={6} mt={2}>
                        <Badge size="xs" color={soldOut ? "red" : "green"} variant="light">
                          {soldOut ? "Sold out" : `${item.available_count} left`}
                        </Badge>
                      </Group>
                    </div>
                    <Group gap={6} wrap="nowrap">
                      <ActionIcon
                        size={48}
                        variant="light"
                        color="gray"
                        radius="md"
                        onClick={() => setQty(item.id, Math.max(0, qty - 1))}
                        disabled={qty === 0}
                        aria-label="Decrease"
                      >
                        <IconMinus size={20} />
                      </ActionIcon>
                      <Text w={32} ta="center" fw={700} size="xl" style={{ userSelect: "none" }}>
                        {qty}
                      </Text>
                      <ActionIcon
                        size={48}
                        variant="light"
                        color="blue"
                        radius="md"
                        onClick={() => setQty(item.id, Math.min(item.available_count, qty + 1))}
                        disabled={soldOut || qty >= item.available_count}
                        aria-label="Increase"
                      >
                        <IconPlus size={20} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Card>
              );
            })}
          </Stack>
        )}

        <Button
          size="lg"
          fullWidth
          onClick={handleAssign}
          disabled={!participantId || totalItems === 0}
          loading={assigning}
          mt="xs"
        >
          {totalItems > 0 ? `Assign (${totalItems} item${totalItems !== 1 ? "s" : ""})` : "Assign Order"}
        </Button>
      </Stack>

      <Modal
        opened={addingParticipant}
        onClose={() => {
          setAddingParticipant(false);
          setNewName("");
        }}
        title="New Participant"
        size="sm"
      >
        <Stack>
          <TextInput
            label="Name"
            placeholder="Enter name…"
            value={newName}
            onChange={(e) => setNewName(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddParticipant()}
            autoFocus
            data-autofocus
          />
          <Button
            onClick={handleAddParticipant}
            disabled={!newName.trim()}
            loading={addingLoading}
          >
            Add
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
