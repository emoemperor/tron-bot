export const dynamic = "force-dynamic";
import { getPirceData } from "@/app/bot/handlers";
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { bot } from "@/app/bot";
import { sanitizeMarkdown } from "telegram-markdown-sanitizer";
import { NextRequest } from "next/server";
import axios from "axios";

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
  
  // 获取大宗交易数据
  const blockTradeData = await getPirceData();
  // 获取VIP专享数据
  const vipData = await getPirceData("vip");
  
  if (!blockTradeData && !vipData) {
    return Response.json({ message: "获取数据失败" }, { status: 500 });
  }

  let reply = `定时价格推送\n\n获取时间:${now.tz("Asia/Shanghai").format("YYYY-MM-DD HH:mm")}\n\n`;
  
  // 添加大宗交易价格
  if (blockTradeData) {
    reply += `━━━━━━━━━━━━━━━━\nOkx大宗交易前10名价格\n`;
    reply += blockTradeData.data.buy
      .slice(0, 10)
      .map(({ price }, idx) => `第${idx + 1}位 ¥${price}`)
      .join("\n");
    reply += "\n\n";
  }
  
  // 添加VIP专享价格
  if (vipData) {
    reply += `━━━━━━━━━━━━━━━━\nOkx VIP专享前10名价格\n`;
    reply += vipData.data.buy
      .slice(0, 10)
      .map(({ price }, idx) => `第${idx + 1}位 ¥${price}`)
      .join("\n");
  }

  const clients = await db.client.findMany();
  for (const client of clients) {
    try {
      await bot.api.sendMessage(client.id.toString(), sanitizeMarkdown(reply), {
        parse_mode: "MarkdownV2",
      });
    } catch (error) {
      console.error(`发送消息到客户端 ${client.id} 失败:`, error);
    }
  }
  
  return Response.json({ message: "发送成功" });
}
