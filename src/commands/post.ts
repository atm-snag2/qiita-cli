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
      "--private": Boolean,
      "--body": String,
      "--organization": String,
      "--slide": Boolean,
      "--json": Boolean,
    },
    { argv, permissive: true },
  );

  const id = args["--id"];
  let body = args["--body"];
  const title = args["--title"];
  const tagsStr = args["--tags"];
  const isPrivate = args["--private"];
  const organizationUrlName = args["--organization"];
  const slide = args["--slide"];
  const outputJson = args["--json"] || false;

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

      responseItem = await qiitaApi.patchItem({
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
      });

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

      responseItem = await qiitaApi.postItem({
        rawBody: body,
        title,
        tags: tagsStr.split(",").map((t) => t.trim()),
        isPrivate: isPrivate ?? true, // Default to private for safety
        organizationUrlName: organizationUrlName ?? null,
        slide: slide ?? false,
      });

      if (!outputJson) {
        // No log message for create, only URL at the end
      }
    }

    if (outputJson) {
      console.log(JSON.stringify(responseItem, null, 2));
    } else {
      const url = `https://qiita.com/${
        responseItem.organization_url_name || "users"
      }${responseItem.organization_url_name ? "/items" : ""}/${responseItem.id}`;
      console.log(chalk.cyan(url));
    }
  } catch (err) {
    console.error(chalk.red("Error: Failed to post item"));
    throw err;
  }
};
