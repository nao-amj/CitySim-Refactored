// UIController.jsの既存コードに以下を追加
// ※ファイルが大きいため、必要な部分だけを修正します

// 以下の行をimport部分に追加
import { CityMapView } from '../views/CityMapView.js';

// constructor内のthis.elementsに以下を追加
this.cityMapView = null;

// _initializeUI()メソッド内に以下を追加
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

// 以下の新しいメソッドを追加
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

// _toggleCityMap()メソッドを以下に置き換え
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

// _setupCityChangeListeners()メソッド内のcity.events.on('change', ...)のcase部分に追加
case 'districtCreated':
case 'districtUpgraded':
case 'districtSpecialized':
    // 地区関連の変更があった場合はマップを更新
    if (this.cityMapView) {
        this.cityMapView.update();
    }
    break;
