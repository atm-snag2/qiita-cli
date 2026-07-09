import process from "node:process";
import { getQiitaApiInstance } from "../lib/get-qiita-api-instance";

const USAGE = `Usage:
  npx qiita api <method> <path> [--data <json>]

Examples:
  npx qiita api GET /api/v2/authenticated_user
  npx qiita api GET /api/v2/items?query=qiita
  npx qiita api POST /api/v2/items/abc123/reactions --data '{"name":"+1"}'
  npx qiita api DELETE /api/v2/items/abc123/reactions/+1`;

export const api = async (argv: string[]) => {
  const method = argv[0];
  if (!method || method === "--help" || method === "-h") {
    console.log(USAGE);
    return;
  }

  const remaining = argv.slice(1);
  let path: string | undefined;
  let data: string | undefined;

  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i] === "--data" || remaining[i] === "-d") {
      data = remaining[i + 1];
      if (!data) {
        console.error("--data の値を指定してください。");
        process.exit(1);
      }
      i++;
    } else if (!path) {
      path = remaining[i];
    }
  }

  if (!path) {
    console.error("パスを指定してください。");
    console.error();
    console.error(USAGE);
    process.exit(1);
  }

  const qiitaApi = await getQiitaApiInstance();
  const result = await qiitaApi.rawRequest(method, path, data);

  if (typeof result === "string") {
    console.log(result);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
};
