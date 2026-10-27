/**
 * 電子マネー型クリッカーゲーム「ペイクル (PayKuru)」
 * メインエントリーポイント & ゲームループ
 */

document.addEventListener('DOMContentLoaded', () => {
  // 0. バージョン番号の読み込みと表示
  fetch('ver.txt')
    .then(res => res.text())
    .then(ver => {
      const el = document.getElementById('appVersionDisplay');
      if (el) el.textContent = 'v' + ver.trim();
    })
    .catch(() => { /* フォールバック: HTMLの初期値 v0.1 をそのまま使用 */ });

  // 1. エンジンとサウンドの初期化
  const engine = new GameEngine();
  const sounds = soundSystem;

  // 2. セーブデータのロード
  const hasSave = engine.loadGame();

  // 3. UIコントローラー初期化
  const ui = new UIController(engine, sounds);

  // 4. 初回描画
  ui.renderAll();

  // 5. オフライン進行のチェックと復帰モーダル表示
  if (hasSave) {
    const offlineReward = engine.checkOfflineProgress();
    if (offlineReward && offlineReward.reward > 0) {
      setTimeout(() => {
        ui.showOfflineModal(offlineReward);
      }, 400);
    }
  }

  // 6. ゲームループ（毎秒の自動生産）
  let lastTime = performance.now();
  let saveTimer = 0;
  let historySummaryTimer = 0;
  let accumulatedTickIncome = 0;

  function gameLoop(currentTime) {
    const deltaMs = currentTime - lastTime;
    const deltaSeconds = deltaMs / 1000;
    lastTime = currentTime;

    if (deltaSeconds > 0 && deltaSeconds < 2) {
      // 自動生産
      const income = engine.tick(deltaSeconds);
      accumulatedTickIncome += income;

      // 毎秒UI更新
      ui.renderHeaderAndCards();
      ui.renderEarnStats();
      ui.updateAffordability();

      // オートセーブ（5秒ごと）
      saveTimer += deltaSeconds;
      if (saveTimer >= 5.0) {
        engine.saveGame();
        saveTimer = 0;
      }

      // 自動生産の履歴集約記録（30秒ごと、かつ生産があった場合）
      historySummaryTimer += deltaSeconds;
      if (historySummaryTimer >= 30.0) {
        if (accumulatedTickIncome >= 1) {
          engine.addHistory({
            type: 'auto',
            title: '自動決済売上計上',
            detail: `過去30秒間の自動生産収益`,
            amount: Math.floor(accumulatedTickIncome)
          });
          accumulatedTickIncome = 0;
        }
        historySummaryTimer = 0;
      }
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);

  // 7. 画面が閉じられる・バックグラウンドに移行する際のセーブ
  window.addEventListener('beforeunload', () => {
    engine.saveGame();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      engine.saveGame();
    } else {
      // 復帰時にオフラインチェック
      const offlineReward = engine.checkOfflineProgress();
      if (offlineReward && offlineReward.reward > 0) {
        ui.showOfflineModal(offlineReward);
      }
    }
  });

  // グローバルアクセス（デバッグ・テスト用）
  window.paykuru = {
    engine,
    sounds,
    ui
  };
});
