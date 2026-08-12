"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Archive, ArchiveRestore, LogOut } from "lucide-react";

const STICKERS = [
  { bg: "bg-lilac", ring: "border-lilac-ring", text: "text-lilac-text" },
  { bg: "bg-cotton", ring: "border-cotton-ring", text: "text-cotton-text" },
  { bg: "bg-mint", ring: "border-mint-ring", text: "text-mint-text" },
  { bg: "bg-butter", ring: "border-butter-ring", text: "text-butter-text" },
  { bg: "bg-sky", ring: "border-sky-ring", text: "text-sky-text" },
];

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [lists, setLists] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      setUser(user);
      const { data } = await supabase.from("lists").select("*, items(count)").eq("owner_id", user.id).order("created_at");
      setLists(data || []);
      setLoading(false);
    })();
  }, []);

  const addList = async () => {
    const { data, error } = await supabase.from("lists").insert({ owner_id: user.id, name: "New list" }).select().single();
    if (!error) router.push(`/list/${data.id}`);
  };

  const toggleArchive = async (list) => {
    await supabase.from("lists").update({ archived: !list.archived }).eq("id", list.id);
    setLists((ls) => ls.map((l) => (l.id === list.id ? { ...l, archived: !l.archived } : l)));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted">Loading your lists…</div>;

  const visible = lists.filter((l) => (showArchived ? l.archived : !l.archived));

  return (
    <div className="min-h-screen">
      <div className="border-b-2 border-lilac bg-white/70 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎁</span>
            <span className="font-display font-bold text-2xl text-ink">Giftwell</span>
          </div>
          <button onClick={signOut} className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-display font-bold text-2xl text-ink">{showArchived ? "Archived lists" : "Your lists"}</h1>
          <button onClick={() => setShowArchived((v) => !v)} className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            {showArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />} {showArchived ? "Back to active" : "Archived"}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {visible.map((list, i) => {
            const c = STICKERS[i % STICKERS.length];
            return (
              <a
                key={list.id}
                href={`/list/${list.id}`}
                className={`rounded-2xl p-4 border-2 hover:scale-[1.02] transition-transform ${c.bg} ${c.ring}`}
              >
                <div className={`font-semibold ${c.text}`}>{list.name}</div>
                <div className={`text-xs mt-1 opacity-70 ${c.text}`}>{list.items?.[0]?.count ?? 0} gifts</div>
              </a>
            );
          })}
          {!showArchived && (
            <button onClick={addList} className="rounded-2xl border-2 border-dashed border-lilac-ring flex flex-col items-center justify-center gap-1 py-6 text-lilac-text hover:bg-white transition-colors">
              <Plus size={20} />
              <span className="text-sm font-semibold">New list</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
