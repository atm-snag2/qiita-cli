import arg from "arg";
import { getQiitaApiInstance } from "../lib/get-qiita-api-instance";
import { PostingCampaign } from "../qiita-api";

const PER_PAGE = 100;

const formatDate = (isoString: string) =>
  new Date(isoString).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Tokyo",
  });

const isOngoing = (campaign: PostingCampaign) => {
  const now = new Date();
  const startAt = new Date(campaign.start_at);

  return startAt <= now;
};

export const postingCampaigns = async (argv: string[]) => {
  const chalk = (await import("chalk")).default;
  const args = arg(
    {
      "--json": Boolean,
    },
    { argv, permissive: true },
  );

  const outputJson = args["--json"] || false;

  const qiitaApi = await getQiitaApiInstance();

  const campaigns = (await qiitaApi.getPostingCampaigns(1, PER_PAGE)).filter(
    isOngoing,
  );

  if (campaigns.length === 0) {
    if (outputJson) {
      console.log(JSON.stringify([]));
    } else {
      console.log("開催中の記事投稿キャンペーンはありません");
    }
    return;
  }

  if (outputJson) {
    console.log(JSON.stringify(campaigns, null, 2));
    return;
  }

  campaigns.forEach((campaign: PostingCampaign, index) => {
    if (index > 0) console.log("");

    console.log(chalk.bold(campaign.title));
    console.log(`  UUID:               ${campaign.uuid}`);
    console.log(
      `  期間:               ${formatDate(campaign.start_at)} 〜 ${formatDate(
        campaign.end_at,
      )}`,
    );
    console.log(`  キャンペーンページ: ${campaign.link_url}`);
    console.log(`  規約:               ${campaign.term_url}`);
  });
};
