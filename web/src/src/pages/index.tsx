// web/src/pages/index.tsx
import React, { useState } from "react";
import Head from "next/head";

type Msg = { role: "user" | "assistant"; text: string };

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files));
  }

  async function send() {
    if (!question && files.length === 0) return;
    setLoading(true);
    setMessages(prev => [...prev, { role: "user", text: question || "(images)" }]);

    const form = new FormData();
    form.append("question", question || "");
    form.append("model", "llava:7b"); // par défaut LLaVA 7b
    files.forEach((f) => form.append("images", f));

    const res = await fetch("/api/proxy-chat", {
      method: "POST",
      body: form
    });
    const data = await res.json();
    setMessages(prev => [...prev, { role: "assistant", text: data.text }]);
    setQuestion("");
    setFiles([]);
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 980, margin: "40px auto", fontFamily: "Inter, sans-serif" }}>
      <Head><title>Infomux IA — Chat multimodal</title></Head>

      <h1>Infomux IA</h1>
      <p>Envoyer plusieurs images, poser une question — LLaVA inside.</p>

      <div style={{ marginBottom: 12 }}>
        <input type="file" multiple accept="image/*" onChange={onFileChange} />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        {files.map((f, i) => (
          <div key={i} style={{ width: 120 }}>
            <img src={URL.createObjectURL(f)} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 8 }} />
            <div style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
          </div>
        ))}
      </div>

      <textarea
        placeholder="Pose ta question ici..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        style={{ width: "100%", height: 120, marginTop: 12, padding: 12 }}
      />

      <div style={{ marginTop: 8 }}>
        <button onClick={send} disabled={loading} style={{ padding: "10px 16px", borderRadius: 8 }}>
          {loading ? "En cours..." : "Envoyer"}
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 12, background: m.role === "user" ? "#eef" : "#f6f6f6", padding: 12, borderRadius: 8 }}>
            <strong>{m.role}</strong>
            <div>{m.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

