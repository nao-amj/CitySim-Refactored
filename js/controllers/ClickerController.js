/**
 * CitySim - ClickerController クラス
 * クリッカーゲームモードの操作と表示を制御
 */

import { GameConfig, GameText } from '../config/GameConfig.js';
import { ClickerModel } from '../models/ClickerModel.js';
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
        
        // クリッカーモデルの初期化
        this.model = new ClickerModel(city);
        
        // DOM要素の参照
        this.elements = {
            clickerContainer: document.getElementById('clicker-container'),
            clickerCity: document.getElementById('clicker-city'),
            clickerValue: document.getElementById('clicker-value'),
            clickerAutoIncome: document.getElementById('clicker-auto-income'),
            clickerTotalEarned: document.getElementById('clicker-total-earned'),
            clickerTotalClicks: document.getElementById('clicker-total-clicks'),
            clickerBuildings: document.getElementById('clicker-buildings'),
            clickerUpgrades: document.getElementById('clicker-upgrades'),
            clickerAchievements: document.getElementById('clicker-achievements'),
            clickerClose: document.getElementById('clicker-close'),
            clickerReturnToCity: document.getElementById('clicker-return-to-city')
        };
        
        // クリッカー表示状態
        this.visible = false;
        
        // イベントリスナーの登録
        this._setupEventListeners();
        
        // クリッカーモデルのイベントをリッスン
        this._setupModelEventListeners();
    }
    
    /**
     * クリッカーモードを表示する
     */
    show() {
        if (this.elements.clickerContainer) {
            this.elements.clickerContainer.classList.remove('hidden');
            this.visible = true;
            
            // 自動収入タイマーを開始
            this.model.startAutoFunds();
            
            // UI更新
            this._updateUI();
            
            // クリッカーモード表示イベント
            this.events.emit('clickerShown');
        }
    }
    
    /**
     * クリッカーモードを非表示にする
     */
    hide() {
        if (this.elements.clickerContainer) {
            this.elements.clickerContainer.classList.add('hidden');
            this.visible = false;
            
            // 自動収入タイマーを停止
            this.model.stopAutoFunds();
            
            // クリッカーモード非表示イベント
            this.events.emit('clickerHidden');
        }
    }
    
    /**
     * クリック処理を実行する
     */
    processClick() {
        const earnings = this.model.click();
        
        // クリック効果アニメーション
        this._animateClickEffect(earnings);
        
        // UI更新
        this._updateUI();
    }
    
    /**
     * 建物を購入する
     * @param {string} buildingType - 建物タイプ
     */
    buyBuilding(buildingType) {
        const result = this.model.buyBuilding(buildingType);
        
        if (result.success) {
            // 成功通知
            this._showNotification('success', '購入完了', result.message);
        } else {
            // 失敗通知
            this._showNotification('error', '購入失敗', result.message);
        }
        
        // UI更新
        this._updateUI();
    }
    
    /**
     * アップグレードを購入する
     * @param {string} upgradeType - アップグレードタイプ
     */
    buyUpgrade(upgradeType) {
        const result = this.model.buyUpgrade(upgradeType);
        
        if (result.success) {
            // 成功通知
            this._showNotification('success', '購入完了', result.message);
        } else {
            // 失敗通知
            this._showNotification('error', '購入失敗', result.message);
        }
        
        // UI更新
        this._updateUI();
    }
    
    /**
     * クリッカーの状態を保存する
     * @param {SaveManager} saveManager - セーブマネージャー
     */
    saveState(saveManager) {
        if (saveManager) {
            const cityData = saveManager.city.serialize();
            cityData.clickerData = this.model.serialize();
            saveManager.city.clickerData = cityData.clickerData;
        }
    }
    
    /**
     * クリッカーの状態を読み込む
     * @param {SaveManager} saveManager - セーブマネージャー
     */
    loadState(saveManager) {
        if (saveManager && saveManager.city && saveManager.city.clickerData) {
            this.model.deserialize(saveManager.city.clickerData);
            this._updateUI();
        }
    }
    
    /**
     * イベントリスナーを設定する
     * @private
     */
    _setupEventListeners() {
        // 都市クリックイベント
        if (this.elements.clickerCity) {
            this.elements.clickerCity.addEventListener('click', () => {
                this.processClick();
            });
        }
        
        // クローズボタン
        if (this.elements.clickerClose) {
            this.elements.clickerClose.addEventListener('click', () => {
                this.hide();
            });
        }
        
        // 都市管理に戻るボタン
        if (this.elements.clickerReturnToCity) {
            this.elements.clickerReturnToCity.addEventListener('click', () => {
                this.hide();
            });
        }
    }
    
    /**
     * モデルのイベントリスナーを設定する
     * @private
     */
    _setupModelEventListeners() {
        // クリックイベント
        this.model.events.on('click', (data) => {
            // 必要に応じてUI更新
        });
        
        // 自動収入イベント
        this.model.events.on('autoFunds', (data) => {
            // 自動収入の視覚的フィードバック
            if (data.value > 0) {
                this._animateAutoIncomeEffect(data.value);
            }
            
            // UI更新（ただし頻繁すぎないように）
            this._debounceUpdateUI();
        });
        
        // 建物購入イベント
        this.model.events.on('buildingPurchased', (data) => {
            // 必要に応じてUI更新
        });
        
        // アップグレード購入イベント
        this.model.events.on('upgradePurchased', (data) => {
            // 必要に応じてUI更新
        });
        
        // 建物アンロックイベント
        this.model.events.on('buildingUnlocked', (data) => {
            // アンロック通知
            const message = GameText.CLICKER.UNLOCK_MESSAGE.replace('{building}', data.name);
            this._showNotification('info', 'アンロック', message);
            
            // UI更新
            this._updateUI();
        });
        
        // 実績解除イベント
        this.model.events.on('achievementUnlocked', (data) => {
            // 実績解除通知
            const message = GameText.CLICKER.ACHIEVEMENT_UNLOCKED.replace('{name}', data.name);
            this._showNotification('success', '実績解除', `${message}: ${data.description}`);
            
            // UI更新
            this._updateUI();
        });
    }
    
    /**
     * UI要素を更新する
     * @private
     */
    _updateUI() {
        // 可視状態でなければ更新しない
        if (!this.visible) return;
        
        // 統計情報の更新
        const status = this.model.getStatus();
        
        if (this.elements.clickerValue) {
            this.elements.clickerValue.textContent = GameText.CLICKER.CLICK_VALUE.replace('{value}', status.clickValue);
        }
        
        if (this.elements.clickerAutoIncome) {
            this.elements.clickerAutoIncome.textContent = GameText.CLICKER.AUTO_INCOME.replace('{value}', status.autoFundsPerSecond);
        }
        
        if (this.elements.clickerTotalEarned) {
            this.elements.clickerTotalEarned.textContent = GameText.CLICKER.TOTAL_EARNED.replace('{value}', status.totalEarned.toLocaleString());
        }
        
        if (this.elements.clickerTotalClicks) {
            this.elements.clickerTotalClicks.textContent = GameText.CLICKER.TOTAL_CLICKS.replace('{value}', status.totalClicks.toLocaleString());
        }
        
        // 建物リストの更新
        this._updateBuildingsList();
        
        // アップグレードリストの更新
        this._updateUpgradesList();
        
        // 実績リストの更新
        this._updateAchievementsList();
        
        // 資金表示の更新
        if (this.uiController) {
            this.uiController.updateAllStatDisplays();
        }
    }
    
    /**
     * 建物リストを更新する
     * @private
     */
    _updateBuildingsList() {
        if (!this.elements.clickerBuildings) return;
        
        // 建物リストをクリア
        this.elements.clickerBuildings.innerHTML = '';
        
        // 建物設定ループ
        const buildings = ['COIN_MINT', 'BANK', 'INVESTMENT_FIRM'];
        
        buildings.forEach(buildingType => {
            // アンロック状態の確認
            if (!this.model.unlocked[buildingType] && this.model.unlocked.hasOwnProperty(buildingType)) {
                // 未解放の建物は表示しない（ただしヒントは表示可能）
                const thresholds = GameConfig.CLICKER.UNLOCK_THRESHOLDS;
                if (thresholds[buildingType]) {
                    const unlockHint = document.createElement('div');
                    unlockHint.className = 'clicker-unlock-hint';
                    unlockHint.innerHTML = `
                        <div class="unlock-icon"><i class="fas fa-lock"></i></div>
                        <div class="unlock-info">
                            <span class="unlock-title">???</span>
                            <span class="unlock-requirement">解放条件: ¥${thresholds[buildingType].toLocaleString()}稼ぐ</span>
                        </div>
                    `;
                    this.elements.clickerBuildings.appendChild(unlockHint);
                }
                return;
            }
            
            const buildingConfig = GameConfig.BUILDINGS[buildingType];
            if (!buildingConfig) return;
            
            // 所有数
            const ownedCount = this.model.buildings[buildingType] || 0;
            
            // 購入コスト（所有数に応じて上昇）
            const cost = Math.floor(buildingConfig.cost * Math.pow(1.15, ownedCount));
            
            // 建物アイテムの作成
            const buildingItem = document.createElement('div');
            buildingItem.className = `clicker-building-item ${this.city.funds < cost ? 'disabled' : ''}`;
            buildingItem.setAttribute('data-building-type', buildingType);
            
            // 効果の説明テキスト
            let effectsText = '';
            if (buildingConfig.effects.clickMultiplier) {
                effectsText += `クリック価値 +${(buildingConfig.effects.clickMultiplier * 100).toFixed(0)}%、`;
            }
            if (buildingConfig.effects.autoFunds) {
                effectsText += `自動収入 +¥${buildingConfig.effects.autoFunds}/秒、`;
            }
            if (buildingConfig.effects.fundMultiplier) {
                effectsText += `収入 +${(buildingConfig.effects.fundMultiplier * 100).toFixed(0)}%、`;
            }
            // 末尾の「、」を削除
            effectsText = effectsText.replace(/、$/, '');
            
            buildingItem.innerHTML = `
                <div class="building-icon"><i class="fas fa-${buildingConfig.icon}"></i></div>
                <div class="building-info">
                    <span class="building-name">${buildingConfig.name} <span class="building-count">(${ownedCount})</span></span>
                    <span class="building-effect">${effectsText}</span>
                    <span class="building-cost">¥${cost.toLocaleString()}</span>
                </div>
                <button class="building-buy-btn" ${this.city.funds < cost ? 'disabled' : ''}>購入</button>
            `;
            
            // 購入ボタンのイベント
            const buyButton = buildingItem.querySelector('.building-buy-btn');
            if (buyButton) {
                buyButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.buyBuilding(buildingType);
                });
            }
            
            this.elements.clickerBuildings.appendChild(buildingItem);
        });
    }
    
    /**
     * アップグレードリストを更新する
     * @private
     */
    _updateUpgradesList() {
        if (!this.elements.clickerUpgrades) return;
        
        // アップグレードリストをクリア
        this.elements.clickerUpgrades.innerHTML = '';
        
        // アップグレード設定ループ
        for (const [upgradeType, upgradeConfig] of Object.entries(GameConfig.CLICKER.UPGRADES)) {
            // 既に購入済みならスキップ
            if (this.model.upgrades[upgradeType]) {
                const upgradeItem = document.createElement('div');
                upgradeItem.className = 'clicker-upgrade-item purchased';
                upgradeItem.innerHTML = `
                    <div class="upgrade-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="upgrade-info">
                        <span class="upgrade-name">${upgradeConfig.name}</span>
                        <span class="upgrade-description">${upgradeConfig.description}</span>
                    </div>
                `;
                this.elements.clickerUpgrades.appendChild(upgradeItem);
                continue;
            }
            
            // 効果の説明テキスト
            let effectsText = '';
            if (upgradeConfig.effect.clickMultiplier) {
                effectsText += `クリック価値 +${(upgradeConfig.effect.clickMultiplier * 100).toFixed(0)}%、`;
            }
            if (upgradeConfig.effect.autoFundsMultiplier) {
                effectsText += `自動収入 +${(upgradeConfig.effect.autoFundsMultiplier * 100).toFixed(0)}%、`;
            }
            if (upgradeConfig.effect.allMultiplier) {
                effectsText += `すべての収入 +${(upgradeConfig.effect.allMultiplier * 100).toFixed(0)}%、`;
            }
            // 末尾の「、」を削除
            effectsText = effectsText.replace(/、$/, '');
            
            // アップグレードアイテムの作成
            const upgradeItem = document.createElement('div');
            upgradeItem.className = `clicker-upgrade-item ${this.city.funds < upgradeConfig.cost ? 'disabled' : ''}`;
            upgradeItem.setAttribute('data-upgrade-type', upgradeType);
            
            upgradeItem.innerHTML = `
                <div class="upgrade-icon"><i class="fas fa-arrow-up"></i></div>
                <div class="upgrade-info">
                    <span class="upgrade-name">${upgradeConfig.name}</span>
                    <span class="upgrade-effect">${effectsText}</span>
                    <span class="upgrade-cost">¥${upgradeConfig.cost.toLocaleString()}</span>
                </div>
                <button class="upgrade-buy-btn" ${this.city.funds < upgradeConfig.cost ? 'disabled' : ''}>購入</button>
            `;
            
            // 購入ボタンのイベント
            const buyButton = upgradeItem.querySelector('.upgrade-buy-btn');
            if (buyButton) {
                buyButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.buyUpgrade(upgradeType);
                });
            }
            
            this.elements.clickerUpgrades.appendChild(upgradeItem);
        }
    }
    
    /**
     * 実績リストを更新する
     * @private
     */
    _updateAchievementsList() {
        if (!this.elements.clickerAchievements) return;
        
        // 実績リストをクリア
        this.elements.clickerAchievements.innerHTML = '';
        
        // 実績設定ループ
        for (const [achievementType, achievement] of Object.entries(GameConfig.CLICKER.ACHIEVEMENTS)) {
            // 実績アイテムの作成
            const achievementItem = document.createElement('div');
            achievementItem.className = `clicker-achievement-item ${this.model.achievements[achievementType] ? 'unlocked' : 'locked'}`;
            
            // 条件の説明テキスト
            let requirementText = '';
            if (achievement.requirement.totalClicks) {
                requirementText += `${achievement.requirement.totalClicks.toLocaleString()}回クリックする`;
            }
            if (achievement.requirement.totalFunds) {
                requirementText += `¥${achievement.requirement.totalFunds.toLocaleString()}稼ぐ`;
            }
            
            // ボーナスの説明テキスト
            let bonusText = '';
            if (achievement.bonus) {
                if (achievement.bonus.clickMultiplier) {
                    bonusText += `クリック価値 +${(achievement.bonus.clickMultiplier * 100).toFixed(0)}%、`;
                }
                if (achievement.bonus.autoFundsMultiplier) {
                    bonusText += `自動収入 +${(achievement.bonus.autoFundsMultiplier * 100).toFixed(0)}%、`;
                }
                if (achievement.bonus.fundMultiplier) {
                    bonusText += `すべての収入 +${(achievement.bonus.fundMultiplier * 100).toFixed(0)}%、`;
                }
                // 末尾の「、」を削除
                bonusText = bonusText.replace(/、$/, '');
            }
            
            achievementItem.innerHTML = `
                <div class="achievement-icon">
                    <i class="fas fa-${this.model.achievements[achievementType] ? 'trophy' : 'lock'}"></i>
                </div>
                <div class="achievement-info">
                    <span class="achievement-name">${achievement.name}</span>
                    <span class="achievement-description">${achievement.description}</span>
                    ${bonusText ? `<span class="achievement-bonus">ボーナス: ${bonusText}</span>` : ''}
                </div>
            `;
            
            this.elements.clickerAchievements.appendChild(achievementItem);
        }
    }
    
    /**
     * クリック効果のアニメーションを表示
     * @param {number} value - 獲得資金
     * @private
     */
    _animateClickEffect(value) {
        if (!this.elements.clickerCity) return;
        
        // クリック効果を表示
        const clickEffect = document.createElement('div');
        clickEffect.className = 'click-effect';
        clickEffect.textContent = `+¥${value}`;
        
        // ランダムな位置オフセット
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 40;
        
        // クリック位置からの相対位置
        clickEffect.style.left = `calc(50% + ${offsetX}px)`;
        clickEffect.style.top = `calc(50% + ${offsetY}px)`;
        
        this.elements.clickerCity.appendChild(clickEffect);
        
        // アニメーション後に削除
        setTimeout(() => {
            clickEffect.remove();
        }, 1500);
    }
    
    /**
     * 自動収入効果のアニメーションを表示
     * @param {number} value - 獲得資金
     * @private
     */
    _animateAutoIncomeEffect(value) {
        if (!this.elements.clickerCity || !this.visible) return;
        
        // 自動収入効果を表示（稀に表示）
        if (Math.random() > 0.3) return;
        
        const autoEffect = document.createElement('div');
        autoEffect.className = 'auto-income-effect';
        autoEffect.textContent = `+¥${value}`;
        
        // ランダムな位置
        const offsetX = (Math.random() - 0.5) * 80;
        const offsetY = (Math.random() - 0.5) * 80;
        
        autoEffect.style.left = `calc(50% + ${offsetX}px)`;
        autoEffect.style.top = `calc(50% + ${offsetY}px)`;
        
        this.elements.clickerCity.appendChild(autoEffect);
        
        // アニメーション後に削除
        setTimeout(() => {
            autoEffect.remove();
        }, 2000);
    }
    
    /**
     * UI更新の頻度を制限する（多すぎる更新を防ぐ）
     * @private
     */
    _debounceUpdateUI() {
        if (this._updateTimeout) return;
        
        this._updateTimeout = setTimeout(() => {
            this._updateUI();
            this._updateTimeout = null;
        }, 1000); // 1秒に1回まで更新
    }
    
    /**
     * 通知を表示する
     * @param {string} type - 通知タイプ
     * @param {string} title - 通知タイトル
     * @param {string} message - 通知メッセージ
     * @private
     */
    _showNotification(type, title, message) {
        if (this.uiController) {
            const notificationType = type === 'error' ? 'event-danger' : 
                                    type === 'success' ? 'event-success' : 'event-info';
            
            const icon = type === 'error' ? 'exclamation-circle' : 
                        type === 'success' ? 'check-circle' : 'info-circle';
            
            this.uiController.addEventToLog({
                title: title,
                message: message,
                type: notificationType,
                icon: icon
            });
        }
    }
}
