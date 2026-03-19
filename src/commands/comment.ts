import arg from "arg";
import process from "node:process";
import { getQiitaApiInstance } from "../lib/get-qiita-api-instance";

const USAGE = `Usage:
  npx qiita comment list <article_id>
  npx qiita comment get <comment_id>
  npx qiita comment create <article_id> --body <body>
  npx qiita comment edit <comment_id> --body <body>
  npx qiita comment delete <comment_id>`;

export const comment = async (argv: string[]) => {
  const subcommand = argv[0];
  if (!subcommand || subcommand === "--help" || subcommand === "-h") {
    console.log(USAGE);
    return;
  }

  const subArgv = argv.slice(1);

  switch (subcommand) {
    case "list":
      await listComments(subArgv);
      break;
    case "get":
      await getComment(subArgv);
      break;
    case "create":
      await createComment(subArgv);
      break;
    case "edit":
      await editComment(subArgv);
      break;
    case "delete":
      await deleteComment(subArgv);
      break;
    default:
      console.error(`Unknown subcommand '${subcommand}'`);
      console.error();
      console.error(USAGE);
      process.exit(1);
  }
};

async function listComments(argv: string[]) {
  const chalk = (await import("chalk")).default;
  const args = arg({ "--json": Boolean }, { argv, permissive: true });
  const articleId = args._[0];
  if (!articleId) {
    console.error(
      "記事IDを指定してください。例: npx qiita comment list <article_id>",
    );
    process.exit(1);
  }

  const qiitaApi = await getQiitaApiInstance();
  const comments = await qiitaApi.getItemComments(articleId);

  if (comments.length === 0) {
    if (args["--json"]) {
      console.log(JSON.stringify([]));
    } else {
      console.log("コメントはありません。");
    }
    return;
  }

  if (args["--json"]) {
    console.log(JSON.stringify(comments, null, 2));
  } else {
    comments.forEach((c) => {
      console.log(
        chalk.bold(`[${c.id}]`),
        chalk.cyan(`@${c.user.id}`),
        chalk.gray(c.created_at),
      );
      console.log(c.body);
      console.log();
    });
  }
}

async function getComment(argv: string[]) {
  const chalk = (await import("chalk")).default;
  const args = arg({ "--json": Boolean }, { argv, permissive: true });
  const commentId = args._[0];
  if (!commentId) {
    console.error(
      "コメントIDを指定してください。例: npx qiita comment get <comment_id>",
    );
    process.exit(1);
  }

  const qiitaApi = await getQiitaApiInstance();
  const c = await qiitaApi.getComment(commentId);

  if (args["--json"]) {
    console.log(JSON.stringify(c, null, 2));
  } else {
    console.log(
      chalk.bold(`[${c.id}]`),
      chalk.cyan(`@${c.user.id}`),
      chalk.gray(c.created_at),
    );
    console.log(c.body);
  }
}

async function createComment(argv: string[]) {
  const chalk = (await import("chalk")).default;
  const args = arg(
    { "--body": String, "--json": Boolean },
    { argv, permissive: true },
  );
  const articleId = args._[0];
  if (!articleId) {
    console.error(
      "記事IDを指定してください。例: npx qiita comment create <article_id> --body <body>",
    );
    process.exit(1);
  }

  let body = args["--body"];
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
    console.error("--body が必要です。");
    process.exit(1);
  }

  const qiitaApi = await getQiitaApiInstance();
  const created = await qiitaApi.postComment(articleId, body);

  if (args["--json"]) {
    console.log(JSON.stringify(created, null, 2));
  } else {
    console.log(chalk.green("コメントを投稿しました。"));
    console.log(chalk.bold("ID:"), created.id);
  }
}

async function editComment(argv: string[]) {
  const chalk = (await import("chalk")).default;
  const args = arg(
    { "--body": String, "--json": Boolean },
    { argv, permissive: true },
  );
  const commentId = args._[0];
  if (!commentId) {
    console.error(
      "コメントIDを指定してください。例: npx qiita comment edit <comment_id> --body <body>",
    );
    process.exit(1);
  }

  let body = args["--body"];
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
    console.error("--body が必要です。");
    process.exit(1);
  }

  const qiitaApi = await getQiitaApiInstance();
  const updated = await qiitaApi.patchComment(commentId, body);

  if (args["--json"]) {
    console.log(JSON.stringify(updated, null, 2));
  } else {
    console.log(chalk.green("コメントを更新しました。"));
    console.log(chalk.bold("ID:"), updated.id);
  }
}

async function deleteComment(argv: string[]) {
  const chalk = (await import("chalk")).default;
  const args = arg({ "--json": Boolean }, { argv, permissive: true });
  const commentId = args._[0];
  if (!commentId) {
    console.error(
      "コメントIDを指定してください。例: npx qiita comment delete <comment_id>",
    );
    process.exit(1);
  }

  const qiitaApi = await getQiitaApiInstance();
  await qiitaApi.deleteComment(commentId);

  if (args["--json"]) {
    console.log(JSON.stringify({ deleted: commentId }));
  } else {
    console.log(chalk.green("コメントを削除しました。"));
  }
}
