import { Client } from "@prisma/client";
import { Bot, Context, session, SessionFlavor } from "grammy";
import {
  checkPremium,
  handleAddressAdd,
  handleAddressRemove,
  handleAuth,
  handleAuthAdd,
  handleAuthRemove,
  handleClose,
  handleId,
  handleInfoQuery,
  handleNotify,
  handlePrice,
  handleRiskOrInfo,
  handleRiskQuery,
  handleStartOrHelp,
  handleTransactionQuery,
  middlewareClientToBD,
} from "./handlers";

export enum SessionAction {
  Risk = "risk",
  Info = "info",
}
export interface SessionData {
  client?: Client;
  lastAction?: SessionAction;
}
export type IContext = Context & SessionFlavor<SessionData>;
export const bot = new Bot<IContext>(process.env.BOT_TOKEN!);
function initSession(): SessionData {
  return {};
}
bot.use(session({ initial: initSession }));
bot.use(middlewareClientToBD);
bot.api.setMyCommands([
  { command: "start", description: "开始" },
  { command: "help", description: "帮助" },
  { command: "engery", description: "获取能量" },
  { command: "price", description: "获取价格" },
  { command: "info", description: "查询地址信息" },
  { command: "risk", description: "检测地址风险" },
  { command: "id", description: "获取ID" },
]);

bot.command(["start", "help"], handleStartOrHelp);
bot.command(["risk", "info"], handleRiskOrInfo);
bot.command("id", handleId);
bot.command("price", handlePrice);

bot.hears(/^授权 (.*)/, handleAuth);
bot.hears(/增加授权 (\d+)/, checkPremium, handleAuthAdd);
bot.hears(/移除授权 (\d+)/, checkPremium, handleAuthRemove);
bot.hears(
  /设置地址 (T[A-Za-z0-9]{33}) (\d+(?:\.\d+)?) (.*)/,
  checkPremium,
  handleAddressAdd
);
bot.hears(/^通知 (.*)/, checkPremium, handleNotify);
bot.hears(/^删除地址 (.*)/, checkPremium, handleAddressRemove);
bot.hears(/risk (T[A-Za-z0-9]{33})/, handleRiskQuery);
bot.hears(/info (T[A-Za-z0-9]{33})/, handleInfoQuery);
bot.hears(/^价格/, handlePrice);

bot.callbackQuery(/transaction (T[A-Za-z0-9]{33})/, handleTransactionQuery);
bot.callbackQuery(/info (T[A-Za-z0-9]{33})/, handleInfoQuery);
bot.callbackQuery(/risk (T[A-Za-z0-9]{33})/, handleRiskQuery);
bot.callbackQuery("close", handleClose);

bot.catch((err) => {
  console.error(err);
});

bot.on("message", async (ctx) => {
  if (ctx.session.lastAction) {
    switch (ctx.session.lastAction) {
      case SessionAction.Risk:
        ctx.session.lastAction = undefined;
        return await handleRiskQuery(ctx);
      case SessionAction.Info:
        ctx.session.lastAction = undefined;
        return await handleInfoQuery(ctx);
      default:
        break;
    }
  } else {
    console.log(ctx.message);
    return ctx.reply("未知命令");
  }
});
