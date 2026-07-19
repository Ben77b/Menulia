"use client";

import { useState } from "react";
import type { BusinessExpense, ExpenseCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";

const CATEGORIES: ExpenseCategory[] = [
  "Staff",
  "Inventory",
  "Rent",
  "Utilities",
  "Marketing",
];

interface ExpenseLedgerProps {
  initialExpenses: BusinessExpense[];
  restaurantId: string;
}

export function ExpenseLedger({ initialExpenses, restaurantId }: ExpenseLedgerProps) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Staff" as ExpenseCategory,
    expense_date: new Date().toISOString().split("T")[0],
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.amount) return;
    setExpenses((prev) => [
      {
        id: `exp-new-${Date.now()}`,
        restaurant_id: restaurantId,
        title: form.title,
        amount: parseFloat(form.amount),
        category: form.category,
        expense_date: form.expense_date,
      },
      ...prev,
    ]);
    setForm({ title: "", amount: "", category: "Staff", expense_date: form.expense_date });
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <h3 className="text-lg font-semibold">Expense Ledger</h3>
      <p className="mb-6 text-sm text-text-secondary">Log and track operational costs</p>

      <form onSubmit={handleAdd} className="mb-6 flex flex-wrap gap-3">
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="flex-1 rounded-xl border border-border px-3 py-2 text-sm"
        />
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="w-28 rounded-xl border border-border px-3 py-2 text-sm"
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
          className="rounded-xl border border-border px-3 py-2 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="date"
          value={form.expense_date}
          onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
          className="rounded-xl border border-border px-3 py-2 text-sm"
        />
        <Button type="submit" size="sm">Add</Button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-secondary">
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Title</th>
              <th className="pb-2 font-medium">Category</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0">
                <td className="py-3 text-text-secondary">{e.expense_date}</td>
                <td className="max-w-[10rem] truncate py-3" title={e.title}>
                  {e.title}
                </td>
                <td className="py-3">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{e.category}</span>
                </td>
                <td className="py-3 text-right font-medium">€{e.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
