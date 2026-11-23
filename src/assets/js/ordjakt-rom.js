// To PC-er i samme rom: meldinger sendes gjennom Supabase Realtime (broadcast), uten lagring og uten innlogging.
// Ingen persondata: bare en tilfeldig spiller-id, runde, poengsum og antall svar.

export function kobleTilRom({ url, nokkel, kode, vedMelding, vedStatus }) {
  const emne = "realtime:ordjakt-" + kode;
  const adresse = url.replace(/^http/, "ws") + "/realtime/v1/websocket?apikey=" + encodeURIComponent(nokkel) + "&vsn=1.0.0";
  let ws = null, ref = 0, puls = null, stengt = false, kø = [], forsok = 0;

  const send = (event, payload, topic = emne) => {
    const m = JSON.stringify({ topic, event, payload, ref: String(++ref) });
    if (ws && ws.readyState === 1) ws.send(m); else kø.push(m);
  };

  function apne() {
    if (stengt) return;
    vedStatus?.("kobler");
    ws = new WebSocket(adresse);
    ws.onopen = () => {
      forsok = 0;
      const join = JSON.stringify({ topic: emne, event: "phx_join", payload: { config: { broadcast: { self: false, ack: false }, presence: { key: "" }, private: false } }, ref: String(++ref) });
      ws.send(join);
      for (const m of kø.splice(0)) ws.send(m);
      clearInterval(puls);
      puls = setInterval(() => send("heartbeat", {}, "phoenix"), 25000);
    };
    ws.onmessage = (e) => {
      let m;
      try { m = JSON.parse(e.data); } catch { return; }
      if (m.topic !== emne) return;
      if (m.event === "phx_reply" && m.payload?.status === "ok" && m.payload?.response?.postgres_changes) vedStatus?.("tilkoblet");
      if (m.event === "broadcast" && m.payload?.payload) vedMelding(m.payload.event, m.payload.payload);
    };
    ws.onclose = () => {
      clearInterval(puls);
      if (stengt) return;
      vedStatus?.("frakoblet");
      setTimeout(apne, Math.min(10000, 1000 * 2 ** forsok++));
    };
    ws.onerror = () => ws.close();
  }
  apne();

  return {
    sendMelding: (event, payload) => send("broadcast", { type: "broadcast", event, payload }),
    lukk: () => { stengt = true; clearInterval(puls); ws?.close(); },
  };
}
