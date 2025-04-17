/**
 * CitySim - ClickerController クラス
 * クリッカーゲームモードの制御を担当
 */

import { GameConfig, GameText } from '../config/GameConfig.js';
import { EventEmitter } from '../services/EventEmitter.js';

export class ClickerController {
    /**
     * クリッカーコントローラーの初期化
     * @param {City} city - 都市モデル
     * @param {UIController} uiController - UIコントローラー
     */
    constructor(city, uiController) {
        this.city = city;
        this.uiController = uiController;
        this.events = new EventEmitter();
        
        // クリッカーステータス
        this.state = {
            totalClicks: 0,
            totalFunds: 0,
            clickValue: GameConfig.CLICKER.BASE_CLICK_VALUE,
            autoFunds: 0,
            clickMultiplier: 1,
            autoFundsMultiplier: 1,
            allMultiplier: 1,
            upgrades: {},
            buildings: {},
            achievements: {},
            unlocked: {
                COIN_MINT: false,
                BANK: false,
                INVESTMENT_FIRM: false
            }
        };
        
        // 初期化済みかどうか
        this.initialized = false;
        
        // クリッカーUI要素
        this.clickerElement = null;
        this.clickerTarget = null;
        this.clickerStats = null;
        this.buildingsContainer = null;
        this.upgradesContainer = null;
        this.achievementsContainer = null;
        
        // 自動収入タイマー
        this.autoIncomeTimer = null;
        
        // クリッカーデータを都市モデルに関連付け
        if (!this.city.clickerData) {
            this.city.clickerData = this.state;
        } else {
            this.state = this.city.clickerData;
        }
    }
    
    /**
     * クリッカーUIを初期化する
     * @private
     */
    _initialize() {
        if (this.initialized) return;
        
        // クリッカーUIを作成
        this._createClickerUI();
        
        // イベントリスナーを設定
        this._setupEventListeners();
        
        // 自動収入タイマーを開始
        this._startAutoIncome();
        
        this.initialized = true;
        
        // 初期化完了イベントを発火
        this.events.emit('clickerInitialized', {
            state: { ...this.state }
        });
    }
    
    /**
     * クリッカーUIを作成する
     * @private
     */
    _createClickerUI() {
        // 既存のクリッカー要素を削除
        const existingClicker = document.getElementById('clicker-container');
        if (existingClicker) {
            existingClicker.remove();
        }
        
        // クリッカーコンテナを作成
        this.clickerElement = document.createElement('div');
        this.clickerElement.id = 'clicker-container';
        this.clickerElement.className = 'clicker-container hidden';
        
        // クリッカーUI構造を作成
        this.clickerElement.innerHTML = `
            <div class="clicker-header">
                <h2><i class="fas fa-coins"></i> ${GameText.CLICKER.TITLE}</h2>
                <p>${GameText.CLICKER.DESCRIPTION}</p>
                <button id="clicker-exit" class="clicker-exit-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="clicker-content">
                <div class="clicker-main">
                    <div class="clicker-target-container">
                        <div id="clicker-target" class="clicker-target">
                            <i class="fas fa-city"></i>
                        </div>
                    </div>
                    
                    <div id="clicker-stats" class="clicker-stats">
                        <div class="clicker-stat">
                            <i class="fas fa-hand-pointer"></i>
                            <span id="click-value">${GameText.CLICKER.CLICK_VALUE.replace('{value}', this.state.clickValue)}</span>
                        </div>
                        <div class="clicker-stat">
                            <i class="fas fa-hourglass-half"></i>
                            <span id="auto-income">${GameText.CLICKER.AUTO_INCOME.replace('{value}', this.state.autoFunds)}</span>
                        </div>
                        <div class="clicker-stat">
                            <i class="fas fa-coins"></i>
                            <span id="total-earned">${GameText.CLICKER.TOTAL_EARNED.replace('{value}', this.state.totalFunds)}</span>
                        </div>
                        <div class="clicker-stat">
                            <i class="fas fa-mouse-pointer"></i>
                            <span id="total-clicks">${GameText.CLICKER.TOTAL_CLICKS.replace('{value}', this.state.totalClicks)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="clicker-sections">
                    <div class="clicker-section">
                        <h3><i class="fas fa-building"></i> 建物</h3>
                        <div id="clicker-buildings" class="clicker-buildings"></div>
                    </div>
                    
                    <div class="clicker-section">
                        <h3><i class="fas fa-arrow-up"></i> アップグレード</h3>
                        <div id="clicker-upgrades" class="clicker-upgrades"></div>
                    </div>
                    
                    <div class="clicker-section">
                        <h3><i class="fas fa-trophy"></i> 実績</h3>
                        <div id="clicker-achievements" class="clicker-achievements"></div>
                    </div>
                </div>
            </div>
        `;
        
        // DOMに追加
        document.body.appendChild(this.clickerElement);
        
        // UIの参照を保存
        this.clickerTarget = document.getElementById('clicker-target');
        this.clickerStats = document.getElementById('clicker-stats');
        this.buildingsContainer = document.getElementById('clicker-buildings');
        this.upgradesContainer = document.getElementById('clicker-upgrades');
        this.achievementsContainer = document.getElementById('clicker-achievements');
        
        // 建物・アップグレード・実績を表示
        this._renderBuildings();
        this._renderUpgrades();
        this._renderAchievements();
        this._updateStats();
    }
    
    /**
     * イベントリスナーを設定する
     * @private
     */
    _setupEventListeners() {
        // クリックターゲットのイベントリスナー
        if (this.clickerTarget) {
            this.clickerTarget.addEventListener('click', () => {
                this._handleClick();
            });
            
            // クリック時のアニメーション
            this.clickerTarget.addEventListener('mousedown', () => {
                this.clickerTarget.classList.add('clicked');
            });
            
            this.clickerTarget.addEventListener('mouseup', () => {
                this.clickerTarget.classList.remove('clicked');
            });
            
            this.clickerTarget.addEventListener('mouseleave', () => {
                this.clickerTarget.classList.remove('clicked');
            });
        }
        
        // 閉じるボタンのイベントリスナー
        const exitButton = document.getElementById('clicker-exit');
        if (exitButton) {
            exitButton.addEventListener('click', () => {
                this.hide();
                // 都市管理モードに切り替えイベントを発火
                this.events.emit('exitClicker', {
                    state: { ...this.state }
                });
            });
        }
    }
    
    /**
     * クリックを処理する
     * @private
     */
    _handleClick() {
        // クリック数を更新
        this.state.totalClicks++;
        
        // 獲得資金を計算
        const clickEffect = this.state.clickValue * this.state.clickMultiplier * this.state.allMultiplier;
        const fundsGained = Math.floor(clickEffect);
        
        // 資金を加算
        this.city.funds += fundsGained;
        this.state.totalFunds += fundsGained;
        
        // 建物アンロックをチェック
        this._checkBuildingUnlocks();
        
        // 実績をチェック
        this._checkAchievements();
        
        // UIを更新
        this._updateStats();
        
        // クリックイベントを発火
        this.events.emit('click', {
            totalClicks: this.state.totalClicks,
            fundsGained,
            totalFunds: this.state.totalFunds
        });
        
        // クリックエフェクトを表示
        this._showClickEffect(fundsGained);
    }
    
    /**
     * クリックエフェクトを表示する
     * @param {number} amount - 獲得した資金
     * @private
     */
    _showClickEffect(amount) {
        if (!this.clickerTarget) return;
        
        // エフェクト要素を作成
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.textContent = `+¥${amount}`;
        
        // ランダムな位置（クリッカーターゲット内）
        const targetRect = this.clickerTarget.getBoundingClientRect();
        const x = Math.random() * (targetRect.width - 40);
        const y = Math.random() * (targetRect.height - 20);
        
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        
        // 要素を追加
        this.clickerTarget.appendChild(effect);
        
        // アニメーション終了後に要素を削除
        setTimeout(() => {
            effect.remove();
        }, 1500);
    }
    
    /**
     * 自動収入処理を開始する
     * @private
     */
    _startAutoIncome() {
        // 既存のタイマーをクリア
        if (this.autoIncomeTimer) {
            clearInterval(this.autoIncomeTimer);
        }
        
        // 自動収入タイマーを設定
        this.autoIncomeTimer = setInterval(() => {
            if (this.state.autoFunds > 0) {
                // 自動収入を計算
                const autoIncome = Math.floor(
                    this.state.autoFunds * this.state.autoFundsMultiplier * this.state.allMultiplier
                );
                
                // 資金を加算
                this.city.funds += autoIncome;
                this.state.totalFunds += autoIncome;
                
                // 建物アンロックをチェック
                this._checkBuildingUnlocks();
                
                // 実績をチェック
                this._checkAchievements();
                
                // UIを更新
                this._updateStats();
                
                // 自動収入イベントを発火
                this.events.emit('autoIncome', {
                    autoIncome,
                    totalFunds: this.state.totalFunds
                });
            }
        }, GameConfig.CLICKER.AUTO_FUNDS_INTERVAL);
    }
    
    /**
     * 建物のアンロック状態をチェックする
     * @private
     */
    _checkBuildingUnlocks() {
        // コイン工場のアンロック
        if (!this.state.unlocked.COIN_MINT && this.state.totalFunds >= GameConfig.CLICKER.UNLOCK_THRESHOLDS.COIN_MINT) {
            this.state.unlocked.COIN_MINT = true;
            this._renderBuildings();
            
            // アンロックイベントを発火
            this.events.emit('buildingUnlocked', {
                building: 'COIN_MINT',
                totalFunds: this.state.totalFunds
            });
            
            // 通知を表示
            this.uiController.addEventToLog({
                title: '新しい建物がアンロック',
                message: GameText.CLICKER.UNLOCK_MESSAGE.replace('{building}', GameConfig.BUILDINGS.COIN_MINT.name),
                type: 'event-success',
                icon: 'unlock'
            });
        }
        
        // 銀行のアンロック
        if (!this.state.unlocked.BANK && this.state.totalFunds >= GameConfig.CLICKER.UNLOCK_THRESHOLDS.BANK) {
            this.state.unlocked.BANK = true;
            this._renderBuildings();
            
            // アンロックイベントを発火
            this.events.emit('buildingUnlocked', {
                building: 'BANK',
                totalFunds: this.state.totalFunds
            });
            
            // 通知を表示
            this.uiController.addEventToLog({
                title: '新しい建物がアンロック',
                message: GameText.CLICKER.UNLOCK_MESSAGE.replace('{building}', GameConfig.BUILDINGS.BANK.name),
                type: 'event-success',
                icon: 'unlock'
            });
        }
        
        // 投資会社のアンロック
        if (!this.state.unlocked.INVESTMENT_FIRM && this.state.totalFunds >= GameConfig.CLICKER.UNLOCK_THRESHOLDS.INVESTMENT_FIRM) {
            this.state.unlocked.INVESTMENT_FIRM = true;
            this._renderBuildings();
            
            // アンロックイベントを発火
            this.events.emit('buildingUnlocked', {
                building: 'INVESTMENT_FIRM',
                totalFunds: this.state.totalFunds
            });
            
            // 通知を表示
            this.uiController.addEventToLog({
                title: '新しい建物がアンロック',
                message: GameText.CLICKER.UNLOCK_MESSAGE.replace('{building}', GameConfig.BUILDINGS.INVESTMENT_FIRM.name),
                type: 'event-success',
                icon: 'unlock'
            });
        }
    }
    
    /**
     * 実績達成状況をチェックする
     * @private
     */
    _checkAchievements() {
        // 最初の一歩
        if (!this.state.achievements.FIRST_STEPS && this.state.totalClicks >= GameConfig.CLICKER.ACHIEVEMENTS.FIRST_STEPS.requirement.totalClicks) {
            this.state.achievements.FIRST_STEPS = true;
            
            // ボーナスを適用
            this.state.clickMultiplier += GameConfig.CLICKER.ACHIEVEMENTS.FIRST_STEPS.bonus.clickMultiplier;
            
            this._renderAchievements();
            
            // 実績解除イベントを発火
            this.events.emit('achievementUnlocked', {
                achievement: 'FIRST_STEPS',
                bonus: GameConfig.CLICKER.ACHIEVEMENTS.FIRST_STEPS.bonus
            });
            
            // 通知を表示
            this.uiController.addEventToLog({
                title: '実績解除',
                message: GameText.CLICKER.ACHIEVEMENT_UNLOCKED.replace(
                    '{name}', 
                    GameConfig.CLICKER.ACHIEVEMENTS.FIRST_STEPS.name
                ),
                type: 'event-success',
                icon: 'trophy'
            });
        }
        
        // 献身的な市長
        if (!this.state.achievements.DEDICATED_MAYOR && this.state.totalClicks >= GameConfig.CLICKER.ACHIEVEMENTS.DEDICATED_MAYOR.requirement.totalClicks) {
            this.state.achievements.DEDICATED_MAYOR = true;
            
            // ボーナスを適用
            this.state.clickMultiplier += GameConfig.CLICKER.ACHIEVEMENTS.DEDICATED_MAYOR.bonus.clickMultiplier;
            
            this._renderAchievements();
            
            // 実績解除イベントを発火
            this.events.emit('achievementUnlocked', {
                achievement: 'DEDICATED_MAYOR',
                bonus: GameConfig.CLICKER.ACHIEVEMENTS.DEDICATED_MAYOR.bonus
            });
            
            // 通知を表示
            this.uiController.addEventToLog({
                title: '実績解除',
                message: GameText.CLICKER.ACHIEVEMENT_UNLOCKED.replace(
                    '{name}', 
                    GameConfig.CLICKER.ACHIEVEMENTS.DEDICATED_MAYOR.name
                ),
                type: 'event-success',
                icon: 'trophy'
            });
        }
        
        // 財政の天才
        if (!this.state.achievements.FINANCIAL_GENIUS && this.state.totalFunds >= GameConfig.CLICKER.ACHIEVEMENTS.FINANCIAL_GENIUS.requirement.totalFunds) {
            this.state.achievements.FINANCIAL_GENIUS = true;
            
            // ボーナスを適用
            this.state.allMultiplier += GameConfig.CLICKER.ACHIEVEMENTS.FINANCIAL_GENIUS.bonus.fundMultiplier;
            
            this._renderAchievements();
            
            // 実績解除イベントを発火
            this.events.emit('achievementUnlocked', {
                achievement: 'FINANCIAL_GENIUS',
                bonus: GameConfig.CLICKER.ACHIEVEMENTS.FINANCIAL_GENIUS.bonus
            });
            
            // 通知を表示
            this.uiController.addEventToLog({
                title: '実績解除',
                message: GameText.CLICKER.ACHIEVEMENT_UNLOCKED.replace(
                    '{name}', 
                    GameConfig.CLICKER.ACHIEVEMENTS.FINANCIAL_GENIUS.name
                ),
                type: 'event-success',
                icon: 'trophy'
            });
        }
    }
    
    /**
     * 建物を購入する
     * @param {string} buildingType - 建物タイプ
     * @private
     */
    _buyBuilding(buildingType) {
        const building = GameConfig.BUILDINGS[buildingType];
        if (!building) return;
        
        // 資金チェック
        if (this.city.funds < building.cost) {
            this.uiController.addEventToLog({
                title: '建物購入失敗',
                message: `資金が足りません。必要資金: ¥${building.cost.toLocaleString()} | 現在の資金: ¥${this.city.funds.toLocaleString()}`,
                type: 'event-danger',
                icon: 'exclamation-circle'
            });
            return;
        }
        
        // 資金を消費
        this.city.funds -= building.cost;
        
        // 建物を追加
        if (!this.state.buildings[buildingType]) {
            this.state.buildings[buildingType] = 0;
        }
        this.state.buildings[buildingType]++;
        
        // 効果を適用
        if (building.effects.clickMultiplier) {
            this.state.clickMultiplier += building.effects.clickMultiplier;
        }
        
        if (building.effects.autoFunds) {
            this.state.autoFunds += building.effects.autoFunds;
        }
        
        // UIを更新
        this._renderBuildings();
        this._updateStats();
        
        // 購入イベントを発火
        this.events.emit('buildingPurchased', {
            type: buildingType,
            cost: building.cost,
            count: this.state.buildings[buildingType]
        });
        
        // 通知を表示
        this.uiController.addEventToLog({
            title: '建物購入',
            message: `${building.name}を購入しました。残りの資金: ¥${this.city.funds.toLocaleString()}`,
            type: 'event-success',
            icon: building.icon
        });
    }
    
    /**
     * アップグレードを購入する
     * @param {string} upgradeId - アップグレードID
     * @private
     */
    _buyUpgrade(upgradeId) {
        const upgrade = GameConfig.CLICKER.UPGRADES[upgradeId];
        if (!upgrade) return;
        
        // 既に購入済みかチェック
        if (this.state.upgrades[upgradeId]) {
            return;
        }
        
        // 資金チェック
        if (this.city.funds < upgrade.cost) {
            this.uiController.addEventToLog({
                title: 'アップグレード購入失敗',
                message: `資金が足りません。必要資金: ¥${upgrade.cost.toLocaleString()} | 現在の資金: ¥${this.city.funds.toLocaleString()}`,
                type: 'event-danger',
                icon: 'exclamation-circle'
            });
            return;
        }
        
        // 資金を消費
        this.city.funds -= upgrade.cost;
        
        // アップグレードを購入
        this.state.upgrades[upgradeId] = true;
        
        // 効果を適用
        if (upgrade.effect.clickMultiplier) {
            this.state.clickMultiplier += upgrade.effect.clickMultiplier;
        }
        
        if (upgrade.effect.autoFundsMultiplier) {
            this.state.autoFundsMultiplier += upgrade.effect.autoFundsMultiplier;
        }
        
        if (upgrade.effect.allMultiplier) {
            this.state.allMultiplier += upgrade.effect.allMultiplier;
        }
        
        // UIを更新
        this._renderUpgrades();
        this._updateStats();
        
        // 購入イベントを発火
        this.events.emit('upgradePurchased', {
            id: upgradeId,
            cost: upgrade.cost,
            effect: upgrade.effect
        });
        
        // 通知を表示
        this.uiController.addEventToLog({
            title: 'アップグレード購入',
            message: `${upgrade.name}を購入しました。残りの資金: ¥${this.city.funds.toLocaleString()}`,
            type: 'event-success',
            icon: 'arrow-up'
        });
    }
    
    /**
     * クリッカー統計を更新する
     * @private
     */
    _updateStats() {
        if (!this.clickerStats) return;
        
        // クリック価値を更新
        const clickValueEl = document.getElementById('click-value');
        if (clickValueEl) {
            const effectiveClickValue = this.state.clickValue * this.state.clickMultiplier * this.state.allMultiplier;
            clickValueEl.textContent = GameText.CLICKER.CLICK_VALUE.replace('{value}', Math.floor(effectiveClickValue));
        }
        
        // 自動収入を更新
        const autoIncomeEl = document.getElementById('auto-income');
        if (autoIncomeEl) {
            const effectiveAutoIncome = this.state.autoFunds * this.state.autoFundsMultiplier * this.state.allMultiplier;
            autoIncomeEl.textContent = GameText.CLICKER.AUTO_INCOME.replace('{value}', Math.floor(effectiveAutoIncome));
        }
        
        // 合計獲得資金を更新
        const totalEarnedEl = document.getElementById('total-earned');
        if (totalEarnedEl) {
            totalEarnedEl.textContent = GameText.CLICKER.TOTAL_EARNED.replace('{value}', this.state.totalFunds.toLocaleString());
        }
        
        // 合計クリック数を更新
        const totalClicksEl = document.getElementById('total-clicks');
        if (totalClicksEl) {
            totalClicksEl.textContent = GameText.CLICKER.TOTAL_CLICKS.replace('{value}', this.state.totalClicks.toLocaleString());
        }
        
        // UIコントローラーの統計表示も更新
        if (this.uiController) {
            this.uiController.updateAllStatDisplays();
        }
    }
    
    /**
     * 建物リストを描画する
     * @private
     */
    _renderBuildings() {
        if (!this.buildingsContainer) return;
        
        this.buildingsContainer.innerHTML = '';
        
        // コイン工場
        if (this.state.unlocked.COIN_MINT) {
            const coinMint = GameConfig.BUILDINGS.COIN_MINT;
            const count = this.state.buildings.COIN_MINT || 0;
            
            const buildingEl = document.createElement('div');
            buildingEl.className = 'clicker-item';
            buildingEl.innerHTML = `
                <div class="clicker-item-icon"><i class="fas fa-${coinMint.icon}"></i></div>
                <div class="clicker-item-info">
                    <div class="clicker-item-name">${coinMint.name} <span class="clicker-item-count">(${count})</span></div>
                    <div class="clicker-item-desc">${coinMint.description}</div>
                    <div class="clicker-item-effect">
                        <span>クリック +${(coinMint.effects.clickMultiplier * 100)}%</span>
                        <span>自動収入 +¥${coinMint.effects.autoFunds}/秒</span>
                    </div>
                </div>
                <button class="clicker-item-btn" data-building="COIN_MINT">
                    <span>購入</span>
                    <span class="clicker-item-cost">¥${coinMint.cost}</span>
                </button>
            `;
            
            this.buildingsContainer.appendChild(buildingEl);
        }
        
        // 銀行
        if (this.state.unlocked.BANK) {
            const bank = GameConfig.BUILDINGS.BANK;
            const count = this.state.buildings.BANK || 0;
            
            const buildingEl = document.createElement('div');
            buildingEl.className = 'clicker-item';
            buildingEl.innerHTML = `
                <div class="clicker-item-icon"><i class="fas fa-${bank.icon}"></i></div>
                <div class="clicker-item-info">
                    <div class="clicker-item-name">${bank.name} <span class="clicker-item-count">(${count})</span></div>
                    <div class="clicker-item-desc">${bank.description}</div>
                    <div class="clicker-item-effect">
                        <span>自動収入 +¥${bank.effects.autoFunds}/秒</span>
                        <span>資金保管 +¥${bank.effects.fundStorage}</span>
                    </div>
                </div>
                <button class="clicker-item-btn" data-building="BANK">
                    <span>購入</span>
                    <span class="clicker-item-cost">¥${bank.cost}</span>
                </button>
            `;
            
            this.buildingsContainer.appendChild(buildingEl);
        }
        
        // 投資会社
        if (this.state.unlocked.INVESTMENT_FIRM) {
            const investmentFirm = GameConfig.BUILDINGS.INVESTMENT_FIRM;
            const count = this.state.buildings.INVESTMENT_FIRM || 0;
            
            const buildingEl = document.createElement('div');
            buildingEl.className = 'clicker-item';
            buildingEl.innerHTML = `
                <div class="clicker-item-icon"><i class="fas fa-${investmentFirm.icon}"></i></div>
                <div class="clicker-item-info">
                    <div class="clicker-item-name">${investmentFirm.name} <span class="clicker-item-count">(${count})</span></div>
                    <div class="clicker-item-desc">${investmentFirm.description}</div>
                    <div class="clicker-item-effect">
                        <span>全収入 +${(investmentFirm.effects.fundMultiplier * 100)}%</span>
                        <span>自動収入 +¥${investmentFirm.effects.autoFunds}/秒</span>
                    </div>
                </div>
                <button class="clicker-item-btn" data-building="INVESTMENT_FIRM">
                    <span>購入</span>
                    <span class="clicker-item-cost">¥${investmentFirm.cost}</span>
                </button>
            `;
            
            this.buildingsContainer.appendChild(buildingEl);
        }
        
        // アンロックされた建物がない場合
        if (this.buildingsContainer.children.length === 0) {
            this.buildingsContainer.innerHTML = `
                <div class="clicker-empty">
                    <p>まだ建物はアンロックされていません。</p>
                    <p>資金を稼いで新しい建物をアンロックしましょう！</p>
                </div>
            `;
        }
        
        // 建物購入ボタンのイベントリスナーを設定
        const buildingButtons = this.buildingsContainer.querySelectorAll('.clicker-item-btn');
        buildingButtons.forEach(button => {
            button.addEventListener('click', () => {
                const buildingType = button.getAttribute('data-building');
                this._buyBuilding(buildingType);
            });
        });
    }
    
    /**
     * アップグレードリストを描画する
     * @private
     */
    _renderUpgrades() {
        if (!this.upgradesContainer) return;
        
        this.upgradesContainer.innerHTML = '';
        
        // 改良ツール
        const betterToolsId = 'BETTER_TOOLS';
        const betterTools = GameConfig.CLICKER.UPGRADES.BETTER_TOOLS;
        const betterToolsPurchased = this.state.upgrades[betterToolsId];
        
        const betterToolsEl = document.createElement('div');
        betterToolsEl.className = `clicker-item ${betterToolsPurchased ? 'purchased' : ''}`;
        betterToolsEl.innerHTML = `
            <div class="clicker-item-icon"><i class="fas fa-tools"></i></div>
            <div class="clicker-item-info">
                <div class="clicker-item-name">${betterTools.name} ${betterToolsPurchased ? '<span class="purchased-tag">購入済み</span>' : ''}</div>
                <div class="clicker-item-desc">${betterTools.description}</div>
                <div class="clicker-item-effect">
                    <span>クリック価値 +${(betterTools.effect.clickMultiplier * 100)}%</span>
                </div>
            </div>
            ${betterToolsPurchased ? '' : `
                <button class="clicker-item-btn" data-upgrade="${betterToolsId}">
                    <span>購入</span>
                    <span class="clicker-item-cost">¥${betterTools.cost}</span>
                </button>
            `}
        `;
        
        this.upgradesContainer.appendChild(betterToolsEl);
        
        // 効率的な工程
        const efficientProcessId = 'EFFICIENT_PROCESS';
        const efficientProcess = GameConfig.CLICKER.UPGRADES.EFFICIENT_PROCESS;
        const efficientProcessPurchased = this.state.upgrades[efficientProcessId];
        
        const efficientProcessEl = document.createElement('div');
        efficientProcessEl.className = `clicker-item ${efficientProcessPurchased ? 'purchased' : ''}`;
        efficientProcessEl.innerHTML = `
            <div class="clicker-item-icon"><i class="fas fa-cogs"></i></div>
            <div class="clicker-item-info">
                <div class="clicker-item-name">${efficientProcess.name} ${efficientProcessPurchased ? '<span class="purchased-tag">購入済み</span>' : ''}</div>
                <div class="clicker-item-desc">${efficientProcess.description}</div>
                <div class="clicker-item-effect">
                    <span>自動収入 +${(efficientProcess.effect.autoFundsMultiplier * 100)}%</span>
                </div>
            </div>
            ${efficientProcessPurchased ? '' : `
                <button class="clicker-item-btn" data-upgrade="${efficientProcessId}">
                    <span>購入</span>
                    <span class="clicker-item-cost">¥${efficientProcess.cost}</span>
                </button>
            `}
        `;
        
        this.upgradesContainer.appendChild(efficientProcessEl);
        
        // 先進経済
        const advancedEconomyId = 'ADVANCED_ECONOMY';
        const advancedEconomy = GameConfig.CLICKER.UPGRADES.ADVANCED_ECONOMY;
        const advancedEconomyPurchased = this.state.upgrades[advancedEconomyId];
        
        const advancedEconomyEl = document.createElement('div');
        advancedEconomyEl.className = `clicker-item ${advancedEconomyPurchased ? 'purchased' : ''}`;
        advancedEconomyEl.innerHTML = `
            <div class="clicker-item-icon"><i class="fas fa-chart-line"></i></div>
            <div class="clicker-item-info">
                <div class="clicker-item-name">${advancedEconomy.name} ${advancedEconomyPurchased ? '<span class="purchased-tag">購入済み</span>' : ''}</div>
                <div class="clicker-item-desc">${advancedEconomy.description}</div>
                <div class="clicker-item-effect">
                    <span>全収入 +${(advancedEconomy.effect.allMultiplier * 100)}%</span>
                </div>
            </div>
            ${advancedEconomyPurchased ? '' : `
                <button class="clicker-item-btn" data-upgrade="${advancedEconomyId}">
                    <span>購入</span>
                    <span class="clicker-item-cost">¥${advancedEconomy.cost}</span>
                </button>
            `}
        `;
        
        this.upgradesContainer.appendChild(advancedEconomyEl);
        
        // アップグレード購入ボタンのイベントリスナーを設定
        const upgradeButtons = this.upgradesContainer.querySelectorAll('.clicker-item-btn');
        upgradeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const upgradeId = button.getAttribute('data-upgrade');
                this._buyUpgrade(upgradeId);
            });
        });
    }
    
    /**
     * 実績リストを描画する
     * @private
     */
    _renderAchievements() {
        if (!this.achievementsContainer) return;
        
        this.achievementsContainer.innerHTML = '';
        
        // 最初の一歩
        const firstStepsId = 'FIRST_STEPS';
        const firstSteps = GameConfig.CLICKER.ACHIEVEMENTS.FIRST_STEPS;
        const firstStepsUnlocked = this.state.achievements[firstStepsId];
        
        const firstStepsEl = document.createElement('div');
        firstStepsEl.className = `clicker-item ${firstStepsUnlocked ? 'unlocked' : ''}`;
        firstStepsEl.innerHTML = `
            <div class="clicker-item-icon"><i class="fas fa-baby"></i></div>
            <div class="clicker-item-info">
                <div class="clicker-item-name">${firstSteps.name} ${firstStepsUnlocked ? '<span class="unlocked-tag">達成済み</span>' : ''}</div>
                <div class="clicker-item-desc">${firstSteps.description}</div>
                <div class="clicker-item-effect">
                    <span>クリック価値 +${(firstSteps.bonus.clickMultiplier * 100)}%</span>
                </div>
                <div class="clicker-item-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(100, (this.state.totalClicks / firstSteps.requirement.totalClicks) * 100)}%"></div>
                    </div>
                    <span>${this.state.totalClicks} / ${firstSteps.requirement.totalClicks}</span>
                </div>
            </div>
        `;
        
        this.achievementsContainer.appendChild(firstStepsEl);
        
        // 献身的な市長
        const dedicatedMayorId = 'DEDICATED_MAYOR';
        const dedicatedMayor = GameConfig.CLICKER.ACHIEVEMENTS.DEDICATED_MAYOR;
        const dedicatedMayorUnlocked = this.state.achievements[dedicatedMayorId];
        
        const dedicatedMayorEl = document.createElement('div');
        dedicatedMayorEl.className = `clicker-item ${dedicatedMayorUnlocked ? 'unlocked' : ''}`;
        dedicatedMayorEl.innerHTML = `
            <div class="clicker-item-icon"><i class="fas fa-user-tie"></i></div>
            <div class="clicker-item-info">
                <div class="clicker-item-name">${dedicatedMayor.name} ${dedicatedMayorUnlocked ? '<span class="unlocked-tag">達成済み</span>' : ''}</div>
                <div class="clicker-item-desc">${dedicatedMayor.description}</div>
                <div class="clicker-item-effect">
                    <span>クリック価値 +${(dedicatedMayor.bonus.clickMultiplier * 100)}%</span>
                </div>
                <div class="clicker-item-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(100, (this.state.totalClicks / dedicatedMayor.requirement.totalClicks) * 100)}%"></div>
                    </div>
                    <span>${this.state.totalClicks} / ${dedicatedMayor.requirement.totalClicks}</span>
                </div>
            </div>
        `;
        
        this.achievementsContainer.appendChild(dedicatedMayorEl);
        
        // 財政の天才
        const financialGeniusId = 'FINANCIAL_GENIUS';
        const financialGenius = GameConfig.CLICKER.ACHIEVEMENTS.FINANCIAL_GENIUS;
        const financialGeniusUnlocked = this.state.achievements[financialGeniusId];
        
        const financialGeniusEl = document.createElement('div');
        financialGeniusEl.className = `clicker-item ${financialGeniusUnlocked ? 'unlocked' : ''}`;
        financialGeniusEl.innerHTML = `
            <div class="clicker-item-icon"><i class="fas fa-donate"></i></div>
            <div class="clicker-item-info">
                <div class="clicker-item-name">${financialGenius.name} ${financialGeniusUnlocked ? '<span class="unlocked-tag">達成済み</span>' : ''}</div>
                <div class="clicker-item-desc">${financialGenius.description}</div>
                <div class="clicker-item-effect">
                    <span>全収入 +${(financialGenius.bonus.fundMultiplier * 100)}%</span>
                </div>
                <div class="clicker-item-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(100, (this.state.totalFunds / financialGenius.requirement.totalFunds) * 100)}%"></div>
                    </div>
                    <span>¥${this.state.totalFunds.toLocaleString()} / ¥${financialGenius.requirement.totalFunds.toLocaleString()}</span>
                </div>
            </div>
        `;
        
        this.achievementsContainer.appendChild(financialGeniusEl);
    }
    
    /**
     * クリッカーUIを表示する
     */
    show() {
        // 初期化
        if (!this.initialized) {
            this._initialize();
        }
        
        // UIを表示
        if (this.clickerElement) {
            this.clickerElement.classList.remove('hidden');
        }
        
        // 表示イベントを発火
        this.events.emit('shown', {
            state: { ...this.state }
        });
    }
    
    /**
     * クリッカーUIを非表示にする
     */
    hide() {
        if (this.clickerElement) {
            this.clickerElement.classList.add('hidden');
        }
        
        // 非表示イベントを発火
        this.events.emit('hidden', {
            state: { ...this.state }
        });
    }
    
    /**
     * 状態を保存する
     * @param {SaveManager} saveManager - セーブマネージャー
     */
    saveState(saveManager) {
        if (!saveManager) return;
        
        // 都市モデルにクリッカーデータを関連付け
        this.city.clickerData = { ...this.state };
    }
    
    /**
     * 状態を読み込む
     * @param {SaveManager} saveManager - セーブマネージャー
     */
    loadState(saveManager) {
        if (!saveManager) return;
        
        // 都市モデルからクリッカーデータを取得
        if (this.city.clickerData) {
            this.state = { ...this.city.clickerData };
        }
        
        // UIを更新
        if (this.initialized) {
            this._renderBuildings();
            this._renderUpgrades();
            this._renderAchievements();
            this._updateStats();
        }
    }
}