export interface InventoryItem {
  id: number;
  name: string;
  total_count: number;
  available_count: number;
  in_progress_count: number;
  used_count: number;
}

export interface Participant {
  id: number;
  name: string;
}

export interface Order {
  id: number;
  participant_id: number;
  participant_name: string;
  item_id: number;
  item_name: string;
  quantity: number;
  status: "in_progress" | "completed" | "cancelled";
  created_at: string;
}
