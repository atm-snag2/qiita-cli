import arg from "arg";
import { getQiitaApiInstance } from "../lib/get-qiita-api-instance";
import type { Group } from "../qiita-api";

const PER_PAGE = 100;

export const groups = async (argv: string[]) => {
  const chalk = (await import("chalk")).default;
  const args = arg(
    {
      "--json": Boolean,
    },
    { argv, permissive: true },
  );

  const outputJson = args["--json"] || false;

  const qiitaApi = await getQiitaApiInstance();

  const groupList: Group[] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const batch = await qiitaApi.getGroups(page, PER_PAGE);
    groupList.push(...batch);
    hasMore = batch.length >= PER_PAGE;
    page++;
  }

  if (groupList.length === 0) {
    if (outputJson) {
      console.log(JSON.stringify([]));
    } else {
      console.log("グループはありません");
    }
    return;
  }

  if (outputJson) {
    console.log(JSON.stringify(groupList, null, 2));
    return;
  }

  groupList.forEach((group, index) => {
    if (index > 0) console.log("");

    console.log(chalk.bold(group.name));
    console.log(`  url_name:    ${group.url_name}`);
    console.log(`  説明:        ${group.description || "(なし)"}`);
    console.log(`  公開範囲:    ${group.private ? "非公開" : "公開"}`);
  });
};
