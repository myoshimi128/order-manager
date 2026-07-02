"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Supplier = {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

type SupplierForm = {
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  website_url: string;
  memo: string;
};

const initialForm: SupplierForm = {
  name: "",
  contact_name: "",
  phone: "",
  email: "",
  website_url: "",
  memo: "",
};

function emptyToNull(value: string) {
  return value.trim() === "" ? null : value.trim();
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState<SupplierForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("一覧取得に失敗しました");
      console.error(error);
      return;
    }

    setSuppliers(data ?? []);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const name = form.name.trim();

    if (!name) {
      alert("購入先名を入力してください");
      return;
    }

    const payload = {
      name,
      contact_name: emptyToNull(form.contact_name),
      phone: emptyToNull(form.phone),
      email: emptyToNull(form.email),
      website_url: emptyToNull(form.website_url),
      memo: emptyToNull(form.memo),
    };

    setLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from("suppliers")
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("suppliers").insert(payload);

        if (error) throw error;
      }

      setForm(initialForm);
      setEditingId(null);
      await fetchSuppliers();
    } catch (error) {
      alert(editingId ? "更新に失敗しました" : "登録に失敗しました");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(supplier: Supplier) {
    setEditingId(supplier.id);

    setForm({
      name: supplier.name,
      contact_name: supplier.contact_name ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      website_url: supplier.website_url ?? "",
      memo: supplier.memo ?? "",
    });
  }

  async function handleDelete(id: string) {
    const ok = confirm("削除しますか？");

    if (!ok) return;

    setLoading(true);

    try {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);

      if (error) throw error;

      if (editingId === id) {
        setEditingId(null);
        setForm(initialForm);
      }

      await fetchSuppliers();
    } catch (error) {
      alert("削除に失敗しました");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(initialForm);
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 24 }}>
      <h1>購入先マスター</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
        <div>
          <label>購入先名</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            disabled={loading}
            style={{ display: "block", width: "100%", marginBottom: 12 }}
          />
        </div>

        <div>
          <label>担当者名</label>
          <input
            name="contact_name"
            value={form.contact_name}
            onChange={handleChange}
            disabled={loading}
            style={{ display: "block", width: "100%", marginBottom: 12 }}
          />
        </div>

        <div>
          <label>電話番号</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            disabled={loading}
            style={{ display: "block", width: "100%", marginBottom: 12 }}
          />
        </div>

        <div>
          <label>メールアドレス</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            disabled={loading}
            style={{ display: "block", width: "100%", marginBottom: 12 }}
          />
        </div>

        <div>
          <label>WebサイトURL</label>
          <input
            name="website_url"
            value={form.website_url}
            onChange={handleChange}
            disabled={loading}
            style={{ display: "block", width: "100%", marginBottom: 12 }}
          />
        </div>

        <div>
          <label>メモ</label>
          <textarea
            name="memo"
            value={form.memo}
            onChange={handleChange}
            disabled={loading}
            style={{ display: "block", width: "100%", marginBottom: 12 }}
          />
        </div>

        <button type="submit" disabled={loading}>
          {editingId ? "更新する" : "登録する"}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={handleCancelEdit}
            disabled={loading}
            style={{ marginLeft: 8 }}
          >
            キャンセル
          </button>
        )}
      </form>

      <table border={1} cellPadding={8} style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>購入先名</th>
            <th>担当者</th>
            <th>電話番号</th>
            <th>メール</th>
            <th>Webサイト</th>
            <th>メモ</th>
            <th>操作</th>
          </tr>
        </thead>

        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.id}>
              <td>{supplier.name}</td>
              <td>{supplier.contact_name ?? "-"}</td>
              <td>{supplier.phone ?? "-"}</td>
              <td>{supplier.email ?? "-"}</td>
              <td>{supplier.website_url ?? "-"}</td>
              <td>{supplier.memo ?? "-"}</td>
              <td>
                <button onClick={() => handleEdit(supplier)} disabled={loading}>
                  編集
                </button>
                <button
                  onClick={() => handleDelete(supplier.id)}
                  disabled={loading}
                  style={{ marginLeft: 8 }}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}

          {suppliers.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: "center" }}>
                データがありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
