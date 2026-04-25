"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Stack,
  Title,
  Button,
  Card,
  Text,
  ActionIcon,
  Modal,
  TextInput,
  NumberInput,
  Group,
  Tooltip,
  Badge,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPencil, IconTrash, IconPlus, IconRefresh } from "@tabler/icons-react";
import type { InventoryItem } from "@/lib/types";

interface FormState {
  name: string;
  total_count: number | string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", total_count: "" });
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/inventory");
    setItems(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setForm({ name: "", total_count: "" });
    setAddOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setForm({ name: item.name, total_count: item.total_count });
    setEditItem(item);
  };

  const closeModals = () => {
    setAddOpen(false);
    setEditItem(null);
    setForm({ name: "", total_count: "" });
  };

  const handleSave = async () => {
    const count = Number(form.total_count);
    if (!form.name.trim() || isNaN(count) || count < 0) {
      notifications.show({ color: "red", message: "Enter a valid name and count." });
      return;
    }
    setSaving(true);

    if (editItem) {
      const res = await fetch(`/api/inventory/${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), total_count: count }),
      });
      if (!res.ok) {
        const d = await res.json();
        notifications.show({ color: "red", message: d.error });
      } else {
        notifications.show({ color: "green", message: "Item updated." });
        closeModals();
        load();
      }
    } else {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), total_count: count }),
      });
      if (!res.ok) {
        const d = await res.json();
        notifications.show({ color: "red", message: d.error });
      } else {
        notifications.show({ color: "green", message: "Item added." });
        closeModals();
        load();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (item: InventoryItem) => {
    const res = await fetch(`/api/inventory/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      notifications.show({ color: "red", message: d.error });
    } else {
      notifications.show({ color: "green", message: `"${item.name}" deleted.` });
      load();
    }
  };

  const handleReset = async () => {
    setResetting(true);
    await fetch("/api/reset", { method: "POST" });
    setResetting(false);
    setConfirmReset(false);
    notifications.show({ color: "green", message: "Reset complete. Participants and orders cleared." });
    load();
  };

  const formValid =
    form.name.trim().length > 0 &&
    form.total_count !== "" &&
    Number(form.total_count) >= 0;

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={2}>Inventory</Title>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd} size="sm">
            Add Item
          </Button>
        </Group>

        {items.length === 0 ? (
          <Text c="dimmed" size="sm">
            No items yet. Add something to get started.
          </Text>
        ) : (
          <Stack gap="xs">
            {items.map((item) => (
              <Card key={item.id} withBorder padding="sm">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Text fw={600}>{item.name}</Text>
                  <Group gap={4} wrap="nowrap">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => openEdit(item)}
                      aria-label="Edit"
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                    <Tooltip
                      label="Has in-progress orders"
                      disabled={item.in_progress_count === 0}
                    >
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(item)}
                        disabled={item.in_progress_count > 0}
                        aria-label="Delete"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>
                <Group gap={6} mt={6}>
                  <Badge color={item.available_count === 0 ? "red" : "green"} variant="light" size="sm">
                    {item.available_count} left
                  </Badge>
                  {item.in_progress_count > 0 && (
                    <Badge color="yellow" variant="light" size="sm">
                      ×{item.in_progress_count} in progress
                    </Badge>
                  )}
                  {item.used_count > 0 && (
                    <Badge color="gray" variant="light" size="sm">
                      {item.used_count} used
                    </Badge>
                  )}
                  <Text size="xs" c="dimmed">/ {item.total_count} total</Text>
                </Group>
              </Card>
            ))}
          </Stack>
        )}

        <Divider mt="xl" />
        <Group justify="space-between" align="center" mt="md">
          <div>
            <Text fw={500} size="sm">Full Reset</Text>
            <Text size="xs" c="dimmed">
              Clears all participants and orders. Inventory counts are restored.
            </Text>
          </div>
          <Button
            color="red"
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={() => setConfirmReset(true)}
            size="sm"
          >
            Reset
          </Button>
        </Group>
      </Stack>

      <Modal
        opened={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Full Reset?"
        size="sm"
      >
        <Stack>
          <Text size="sm">
            This will delete all participants and orders, and restore all inventory counts.
            Inventory item definitions are kept.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={handleReset} loading={resetting}>
              Reset
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={addOpen || editItem !== null}
        onClose={closeModals}
        title={editItem ? `Edit "${editItem.name}"` : "Add Item"}
        size="sm"
      >
        <Stack>
          <TextInput
            label="Name"
            placeholder="e.g. Sausages"
            value={form.name}
            onChange={(e) => { const v = e.currentTarget.value; setForm((f) => ({ ...f, name: v })); }}
            onKeyDown={(e) => e.key === "Enter" && formValid && handleSave()}
            autoFocus
            data-autofocus
          />
          <NumberInput
            label="Total count"
            placeholder="e.g. 20"
            value={form.total_count}
            onChange={(v) => setForm((f) => ({ ...f, total_count: v }))}
            min={0}
            allowDecimal={false}
            clampBehavior="strict"
          />
          {editItem && (
            <Text size="xs" c="dimmed">
              Changing the total adjusts available count by the same delta.
            </Text>
          )}
          <Button onClick={handleSave} disabled={!formValid} loading={saving}>
            {editItem ? "Save" : "Add"}
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
