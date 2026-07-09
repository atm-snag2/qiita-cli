import { getQiitaApiInstance } from "../lib/get-qiita-api-instance";
import { api } from "./api";
import type { QiitaApi } from "../qiita-api";

jest.mock("../lib/get-qiita-api-instance");
const mockGetQiitaApiInstance = jest.mocked(getQiitaApiInstance);

describe("api", () => {
  let mockQiitaApi: jest.Mocked<QiitaApi>;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    mockQiitaApi = {
      rawRequest: jest.fn(),
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

  it("パスがない場合、エラーを表示して終了する", async () => {
    await expect(api(["GET"])).rejects.toThrow("process.exit() was called.");
    expect(consoleErrorSpy).toHaveBeenCalledWith("パスを指定してください。");
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("GETリクエストを送る", async () => {
    mockQiitaApi.rawRequest.mockResolvedValueOnce({ id: "test_user" });

    await api(["GET", "/api/v2/authenticated_user"]);

    expect(mockQiitaApi.rawRequest).toHaveBeenCalledWith(
      "GET",
      "/api/v2/authenticated_user",
      undefined,
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify({ id: "test_user" }, null, 2),
    );
  });

  it("POSTリクエストに--dataでボディを渡せる", async () => {
    mockQiitaApi.rawRequest.mockResolvedValueOnce({ name: "+1" });

    await api([
      "POST",
      "/api/v2/items/abc/reactions",
      "--data",
      '{"name":"+1"}',
    ]);

    expect(mockQiitaApi.rawRequest).toHaveBeenCalledWith(
      "POST",
      "/api/v2/items/abc/reactions",
      '{"name":"+1"}',
    );
  });

  it("-dでもボディを渡せる", async () => {
    mockQiitaApi.rawRequest.mockResolvedValueOnce({ name: "+1" });

    await api(["POST", "/api/v2/items/abc/reactions", "-d", '{"name":"+1"}']);

    expect(mockQiitaApi.rawRequest).toHaveBeenCalledWith(
      "POST",
      "/api/v2/items/abc/reactions",
      '{"name":"+1"}',
    );
  });

  it("文字列レスポンスをそのまま表示する", async () => {
    mockQiitaApi.rawRequest.mockResolvedValueOnce("plain text");

    await api(["GET", "/api/v2/some/path"]);

    expect(consoleLogSpy).toHaveBeenCalledWith("plain text");
  });

  it("--helpでヘルプを表示する", async () => {
    await api(["--help"]);

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain("Usage:");
  });

  it("--dataの値がない場合、エラーを表示して終了する", async () => {
    await expect(
      api(["POST", "/api/v2/items/abc/reactions", "--data"]),
    ).rejects.toThrow("process.exit() was called.");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "--data の値を指定してください。",
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
