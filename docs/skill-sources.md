# 便利なskillsの入手先カタログ

外部の実績あるskillを導入するためのガイド(2026-07 調査)。skillは中身がプロンプトなので、**導入前に SKILL.md を一読してから**入れること。

## 導入方法(2通り)

```bash
# 方法1: 公式マーケットプレイス(Claude Code 内で)
/plugin marketplace add anthropics/skills

# 方法2: npx skills CLI(GitHubリポジトリから直接)
npx skills add <owner/repo> --skill <skill名>
```

## 動画・メディア系

| skill | 内容 | 入手先 |
|-------|------|--------|
| (導入済み) video-edit | ffmpeg編集の総合skill。このリポジトリの `.claude/skills/video-edit` | — |
| video-use | 素材フォルダ→完成動画。文字起こしベースのカット編集・自己検証付き。本格的に動画編集を自動化するならこれ | [browser-use/video-use](https://github.com/browser-use/video-use) (MIT) |
| Claude-Code-Video-Toolkit | Remotion/Manim/画面録画/YouTube切り抜きまでカバーする詰め合わせ | [wilwaldon/Claude-Code-Video-Toolkit](https://github.com/wilwaldon/Claude-Code-Video-Toolkit) |
| remotion-best-practices | React でプログラマブル動画を作る(テロップアニメ・データ動画) | `npx skills add https://github.com/remotion-dev/skills --skill remotion-best-practices` |

## 公式(anthropics/skills)

| skill | 内容 |
|-------|------|
| document skills (pdf/docx/pptx/xlsx) | PDF・Word・PowerPoint・Excel の生成と解析 |
| webapp-testing | Playwright でローカルアプリを実ブラウザテスト |
| frontend-design | 「AIっぽい没個性UI」を避けるデザイン指針 |
| skill-creator | skill を対話的に作る skill |

導入: `/plugin marketplace add anthropics/skills`

## 開発ワークフロー系

| skill | 内容 | 入手先 |
|-------|------|--------|
| handoff | セッションを構造化mdに圧縮して別エージェントに引き継ぐ | `npx skills add mattpocock/skills --skill handoff` |
| grill-me | 実装前にインタビュー形式で前提を洗い出す | `npx skills add mattpocock/skills --skill grill-me` |
| superpowers | 計画→TDD→レビューのマルチエージェント編成 | `npx skills add obra/superpowers` |
| web-design-guidelines | アクセシビリティ/UX 100+ルールでUI監査 | `npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines` |
| trailofbits/skills | CodeQL/Semgrep による脆弱性検出 | `npx skills add trailofbits/skills` |

## マーケティング系

| skill | 内容 | 入手先 |
|-------|------|--------|
| marketingskills | コンバージョン・SEO・メール・分析など32本入り | `npx skills add coreyhaines31/marketingskills` |

## もっと探すとき

- [anthropics/skills](https://github.com/anthropics/skills) — 公式。まずここ
- [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) — 定番のまとめ
- [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) — 1000本超の大型カタログ
- [Best Claude Code Skills (Firecrawl blog)](https://www.firecrawl.dev/blog/best-claude-code-skills) — 厳選レビュー記事

## 注意

- skill の実体はただの指示書(markdown)。**悪意ある指示が混ざっていないか導入前に必ず中身を読む**
- 英語の skill でも日本語の依頼で普通に発動する(description が英語の方がむしろ発動精度が高い)
- 入れすぎると発動判定が濁る。使うものだけ入れて、使わなくなったら消す
