/**
 * CitySim - UIController クラス
 * ユーザーインターフェースの制御を担当
 */

import { EventEmitter } from '../services/EventEmitter.js';
import { CityMapView } from '../views/CityMapView.js';
import { getDistrictTypes } from '../config/DistrictsConfig.js';

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
            // 時計表示
            clock: document.getElementById('clock'),
            timeProgressBar: document.getElementById('time-progress-bar'),
            
            // ステータス表示
            yearValue: document.querySelectorAll('.year-value'),
            populationValue: document.querySelectorAll('.population-value'),
            fundsValue: document.querySelectorAll('.funds-value'),
            districtsCount: document.querySelectorAll('.districts-count'),
            housesValue: document.querySelector('.houses-value'),
            factoriesValue: document.querySelector('.factories-value'),
            roadsValue: document.querySelector('.roads-value'),
            happinessValue: document.querySelector('.happiness-value'),
            environmentValue: document.querySelector('.environment-value'),
            educationValue: document.querySelector('.education-value'),
            taxValue: document.querySelector('.tax-value'),
            
            // プログレスバー
            happinessBar: document.getElementById('happiness-bar'),
            environmentBar: document.getElementById('environment-bar'),
            educationBar: document.getElementById('education-bar'),
            
            // ゲームログ (サイドバーに移動したので両方対応)
            gameOutput: document.getElementById('game-output') || document.getElementById('game-output-sidebar'),
            fixedEvents: document.getElementById('fixed-events'),
            
            // タブと操作ボタン
            tabButtons: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content'),
            buildActions: document.getElementById('build-actions'),
            economyActions: document.getElementById('economy-actions'),
            policyActions: document.getElementById('policy-actions'),
            districtsActions: document.getElementById('districts-actions'),
            
            // 地区関連
            districtsList: document.getElementById('districts-list'),
            districtDetails: document.getElementById('district-details'),
            districtDetailsContainer: document.getElementById('district-details-container'),
            
            // 都市マップ
            cityMap: document.getElementById('city-map'),
            
            // 統計グラフ
            statsChartsContainer: document.getElementById('stats-charts-container'),
            chartCanvas: document.getElementById('chart-canvas'),
            chartTabs: document.querySelectorAll('.chart-tab')
        };
        
        // CityMapViewをnullで初期化
        this.cityMapView = null;
    }
    
    /**
     * Application lifecycle init
     * @param {Application} app
     */
    init(app) {
        // initialize UI and listeners
        this._initializeUI();
        this._setupEventListeners();
        this._setupCityChangeListeners();
        // 初回の地区リスト表示
        this._renderDistrictList();
    }
    
    /**
     * UIの初期化
     * @private
     */
    _initializeUI() {
        // 時計を更新
        this.updateClock();
        
        // 統計表示を更新
        this.updateAllStatDisplays();
        
        // アクションボタンを初期化
        this._initializeActionButtons();
        
        // CityMapViewの初期化
        if (this.elements.cityMap) {
            this.elements.cityMap.style.display = 'block';
            this.cityMapView = new CityMapView(this.elements.cityMap, this.city);
            this.cityMapView.setTileClickCallback((x, y, district) => {
                if (district) {
                    this.showDistrictDetails(district.id);
                } else {
                    // 空のタイルをクリックした場合の処理
                    this._showCreateDistrictAtDialog(x, y);
                }
            });
        }
    }
    
    /**
     * アクションボタンを初期化する
     * @private
     */
    _initializeActionButtons() {
        // 建設タブのアクションボタン
        if (this.elements.buildActions) {
            this.elements.buildActions.innerHTML = `
                <button class="action-btn" data-action="build_house">
                    <i class="fas fa-home"></i>
                    <span>住宅を建設</span>
                    <span class="action-cost">¥1,000</span>
                </button>
                <button class="action-btn" data-action="build_factory">
                    <i class="fas fa-industry"></i>
                    <span>工場を建設</span>
                    <span class="action-cost">¥2,500</span>
                </button>
                <button class="action-btn" data-action="build_road">
                    <i class="fas fa-road"></i>
                    <span>道路を建設</span>
                    <span class="action-cost">¥500</span>
                </button>
                <button class="action-btn" data-action="build_park">
                    <i class="fas fa-tree"></i>
                    <span>公園を建設</span>
                    <span class="action-cost">¥1,500</span>
                </button>
                <button class="action-btn" data-action="build_school">
                    <i class="fas fa-school"></i>
                    <span>学校を建設</span>
                    <span class="action-cost">¥3,000</span>
                </button>
            `;
            
            // アクションボタンのイベントリスナーを設定
            this.elements.buildActions.querySelectorAll('.action-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const action = button.getAttribute('data-action');
                    this.events.emit('actionSelected', { action });
                });
            });
        }
        
        // 経済タブのアクションボタン
        if (this.elements.economyActions) {
            this.elements.economyActions.innerHTML = `
                <div class="tax-slider-container">
                    <label for="tax-rate-slider">税率: <span id="tax-rate-value">10%</span></label>
                    <input type="range" id="tax-rate-slider" min="0" max="30" value="10" step="1">
                </div>
                <button class="action-btn" data-action="set_tax_rate">
                    <i class="fas fa-percentage"></i>
                    <span>税率を設定</span>
                </button>
                <button class="action-btn" data-action="request_loan">
                    <i class="fas fa-hand-holding-usd"></i>
                    <span>ローンを申請</span>
                </button>
                <button class="action-btn" data-action="show_finances">
                    <i class="fas fa-file-invoice-dollar"></i>
                    <span>財務状況を表示</span>
                </button>
            `;
            
            // 税率スライダー
            const taxSlider = document.getElementById('tax-rate-slider');
            const taxValue = document.getElementById('tax-rate-value');
            
            if (taxSlider && taxValue) {
                taxSlider.value = this.city.taxRate;
                taxValue.textContent = `${this.city.taxRate}%`;
                
                taxSlider.addEventListener('input', () => {
                    taxValue.textContent = `${taxSlider.value}%`;
                });
            }
            
            // アクションボタンのイベントリスナーを設定
            this.elements.economyActions.querySelectorAll('.action-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const action = button.getAttribute('data-action');
                    if (action === 'set_tax_rate' && taxSlider) {
                        this.events.emit('actionSelected', { 
                            action,
                            params: { taxRate: parseInt(taxSlider.value, 10) }
                        });
                    } else {
                        this.events.emit('actionSelected', { action });
                    }
                });
            });
        }
        
        // 政策タブのアクションボタン
        if (this.elements.policyActions) {
            this.elements.policyActions.innerHTML = `
                <button class="action-btn primary-action" data-action="next_year">
                    <i class="fas fa-forward"></i>
                    <span>次の年へ進む</span>
                </button>
                <button class="action-btn" data-action="education_policy">
                    <i class="fas fa-graduation-cap"></i>
                    <span>教育政策</span>
                </button>
                <button class="action-btn" data-action="environment_policy">
                    <i class="fas fa-leaf"></i>
                    <span>環境政策</span>
                </button>
                <button class="action-btn" data-action="safety_policy">
                    <i class="fas fa-shield-alt"></i>
                    <span>安全政策</span>
                </button>
                <button class="action-btn" data-action="clicker_mode">
                    <i class="fas fa-coins"></i>
                    <span>クリッカーモード</span>
                </button>
            `;
            
            // アクションボタンのイベントリスナーを設定
            this.elements.policyActions.querySelectorAll('.action-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const action = button.getAttribute('data-action');
                    this.events.emit('actionSelected', { action });
                });
            });
        }
        
        // 地区タブのアクションボタン
        if (this.elements.districtsActions) {
            this.elements.districtsActions.innerHTML = `
                <button class="action-btn primary-action" data-action="show_city_map">
                    <i class="fas fa-map"></i>
                    <span>都市マップを表示</span>
                </button>
                <button class="action-btn" data-action="create_district">
                    <i class="fas fa-plus-circle"></i>
                    <span>新しい地区を作成</span>
                </button>
                <button class="action-btn" data-action="manage_districts">
                    <i class="fas fa-cogs"></i>
                    <span>地区を管理</span>
                </button>
            `;
            
            // アクションボタンのイベントリスナーを設定
            this.elements.districtsActions.querySelectorAll('.action-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const action = button.getAttribute('data-action');
                    // Toggle map display for both show and manage actions
                    if (action === 'show_city_map' || action === 'manage_districts') {
                        this._toggleCityMap();
                    } else {
                        this.events.emit('actionSelected', { action });
                    }
                });
            });
        }
    }
    
    /**
     * イベントリスナーを設定する
     * @private
     */
    _setupEventListeners() {
        // タブ切り替え
        this.elements.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                this._switchTab(tabName);
            });
        });
        
        // チャートタブ切り替え
        if (this.elements.chartTabs) {
            this.elements.chartTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const chartType = tab.getAttribute('data-chart');
                    this._switchChartTab(chartType);
                    // グラフをレンダリング
                    this._renderChart(chartType);
                });
            });
        }
        
        // 統計グラフ表示ボタン
        const showStatsChartsBtn = document.getElementById('show-stats-charts');
        if (showStatsChartsBtn) {
            showStatsChartsBtn.addEventListener('click', () => {
                this._toggleStatsCharts();
            });
        }
        
        // 統計データエクスポートボタン
        const exportStatsBtn = document.getElementById('export-stats');
        if (exportStatsBtn) {
            exportStatsBtn.addEventListener('click', () => {
                this.events.emit('exportStatsRequest');
            });
        }
    }
    
    /**
     * タブを切り替える
     * @param {string} tabName - タブ名
     * @private
     */
    _switchTab(tabName) {
        // すべてのタブボタンから active クラスを削除
        this.elements.tabButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        // すべてのタブコンテンツを非表示
        this.elements.tabContents.forEach(content => {
            content.classList.add('hidden');
        });
        
        // 指定したタブをアクティブにする
        const activeTabButton = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        if (activeTabButton) {
            activeTabButton.classList.add('active');
        }
        
        // 指定したタブコンテンツを表示
        const activeTabContent = document.getElementById(`${tabName}-tab`);
        if (activeTabContent) {
            activeTabContent.classList.remove('hidden');
        }
        
        // タブ変更イベントを発火
        this.events.emit('tabChanged', { tab: tabName });
    }
    
    /**
     * チャートタブを切り替える
     * @param {string} chartType - チャートタイプ
     * @private
     */
    _switchChartTab(chartType) {
        // すべてのチャートタブから active クラスを削除
        this.elements.chartTabs.forEach(tab => {
            tab.classList.remove('active');
        });
        
        // 指定したチャートタブをアクティブにする
        const activeChartTab = document.querySelector(`.chart-tab[data-chart="${chartType}"]`);
        if (activeChartTab) {
            activeChartTab.classList.add('active');
        }
        
        // チャート変更イベントを発火
        this.events.emit('chartTypeChanged', { type: chartType });
    }
    
    /**
     * 統計グラフの表示/非表示を切り替える
     * @private
     */
    _toggleStatsCharts() {
        if (!this.elements.statsChartsContainer) return;
        
        const isVisible = this.elements.statsChartsContainer.style.display !== 'none';
        
        if (isVisible) {
            this.elements.statsChartsContainer.style.display = 'none';
        } else {
            this.elements.statsChartsContainer.style.display = 'block';
            
            // 最初のチャートタブをアクティブにする
            const firstChartTab = document.querySelector('.chart-tab');
            if (firstChartTab) {
                const chartType = firstChartTab.getAttribute('data-chart');
                this._switchChartTab(chartType);
                this._renderChart(chartType);
            }
        }
    }
    
    /**
     * 都市の変更をリッスンする
     * @private
     */
    _setupCityChangeListeners() {
        this.city.events.on('change', (data) => {
            // 統計とUI表示を更新
            this.updateAllStatDisplays();
            
            switch (data.type) {
                case 'districtCreated':
                case 'districtUpgraded':
                case 'districtSpecialized':
                    // 地区関連の変更があった場合はマップを更新
                    if (this.cityMapView) {
                        this.cityMapView.update();
                    }
                    // 地区リストを更新
                    this._renderDistrictList();
                    break;
                // 他のケース
            }
        });
    }
    
    /**
     * すべての統計表示を更新する
     */
    updateAllStatDisplays() {
        if (!this.city) return;
        
        // 年を更新
        this.elements.yearValue.forEach(el => {
            if (el) el.textContent = `${this.city.year}年`;
        });
        
        // 人口を更新
        this.elements.populationValue.forEach(el => {
            if (el) el.textContent = this.city.population.toLocaleString();
        });
        
        // 資金を更新
        this.elements.fundsValue.forEach(el => {
            if (el) el.textContent = `¥${this.city.funds.toLocaleString()}`;
        });
        
        // 地区数を更新
        this.elements.districtsCount.forEach(el => {
            if (el) el.textContent = this.city.districts ? this.city.districts.length : 0;
        });
        
        // その他の統計を更新
        if (this.elements.housesValue) {
            this.elements.housesValue.textContent = this.city.buildings && this.city.buildings.house ? this.city.buildings.house : 0;
        }
        
        if (this.elements.factoriesValue) {
            this.elements.factoriesValue.textContent = this.city.buildings && this.city.buildings.factory ? this.city.buildings.factory : 0;
        }
        
        if (this.elements.roadsValue) {
            this.elements.roadsValue.textContent = this.city.buildings && this.city.buildings.road ? this.city.buildings.road : 0;
        }
        
        if (this.elements.happinessValue) {
            this.elements.happinessValue.textContent = `${this.city.happiness}%`;
        }
        
        if (this.elements.environmentValue) {
            this.elements.environmentValue.textContent = `${this.city.environment}%`;
        }
        
        if (this.elements.educationValue) {
            this.elements.educationValue.textContent = `${this.city.education}%`;
        }
        
        if (this.elements.taxValue) {
            this.elements.taxValue.textContent = `${this.city.taxRate}%`;
        }
        
        // プログレスバーを更新
        if (this.elements.happinessBar) {
            this.elements.happinessBar.style.width = `${this.city.happiness}%`;
        }
        
        if (this.elements.environmentBar) {
            this.elements.environmentBar.style.width = `${this.city.environment}%`;
        }
        
        if (this.elements.educationBar) {
            this.elements.educationBar.style.width = `${this.city.education}%`;
        }
    }
    
    /**
     * 時計を更新する
     */
    updateClock() {
        if (!this.elements.clock || !this.timeManager) return;
        
        const { year, month, day, hour } = this.timeManager.getCurrentTime();
        this.elements.clock.textContent = `${year}年 ${month}月 ${day}日 ${hour}時`;
    }
    
    /**
     * ゲームログにイベントを追加する
     * @param {Object} event - イベントデータ
     */
    addEventToLog(event) {
        if (!this.elements.gameOutput) return;
        
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const eventElement = document.createElement('p');
        eventElement.className = event.type || 'event-info';
        eventElement.innerHTML = `
            <span class="event-time">${timeString}</span>
            <span class="event-title"><i class="fas fa-${event.icon || 'info-circle'}"></i> ${event.title}</span>
            <span class="event-message">${event.message}</span>
        `;
        
        // ログの先頭に追加
        this.elements.gameOutput.insertBefore(eventElement, this.elements.gameOutput.firstChild);
    }
    
    /**
     * 固定イベント領域に通知を追加する
     * @param {Object} event - イベントデータ
     */
    addFixedEvent(event) {
        if (!this.elements.fixedEvents) return;
        const eventEl = document.createElement('p');
        eventEl.className = event.type || 'event-info';
        eventEl.innerHTML = `
            <i class="fas fa-${event.icon || 'bell'}"></i>
            <span class="fixed-event-title">${event.title}</span>
            <span class="fixed-event-message">${event.message}</span>
        `;
        // 古い通知を5件まで保持
        this.elements.fixedEvents.appendChild(eventEl);
        const children = this.elements.fixedEvents.children;
        if (children.length > 5) {
            this.elements.fixedEvents.removeChild(children[0]);
        }
    }

    /**
     * 地区詳細を表示する
     * @param {string} districtId - 地区ID
     */
    showDistrictDetails(districtId) {
        if (!this.elements.districtDetails || !this.city) return;
        
        // 対象の地区を取得
        const district = this.city.districts.find(d => d.id === districtId);
        if (!district) return;
        
        // 地区詳細を構築
        this.elements.districtDetails.innerHTML = `
            <div class="district-header">
                <h3 class="district-name">${district.name}</h3>
                <span class="district-type ${district.type}">${this._getDistrictTypeName(district.type)}</span>
                <span class="district-level">レベル ${district.level}</span>
            </div>
            
            <div class="district-body">
                <div class="district-stats">
                    <div class="district-stat">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>位置: (${district.position.x}, ${district.position.y})</span>
                    </div>
                    <div class="district-stat">
                        <i class="fas fa-users"></i>
                        <span>人口: ${district.population || 0} 人</span>
                    </div>
                    <div class="district-stat">
                        <i class="fas fa-building"></i>
                        <span>建物: ${this._getDistrictBuildingsCount(district)} 棟</span>
                    </div>
                </div>
                
                <div class="district-actions">
                    <button class="btn" data-action="upgrade-district" data-district-id="${district.id}">
                        <i class="fas fa-arrow-up"></i> アップグレード
                        <span class="cost">¥${this._getDistrictUpgradeCost(district)}</span>
                    </button>
                    <button class="btn" data-action="add-building" data-district-id="${district.id}">
                        <i class="fas fa-plus"></i> 建物を追加
                    </button>
                    <button class="btn btn-secondary" data-action="view-district" data-district-id="${district.id}">
                        <i class="fas fa-search"></i> 詳細を表示
                    </button>
                </div>
            </div>
        `;
        
        // ボタンにイベントリスナーを設定
        const buttons = this.elements.districtDetails.querySelectorAll('button[data-action]');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                const districtId = button.getAttribute('data-district-id');
                
                this.events.emit('districtActionSelected', {
                    action,
                    districtId
                });
            });
        });
        
        // コンテナを表示
        this.elements.districtDetailsContainer.style.display = 'block';
    }
    
    /**
     * 地区のタイプ名を取得する
     * @param {string} type - 地区タイプ
     * @returns {string} - 地区タイプ名
     * @private
     */
    _getDistrictTypeName(type) {
        const districtTypes = getDistrictTypes();
        const districtType = districtTypes.find(t => t.id === type);
        return districtType ? districtType.name : type;
    }
    
    /**
     * 地区の建物数を取得する
     * @param {Object} district - 地区オブジェクト
     * @returns {number} - 建物の総数
     * @private
     */
    _getDistrictBuildingsCount(district) {
        if (!district.buildings) return 0;
        
        return Object.values(district.buildings).reduce((total, count) => total + count, 0);
    }
    
    /**
     * 地区のアップグレードコストを取得する
     * @param {Object} district - 地区オブジェクト
     * @returns {number} - アップグレードコスト
     * @private
     */
    _getDistrictUpgradeCost(district) {
        const districtTypes = getDistrictTypes();
        const districtType = districtTypes.find(t => t.id === district.type);
        
        if (!districtType) return 0;
        
        // レベルに応じたコスト倍率
        const levelMultiplier = Math.pow(2, district.level);
        return districtType.cost * levelMultiplier;
    }
    
    /**
     * 指定位置に地区を作成するダイアログを表示する
     * @param {number} x - マップ上のX座標
     * @param {number} y - マップ上のY座標
     * @private
     */
    _showCreateDistrictAtDialog(x, y) {
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
                <h2><i class="fas fa-city"></i> マップ位置(${x}, ${y})に地区を作成</h2>
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
            
            // Emit request to create district (GameController will handle cost check)
            this.events.emit('createDistrictRequest', {
                name: name || null,
                type,
                position: { x, y }
            });
            
            // Close dialog
            dialog.remove();
        });
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
            
            // マップの初期化または更新
            if (!this.cityMapView) {
                this.cityMapView = new CityMapView(this.elements.cityMap, this.city);
                this.cityMapView.setTileClickCallback((x, y, district) => {
                    if (district) {
                        this.showDistrictDetails(district.id);
                    } else {
                        this._showCreateDistrictAtDialog(x, y);
                    }
                });
            } else {
                this.cityMapView.update();
            }
        }
    }

    /**
     * 建物追加ダイアログを表示する
     * @param {string} districtId - 地区ID
     */
    showAddBuildingDialog(districtId) {
        // ユーザーに建物タイプを入力してもらう
        const type = prompt('地区に追加する建物タイプを入力してください（例: house, factory, road, school, park, hospital）:');
        if (!type) return;
        // リクエストを発行
        this.events.emit('buildInDistrictRequest', { type, districtId });
        // 地区詳細を再表示
        this.showDistrictDetails(districtId);
    }

    /**
     * 地区リストを表示する
     * @private
     */
    _renderDistrictList() {
        const container = this.elements.districtsList;
        if (!container || !this.city) return;
        container.innerHTML = '';
        this.city.districts.forEach(district => {
            const item = document.createElement('div');
            item.className = 'district-item';
            item.dataset.id = district.id;
            item.innerHTML = `
                <div class="district-icon"><i class="fas fa-${district.type === 'residential' ? 'home' : district.type === 'commercial' ? 'store' : district.type === 'industrial' ? 'industry' : district.type === 'education' ? 'graduation-cap' : 'leaf'}"></i></div>
                <div class="district-item-content">
                    <div class="district-name">${district.name}</div>
                    <div class="district-type">${district.type}</div>
                </div>
            `;
            item.addEventListener('click', () => {
                // サイドバーから地区詳細表示
                this.showDistrictDetails(district.id);
            });
            container.appendChild(item);
        });
    }

    /**
     * グラフを描画する
     * @param {string} type - チャートタイプ
     * @private
     */
    _renderChart(type) {
        if (!window.Chart) return;
        const canvas = this.elements.chartCanvas;
        const ctx = canvas ? canvas.getContext('2d') : null;
        if (!ctx) return;
        // 統計データ
        const stats = this.city.statistics[type] || [];
        const labels = stats.map(s => s.year);
        const data = stats.map(s => s.value);
        // 既存チャート破棄
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [{ label: type, data, borderColor: 'var(--primary-color)', backgroundColor: 'rgba(52,152,219,0.2)', fill: true }] },
            options: { responsive: true, scales: { x: { title: { display: true, text: '年' }}, y: { title: { display: true, text: type }}} }
        });
    }
}