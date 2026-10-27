/**
 * 仕様書第8項「追加テスト仕様」自動検証テストスイート
 * 
 * 検証項目:
 * 1. 数値表記（命数法）
 *    - 9,999から10,000への境界切り替えテスト
 *    - 1億、1兆、1京の命数法表示テスト
 *    - 単位境界付近の丸めテスト
 *    - 表示丸めと購入判定の完全分離テスト
 * 2. オフライン生産
 *    - オフライン効率0%で報酬0テスト
 *    - 効率25%, 50%, 75%, 100%の計算精度テスト（仕様書例: 毎秒1,000円×6時間×50% = 1,080万円）
 *    - 12時間上限テスト（24時間経過でも12時間分のみ計算）
 *    - 時計逆行対策テスト（過去時刻に戻った場合0秒・0報酬）
 *    - 二重受け取り防止テスト（連続受取の阻止）
 *    - セーブ・ロードによるオフラインレベル永続化テスト
 */

function runAllGameTests() {
  const results = [];

  function assert(testName, condition, details = '') {
    results.push({
      name: testName,
      passed: Boolean(condition),
      details: details
    });
  }

  // ==========================================
  // 1. 数値表記テスト
  // ==========================================

  // 1.1 9,999から10,000への切り替え
  const str9999 = formatJapaneseNumber(9999, '円');
  const str10000 = formatJapaneseNumber(10000, '円');
  assert(
    '【命数法】9,999から10,000の境界切り替え',
    str9999 === '9,999円' && str10000 === '1万円',
    `9999 => "${str9999}", 10000 => "${str10000}"`
  );

  // 1.2 億・兆・京の単位テスト
  const strOku = formatJapaneseNumber(123456789, '円');
  const strCho = formatJapaneseNumber(1234567890123, '円');
  const strKei = formatJapaneseNumber(12345678901234567, '円');
  assert(
    '【命数法】億・兆・京の単位表記テスト',
    strOku === '1.234億円' && strCho === '1.234兆円' && strKei === '1.234京円',
    `123,456,789 => "${strOku}", 1.234兆 => "${strCho}", 1.234京 => "${strKei}"`
  );

  // 1.3 仕様書例の数値フォーマットテスト
  const str1250 = formatJapaneseNumber(1250, '円');
  const str12500 = formatJapaneseNumber(12500, '円');
  const str1250000 = formatJapaneseNumber(1250000, '円');
  assert(
    '【命数法】仕様書に記載された典型数値の表記（1,250円 / 1.25万円 / 125万円）',
    str1250 === '1,250円' && str12500 === '1.25万円' && str1250000 === '125万円',
    `1,250 => "${str1250}", 12,500 => "${str12500}", 1,250,000 => "${str1250000}"`
  );

  // 1.4 表示丸めと購入判定の分離テスト
  // 例: 所持金が 9,999円 のとき、価格 10,000円（表示「1万円」）のアイテムは購入不可
  const testEngine = new GameEngine();
  testEngine.state.balance = 9999;
  const canAfford = testEngine.state.balance >= 10000;
  const displayedBalance = formatJapaneseNumber(testEngine.state.balance, '円');
  assert(
    '【数値計算】表示用の丸めと購入判定の完全分離（9,999円で1万円の商品は買えない）',
    canAfford === false && displayedBalance === '9,999円',
    `所持金: ${testEngine.state.balance} (表示: ${displayedBalance}) / 判定: ${canAfford}`
  );

  // ==========================================
  // 2. オフライン生産テスト
  // ==========================================

  const ONE_HOUR = 3600 * 1000;
  const BASE_AUTO_RATE = 1000; // 毎秒1,000円

  // 2.1 オフライン効率0%では報酬が0になる
  const res0 = GameEngine.calculateOfflineReward(
    Date.now() + 6 * ONE_HOUR,
    Date.now(),
    BASE_AUTO_RATE,
    0.0 // 0%
  );
  assert(
    '【オフライン生産】効率0%では報酬が0円になる',
    res0.reward === 0,
    `経過6時間、生産量1,000円/秒、効率0% => 報酬: ${res0.reward}円`
  );

  // 2.2 効率25%, 50%, 75%, 100% での計算精度テスト（仕様書例: 6時間、1000円/秒、50% => 1,080万円）
  const sixHours = 6 * 3600; // 21,600秒
  const now = Date.now();
  const res50 = GameEngine.calculateOfflineReward(now + 6 * ONE_HOUR, now, 1000, 0.50);
  const expected50 = 1000 * sixHours * 0.50; // 10,800,000円 (1,080万円)

  const res25 = GameEngine.calculateOfflineReward(now + 6 * ONE_HOUR, now, 1000, 0.25);
  const res75 = GameEngine.calculateOfflineReward(now + 6 * ONE_HOUR, now, 1000, 0.75);
  const res100 = GameEngine.calculateOfflineReward(now + 6 * ONE_HOUR, now, 1000, 1.00);

  assert(
    '【オフライン生産】効率50%で仕様書記載の計算結果（1,080万円）と完全一致',
    res50.reward === expected50 && res50.reward === 10800000,
    `仕様書計算値: 10,800,000円, 実際計算値: ${res50.reward}円`
  );

  assert(
    '【オフライン生産】効率25%, 75%, 100% の各段階で正しく比例計算される',
    res25.reward === 5400000 && res75.reward === 16200000 && res100.reward === 21600000,
    `25%: ${res25.reward}円, 75%: ${res75.reward}円, 100%: ${res100.reward}円`
  );

  // 2.3 経過時間12時間の上限および24時間でも12時間分のみ計算
  const res12h = GameEngine.calculateOfflineReward(now + 12 * ONE_HOUR, now, 1000, 1.0);
  const res24h = GameEngine.calculateOfflineReward(now + 24 * ONE_HOUR, now, 1000, 1.0);
  const maxExpected = 1000 * 12 * 3600 * 1.0; // 43,200,000円

  assert(
    '【オフライン上限】経過時間24時間でも12時間上限（43,200秒分）で制限される',
    res12h.reward === maxExpected && res24h.reward === maxExpected && res24h.effectiveElapsedSeconds === 43200,
    `12h報酬: ${res12h.reward}円, 24h報酬: ${res24h.reward}円 (上限時間: ${res24h.effectiveElapsedSeconds}秒)`
  );

  // 2.4 時計逆行対策テスト
  const resClockRewind = GameEngine.calculateOfflineReward(now - 3600 * 1000, now, 1000, 1.0);
  assert(
    '【時計逆行対策】端末時計が過去に戻された場合は報酬が0円になる',
    resClockRewind.reward === 0 && resClockRewind.effectiveElapsedSeconds === 0,
    `逆行時秒数: ${resClockRewind.effectiveElapsedSeconds}秒, 報酬: ${resClockRewind.reward}円`
  );

  // 2.5 二重受け取り防止テスト
  const mockEngine = new GameEngine();
  mockEngine.state.facilities['point_back'] = 1000; // 毎秒1,000円
  mockEngine.state.offlineLevel = 2; // 50%
  mockEngine.state.lastSavedTime = Date.now() - 6 * ONE_HOUR; // 6時間前

  const pending = mockEngine.checkOfflineProgress();
  const firstClaimAmount = mockEngine.claimOfflineReward();
  const secondClaimAmount = mockEngine.claimOfflineReward(); // 2回目の受け取り試行

  assert(
    '【二重受け取り防止】1回目の受け取り成功後、2回目の受け取りは阻止される (0円)',
    firstClaimAmount > 0 && secondClaimAmount === false && mockEngine.pendingOfflineReward === null,
    `1回目獲得: ${firstClaimAmount}円, 2回目獲得: ${secondClaimAmount}`
  );

  // 2.6 セーブ＆ロードによるオフラインレベル・データ永続化テスト
  mockEngine.state.offlineLevel = 3;
  mockEngine.state.balance = 500000;
  mockEngine.saveGame();

  const restoredEngine = new GameEngine();
  const loaded = restoredEngine.loadGame();
  assert(
    '【セーブ＆ロード】再起動・復帰後もオフライン効率レベルと残高が保持される',
    loaded === true && restoredEngine.state.offlineLevel === 3 && restoredEngine.state.balance === 500000,
    `ロード結果: ${loaded}, オフラインLv: ${restoredEngine.state.offlineLevel}, 残高: ${restoredEngine.state.balance}`
  );

  // ==========================================
  // 3. 設備まとめ買い・MAX計算テスト
  // ==========================================
  const maxTestEngine = new GameEngine();
  // 15円の「point_back」を所持金100円でMAX購入
  maxTestEngine.state.balance = 100;
  const maxInfo = maxTestEngine.getMaxAffordableCount('point_back');
  const exactCost = maxTestEngine.getFacilityCost('point_back', maxInfo.count);
  assert(
    '【MAX購入計算】所持金以内で買える最大台数と正確な金額が算出される',
    maxInfo.count > 0 && exactCost <= 100 && exactCost === maxInfo.cost,
    `所持金100円 => 最大${maxInfo.count}台 (費用: ${maxInfo.cost}円, 残金: ${100 - maxInfo.cost}円)`
  );

  // ==========================================
  // 4. 新機能（毎秒単位「円」、施設特別倍率マイルストーン）テスト
  // ==========================================

  // 4.1 毎秒の単位が「円」になっていることの検証
  const testRateStr = formatRate(1250);
  assert(
    '【新仕様①】毎秒の生産量単位が「ペイ」から「円」になっていること',
    testRateStr === '毎秒 +1,250円',
    `formatRate(1250) => "${testRateStr}"`
  );

  // 4.2 施設規定数（10個）未達では特別倍率を購入できないことの検証
  const milestoneEngine = new GameEngine();
  milestoneEngine.state.facilities['point_back'] = 9; // まだ9個
  milestoneEngine.state.balance = 100000000; // お金は潤沢
  const buyFailed = milestoneEngine.buySpecialUpgrade('spec_point_back_10');
  assert(
    '【新仕様③】施設規定数（10個）未満では特別倍率を購入・適用できない',
    buyFailed === false,
    `所持数9台での購入試行 => 結果: ${buyFailed}`
  );

  // 4.3 施設10個購入後に特別倍率を購入でき、生産倍率がその時の10倍になることの検証
  milestoneEngine.state.facilities['point_back'] = 10;
  const initialPointBackRate = milestoneEngine.getFacilityRate('point_back'); // 1 * 10 * 1 = 10円/秒
  const buySuccess = milestoneEngine.buySpecialUpgrade('spec_point_back_10');
  const mult10 = milestoneEngine.getFacilityMultiplier('point_back');
  const newPointBackRate = milestoneEngine.getFacilityRate('point_back'); // 1 * 10 * 10 = 100円/秒
  assert(
    '【新仕様③】10個達成後に特別倍率を購入でき、その施設の生産倍率が10倍になる',
    buySuccess === true && mult10 === 10 && newPointBackRate === initialPointBackRate * 10,
    `倍率: ×${mult10}, 適用前: ${initialPointBackRate}円/秒 => 適用後: ${newPointBackRate}円/秒`
  );

  // 4.4 施設50個購入後に2つ目の特別倍率を購入するとさらにその時の10倍（累積100倍）になることの検証
  milestoneEngine.state.facilities['point_back'] = 50;
  const before50Rate = milestoneEngine.getFacilityRate('point_back');
  const buy50Success = milestoneEngine.buySpecialUpgrade('spec_point_back_50');
  const mult50 = milestoneEngine.getFacilityMultiplier('point_back');
  const after50Rate = milestoneEngine.getFacilityRate('point_back');
  assert(
    '【新仕様③】50個達成後に2つ目の特別倍率を購入でき、さらにその時の10倍（累積100倍）になる',
    buy50Success === true && mult50 === 100 && after50Rate === before50Rate * 10,
    `倍率: ×${mult50}, 50台適用前: ${before50Rate}円/秒 => 適用後: ${after50Rate}円/秒`
  );

  // 4.5 セーブ＆ロード後も特別倍率の購入状態が維持されることの検証
  milestoneEngine.saveGame();
  const loadedMilestoneEngine = new GameEngine();
  loadedMilestoneEngine.loadGame();
  const loadedMult = loadedMilestoneEngine.getFacilityMultiplier('point_back');
  assert(
    '【新仕様永続化】セーブ＆ロード後も施設特別倍率の購入状態（倍率）が保持される',
    loadedMult === 100,
    `ロード後の倍率: ×${loadedMult}`
  );

  // 4.6 プレイヤーネームの初期値「ゲスト」と変更・永続化テスト
  const playerEngine = new GameEngine();
  const defaultName = playerEngine.state.playerName;
  const changeResult = playerEngine.setPlayerName('大和');
  playerEngine.saveGame();

  const restoredPlayerEngine = new GameEngine();
  restoredPlayerEngine.loadGame();
  const loadedName = restoredPlayerEngine.state.playerName;

  assert(
    '【プレイヤーネーム】初期値が「ゲスト」であり、いつでも変更および保存・復元できる',
    defaultName === 'ゲスト' && changeResult === true && loadedName === '大和',
    `初期名: "${defaultName}", 変更成功: ${changeResult}, ロード後名: "${loadedName}"`
  );

  // 4.7 セーブ管理（SaveManager）とインポート機能の検証テスト
  const testImportData = {
    playerName: 'テスト社長',
    balance: 777777,
    totalEarned: 999999,
    tapLevel: 5,
    facilities: { point_back: 50 },
    campaigns: { camp_1: true }
  };
  const importEngine = new GameEngine();
  const importSuccess = importEngine.loadImportedData(testImportData);
  assert(
    '【セーブ管理】外部セーブデータのインポートと整合性マージが正しく行われる',
    importSuccess === true &&
    importEngine.state.playerName === 'テスト社長' &&
    importEngine.state.balance === 777777 &&
    importEngine.state.facilities['point_back'] === 50 &&
    importEngine.state.campaigns['camp_1'] === true,
    `インポート結果: ${importSuccess}, 復元後残高: ${importEngine.state.balance}, 施設50台: ${importEngine.state.facilities['point_back']}`
  );

  return results;
}

// Node環境用エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllGameTests };
}
