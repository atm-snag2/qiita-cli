import { getQiitaApiInstance } from "../lib/get-qiita-api-instance";
import { reaction } from "./reaction";
import type { QiitaApi, Reaction } from "../qiita-api";

jest.mock("../lib/get-qiita-api-instance");
const mockGetQiitaApiInstance = jest.mocked(getQiitaApiInstance);

describe("reaction", () => {
  let mockQiitaApi: jest.Mocked<QiitaApi>;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  const mockReaction: Reaction = {
    name: "thumbsup",
    image_url: "https://cdn.qiita.com/emoji/thumbsup.png",
    created_at: "2023-01-01T00:00:00Z",
    user: { id: "mock_user", name: "Mock User" },
  };

  beforeEach(() => {
    mockQiitaApi = {
      getItemReactions: jest.fn(),
      postItemReaction: jest.fn(),
      getCommentReactions: jest.fn(),
      postCommentReaction: jest.fn(),
      deleteItemReaction: jest.fn(),
      deleteCommentReaction: jest.fn(),
      getDomainName: jest.fn().mockReturnValue("qiita.com"),
    } as Partial<jest.Mocked<QiitaApi>> as jest.Mocked<QiitaApi>;
    mockGetQiitaApiInstance.mockReturnValue(Promise.resolve(mockQiitaApi));

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit() was called.");
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  describe("list", () => {
    it("記事IDがない場合、エラーを表示して終了する", async () => {
      await expect(reaction(["list"])).rejects.toThrow(
        "process.exit() was called.",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "記事IDを指定してください。例: npx qiita reaction list <article_id>",
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("リアクションがない場合、メッセージを表示する", async () => {
      mockQiitaApi.getItemReactions.mockResolvedValueOnce([]);

      await reaction(["list", "mock_article_id"]);

      expect(mockQiitaApi.getItemReactions).toHaveBeenCalledWith(
        "mock_article_id",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith("リアクションはありません。");
    });

    it("リアクションをJSON形式で表示する", async () => {
      mockQiitaApi.getItemReactions.mockResolvedValueOnce([mockReaction]);

      await reaction(["list", "mock_article_id", "--json"]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        JSON.stringify([mockReaction], null, 2),
      );
    });

    it("リアクションがない場合にJSONで空配列を表示する", async () => {
      mockQiitaApi.getItemReactions.mockResolvedValueOnce([]);

      await reaction(["list", "mock_article_id", "--json"]);

      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify([]));
    });
  });

  describe("list-comment", () => {
    it("コメントIDがない場合、エラーを表示して終了する", async () => {
      await expect(reaction(["list-comment"])).rejects.toThrow(
        "process.exit() was called.",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "コメントIDを指定してください。例: npx qiita reaction list-comment <comment_id>",
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("リアクションがない場合、メッセージを表示する", async () => {
      mockQiitaApi.getCommentReactions.mockResolvedValueOnce([]);

      await reaction(["list-comment", "mock_comment_id"]);

      expect(mockQiitaApi.getCommentReactions).toHaveBeenCalledWith(
        "mock_comment_id",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith("リアクションはありません。");
    });

    it("リアクションをJSON形式で表示する", async () => {
      mockQiitaApi.getCommentReactions.mockResolvedValueOnce([mockReaction]);

      await reaction(["list-comment", "mock_comment_id", "--json"]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        JSON.stringify([mockReaction], null, 2),
      );
    });

    it("リアクションがない場合にJSONで空配列を表示する", async () => {
      mockQiitaApi.getCommentReactions.mockResolvedValueOnce([]);

      await reaction(["list-comment", "mock_comment_id", "--json"]);

      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify([]));
    });
  });

  describe("create", () => {
    it("記事IDがない場合、エラーを表示して終了する", async () => {
      await expect(reaction(["create", "--name", "thumbsup"])).rejects.toThrow(
        "process.exit() was called.",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "記事IDを指定してください。例: npx qiita reaction create <article_id> --name <emoji_name>",
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("nameがない場合、エラーを表示して終了する", async () => {
      await expect(reaction(["create", "mock_article_id"])).rejects.toThrow(
        "process.exit() was called.",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith("--name が必要です。");
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("リアクションを追加する", async () => {
      mockQiitaApi.postItemReaction.mockResolvedValueOnce(mockReaction);

      await reaction(["create", "mock_article_id", "--name", "thumbsup"]);

      expect(mockQiitaApi.postItemReaction).toHaveBeenCalledWith(
        "mock_article_id",
        "thumbsup",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "リアクションを追加しました。",
      );
    });

    it("リアクションをJSON形式で表示する", async () => {
      mockQiitaApi.postItemReaction.mockResolvedValueOnce(mockReaction);

      await reaction([
        "create",
        "mock_article_id",
        "--name",
        "thumbsup",
        "--json",
      ]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        JSON.stringify(mockReaction, null, 2),
      );
    });
  });

  describe("create-comment", () => {
    it("コメントIDがない場合、エラーを表示して終了する", async () => {
      await expect(
        reaction(["create-comment", "--name", "thumbsup"]),
      ).rejects.toThrow("process.exit() was called.");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "コメントIDを指定してください。例: npx qiita reaction create-comment <comment_id> --name <emoji_name>",
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("nameがない場合、エラーを表示して終了する", async () => {
      await expect(
        reaction(["create-comment", "mock_comment_id"]),
      ).rejects.toThrow("process.exit() was called.");
      expect(consoleErrorSpy).toHaveBeenCalledWith("--name が必要です。");
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("リアクションを追加する", async () => {
      mockQiitaApi.postCommentReaction.mockResolvedValueOnce(mockReaction);

      await reaction([
        "create-comment",
        "mock_comment_id",
        "--name",
        "thumbsup",
      ]);

      expect(mockQiitaApi.postCommentReaction).toHaveBeenCalledWith(
        "mock_comment_id",
        "thumbsup",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "リアクションを追加しました。",
      );
    });

    it("リアクションをJSON形式で表示する", async () => {
      mockQiitaApi.postCommentReaction.mockResolvedValueOnce(mockReaction);

      await reaction([
        "create-comment",
        "mock_comment_id",
        "--name",
        "thumbsup",
        "--json",
      ]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        JSON.stringify(mockReaction, null, 2),
      );
    });
  });

  describe("delete", () => {
    it("記事IDがない場合、エラーを表示して終了する", async () => {
      await expect(reaction(["delete", "--name", "thumbsup"])).rejects.toThrow(
        "process.exit() was called.",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "記事IDを指定してください。例: npx qiita reaction delete <article_id> --name <emoji_name>",
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("nameがない場合、エラーを表示して終了する", async () => {
      await expect(reaction(["delete", "mock_article_id"])).rejects.toThrow(
        "process.exit() was called.",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith("--name が必要です。");
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("リアクションを削除する", async () => {
      mockQiitaApi.deleteItemReaction.mockResolvedValueOnce(undefined as never);

      await reaction(["delete", "mock_article_id", "--name", "thumbsup"]);

      expect(mockQiitaApi.deleteItemReaction).toHaveBeenCalledWith(
        "mock_article_id",
        "thumbsup",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "リアクションを削除しました。",
      );
    });

    it("削除結果をJSON形式で表示する", async () => {
      mockQiitaApi.deleteItemReaction.mockResolvedValueOnce(undefined as never);

      await reaction([
        "delete",
        "mock_article_id",
        "--name",
        "thumbsup",
        "--json",
      ]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        JSON.stringify({ deleted: "thumbsup" }),
      );
    });
  });

  describe("delete-comment", () => {
    it("コメントIDがない場合、エラーを表示して終了する", async () => {
      await expect(
        reaction(["delete-comment", "--name", "thumbsup"]),
      ).rejects.toThrow("process.exit() was called.");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "コメントIDを指定してください。例: npx qiita reaction delete-comment <comment_id> --name <emoji_name>",
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("nameがない場合、エラーを表示して終了する", async () => {
      await expect(
        reaction(["delete-comment", "mock_comment_id"]),
      ).rejects.toThrow("process.exit() was called.");
      expect(consoleErrorSpy).toHaveBeenCalledWith("--name が必要です。");
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("リアクションを削除する", async () => {
      mockQiitaApi.deleteCommentReaction.mockResolvedValueOnce(
        undefined as never,
      );

      await reaction([
        "delete-comment",
        "mock_comment_id",
        "--name",
        "thumbsup",
      ]);

      expect(mockQiitaApi.deleteCommentReaction).toHaveBeenCalledWith(
        "mock_comment_id",
        "thumbsup",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "リアクションを削除しました。",
      );
    });

    it("削除結果をJSON形式で表示する", async () => {
      mockQiitaApi.deleteCommentReaction.mockResolvedValueOnce(
        undefined as never,
      );

      await reaction([
        "delete-comment",
        "mock_comment_id",
        "--name",
        "thumbsup",
        "--json",
      ]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        JSON.stringify({ deleted: "thumbsup" }),
      );
    });
  });

  describe("不明なサブコマンド", () => {
    it("エラーを表示して終了する", async () => {
      await expect(reaction(["unknown"])).rejects.toThrow(
        "process.exit() was called.",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Unknown subcommand 'unknown'",
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
