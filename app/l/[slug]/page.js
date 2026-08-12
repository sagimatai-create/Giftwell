"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAnonId } from "@/lib/anon";
import { Gift, Truck } from "lucide-react";

const PRIORITIES = {
  high: { label: "Really want", emoji: "🔥", color: "#FF7A9C", soft: "#FFE1EA" },
  med: { label: "Would love", emoji: "💛", color: "#F5B942", soft: "#FFF1BF" },
  low: { label: "Nice to have", emoji: "🌿", color: "#4FAE8B", soft: "#DAF3E6" },
};

export default function SharedListPage() {
  const { slug } = useParams();
  const supabase = createClient();

  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);
  const [session, setSession] = useState(null);
  const [statuses, setStatuses] = useState({}); // item_id -> {in_cart, bought}
  const [loading, setLoading] = useState(true);
  const [justBought, setJustBought] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: listData } = await supabase.from("lists").select("*").eq("share_slug", slug).single();
      if (!listData) return setLoading(false);
      const { data: itemData } = await supabase.from("items").select("*").eq("list_id", listData.id).order("created_at");
      setList(listData);
      setItems(itemData || []);

      const anonId = getAnonId();
      let { data: sess } = await supabase.from("recipient_sessions").select("*").eq("list_id", listData.id).eq("anon_id", anonId).single();
      if (!sess) {
        const { data: created } = await supabase.from("recipient_sessions").insert({ list_id: listData.id, anon_id: anonId, name: "Guest" }).select().single();
        sess = created;
      }
      setSession(sess);

      const { data: statusRows } = await supabase.from("item_status").select("*").eq("session_id", sess.id);
      const map = {};
      (statusRows || []).forEach((r) => { map[r.item_id] = { in_cart: r.in_cart, bought: r.bought }; });
      setStatuses(map);
      setLoading(false);
    })();
  }, [slug]);

  const updateBudget = async (val) => {
    setSession((s) => ({ ...s, budget: val }));
    await supabase.from("recipient_sessions").update({ budget: val === "" ? null : val }).eq("id", session.id);
  };

  const toggleStatus = async (itemId, field) => {
    const current = statuses[itemId] || { in_cart: false, bought: false };
    const next = { ...current, [field]: !current[field] };
    setStatuses((s) => ({ ...s, [itemId]: next }));
    if (field === "bought" && next.bought) setJustBought(itemId);

    const { data: existing } = await supabase.from("item_status").select("id").eq("session_id", session.id).eq("item_id", itemId).single();
    if (existing) {
      await supabase.from("item_status").update(next).eq("id", existing.id);
    } else {
      await supabase.from("item_status").insert({ session_id: session.id, item_id: itemId, ...next });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted">Loading the list…</div>;
  if (!list) return <div className="min-h-screen flex items-center justify-center text-muted">This list doesn't exist or the link is wrong.</div>;

  const cartTotal = items.filter((i) => statuses[i.id]?.in_cart).reduce((s, i) => s + i.price * i.qty, 0);
  const boughtTotal = items.filter((i) => statuses[i.id]?.bought).reduce((s, i) => s + i.price * i.qty, 0);
  const budgetNum = parseFloat(session?.budget) || 0;
  const overBudget = budgetNum > 0 && boughtTotal > budgetNum;
  const budgetPct = budgetNum > 0 ? Math.min(100, (boughtTotal / budgetNum) * 100) : 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-5 py-8">
        <div className="mb-4">
          <div className="text-xs text-muted mb-1 font-medium">You're viewing a shared wishlist — your cart & budget are private to you</div>
          <h2 className="font-display font-bold text-3xl text-ink">{list.name}</h2>
        </div>

        <div className="bg-white border-2 border-lilac rounded-3xl p-5 mb-5 shadow-sm">
          <div className="flex items-center gap-4 flex-wrap justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted">
              My budget
              <span className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                <input type="number" defaultValue={session?.budget || ""} onBlur={(e) => updateBudget(e.target.value)} placeholder="no limit" className="w-28 pl-6 pr-2 py-1.5 rounded-full border-2 border-lilac text-sm" />
              </span>
            </div>
            <div className="text-sm font-medium text-muted">Cart: <span className="font-display text-mint-text">${cartTotal.toFixed(2)}</span></div>
            <div className="text-sm font-medium text-muted">Spent: <span className={`font-display ${overBudget ? "text-red-500" : "text-coral"}`}>${boughtTotal.toFixed(2)}</span></div>
          </div>
          {budgetNum > 0 && (
            <div className="mt-4">
              <div className="h-3 rounded-full bg-lilac overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${budgetPct}%`, background: overBudget ? "linear-gradient(90deg,#F5B942,#E0577A)" : "linear-gradient(90deg,#8FD9B3,#F5B942)" }} />
              </div>
              <div className={`text-xs mt-1.5 font-medium ${overBudget ? "text-red-500" : "text-mint-text"}`}>
                {overBudget ? `😬 $${(boughtTotal - budgetNum).toFixed(2)} over budget` : `🎯 $${(budgetNum - boughtTotal).toFixed(2)} left to spend`}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const st = statuses[item.id] || { in_cart: false, bought: false };
            const p = PRIORITIES[item.priority];
            return (
              <div key={item.id} className={`relative flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${st.bought ? "bg-lilac/30 border-lilac opacity-70" : "bg-white border-lilac hover:border-lilac-ring"}`}>
                {justBought === item.id && <div className="absolute -top-3 right-2 text-lg animate-bounce">🎉</div>}
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0" style={{ background: p.soft }}>
                  {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/70"><Gift size={18} /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-semibold text-ink truncate ${st.bought ? "line-through" : ""}`}>{item.name}{item.qty > 1 ? ` ×${item.qty}` : ""}</h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white shrink-0" style={{ background: p.color }}>{p.emoji}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
                    <span className="font-display text-coral font-semibold">${(item.price * item.qty).toFixed(2)}</span>
                    <span className="flex items-center gap-1"><Truck size={11} /> {item.days} days</span>
                    {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">view</a>}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 items-end shrink-0">
                  <button onClick={() => toggleStatus(item.id, "in_cart")} disabled={st.bought} className={`text-xs font-medium px-3 py-1 rounded-full border-2 disabled:opacity-30 ${st.in_cart ? "bg-mint border-mint-ring text-mint-text" : "border-lilac text-muted"}`}>
                    {st.in_cart ? "In cart ✓" : "Add to cart"}
                  </button>
                  <button onClick={() => toggleStatus(item.id, "bought")} className={`text-xs font-medium px-3 py-1 rounded-full border-2 ${st.bought ? "bg-coral border-coral text-white" : "border-lilac text-muted"}`}>
                    {st.bought ? "Bought 🎁" : "Mark bought"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
