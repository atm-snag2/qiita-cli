import arg from "arg";
import process from "node:process";
import { getQiitaApiInstance } from "../lib/get-qiita-api-instance";
import { Item } from "../qiita-api";

export const post = async (argv: string[]) => {
  const chalk = (await import("chalk")).default;
  const args = arg(
    {
      "--id": String,
      "--title": String,
      "--tags": String,
      "--private": String,
      "--body": String,
      "--organization": String,
      "--slide": Boolean,
      "--commit-message": String,
      "--posting-campaign-uuid": String,
      "--agreed-posting-campaign-term": Boolean,
      "--json": Boolean,
    },
    { argv, permissive: true },
  );

  const id = args["--id"];
  let body = args["--body"];
  const title = args["--title"];
  const tagsStr = args["--tags"];
  const isPrivate =
    args["--private"] === "true"
      ? true
      : args["--private"] === "false"
        ? false
        : undefined;
  const organizationUrlName = args["--organization"];
  const slide = args["--slide"];
  const commitMessage = args["--commit-message"];
  const postingCampaignUuidRaw = args["--posting-campaign-uuid"];
  const postingCampaignUuid =
    postingCampaignUuidRaw === undefined
      ? undefined
      : postingCampaignUuidRaw === ""
        ? null
        : postingCampaignUuidRaw;
  const agreedPostingCampaignTerm = args["--agreed-posting-campaign-term"];
  const outputJson = args["--json"] || false;

  if (typeof postingCampaignUuid === "string" && !agreedPostingCampaignTerm) {
    console.error(
      chalk.red(
        "Error: --agreed-posting-campaign-term is required when --posting-campaign-uuid is specified.",
      ),
    );
    process.exit(1);
  }

  // Read from stdin if body is not provided and stdin is not a TTY
  if (!body && !process.stdin.isTTY) {
    body = await new Promise<string>((resolve) => {
      let data = "";
      process.stdin.on("data", (chunk) => {
        data += chunk;
      });
      process.stdin.on("end", () => {
        resolve(data);
      });
    });
  }

  if (!body) {
    console.error(
      chalk.red(
        "Error: --body is required or must be provided via standard input.",
      ),
    );
    process.exit(1);
  }

  const qiitaApi = await getQiitaApiInstance();
  let responseItem: Item;

  try {
    if (id) {
      // Update mode
      // To support partial updates, we fetch the existing item first
      const existingItem = await qiitaApi.getItem(id);

      const patchArgs: Parameters<typeof qiitaApi.patchItem>[0] = {
        uuid: id,
        rawBody: body,
        title: title ?? existingItem.title,
        tags: tagsStr
          ? tagsStr.split(",").map((t) => t.trim())
          : existingItem.tags.map((t) => t.name),
        isPrivate: isPrivate !== undefined ? isPrivate : existingItem.private,
        organizationUrlName:
          organizationUrlName !== undefined
            ? organizationUrlName
            : existingItem.organization_url_name,
        slide: slide !== undefined ? slide : existingItem.slide,
        commitMessage,
      };
      if (postingCampaignUuid !== undefined) {
        patchArgs.postingCampaignUuid = postingCampaignUuid;
      }
      if (
        typeof postingCampaignUuid === "string" &&
        agreedPostingCampaignTerm
      ) {
        patchArgs.agreedPostingCampaignTerm = true;
      }

      if (typeof postingCampaignUuid === "string" && patchArgs.isPrivate) {
        console.error(
          chalk.red(
            "Error: 限定共有記事に投稿キャンペーンを紐付けることはできません",
          ),
        );
        process.exit(1);
      }

      responseItem = await qiitaApi.patchItem(patchArgs);

      if (!outputJson) {
        // No log message for update, only URL at the end
      }
    } else {
      // Create mode
      if (!title) {
        console.error(chalk.red("Error: --title is required for new articles"));
        process.exit(1);
      }
      if (!tagsStr) {
        console.error(chalk.red("Error: --tags is required for new articles"));
        process.exit(1);
      }

      const postArgs: Parameters<typeof qiitaApi.postItem>[0] = {
        rawBody: body,
        title,
        tags: tagsStr.split(",").map((t) => t.trim()),
        isPrivate: isPrivate ?? true, // Default to private for safety
        organizationUrlName: organizationUrlName ?? null,
        slide: slide ?? false,
      };
      if (postingCampaignUuid !== undefined) {
        postArgs.postingCampaignUuid = postingCampaignUuid;
      }
      if (
        typeof postingCampaignUuid === "string" &&
        agreedPostingCampaignTerm
      ) {
        postArgs.agreedPostingCampaignTerm = true;
      }

      if (typeof postingCampaignUuid === "string" && postArgs.isPrivate) {
        console.error(
          chalk.red(
            "Error: 限定共有記事に投稿キャンペーンを紐付けることはできません",
          ),
        );
        process.exit(1);
      }

      responseItem = await qiitaApi.postItem(postArgs);

      if (!outputJson) {
        // No log message for create, only URL at the end
      }
    }

    if (outputJson) {
      console.log(JSON.stringify(responseItem, null, 2));
    } else {
      console.log(chalk.cyan(responseItem.url));
    }
  } catch (err) {
    console.error(chalk.red("Error: Failed to post item"));
    throw err;
  }
};
