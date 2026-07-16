jest.mock("../lib/get-qiita-api-instance");

import { getQiitaApiInstance } from "../lib/get-qiita-api-instance";
import { groups } from "./groups";
import type { QiitaApi, Group } from "../qiita-api";

const mockGetQiitaApiInstance = jest.mocked(getQiitaApiInstance);

describe("groups", () => {
  let mockQiitaApi: jest.Mocked<QiitaApi>;
  let consoleLogSpy: jest.SpyInstance;

  const mockGroups: Group[] = [
    {
      created_at: "2023-01-01T00:00:00Z",
      description: "開発チーム用グループ",
      name: "開発チーム",
      private: false,
      updated_at: "2023-06-01T00:00:00Z",
      url_name: "dev-team",
    },
    {
      created_at: "2023-02-01T00:00:00Z",
      description: "",
      name: "非公開グループ",
      private: true,
      updated_at: "2023-06-01T00:00:00Z",
      url_name: "private-group",
    },
  ];

  beforeEach(() => {
    mockQiitaApi = {
      getGroups: jest.fn(),
    } as Partial<jest.Mocked<QiitaApi>> as jest.Mocked<QiitaApi>;
    mockGetQiitaApiInstance.mockReturnValue(Promise.resolve(mockQiitaApi));

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("グループ一覧を表示する", async () => {
    mockQiitaApi.getGroups.mockResolvedValueOnce(mockGroups);

    await groups([]);

    expect(mockQiitaApi.getGroups).toHaveBeenCalledWith(1, 100);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("開発チーム"),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("dev-team"),
    );
  });

  it("グループがない場合、メッセージを表示する", async () => {
    mockQiitaApi.getGroups.mockResolvedValueOnce([]);

    await groups([]);

    expect(consoleLogSpy).toHaveBeenCalledWith("グループはありません");
  });

  it("--json でJSON形式で出力する", async () => {
    mockQiitaApi.getGroups.mockResolvedValueOnce(mockGroups);

    await groups(["--json"]);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify(mockGroups, null, 2),
    );
  });

  it("--json でグループがない場合、空配列を出力する", async () => {
    mockQiitaApi.getGroups.mockResolvedValueOnce([]);

    await groups(["--json"]);

    expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify([]));
  });

  it("非公開グループの公開範囲が正しく表示される", async () => {
    mockQiitaApi.getGroups.mockResolvedValueOnce([mockGroups[1]]);

    await groups([]);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("非公開"),
    );
  });

  it("説明が空の場合は (なし) と表示される", async () => {
    mockQiitaApi.getGroups.mockResolvedValueOnce([mockGroups[1]]);

    await groups([]);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("(なし)"),
    );
  });

  it("100件以上ある場合、全ページを取得する", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      ...mockGroups[0],
      url_name: `group-${i}`,
      name: `Group ${i}`,
    }));
    const page2 = [mockGroups[1]];
    mockQiitaApi.getGroups
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);

    await groups(["--json"]);

    expect(mockQiitaApi.getGroups).toHaveBeenCalledTimes(2);
    expect(mockQiitaApi.getGroups).toHaveBeenCalledWith(1, 100);
    expect(mockQiitaApi.getGroups).toHaveBeenCalledWith(2, 100);
    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output).toHaveLength(101);
  });
});
