/**
 * CitySim - ClickerController クラス
 * クリッカーゲームモードの制御を担当
 */

import { GameConfig } from '../config/GameConfig.js';
import { ClickerConfig, ClickerText } from '../config/ClickerConfig.js';
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
            clickValue: ClickerConfig.BASE_CLICK_VALUE,
            autoFunds: 0,
            clickMultiplier: 1,
            autoFundsMultiplier: 1,
            allMultiplier: 1,
            autoClick: 0,
            upgrades: {},
            buildings: {},
            achievements: {},
            specialAbilities: {},
            activeEffects: {},
            unlocked: {
                COIN_MINT: false,
                BANK: false,
                INVESTMENT_FIRM: false,
                TECH_STARTUP: false,
                TRADING_CENTER: false
            },
            stats: {
                clicksThisSession: 0,
                fundsThisSession: 0,
                buildingsPurchased: 0,
                upgradesPurchased: 0,
                achievementsUnlocked: 0,
                abilitiesUsed: 0,
                sessionStartTime: Date.now()
            }
        };
        
        // 初期化済みかどうか
        this.initialized = false;
        
        // クリッカーUI要素
        this.clickerElement = null;
        this.clickerTarget = null;
        this.clickerStats = null;
        this.tabContainers = {
            stats: null,
            buildings: null,
            upgrades: null,
            achievements: null,
            abilities: null
        };
        
        // アニメーションフレーム
        this.animationFrameId = null;
        
        // タイマー
        this.timers = {
            autoIncome: null,
            autoClick: null,
            specialAbilities: {},
            particleClear: null
        };
        
        // パーティクル配列
        this.particles = [];
        
        // 現在のタブ
        this.currentTab = 'buildings';
        
        // クリッカーデータを都市モデルに関連付け
        if (!this.city.clickerData) {
            this.city.clickerData = this.state;
        } else {
            this.state = this.city.clickerData;
            
            // 新しいフィールドの初期化（既存セーブデータとの互換性確保）
            if (!this.state.unlocked.TECH_STARTUP) this.state.unlocked.TECH_STARTUP = false;
            if (!this.state.unlocked.TRADING_CENTER) this.state.unlocked.TRADING_CENTER = false;
            if (!this.state.autoClick) this.state.autoClick = 0;
            if (!this.state.specialAbilities) this.state.specialAbilities = {};
            if (!this.state.activeEffects) this.state.activeEffects = {};
            if (!this.state.stats) {
                this.state.stats = {
                    clicksThisSession: 0,
                    fundsThisSession: 0,
                    buildingsPurchased: 0,
                    upgradesPurchased: 0,
                    achievementsUnlocked: 0,
                    abilitiesUsed: 0,
                    sessionStartTime: Date.now()
                };
            }
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
        
        // 自動クリックタイマーを開始（設定されている場合）
        if (this.state.autoClick > 0) {
            this._startAutoClick();
        }
        
        // 特殊アビリティのタイマーを復元
        this._restoreSpecialAbilityTimers();
        
        // アニメーションループを開始
        this._startAnimationLoop();
        
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
        
        // クリッカーUIのヘッダー部分を作成
        const headerHTML = `
            <div class="clicker-header">
                <h2><i class="fas fa-coins"></i> ${ClickerText.TITLE}</h2>
                <p>${ClickerText.DESCRIPTION}</p>
                <button id="clicker-exit" class="clicker-exit-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // クリッカーメイン部分（クリックターゲットと統計情報）を作成
        const mainHTML = `
            <div class="clicker-main">
                <div class="clicker-target-container">
                    <div id="clicker-target" class="clicker-target">
                        <i class="fas fa-city"></i>
                    </div>
                    <div id="clicker-target-particles" class="clicker-target-particles"></div>
                </div>
                
                <div id="clicker-stats" class="clicker-stats">
                    <div class="clicker-stat">
                        <i class="fas fa-hand-pointer"></i>
                        <span id="click-value">${ClickerText.CLICK_VALUE.replace('{value}', this._formatNumber(this.state.clickValue * this.state.clickMultiplier * this.state.allMultiplier))}</span>
                    </div>
                    <div class="clicker-stat">
                        <i class="fas fa-hourglass-half"></i>
                        <span id="auto-income">${ClickerText.AUTO_INCOME.replace('{value}', this._formatNumber(this.state.autoFunds * this.state.autoFundsMultiplier * this.state.allMultiplier))}</span>
                    </div>
                    <div class="clicker-stat">
                        <i class="fas fa-coins"></i>
                        <span id="total-earned">${ClickerText.TOTAL_EARNED.replace('{value}', this._formatNumber(this.state.totalFunds))}</span>
                    </div>
                    <div class="clicker-stat">
                        <i class="fas fa-mouse-pointer"></i>
                        <span id="total-clicks">${ClickerText.TOTAL_CLICKS.replace('{value}', this._formatNumber(this.state.totalClicks))}</span>
                    </div>
                    ${this.state.autoClick > 0 ? `
                    <div class="clicker-stat">
                        <i class="fas fa-robot"></i>
                        <span id="auto-click">${ClickerText.AUTO_CLICK.replace('{value}', this.state.autoClick)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // クリッカーのタブ部分を作成
        const tabsHTML = `
            <div class="clicker-tabs">
                <button class="clicker-tab ${this.currentTab === 'stats' ? 'active' : ''}" data-tab="stats">
                    <i class="fas fa-chart-bar"></i> ${ClickerText.STATS_TAB}
                </button>
                <button class="clicker-tab ${this.currentTab === 'buildings' ? 'active' : ''}" data-tab="buildings">
                    <i class="fas fa-building"></i> ${ClickerText.BUILDINGS_TAB}
                </button>
                <button class="clicker-tab ${this.currentTab === 'upgrades' ? 'active' : ''}" data-tab="upgrades">
                    <i class="fas fa-arrow-up"></i> ${ClickerText.UPGRADES_TAB}
                </button>
                <button class="clicker-tab ${this.currentTab === 'achievements' ? 'active' : ''}" data-tab="achievements">
                    <i class="fas fa-trophy"></i> ${ClickerText.ACHIEVEMENTS_TAB}
                </button>
                <button class="clicker-tab ${this.currentTab === 'abilities' ? 'active' : ''}" data-tab="abilities">
                    <i class="fas fa-bolt"></i> ${ClickerText.ABILITIES_TAB}
                </button>
            </div>
        `;
        
        // クリッカーのセクション部分を作成
        const sectionsHTML = `
            <div class="clicker-sections">
                <div id="clicker-stats-section" class="clicker-section ${this.currentTab === 'stats' ? '' : 'hidden'}">
                    <h3><i class="fas fa-chart-bar"></i> ${ClickerText.STATS_TAB}</h3>
                    <div id="clicker-stats-content" class="clicker-stats-content"></div>
                </div>
                
                <div id="clicker-buildings-section" class="clicker-section ${this.currentTab === 'buildings' ? '' : 'hidden'}">
                    <h3><i class="fas fa-building"></i> ${ClickerText.BUILDINGS_TAB}</h3>
                    <div class="clicker-section-controls">
                        <button id="buy-max-buildings" class="clicker-control-btn">
                            <i class="fas fa-shopping-cart"></i> ${ClickerText.BUY_MAX}
                        </button>
                    </div>
                    <div id="clicker-buildings" class="clicker-buildings"></div>
                </div>
                
                <div id="clicker-upgrades-section" class="clicker-section ${this.currentTab === 'upgrades' ? '' : 'hidden'}">
                    <h3><i class="fas fa-arrow-up"></i> ${ClickerText.UPGRADES_TAB}</h3>
                    <div id="clicker-upgrades" class="clicker-upgrades"></div>
                </div>
                
                <div id="clicker-achievements-section" class="clicker-section ${this.currentTab === 'achievements' ? '' : 'hidden'}">
                    <h3><i class="fas fa-trophy"></i> ${ClickerText.ACHIEVEMENTS_TAB}</h3>
                    <div id="clicker-achievements" class="clicker-achievements"></div>
                </div>
                
                <div id="clicker-abilities-section" class="clicker-section ${this.currentTab === 'abilities' ? '' : 'hidden'}">
                    <h3><i class="fas fa-bolt"></i> ${ClickerText.ABILITIES_TAB}</h3>
                    <div id="clicker-abilities" class="clicker-abilities"></div>
                </div>
            </div>
        `;
        
        // クリッカーUIの構造を設定
        this.clickerElement.innerHTML = `
            ${headerHTML}
            <div class="clicker-content">
                ${mainHTML}
                ${tabsHTML}
                ${sectionsHTML}
            </div>
        `;
        
        // DOMに追加
        document.body.appendChild(this.clickerElement);
        
        // UIの参照を保存
        this.clickerTarget = document.getElementById('clicker-target');
        this.clickerStats = document.getElementById('clicker-stats');
        this.tabContainers = {
            stats: document.getElementById('clicker-stats-content'),
            buildings: document.getElementById('clicker-buildings'),
            upgrades: document.getElementById('clicker-upgrades'),
            achievements: document.getElementById('clicker-achievements'),
            abilities: document.getElementById('clicker-abilities')
        };
        
        // 各タブの内容を描画
        this._renderStats();
        this._renderBuildings();
        this._renderUpgrades();
        this._renderAchievements();
        this._renderAbilities();
        this._updateStats();
    }
    
    /**
     * タブを切り替える
     * @param {string} tabName - タブ名
     * @private
     */
    _switchTab(tabName) {
        if (this.currentTab === tabName) return;
        
        this.currentTab = tabName;
        
        // タブボタンのアクティブ状態を更新
        const tabButtons = document.querySelectorAll('.clicker-tab');
        tabButtons.forEach(button => {
            button.classList.toggle('active', button.getAttribute('data-tab') === tabName);
        });
        
        // セクションの表示/非表示を切り替え
        const sections = document.querySelectorAll('.clicker-section');
        sections.forEach(section => {
            const sectionId = section.id.replace('clicker-', '').replace('-section', '');
            section.classList.toggle('hidden', sectionId !== tabName);
        });
    }
    
    /**
     * 統計情報を描画する
     * @private
     */
    _renderStats() {
        if (!this.tabContainers.stats) return;
        
        // セッション時間を計算
        const sessionDuration = Math.floor((Date.now() - this.state.stats.sessionStartTime) / 1000);
        const hours = Math.floor(sessionDuration / 3600);
        const minutes = Math.floor((sessionDuration % 3600) / 60);
        const seconds = sessionDuration % 60;
        const sessionTimeFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 資金獲得率を計算（時間あたり）
        const fundsPerHour = sessionDuration > 0 
            ? Math.floor(this.state.stats.fundsThisSession / (sessionDuration / 3600)) 
            : 0;
        
        // CPS（クリック毎秒）を計算
        const clicksPerSecond = sessionDuration > 0 
            ? (this.state.stats.clicksThisSession / sessionDuration).toFixed(2) 
            : 0;
        
        // 建物購入数を計算
        let totalBuildings = 0;
        for (const [type, count] of Object.entries(this.state.buildings)) {
            totalBuildings += count;
        }
        
        // 統計情報HTML
        const statsHTML = `
            <div class="stats-section">
                <h4><i class="fas fa-stopwatch"></i> 今回のセッション</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">セッション時間:</span>
                        <span class="stat-value">${sessionTimeFormatted}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">クリック数:</span>
                        <span class="stat-value">${this._formatNumber(this.state.stats.clicksThisSession)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">獲得資金:</span>
                        <span class="stat-value">¥${this._formatNumber(this.state.stats.fundsThisSession)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">毎時獲得資金:</span>
                        <span class="stat-value">¥${this._formatNumber(fundsPerHour)}/時</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">クリック毎秒:</span>
                        <span class="stat-value">${clicksPerSecond} CPS</span>
                    </div>
                </div>
            </div>
            
            <div class="stats-section">
                <h4><i class="fas fa-history"></i> 累計</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">総クリック数:</span>
                        <span class="stat-value">${this._formatNumber(this.state.totalClicks)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">総獲得資金:</span>
                        <span class="stat-value">¥${this._formatNumber(this.state.totalFunds)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">建物総数:</span>
                        <span class="stat-value">${this._formatNumber(totalBuildings)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">アップグレード数:</span>
                        <span class="stat-value">${Object.keys(this.state.upgrades).filter(id => this.state.upgrades[id]).length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">解除実績数:</span>
                        <span class="stat-value">${Object.keys(this.state.achievements).filter(id => this.state.achievements[id]).length}</span>
                    </div>
                </div>
            </div>
            
            <div class="stats-section">
                <h4><i class="fas fa-calculator"></i> 乗数</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">クリック乗数:</span>
                        <span class="stat-value">${(this.state.clickMultiplier).toFixed(2)}x</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">自動収入乗数:</span>
                        <span class="stat-value">${(this.state.autoFundsMultiplier).toFixed(2)}x</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">全体乗数:</span>
                        <span class="stat-value">${(this.state.allMultiplier).toFixed(2)}x</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">実効クリック価値:</span>
                        <span class="stat-value">¥${this._formatNumber(this._getEffectiveClickValue())}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">実効自動収入:</span>
                        <span class="stat-value">¥${this._formatNumber(this._getEffectiveAutoIncome())}/秒</span>
                    </div>
                </div>
            </div>
        `;
        
        this.tabContainers.stats.innerHTML = statsHTML;
    }

    /**
     * 数値をフォーマットする
     * @param {number} number - フォーマットする数値
     * @returns {string} - フォーマットされた文字列
     * @private
     */
    _formatNumber(number) {
        return number.toLocaleString();
    }
    
    /**
     * 建物リストを描画する
     * @private
     */
    _renderBuildings() {
        if (!this.tabContainers.buildings) return;
        
        // 表示する建物のリストをクリア
        this.tabContainers.buildings.innerHTML = '';
        
        // アンロックされた建物がない場合
        let hasUnlockedBuildings = false;
        
        // コイン工場
        if (this.state.unlocked.COIN_MINT) {
            hasUnlockedBuildings = true;
            this._renderBuildingItem('COIN_MINT');
        }
        
        // 銀行
        if (this.state.unlocked.BANK) {
            hasUnlockedBuildings = true;
            this._renderBuildingItem('BANK');
        }
        
        // 投資会社
        if (this.state.unlocked.INVESTMENT_FIRM) {
            hasUnlockedBuildings = true;
            this._renderBuildingItem('INVESTMENT_FIRM');
        }
        
        // テック企業
        if (this.state.unlocked.TECH_STARTUP) {
            hasUnlockedBuildings = true;
            this._renderBuildingItem('TECH_STARTUP');
        }
        
        // 貿易センター
        if (this.state.unlocked.TRADING_CENTER) {
            hasUnlockedBuildings = true;
            this._renderBuildingItem('TRADING_CENTER');
        }
        
        // アンロックされた建物がない場合
        if (!hasUnlockedBuildings) {
            this.tabContainers.buildings.innerHTML = `
                <div class="clicker-empty">
                    <p>${ClickerText.NO_BUILDINGS}</p>
                </div>
            `;
        }
        
        // 最大購入ボタンのイベントリスナーを設定
        const buyMaxButton = document.getElementById('buy-max-buildings');
        if (buyMaxButton) {
            buyMaxButton.addEventListener('click', () => {
                this._buyMaxBuildings();
            });
        }
    }
    
    /**
     * 建物アイテムを描画する
     * @param {string} buildingType - 建物タイプ
     * @private
     */
    _renderBuildingItem(buildingType) {
        const building = ClickerConfig.BUILDINGS[buildingType];
        if (!building) return;
        
        const count = this.state.buildings[buildingType] || 0;
        const cost = this._getBuildingCost(buildingType, count);
        const canAfford = this.city.funds >= cost;
        
        const buildingEl = document.createElement('div');
        buildingEl.className = `clicker-item ${!canAfford ? 'disabled' : ''}`;
        
        // 建物の効果説明を作成
        const effectsHTML = this._getBuildingEffectsHTML(buildingType);
        
        buildingEl.innerHTML = `
            <div class="clicker-item-icon"><i class="fas fa-${building.icon}"></i></div>
            <div class="clicker-item-info">
                <div class="clicker-item-name">${building.name} <span class="clicker-item-count">(${count})</span></div>
                <div class="clicker-item-desc">${building.description}</div>
                <div class="clicker-item-effect">
                    ${effectsHTML}
                </div>
            </div>
            <button class="clicker-item-btn" data-building="${buildingType}" ${!canAfford ? 'disabled' : ''}>
                <span>購入</span>
                <span class="clicker-item-cost">¥${this._formatNumber(cost)}</span>
            </button>
        `;
        
        this.tabContainers.buildings.appendChild(buildingEl);
        
        // 購入ボタンのイベントリスナーを設定
        const button = buildingEl.querySelector('.clicker-item-btn');
        if (button) {
            button.addEventListener('click', () => {
                this._buyBuilding(buildingType);
            });
        }
    }

    /**
     * Stub: Show clicker UI (no-op fallback)
     */
    show() {}

    /**
     * Stub: Hide clicker UI (no-op fallback)
     */
    hide() {}
}