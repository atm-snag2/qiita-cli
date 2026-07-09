import arg from "arg";
import process from "node:process";
import { getQiitaApiInstance } from "../lib/get-qiita-api-instance";

const USAGE = `Usage:
  npx qiita reaction list <article_id>
  npx qiita reaction list-comment <comment_id>
  npx qiita reaction create <article_id> --name <emoji_name>
  npx qiita reaction create-comment <comment_id> --name <emoji_name>
  npx qiita reaction delete <article_id> --name <emoji_name>
  npx qiita reaction delete-comment <comment_id> --name <emoji_name>`;

export const reaction = async (argv: string[]) => {
  const subcommand = argv[0];
  if (!subcommand || subcommand === "--help" || subcommand === "-h") {
    console.log(USAGE);
    return;
  }

  const subArgv = argv.slice(1);

  switch (subcommand) {
    case "list":
      await listItemReactions(subArgv);
      break;
    case "list-comment":
      await listCommentReactions(subArgv);
      break;
    case "create":
      await createItemReaction(subArgv);
      break;
    case "create-comment":
      await createCommentReaction(subArgv);
      break;
    case "delete":
      await deleteItemReaction(subArgv);
      break;
    case "delete-comment":
      await deleteCommentReaction(subArgv);
      break;
    default:
      console.error(`Unknown subcommand '${subcommand}'`);
      console.error();
      console.error(USAGE);
      process.exit(1);
  }
};

async function listItemReactions(argv: string[]) {
  const chalk = (await import("chalk")).default;
  const args = arg({ "--json": Boolean }, { argv, permissive: true });
  const articleId = args._[0];
  if (!articleId) {
    console.error(
      "記事IDを指定してください。例: npx qiita reaction list <article_id>",
    );
    process.exit(1);
  }

  const qiitaApi = await getQiitaApiInstance();
  const reactions = await qiitaApi.getItemReactions(articleId);

  if (reactions.length === 0) {
    if (args["--json"]) {
      console.log(JSON.stringify([]));
    } else {
      console.log("リアクションはありません。");
    }
    return;
  }

  if (args["--json"]) {
    console.log(JSON.stringify(reactions, null, 2));
  } else {
    reactions.forEach((r) => {
      console.log(
        chalk.yellow(r.name),
        chalk.cyan(`@${r.user.id}`),
        chalk.gray(r.created_at),
      );
    });
  }
}

async function listCommentReactions(argv: string[]) {
  const chalk = (await import("chalk")).default;
  const args = arg({ "--json": Boolean }, { argv, permissive: true });
  const commentId = args._[0];
  if (!commentId) {
    console.error(
      "コメントIDを指定してください。例: npx qiita reaction list-comment <comment_id>",
    );
    process.exit(1);
  }

  const qiitaApi = await getQiitaApiInstance();
  const reactions = await qiitaApi.getCommentReactions(commentId);

  if (reactions.length === 0) {
    if (args["--json"]) {
      console.log(JSON.stringify([]));
    } else {
      console.log("リアクションはありません。");
    }
    return;
  }

  if (args["--json"]) {
    console.log(JSON.stringify(reactions, null, 2));
  } else {
    reactions.forEach((r) => {
      console.log(
        chalk.yellow(r.name),
        chalk.cyan(`@${r.user.id}`),
        chalk.gray(r.created_at),
      );
    });
  }
}

async function createItemReaction(argv: string[]) {
  const chalk = (await import("chalk")).default;
  const args = arg(
    { "--name": String, "--json": Boolean },
    { argv, permissive: true },
  );
  const articleId = args._[0];
  if (!articleId) {
    console.error(
      "記事IDを指定してください。例: npx qiita reaction create <article_id> --name <emoji_name>",
    );
    process.exit(1);
  }

  const name = args["--name"];
  if (!name) {
    console.error("--name が必要です。");
    process.exit(1);
  }

  const qiitaApi = await getQiitaApiInstance();
  const created = await qiitaApi.postItemReaction(articleId, name);

  if (args["--json"]) {
    console.log(JSON.stringify(created, null, 2));
  } else {
    console.log(chalk.green("リアクションを追加しました。"));
    console.log(chalk.bold("絵文字:"), created.name);
  }
}

async function createCommentReaction(argv: string[]) {
  const chalk = (await import("chalk")).default;
  const args = arg(
    { "--name": String, "--json": Boolean },
    { argv, permissive: true },
  );
  const commentId = args._[0];
  if (!commentId) {
    console.error(
      "コメントIDを指定してください。例: npx qiita reaction create-comment <comment_id> --name <emoji_name>",
    );
    process.exit(1);
  }

  const name = args["--name"];
  if (!name) {
    console.error("--name が必要です。");
    process.exit(1);
  }

  const qiitaApi = await getQiitaApiInstance();
  const created = await qiitaApi.postCommentReaction(commentId, name);

  if (args["--json"]) {
    console.log(JSON.stringify(created, null, 2));
  } else {
    console.log(chalk.green("リアクションを追加しました。"));
    console.log(chalk.bold("絵文字:"), created.name);
  }
}

async function deleteItemReaction(argv: string[]) {
  const chalk = (await import("chalk")).default;
  const args = arg(
    { "--name": String, "--json": Boolean },
    { argv, permissive: true },
  );
  const articleId = args._[0];
  if (!articleId) {
    console.error(
      "記事IDを指定してください。例: npx qiita reaction delete <article_id> --name <emoji_name>",
    );
    process.exit(1);
  }

  const name = args["--name"];
  if (!name) {
    console.error("--name が必要です。");
    process.exit(1);
  }

  const qiitaApi = await getQiitaApiInstance();
  await qiitaApi.deleteItemReaction(articleId, name);

  if (args["--json"]) {
    console.log(JSON.stringify({ deleted: name }));
  } else {
    console.log(chalk.green("リアクションを削除しました。"));
  }
}

async function deleteCommentReaction(argv: string[]) {
  const chalk = (await import("chalk")).default;
  const args = arg(
    { "--name": String, "--json": Boolean },
    { argv, permissive: true },
  );
  const commentId = args._[0];
  if (!commentId) {
    console.error(
      "コメントIDを指定してください。例: npx qiita reaction delete-comment <comment_id> --name <emoji_name>",
    );
    process.exit(1);
  }

  const name = args["--name"];
  if (!name) {
    console.error("--name が必要です。");
    process.exit(1);
  }

  const qiitaApi = await getQiitaApiInstance();
  await qiitaApi.deleteCommentReaction(commentId, name);

  if (args["--json"]) {
    console.log(JSON.stringify({ deleted: name }));
  } else {
    console.log(chalk.green("リアクションを削除しました。"));
  }
}
