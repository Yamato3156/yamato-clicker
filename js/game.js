/**
 * 電子マネー型クリッカーゲーム「ペイクル (PayKuru)」
 * ゲームコアロジック＆状態管理モジュール
 */

// オフライン生産設定
const MAX_OFFLINE_SECONDS = 12 * 60 * 60; // 12時間（43,200秒）
const OFFLINE_EFFICIENCY_MAP = [0, 0.25, 0.50, 0.75, 1.00]; // Lv0〜Lv4
const OFFLINE_UPGRADE_COSTS = [1000, 25000, 500000, 10000000]; // Lv1〜Lv4への強化費用

// 設備マスタデータ
const FACILITIES_DATA = [
  {
    id: 'point_back',
    name: 'ポイント還元プログラム',
    desc: '支払いのたびに還元ポイントが自動生成される',
    baseRate: 1,
    baseCost: 15,
    costMultiplier: 1.15,
    icon: 'fa-tags'
  },
  {
    id: 'qr_stand',
    name: '卓上QR決済スタンド',
    desc: '小型店舗に設置され、少額決済がひっきりなしに発生する',
    baseRate: 8,
    baseCost: 120,
    costMultiplier: 1.15,
    icon: 'fa-qrcode'
  },
  {
    id: 'smart_terminal',
    name: 'マルチ決済スマート端末',
    desc: 'IC・タッチ・バーコードに対応した万能端末',
    baseRate: 45,
    baseCost: 1100,
    costMultiplier: 1.15,
    icon: 'fa-credit-card'
  },
  {
    id: 'ec_gateway',
    name: 'EC決済ゲートウェイ',
    desc: 'ネット通販の裏で秒間何万回も決済を処理する',
    baseRate: 260,
    baseCost: 12000,
    costMultiplier: 1.15,
    icon: 'fa-cart-shopping'
  },
  {
    id: 'unattended_store',
    name: '無人決済スマート店舗',
    desc: '手に取って退店するだけで自動引き落としされる次世代ストア',
    baseRate: 1400,
    baseCost: 130000,
    costMultiplier: 1.15,
    icon: 'fa-store'
  },
  {
    id: 'merchant_network',
    name: '加盟店アライアンス網',
    desc: '全国100万店舗の加盟店から手数料が毎秒還元される',
    baseRate: 7800,
    baseCost: 1400000,
    costMultiplier: 1.15,
    icon: 'fa-network-wired'
  },
  {
    id: 'neobank',
    name: 'フィンテックネオバンク',
    desc: '電子マネー直結の超高速利息・運用口座',
    baseRate: 45000,
    baseCost: 20000000,
    costMultiplier: 1.15,
    icon: 'fa-building-columns'
  },
  {
    id: 'ai_cash_flow',
    name: 'AIキャッシュフローマネージャー',
    desc: 'ミリ秒単位の超高速資金移動で利ざやを自動創出する',
    baseRate: 280000,
    baseCost: 350000000,
    costMultiplier: 1.15,
    icon: 'fa-robot'
  },
  {
    id: 'cloud_datacenter',
    name: '決済メガクラウドセンター',
    desc: '大陸間を結ぶ超巨大決済サーバー群',
    baseRate: 1800000,
    baseCost: 5000000000,
    costMultiplier: 1.15,
    icon: 'fa-server'
  },
  {
    id: 'national_clearing',
    name: '国家キャッシュレス基幹機構',
    desc: '国の全決済インフラを牛耳る究極の自動流通機構',
    baseRate: 15000000,
    baseCost: 100000000000,
    costMultiplier: 1.15,
    icon: 'fa-landmark'
  }
];

// キャンペーン強化（全体倍率）
const CAMPAIGNS_DATA = [
  {
    id: 'camp_1',
    type: 'all',
    name: '全店ポイント還元祭',
    desc: '全設備の自動生産量が 1.5倍 にアップ',
    multiplier: 1.5,
    cost: 50000,
    icon: 'fa-bullhorn'
  },
  {
    id: 'camp_2',
    type: 'all',
    name: 'キャッシュレス推進法案',
    desc: '全設備の自動生産量がさらに 2.0倍 にアップ',
    multiplier: 2.0,
    cost: 5000000,
    icon: 'fa-file-invoice'
  },
  {
    id: 'camp_3',
    type: 'all',
    name: '完全キャッシュレス特区設立',
    desc: '全設備の自動生産量がさらに 3.0倍 にアップ',
    multiplier: 3.0,
    cost: 500000000,
    icon: 'fa-city'
  }
];

// 各施設ごとのマイルストーン倍率設定（10, 50, 100, 500, 1000個達成でその時の10倍）
const FACILITY_MILESTONES = [10, 50, 100, 500, 1000];

const FACILITY_UPGRADE_NAMES = {
  point_back: [
    'ポイント還元特約',
    '会員クラスタランク昇格',
    '即時リアルタイム還元',
    'プレミアムVIPリワード',
    '無限還元エコシステム'
  ],
  qr_stand: [
    '超高感度QRスキャナ',
    '動的ワンタイムQRコード',
    'オフライン決済プロトコル',
    'スマートディスプレイ統合',
    '高速NFC・QR両用モジュール'
  ],
  smart_terminal: [
    'ミリ波非接触アンテナ',
    'オールインワンOS搭載',
    'デュアルバッテリー＆急速給電',
    '光速決済チップセット',
    '量子暗号化セキュアエレメント'
  ],
  ec_gateway: [
    'ワンクリック決済プラグイン',
    '分散型負荷バランサー',
    'グローバル通貨自動両替',
    '不正検知AIエンジン',
    '超並列マイクロサービス'
  ],
  unattended_store: [
    '高精度重量センサ棚',
    '天井骨格トラッキング',
    '生体認証ウォークスルー決済',
    'ロボット自動品出しシステム',
    '完全自動化流通ハブ'
  ],
  merchant_network: [
    '商店街共通ポイント連携',
    '大手チェーン包括提携',
    '全国交通系IC相互乗り入れ',
    '国際決済コンソーシアム',
    '汎銀河商業アライアンス'
  ],
  neobank: [
    '即時マイクロレンディング',
    '自動スウィープ普通預金',
    '分散型決済ステーブルコイン',
    'アルゴリズム運用エンジン',
    'グローバルネオバンク中枢'
  ],
  ai_cash_flow: [
    'ディープラーニング為替予測',
    '超低遅延HFTアルゴリズム',
    'クロスボーダー流動性プール',
    '自己進化型自律トレードAI',
    '超知能フィンテックAGI'
  ],
  cloud_datacenter: [
    '海底光ファイバー直結回線',
    'エッジコンピューティング網',
    '量子もつれ暗号リンク',
    '成層圏通信プラットフォーム',
    '軌道上スペースデータセンター'
  ],
  national_clearing: [
    '法定デジタル通貨(CBDC)試験',
    '全省庁決済システム統合',
    '国家経済リアルタイム予測',
    '超国家キャッシュレス連邦',
    '恒星間電子経済圏基本法'
  ]
};

// 施設特別倍率アップグレード一覧の生成
const FACILITY_UPGRADES_DATA = [];
FACILITIES_DATA.forEach(facility => {
  const names = FACILITY_UPGRADE_NAMES[facility.id] || [];
  FACILITY_MILESTONES.forEach((milestone, idx) => {
    // 規定数購入時点での価格設定: baseCost * (costMultiplier ^ milestone) * 8
    const cost = Math.floor(facility.baseCost * Math.pow(facility.costMultiplier, milestone) * 8);
    const name = names[idx] || `${facility.name}の効率化 (Lv.${milestone})`;
    FACILITY_UPGRADES_DATA.push({
      id: `spec_${facility.id}_${milestone}`,
      type: 'facility',
      facilityId: facility.id,
      facilityName: facility.name,
      requiredCount: milestone,
      multiplier: 10,
      cost: cost,
      name: name,
      desc: `【${facility.name} ${milestone}台達成】生産倍率がその時の 10倍（×10） にアップ`,
      icon: facility.icon
    });
  });
});

// セーブ管理モジュールの読み込み（ブラウザ・Node互換）
const getSaveManager = () => {
  if (typeof SaveManager !== 'undefined') return SaveManager;
  if (typeof window !== 'undefined' && window.SaveManager) return window.SaveManager;
  if (typeof require !== 'undefined') {
    try {
      return require('../save/save.js').SaveManager;
    } catch (e) {
      // フォールバック
    }
  }
  return null;
};

class GameEngine {
  constructor() {
    this.SAVE_KEY = 'paykuru_game_save_v1';
    this.resetState();
  }

  getFreshState() {
    const sm = getSaveManager();
    if (sm && typeof sm.getInitialState === 'function') {
      return sm.getInitialState(FACILITIES_DATA, CAMPAIGNS_DATA, FACILITY_UPGRADES_DATA);
    }

    const state = {
      playerName: 'ゲスト',
      balance: 0,
      totalEarned: 0,
      tapLevel: 0,
      totalTaps: 0,
      offlineLevel: 0,
      facilities: {},
      campaigns: {},
      specialUpgrades: {},
      lastSavedTime: Date.now(),
      lastCalculatedTime: Date.now(),
      history: [],
      version: 1
    };

    FACILITIES_DATA.forEach(f => { state.facilities[f.id] = 0; });
    CAMPAIGNS_DATA.forEach(c => { state.campaigns[c.id] = false; });
    FACILITY_UPGRADES_DATA.forEach(u => { state.specialUpgrades[u.id] = false; });

    return state;
  }

  resetState() {
    this.state = this.getFreshState();
    this.pendingOfflineReward = null; // 復帰時の未受け取りオフライン報酬
  }

  // --- タップ計算 ---
  getTapIncome() {
    // レベル0: 1円、以降は指数関数的+倍率アップ
    const level = this.state.tapLevel;
    if (level === 0) return 1;
    // Lv1: 2円, Lv2: 5円, Lv3: 15円, Lv4: 45円...
    const base = [1, 2, 5, 15, 45, 150, 500, 2000, 8000, 35000, 150000, 700000];
    if (level < base.length) {
      return base[level];
    }
    // それ以降の拡張用
    return Math.floor(base[base.length - 1] * Math.pow(3.5, level - base.length + 1));
  }

  getTapUpgradeCost() {
    const level = this.state.tapLevel;
    const costs = [50, 300, 2000, 15000, 100000, 750000, 5000000, 35000000, 250000000, 1800000000, 15000000000];
    if (level < costs.length) {
      return costs[level];
    }
    return Math.floor(costs[costs.length - 1] * Math.pow(5, level - costs.length + 1));
  }

  upgradeTap() {
    const cost = this.getTapUpgradeCost();
    if (this.state.balance < cost) return false;

    this.state.balance -= cost;
    this.state.tapLevel += 1;

    this.addHistory({
      type: 'upgrade',
      title: 'タップ強化購入',
      detail: `タップLv.${this.state.tapLevel}に強化（獲得量: ${formatJapaneseNumber(this.getTapIncome(), '円')}）`,
      amount: -cost
    });

    this.saveGame();
    return true;
  }

  // --- 自動生産計算 ---
  getCampaignMultiplier() {
    let mult = 1.0;
    CAMPAIGNS_DATA.forEach(c => {
      if (this.state.campaigns[c.id]) {
        mult *= c.multiplier;
      }
    });
    return mult;
  }

  getFacilityMultiplier(facilityId) {
    let mult = 1.0;
    FACILITY_UPGRADES_DATA.forEach(u => {
      if (u.facilityId === facilityId && this.state.specialUpgrades && this.state.specialUpgrades[u.id]) {
        mult *= u.multiplier;
      }
    });
    return mult;
  }

  getFacilityRate(facilityId) {
    const facility = FACILITIES_DATA.find(f => f.id === facilityId);
    if (!facility) return 0;
    const count = this.state.facilities[facilityId] || 0;
    const mult = this.getFacilityMultiplier(facilityId);
    return facility.baseRate * count * mult;
  }

  getBaseAutoRate() {
    let base = 0;
    FACILITIES_DATA.forEach(f => {
      base += this.getFacilityRate(f.id);
    });
    return base;
  }

  getTotalAutoRate() {
    const base = this.getBaseAutoRate();
    const mult = this.getCampaignMultiplier();
    return base * mult;
  }

  getFacilityCost(facilityId, count = 1) {
    const facility = FACILITIES_DATA.find(f => f.id === facilityId);
    if (!facility) return 0;
    const current = this.state.facilities[facilityId] || 0;

    let totalCost = 0;
    for (let i = 0; i < count; i++) {
      totalCost += Math.floor(facility.baseCost * Math.pow(facility.costMultiplier, current + i));
    }
    return totalCost;
  }

  /**
   * 現在の所持残高で購入可能なその施設の最大台数と合計金額を計算
   * @param {string} facilityId 
   * @returns {{ count: number, cost: number }}
   */
  getMaxAffordableCount(facilityId) {
    const facility = FACILITIES_DATA.find(f => f.id === facilityId);
    if (!facility) return { count: 0, cost: 0 };

    const current = this.state.facilities[facilityId] || 0;
    const balance = this.state.balance;

    const firstCost = Math.floor(facility.baseCost * Math.pow(facility.costMultiplier, current));
    if (balance < firstCost) {
      return { count: 0, cost: firstCost };
    }

    const r = facility.costMultiplier;
    // 近似計算: S = P * (r^n - 1) / (r - 1) <= B
    const approxN = Math.floor(Math.log(1 + (balance * (r - 1)) / firstCost) / Math.log(r));
    let count = Math.max(1, approxN - 2);
    let totalCost = this.getFacilityCost(facilityId, count);

    while (true) {
      const nextCost = Math.floor(facility.baseCost * Math.pow(facility.costMultiplier, current + count));
      if (totalCost + nextCost <= balance) {
        totalCost += nextCost;
        count++;
      } else {
        break;
      }
    }

    return { count, cost: totalCost };
  }

  buyFacility(facilityId, count = 1) {
    const cost = this.getFacilityCost(facilityId, count);
    if (this.state.balance < cost) return false;

    this.state.balance -= cost;
    this.state.facilities[facilityId] = (this.state.facilities[facilityId] || 0) + count;

    const facility = FACILITIES_DATA.find(f => f.id === facilityId);
    this.addHistory({
      type: 'upgrade',
      title: `${facility.name} 購入`,
      detail: `所持数: ${this.state.facilities[facilityId]}台 (+${formatJapaneseNumber(facility.baseRate * count, '円')}/秒)`,
      amount: -cost
    });

    this.saveGame();
    return true;
  }

  buyCampaign(campaignId) {
    const campaign = CAMPAIGNS_DATA.find(c => c.id === campaignId);
    if (!campaign || this.state.campaigns[campaignId]) return false;
    if (this.state.balance < campaign.cost) return false;

    this.state.balance -= campaign.cost;
    this.state.campaigns[campaignId] = true;

    this.addHistory({
      type: 'upgrade',
      title: `${campaign.name} 発動`,
      detail: `全設備の生産倍率 ×${campaign.multiplier}`,
      amount: -campaign.cost
    });

    this.saveGame();
    return true;
  }

  buySpecialUpgrade(upgradeId) {
    const upgrade = FACILITY_UPGRADES_DATA.find(u => u.id === upgradeId);
    if (!upgrade || (this.state.specialUpgrades && this.state.specialUpgrades[upgradeId])) return false;

    // 施設規定数チェック
    const currentCount = this.state.facilities[upgrade.facilityId] || 0;
    if (currentCount < upgrade.requiredCount) return false;

    // 所持金チェック
    if (this.state.balance < upgrade.cost) return false;

    this.state.balance -= upgrade.cost;
    if (!this.state.specialUpgrades) {
      this.state.specialUpgrades = {};
    }
    this.state.specialUpgrades[upgradeId] = true;

    this.addHistory({
      type: 'upgrade',
      title: `${upgrade.name} 発動`,
      detail: `${upgrade.facilityName}の生産倍率 ×${upgrade.multiplier}`,
      amount: -upgrade.cost
    });

    this.saveGame();
    return true;
  }

  // --- オフライン生産仕様 ---
  getOfflineEfficiency() {
    const level = Math.min(this.state.offlineLevel, OFFLINE_EFFICIENCY_MAP.length - 1);
    return OFFLINE_EFFICIENCY_MAP[level];
  }

  getOfflineUpgradeCost() {
    const level = this.state.offlineLevel;
    if (level >= OFFLINE_UPGRADE_COSTS.length) {
      return null; // MAX
    }
    return OFFLINE_UPGRADE_COSTS[level];
  }

  upgradeOffline() {
    const cost = this.getOfflineUpgradeCost();
    if (cost === null) return false; // すでにMAX
    if (this.state.balance < cost) return false;

    this.state.balance -= cost;
    this.state.offlineLevel += 1;

    const currentEff = Math.round(this.getOfflineEfficiency() * 100);
    this.addHistory({
      type: 'upgrade',
      title: 'オフライン生産効率強化',
      detail: `オフライン効率Lv.${this.state.offlineLevel}（${currentEff}%）に向上`,
      amount: -cost
    });

    this.saveGame();
    return true;
  }

  /**
   * オフライン報酬の純粋計算ロジック（単体テスト可能）
   * @param {number} currentTimeMs - 現在時刻
   * @param {number} lastSavedTimeMs - 前回保存時刻
   * @param {number} autoRate - 毎秒の自動生産量
   * @param {number} efficiency - オフライン効率 (0.0〜1.0)
   * @returns {object} 計算結果
   */
  static calculateOfflineReward(currentTimeMs, lastSavedTimeMs, autoRate, efficiency) {
    if (!lastSavedTimeMs || currentTimeMs <= lastSavedTimeMs) {
      return {
        rawElapsedSeconds: 0,
        effectiveElapsedSeconds: 0,
        efficiency,
        reward: 0,
        isCapped: false
      };
    }

    const rawElapsed = Math.floor((currentTimeMs - lastSavedTimeMs) / 1000);
    const effectiveElapsed = Math.min(Math.max(0, rawElapsed), MAX_OFFLINE_SECONDS);
    const isCapped = rawElapsed >= MAX_OFFLINE_SECONDS;

    // 報酬計算式: 基準自動生産量 × offlineElapsed × offlineEfficiency
    const reward = Math.floor(autoRate * effectiveElapsed * efficiency);

    return {
      rawElapsedSeconds: rawElapsed,
      effectiveElapsedSeconds: effectiveElapsed,
      efficiency,
      reward,
      isCapped
    };
  }

  /**
   * ゲーム起動時のオフライン報酬チェック
   */
  checkOfflineProgress() {
    const now = Date.now();
    const lastSaved = this.state.lastSavedTime;
    const autoRate = this.getTotalAutoRate();
    const efficiency = this.getOfflineEfficiency();

    const result = GameEngine.calculateOfflineReward(now, lastSaved, autoRate, efficiency);

    // 10秒以上のオフライン経過があり、効率>0かつ生産量>0の場合
    if (result.effectiveElapsedSeconds >= 10 && result.reward > 0) {
      this.pendingOfflineReward = {
        ...result,
        calculatedAt: now
      };
      return this.pendingOfflineReward;
    }

    // 報酬がなくても保存時刻を最新化
    this.state.lastSavedTime = now;
    this.state.lastCalculatedTime = now;
    return null;
  }

  /**
   * オフライン報酬の受け取り（二重受け取り防止）
   */
  claimOfflineReward() {
    if (!this.pendingOfflineReward) return false;

    const rewardData = this.pendingOfflineReward;
    const amount = rewardData.reward;

    // 残高と累計に反映
    this.state.balance += amount;
    this.state.totalEarned += amount;

    // 二重計上防止：即座に保留報酬をクリアし、保存時刻・計算時刻を同期更新
    const now = Date.now();
    this.state.lastSavedTime = now;
    this.state.lastCalculatedTime = now;
    this.pendingOfflineReward = null;

    // 履歴に追加
    const effPercent = Math.round(rewardData.efficiency * 100);
    const elapsedMinutes = Math.floor(rewardData.effectiveElapsedSeconds / 60);
    const hours = Math.floor(elapsedMinutes / 60);
    const mins = elapsedMinutes % 60;
    const timeStr = hours > 0 ? `${hours}時間${mins}分` : `${mins}分`;

    this.addHistory({
      type: 'offline',
      title: 'オフライン収益チャージ',
      detail: `放置時間: ${timeStr} (効率: ${effPercent}%)`,
      amount: amount
    });

    this.saveGame();
    return amount;
  }

  // --- タップ実行 ---
  tap() {
    const income = this.getTapIncome();
    this.state.balance += income;
    this.state.totalEarned += income;
    this.state.totalTaps += 1;

    return income;
  }

  // --- 毎秒の生産処理（ゲームループ） ---
  tick(deltaSeconds) {
    const rate = this.getTotalAutoRate();
    if (rate <= 0) return 0;

    const income = rate * deltaSeconds;
    this.state.balance += income;
    this.state.totalEarned += income;
    return income;
  }

  // --- 履歴管理（最新100件） ---
  addHistory(entry) {
    const item = {
      id: Date.now() + Math.random().toString(36).substring(2, 6),
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      timestamp: Date.now(),
      type: entry.type || 'info', // 'tap', 'auto', 'offline', 'upgrade', 'bonus'
      title: entry.title,
      detail: entry.detail || '',
      amount: entry.amount || 0
    };

    this.state.history.unshift(item);
    if (this.state.history.length > 100) {
      this.state.history.length = 100;
    }
  }

  setPlayerName(newName) {
    const trimmed = (newName || '').trim();
    if (!trimmed) return false;
    this.state.playerName = trimmed;
    this.saveGame();
    return true;
  }

  // --- セーブ＆ロード ---
  saveGame() {
    const sm = getSaveManager();
    if (sm && typeof sm.save === 'function') {
      return sm.save(this.state);
    }

    try {
      this.state.lastSavedTime = Date.now();
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.state));
      return true;
    } catch (e) {
      console.error('Failed to save game', e);
      return false;
    }
  }

  loadGame() {
    const sm = getSaveManager();
    if (sm && typeof sm.load === 'function') {
      const loaded = sm.load(this.getFreshState());
      if (loaded) {
        this.state = loaded;
        return true;
      }
      return false;
    }

    try {
      const dataStr = localStorage.getItem(this.SAVE_KEY);
      if (!dataStr) return false;

      const loaded = JSON.parse(dataStr);
      if (loaded && typeof loaded === 'object') {
        this.state = {
          ...this.state,
          ...loaded,
          playerName: (loaded && typeof loaded.playerName === 'string' && loaded.playerName.trim()) ? loaded.playerName.trim() : 'ゲスト',
          facilities: { ...this.state.facilities, ...(loaded.facilities || {}) },
          campaigns: { ...this.state.campaigns, ...(loaded.campaigns || {}) },
          specialUpgrades: { ...this.state.specialUpgrades, ...(loaded.specialUpgrades || {}) },
          history: Array.isArray(loaded.history) ? loaded.history : []
        };
        return true;
      }
    } catch (e) {
      console.error('Failed to load game', e);
    }
    return false;
  }

  resetAllData() {
    const sm = getSaveManager();
    if (sm && typeof sm.reset === 'function') {
      this.state = sm.reset(this.getFreshState());
      this.pendingOfflineReward = null;
      return;
    }

    localStorage.removeItem(this.SAVE_KEY);
    this.resetState();
    this.saveGame();
  }

  /**
   * 外部ファイル等から読み込んだセーブデータを適用する
   * @param {Object} importedData 
   * @returns {boolean}
   */
  loadImportedData(importedData) {
    if (!importedData || typeof importedData !== 'object') return false;
    const sm = getSaveManager();
    if (sm && typeof sm.mergeWithDefault === 'function') {
      this.state = sm.mergeWithDefault(this.getFreshState(), importedData);
    } else {
      this.state = {
        ...this.getFreshState(),
        ...importedData,
        facilities: { ...this.state.facilities, ...(importedData.facilities || {}) },
        campaigns: { ...this.state.campaigns, ...(importedData.campaigns || {}) },
        specialUpgrades: { ...this.state.specialUpgrades, ...(importedData.specialUpgrades || {}) },
        history: Array.isArray(importedData.history) ? importedData.history : []
      };
    }
    this.pendingOfflineReward = null;
    this.saveGame();
    return true;
  }
}

// Node環境用エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MAX_OFFLINE_SECONDS,
    OFFLINE_EFFICIENCY_MAP,
    OFFLINE_UPGRADE_COSTS,
    FACILITIES_DATA,
    CAMPAIGNS_DATA,
    FACILITY_MILESTONES,
    FACILITY_UPGRADES_DATA,
    GameEngine
  };
}
