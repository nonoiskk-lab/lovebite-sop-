"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import {
  adjustStock,
  isExpiringSoon,
  listCategories,
  listItems,
  type InventoryCategory,
  type InventoryItem,
} from "@/lib/inventory";
import { Card, CardKicker, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag } from "@/components/ui/tag";
import { Icon } from "@/components/icon";
import { ItemForm } from "./inventory/item-form";
import { HistoryPanel } from "./inventory/history-panel";

function Stat({ kicker, value, danger }: { kicker: string; value: number; danger?: boolean }) {
  return (
    <Card>
      <CardKicker>{kicker}</CardKicker>
      <div
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: 28,
          fontWeight: 700,
          color: danger && value > 0 ? "var(--color-danger)" : "var(--color-text)",
        }}
      >
        {value}
      </div>
    </Card>
  );
}

export function InventoryDashboard() {
  const role = useStore((s) => s.role);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [stockActionId, setStockActionId] = useState<string | null>(null);
  const [stockAmount, setStockAmount] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [i, c] = await Promise.all([listItems(), listCategories()]);
      setItems(i);
      setCategories(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inventory.");
    }
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const lowStock = items.filter((i) => i.quantity > 0 && i.quantity < i.minStock).length;
  const outOfStock = items.filter((i) => i.quantity <= 0).length;
  const expiringSoon = items.filter((i) => isExpiringSoon(i.expiryDate)).length;

  const filtered = items.filter((i) => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || i.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const submitStock = async (itemId: string, type: "in" | "out") => {
    const amt = parseFloat(stockAmount);
    if (!amt || amt <= 0) return;
    try {
      await adjustStock(itemId, type, amt);
      setStockActionId(null);
      setStockAmount("");
      void refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Stock update failed.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: 0 }}>Inventory</h3>
          <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
            Stock levels across all categories
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <Button variant="secondary" onClick={() => setShowHistory(true)}>
            <Icon name="Clock" size={16} />
            History
          </Button>
          {role === "manager" && (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <Icon name="Plus" size={16} />
              Add Item
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            fontSize: 13,
            color: "var(--color-accent-700)",
            background: "var(--color-danger-bg)",
            border: "1px solid var(--color-accent-200)",
            borderRadius: "var(--radius-md)",
            padding: "10px 14px",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 12,
        }}
      >
        <Stat kicker="Total Items" value={items.length} />
        <Stat kicker="Low Stock" value={lowStock} danger />
        <Stat kicker="Out of Stock" value={outOfStock} danger />
        <Stat kicker="Expiring Soon" value={expiringSoon} danger />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Icon
            name="MagnifyingGlass"
            size={16}
            color="var(--color-muted)"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
          />
          <Input
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input"
          style={{ flex: "0 1 180px", minHeight: 44 }}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-muted" style={{ fontSize: 13 }}>
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-muted" style={{ textAlign: "center", padding: 24, fontSize: 13 }}>
          No items found.
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((item) => {
            const low = item.quantity > 0 && item.quantity < item.minStock;
            const out = item.quantity <= 0;
            const expiring = isExpiringSoon(item.expiryDate);
            return (
              <Card key={item.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-accent-100)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "none",
                    }}
                  >
                    <Icon name="Package" size={18} color="var(--color-accent-600)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <CardTitle>{item.name}</CardTitle>
                    <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
                      {item.categoryName} · {item.quantity} {item.unit}
                    </div>
                  </div>
                  {out && <Tag variant="tag-danger">Out of Stock</Tag>}
                  {!out && low && <Tag variant="tag-warning">Low Stock</Tag>}
                  {expiring && <Tag variant="tag-danger">Expiring Soon</Tag>}
                </div>

                {stockActionId === item.id ? (
                  <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder={`Qty (${item.unit})`}
                      value={stockAmount}
                      onChange={(e) => setStockAmount(e.target.value)}
                      style={{ maxWidth: 120 }}
                    />
                    {role === "manager" && (
                      <Button variant="primary" onClick={() => submitStock(item.id, "in")}>
                        <Icon name="ArrowCircleUp" size={16} />
                        Stock In
                      </Button>
                    )}
                    <Button variant="secondary" onClick={() => submitStock(item.id, "out")}>
                      <Icon name="ArrowCircleDown" size={16} />
                      Stock Out
                    </Button>
                    <Button
                      variant="ghost"
                      icon
                      aria-label="Cancel"
                      onClick={() => {
                        setStockActionId(null);
                        setStockAmount("");
                      }}
                    >
                      <Icon name="X" size={16} />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    style={{ marginTop: 8, alignSelf: "flex-start" }}
                    onClick={() => setStockActionId(item.id)}
                  >
                    Update Stock
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {showForm && (
        <ItemForm
          categories={categories}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            void refresh();
          }}
        />
      )}

      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
    </div>
  );
}
