import { validateItem } from "./item-validator";

describe("validateItem", () => {
  const item = {
    title: "Title",
    rawBody: "Item body",
    tags: ["Qiita", "Ruby"],
    secret: false,
    organizationUrlName: null,
    postingCampaignUuid: null,
    agreedPostingCampaignTerm: false,
  };

  it("returns no errors", () => {
    const errorMessages = validateItem(item);
    expect(errorMessages).toEqual([]);
  });

  describe("validateItemTitle", () => {
    describe("when title is null", () => {
      const errorMessages = validateItem({ ...item, title: null });

      it("return validation error message", () => {
        expect(errorMessages.length).toEqual(1);
        expect(errorMessages[0]).toContain("タイトルを入力してください");
      });
    });

    describe("when title is empty", () => {
      const errorMessages = validateItem({ ...item, title: "" });

      it("return validation error message", () => {
        expect(errorMessages.length).toEqual(1);
        expect(errorMessages[0]).toContain("タイトルを入力してください");
      });
    });
  });

  describe("validateItemBody", () => {
    describe("when body is null", () => {
      const errorMessages = validateItem({ ...item, rawBody: null });

      it("return validation error message", () => {
        expect(errorMessages.length).toEqual(1);
        expect(errorMessages[0]).toContain("本文を入力してください");
      });
    });

    describe("when rawBody is empty", () => {
      const errorMessages = validateItem({ ...item, rawBody: "" });

      it("return validation error message", () => {
        expect(errorMessages.length).toEqual(1);
        expect(errorMessages[0]).toContain("本文を入力してください");
      });
    });
  });

  describe("validateItemTags", () => {
    describe("when tags is empty string", () => {
      const errorMessages = validateItem({ ...item, tags: [""] });

      it("return validation error message", () => {
        expect(errorMessages.length).toEqual(1);
        expect(errorMessages[0]).toContain("タグを入力してください");
      });
    });
  });

  describe("validateLengthItemTags", () => {
    describe("when tags are empty", () => {
      const errorMessages = validateItem({ ...item, tags: [] });

      it("return validation error message", () => {
        expect(errorMessages.length).toEqual(1);
        expect(errorMessages[0]).toContain(
          "タグは1つ以上、5つ以内で指定してください",
        );
      });
    });

    describe("when tags are more than 5", () => {
      const errorMessages = validateItem({
        ...item,
        tags: [...Array(6)].map((_, i) => `tag${i}`),
      });

      it("return validation error message", () => {
        expect(errorMessages.length).toEqual(1);
        expect(errorMessages[0]).toContain(
          "タグは1つ以上、5つ以内で指定してください",
        );
      });
    });
  });

  describe("validatePostingCampaignAgreement", () => {
    describe("when postingCampaignUuid is set", () => {
      const postingCampaignUuid = "910c5be7d2d6a043a12b";

      describe("and agreedPostingCampaignTerm is true", () => {
        const errorMessages = validateItem({
          ...item,
          postingCampaignUuid,
          agreedPostingCampaignTerm: true,
        });

        it("returns no validation error message", () => {
          expect(errorMessages).toEqual([]);
        });
      });

      describe("and agreedPostingCampaignTerm is false", () => {
        const errorMessages = validateItem({
          ...item,
          postingCampaignUuid,
          agreedPostingCampaignTerm: false,
        });

        it("returns validation error message", () => {
          expect(errorMessages.length).toEqual(1);
          expect(errorMessages[0]).toContain("agreed_posting_campaign_term");
        });
      });
    });

    describe("when postingCampaignUuid is null", () => {
      describe("and agreedPostingCampaignTerm is false", () => {
        const errorMessages = validateItem({
          ...item,
          postingCampaignUuid: null,
          agreedPostingCampaignTerm: false,
        });

        it("returns no validation error message", () => {
          expect(errorMessages).toEqual([]);
        });
      });
    });
  });

  describe("validatePostingCampaignPrivate", () => {
    describe("when secret is true and postingCampaignUuid is set", () => {
      const errorMessages = validateItem({
        ...item,
        secret: true,
        postingCampaignUuid: "910c5be7d2d6a043a12b",
        agreedPostingCampaignTerm: true,
      });

      it("returns validation error message", () => {
        expect(errorMessages.length).toEqual(1);
        expect(errorMessages[0]).toContain(
          "限定共有記事に投稿キャンペーンを紐付けることはできません",
        );
      });
    });

    describe("when secret is false and postingCampaignUuid is set", () => {
      const errorMessages = validateItem({
        ...item,
        secret: false,
        postingCampaignUuid: "910c5be7d2d6a043a12b",
        agreedPostingCampaignTerm: true,
      });

      it("returns no validation error message", () => {
        expect(errorMessages).toEqual([]);
      });
    });

    describe("when secret is true and postingCampaignUuid is null", () => {
      const errorMessages = validateItem({
        ...item,
        secret: true,
        postingCampaignUuid: null,
      });

      it("returns no validation error message", () => {
        expect(errorMessages).toEqual([]);
      });
    });
  });

  describe("validateOrganizationSecretItem", () => {
    describe("when organizationUrlName exists", () => {
      const organizationUrlName = "qiita-inc";

      describe("and secret is true", () => {
        const errorMessages = validateItem({
          ...item,
          secret: true,
          organizationUrlName,
        });

        it("returns validation error message", () => {
          expect(errorMessages.length).toEqual(1);
          expect(errorMessages[0]).toContain(
            "限定共有記事にOrganizationを紐付けることはできません",
          );
        });
      });

      describe("and secret is false", () => {
        const errorMessages = validateItem({
          ...item,
          secret: false,
          organizationUrlName,
        });

        it("returns no validation error message", () => {
          expect(errorMessages).toEqual([]);
        });
      });
    });

    describe("when organizationUrlName does not exist", () => {
      const organizationUrlName = null;

      describe("and secret is true", () => {
        const errorMessages = validateItem({
          ...item,
          secret: true,
          organizationUrlName,
        });

        it("returns no validation error message", () => {
          expect(errorMessages).toEqual([]);
        });
      });

      describe("and secret is false", () => {
        const errorMessages = validateItem({
          ...item,
          secret: false,
          organizationUrlName,
        });

        it("returns no validation error message", () => {
          expect(errorMessages).toEqual([]);
        });
      });
    });
  });

  describe("validatePostingCampaignAgreement", () => {
    const postingCampaignUuid = "abcde12345fghij67890";

    describe("when postingCampaignUuid exists and agreed is false", () => {
      const errorMessages = validateItem({
        ...item,
        postingCampaignUuid,
        agreedPostingCampaignTerm: false,
      });

      it("returns validation error message", () => {
        expect(errorMessages.length).toEqual(1);
        expect(errorMessages[0]).toContain("規約への同意が必要です");
      });
    });

    describe("when postingCampaignUuid exists and agreed is true", () => {
      const errorMessages = validateItem({
        ...item,
        postingCampaignUuid,
        agreedPostingCampaignTerm: true,
      });

      it("returns no validation error message", () => {
        expect(errorMessages).toEqual([]);
      });
    });

    describe("when postingCampaignUuid does not exist", () => {
      const errorMessages = validateItem({
        ...item,
        postingCampaignUuid: null,
        agreedPostingCampaignTerm: false,
      });

      it("returns no validation error message", () => {
        expect(errorMessages).toEqual([]);
      });
    });
  });

  describe("validatePostingCampaignSecretItem", () => {
    const postingCampaignUuid = "abcde12345fghij67890";

    describe("when postingCampaignUuid exists and secret is true", () => {
      const errorMessages = validateItem({
        ...item,
        secret: true,
        postingCampaignUuid,
        agreedPostingCampaignTerm: true,
      });

      it("returns validation error message", () => {
        expect(errorMessages.length).toEqual(1);
        expect(errorMessages[0]).toContain(
          "限定共有記事にキャンペーンを紐付けることはできません",
        );
      });
    });

    describe("when postingCampaignUuid exists and secret is false", () => {
      const errorMessages = validateItem({
        ...item,
        secret: false,
        postingCampaignUuid,
        agreedPostingCampaignTerm: true,
      });

      it("returns no validation error message", () => {
        expect(errorMessages).toEqual([]);
      });
    });
  });
});
