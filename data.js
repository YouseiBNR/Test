/**
 * ジャグラーシリーズ機種別スペックデータ
 * 各機種の設定1〜6におけるBB確率・RB確率・合算確率・機械割を定義
 */

const JUGGLER_SPECS = {
  "マイジャグラーV": {
    settings: {
      1: { bb: 1/275.4, rb: 1/431.2, payout: 97.0 },
      2: { bb: 1/272.1, rb: 1/364.1, payout: 98.0 },
      3: { bb: 1/260.1, rb: 1/341.3, payout: 99.5 },
      4: { bb: 1/252.1, rb: 1/290.0, payout: 102.0 },
      5: { bb: 1/240.9, rb: 1/268.6, payout: 104.5 },
      6: { bb: 1/229.1, rb: 1/229.1, payout: 109.0 }
    },
    bbMedals: 325,
    rbMedals: 110,
    betPerGame: 3
  },
  "アイムジャグラーEX": {
    settings: {
      1: { bb: 1/287.4, rb: 1/455.1, payout: 95.8 },
      2: { bb: 1/282.5, rb: 1/443.8, payout: 96.6 },
      3: { bb: 1/268.6, rb: 1/331.0, payout: 99.0 },
      4: { bb: 1/264.3, rb: 1/315.1, payout: 101.0 },
      5: { bb: 1/252.1, rb: 1/255.0, payout: 103.5 },
      6: { bb: 1/240.9, rb: 1/226.0, payout: 107.0 }
    },
    bbMedals: 325,
    rbMedals: 110,
    betPerGame: 3
  },
  "ファンキージャグラー2": {
    settings: {
      1: { bb: 1/275.4, rb: 1/468.1, payout: 97.0 },
      2: { bb: 1/271.9, rb: 1/403.7, payout: 98.5 },
      3: { bb: 1/264.3, rb: 1/341.3, payout: 100.5 },
      4: { bb: 1/256.0, rb: 1/292.6, payout: 103.0 },
      5: { bb: 1/245.3, rb: 1/262.1, payout: 105.0 },
      6: { bb: 1/230.8, rb: 1/229.1, payout: 109.0 }
    },
    bbMedals: 325,
    rbMedals: 110,
    betPerGame: 3
  },
  "ハッピージャグラーVIII": {
    settings: {
      1: { bb: 1/275.4, rb: 1/409.6, payout: 97.5 },
      2: { bb: 1/270.8, rb: 1/362.1, payout: 99.0 },
      3: { bb: 1/264.3, rb: 1/332.7, payout: 100.5 },
      4: { bb: 1/256.0, rb: 1/290.0, payout: 103.0 },
      5: { bb: 1/243.7, rb: 1/255.0, payout: 105.5 },
      6: { bb: 1/226.0, rb: 1/226.0, payout: 109.5 }
    },
    bbMedals: 325,
    rbMedals: 110,
    betPerGame: 3
  },
  "ゴーゴージャグラー3": {
    settings: {
      1: { bb: 1/269.7, rb: 1/364.1, payout: 97.5 },
      2: { bb: 1/268.6, rb: 1/336.1, payout: 98.5 },
      3: { bb: 1/264.3, rb: 1/318.1, payout: 100.0 },
      4: { bb: 1/256.0, rb: 1/283.7, payout: 102.5 },
      5: { bb: 1/248.2, rb: 1/255.0, payout: 105.0 },
      6: { bb: 1/232.4, rb: 1/226.0, payout: 109.0 }
    },
    bbMedals: 325,
    rbMedals: 110,
    betPerGame: 3
  }
};

/**
 * レート定義
 */
const RATE_OPTIONS = {
  "20円スロット": 20,
  "10円スロット": 10,
  "5円スロット": 5
};

export { JUGGLER_SPECS, RATE_OPTIONS };
