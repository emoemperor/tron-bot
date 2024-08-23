import { IContext, SessionAction } from ".";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Shanghai");
import {
  CallbackQueryContext,
  CommandContext,
  HearsContext,
  InlineKeyboard,
  NextFunction,
} from "grammy";
import { sanitizeMarkdown } from "telegram-markdown-sanitizer";
import { TronScanClient } from "@emoemperor/tronscan-client";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const tron = new TronScanClient({
  url: "https://apilist.tronscanapi.com/api",
  apiKey: process.env.TRONSCAN_API_KEY,
});

export async function handleTransactionQuery(
  ctx: CallbackQueryContext<IContext>
) {
  const address = ctx.match[1];
  await ctx.editMessageText("正在查询交易记录，请稍后……");
  const transactions = await tron.getTrc20Transfers({
    relatedAddress: address,
    contract_address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    limit: 5,
  });
  const reply = sanitizeMarkdown(
    transactions.token_transfers
      .map(
        (transfer) => `
    是否风险: ${transfer.riskTransaction ? "是⚠️" : "否"}
    交易时间: ${dayjs(transfer.block_ts).format("YYYY-MM-DD HH:mm:ss")}
    交易金额: ${(
      Number(transfer.quant) / Math.pow(10, transfer.tokenInfo.tokenDecimal)
    ).toFixed(
      transfer.tokenInfo.tokenDecimal > 6 ? 6 : transfer.tokenInfo.tokenDecimal
    )} ${transfer.tokenInfo.tokenAbbr.toUpperCase()}
    交易类型: ${transfer.from_address === address ? "转出" : "转入"}
    对手地址: \`${
      transfer.from_address === address
        ? transfer.to_address
        : transfer.from_address
    }\`
            `
      )
      .join("\n")
  );
  return ctx.editMessageText(reply, {
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [
          InlineKeyboard.text("地址情况", `info ${address}`),
          InlineKeyboard.text("风险检测", `risk ${address}`),
        ],
        [InlineKeyboard.text("关闭", "close")],
      ],
    },
  });
}
export async function handleRiskQuery(ctx: HearsContext<IContext> | IContext) {
  let address: string;
  if (ctx.match) {
    address = ctx.match[1];
  } else if (ctx.message?.text) {
    address = ctx.message.text;
  } else {
    return ctx.reply("没有接收到有效的地址");
  }
  const message = await ctx.reply("正在检测地址风险，请稍后……", {
    reply_parameters: { message_id: ctx.message?.message_id! },
  });
  const riskInfo = await tron.checkAccountSecurity({ address });
  let context = `\n检测地址: \`${address}\`\n`;
  if (riskInfo) {
    context += `**检测结果**:
  曾发送广告: ${riskInfo.send_ad_by_memo ? "是⚠️" : "否"}
  存在欺诈交易: ${riskInfo.has_fraud_transaction ? "是⚠️" : "否"}
  发行欺诈代币: ${riskInfo.fraud_token_creator ? "是⚠️" : "否"}
  黑名单: ${riskInfo.is_black_list ? "是⚠️" : "否"}`;
  }
  return ctx.api.editMessageText(
    ctx.chat?.id!,
    message.message_id,
    sanitizeMarkdown(context),
    {
      parse_mode: "MarkdownV2",
    }
  );
}
export async function handleInfoQuery(ctx: HearsContext<IContext> | IContext) {
  let address: string;
  if (ctx.match) {
    address = ctx.match[1];
  } else if (ctx.message?.text) {
    address = ctx.message.text;
  } else {
    return ctx.reply("没有接收到有效的地址");
  }
  const message = await ctx.reply("正在查询地址详情，请稍后……", {
    reply_parameters: { message_id: ctx.message?.message_id! },
  });
  const account = await tron.getAccountDetailInformation({ address });
  let context = `
  交易数: ${account.transactions}
  转入交易数: ${account.transactions_in}
  转出交易数: ${account.transactions_out}
  交易状态:${account.allowExchange ? "允许交易" : "不允许交易"}
  ${account.publicTag ? `🟢🟢公共标签: ${account.publicTag}🟢🟢` : ""}
  ${account.redTag ? `⚠️⚠️红色标签: ${account.redTag}⚠️⚠️` : ""}
  拥有代币:
      ${account.withPriceTokens
        .map(
          (token) => `
          代币名称: ${token.tokenName}
          代币余额: ${(
            Number(token.balance) / Math.pow(10, token.tokenDecimal)
          ).toFixed(
            token.tokenDecimal > 6 ? 6 : token.tokenDecimal
          )} ${token.tokenAbbr.toUpperCase()}
          代币类型: ${token.tokenType}`
        )
        .join("\n")}`;
  return ctx.api.editMessageText(
    ctx.chat?.id!,
    message.message_id,
    sanitizeMarkdown(context),
    {
      parse_mode: "MarkdownV2",
      reply_markup: {
        inline_keyboard: [
          [
            InlineKeyboard.text("风险检测", `risk ${address}`),
            InlineKeyboard.text("交易查询", `transaction ${address}`),
          ],
          [InlineKeyboard.text("关闭", "close")],
        ],
      },
    }
  );
}
export async function getPirceData() {
  try {
    const { data } = await axios.get<{
      code: number;
      data: {
        buy: {
          alreadyTraded: boolean;
          availableAmount: string;
          avgCompletedTime: number;
          avgPaymentTime: number;
          baseCurrency: string;
          black: boolean;
          cancelledOrderQuantity: number;
          completedOrderQuantity: number;
          completedRate: string;
          creatorType: string;
          guideUpgradeKyc: boolean;
          id: string;
          intention: boolean;
          isInstitution: number;
          maxCompletedOrderQuantity: number;
          maxUserCreatedDate: number;
          merchantId: string;
          minCompletedOrderQuantity: number;
          minCompletionRate: string;
          minKycLevel: number;
          minSellOrders: number;
          mine: boolean;
          nickName: string;
          paymentMethods: string[];
          paymentTimeoutMinutes: number;
          posReviewPercentage: string;
          price: string;
          publicUserId: string;
          quoteCurrency: string;
          quoteMaxAmountPerOrder: string;
          quoteMinAmountPerOrder: string;
          quoteScale: number;
          quoteSymbol: string;
          receivingAds: boolean;
          safetyLimit: boolean;
          side: string;
          userActiveStatusVo: any;
          userType: string;
          verificationType: number;
          whitelistedCountries: string[];
        }[];
      };
    }>(
      "https://www.okx.com/v3/c2c/tradingOrders/books?quoteCurrency=CNY&baseCurrency=USDT&side=buy&paymentMethod=all&userType=blockTrade&receivingAds=false",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        },
      }
    );
    return data;
  } catch (error) {
    return undefined;
  }
}
export async function handlePrice(ctx: HearsContext<IContext> | IContext) {
  const message = await ctx.reply("正在获取价格，请稍后……", {
    reply_parameters: { message_id: ctx.message?.message_id! },
  });
  const now = dayjs();

  try {
    const data = await getPirceData();
    if (!data) {
      return ctx.api.editMessageText(
        ctx.chat?.id!,
        message.message_id,
        "获取价格失败"
      );
    }
    let reply = `Okx大宗交易前5名价格 
获取时间:${now.tz("Asia/Shanghai").format("YYYY-MM-DD HH:mm")}\n`;
    reply += data.data.buy
      .slice(0, 5)
      .map(({ price }, idx) => `第${idx + 1}位 ¥${price}\n`);
    return ctx.api.editMessageText(
      ctx.chat?.id!,
      message.message_id,
      sanitizeMarkdown(reply),
      {
        parse_mode: "MarkdownV2",
      }
    );
  } catch (error) {
    return ctx.api.editMessageText(
      ctx.chat?.id!,
      message.message_id,
      "获取价格失败"
    );
  }
}
export async function handleStartOrHelp(ctx: CommandContext<IContext>) {
  let context = `你好| ${ctx.from?.first_name}\n`;
  context += `
  当前支持功能:
    - 发送 \`价格\` 可以获取Okx大宗交易价格
    - 发送 \`info T...\` 可以获取Tron地址信息
    - 发送 \`risk T...\` 可以检测Tron地址风险
    `;
  const address = await db.address.findFirst({ where: { name: "能量" } });
  if (address) {
    context += `
      
  当前能量地址信息:
  能量单价: ${address.price}TRX/笔
  转账地址: \`${address.address}\`(点击复制)`;
  }
  return await ctx.reply(sanitizeMarkdown(context), {
    parse_mode: "MarkdownV2",
    reply_parameters: { message_id: ctx.message?.message_id! },
  });
}
export async function handleId(ctx: CommandContext<IContext>) {
  return ctx.reply(
    sanitizeMarkdown(`
    您的ID: \`${ctx.from?.id}\`
    当前会话ID: \`${ctx.chat?.id}\`
    当前消息ID: \`${ctx.message?.message_id}\`
    ${
      ctx.message?.message_thread_id?.toString()
        ? `会话线程ID: \`${ctx.message?.message_thread_id}\``
        : ""
    }      
            `),
    {
      parse_mode: "MarkdownV2",
      reply_parameters: { message_id: ctx.message?.message_id! },
    }
  );
}
export async function handleRiskOrInfo(ctx: CommandContext<IContext>) {
  if (ctx.hasCommand("risk")) {
    ctx.session.lastAction = SessionAction.Risk;
  }
  if (ctx.hasCommand("info")) {
    ctx.session.lastAction = SessionAction.Info;
  }
  return ctx.reply("请输入地址", {
    reply_markup: {
      force_reply: true,
    },
    reply_parameters: {
      message_id: ctx.message?.message_id!,
      chat_id: ctx.chat.id,
    },
  });
}
export async function handleClose(ctx: CallbackQueryContext<IContext>) {
  return ctx.deleteMessage();
}
export async function checkPremium(ctx: IContext, next: NextFunction) {
  if (!ctx.session.client?.premium) {
    return ctx.reply("无权操作,请先授权");
  }
  return next();
}
export async function handleAuth(ctx: HearsContext<IContext>) {
  const pass = ctx.match[1];
  if (pass !== process.env.PASS) {
    return ctx.reply("无效授权码");
  }
  ctx.session.client = await db.client.update({
    where: { id: ctx.from?.id! },
    data: { premium: true },
  });
  return ctx.reply("授权成功");
}
export async function handleAuthAdd(ctx: HearsContext<IContext>) {
  const id = parseInt(ctx.match[1]);
  const client = await db.client.findUnique({ where: { id } });
  if (!client) {
    return ctx.reply("该ID用户尚未使用机器人,请让用户使用机器人后再进行授权");
  }
  await db.client.update({
    where: { id },
    data: { premium: true },
  });
  return ctx.reply("授权成功");
}
export async function handleAuthRemove(ctx: HearsContext<IContext>) {
  const id = parseInt(ctx.match[1]);
  const client = await db.client.findUnique({ where: { id } });
  if (!client) {
    return ctx.reply("该ID用户尚未使用机器人,请让用户使用机器人后再进行授权");
  }
  await db.client.update({
    where: { id },
    data: { premium: false },
  });
  return ctx.reply("移除授权成功");
}
export async function handleAddressAdd(ctx: HearsContext<IContext>) {
  const address = ctx.match[1];
  const price = parseFloat(ctx.match[2]);
  const name = ctx.match[3];
  const addressInfo = await db.address.findFirst({ where: { name } });
  if (addressInfo) {
    return ctx.reply("该名称已存在");
  }
  await db.address.create({
    data: {
      address,
      price,
      name,
    },
  });
  return ctx.reply("添加成功");
}
export async function handleAddressRemove(ctx: HearsContext<IContext>) {
  const name = ctx.match[1];
  const addressInfo = await db.address.findFirst({ where: { name } });
  if (!addressInfo) {
    return ctx.reply("该名称不存在");
  }
  await db.address.delete({ where: { id: addressInfo.id } });
  return ctx.reply("删除成功");
}
export async function handleNotify(ctx: HearsContext<IContext>) {
  const notifyContent = ctx.match[1];
  const clients = await db.client.findMany();
  let count = 0;
  for (let client of clients) {
    try {
      await ctx.api.sendMessage(client.id.toString(), notifyContent);
      count++;
    } catch (error) {}
  }
  return ctx.reply(`通知发送成功,共${clients.length}个用户,成功发送${count}个`);
}
export async function middlewareClientToBD(ctx: IContext, next: NextFunction) {
  const { from } = ctx;
  if (from?.is_bot) {
    return;
  }
  if (!from?.id && !from?.first_name) {
    return;
  }
  let client = await db.client.findUnique({ where: { id: from.id } });
  if (!client) {
    client = await db.client.create({
      data: from,
    });
  } else {
    client = await db.client.update({
      where: { id: from.id },
      data: from,
    });
  }
  ctx.session.client = client;
  return next();
}
export async function handleEngery(ctx: CommandContext<IContext>) {
  const address = await db.address.findFirst({ where: { name: "能量" } });
  if (!address) {
    return ctx.reply("未设置能量地址");
  }
  return ctx.reply(
    sanitizeMarkdown(
      `能量单价: ${address.price}TRX/笔\n转账地址: \`${address.address}\``
    ),
    {
      parse_mode: "MarkdownV2",
    }
  );
}
