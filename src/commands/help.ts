export const helpText = `USAGE:
qiita <COMMAND> [<OPTIONS>]

COMMAND:
  init                    記事をGitHubで管理するための初期設定
  login                   Qiita APIの認証認可
  new [<basename>] ...    新しい記事を追加
  preview                 コンテンツをブラウザでプレビュー
  publish <basename> ...  記事を投稿、更新
  publish --all           全ての記事を投稿、更新
  pull                    記事ファイルをQiitaと同期
  search <query>          Qiitaの記事を検索
    --json                結果をJSON形式で出力
  get <article_id>        指定したIDの記事を取得
    --json                結果をJSON形式で出力
  post [options]          記事を直接投稿、更新
    --id <id>             既存記事を更新する場合に指定
    --title <title>       記事のタイトル
    --tags <tags>         カンマ区切りのタグ
    --body <body>         記事本文 (未指定時は標準入力)
    --private             限定共有にする場合に指定
    --organization <org>  組織に紐付ける場合に指定
    --slide               スライドモードを有効化
    --json                結果をJSON形式で出力
  version                 Qiita CLIのバージョンを表示
  help                    ヘルプを表示

OPTIONS:
  --credential <credential_dir>
    Qiita CLIの認証情報を配置するディレクトリを指定

  --root <root_dir>
    記事ファイルをダウンロードするディレクトリを指定

  --verbose
    詳細表示オプションを有効

  --config
    設定ファイルを配置するディレクトリを指定

詳細についてはReadme(https://github.com/increments/qiita-cli)をご覧ください
`;

export const help = () => {
  console.log(helpText);
};
