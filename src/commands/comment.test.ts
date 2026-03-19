import { getQiitaApiInstance } from "../lib/get-qiita-api-instance";
import { comment } from "./comment";
import type { QiitaApi, Comment } from "../qiita-api";

jest.mock("../lib/get-qiita-api-instance");
const mockGetQiitaApiInstance = jest.mocked(getQiitaApiInstance);

describe("comment", () => {
  let mockQiitaApi: jest.Mocked<QiitaApi>;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  const mockComment: Comment = {
    id: "mock_comment_id",
    body: "Mock comment body",
    rendered_body: "<p>Mock comment body</p>",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
    user: { id: "mock_user", name: "Mock User" },
  };

  beforeEach(() => {
    mockQiitaApi = {
      getItemComments: jest.fn(),
      getComment: jest.fn(),
      postComment: jest.fn(),
      patchComment: jest.fn(),
      deleteComment: jest.fn(),
      getDomainName: jest.fn().mockReturnValue("qiita.com"),
    } as Partial<jest.Mocked<QiitaApi>> as jest.Mocked<QiitaApi>;
    mockGetQiitaApiInstance.mockReturnValue(Promise.resolve(mockQiitaApi));

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit() was called.");
    });

    Object.defineProperty(process.stdin, "isTTY", {
      value: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  describe("list", () => {
    it("記事IDがない場合、エラーを表示して終了する", async () => {
      await expect(comment(["list"])).rejects.toThrow(
        "process.exit() was called.",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "記事IDを指定してください。例: npx qiita comment list <article_id>",
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("コメントがない場合、メッセージを表示する", async () => {
      mockQiitaApi.getItemComments.mockResolvedValueOnce([]);

      await comment(["list", "mock_article_id"]);

      expect(mockQiitaApi.getItemComments).toHaveBeenCalledWith(
        "mock_article_id",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith("コメントはありません。");
    });

    it("コメントをJSON形式で表示する", async () => {
      mockQiitaApi.getItemComments.mockResolvedValueOnce([mockComment]);

      await comment(["list", "mock_article_id", "--json"]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        JSON.stringify([mockComment], null, 2),
      );
    });

    it("コメントがない場合にJSONで空配列を表示する", async () => {
      mockQiitaApi.getItemComments.mockResolvedValueOnce([]);

      await comment(["list", "mock_article_id", "--json"]);

      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify([]));
    });
  });

  describe("get", () => {
    it("コメントIDがない場合、エラーを表示して終了する", async () => {
      await expect(comment(["get"])).rejects.toThrow(
        "process.exit() was called.",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "コメントIDを指定してください。例: npx qiita comment get <comment_id>",
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("コメントを取得して表示する", async () => {
      mockQiitaApi.getComment.mockResolvedValueOnce(mockComment);

      await comment(["get", "mock_comment_id"]);

      expect(mockQiitaApi.getComment).toHaveBeenCalledWith("mock_comment_id");
      expect(consoleLogSpy).toHaveBeenCalledWith(mockComment.body);
    });

    it("コメントをJSON形式で表示する", async () => {
      mockQiitaApi.getComment.mockResolvedValueOnce(mockComment);

      await comment(["get", "mock_comment_id", "--json"]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        JSON.stringify(mockComment, null, 2),
      );
    });
  });

  describe("create", () => {
    it("記事IDがない場合、エラーを表示して終了する", async () => {
      await expect(comment(["create", "--body", "test"])).rejects.toThrow(
        "process.exit() was called.",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "記事IDを指定してください。例: npx qiita comment create <article_id> --body <body>",
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("bodyがない場合、エラーを表示して終了する", async () => {
      await expect(comment(["create", "mock_article_id"])).rejects.toThrow(
        "process.exit() was called.",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith("--body が必要です。");
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("コメントを投稿する", async () => {
      mockQiitaApi.postComment.mockResolvedValueOnce(mockComment);

      await comment(["create", "mock_article_id", "--body", "test body"]);

      expect(mockQiitaApi.postComment).toHaveBeenCalledWith(
        "mock_article_id",
        "test body",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith("コメントを投稿しました。");
      expect(consoleLogSpy).toHaveBeenCalledWith("ID:", mockComment.id);
    });

    it("コメントをJSON形式で表示する", async () => {
      mockQiitaApi.postComment.mockResolvedValueOnce(mockComment);

      await comment([
        "create",
        "mock_article_id",
        "--body",
        "test body",
        "--json",
      ]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        JSON.stringify(mockComment, null, 2),
      );
    });
  });

  describe("edit", () => {
    it("コメントIDがない場合、エラーを表示して終了する", async () => {
      await expect(comment(["edit", "--body", "test"])).rejects.toThrow(
        "process.exit() was called.",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "コメントIDを指定してください。例: npx qiita comment edit <comment_id> --body <body>",
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("bodyがない場合、エラーを表示して終了する", async () => {
      await expect(comment(["edit", "mock_comment_id"])).rejects.toThrow(
        "process.exit() was called.",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith("--body が必要です。");
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("コメントを更新する", async () => {
      mockQiitaApi.patchComment.mockResolvedValueOnce(mockComment);

      await comment(["edit", "mock_comment_id", "--body", "updated body"]);

      expect(mockQiitaApi.patchComment).toHaveBeenCalledWith(
        "mock_comment_id",
        "updated body",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith("コメントを更新しました。");
      expect(consoleLogSpy).toHaveBeenCalledWith("ID:", mockComment.id);
    });

    it("コメントをJSON形式で表示する", async () => {
      mockQiitaApi.patchComment.mockResolvedValueOnce(mockComment);

      await comment([
        "edit",
        "mock_comment_id",
        "--body",
        "updated body",
        "--json",
      ]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        JSON.stringify(mockComment, null, 2),
      );
    });
  });

  describe("delete", () => {
    it("コメントIDがない場合、エラーを表示して終了する", async () => {
      await expect(comment(["delete"])).rejects.toThrow(
        "process.exit() was called.",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "コメントIDを指定してください。例: npx qiita comment delete <comment_id>",
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("コメントを削除する", async () => {
      mockQiitaApi.deleteComment.mockResolvedValueOnce(undefined);

      await comment(["delete", "mock_comment_id"]);

      expect(mockQiitaApi.deleteComment).toHaveBeenCalledWith(
        "mock_comment_id",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith("コメントを削除しました。");
    });

    it("削除結果をJSON形式で表示する", async () => {
      mockQiitaApi.deleteComment.mockResolvedValueOnce(undefined);

      await comment(["delete", "mock_comment_id", "--json"]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        JSON.stringify({ deleted: "mock_comment_id" }),
      );
    });
  });

  describe("不明なサブコマンド", () => {
    it("エラーを表示して終了する", async () => {
      await expect(comment(["unknown"])).rejects.toThrow(
        "process.exit() was called.",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Unknown subcommand 'unknown'",
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
