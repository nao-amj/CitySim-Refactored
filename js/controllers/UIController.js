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
            
            // ゲームログ
            gameOutput: document.getElementById('game-output'),
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
            chartDisplay: document.getElementById('chart-display'),
            chartTabs: document.querySelectorAll('.chart-tab')
        };
        
        // CityMapViewをnullで初期化
        this.cityMapView = null;
        
        // 初期化
        this._initializeUI();
        this._setupEventListeners();
        this._setupCityChangeListeners();
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
        // ここに実装を追加
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
        
        // その他のイベントリスナー
    }
    
    /**
     * タブを切り替える
     * @param {string} tabName - タブ名
     * @private
     */
    _switchTab(tabName) {
        // ここに実装を追加
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
     * 地区詳細を表示する
     * @param {string} districtId - 地区ID
     */
    showDistrictDetails(districtId) {
        // ここに実装を追加
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
            
            // イベント発火
            this.events.emit('createDistrictRequest', {
                name: name || null, // 空の場合はnullでデフォルト名を使用
                type,
                position: { x, y }
            });
            
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
}
