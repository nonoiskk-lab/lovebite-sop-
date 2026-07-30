"use client";

import { getSupabaseClient } from "@/lib/supabase/client";

export interface InventoryCategory {
  id: string;
  name: string;
}

export interface InventoryItem {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  unit: string;
  quantity: number;
  purchasePrice: number | null;
  minStock: number;
  expiryDate: string | null;
  supplier: string | null;
  notes: string | null;
}

export interface InventoryTx {
  id: string;
  itemId: string;
  itemName: string;
  changeType: "in" | "out";
  quantityChanged: number;
  actorName: string;
  createdAt: string;
}

export interface NewItemInput {
  categoryId: string;
  name: string;
  unit: string;
  quantity: number;
  purchasePrice: number | null;
  minStock: number;
  expiryDate: string | null;
  supplier: string | null;
  notes: string | null;
}

function sb() {
  const c = getSupabaseClient();
  if (!c) throw new Error("Backend not configured.");
  return c;
}

export async function listCategories(): Promise<InventoryCategory[]> {
  const { data, error } = await sb()
    .from("inventory_categories")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createCategory(name: string): Promise<InventoryCategory> {
  const { data: userRes } = await sb().auth.getUser();
  const uid = userRes.user?.id;
  const { data: profile } = await sb().from("users").select("restaurant_id").eq("id", uid).single();
  const { data, error } = await sb()
    .from("inventory_categories")
    .insert({ name, restaurant_id: profile?.restaurant_id, created_by: uid, updated_by: uid })
    .select("id, name")
    .single();
  if (error) throw error;
  return data;
}

export async function listItems(): Promise<InventoryItem[]> {
  const { data, error } = await sb()
    .from("inventory_items")
    .select("id, name, unit, quantity, purchase_price, min_stock, expiry_date, supplier, notes, category_id, inventory_categories(name)")
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    categoryId: r.category_id,
    categoryName: (r.inventory_categories as unknown as { name: string } | null)?.name ?? "",
    name: r.name,
    unit: r.unit,
    quantity: Number(r.quantity),
    purchasePrice: r.purchase_price === null ? null : Number(r.purchase_price),
    minStock: Number(r.min_stock),
    expiryDate: r.expiry_date,
    supplier: r.supplier,
    notes: r.notes,
  }));
}

export async function createItem(input: NewItemInput): Promise<void> {
  const { data: userRes } = await sb().auth.getUser();
  const uid = userRes.user?.id;
  const { data: profile } = await sb().from("users").select("restaurant_id").eq("id", uid).single();
  const { error } = await sb().from("inventory_items").insert({
    restaurant_id: profile?.restaurant_id,
    category_id: input.categoryId,
    name: input.name,
    unit: input.unit,
    quantity: input.quantity,
    purchase_price: input.purchasePrice,
    min_stock: input.minStock,
    expiry_date: input.expiryDate,
    supplier: input.supplier,
    notes: input.notes,
    created_by: uid,
    updated_by: uid,
  });
  if (error) throw error;
}

/** Stock in/out: updates item quantity and appends a transaction row. */
export async function adjustStock(
  itemId: string,
  changeType: "in" | "out",
  amount: number,
): Promise<void> {
  const client = sb();
  const { data: userRes } = await client.auth.getUser();
  const uid = userRes.user?.id;

  const { data: item, error: itemErr } = await client
    .from("inventory_items")
    .select("quantity, restaurant_id")
    .eq("id", itemId)
    .single();
  if (itemErr || !item) throw itemErr ?? new Error("Item not found.");

  const delta = changeType === "in" ? amount : -amount;
  const resulting = Math.max(0, Number(item.quantity) + delta);

  const { error: updErr } = await client
    .from("inventory_items")
    .update({ quantity: resulting, updated_by: uid })
    .eq("id", itemId);
  if (updErr) throw updErr;

  const { error: txErr } = await client.from("inventory_transactions").insert({
    restaurant_id: item.restaurant_id,
    item_id: itemId,
    change_type: changeType,
    quantity_changed: amount,
    resulting_quantity: resulting,
    actor_id: uid,
  });
  if (txErr) throw txErr;
}

export async function listHistory(): Promise<InventoryTx[]> {
  const { data, error } = await sb()
    .from("inventory_transactions")
    .select("id, item_id, change_type, quantity_changed, created_at, inventory_items(name), users(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    itemId: r.item_id,
    itemName: (r.inventory_items as unknown as { name: string } | null)?.name ?? "",
    changeType: r.change_type as "in" | "out",
    quantityChanged: Number(r.quantity_changed),
    actorName: (r.users as unknown as { full_name: string } | null)?.full_name ?? "System",
    createdAt: r.created_at,
  }));
}

export function isExpiringSoon(expiryDate: string | null, daysAhead = 3): boolean {
  if (!expiryDate) return false;
  const diff = (new Date(expiryDate).getTime() - Date.now()) / 86400000;
  return diff >= 0 && diff <= daysAhead;
}
