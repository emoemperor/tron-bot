import Link from "next/link";
import { bot } from "./bot";

export default async function Home() {
  await bot.init();
  return (
    <main className="w-full h-full flex flex-col justify-center items-center ">
      <p>Telegram Bot</p>
      <div>
        <Link href={`https://t.me/${bot.botInfo.username}`}>
          <p>{bot.botInfo.first_name}</p>
        </Link>
      </div>
    </main>
  );
}
