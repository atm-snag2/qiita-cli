jest.mock("../lib/get-qiita-api-instance");

import { getQiitaApiInstance } from "../lib/get-qiita-api-instance";
import { post } from "./post";
import type { QiitaApi, Item } from "../qiita-api";

const mockGetQiitaApiInstance = jest.mocked(getQiitaApiInstance);

describe("post", () => {
  let mockQiitaApi: jest.Mocked<QiitaApi>;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  const mockItem: Item = {
    body: "Mock Body",
    id: "mock_id",
    url: "https://qiita.com/mock_user/items/mock_id",
    private: true,
    tags: [{ name: "test" }],
    title: "Mock Title",
    organization_url_name: null,
    coediting: false,
    group_url_name: null,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
    slide: false,
    posting_campaign_uuid: null,
  };

  beforeEach(() => {
    mockQiitaApi = {
      getItem: jest.fn(),
      postItem: jest.fn(),
      patchItem: jest.fn(),
      getDomainName: jest.fn().mockReturnValue("qiita.com"),
    } as Partial<jest.Mocked<QiitaApi>> as jest.Mocked<QiitaApi>;
    mockGetQiitaApiInstance.mockReturnValue(Promise.resolve(mockQiitaApi));

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit() was called.");
    });

    // Mock stdin
    Object.defineProperty(process.stdin, "isTTY", {
      value: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("bodyがない場合、エラーを表示して終了する", async () => {
    await expect(post([])).rejects.toThrow("process.exit() was called.");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("--body or --body-file is required"),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("新規作成：titleがない場合、エラーを表示して終了する", async () => {
    await expect(post(["--body", "test content"])).rejects.toThrow(
      "process.exit() was called.",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error: --title is required"),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("新規作成：tagsがない場合、エラーを表示して終了する", async () => {
    await expect(
      post(["--body", "test content", "--title", "test title"]),
    ).rejects.toThrow("process.exit() was called.");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error: --tags is required"),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("新規作成：正常に記事を作成できる", async () => {
    mockQiitaApi.postItem.mockResolvedValueOnce(mockItem);

    await post([
      "--title",
      "Mock Title",
      "--tags",
      "test",
      "--body",
      "Mock Body",
    ]);

    expect(mockQiitaApi.postItem).toHaveBeenCalledWith({
      rawBody: "Mock Body",
      title: "Mock Title",
      tags: ["test"],
      isPrivate: true,
      organizationUrlName: null,
      slide: false,
      coediting: false,
      groupUrlName: null,
    });
    expect(consoleLogSpy).toHaveBeenCalledWith(mockItem.url);
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
  });

  it("更新：正常に記事を更新できる", async () => {
    mockQiitaApi.getItem.mockResolvedValueOnce(mockItem);
    mockQiitaApi.patchItem.mockResolvedValueOnce({
      ...mockItem,
      body: "Updated Body",
    });

    await post(["--id", "mock_id", "--body", "Updated Body"]);

    expect(mockQiitaApi.getItem).toHaveBeenCalledWith("mock_id");
    expect(mockQiitaApi.patchItem).toHaveBeenCalledWith({
      uuid: "mock_id",
      rawBody: "Updated Body",
      title: mockItem.title,
      tags: ["test"],
      isPrivate: mockItem.private,
      commitMessage: undefined,
    });
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "https://qiita.com/mock_user/items/mock_id",
    );
  });

  it("新規作成：--private false で公開記事を作成できる", async () => {
    mockQiitaApi.postItem.mockResolvedValueOnce({
      ...mockItem,
      private: false,
    });

    await post([
      "--title",
      "Mock Title",
      "--tags",
      "test",
      "--body",
      "Mock Body",
      "--private",
      "false",
    ]);

    expect(mockQiitaApi.postItem).toHaveBeenCalledWith(
      expect.objectContaining({ isPrivate: false }),
    );
  });

  it("新規作成：--private true で限定共有記事を作成できる", async () => {
    mockQiitaApi.postItem.mockResolvedValueOnce(mockItem);

    await post([
      "--title",
      "Mock Title",
      "--tags",
      "test",
      "--body",
      "Mock Body",
      "--private",
      "true",
    ]);

    expect(mockQiitaApi.postItem).toHaveBeenCalledWith(
      expect.objectContaining({ isPrivate: true }),
    );
  });

  it("新規作成：--private 未指定の場合、デフォルトで限定共有になる", async () => {
    mockQiitaApi.postItem.mockResolvedValueOnce(mockItem);

    await post([
      "--title",
      "Mock Title",
      "--tags",
      "test",
      "--body",
      "Mock Body",
    ]);

    expect(mockQiitaApi.postItem).toHaveBeenCalledWith(
      expect.objectContaining({ isPrivate: true }),
    );
  });

  it("更新：--commit-messageを指定できる", async () => {
    mockQiitaApi.getItem.mockResolvedValueOnce(mockItem);
    mockQiitaApi.patchItem.mockResolvedValueOnce({
      ...mockItem,
      body: "Updated Body",
    });

    await post([
      "--id",
      "mock_id",
      "--body",
      "Updated Body",
      "--commit-message",
      "コメント機能を追加",
    ]);

    expect(mockQiitaApi.patchItem).toHaveBeenCalledWith(
      expect.objectContaining({
        commitMessage: "コメント機能を追加",
      }),
    );
  });

  it("新規作成：--posting-campaign-uuid と --agreed-posting-campaign-term で投稿キャンペーンに紐付けできる", async () => {
    mockQiitaApi.postItem.mockResolvedValueOnce({
      ...mockItem,
      private: false,
    });

    await post([
      "--title",
      "Mock Title",
      "--tags",
      "test",
      "--body",
      "Mock Body",
      "--private",
      "false",
      "--posting-campaign-uuid",
      "910c5be7d2d6a043a12b",
      "--agreed-posting-campaign-term",
    ]);

    expect(mockQiitaApi.postItem).toHaveBeenCalledWith(
      expect.objectContaining({
        postingCampaignUuid: "910c5be7d2d6a043a12b",
        agreedPostingCampaignTerm: true,
      }),
    );
  });

  it("新規作成：--posting-campaign-uuid を指定したのに --agreed-posting-campaign-term がないとエラー", async () => {
    await expect(
      post([
        "--title",
        "Mock Title",
        "--tags",
        "test",
        "--body",
        "Mock Body",
        "--posting-campaign-uuid",
        "910c5be7d2d6a043a12b",
      ]),
    ).rejects.toThrow("process.exit() was called.");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("--agreed-posting-campaign-term"),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(mockQiitaApi.postItem).not.toHaveBeenCalled();
  });

  it("新規作成：--posting-campaign-uuid 指定 + --private 未指定 (デフォルト限定共有) はエラー", async () => {
    await expect(
      post([
        "--title",
        "Mock Title",
        "--tags",
        "test",
        "--body",
        "Mock Body",
        "--posting-campaign-uuid",
        "910c5be7d2d6a043a12b",
        "--agreed-posting-campaign-term",
      ]),
    ).rejects.toThrow("process.exit() was called.");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "限定共有記事に投稿キャンペーンを紐付けることはできません",
      ),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(mockQiitaApi.postItem).not.toHaveBeenCalled();
  });

  it("新規作成：--posting-campaign-uuid 指定 + --private true はエラー", async () => {
    await expect(
      post([
        "--title",
        "Mock Title",
        "--tags",
        "test",
        "--body",
        "Mock Body",
        "--private",
        "true",
        "--posting-campaign-uuid",
        "910c5be7d2d6a043a12b",
        "--agreed-posting-campaign-term",
      ]),
    ).rejects.toThrow("process.exit() was called.");
    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(mockQiitaApi.postItem).not.toHaveBeenCalled();
  });

  it("更新：既存記事が限定共有で --posting-campaign-uuid 指定するとエラー", async () => {
    mockQiitaApi.getItem.mockResolvedValueOnce({
      ...mockItem,
      private: true,
    });

    await expect(
      post([
        "--id",
        "mock_id",
        "--body",
        "Updated Body",
        "--posting-campaign-uuid",
        "910c5be7d2d6a043a12b",
        "--agreed-posting-campaign-term",
      ]),
    ).rejects.toThrow("process.exit() was called.");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "限定共有記事に投稿キャンペーンを紐付けることはできません",
      ),
    );
    expect(mockQiitaApi.patchItem).not.toHaveBeenCalled();
  });

  it("更新：既存記事が限定共有でも --private false 同時指定なら通る", async () => {
    mockQiitaApi.getItem.mockResolvedValueOnce({
      ...mockItem,
      private: true,
    });
    mockQiitaApi.patchItem.mockResolvedValueOnce({
      ...mockItem,
      private: false,
    });

    await post([
      "--id",
      "mock_id",
      "--body",
      "Updated Body",
      "--private",
      "false",
      "--posting-campaign-uuid",
      "910c5be7d2d6a043a12b",
      "--agreed-posting-campaign-term",
    ]);

    expect(mockQiitaApi.patchItem).toHaveBeenCalledWith(
      expect.objectContaining({
        isPrivate: false,
        postingCampaignUuid: "910c5be7d2d6a043a12b",
        agreedPostingCampaignTerm: true,
      }),
    );
  });

  it("新規作成：--private false + --posting-campaign-uuid なら通る", async () => {
    mockQiitaApi.postItem.mockResolvedValueOnce({
      ...mockItem,
      private: false,
    });

    await post([
      "--title",
      "Mock Title",
      "--tags",
      "test",
      "--body",
      "Mock Body",
      "--private",
      "false",
      "--posting-campaign-uuid",
      "910c5be7d2d6a043a12b",
      "--agreed-posting-campaign-term",
    ]);

    expect(mockQiitaApi.postItem).toHaveBeenCalledWith(
      expect.objectContaining({
        isPrivate: false,
        postingCampaignUuid: "910c5be7d2d6a043a12b",
        agreedPostingCampaignTerm: true,
      }),
    );
  });

  it("更新：--posting-campaign-uuid に空文字列を渡すと null で登録解除する", async () => {
    mockQiitaApi.getItem.mockResolvedValueOnce(mockItem);
    mockQiitaApi.patchItem.mockResolvedValueOnce(mockItem);

    await post([
      "--id",
      "mock_id",
      "--body",
      "Updated Body",
      "--posting-campaign-uuid",
      "",
    ]);

    expect(mockQiitaApi.patchItem).toHaveBeenCalledWith(
      expect.objectContaining({
        postingCampaignUuid: null,
      }),
    );
    expect(mockQiitaApi.patchItem.mock.calls[0][0]).not.toHaveProperty(
      "agreedPostingCampaignTerm",
    );
  });

  it("更新：campaign 関連オプションを指定しないと送信されない", async () => {
    mockQiitaApi.getItem.mockResolvedValueOnce(mockItem);
    mockQiitaApi.patchItem.mockResolvedValueOnce(mockItem);

    await post(["--id", "mock_id", "--body", "Updated Body"]);

    const call = mockQiitaApi.patchItem.mock.calls[0][0];
    expect(call).not.toHaveProperty("postingCampaignUuid");
    expect(call).not.toHaveProperty("agreedPostingCampaignTerm");
  });

  it("新規作成：--coediting で共同編集モードを有効にできる", async () => {
    mockQiitaApi.postItem.mockResolvedValueOnce({
      ...mockItem,
      coediting: true,
    });

    await post([
      "--title",
      "Mock Title",
      "--tags",
      "test",
      "--body",
      "Mock Body",
      "--coediting",
    ]);

    expect(mockQiitaApi.postItem).toHaveBeenCalledWith(
      expect.objectContaining({ coediting: true }),
    );
  });

  it("新規作成：--group でグループを指定できる", async () => {
    mockQiitaApi.postItem.mockResolvedValueOnce({
      ...mockItem,
      group_url_name: "dev-team",
    });

    await post([
      "--title",
      "Mock Title",
      "--tags",
      "test",
      "--body",
      "Mock Body",
      "--group",
      "dev-team",
    ]);

    expect(mockQiitaApi.postItem).toHaveBeenCalledWith(
      expect.objectContaining({ groupUrlName: "dev-team" }),
    );
  });

  it("更新：--coediting で共同編集モードを変更できる", async () => {
    mockQiitaApi.getItem.mockResolvedValueOnce(mockItem);
    mockQiitaApi.patchItem.mockResolvedValueOnce({
      ...mockItem,
      coediting: true,
    });

    await post(["--id", "mock_id", "--body", "Updated Body", "--coediting"]);

    expect(mockQiitaApi.patchItem).toHaveBeenCalledWith(
      expect.objectContaining({ coediting: true }),
    );
  });

  it("更新：--group でグループを変更できる", async () => {
    mockQiitaApi.getItem.mockResolvedValueOnce(mockItem);
    mockQiitaApi.patchItem.mockResolvedValueOnce({
      ...mockItem,
      group_url_name: "dev-team",
    });

    await post([
      "--id",
      "mock_id",
      "--body",
      "Updated Body",
      "--group",
      "dev-team",
    ]);

    expect(mockQiitaApi.patchItem).toHaveBeenCalledWith(
      expect.objectContaining({ groupUrlName: "dev-team" }),
    );
  });

  it("更新：coediting/group/slide/organization 未指定なら送信しない", async () => {
    mockQiitaApi.getItem.mockResolvedValueOnce(mockItem);
    mockQiitaApi.patchItem.mockResolvedValueOnce(mockItem);

    await post(["--id", "mock_id", "--body", "Updated Body"]);

    const call = mockQiitaApi.patchItem.mock.calls[0][0];
    expect(call).not.toHaveProperty("coediting");
    expect(call).not.toHaveProperty("groupUrlName");
    expect(call).not.toHaveProperty("slide");
    expect(call).not.toHaveProperty("organizationUrlName");
  });

  it("JSON形式で出力できる", async () => {
    mockQiitaApi.postItem.mockResolvedValueOnce(mockItem);

    await post([
      "--title",
      "Mock Title",
      "--tags",
      "test",
      "--body",
      "Mock Body",
      "--json",
    ]);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify(mockItem, null, 2),
    );
  });
});
