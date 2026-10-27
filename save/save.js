/**
 * 電子マネー型クリッカーゲーム「ペイクル (PayKuru)」
 * セーブデータ管理モジュール (SaveManager)
 * 
 * 役割:
 * - セーブデータの初期値定義および生成
 * - LocalStorage への自動・手動セーブ / ロード
 * - セーブデータのエクスポート（ファイル書き出し）とインポート（ファイル読み込み）
 * - ネット公開（静的ホスティング等）時のデータ永続化と整合性保証
 */

const DEFAULT_SAVE_TEMPLATE = {
  version: 1,
  playerName: 'ゲスト',
  balance: 0,
  totalEarned: 0,
  tapLevel: 0,
  totalTaps: 0,
  offlineLevel: 0,
  facilities: {},
  campaigns: {},
  specialUpgrades: {},
  lastSavedTime: 0,
  lastCalculatedTime: 0,
  history: []
};

class SaveManager {
  static SAVE_KEY = 'paykuru_game_save_v1';

  /**
   * 初期セーブデータを生成する
   * @param {Array} facilitiesData - 設備マスタ
   * @param {Array} campaignsData - キャンペーンマスタ
   * @param {Array} specialUpgradesData - 特別倍率マスタ
   * @returns {Object} 初期セーブデータオブジェクト
   */
  static getInitialState(facilitiesData = [], campaignsData = [], specialUpgradesData = []) {
    const now = Date.now();
    const state = JSON.parse(JSON.stringify(DEFAULT_SAVE_TEMPLATE));
    state.lastSavedTime = now;
    state.lastCalculatedTime = now;

    // 設備の初期化
    facilitiesData.forEach(f => {
      state.facilities[f.id] = 0;
    });

    // キャンペーンの初期化
    campaignsData.forEach(c => {
      state.campaigns[c.id] = false;
    });

    // 特別倍率の初期化
    specialUpgradesData.forEach(u => {
      state.specialUpgrades[u.id] = false;
    });

    return state;
  }

  /**
   * データをLocalStorageに保存する
   * @param {Object} state - 現在のゲームステート
   * @returns {boolean} 保存成否
   */
  static save(state) {
    try {
      if (!state || typeof state !== 'object') return false;
      state.lastSavedTime = Date.now();
      const serialized = JSON.stringify(state);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.SAVE_KEY, serialized);
      }
      return true;
    } catch (e) {
      console.error('[SaveManager] Failed to save game:', e);
      return false;
    }
  }

  /**
   * LocalStorageからデータを読み込む
   * @param {Object} baseState - 欠損補完用の基準ステート
   * @returns {Object|null} 復元されたステート、またはデータが存在しない場合はnull
   */
  static load(baseState = {}) {
    try {
      if (typeof localStorage === 'undefined') return null;
      const dataStr = localStorage.getItem(this.SAVE_KEY);
      if (!dataStr) return null;

      const loaded = JSON.parse(dataStr);
      if (loaded && typeof loaded === 'object') {
        return this.mergeWithDefault(baseState, loaded);
      }
    } catch (e) {
      console.error('[SaveManager] Failed to load game:', e);
    }
    return null;
  }

  /**
   * セーブデータを初期化する
   * @param {Object} initialState - 初期ステート
   * @returns {Object} リセットされたステート
   */
  static reset(initialState) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.SAVE_KEY);
      }
    } catch (e) {
      console.error('[SaveManager] Failed to remove save data:', e);
    }
    const freshState = JSON.parse(JSON.stringify(initialState));
    freshState.lastSavedTime = Date.now();
    freshState.lastCalculatedTime = Date.now();
    this.save(freshState);
    return freshState;
  }

  /**
   * 読み込んだデータと基準データを安全にマージする
   * @param {Object} base 
   * @param {Object} loaded 
   * @returns {Object}
   */
  static mergeWithDefault(base, loaded) {
    const playerName = (loaded && typeof loaded.playerName === 'string' && loaded.playerName.trim())
      ? loaded.playerName.trim()
      : (base.playerName || 'ゲスト');

    return {
      ...base,
      ...loaded,
      playerName: playerName,
      balance: typeof loaded.balance === 'number' && !isNaN(loaded.balance) ? Math.max(0, loaded.balance) : (base.balance || 0),
      totalEarned: typeof loaded.totalEarned === 'number' && !isNaN(loaded.totalEarned) ? Math.max(0, loaded.totalEarned) : (base.totalEarned || 0),
      tapLevel: typeof loaded.tapLevel === 'number' && !isNaN(loaded.tapLevel) ? Math.max(0, loaded.tapLevel) : 0,
      totalTaps: typeof loaded.totalTaps === 'number' && !isNaN(loaded.totalTaps) ? Math.max(0, loaded.totalTaps) : 0,
      offlineLevel: typeof loaded.offlineLevel === 'number' && !isNaN(loaded.offlineLevel) ? Math.max(0, loaded.offlineLevel) : 0,
      facilities: { ...(base.facilities || {}), ...(loaded.facilities || {}) },
      campaigns: { ...(base.campaigns || {}), ...(loaded.campaigns || {}) },
      specialUpgrades: { ...(base.specialUpgrades || {}), ...(loaded.specialUpgrades || {}) },
      history: Array.isArray(loaded.history) ? loaded.history : []
    };
  }

  /**
   * 現在のセーブデータをJSONファイルとしてダウンロード（エクスポート）する
   * @param {Object} state - セーブデータ
   * @param {string} [filename] - ファイル名
   */
  static exportToFile(state, filename = 'paykuru_save.json') {
    try {
      state.lastSavedTime = Date.now();
      const jsonStr = JSON.stringify(state, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      console.error('[SaveManager] Failed to export save file:', e);
      return false;
    }
  }

  /**
   * 選択されたJSONファイルからセーブデータを読み込む（インポート）
   * @param {File} file 
   * @returns {Promise<Object>} パースされたセーブデータ
   */
  static importFromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('ファイルが選択されていません。'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === 'object') {
            resolve(parsed);
          } else {
            reject(new Error('無効なセーブデータ形式です。'));
          }
        } catch (err) {
          reject(new Error('JSONの解析に失敗しました: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました。'));
      reader.readAsText(file);
    });
  }
}

// グローバル公開（ブラウザ環境）
if (typeof window !== 'undefined') {
  window.SaveManager = SaveManager;
  window.DEFAULT_SAVE_TEMPLATE = DEFAULT_SAVE_TEMPLATE;
}

// Node.jsモジュール互換
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SaveManager, DEFAULT_SAVE_TEMPLATE };
}
