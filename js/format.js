/**
 * 日本語の命数法による数値フォーマットモジュール
 * 
 * 仕様:
 * - 10,000未満は原則として整数表示（3桁カンマ区切り）
 * - 10,000以上は命数法で表示（万、億、兆、京、垓、秭、穣、溝、澗、正、載、極...）
 * - 表示桁数は原則として有効数字3〜4桁程度
 * - 小数点末尾の不要なゼロは自動トリミング (1.00万 -> 1万, 1.50万 -> 1.5万)
 * - 表示用の丸めと内部計算を完全分離（購入判定には元の実数を使用）
 */

const JAPANESE_UNITS = [
  { value: 1e68, unit: '無量大数' },
  { value: 1e64, unit: '不可思議' },
  { value: 1e60, unit: '那由他' },
  { value: 1e56, unit: '阿僧祇' },
  { value: 1e52, unit: '恒河沙' },
  { value: 1e48, unit: '極' },
  { value: 1e44, unit: '載' },
  { value: 1e40, unit: '正' },
  { value: 1e36, unit: '澗' },
  { value: 1e32, unit: '溝' },
  { value: 1e28, unit: '穣' },
  { value: 1e24, unit: '秭' },
  { value: 1e20, unit: '垓' },
  { value: 1e16, unit: '京' },
  { value: 1e12, unit: '兆' },
  { value: 1e8,  unit: '億' },
  { value: 1e4,  unit: '万' }
];

/**
 * 数値を日本語の命数法表記に変換する共通フォーマット関数
 * @param {number} value - 対象の数値
 * @param {string} suffix - 単位（デフォルト: '円'、空文字や'ペイ'も指定可能）
 * @returns {string} フォーマットされた文字列
 */
function formatJapaneseNumber(value, suffix = '円') {
  if (value === null || value === undefined || isNaN(value)) {
    return `0${suffix}`;
  }

  // 負数の対応
  if (value < 0) {
    return `-${formatJapaneseNumber(-value, suffix)}`;
  }

  // 10,000未満は原則整数表示（カンマ区切り）
  if (value < 10000) {
    return `${Math.floor(value).toLocaleString('ja-JP')}${suffix}`;
  }

  // 10,000以上は命数法で表示
  for (let i = 0; i < JAPANESE_UNITS.length; i++) {
    const { value: unitVal, unit } = JAPANESE_UNITS[i];
    if (value >= unitVal) {
      const divided = value / unitVal;

      // 有効数字3〜4桁に応じたフォーマット
      let formattedNum;
      if (divided >= 1000) {
        // 例: 1250万円 -> 小数点第1位まで切り捨て
        formattedNum = (Math.floor(divided * 10) / 10).toFixed(1).replace(/\.0$/, '');
      } else if (divided >= 100) {
        // 例: 125.4万円、125万円
        formattedNum = (Math.floor(divided * 100) / 100).toFixed(2).replace(/\.?0+$/, '');
      } else if (divided >= 10) {
        // 例: 12.34万円
        formattedNum = (Math.floor(divided * 100) / 100).toFixed(2).replace(/\.?0+$/, '');
      } else {
        // 例: 1.234億円、1.25万円
        formattedNum = (Math.floor(divided * 1000) / 1000).toFixed(3).replace(/\.?0+$/, '');
      }

      return `${formattedNum}${unit}${suffix}`;
    }
  }

  return `${Math.floor(value).toLocaleString('ja-JP')}${suffix}`;
}

/**
 * 毎秒あたりの生産量表示用フォーマット
 * @param {number} rate - 毎秒生産量
 * @returns {string} 例: "毎秒 +1,250円" または "毎秒 +1.25万円"
 */
function formatRate(rate) {
  return `毎秒 +${formatJapaneseNumber(rate, '円')}`;
}

// ブラウザ環境・Node環境（テスト実行用）双方に対応
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    JAPANESE_UNITS,
    formatJapaneseNumber,
    formatRate
  };
}
