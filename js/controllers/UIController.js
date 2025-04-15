/**
 * CitySim - UIController クラス
 * UI表示とユーザー操作の処理を担当
 */

import { GameConfig, GameText } from '../config/GameConfig.js';
import { BuildingFactory } from '../models/Building.js';
import { EventEmitter } from '../services/EventEmitter.js';

export class UIController {
    /**
     * UIコントローラーの初期化
     * @param {City} city - 都市モデル
     * @param {TimeManager} timeManager - 時間管理クラス
     */
    constructor(city, timeManager) {
        this.city = city;
        this.timeManager = timeManager;
        this.events = new EventEmitter();
        
        // DOM要素の参照
        this.elements = {
            gameOutput: document.getElementById('game-output'),
            clock: document.getElementById('clock'),
            fixedEvents: document.getElementById('fixed-events'),
            buildActions: document.getElementById('build-actions'),
            economyActions: document.getElementById('economy-actions'),
            policyActions: document.getElementById('policy-actions'),
            tutorialOverlay: document.getElementById('tutorial-overlay'),
            closeTutorial: document.getElementById('close-tutorial'),
            tutorialSteps: document.getElementById('tutorial-steps'),
            tabButtons: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content'),
            toggleMenu: document.getElementById('toggle-menu')
        };
        
        // イベントリスナーの登録
        this._setupEventListeners();
        
        // 都市の状態変化を監視
        this._setupCityChangeListeners();
        
        // 初期UIの設定
        this._initializeUI();
    }
    
    /**
     * アクションボタンを追加する
     * @param {string} type - アクションタイプ（build, economy, policy）
     * @param {Object} config - ボタン設定
     */
    addActionButton(type, config) {
        const actionsContainer = this.elements[`${type}Actions`];
        if (!actionsContainer) return;
        
        const button = document.createElement('button');
        button.className = `action-btn ${config.className || ''}`;
        button.setAttribute('data-action', config.action);
        
        button.innerHTML = `
            <i class="fas fa-${config.icon}"></i>
            <span>${config.label}</span>
            ${config.cost ? `<span class="cost-indicator">¥${config.cost}</span>` : ''}
            ${config.info ? `<span class="info-indicator">${config.info}</span>` : ''}
        `;
        
        // 無効化状態を設定
        if (config.disabled) {
            button.classList.add('disabled');
            button.setAttribute('disabled', 'disabled');
        }
        
        // クリックイベントを設定
        button.addEventListener('click', () => {
            if (button.classList.contains('disabled')) return;
            
            if (config.callback) {
                config.callback();
            }
            
            // イベント発火
            this.events.emit('actionButtonClicked', {
                type,
                action: config.action,
                button
            });
        });
        
        actionsContainer.appendChild(button);
        return button;
    }
    
    /**
     * イベントをゲームログに追加する
     * @param {Object} event - 追加するイベント
     */
    addEventToLog(event) {
        if (!this.elements.gameOutput) return;
        
        // 現在のゲーム内時刻を取得
        const timeString = this.timeManager.getLogTimeString();
        
        // ログエントリの作成
        const logEntry = document.createElement('p');
        logEntry.className = `${event.type || 'event-info'} new-event`;
        logEntry.innerHTML = `
            <span class="event-time"><i class="far fa-clock"></i> ${timeString}</span>
            <span class="event-title">
                <span class="event-icon"><i class="fas fa-${event.icon || 'info-circle'}"></i></span>
                ${event.title}
            </span>
            <span class="event-message">${event.message}</span>
        `;
        
        // ログの先頭に追加
        if (this.elements.gameOutput.firstChild) {
            this.elements.gameOutput.insertBefore(logEntry, this.elements.gameOutput.firstChild);
        } else {
            this.elements.gameOutput.appendChild(logEntry);
        }
        
        // アニメーションクラスを一定時間後に削除
        setTimeout(() => {
            logEntry.classList.remove('new-event');
        }, 500);
        
        // 固定イベントエリアにも表示
        this._addToFixedEvents(event, timeString);
        
        // 通知も表示
        this._showNotification(event);
        
        return logEntry;
    }
    
    /**
     * ポップアップ通知を表示する
     * @param {Object} notification - 通知情報
     */
    showNotification(notification) {
        // 通知エレメントの作成
        const notificationElement = document.createElement('div');
        notificationElement.className = 'event-notification';
        notificationElement.innerHTML = `
            <strong>${notification.title}</strong>
            <p>${notification.message}</p>
        `;
        
        // 画面に追加
        document.body.appendChild(notificationElement);
        
        // 一定時間後に消去
        setTimeout(() => {
            notificationElement.classList.add('fade-out');
            setTimeout(() => notificationElement.remove(), 300);
        }, GameConfig.UI.NOTIFICATION_DURATION);
        
        return notificationElement;
    }
    
    /**
     * 全ての統計表示を更新する
     */
    updateAllStatDisplays() {
        // 年表示の更新
        document.querySelectorAll('.year-value').forEach(el => {
            el.textContent = `${this.city.year}年`;
        });
        
        // 人口表示の更新
        document.querySelectorAll('.population-value').forEach(el => {
            el.textContent = `${this.city.population}人`;
        });
        
        // 資金表示の更新
        document.querySelectorAll('.funds-value').forEach(el => {
            el.textContent = `¥${this.city.funds.toLocaleString()}`;
        });
        
        // インフラ数表示の更新
        document.querySelectorAll('.houses-value').forEach(el => {
            el.textContent = this.city.buildings.house;
        });
        
        document.querySelectorAll('.factories-value').forEach(el => {
            el.textContent = this.city.buildings.factory;
        });
        
        document.querySelectorAll('.roads-value').forEach(el => {
            el.textContent = this.city.buildings.road;
        });
        
        // メトリクス表示の更新
        document.querySelectorAll('.happiness-value').forEach(el => {
            el.textContent = `${this.city.happiness}%`;
        });
        
        document.querySelectorAll('.environment-value').forEach(el => {
            el.textContent = `${this.city.environment}%`;
        });
        
        document.querySelectorAll('.education-value').forEach(el => {
            el.textContent = `${this.city.education}%`;
        });
        
        document.querySelectorAll('.tax-value').forEach(el => {
            el.textContent = `${(this.city.taxRate * 100).toFixed(2)}%`;
        });
        
        // プログレスバーの更新
        if (document.getElementById('happiness-bar')) {
            document.getElementById('happiness-bar').style.width = `${this.city.happiness}%`;
        }
        
        if (document.getElementById('environment-bar')) {
            document.getElementById('environment-bar').style.width = `${this.city.environment}%`;
        }
        
        if (document.getElementById('education-bar')) {
            document.getElementById('education-bar').style.width = `${this.city.education}%`;
        }
        
        // ボタンの有効/無効状態を更新
        this._updateButtonStates();
    }
    
    /**
     * 時計表示を更新する
     */
    updateClock() {
        if (this.elements.clock) {
            this.elements.clock.textContent = this.timeManager.getFormattedTime();
        }
    }
    
    /**
     * チュートリアルを表示する
     */
    showTutorial() {
        if (!this.elements.tutorialOverlay || !this.elements.tutorialSteps) return;
        
        // チュートリアルステップの生成
        this.elements.tutorialSteps.innerHTML = '';
        
        GameConfig.TUTORIAL.STEPS.forEach(step => {
            const stepElement = document.createElement('div');
            stepElement.className = 'tutorial-step';
            stepElement.innerHTML = `
                <h3><i class="fas fa-${step.icon}"></i> ${step.title}</h3>
                <p>${step.message}</p>
            `;
            this.elements.tutorialSteps.appendChild(stepElement);
        });
        
        // チュートリアルオーバーレイを表示
        this.elements.tutorialOverlay.style.display = 'flex';
    }
    
    /**
     * チュートリアルを非表示にする
     */
    hideTutorial() {
        if (this.elements.tutorialOverlay) {
            this.elements.tutorialOverlay.style.display = 'none';
            localStorage.setItem(GameConfig.TUTORIAL.STORAGE_KEY, 'true');
        }
    }
    
    /**
     * 初期UIを設定する
     * @private
     */
    _initializeUI() {
        // 初期時間の設定
        this.updateClock();
        
        // アクションボタンの設定
        this._setupActionButtons();
        
        // 統計表示の初期化
        this.updateAllStatDisplays();
        
        // チュートリアル表示
        if (localStorage.getItem(GameConfig.TUTORIAL.STORAGE_KEY) !== 'true') {
            this.showTutorial();
        }
        
        // 初期メッセージの追加
        this.addEventToLog({
            title: GameText.WELCOME_MESSAGE.TITLE,
            message: GameText.WELCOME_MESSAGE.CONTENT,
            type: 'event-system',
            icon: 'play-circle'
        });
    }
    
    /**
     * イベントリスナーを設定する
     * @private
     */
    _setupEventListeners() {
        // チュートリアル閉じるボタン
        if (this.elements.closeTutorial) {
            this.elements.closeTutorial.addEventListener('click', () => {
                this.hideTutorial();
            });
        }
        
        // タブ切り替え
        this.elements.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                
                // アクティブタブをリセット
                this.elements.tabButtons.forEach(btn => btn.classList.remove('active'));
                this.elements.tabContents.forEach(content => content.classList.add('hidden'));
                
                // 選択したタブをアクティブに
                button.classList.add('active');
                document.getElementById(`${tabName}-tab`).classList.remove('hidden');
            });
        });
        
        // モバイルメニュートグル
        if (this.elements.toggleMenu) {
            this.elements.toggleMenu.addEventListener('click', () => {
                document.querySelector('.dashboard').classList.toggle('mobile-active');
            });
        }
        
        // キーボードショートカット
        document.addEventListener('keydown', (event) => {
            // 数字キーでアクション
            if (/^[1-7]$/.test(event.key)) {
                this._handleShortcutKey(event.key);
            }
            
            // スペースキーでゲーム一時停止/再開
            if (event.key === ' ') {
                this._togglePause();
            }
        });
        
        // 時間の変化を監視
        this.timeManager.events.on('tick', () => {
            this.updateClock();
        });
    }
    
    /**
     * 都市の変化リスナーを設定する
     * @private
     */
    _setupCityChangeListeners() {
        this.city.events.on('change', (detail) => {
            // 都市の状態が変わったらUIを更新
            this.updateAllStatDisplays();
            
            // 変更タイプに応じたログを表示
            switch (detail.type) {
                case 'build':
                    this._handleBuildEvent(detail);
                    break;
                case 'taxChange':
                    this._handleTaxChangeEvent(detail);
                    break;
                case 'yearEnd':
                    this._handleYearEndEvent(detail);
                    break;
                case 'event':
                    // イベントシステムが処理するので何もしない
                    break;
            }
        });
    }
    
    /**
     * アクションボタンを設定する
     * @private
     */
    _setupActionButtons() {
        // 建設タブのボタン
        Object.entries(GameConfig.BUILDINGS).forEach(([key, building]) => {
            const type = key.toLowerCase();
            this.addActionButton('build', {
                action: `build_${type}`,
                icon: building.icon,
                label: building.name,
                cost: building.cost,
                callback: () => {
                    this.events.emit('buildRequest', {
                        type,
                        building
                    });
                }
            });
        });
        
        // 経済タブのボタン
        this.addActionButton('economy', {
            action: 'set_tax_rate',
            icon: 'percentage',
            label: GameText.ACTION_LABELS.SET_TAX,
            callback: () => {
                this.events.emit('taxRateRequest');
            }
        });
        
        this.addActionButton('economy', {
            action: 'loan',
            icon: 'hand-holding-usd',
            label: GameText.ACTION_LABELS.LOAN,
            info: '準備中',
            disabled: true
        });
        
        this.addActionButton('economy', {
            action: 'trade',
            icon: 'exchange-alt',
            label: GameText.ACTION_LABELS.TRADE,
            info: '準備中',
            disabled: true
        });
        
        // 政策タブのボタン
        this.addActionButton('policy', {
            action: 'next_year',
            icon: 'calendar-plus',
            label: GameText.ACTION_LABELS.NEXT_YEAR,
            callback: () => {
                this.events.emit('nextYearRequest');
            }
        });
        
        this.addActionButton('policy', {
            action: 'education_policy',
            icon: 'graduation-cap',
            label: GameText.ACTION_LABELS.EDUCATION_POLICY,
            info: '準備中',
            disabled: true
        });
        
        this.addActionButton('policy', {
            action: 'environment_policy',
            icon: 'leaf',
            label: GameText.ACTION_LABELS.ENVIRONMENT_POLICY,
            info: '準備中',
            disabled: true
        });
    }
    
    /**
     * 建物効果ログメッセージを作成する
     * @param {string} type - 建物タイプ
     * @returns {string} - 効果メッセージ
     * @private
     */
    _createBuildingEffectsMessage(type) {
        const effects = GameConfig.BUILDINGS[type.toUpperCase()].effects;
        const messages = [];
        
        if (effects.population) {
            messages.push(`人口が <strong>+${effects.population}人</strong> 増加しました。`);
        }
        
        if (effects.happiness) {
            const prefix = effects.happiness > 0 ? '+' : '';
            messages.push(`幸福度が <strong>${prefix}${effects.happiness}%</strong> 変化しました。`);
        }
        
        if (effects.environment) {
            const prefix = effects.environment > 0 ? '+' : '';
            messages.push(`環境が <strong>${prefix}${effects.environment}%</strong> 変化しました。`);
        }
        
        if (effects.education) {
            messages.push(`教育が <strong>+${effects.education}%</strong> 向上しました。`);
        }
        
        return messages.join('<br>');
    }
    
    /**
     * 建物建設イベントを処理する
     * @param {Object} detail - イベント詳細
     * @private
     */
    _handleBuildEvent(detail) {
        const buildingType = detail.buildingType.toUpperCase();
        const building = GameConfig.BUILDINGS[buildingType];
        
        if (!building) return;
        
        const effectsMessage = this._createBuildingEffectsMessage(detail.buildingType);
        
        this.addEventToLog({
            title: `${building.name}建設完了`,
            message: `新しい${building.name}が建設されました。<br>${effectsMessage}<br>残りの資金: <strong>¥${this.city.funds.toLocaleString()}</strong>`,
            type: 'event-success',
            icon: building.icon
        });
    }
    
    /**
     * 税率変更イベントを処理する
     * @param {Object} detail - イベント詳細
     * @private
     */
    _handleTaxChangeEvent(detail) {
        const newRate = (detail.newRate * 100).toFixed(1);
        const oldRate = (detail.oldRate * 100).toFixed(1);
        
        let message = `税率が <strong>${newRate}%</strong> に設定されました。`;
        
        if (detail.newRate > 0.15) {
            message += '<br><strong>警告:</strong> 高い税率は市民の幸福度に悪影響を与える可能性があります。';
        }
        
        this.addEventToLog({
            title: '税率変更',
            message,
            type: 'event-info',
            icon: 'percentage'
        });
    }
    
    /**
     * 年度終了イベントを処理する
     * @param {Object} detail - イベント詳細
     * @private
     */
    _handleYearEndEvent(detail) {
        this.addEventToLog({
            title: `${detail.newYear}年の新年を迎えました`,
            message: `
            収入内訳:<br>
            - 税収: <strong>¥${detail.taxIncome.toLocaleString()}</strong><br>
            - 工場収入: <strong>¥${detail.factoryIncome.toLocaleString()}</strong><br>
            合計: <strong>¥${detail.totalIncome.toLocaleString()}</strong>
            `,
            type: 'event-info',
            icon: 'calendar-alt'
        });
    }
    
    /**
     * ショートカットキーを処理する
     * @param {string} key - 押されたキー
     * @private
     */
    _handleShortcutKey(key) {
        switch (key) {
            case '1':
                // 住宅建設
                this.events.emit('buildRequest', { type: 'house' });
                break;
            case '2':
                // 工場建設
                this.events.emit('buildRequest', { type: 'factory' });
                break;
            case '3':
                // 道路建設
                this.events.emit('buildRequest', { type: 'road' });
                break;
            case '4':
                // 次の年へ
                this.events.emit('nextYearRequest');
                break;
            case '5':
                // 税率設定
                this.events.emit('taxRateRequest');
                break;
            case '6':
                // 都市詳細表示
                this._showCityDetails();
                break;
            case '7':
                // (予備)
                break;
        }
    }
    
    /**
     * ゲームの一時停止/再開を切り替える
     * @private
     */
    _togglePause() {
        if (this.timeManager.paused) {
            this.timeManager.resume();
            
            this.addEventToLog({
                title: 'ゲームを再開しました',
                message: 'スペースキーでゲームを一時停止できます。',
                type: 'event-system',
                icon: 'play-circle'
            });
        } else {
            this.timeManager.pause();
            
            this.addEventToLog({
                title: 'ゲームを一時停止しました',
                message: 'スペースキーでゲームを再開できます。',
                type: 'event-system',
                icon: 'pause-circle'
            });
        }
    }
    
    /**
     * 都市の詳細情報を表示する
     * @private
     */
    _showCityDetails() {
        this.addEventToLog({
            title: '都市の詳細情報',
            message: `
                <strong>年:</strong> ${this.city.year}年<br>
                <strong>人口:</strong> ${this.city.population}人<br>
                <strong>資金:</strong> ¥${this.city.funds.toLocaleString()}<br>
                <strong>住宅数:</strong> ${this.city.buildings.house}<br>
                <strong>工場数:</strong> ${this.city.buildings.factory}<br>
                <strong>道路数:</strong> ${this.city.buildings.road}<br>
                <strong>幸福度:</strong> ${this.city.happiness}%<br>
                <strong>環境:</strong> ${this.city.environment}%<br>
                <strong>教育:</strong> ${this.city.education}%<br>
                <strong>税率:</strong> ${(this.city.taxRate * 100).toFixed(2)}%
            `,
            type: 'event-system',
            icon: 'clipboard-list'
        });
    }
    
    /**
     * 固定イベントエリアにイベントを追加する
     * @param {Object} event - イベント情報
     * @param {string} timeString - 時刻文字列
     * @private
     */
    _addToFixedEvents(event, timeString) {
        if (!this.elements.fixedEvents) return;
        
        const fixedEventItem = document.createElement('div');
        fixedEventItem.className = `event-item ${event.type || 'event-info'}`;
        fixedEventItem.innerHTML = `
            <div class="event-icon"><i class="fas fa-${event.icon || 'info-circle'}"></i></div>
            <div class="event-content">
                <div class="event-title">${event.title}</div>
                <div class="event-message">${event.shortMessage || event.title}</div>
            </div>
            <div class="event-time">${timeString}</div>
        `;
        
        this.elements.fixedEvents.appendChild(fixedEventItem);
        
        // 一定数を超えたら古いイベントを削除
        while (this.elements.fixedEvents.children.length > GameConfig.UI.MAX_NOTIFICATIONS) {
            this.elements.fixedEvents.removeChild(this.elements.fixedEvents.firstChild);
        }
    }
    
    /**
     * 通知を表示する
     * @param {Object} event - イベント情報
     * @private
     */
    _showNotification(event) {
        // 重要なイベントタイプのみ通知表示
        if (event.type === 'event-success' || event.type === 'event-danger' || event.type === 'event-warning') {
            this.showNotification({
                title: event.title,
                message: event.shortMessage || event.message
            });
        }
    }
    
    /**
     * ボタンの状態を更新する
     * @private
     */
    _updateButtonStates() {
        // 建設ボタンの状態を更新
        Object.entries(GameConfig.BUILDINGS).forEach(([key, building]) => {
            const type = key.toLowerCase();
            const buttons = document.querySelectorAll(`[data-action="build_${type}"]`);
            
            buttons.forEach(btn => {
                if (this.city.funds < building.cost) {
                    btn.classList.add('disabled');
                    btn.setAttribute('disabled', 'disabled');
                    
                    if (btn.querySelector('.cost-indicator')) {
                        btn.querySelector('.cost-indicator').textContent = `¥${building.cost} (資金不足)`;
                    }
                } else {
                    btn.classList.remove('disabled');
                    btn.removeAttribute('disabled');
                    
                    if (btn.querySelector('.cost-indicator')) {
                        btn.querySelector('.cost-indicator').textContent = `¥${building.cost}`;
                    }
                }
            });
        });
    }
}
