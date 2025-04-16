/**
 * CitySim - UIController クラス
 * UI表示とユーザー操作の処理を担当
 */

import { GameConfig, GameText } from '../config/GameConfig.js';
import { DistrictsConfig, getDistrictTypes, getSpecializations } from '../config/DistrictsConfig.js';
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
        
        // 現在選択中の地区ID
        this.selectedDistrictId = null;
        
        // DOM要素の参照
        this.elements = {
            gameOutput: document.getElementById('game-output'),
            clock: document.getElementById('clock'),
            fixedEvents: document.getElementById('fixed-events'),
            buildActions: document.getElementById('build-actions'),
            economyActions: document.getElementById('economy-actions'),
            policyActions: document.getElementById('policy-actions'),
            districtsActions: document.getElementById('districts-actions'), // 地区タブ用
            districtsList: document.getElementById('districts-list'), // 地区リスト
            districtDetails: document.getElementById('district-details'), // 地区詳細
            cityMap: document.getElementById('city-map'), // 都市マップ
            tutorialOverlay: document.getElementById('tutorial-overlay'),
            closeTutorial: document.getElementById('close-tutorial'),
            tutorialSteps: document.getElementById('tutorial-steps'),
            tabButtons: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content'),
            toggleMenu: document.getElementById('toggle-menu'),
            statsCharts: document.getElementById('stats-charts') // 統計グラフ
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
     * @param {string} type - アクションタイプ（build, economy, policy, districts）
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
     * 地区作成ダイアログを表示する
     */
    showCreateDistrictDialog() {
        // 既存のダイアログがあれば削除
        const existingDialog = document.getElementById('district-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }
        
        // ダイアログを作成
        const dialog = document.createElement('div');
        dialog.id = 'district-dialog';
        dialog.className = 'dialog';
        
        // 地区タイプのオプションを生成
        const typeOptions = getDistrictTypes().map(type => 
            `<option value="${type.id}">${type.name} (¥${type.cost.toLocaleString()})</option>`
        ).join('');
        
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2><i class="fas fa-city"></i> 新しい地区を作成</h2>
                <div class="form-group">
                    <label for="district-name">地区名:</label>
                    <input type="text" id="district-name" placeholder="新しい地区の名前">
                </div>
                <div class="form-group">
                    <label for="district-type">地区タイプ:</label>
                    <select id="district-type">
                        ${typeOptions}
                    </select>
                </div>
                <div id="district-type-description" class="description"></div>
                <div class="dialog-buttons">
                    <button id="create-district-cancel" class="btn btn-secondary">キャンセル</button>
                    <button id="create-district-confirm" class="btn btn-primary">作成</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // 最初の地区タイプの説明を表示
        const firstType = getDistrictTypes()[0];
        if (firstType) {
            document.getElementById('district-type-description').innerHTML = 
                `<p>${firstType.description}</p><p>効果: 人口 +${firstType.effects.population || 0}、幸福度 ${firstType.effects.happiness > 0 ? '+' : ''}${firstType.effects.happiness || 0}%、環境 ${firstType.effects.environment > 0 ? '+' : ''}${firstType.effects.environment || 0}%</p>`;
        }
        
        // 地区タイプ選択変更時の処理
        document.getElementById('district-type').addEventListener('change', (e) => {
            const selectedType = getDistrictTypes().find(type => type.id === e.target.value);
            if (selectedType) {
                document.getElementById('district-type-description').innerHTML = 
                    `<p>${selectedType.description}</p><p>効果: 人口 +${selectedType.effects.population || 0}、幸福度 ${selectedType.effects.happiness > 0 ? '+' : ''}${selectedType.effects.happiness || 0}%、環境 ${selectedType.effects.environment > 0 ? '+' : ''}${selectedType.effects.environment || 0}%</p>`;
            }
        });
        
        // キャンセルボタン
        document.getElementById('create-district-cancel').addEventListener('click', () => {
            dialog.remove();
        });
        
        // 作成ボタン
        document.getElementById('create-district-confirm').addEventListener('click', () => {
            const name = document.getElementById('district-name').value;
            const type = document.getElementById('district-type').value;
            
            // イベント発火
            this.events.emit('createDistrictRequest', {
                name: name || null, // 空の場合はnullでデフォルト名を使用
                type
            });
            
            dialog.remove();
        });
    }
    
    /**
     * 地区の詳細を表示する
     * @param {string} districtId - 地区ID
     */
    showDistrictDetails(districtId) {
        const district = this.city.getDistrict(districtId);
        if (!district || !this.elements.districtDetails) return;
        
        // 選択中の地区IDを更新
        this.selectedDistrictId = districtId;
        
        // 地区リストの選択状態を更新
        if (this.elements.districtsList) {
            const listItems = this.elements.districtsList.querySelectorAll('.district-item');
            listItems.forEach(item => {
                if (item.getAttribute('data-district-id') === districtId) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        }
        
        // 地区詳細を表示
        this.elements.districtDetails.innerHTML = `
            <div class="district-header">
                <h3><i class="fas fa-${this._getDistrictIcon(district.type)}"></i> ${district.name}</h3>
                <div class="district-type">${this._getDistrictTypeName(district.type)} (レベル ${district.level})</div>
                ${district.specialization ? `<div class="district-specialization">専門化: ${this._getSpecializationName(district.type, district.specialization)}</div>` : ''}
            </div>
            <div class="district-stats">
                <div class="stat">
                    <span class="label">人口:</span>
                    <span class="value">${district.metrics.population}人</span>
                </div>
                <div class="stat">
                    <span class="label">幸福度:</span>
                    <span class="value">${district.effects.happiness > 0 ? '+' : ''}${district.effects.happiness}%</span>
                </div>
                <div class="stat">
                    <span class="label">環境:</span>
                    <span class="value">${district.effects.environment > 0 ? '+' : ''}${district.effects.environment}%</span>
                </div>
                <div class="stat">
                    <span class="label">教育:</span>
                    <span class="value">${district.effects.education > 0 ? '+' : ''}${district.effects.education}%</span>
                </div>
                <div class="stat">
                    <span class="label">収入:</span>
                    <span class="value">¥${district.metrics.income}/年</span>
                </div>
            </div>
            <div class="district-buildings">
                <h4>建物</h4>
                <ul>
                    ${this._renderDistrictBuildings(district)}
                </ul>
            </div>
            <div class="district-actions">
                <button class="btn upgrade-district" data-district-id="${district.id}" ${district.level >= DistrictsConfig.MAX_LEVEL ? 'disabled' : ''}>
                    <i class="fas fa-arrow-up"></i> アップグレード
                    ${district.level < DistrictsConfig.MAX_LEVEL ? `<span class="cost">¥${DistrictsConfig.UPGRADE_REQUIREMENTS[district.level].funds.toLocaleString()}</span>` : '<span class="max-level">最大レベル</span>'}
                </button>
                <button class="btn set-specialization" data-district-id="${district.id}">
                    <i class="fas fa-star"></i> 専門化設定
                </button>
                <button class="btn build-in-district" data-district-id="${district.id}">
                    <i class="fas fa-plus"></i> 建物を建設
                </button>
            </div>
        `;
        
        // アップグレードボタンのイベントリスナー
        const upgradeButton = this.elements.districtDetails.querySelector('.upgrade-district');
        if (upgradeButton) {
            upgradeButton.addEventListener('click', () => {
                this.events.emit('upgradeDistrictRequest', { districtId });
            });
        }
        
        // 専門化設定ボタンのイベントリスナー
        const specializationButton = this.elements.districtDetails.querySelector('.set-specialization');
        if (specializationButton) {
            specializationButton.addEventListener('click', () => {
                this._showSpecializationDialog(district);
            });
        }
        
        // 建物建設ボタンのイベントリスナー
        const buildButton = this.elements.districtDetails.querySelector('.build-in-district');
        if (buildButton) {
            buildButton.addEventListener('click', () => {
                this._showBuildInDistrictDialog(district);
            });
        }
    }
    
    /**
     * 地区リストを更新する
     */
    updateDistrictsList() {
        if (!this.elements.districtsList) return;
        
        const districts = this.city.getAllDistricts();
        
        if (districts.length === 0) {
            this.elements.districtsList.innerHTML = `
                <div class="no-districts">
                    <p>地区がまだありません。<br>新しい地区を作成してください。</p>
                </div>
            `;
            return;
        }
        
        // 地区リストを生成
        this.elements.districtsList.innerHTML = '';
        
        districts.forEach(district => {
            const listItem = document.createElement('div');
            listItem.className = `district-item ${district.id === this.selectedDistrictId ? 'selected' : ''}`;
            listItem.setAttribute('data-district-id', district.id);
            
            listItem.innerHTML = `
                <div class="district-icon"><i class="fas fa-${this._getDistrictIcon(district.type)}"></i></div>
                <div class="district-item-content">
                    <div class="district-name">${district.name}</div>
                    <div class="district-type">${this._getDistrictTypeName(district.type)} (Lv.${district.level})</div>
                </div>
                <div class="district-population">${district.metrics.population}人</div>
            `;
            
            listItem.addEventListener('click', () => {
                this.showDistrictDetails(district.id);
            });
            
            this.elements.districtsList.appendChild(listItem);
        });
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
        
        // 地区数の表示
        document.querySelectorAll('.districts-count').forEach(el => {
            el.textContent = this.city.districts.length;
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
        
        // 地区関連UIの更新
        this.updateDistrictsList();
        
        // 現在選択中の地区があれば詳細を更新
        if (this.selectedDistrictId) {
            this.showDistrictDetails(this.selectedDistrictId);
        }
        
        // 統計グラフの更新（実装があれば）
        if (this.elements.statsCharts) {
            this._updateStatsCharts();
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
                case 'districtCreated':
                    this._handleDistrictCreatedEvent(detail);
                    break;
                case 'districtUpgraded':
                    this._handleDistrictUpgradedEvent(detail);
                    break;
                case 'districtSpecialized':
                    this._handleDistrictSpecializedEvent(detail);
                    break;
                case 'districtEvent':
                    this._handleDistrictEventEvent(detail);
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
        
        // 地区タブのボタン（存在する場合）
        if (this.elements.districtsActions) {
            // 地区作成ボタン
            this.addActionButton('districts', {
                action: 'create_district',
                icon: 'plus-circle',
                label: '新しい地区を作成',
                callback: () => {
                    this.showCreateDistrictDialog();
                }
            });
            
            // 地区管理ボタン
            this.addActionButton('districts', {
                action: 'manage_districts',
                icon: 'city',
                label: '地区管理',
                callback: () => {
                    this._showDistrictsManagementDialog();
                }
            });
            
            // 都市マップボタン
            this.addActionButton('districts', {
                action: 'city_map',
                icon: 'map',
                label: '都市マップ',
                callback: () => {
                    this._toggleCityMap();
                }
            });
        }
    }
    
    /**
     * 地区の専門化設定ダイアログを表示する
     * @param {Object} district - 対象地区
     * @private
     */
    _showSpecializationDialog(district) {
        // 既存のダイアログがあれば削除
        const existingDialog = document.getElementById('specialization-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }
        
        // 専門化オプションを取得
        const specializations = getSpecializations(district.type);
        if (!specializations || Object.keys(specializations).length === 0) {
            this.addEventToLog({
                title: '専門化設定エラー',
                message: `この地区タイプ（${district.type}）には専門化オプションがありません。`,
                type: 'event-warning',
                icon: 'exclamation-triangle'
            });
            return;
        }
        
        // ダイアログを作成
        const dialog = document.createElement('div');
        dialog.id = 'specialization-dialog';
        dialog.className = 'dialog';
        
        // 専門化オプションの HTML を生成
        const specializationOptions = Object.entries(specializations).map(([id, spec]) => `
            <div class="specialization-option" data-specialization="${id}">
                <div class="specialization-icon"><i class="fas fa-${spec.icon}"></i></div>
                <div class="specialization-content">
                    <h4>${spec.name}</h4>
                    <p>${spec.description}</p>
                    <div class="specialization-effects">
                        ${spec.effects.happiness ? `<span class="effect">幸福度: ${spec.effects.happiness > 0 ? '+' : ''}${spec.effects.happiness}%</span>` : ''}
                        ${spec.effects.environment ? `<span class="effect">環境: ${spec.effects.environment > 0 ? '+' : ''}${spec.effects.environment}%</span>` : ''}
                        ${spec.effects.education ? `<span class="effect">教育: ${spec.effects.education > 0 ? '+' : ''}${spec.effects.education}%</span>` : ''}
                        ${spec.effects.income ? `<span class="effect">収入: ${spec.effects.income > 0 ? '+' : ''}${spec.effects.income}</span>` : ''}
                        ${spec.effects.population ? `<span class="effect">人口: ${spec.effects.population > 0 ? '+' : ''}${spec.effects.population}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2><i class="fas fa-star"></i> 地区の専門化設定</h2>
                <p>「${district.name}」の専門化を選択してください。</p>
                <div class="specialization-options">
                    ${specializationOptions}
                </div>
                <div class="dialog-buttons">
                    <button id="specialization-cancel" class="btn btn-secondary">キャンセル</button>
                    <button id="specialization-none" class="btn btn-secondary">専門化なし</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // キャンセルボタン
        document.getElementById('specialization-cancel').addEventListener('click', () => {
            dialog.remove();
        });
        
        // 専門化なしボタン
        document.getElementById('specialization-none').addEventListener('click', () => {
            this.events.emit('setDistrictSpecializationRequest', {
                districtId: district.id,
                specialization: null
            });
            dialog.remove();
        });
        
        // 専門化オプションのクリックイベント
        dialog.querySelectorAll('.specialization-option').forEach(option => {
            option.addEventListener('click', () => {
                const specialization = option.getAttribute('data-specialization');
                this.events.emit('setDistrictSpecializationRequest', {
                    districtId: district.id,
                    specialization
                });
                dialog.remove();
            });
        });
    }
    
    /**
     * 地区内に建物を建設するダイアログを表示する
     * @param {Object} district - 対象地区
     * @private
     */
    _showBuildInDistrictDialog(district) {
        // 既存のダイアログがあれば削除
        const existingDialog = document.getElementById('build-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }
        
        // 建設可能な建物タイプをフィルタリング
        const compatibleBuildings = Object.entries(GameConfig.BUILDINGS)
            .filter(([key, building]) => {
                const type = key.toLowerCase();
                return district._isCompatibleBuilding(type);
            });
        
        if (compatibleBuildings.length === 0) {
            this.addEventToLog({
                title: '建設エラー',
                message: `この地区タイプ（${district.type}）では建物を建設できません。`,
                type: 'event-warning',
                icon: 'exclamation-triangle'
            });
            return;
        }
        
        // ダイアログを作成
        const dialog = document.createElement('div');
        dialog.id = 'build-dialog';
        dialog.className = 'dialog';
        
        // 建物オプションの HTML を生成
        const buildingOptions = compatibleBuildings.map(([key, building]) => {
            const type = key.toLowerCase();
            const disabled = this.city.funds < building.cost;
            
            return `
                <div class="building-option ${disabled ? 'disabled' : ''}" data-building-type="${type}">
                    <div class="building-icon"><i class="fas fa-${building.icon}"></i></div>
                    <div class="building-content">
                        <h4>${building.name} <span class="cost">(¥${building.cost.toLocaleString()})</span></h4>
                        <p>${building.description}</p>
                        <div class="building-effects">
                            ${building.effects.population ? `<span class="effect">人口: +${building.effects.population}</span>` : ''}
                            ${building.effects.happiness ? `<span class="effect">幸福度: ${building.effects.happiness > 0 ? '+' : ''}${building.effects.happiness}%</span>` : ''}
                            ${building.effects.environment ? `<span class="effect">環境: ${building.effects.environment > 0 ? '+' : ''}${building.effects.environment}%</span>` : ''}
                            ${building.effects.education ? `<span class="effect">教育: +${building.effects.education}%</span>` : ''}
                            ${building.effects.funds ? `<span class="effect">収入: ¥${building.effects.funds}/年</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2><i class="fas fa-hammer"></i> 地区内に建物を建設</h2>
                <p>「${district.name}」に建設する建物を選択してください。</p>
                <div class="building-options">
                    ${buildingOptions}
                </div>
                <div class="dialog-buttons">
                    <button id="build-cancel" class="btn btn-secondary">キャンセル</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // キャンセルボタン
        document.getElementById('build-cancel').addEventListener('click', () => {
            dialog.remove();
        });
        
        // 建物オプションのクリックイベント
        dialog.querySelectorAll('.building-option:not(.disabled)').forEach(option => {
            option.addEventListener('click', () => {
                const buildingType = option.getAttribute('data-building-type');
                this.events.emit('buildInDistrictRequest', {
                    districtId: district.id,
                    type: buildingType
                });
                dialog.remove();
            });
        });
    }
    
    /**
     * 地区管理ダイアログを表示する
     * @private
     */
    _showDistrictsManagementDialog() {
        // 実装省略（必要に応じて実装）
    }
    
    /**
     * 都市マップの表示/非表示を切り替える
     * @private
     */
    _toggleCityMap() {
        if (!this.elements.cityMap) return;
        
        const isVisible = this.elements.cityMap.style.display !== 'none';
        
        if (isVisible) {
            this.elements.cityMap.style.display = 'none';
        } else {
            this.elements.cityMap.style.display = 'block';
            this._updateCityMap();
        }
    }
    
    /**
     * 都市マップを更新する
     * @private
     */
    _updateCityMap() {
        if (!this.elements.cityMap) return;
        
        // 簡易的なグリッドベースのマップを表示
        const mapSize = 10; // 10x10 のグリッド
        let mapHtml = '<div class="city-map-grid">';
        
        // グリッドを生成
        for (let y = 0; y < mapSize; y++) {
            for (let x = 0; x < mapSize; x++) {
                // 座標に該当する地区を探す
                const district = this.city.districts.find(d => 
                    d.position.x === x && d.position.y === y
                );
                
                if (district) {
                    // 地区がある場合
                    mapHtml += `
                        <div class="map-cell district-cell" data-district-id="${district.id}" data-district-type="${district.type}">
                            <i class="fas fa-${this._getDistrictIcon(district.type)}"></i>
                            <span class="district-name">${district.name}</span>
                        </div>
                    `;
                } else {
                    // 空のセル
                    mapHtml += `
                        <div class="map-cell empty-cell" data-x="${x}" data-y="${y}">
                            <i class="fas fa-plus-circle create-here"></i>
                        </div>
                    `;
                }
            }
        }
        
        mapHtml += '</div>';
        this.elements.cityMap.innerHTML = mapHtml;
        
        // 地区セルのクリックイベント
        this.elements.cityMap.querySelectorAll('.district-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const districtId = cell.getAttribute('data-district-id');
                this.showDistrictDetails(districtId);
            });
        });
        
        // 空セルの「ここに作成」ボタンのクリックイベント
        this.elements.cityMap.querySelectorAll('.create-here').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cell = btn.closest('.empty-cell');
                const x = parseInt(cell.getAttribute('data-x'));
                const y = parseInt(cell.getAttribute('data-y'));
                
                this.showCreateDistrictDialog();
                // 位置情報をダイアログに追加（未実装部分）
            });
        });
    }
    
    /**
     * 統計グラフを更新する
     * @private
     */
    _updateStatsCharts() {
        // グラフ更新の実装（必要に応じて）
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
     * 地区の建物リストをレンダリングする
     * @param {Object} district - 地区
     * @returns {string} - HTML文字列
     * @private
     */
    _renderDistrictBuildings(district) {
        // 建物がない場合
        if (!district.buildings || Object.keys(district.buildings).length === 0) {
            return '<li class="no-buildings">建物がまだありません。</li>';
        }
        
        // 建物リストを生成
        return Object.entries(district.buildings)
            .filter(([type, count]) => count > 0)
            .map(([type, count]) => {
                const building = GameConfig.BUILDINGS[type.toUpperCase()];
                if (!building) return '';
                
                return `<li><i class="fas fa-${building.icon}"></i> ${building.name}: <strong>${count}</strong></li>`;
            })
            .join('');
    }
    
    /**
     * 地区タイプのアイコンを取得する
     * @param {string} type - 地区タイプ
     * @returns {string} - アイコン名
     * @private
     */
    _getDistrictIcon(type) {
        const typeConfig = DistrictsConfig.TYPES[type.toUpperCase()];
        return typeConfig?.icon || 'city';
    }
    
    /**
     * 地区タイプの名前を取得する
     * @param {string} type - 地区タイプ
     * @returns {string} - 地区タイプ名
     * @private
     */
    _getDistrictTypeName(type) {
        const typeConfig = DistrictsConfig.TYPES[type.toUpperCase()];
        return typeConfig?.name || type;
    }
    
    /**
     * 地区専門化の名前を取得する
     * @param {string} districtType - 地区タイプ
     * @param {string} specialization - 専門化ID
     * @returns {string} - 専門化名
     * @private
     */
    _getSpecializationName(districtType, specialization) {
        const specs = DistrictsConfig.SPECIALIZATIONS[districtType];
        return specs?.[specialization]?.name || specialization;
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
        
        // 地区内の建設か通常の建設かを判定
        if (detail.districtId) {
            const district = this.city.getDistrict(detail.districtId);
            if (!district) return;
            
            this.addEventToLog({
                title: `${building.name}建設完了`,
                message: `「${district.name}」地区に新しい${building.name}が建設されました。<br>残りの資金: <strong>¥${this.city.funds.toLocaleString()}</strong>`,
                type: 'event-success',
                icon: building.icon
            });
        } else {
            // 通常の建設
            const effectsMessage = this._createBuildingEffectsMessage(detail.buildingType);
            
            this.addEventToLog({
                title: `${building.name}建設完了`,
                message: `新しい${building.name}が建設されました。<br>${effectsMessage}<br>残りの資金: <strong>¥${this.city.funds.toLocaleString()}</strong>`,
                type: 'event-success',
                icon: building.icon
            });
        }
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
        // 地区からの収入を含む形に拡張
        let message = `
            収入内訳:<br>
            - 税収: <strong>¥${detail.taxIncome.toLocaleString()}</strong><br>
            - 工場収入: <strong>¥${detail.factoryIncome.toLocaleString()}</strong>
        `;
        
        // 地区からの収入があれば追加
        if (detail.districtIncome) {
            message += `<br>- 地区収入: <strong>¥${detail.districtIncome.toLocaleString()}</strong>`;
        }
        
        message += `<br>合計: <strong>¥${detail.totalIncome.toLocaleString()}</strong>`;
        
        this.addEventToLog({
            title: `${detail.newYear}年の新年を迎えました`,
            message,
            type: 'event-info',
            icon: 'calendar-alt'
        });
    }
    
    /**
     * 地区作成イベントを処理する
     * @param {Object} detail - イベント詳細
     * @private
     */
    _handleDistrictCreatedEvent(detail) {
        const district = detail.district;
        if (!district) return;
        
        // 地区タイプ情報を取得
        const typeConfig = DistrictsConfig.TYPES[district.type.toUpperCase()];
        if (!typeConfig) return;
        
        this.addEventToLog({
            title: '新しい地区が作成されました',
            message: `「${district.name}」地区が作成されました。<br>タイプ: <strong>${typeConfig.name}</strong><br>残りの資金: <strong>¥${this.city.funds.toLocaleString()}</strong>`,
            type: 'event-success',
            icon: typeConfig.icon
        });
        
        // 地区リストを更新
        this.updateDistrictsList();
        
        // 新しい地区の詳細を表示
        this.showDistrictDetails(district.id);
    }
    
    /**
     * 地区アップグレードイベントを処理する
     * @param {Object} detail - イベント詳細
     * @private
     */
    _handleDistrictUpgradedEvent(detail) {
        const district = this.city.getDistrict(detail.districtId);
        if (!district) return;
        
        this.addEventToLog({
            title: '地区アップグレード',
            message: `「${district.name}」地区がレベル ${detail.newLevel} にアップグレードされました。`,
            type: 'event-success',
            icon: 'arrow-up'
        });
    }
    
    /**
     * 地区専門化イベントを処理する
     * @param {Object} detail - イベント詳細
     * @private
     */
    _handleDistrictSpecializedEvent(detail) {
        const district = this.city.getDistrict(detail.districtId);
        if (!district) return;
        
        const specializationName = this._getSpecializationName(district.type, detail.specialization);
        
        this.addEventToLog({
            title: '地区専門化',
            message: `「${district.name}」地区の専門化が「${specializationName}」に設定されました。`,
            type: 'event-success',
            icon: 'star'
        });
    }
    
    /**
     * 地区イベントを処理する
     * @param {Object} detail - イベント詳細
     * @private
     */
    _handleDistrictEventEvent(detail) {
        const district = this.city.getDistrict(detail.districtId);
        if (!district) return;
        
        this.addEventToLog({
            title: `地区イベント: ${district.name}`,
            message: `「${district.name}」地区で「${detail.event}」イベントが発生しました。`,
            type: 'event-info',
            icon: 'bolt'
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
                // 地区作成
                if (this.elements.districtsActions) {
                    this.showCreateDistrictDialog();
                }
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
        // 基本情報
        let message = `
            <strong>年:</strong> ${this.city.year}年<br>
            <strong>人口:</strong> ${this.city.population}人<br>
            <strong>資金:</strong> ¥${this.city.funds.toLocaleString()}<br>
            <strong>幸福度:</strong> ${this.city.happiness}%<br>
            <strong>環境:</strong> ${this.city.environment}%<br>
            <strong>教育:</strong> ${this.city.education}%<br>
            <strong>税率:</strong> ${(this.city.taxRate * 100).toFixed(2)}%<br>
        `;
        
        // 建物情報
        message += `
            <strong>建物:</strong><br>
            - 住宅: ${this.city.buildings.house}<br>
            - 工場: ${this.city.buildings.factory}<br>
            - 道路: ${this.city.buildings.road}<br>
            - 学校: ${this.city.buildings.school}<br>
            - 公園: ${this.city.buildings.park}<br>
            - 病院: ${this.city.buildings.hospital}<br>
        `;
        
        // 地区情報
        if (this.city.districts.length > 0) {
            message += `<strong>地区:</strong> ${this.city.districts.length}地区<br>`;
            
            // 地区タイプごとの数をカウント
            const districtCounts = {};
            this.city.districts.forEach(district => {
                if (!districtCounts[district.type]) {
                    districtCounts[district.type] = 0;
                }
                districtCounts[district.type]++;
            });
            
            // 地区タイプごとの数を表示
            Object.entries(districtCounts).forEach(([type, count]) => {
                const typeName = this._getDistrictTypeName(type);
                message += `- ${typeName}: ${count}<br>`;
            });
        }
        
        this.addEventToLog({
            title: '都市の詳細情報',
            message,
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
        
        // 地区作成ボタンの状態を更新
        const createDistrictButtons = document.querySelectorAll('[data-action="create_district"]');
        createDistrictButtons.forEach(btn => {
            // 地区数が上限に達した場合は無効化
            if (this.city.districts.length >= DistrictsConfig.MAX_DISTRICTS) {
                btn.classList.add('disabled');
                btn.setAttribute('disabled', 'disabled');
                
                if (btn.querySelector('.info-indicator')) {
                    btn.querySelector('.info-indicator').textContent = '地区数上限に達しました';
                }
            } else {
                btn.classList.remove('disabled');
                btn.removeAttribute('disabled');
                
                if (btn.querySelector('.info-indicator')) {
                    btn.querySelector('.info-indicator').textContent = '';
                }
            }
        });
    }
}
