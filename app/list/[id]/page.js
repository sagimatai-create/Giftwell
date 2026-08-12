"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Pencil, Trash2, Link2, Archive, ArchiveRestore, Gift, ExternalLink, Eye, EyeOff, Truck, Wand2, ArrowLeft } from "lucide-react";

const PRIORITIES = {
  high: { label: "Really want", emoji: "🔥", color: "#FF7A9C", soft: "#FFE1EA" },
  med: { label: "Would love", emoji: "💛", color: "#F5B942", soft: "#FFF1BF" },
  low: { label: "Nice to have", emoji: "🌿", color: "#4FAE8B", soft: "#DAF3E6" },
};

export default function ListPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [renaming, setRenaming] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  const load = async () => {
    const { data: listData } = await supabase.from("lists").select("*").eq("id", id).single();
    const { data: itemData } = await supabase.from("items").select("*").eq("list_id", id).order("created_at");
    setList(listData);
    setItems(itemData || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const renameList = async (name) => {
    await supabase.from("lists").update({ name }).eq("id", id);
    setList((l) => ({ ...l, name }));
    setRenaming(false);
  };

  const toggleArchive = async () => {
    await supabase.from("lists").update({ archived: !list.archived }).eq("id", id);
    setList((l) => ({ ...l, archived: !l.archived }));
  };

  const toggleBlind = async () => {
    await supabase.from("lists").update({ owner_blind: !list.owner_blind }).eq("id", id);
    setList((l) => ({ ...l, owner_blind: !l.owner_blind }));
  };

  const deleteList = async () => {
    if (!confirm("Delete this whole list? This can't be undone.")) return;
    await supabase.from("lists").delete().eq("id", id);
    router.push("/");
  };

  const saveItem = async (item) => {
    if (item.id) {
      await supabase.from("items").update(item).eq("id", item.id);
    } else {
      await supabase.from("items").insert({ ...item, list_id: id });
    }
    setShowForm(false);
    setEditingItem(null);
    flash(item.id ? "Item updated ✨" : "Added to your list 🎁");
    load();
  };

  const deleteItem = async (itemId) => {
    await supabase.from("items").delete().eq("id", itemId);
    setItems((its) => its.filter((i) => i.id !== itemId));
  };

  const copyLink = () => {
    const url = `${window.location.origin}/l/${list.share_slug}`;
    navigator.clipboard.writeText(url);
    flash("Share link copied 💌");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted">Loading…</div>;
  if (!list) return <div className="min-h-screen flex items-center justify-center text-muted">List not found.</div>;

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-5 py-6">
        <a href="/" className="flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-4"><ArrowLeft size={14} /> All lists</a>

        {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg">{toast}</div>}

        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            {renaming ? (
              <input autoFocus defaultValue={list.name} onBlur={(e) => renameList(e.target.value || "Untitled")} onKeyDown={(e) => e.key === "Enter" && e.target.blur()} className="font-display font-bold text-3xl text-ink border-2 border-lilac-ring rounded-xl px-2" />
            ) : (
              <button onClick={() => setRenaming(true)} className="font-display font-bold text-3xl text-ink hover:opacity-70">{list.name}</button>
            )}
            <div className="text-xs text-muted mt-1 font-medium">
              Total value: <span className="font-display text-coral">${items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={copyLink} className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-full text-white bg-lilac-ring hover:brightness-105"><Link2 size={14} /> Share link</button>
            <button onClick={toggleArchive} className="flex items-center gap-1.5 text-sm px-3 py-2.5 rounded-full border-2 border-lilac text-muted hover:text-ink">{list.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}</button>
            <button onClick={deleteList} className="flex items-center gap-1.5 text-sm px-3 py-2.5 rounded-full border-2 border-lilac text-coral hover:bg-coral hover:text-white"><Trash2 size={14} /></button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-muted mb-4 cursor-pointer w-fit font-medium">
          <input type="checkbox" checked={list.owner_blind} onChange={toggleBlind} className="accent-lilac-ring" />
          {list.owner_blind ? <EyeOff size={13} /> : <Eye size={13} />} Keep the surprise — hide who's bought what
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onEdit={(i) => { setEditingItem(i); setShowForm(true); }} onDelete={deleteItem} />
          ))}
          <button onClick={() => { setEditingItem(null); setShowForm(true); }} className="min-h-[190px] rounded-3xl border-[3px] border-dashed border-lilac flex flex-col items-center justify-center gap-1.5 text-lilac-ring hover:text-coral hover:border-coral transition-colors">
            <Plus size={22} />
            <span className="text-sm font-semibold">Add a gift</span>
          </button>
        </div>
      </div>

      {showForm && (
        <ItemModal
          initial={editingItem}
          onClose={() => { setShowForm(false); setEditingItem(null); }}
          onSave={saveItem}
        />
      )}
    </div>
  );
}

function ItemCard({ item, onEdit, onDelete }) {
  const p = PRIORITIES[item.priority];
  return (
    <div className="bg-white rounded-3xl overflow-hidden border-2 border-lilac group hover:shadow-lg hover:-translate-y-1 transition-all">
      <div className="h-36 relative overflow-hidden" style={{ background: p.soft }}>
        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/70"><Gift size={32} /></div>}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(item)} className="p-1.5 rounded-full bg-white shadow-sm text-ink"><Pencil size={13} /></button>
          <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-full bg-white shadow-sm text-coral"><Trash2 size={13} /></button>
        </div>
        <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-2.5 py-1 rounded-full text-white" style={{ background: p.color }}>{p.emoji} {p.label}</span>
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm text-ink leading-snug">{item.name}{item.qty > 1 ? ` ×${item.qty}` : ""}</h4>
          <span className="font-display text-sm text-coral shrink-0">${(item.price * item.qty).toFixed(0)}</span>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted">
          <span className="flex items-center gap-1"><Truck size={12} /> {item.days}d</span>
          {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-ink truncate"><ExternalLink size={12} /> store</a>}
        </div>
      </div>
    </div>
  );
}

function ItemModal({ initial, onSave, onClose }) {
  const [entryMode, setEntryMode] = useState("manual");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState(initial || { name: "", link: "", price: "", days: "", priority: "med", qty: 1, image: "" });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const runAutofill = async () => {
    if (!form.link) return;
    setFetching(true);
    setFetchError("");
    setPreview(null);
    try {
      const res = await fetch("/api/fetch-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.link }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error || "Couldn't read that link.");
      } else {
        setPreview({ name: data.title, image: data.image, price: data.price });
      }
    } catch {
      setFetchError("Something went wrong reaching that link.");
    }
    setFetching(false);
  };

  const acceptPreview = () => {
    setForm((f) => ({
      ...f,
      name: preview.name || f.name,
      image: preview.image || f.image,
      price: preview.price ?? f.price,
    }));
    setPreview(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto border-4 border-lilac" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b-2 border-lilac">
          <h3 className="font-display text-xl text-ink">{initial ? "Edit this gift" : "Add a gift"}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex bg-lilac rounded-full p-1 text-sm w-fit">
            <button onClick={() => setEntryMode("manual")} className={`px-3 py-1.5 rounded-full ${entryMode === "manual" ? "bg-white text-ink shadow-sm" : "text-muted"}`}>Type it in</button>
            <button onClick={() => setEntryMode("link")} className={`px-3 py-1.5 rounded-full ${entryMode === "link" ? "bg-white text-ink shadow-sm" : "text-muted"}`}>✨ Fill from link</button>
          </div>

          {entryMode === "link" && (
            <div className="bg-lilac/40 rounded-2xl p-3 space-y-2">
              <div className="flex gap-2">
                <input type="text" placeholder="Paste the store link here" value={form.link} onChange={set("link")} className="flex-1 px-3 py-2 rounded-xl border-2 border-lilac bg-white text-sm" />
                <button onClick={runAutofill} disabled={!form.link || fetching} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-lilac-ring text-white text-sm disabled:opacity-40 shrink-0">
                  <Wand2 size={14} /> {fetching ? "Reading…" : "Fill it in"}
                </button>
              </div>
              {fetchError && <p className="text-xs text-coral bg-cotton rounded-xl px-3 py-2">{fetchError} You can still fill in the fields below yourself.</p>}
              {preview && (
                <div className="bg-white rounded-2xl border-2 border-lilac p-3 space-y-2">
                  <div className="flex gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 border-lilac bg-lilac">
                      {preview.image ? <img src={preview.image} alt="" className="w-full h-full object-cover" /> : <Gift size={18} className="m-auto mt-3.5 text-lilac-ring" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-ink leading-snug">{preview.name || "No title found"}</p>
                      <p className="text-sm font-display text-coral">{preview.price != null ? `$${preview.price}` : "No price found"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 bg-butter text-butter-text text-[11px] rounded-xl px-2.5 py-2 leading-snug">
                    <span>⚠️</span><span>Double-check this matches your exact item — pages with multiple colors/sizes can show a different variant.</span>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => setPreview(null)} className="px-3 py-1.5 text-xs text-muted hover:text-ink">Discard</button>
                    <button onClick={acceptPreview} className="px-3 py-1.5 text-xs font-semibold rounded-full bg-lilac-ring text-white">Use this ✓</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 items-center">
            <div className="w-16 h-16 rounded-2xl bg-lilac flex items-center justify-center overflow-hidden shrink-0 border-2 border-lilac-ring">
              {form.image ? <img src={form.image} alt="" className="w-full h-full object-cover" /> : <Gift size={22} className="text-lilac-ring" />}
            </div>
            <div className="flex-1 space-y-1">
              <input type="text" placeholder="Or paste an image URL" value={form.image?.startsWith("data:") ? "" : form.image} onChange={set("image")} className="w-full text-xs px-3 py-2 rounded-xl border-2 border-lilac bg-white" />
              <label className="text-xs text-lilac-ring cursor-pointer underline font-medium">
                or upload a photo
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>

          <input type="text" placeholder="What is it?" value={form.name} onChange={set("name")} className="w-full px-4 py-2.5 rounded-xl border-2 border-lilac bg-white text-sm" />
          {entryMode === "manual" && (
            <div className="relative">
              <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" placeholder="Store link (optional)" value={form.link} onChange={set("link")} className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-lilac bg-white text-sm" />
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <div><label className="text-[11px] text-muted font-medium">Price ($)</label><input type="number" value={form.price} onChange={set("price")} className="w-full px-2 py-2 rounded-xl border-2 border-lilac bg-white text-sm" /></div>
            <div><label className="text-[11px] text-muted font-medium">Arrives in</label><input type="number" value={form.days} onChange={set("days")} placeholder="days" className="w-full px-2 py-2 rounded-xl border-2 border-lilac bg-white text-sm" /></div>
            <div><label className="text-[11px] text-muted font-medium">Qty</label><input type="number" min={1} value={form.qty} onChange={set("qty")} className="w-full px-2 py-2 rounded-xl border-2 border-lilac bg-white text-sm" /></div>
          </div>
          <div>
            <label className="text-[11px] text-muted font-medium">How much do you want it?</label>
            <div className="flex gap-2 mt-1.5">
              {Object.entries(PRIORITIES).map(([key, p]) => (
                <button key={key} onClick={() => setForm((f) => ({ ...f, priority: key }))} className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${form.priority === key ? "scale-105" : "opacity-70"}`} style={{ borderColor: p.color, background: form.priority === key ? p.soft : "white", color: p.color }}>
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2.5 text-sm text-muted hover:text-ink">Cancel</button>
            <button
              onClick={() => onSave({ ...form, price: parseFloat(form.price) || 0, days: parseInt(form.days) || 0, qty: parseInt(form.qty) || 1 })}
              disabled={!form.name}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-xl bg-coral text-white disabled:opacity-40 shadow-sm hover:brightness-105"
            >
              🎁 Save to my list
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
