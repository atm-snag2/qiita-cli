import arg from "arg";
import { getQiitaApiInstance } from "../lib/get-qiita-api-instance";

export const search = async (argv: string[]) => {
  const chalk = (await import("chalk")).default;
  const args = arg(
    {
      "--page": Number,
      "--per-page": Number,
      "--json": Boolean, // Added --json option
    },
    { argv, permissive: true },
  );

  const query = args._.join(" ");
  if (!query) {
    console.error(
      "検索ワードを指定してください。例: npx qiita search 'Qiita CLI'",
    );
    process.exit(1);
  }

  const page = args["--page"] || 1;
  const perPage = args["--per-page"] || 20;
  const outputJson = args["--json"] || false; // Get --json value

  const qiitaApi = await getQiitaApiInstance();
  const items = await qiitaApi.items(page, perPage, query);

  if (items.length === 0) {
    if (outputJson) {
      console.log(JSON.stringify([])); // Output empty array for JSON
    } else {
      console.log("見つかりませんでした。");
    }
    return;
  }

  if (outputJson) {
    // Output relevant item data as JSON
    console.log(
      JSON.stringify(
        items.map((item) => ({
          id: item.id,
          title: item.title,
          url: `https://qiita.com/${item.organization_url_name || "users"}${
            item.organization_url_name ? "/items" : ""
          }/${item.id}`,
          organization_url_name: item.organization_url_name,
          // Add other fields if needed for AI consumption
        })),
        null,
        2, // Pretty print JSON
      ),
    );
  } else {
    // Original human-readable output
    items.forEach((item) => {
      const userOrOrg = item.organization_url_name || "users"; // Fallback to 'users' if organization_url_name is null
      console.log(`${chalk.bold(item.title)}`); // <--- chalk.bold is re-inserted here
      const pathSegment = item.organization_url_name
        ? `/${userOrOrg}/items`
        : `/${userOrOrg}`;
      console.log(`  https://qiita.com${pathSegment}/${item.id}`);
    });
  }
};
