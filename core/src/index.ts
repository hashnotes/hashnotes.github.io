import { schema, table, t, SenderError } from "spacetimedb/server";
import { fromjson, hashData, type Hash, type Jsonable } from "./notes.ts";

const HashT = t.string();

const Note = table(
  {
    name: "note",
    public: true,
  },
  {
    hash: HashT.primaryKey(),
    data: t.string(),
  }
);

export const spacetimedb = schema(Note);

spacetimedb.view(
  { name: "note_count", public: true },
  t.array(t.object("NoteCountRow", { count: t.u64() })),
  (ctx) => [{ count: ctx.db.note.count() }]
);

spacetimedb.reducer(
  "add_note",
  { data: t.string() },
  (ctx, { data }) => {
    let parsed: Jsonable;
    try {
      parsed = fromjson(data);
    } catch (e) {
      throw new SenderError(`invalid json: ${String(e)}`);
    }

    const hash = hashData(parsed);
    if (ctx.db.note.hash.find(hash)) return;
    ctx.db.note.insert({ hash, data });
  }
);

spacetimedb.procedure(
  "search_note",
  { query: t.string() },
  t.array(t.object("search_result", {
    title: t.string(),
    count: t.number(),
    hash: t.string(),
  })),
  (ctx, { query }) => ctx.withTx((tx) => {
    const q = query.toLowerCase();
    const out: Array<{ title: string; count: number; hash: string }> = [];
    for (const note of tx.db.note.iter()) {
      let title = "";
      try {
        const data = fromjson(note.data) as Jsonable;
        if (data && typeof data === "object" && !Array.isArray(data) && "title" in data) {
          const tval = (data as Record<string, Jsonable>).title;
          if (typeof tval === "string") title = tval;
        }
      } catch {
        // ignore invalid record payload
      }
      if (!q || note.hash.includes(q) || title.toLowerCase().includes(q)) {
        out.push({ title, count: 1, hash: note.hash });
        if (out.length >= 100) break;
      }
    }
    return out;
  })!
);

spacetimedb.procedure(
  "get_note",
  { hash: t.string() },
  t.option(t.string()),
  (ctx, { hash }) => ctx.withTx((tx) => {
    const clean = (hash.startsWith("#") ? hash.slice(1) : hash) as Hash;
    const row = tx.db.note.hash.find(clean);
    return row ? row.data : undefined;
  })
);
