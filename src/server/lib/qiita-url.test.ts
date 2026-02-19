import { itemUrl } from "./qiita-url";

describe("itemUrl", () => {
  const id = "c686397e4a0f4f11683d";
  const userId = "Qiita";
  let originalQiitaDomain: string | undefined;

  beforeEach(() => {
    originalQiitaDomain = process.env.QIITA_DOMAIN;
    process.env.QIITA_DOMAIN = "qiita.com";
  });

  afterEach(() => {
    process.env.QIITA_DOMAIN = originalQiitaDomain;
  });

  it("returns item url", () => {
    const url = itemUrl({ id, userId });
    expect(url).toEqual(`https://qiita.com/${userId}/items/${id}`);
  });
});
