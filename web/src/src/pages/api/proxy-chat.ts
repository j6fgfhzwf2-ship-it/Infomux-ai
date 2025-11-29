// web/src/pages/api/proxy-chat.ts
import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = await req; // forward raw body to backend
  // Redirect to backend (change URL si déployé)
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000/chat";
  const backendRes = await fetch(backendUrl, {
    method: "POST",
    body: req.body, // next will handle the multipart (we set bodyParser false)
    headers: req.headers as any,
  });
  const data = await backendRes.text();
  res.status(backendRes.status).send(data);
}

