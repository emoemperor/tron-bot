export const dynamic = "force-dynamic";
export const fetchCache = "force-cache";

import { bot } from "@/app/bot";
import { webhookCallback } from "grammy";

export const POST = webhookCallback(bot, "std/http");

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const action = searchParams.get("action");
  if (!key || !action) return Response.json({ error: "Bad Request" });
  if (key !== "emo") return Response.json({ error: "Unauthorized" });
  const actions = ["up", "down"];
  if (!actions.includes(action as string))
    return Response.json({ error: "Bad Request" });
  if (action === "up") {
    const result = await bot.api.setWebhook(
      "https://trx-bot.vercel.app/api/bot"
    );
    return Response.json(result);
  } else {
    const result = await bot.api.deleteWebhook();
    return Response.json(result);
  }
};
