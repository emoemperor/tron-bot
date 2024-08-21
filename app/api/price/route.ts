import { getPirceData } from "@/app/bot/handlers";
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { bot } from "@/app/bot";
import { sanitizeMarkdown } from "telegram-markdown-sanitizer";
import { NextRequest } from "next/server";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Shanghai");
const db = new PrismaClient();
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  const now = dayjs();
  const data = await getPirceData();
  if (!data) {
    return Response.json({ message: "获取数据失败" }, { status: 500 });
  }
  let reply = `定时价格推送\n\n
Okx大宗交易前5名价格 
获取时间:${now.tz("Asia/Shanghai").format("YYYY-MM-DD HH:mm")}`;
  reply += data.data.buy.slice(0, 5).map(
    ({ nickName, price }, idx) => `
第${idx + 1}位 ${nickName} ¥${price}`
  );
  const clients = await db.client.findMany();
  for (const client of clients) {
    try {
      await bot.api.sendMessage(client.id.toString(), sanitizeMarkdown(reply), {
        parse_mode: "MarkdownV2",
      });
    } catch (error) {}
  }
  return Response.json({ message: "发送成功" });
}
