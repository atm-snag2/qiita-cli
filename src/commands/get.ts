import arg from "arg";
import { getQiitaApiInstance } from "../lib/get-qiita-api-instance";

export const get = async (argv: string[]) => {
  const chalk = (await import("chalk")).default;
  const args = arg(
    {
      "--json": Boolean,
    },
    { argv, permissive: true },
  );

  const articleId = args._[0];
  if (!articleId) {
    console.error("記事IDを指定してください。例: npx qiita get <article_id>");
    process.exit(1);
  }

  const outputJson = args["--json"] || false;

  const qiitaApi = await getQiitaApiInstance();
  try {
    const item = await qiitaApi.getItem(articleId);

    if (outputJson) {
      console.log(
        JSON.stringify(
          {
            id: item.id,
            title: item.title,
            body: item.body,
            url: item.url,
            organization_url_name: item.organization_url_name,
            private: item.private,
            tags: item.tags,
            coediting: item.coediting,
            slide: item.slide,
            created_at: item.created_at,
            updated_at: item.updated_at,
          },
          null,
          2,
        ),
      );
    } else {
      console.log(chalk.bold("Title:"), item.title);
      console.log(chalk.bold("ID:"), item.id);
      console.log(chalk.bold("URL:"), item.url);
      console.log(chalk.bold("Private:"), item.private);
      console.log(
        chalk.bold("Tags:"),
        item.tags.map((tag) => tag.name).join(", "),
      );
      console.log(`
--- Body ---
`);
      console.log(item.body);
    }
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status: number }).status === 404
    ) {
      console.error(`記事ID '${articleId}' の記事は見つかりませんでした。`);
    } else if (
      typeof error === "object" &&
      error !== null &&
      "message" in error
    ) {
      console.error(
        "記事の取得中にエラーが発生しました:",
        (error as { message: string }).message,
      );
    } else {
      console.error("記事の取得中に予期せぬエラーが発生しました。", error);
    }
    process.exit(1);
  }
};
