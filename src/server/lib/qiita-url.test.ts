import { itemUrl } from "./qiita-url";
import { config } from "../../lib/config";

jest.mock("../../lib/config");
const mockConfig = jest.mocked(config);

describe("itemUrl", () => {
  const id = "c686397e4a0f4f11683d";
  const userId = "Qiita";
  let originalQiitaDomain: string | undefined;

  beforeEach(() => {
    mockConfig.getCredential.mockResolvedValue({
      accessToken: "token",
      name: "qiita",
      domain: "qiita.com",
    });
    originalQiitaDomain = process.env.QIITA_DOMAIN;
    process.env.QIITA_DOMAIN = "qiita.com";
  });

  afterEach(() => {
    process.env.QIITA_DOMAIN = originalQiitaDomain;
  });

  it("returns item url", async () => {
    const url = await itemUrl({ id, userId });
    expect(url).toEqual(`https://qiita.com/${userId}/items/${id}`);
  });
});
