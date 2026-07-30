"use client";

import { useState } from "react";
import { createCategory, createItem, type InventoryCategory } from "@/lib/inventory";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

const NEW_CATEGORY = "__new__";

export function ItemForm({
  categories,
  onClose,
  onCreated,
}: {
  categories: InventoryCategory[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [minStock, setMinStock] = useState("0");
  const [expiryDate, setExpiryDate] = useState("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !unit.trim()) return setError("Name and unit are required.");
    setBusy(true);
    setError(null);
    try {
      let finalCategoryId = categoryId;
      if (categoryId === NEW_CATEGORY) {
        if (!newCategory.trim()) throw new Error("Enter a category name.");
        const cat = await createCategory(newCategory.trim());
        finalCategoryId = cat.id;
      }
      await createItem({
        categoryId: finalCategoryId,
        name: name.trim(),
        unit: unit.trim(),
        quantity: parseFloat(quantity) || 0,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        minStock: parseFloat(minStock) || 0,
        expiryDate: expiryDate || null,
        supplier: supplier.trim() || null,
        notes: notes.trim() || null,
      });
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add item.");
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 100,
      }}
    >
      <Card
        elevated
        style={{ width: "min(480px, 100%)", maxHeight: "90vh", overflow: "auto", gap: 14 }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <h4 style={{ margin: 0 }}>Add Inventory Item</h4>
          <Button variant="ghost" icon aria-label="Close" onClick={onClose} style={{ marginLeft: "auto" }}>
            <Icon name="X" size={18} />
          </Button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Category" htmlFor="cat">
            <select
              id="cat"
              className="input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value={NEW_CATEGORY}>+ New category…</option>
            </select>
          </Field>
          {categoryId === NEW_CATEGORY && (
            <Field label="New category name" htmlFor="newCat">
              <Input id="newCat" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            </Field>
          )}

          <Field label="Item name" htmlFor="name">
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Quantity" htmlFor="qty">
              <Input id="qty" type="number" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </Field>
            <Field label="Unit (kg, pcs, L…)" htmlFor="unit">
              <Input id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} required />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Purchase price (₹, optional)" htmlFor="price">
              <Input id="price" type="number" inputMode="decimal" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
            </Field>
            <Field label="Minimum stock" htmlFor="min">
              <Input id="min" type="number" inputMode="decimal" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
            </Field>
          </div>

          <Field label="Expiry date (optional)" htmlFor="expiry">
            <Input id="expiry" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </Field>
          <Field label="Supplier (optional)" htmlFor="supplier">
            <Input id="supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          </Field>
          <Field label="Notes (optional)" htmlFor="notes">
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>

          {error && (
            <div style={{ fontSize: 12.5, color: "var(--color-accent-600)" }}>{error}</div>
          )}

          <Button type="submit" variant="primary" block disabled={busy} style={{ minHeight: 46 }}>
            {busy ? "Adding…" : "Add Item"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
