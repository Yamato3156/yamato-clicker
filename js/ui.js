/**
 * 電子マネー型クリッカーゲーム「ペイクル (PayKuru)」
 * UIコントローラー＆イベント管理モジュール
 */

class UIController {
  constructor(engine, sounds) {
    this.engine = engine;
    this.sounds = sounds;

    // コンボ状態
    this.comboCount = 0;
    this.comboTimer = null;
    this.buyMultiplier = 1; // 1 or 10

    this.initElements();
    this.bindEvents();
    this.initSoundButtonState();
  }

  initElements() {
    // ヘッダー・アクション
    this.soundToggleBtn = document.getElementById('soundToggleBtn');
    this.soundIcon = document.getElementById('soundIcon');
    this.notifyBtn = document.getElementById('notifyBtn');

    // 残高カード
    this.balanceDisplay = document.getElementById('balanceDisplay');
    this.rateDisplay = document.getElementById('rateDisplay');
    this.totalEarnedDisplay = document.getElementById('totalEarnedDisplay');
    this.barcodeArea = document.getElementById('barcodeArea');

    // タップ画面（稼ぐ）
    this.mainTapBtn = document.getElementById('mainTapBtn');
    this.quickTapBtn = document.getElementById('quickTapBtn');
    this.comboBanner = document.getElementById('comboBanner');
    this.comboText = document.getElementById('comboText');
    this.tapIncomeVal = document.getElementById('tapIncomeVal');
    this.tapLevelVal = document.getElementById('tapLevelVal');
    this.tapMultiplierVal = document.getElementById('tapMultiplierVal');
    this.totalTapsVal = document.getElementById('totalTapsVal');

    // 強化画面
    this.facilityList = document.getElementById('facilityList');
    this.tapUpgradeCard = document.getElementById('tapUpgradeCard');
    this.campaignList = document.getElementById('campaignList');
    this.offlineUpgradeCard = document.getElementById('offlineUpgradeCard');
    this.buyMult1Btn = document.getElementById('buyMult1');
    this.buyMult10Btn = document.getElementById('buyMult10');
    this.buyMult100Btn = document.getElementById('buyMult100');
    this.buyMultMaxBtn = document.getElementById('buyMultMax');

    // 履歴画面
    this.historyList = document.getElementById('historyList');

    // マイページ・統計
    this.statBalance = document.getElementById('statBalance');
    this.statTotalEarned = document.getElementById('statTotalEarned');
    this.statTotalTaps = document.getElementById('statTotalTaps');
    this.statAutoRate = document.getElementById('statAutoRate');
    this.statOfflineEff = document.getElementById('statOfflineEff');
    this.manualSaveBtn = document.getElementById('manualSaveBtn');
    this.resetDataBtn = document.getElementById('resetDataBtn');
    this.exportSaveBtn = document.getElementById('exportSaveBtn');
    this.importSaveBtn = document.getElementById('importSaveBtn');
    this.importSaveInput = document.getElementById('importSaveInput');

    // オフラインシミュレーションボタン
    this.sim1hBtn = document.getElementById('sim1hBtn');
    this.sim6hBtn = document.getElementById('sim6hBtn');
    this.sim12hBtn = document.getElementById('sim12hBtn');

    // テストスイート
    this.runTestsBtn = document.getElementById('runTestsBtn');
    this.testResultsList = document.getElementById('testResultsList');

    // オフラインモーダル
    this.offlineModal = document.getElementById('offlineModal');
    this.offlineElapsedText = document.getElementById('offlineElapsedText');
    this.offlineEffectiveText = document.getElementById('offlineEffectiveText');
    this.offlineEfficiencyText = document.getElementById('offlineEfficiencyText');
    this.offlineRewardText = document.getElementById('offlineRewardText');
    this.claimRewardBtn = document.getElementById('claimRewardBtn');

    // プレイヤーネーム変更モーダル
    this.playerNameDisplay = document.getElementById('playerNameDisplay');
    this.editNameBtn = document.getElementById('editNameBtn');
    this.nameChangeModal = document.getElementById('nameChangeModal');
    this.playerNameInput = document.getElementById('playerNameInput');
    this.saveNameChangeBtn = document.getElementById('saveNameChangeBtn');
    this.cancelNameChangeBtn = document.getElementById('cancelNameChangeBtn');

    // トーストコンテナ
    this.toastContainer = document.getElementById('toastContainer');

    // ナビバッジ
    this.upgradeNavBadge = document.getElementById('upgradeNavBadge');
  }

  bindEvents() {
    // タブ切り替え
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetTab = item.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    // 強化サブタブ切り替え（※.subtabs内のボタンに限定して不具合を防止）
    const subtabs = document.querySelectorAll('.subtabs .subtab-btn');
    subtabs.forEach(btn => {
      btn.addEventListener('click', () => {
        subtabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const cat = btn.dataset.category;
        document.querySelectorAll('.upgrade-section').forEach(sec => {
          sec.style.display = (sec.dataset.category === cat) ? 'block' : 'none';
        });
      });
    });

    // サウンド切替
    this.soundToggleBtn.addEventListener('click', () => {
      const muted = this.sounds.toggleMute();
      this.updateSoundIcon(muted);
      this.showToast(muted ? '消音モードにしました' : 'サウンドをオンにしました');
    });

    // 通知ベル
    this.notifyBtn.addEventListener('click', () => {
      this.switchTab('history');
    });

    // バーコードクリックギミック
    if (this.barcodeArea) {
      this.barcodeArea.addEventListener('click', () => {
        this.sounds.playTap();
        this.showToast('決済バーコードを更新しました');
      });
    }

    // メインタップボタン
    this.mainTapBtn.addEventListener('click', (e) => this.handleTap(e));
    if (this.quickTapBtn) {
      this.quickTapBtn.addEventListener('click', (e) => this.handleTap(e));
    }

    // 購入単位（×1 / ×10 / ×100 / MAX）
    const multButtons = [
      { el: this.buyMult1Btn, val: 1 },
      { el: this.buyMult10Btn, val: 10 },
      { el: this.buyMult100Btn, val: 100 },
      { el: this.buyMultMaxBtn, val: 'max' }
    ];

    multButtons.forEach(item => {
      if (item.el) {
        item.el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.buyMultiplier = item.val;
          multButtons.forEach(b => {
            if (b.el) b.el.classList.toggle('active', b.el === item.el);
          });
          this.renderFacilityList();
          this.updateAffordability();
        });
      }
    });

    // 手動セーブ・データ初期化・ファイル入出力
    if (this.manualSaveBtn) {
      this.manualSaveBtn.addEventListener('click', () => {
        this.engine.saveGame();
        this.sounds.playTap();
        this.showToast('データを保存しました');
      });
    }

    if (this.resetDataBtn) {
      this.resetDataBtn.addEventListener('click', () => {
        if (confirm('本当にすべてのデータをリセットしますか？この操作は取り消せません。')) {
          this.engine.resetAllData();
          this.sounds.playTap();
          this.renderAll();
          this.showToast('データを初期化しました');
        }
      });
    }

    if (this.exportSaveBtn) {
      this.exportSaveBtn.addEventListener('click', () => {
        this.sounds.playTap();
        const sm = (typeof SaveManager !== 'undefined') ? SaveManager : (window.SaveManager || null);
        if (sm && typeof sm.exportToFile === 'function') {
          const success = sm.exportToFile(this.engine.state);
          if (success) {
            this.showToast('セーブファイルを保存しました');
          } else {
            this.showToast('セーブファイルの書き出しに失敗しました');
          }
        } else {
          // フォールバック
          const jsonStr = JSON.stringify(this.engine.state, null, 2);
          const blob = new Blob([jsonStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'paykuru_save.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          this.showToast('セーブファイルを保存しました');
        }
      });
    }

    if (this.importSaveBtn && this.importSaveInput) {
      this.importSaveBtn.addEventListener('click', () => {
        this.sounds.playTap();
        this.importSaveInput.value = ''; // リセット
        this.importSaveInput.click();
      });

      this.importSaveInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        try {
          const sm = (typeof SaveManager !== 'undefined') ? SaveManager : (window.SaveManager || null);
          let importedData = null;
          if (sm && typeof sm.importFromFile === 'function') {
            importedData = await sm.importFromFile(file);
          } else {
            const text = await file.text();
            importedData = JSON.parse(text);
          }

          if (importedData && typeof importedData === 'object') {
            const applied = this.engine.loadImportedData(importedData);
            if (applied) {
              this.renderAll();
              this.showToast('セーブデータを復元しました');
            } else {
              this.showToast('セーブデータの反映に失敗しました');
            }
          } else {
            this.showToast('セーブデータ形式が無効です');
          }
        } catch (err) {
          console.error('Import error:', err);
          alert('セーブファイルの読み込みに失敗しました: ' + err.message);
        }
      });
    }

    // オフライン報酬受け取りボタン
    this.claimRewardBtn.addEventListener('click', () => {
      const amount = this.engine.claimOfflineReward();
      if (amount > 0) {
        this.sounds.playPayment();
        this.offlineModal.classList.remove('active');
        this.showToast(`${formatJapaneseNumber(amount, '円')}を受け取りました！`);
        this.renderAll();
      }
    });

    // オフライン時間シミュレーター（動作確認用）
    if (this.sim1hBtn) {
      this.sim1hBtn.addEventListener('click', () => this.simulateOfflineTime(1));
    }
    if (this.sim6hBtn) {
      this.sim6hBtn.addEventListener('click', () => this.simulateOfflineTime(6));
    }
    if (this.sim12hBtn) {
      this.sim12hBtn.addEventListener('click', () => this.simulateOfflineTime(12));
    }

    // テストスイート実行ボタン
    if (this.runTestsBtn) {
      this.runTestsBtn.addEventListener('click', () => this.executeTestSuite());
    }

    // プレイヤーネーム変更モーダル
    if (this.editNameBtn) {
      this.editNameBtn.addEventListener('click', () => this.openNameChangeModal());
    }
    if (this.cancelNameChangeBtn) {
      this.cancelNameChangeBtn.addEventListener('click', () => this.closeNameChangeModal());
    }
    if (this.saveNameChangeBtn) {
      this.saveNameChangeBtn.addEventListener('click', () => this.savePlayerName());
    }
    if (this.playerNameInput) {
      this.playerNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.savePlayerName();
        } else if (e.key === 'Escape') {
          this.closeNameChangeModal();
        }
      });
    }
    if (this.nameChangeModal) {
      this.nameChangeModal.addEventListener('click', (e) => {
        if (e.target === this.nameChangeModal) {
          this.closeNameChangeModal();
        }
      });
    }
  }

  initSoundButtonState() {
    this.updateSoundIcon(this.sounds.muted);
  }

  updateSoundIcon(muted) {
    if (this.soundIcon) {
      this.soundIcon.className = muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
    }
  }

  switchTab(tabId) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabId);
    });

    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabId}`);
    });

    if (tabId === 'history') {
      this.renderHistory();
    } else if (tabId === 'upgrade') {
      this.renderUpgrades();
    } else if (tabId === 'profile') {
      this.renderProfile();
    }
  }

  // --- タップ処理 ---
  handleTap(event) {
    const income = this.engine.tap();
    this.sounds.playTap();

    // コンボ処理
    this.comboCount += 1;
    clearTimeout(this.comboTimer);
    this.comboTimer = setTimeout(() => {
      this.comboCount = 0;
      this.updateComboUI();
    }, 1200);
    this.updateComboUI();

    const target = (event && (event.currentTarget || event.target)) || this.mainTapBtn;

    // 波紋リップルエフェクト（ボタン内のみ）
    this.createRipple(event, target);

    // 金額フライングポップアップ（タップしたボタンの位置に表示）
    this.createFloatingNumber(event, income, target);

    // 画面高速更新
    this.renderHeaderAndCards();
    this.renderEarnStats();
    this.updateAffordability();
  }

  updateComboUI() {
    if (!this.comboBanner) return;

    if (this.comboCount >= 10) {
      this.comboBanner.className = 'combo-banner fever';
      this.comboText.innerHTML = `🔥 FEVER連打中！ <b>${this.comboCount}</b> コンボ！`;
    } else if (this.comboCount >= 3) {
      this.comboBanner.className = 'combo-banner';
      this.comboText.innerHTML = `⚡ 連続タップ: <b>${this.comboCount}</b> 回`;
    } else {
      this.comboBanner.className = 'combo-banner';
      this.comboText.innerHTML = 'タップして電子マネーを獲得';
    }
  }

  createRipple(event, targetElement) {
    if (!targetElement) return;

    // ボタン外にはみ出さないよう position と overflow を確実に担保
    if (getComputedStyle(targetElement).position === 'static') {
      targetElement.style.position = 'relative';
    }
    targetElement.style.overflow = 'hidden';

    const rect = targetElement.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';

    const clientX = (event && typeof event.clientX === 'number' && event.clientX !== 0)
      ? event.clientX
      : (event && event.touches && event.touches[0] && event.touches[0].clientX)
      || (rect.left + rect.width / 2);

    const clientY = (event && typeof event.clientY === 'number' && event.clientY !== 0)
      ? event.clientY
      : (event && event.touches && event.touches[0] && event.touches[0].clientY)
      || (rect.top + rect.height / 2);

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 1.5;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;

    targetElement.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  createFloatingNumber(event, amount, targetElement) {
    const target = targetElement || this.mainTapBtn;
    if (!target) return;

    const floatEl = document.createElement('div');
    floatEl.className = 'floating-number';
    floatEl.textContent = `+${formatJapaneseNumber(amount, '円')}`;

    const rect = target.getBoundingClientRect();
    const clientX = (event && typeof event.clientX === 'number' && event.clientX !== 0)
      ? event.clientX
      : (rect.left + rect.width / 2);
    const clientY = (event && typeof event.clientY === 'number' && event.clientY !== 0)
      ? event.clientY
      : (rect.top + rect.height / 2);

    // 少しランダムに散らす
    const offsetX = (Math.random() - 0.5) * 40;
    const offsetY = (Math.random() - 0.5) * 15;

    // 親コンテナに対して配置
    const container = target.parentElement || document.body;
    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }
    const containerRect = container.getBoundingClientRect();

    floatEl.style.left = `${clientX - containerRect.left + offsetX}px`;
    floatEl.style.top = `${clientY - containerRect.top - 10 + offsetY}px`;

    container.appendChild(floatEl);
    setTimeout(() => floatEl.remove(), 800);
  }

  // --- オフライン報酬モーダルのトリガー ---
  showOfflineModal(rewardData) {
    if (!rewardData) return;

    const rawSec = rewardData.rawElapsedSeconds;
    const effSec = rewardData.effectiveElapsedSeconds;

    const formatDuration = (sec) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      if (h > 0) return `${h}時間${m}分`;
      if (m > 0) return `${m}分${s}秒`;
      return `${s}秒`;
    };

    this.offlineElapsedText.textContent = formatDuration(rawSec);
    this.offlineEffectiveText.textContent = `${formatDuration(effSec)} (上限12時間)`;
    this.offlineEfficiencyText.textContent = `${Math.round(rewardData.efficiency * 100)}%`;
    this.offlineRewardText.textContent = formatJapaneseNumber(rewardData.reward, '円');

    this.offlineModal.classList.add('active');
  }

  // --- オフライン時間シミュレーション（動作確認テスト用） ---
  simulateOfflineTime(hours) {
    const simulatedSeconds = hours * 3600;
    const autoRate = this.engine.getTotalAutoRate();
    const eff = this.engine.getOfflineEfficiency();

    if (autoRate <= 0) {
      alert('先に強化画面で自動生産設備を購入してください（生産量が0円/秒では報酬が発生しません）');
      return;
    }
    if (eff <= 0) {
      alert('先に強化画面でオフライン生産効率をLv.1以上に強化してください（効率0%では報酬が発生しません）');
      return;
    }

    // 最終保存時刻をシミュレーション分過去に設定
    this.engine.state.lastSavedTime = Date.now() - simulatedSeconds * 1000;
    const reward = this.engine.checkOfflineProgress();
    if (reward) {
      this.showOfflineModal(reward);
    }
  }

  // --- レンダリング処理 ---
  renderHeaderAndCards() {
    const balance = this.engine.state.balance;
    const totalEarned = this.engine.state.totalEarned;
    const rate = this.engine.getTotalAutoRate();

    if (this.balanceDisplay) {
      this.balanceDisplay.textContent = formatJapaneseNumber(balance, '円');
    }
    if (this.rateDisplay) {
      this.rateDisplay.textContent = formatRate(rate);
    }
    if (this.totalEarnedDisplay) {
      this.totalEarnedDisplay.textContent = `累計獲得額：${formatJapaneseNumber(totalEarned, '円')}`;
    }
  }

  renderEarnStats() {
    const tapIncome = this.engine.getTapIncome();
    const tapLevel = this.engine.state.tapLevel;
    const totalTaps = this.engine.state.totalTaps;

    if (this.tapIncomeVal) {
      this.tapIncomeVal.textContent = formatJapaneseNumber(tapIncome, '円');
    }
    if (this.tapLevelVal) {
      this.tapLevelVal.textContent = `Lv.${tapLevel}`;
    }
    if (this.tapMultiplierVal) {
      this.tapMultiplierVal.textContent = `×${tapIncome}`;
    }
    if (this.totalTapsVal) {
      this.totalTapsVal.textContent = `${totalTaps.toLocaleString('ja-JP')} 回`;
    }
  }

  renderUpgrades() {
    this.renderTapUpgradeCard();
    this.renderOfflineUpgradeCard();
    this.renderFacilityList();
    this.renderCampaignList();
  }

  renderTapUpgradeCard() {
    if (!this.tapUpgradeCard) return;

    const level = this.engine.state.tapLevel;
    const nextIncome = this.engine.getTapIncome();
    const cost = this.engine.getTapUpgradeCost();
    const canAfford = this.engine.state.balance >= cost;

    this.tapUpgradeCard.innerHTML = `
      <div class="upgrade-icon-wrap" style="background: #fff0f3; color: var(--primary);">
        <i class="fa-solid fa-hand-pointer"></i>
      </div>
      <div class="upgrade-info">
        <div class="upgrade-name-row">
          <span class="upgrade-name">タップチャージ強化</span>
          <span class="upgrade-level-badge">Lv.${level}</span>
        </div>
        <p class="upgrade-desc">1タップごとの電子マネー獲得量を大幅に引き上げる</p>
        <p class="upgrade-effect">現在: +${formatJapaneseNumber(nextIncome, '円')}/タップ</p>
      </div>
      <button class="buy-btn ${canAfford ? '' : 'disabled'}" id="buyTapBtn">
        <span class="buy-btn-label">強化</span>
        <span class="buy-btn-price">${formatJapaneseNumber(cost, '円')}</span>
      </button>
    `;

    document.getElementById('buyTapBtn').addEventListener('click', () => {
      if (this.engine.upgradeTap()) {
        this.sounds.playUpgrade();
        this.renderAll();
      }
    });
  }

  renderOfflineUpgradeCard() {
    if (!this.offlineUpgradeCard) return;

    const level = this.engine.state.offlineLevel;
    const currentEff = Math.round(this.engine.getOfflineEfficiency() * 100);
    const cost = this.engine.getOfflineUpgradeCost();
    const isMax = cost === null;
    const canAfford = !isMax && (this.engine.state.balance >= cost);

    const nextEff = !isMax ? Math.round(OFFLINE_EFFICIENCY_MAP[level + 1] * 100) : 100;

    this.offlineUpgradeCard.innerHTML = `
      <div class="upgrade-icon-wrap" style="background: #f3e8ff; color: #8338ec;">
        <i class="fa-solid fa-cloud-arrow-down"></i>
      </div>
      <div class="upgrade-info">
        <div class="upgrade-name-row">
          <span class="upgrade-name">オフライン生産効率</span>
          <span class="upgrade-level-badge">Lv.${level} / 4</span>
        </div>
        <div class="offline-progress-bar">
          <div class="offline-progress-fill" style="width: ${currentEff}%;"></div>
        </div>
        <p class="upgrade-desc">不在中（最大12時間）の自動生産効率: <b>${currentEff}%</b> ${isMax ? '(最大到達)' : `→ 次: <b>${nextEff}%</b>`}</p>
        <p class="upgrade-effect">${isMax ? '✨ 通常生産と同等の100%効率達成！' : `上限12時間・最大100%まで向上`}</p>
      </div>
      <button class="buy-btn ${isMax || !canAfford ? 'disabled' : ''}" id="buyOfflineBtn" ${isMax ? 'disabled' : ''}>
        <span class="buy-btn-label">${isMax ? 'MAX' : '強化'}</span>
        <span class="buy-btn-price">${isMax ? '完了' : formatJapaneseNumber(cost, '円')}</span>
      </button>
    `;

    if (!isMax) {
      document.getElementById('buyOfflineBtn').addEventListener('click', () => {
        if (this.engine.upgradeOffline()) {
          this.sounds.playUpgrade();
          this.renderAll();
        }
      });
    }
  }

  renderFacilityList() {
    if (!this.facilityList) return;

    const isMax = this.buyMultiplier === 'max';
    let html = '';

    FACILITIES_DATA.forEach(facility => {
      const currentLevel = this.engine.state.facilities[facility.id] || 0;
      let buyCount = 1;
      let cost = 0;
      let canAfford = false;
      let labelText = '';

      if (isMax) {
        const maxInfo = this.engine.getMaxAffordableCount(facility.id);
        buyCount = maxInfo.count > 0 ? maxInfo.count : 1;
        cost = maxInfo.cost;
        canAfford = maxInfo.count > 0;
        labelText = maxInfo.count > 0 ? `+${maxInfo.count}台 (MAX)` : '+0台 (MAX)';
      } else {
        buyCount = this.buyMultiplier;
        cost = this.engine.getFacilityCost(facility.id, buyCount);
        canAfford = this.engine.state.balance >= cost;
        labelText = `+${buyCount}台 購入`;
      }

      const facilityMult = this.engine.getFacilityMultiplier ? this.engine.getFacilityMultiplier(facility.id) : 1;
      const ratePerUnit = facility.baseRate * facilityMult;
      const totalRate = ratePerUnit * currentLevel;

      html += `
        <div class="upgrade-card">
          <div class="upgrade-icon-wrap">
            <i class="fa-solid ${facility.icon}"></i>
          </div>
          <div class="upgrade-info">
            <div class="upgrade-name-row">
              <span class="upgrade-name">${facility.name}</span>
              <span class="upgrade-level-badge">Lv.${currentLevel}</span>
            </div>
            <p class="upgrade-desc">${facility.desc}</p>
            <p class="upgrade-effect">毎秒 +${formatJapaneseNumber(totalRate, '円')} (${formatJapaneseNumber(ratePerUnit, '円')}/台${facilityMult > 1 ? ` <span style="background: rgba(255, 0, 94, 0.1); color: var(--primary); padding: 1px 6px; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">×${facilityMult}</span>` : ''})</p>
          </div>
          <button class="buy-btn ${canAfford ? '' : 'disabled'}" data-facility-id="${facility.id}">
            <span class="buy-btn-label">${labelText}</span>
            <span class="buy-btn-price">${formatJapaneseNumber(cost, '円')}</span>
          </button>
        </div>
      `;
    });

    this.facilityList.innerHTML = html;

    // クリックイベント設定
    this.facilityList.querySelectorAll('.buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.facilityId;
        let countToBuy = this.buyMultiplier;

        if (this.buyMultiplier === 'max') {
          const maxInfo = this.engine.getMaxAffordableCount(id);
          countToBuy = maxInfo.count;
          if (countToBuy <= 0) return;
        }

        if (this.engine.buyFacility(id, countToBuy)) {
          this.sounds.playUpgrade();
          this.renderAll();
        }
      });
    });
  }

  buildSpecialUpgradeCardHtml(item, canAfford) {
    const isOwned = item.isOwned;
    const isCampaign = item.type === 'campaign';
    const iconBg = isOwned ? '#f1f3f5' : (isCampaign ? '#fff8e6' : '#eff6ff');
    const iconColor = isOwned ? '#868e96' : (isCampaign ? 'var(--gold)' : 'var(--primary)');

    return `
      <div class="upgrade-card ${isOwned ? 'applied-card' : ''}" style="${isOwned ? 'opacity: 0.65; background: var(--bg-card);' : ''}">
        <div class="upgrade-icon-wrap" style="background: ${iconBg}; color: ${iconColor};">
          <i class="fa-solid ${item.icon}"></i>
        </div>
        <div class="upgrade-info">
          <div class="upgrade-name-row">
            <span class="upgrade-name">${item.name}</span>
            <span class="upgrade-level-badge" style="${isOwned ? 'background: #e6fcf5; color: #00c48c;' : ''}">${item.badgeText}</span>
          </div>
          <p class="upgrade-desc">${item.desc}</p>
          <p class="upgrade-effect">${item.effectText}</p>
        </div>
        <button class="buy-btn ${isOwned || !canAfford ? 'disabled' : ''}" 
                data-upgrade-id="${item.id}" 
                data-upgrade-type="${item.type}" 
                ${isOwned ? 'disabled' : ''}>
          <span class="buy-btn-label">${isOwned ? '適用済' : '発動'}</span>
          <span class="buy-btn-price">${isOwned ? '済' : formatJapaneseNumber(item.cost, '円')}</span>
        </button>
      </div>
    `;
  }

  renderCampaignList() {
    if (!this.campaignList) return;

    const balance = this.engine.state.balance;

    // 1. 全体倍率キャンペーン
    const campaignItems = (typeof CAMPAIGNS_DATA !== 'undefined' ? CAMPAIGNS_DATA : []).map(c => ({
      id: c.id,
      type: 'campaign',
      name: c.name,
      desc: c.desc,
      multiplier: c.multiplier,
      cost: c.cost,
      icon: c.icon,
      isOwned: Boolean(this.engine.state.campaigns[c.id]),
      badgeText: this.engine.state.campaigns[c.id] ? '適用済' : '全体倍率',
      effectText: `全体生産倍率: ×${c.multiplier}`
    }));

    // 2. 施設特別倍率アップグレード（規定数達成後にアンロック表示）
    const facilityUpgrades = typeof FACILITY_UPGRADES_DATA !== 'undefined' ? FACILITY_UPGRADES_DATA : [];
    const facilityItems = facilityUpgrades.map(u => {
      const isOwned = Boolean(this.engine.state.specialUpgrades && this.engine.state.specialUpgrades[u.id]);
      const currentFacilityCount = this.engine.state.facilities[u.facilityId] || 0;
      // 規定数買った後に表示、または既に購入済みなら表示
      const isUnlocked = isOwned || (currentFacilityCount >= u.requiredCount);

      return {
        id: u.id,
        type: 'facility',
        facilityId: u.facilityId,
        facilityName: u.facilityName,
        requiredCount: u.requiredCount,
        name: u.name,
        desc: u.desc,
        multiplier: u.multiplier,
        cost: u.cost,
        icon: u.icon,
        isOwned: isOwned,
        isUnlocked: isUnlocked,
        badgeText: isOwned ? '適用済' : `${u.facilityName} ×${u.multiplier}`,
        effectText: `【${u.facilityName}】 生産倍率: ×${u.multiplier}`
      };
    }).filter(item => item.isUnlocked); // 規定数未達のものは非表示

    // 全アイテムを結合
    const allItems = [...campaignItems, ...facilityItems];

    // 仕様: 「特別倍率で適用済みのものは未開放のものの下に並べるようにして」
    // 未適用 (isOwned === false) を上、適用済み (isOwned === true) を下に並べる
    const unappliedItems = allItems.filter(item => !item.isOwned);
    const appliedItems = allItems.filter(item => item.isOwned);

    // 未適用内・適用済み内はコスト昇順（安い順）でソート
    unappliedItems.sort((a, b) => a.cost - b.cost);
    appliedItems.sort((a, b) => a.cost - b.cost);

    let html = '';

    if (unappliedItems.length === 0 && appliedItems.length === 0) {
      html = `
        <div style="text-align: center; padding: 40px 0; color: var(--text-secondary); font-size: 0.85rem;">
          <i class="fa-solid fa-sparkles" style="font-size: 2rem; margin-bottom: 8px; opacity: 0.5;"></i>
          <p>施設を10台以上購入すると、特別倍率アップグレードが解放されます！</p>
        </div>
      `;
    } else {
      if (unappliedItems.length > 0) {
        html += `
          <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin: 6px 0 10px 4px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-bolt" style="color: var(--primary);"></i> 利用可能な特別倍率 (${unappliedItems.length}件)
          </div>
        `;
        unappliedItems.forEach(item => {
          const canAfford = balance >= item.cost;
          html += this.buildSpecialUpgradeCardHtml(item, canAfford);
        });
      }

      if (appliedItems.length > 0) {
        html += `
          <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin: 18px 0 10px 4px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-circle-check" style="color: #00c48c;"></i> 適用済みの特別倍率 (${appliedItems.length}件)
          </div>
        `;
        appliedItems.forEach(item => {
          html += this.buildSpecialUpgradeCardHtml(item, false);
        });
      }
    }

    this.campaignList.innerHTML = html;

    // クリックイベント設定
    this.campaignList.querySelectorAll('.buy-btn[data-upgrade-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.upgradeId;
        const type = btn.dataset.upgradeType;

        let success = false;
        if (type === 'campaign') {
          success = this.engine.buyCampaign(id);
        } else if (type === 'facility') {
          success = this.engine.buySpecialUpgrade(id);
        }

        if (success) {
          this.sounds.playUpgrade();
          this.renderAll();
        }
      });
    });
  }

  renderHistory() {
    if (!this.historyList) return;

    const history = this.engine.state.history;
    if (history.length === 0) {
      this.historyList.innerHTML = `
        <div style="text-align: center; padding: 40px 0; color: var(--text-secondary); font-size: 0.85rem;">
          <i class="fa-regular fa-clock" style="font-size: 2rem; margin-bottom: 8px; opacity: 0.5;"></i>
          <p>まだ決済・獲得履歴はありません</p>
        </div>
      `;
      return;
    }

    let html = '';
    history.forEach(item => {
      const isPositive = item.amount > 0;
      const amountStr = item.amount !== 0
        ? `${isPositive ? '+' : ''}${formatJapaneseNumber(item.amount, '円')}`
        : '';

      html += `
        <div class="history-item type-${item.type}">
          <div class="history-left">
            <span class="history-title">${item.title}</span>
            <span class="history-detail">${item.detail}</span>
            <span class="history-time">${item.time}</span>
          </div>
          <div class="history-amount ${isPositive ? 'positive' : 'negative'}">
            ${amountStr}
          </div>
        </div>
      `;
    });

    this.historyList.innerHTML = html;
  }

  renderProfile() {
    const s = this.engine.state;
    if (this.playerNameDisplay) {
      this.playerNameDisplay.textContent = s.playerName || 'ゲスト';
    }
    if (this.statBalance) this.statBalance.textContent = formatJapaneseNumber(s.balance, '円');
    if (this.statTotalEarned) this.statTotalEarned.textContent = formatJapaneseNumber(s.totalEarned, '円');
    if (this.statTotalTaps) this.statTotalTaps.textContent = `${s.totalTaps.toLocaleString('ja-JP')} 回`;
    if (this.statAutoRate) this.statAutoRate.textContent = formatRate(this.engine.getTotalAutoRate());
    if (this.statOfflineEff) this.statOfflineEff.textContent = `${Math.round(this.engine.getOfflineEfficiency() * 100)}% (Lv.${s.offlineLevel})`;
  }

  // --- プレイヤーネーム変更モーダル処理 ---
  openNameChangeModal() {
    if (!this.nameChangeModal) return;
    this.nameChangeModal.classList.add('active');
    if (this.playerNameInput) {
      this.playerNameInput.value = this.engine.state.playerName || 'ゲスト';
      setTimeout(() => {
        this.playerNameInput.focus();
        this.playerNameInput.select();
      }, 50);
    }
  }

  closeNameChangeModal() {
    if (!this.nameChangeModal) return;
    this.nameChangeModal.classList.remove('active');
  }

  savePlayerName() {
    if (!this.playerNameInput) return;
    const newName = this.playerNameInput.value.trim();
    if (!newName) {
      this.showToast('名前を入力してください');
      return;
    }

    if (this.engine.setPlayerName(newName)) {
      this.sounds.playPayment();
      this.renderProfile();
      this.closeNameChangeModal();
      this.showToast(`プレイヤーネームを「${newName}」に変更しました`);
    }
  }

  executeTestSuite() {
    if (!this.testResultsList) return;

    this.sounds.playTap();
    const results = runAllGameTests();
    let allPassed = true;

    let html = '';
    results.forEach(res => {
      if (!res.passed) allPassed = false;
      html += `
        <div class="test-item ${res.passed ? 'passed' : 'failed'}">
          <div>
            <div style="font-weight: 700;">${res.passed ? '✅' : '❌'} ${res.name}</div>
            <div style="font-size: 0.72rem; opacity: 0.8; margin-top: 2px;">${res.details}</div>
          </div>
          <span style="font-weight: 800; color: ${res.passed ? '#00c48c' : '#ef4444'}">${res.passed ? 'PASS' : 'FAIL'}</span>
        </div>
      `;
    });

    this.testResultsList.innerHTML = html;

    if (allPassed) {
      this.sounds.playPayment();
      this.showToast('仕様書テスト全項目が正常にPASSしました！');
    } else {
      this.showToast('テストに不合格の項目があります');
    }
  }

  /**
   * 強化可能金額の到達に応じたボタン色（赤色/グレー）およびナビバッジのリアルタイム自動更新
   */
  updateAffordability() {
    const balance = this.engine.state.balance;
    const multiplier = this.buyMultiplier;
    let hasAnyAffordable = false;

    // 1. 生産設備ボタンの更新（赤色 / グレー & MAX時テキスト更新）
    if (this.facilityList) {
      const isMax = this.buyMultiplier === 'max';
      const facilityButtons = this.facilityList.querySelectorAll('.buy-btn[data-facility-id]');
      facilityButtons.forEach(btn => {
        const id = btn.dataset.facilityId;
        let canAfford = false;

        if (isMax) {
          const maxInfo = this.engine.getMaxAffordableCount(id);
          canAfford = maxInfo.count > 0;
          if (canAfford) hasAnyAffordable = true;

          const labelSpan = btn.querySelector('.buy-btn-label');
          const priceSpan = btn.querySelector('.buy-btn-price');
          if (labelSpan) {
            labelSpan.textContent = maxInfo.count > 0 ? `+${maxInfo.count}台 (MAX)` : '+0台 (MAX)';
          }
          if (priceSpan) {
            priceSpan.textContent = formatJapaneseNumber(maxInfo.cost, '円');
          }
        } else {
          const cost = this.engine.getFacilityCost(id, this.buyMultiplier);
          canAfford = balance >= cost;
          if (canAfford) hasAnyAffordable = true;
        }

        btn.classList.toggle('disabled', !canAfford);
        btn.disabled = !canAfford;
      });
    }

    // 2. タップ強化ボタンの更新
    const buyTapBtn = document.getElementById('buyTapBtn');
    if (buyTapBtn) {
      const tapCost = this.engine.getTapUpgradeCost();
      const canAffordTap = balance >= tapCost;
      if (canAffordTap) hasAnyAffordable = true;

      buyTapBtn.classList.toggle('disabled', !canAffordTap);
      buyTapBtn.disabled = !canAffordTap;
    }

    // 3. オフライン強化ボタンの更新
    const buyOfflineBtn = document.getElementById('buyOfflineBtn');
    if (buyOfflineBtn) {
      const offlineCost = this.engine.getOfflineUpgradeCost();
      const isMax = offlineCost === null;
      if (isMax) {
        buyOfflineBtn.classList.add('disabled');
        buyOfflineBtn.disabled = true;
      } else {
        const canAffordOffline = balance >= offlineCost;
        if (canAffordOffline) hasAnyAffordable = true;

        buyOfflineBtn.classList.toggle('disabled', !canAffordOffline);
        buyOfflineBtn.disabled = !canAffordOffline;
      }
    }

    // 4. 特別倍率ボタンの更新
    if (this.campaignList) {
      const specButtons = this.campaignList.querySelectorAll('.buy-btn[data-upgrade-id], .buy-btn[data-camp-id]');
      specButtons.forEach(btn => {
        const id = btn.dataset.upgradeId || btn.dataset.campId;
        const type = btn.dataset.upgradeType || (btn.dataset.campId ? 'campaign' : 'facility');
        let isOwned = false;
        let cost = 0;

        if (type === 'campaign') {
          isOwned = Boolean(this.engine.state.campaigns && this.engine.state.campaigns[id]);
          const campaign = (typeof CAMPAIGNS_DATA !== 'undefined' ? CAMPAIGNS_DATA : []).find(c => c.id === id);
          if (campaign) cost = campaign.cost;
        } else if (type === 'facility') {
          isOwned = Boolean(this.engine.state.specialUpgrades && this.engine.state.specialUpgrades[id]);
          const facilityUpgrades = typeof FACILITY_UPGRADES_DATA !== 'undefined' ? FACILITY_UPGRADES_DATA : [];
          const up = facilityUpgrades.find(u => u.id === id);
          if (up) cost = up.cost;
        }

        if (isOwned) {
          btn.classList.add('disabled');
          btn.disabled = true;
        } else {
          const canAfford = balance >= cost;
          if (canAfford) hasAnyAffordable = true;

          btn.classList.toggle('disabled', !canAfford);
          btn.disabled = !canAfford;
        }
      });
    }

    // 5. ボトムナビの「強化」タブにあるバッジ更新
    if (this.upgradeNavBadge) {
      this.upgradeNavBadge.style.display = hasAnyAffordable ? 'block' : 'none';
    }
  }

  renderAll() {
    this.renderHeaderAndCards();
    this.renderEarnStats();
    this.renderUpgrades();
    this.renderProfile();
    this.updateAffordability();
  }

  showToast(message) {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    this.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }
}
