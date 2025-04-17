/**
 * CitySim - CityMapView クラス
 * 都市マップの視覚的表現を担当
 */

export class CityMapView {
    /**
     * 都市マップビューの初期化
     * @param {HTMLElement} container - マップを表示するコンテナ要素
     * @param {City} city - 都市モデル
     */
    constructor(container, city) {
        this.container = container;
        this.city = city;
        this.mapSize = 10; // 10x10 のグリッド
        this.selectedPosition = null;
        this.hoverPosition = null;
        this.tileSize = 64; // タイルサイズ（ピクセル）
        this.mapElement = null;
        this.canvas = null;
        this.ctx = null;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.mapOffset = { x: 0, y: 0 };
        this.scale = 1.0;
        this.minScale = 0.5;
        this.maxScale = 2.0;
        
        // イベントリスナー
        this.onTileClick = null;
        this.onTileHover = null;
        
        // スプライトリソース
        this.sprites = {
            tiles: new Image(),
            buildings: new Image(),
            ui: new Image()
        };
        
        // タイルタイプ定義
        this.tileTypes = {
            empty: { x: 0, y: 0 },
            residential: { x: 1, y: 0 },
            commercial: { x: 2, y: 0 },
            industrial: { x: 3, y: 0 },
            education: { x: 4, y: 0 },
            eco: { x: 0, y: 1 }
        };
        
        // 建物スプライト定義
        this.buildingSprites = {
            house: { x: 0, y: 0 },
            factory: { x: 1, y: 0 },
            road: { x: 2, y: 0 },
            school: { x: 3, y: 0 },
            park: { x: 4, y: 0 },
            hospital: { x: 5, y: 0 }
        };
        
        // UIスプライト定義
        this.uiSprites = {
            selected: { x: 0, y: 0 },
            highlight: { x: 1, y: 0 },
            create: { x: 2, y: 0 }
        };
        
        // スプライト画像のロード
        this.loadSprites();
        
        // 初期化
        this._initMap();
    }
    
    /**
     * スプライト画像をロードする
     */
    loadSprites() {
        this.sprites.tiles.src = 'assets/tiles.svg';
        this.sprites.buildings.src = 'assets/buildings.svg';
        this.sprites.ui.src = 'assets/ui-elements.svg';
        
        // すべての画像がロードされたらマップを描画
        Promise.all([
            new Promise(resolve => this.sprites.tiles.onload = resolve),
            new Promise(resolve => this.sprites.buildings.onload = resolve),
            new Promise(resolve => this.sprites.ui.onload = resolve)
        ]).then(() => {
            this.render();
        }).catch(error => {
            console.error('スプライトの読み込みに失敗しました。デフォルト表示を使用します。', error);
            this.render(); // エラー時はデフォルト表示
        });
    }
    
    /**
     * マップを初期化する
     * @private
     */
    _initMap() {
        // コンテナをクリア
        this.container.innerHTML = '';
        
        // マップ要素の作成
        this.mapElement = document.createElement('div');
        this.mapElement.className = 'city-map-container';
        
        // キャンバスの作成
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.mapSize * this.tileSize;
        this.canvas.height = this.mapSize * this.tileSize;
        this.canvas.className = 'city-map-canvas';
        this.ctx = this.canvas.getContext('2d');
        
        // コントロールパネルの作成
        const controlPanel = document.createElement('div');
        controlPanel.className = 'map-controls';
        controlPanel.innerHTML = `
            <button class="map-control-btn" id="zoom-in"><i class="fas fa-search-plus"></i></button>
            <button class="map-control-btn" id="zoom-out"><i class="fas fa-search-minus"></i></button>
            <button class="map-control-btn" id="reset-view"><i class="fas fa-home"></i></button>
        `;
        
        // マップコンテナに追加
        this.mapElement.appendChild(this.canvas);
        this.mapElement.appendChild(controlPanel);
        this.container.appendChild(this.mapElement);
        
        // イベントリスナーを追加
        this._setupEventListeners();
    }
    
    /**
     * イベントリスナーを設定する
     * @private
     */
    _setupEventListeners() {
        // クリックイベント
        this.canvas.addEventListener('click', (e) => {
            if (this.isDragging) return; // ドラッグ中はクリックを無視
            
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / this.scale - this.mapOffset.x;
            const y = (e.clientY - rect.top) / this.scale - this.mapOffset.y;
            
            const tileX = Math.floor(x / this.tileSize);
            const tileY = Math.floor(y / this.tileSize);
            
            if (tileX >= 0 && tileX < this.mapSize && tileY >= 0 && tileY < this.mapSize) {
                this.selectedPosition = { x: tileX, y: tileY };
                
                if (this.onTileClick) {
                    const district = this._getDistrictAt(tileX, tileY);
                    this.onTileClick(tileX, tileY, district);
                }
                
                this.render(); // 選択を反映して再描画
            }
        });
        
        // マウス移動イベント
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / this.scale - this.mapOffset.x;
            const y = (e.clientY - rect.top) / this.scale - this.mapOffset.y;
            
            const tileX = Math.floor(x / this.tileSize);
            const tileY = Math.floor(y / this.tileSize);
            
            // ドラッグ処理
            if (this.isDragging) {
                const deltaX = (e.clientX - this.dragStart.x) / this.scale;
                const deltaY = (e.clientY - this.dragStart.y) / this.scale;
                
                this.mapOffset.x += deltaX;
                this.mapOffset.y += deltaY;
                
                this.dragStart.x = e.clientX;
                this.dragStart.y = e.clientY;
                
                this.render();
                return;
            }
            
            // ホバー位置の更新
            if (tileX >= 0 && tileX < this.mapSize && tileY >= 0 && tileY < this.mapSize) {
                // 前回と同じホバー位置なら処理をスキップ
                if (this.hoverPosition && this.hoverPosition.x === tileX && this.hoverPosition.y === tileY) {
                    return;
                }
                
                this.hoverPosition = { x: tileX, y: tileY };
                
                // ホバーコールバック
                if (this.onTileHover) {
                    const district = this._getDistrictAt(tileX, tileY);
                    this.onTileHover(tileX, tileY, district);
                }
                
                // カーソルスタイルの変更
                this.canvas.style.cursor = 'pointer';
                
                // ホバーを反映して再描画
                this.render();
            } else {
                // マップ外にマウスが移動した場合
                if (this.hoverPosition !== null) {
                    this.hoverPosition = null;
                    this.canvas.style.cursor = 'default';
                    this.render();
                }
            }
        });
        
        // マウス離脱イベント（ホバー状態の解除）
        this.canvas.addEventListener('mouseleave', () => {
            if (this.hoverPosition !== null) {
                this.hoverPosition = null;
                this.canvas.style.cursor = 'default';
                this.render();
            }
        });
        
        // マウスダウンイベント（ドラッグ開始）
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // 中クリックまたはCtrl+左クリック
                this.isDragging = true;
                this.dragStart.x = e.clientX;
                this.dragStart.y = e.clientY;
                this.canvas.style.cursor = 'grabbing';
            }
        });
        
        // マウスアップイベント（ドラッグ終了）
        window.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.canvas.style.cursor = 'default';
            }
        });
        
        // ホイールイベント（ズーム）
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // マウス位置を基準にズーム
            const oldScale = this.scale;
            if (e.deltaY < 0) {
                // ズームイン
                this.scale = Math.min(this.maxScale, this.scale * 1.1);
            } else {
                // ズームアウト
                this.scale = Math.max(this.minScale, this.scale / 1.1);
            }
            
            // ズームに合わせてオフセットを調整
            const scaleRatio = this.scale / oldScale;
            this.mapOffset.x = mouseX / this.scale - (mouseX / oldScale - this.mapOffset.x) * scaleRatio;
            this.mapOffset.y = mouseY / this.scale - (mouseY / oldScale - this.mapOffset.y) * scaleRatio;
            
            this.render();
        });
        
        // ズームボタン
        const zoomInBtn = document.getElementById('zoom-in');
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.scale = Math.min(this.maxScale, this.scale * 1.2);
                this.render();
            });
        }
        
        const zoomOutBtn = document.getElementById('zoom-out');
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.scale = Math.max(this.minScale, this.scale / 1.2);
                this.render();
            });
        }
        
        // リセットボタン
        const resetViewBtn = document.getElementById('reset-view');
        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => {
                this.scale = 1.0;
                this.mapOffset = { x: 0, y: 0 };
                this.render();
            });
        }
    }
    
    /**
     * 指定位置の地区を取得する
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {Object|null} - 地区またはnull
     * @private
     */
    _getDistrictAt(x, y) {
        if (!this.city || !this.city.districts) return null;
        return this.city.districts.find(d => d.position.x === x && d.position.y === y) || null;
    }
    
    /**
     * マップを描画する
     */
    render() {
        if (!this.ctx) return;
        
        // キャンバスをクリア
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 変換を適用
        this.ctx.save();
        this.ctx.translate(this.mapOffset.x * this.scale, this.mapOffset.y * this.scale);
        this.ctx.scale(this.scale, this.scale);
        
        // 背景グリッドを描画
        this._drawGrid();
        
        // タイルを描画
        for (let y = 0; y < this.mapSize; y++) {
            for (let x = 0; x < this.mapSize; x++) {
                const district = this._getDistrictAt(x, y);
                
                if (district) {
                    // 地区タイルを描画
                    this._drawTile(x, y, district.type);
                    
                    // 地区内の建物を描画
                    this._drawDistrictBuildings(x, y, district);
                    
                    // 地区レベルを描画
                    this._drawDistrictLevel(x, y, district.level);
                    
                    // 地区名を描画
                    this._drawText(x, y, district.name, 'bottom');
                } else {
                    // 空のタイルを描画
                    this._drawTile(x, y, 'empty');
                    
                    // 新規作成アイコンを描画
                    this._drawSprite(
                        this.sprites.ui, 
                        this.uiSprites.create.x, 
                        this.uiSprites.create.y, 
                        x * this.tileSize + this.tileSize/2 - 12, 
                        y * this.tileSize + this.tileSize/2 - 12,
                        24, 24
                    );
                }
                
                // ホバー表示
                if (this.hoverPosition && this.hoverPosition.x === x && this.hoverPosition.y === y &&
                    (!this.selectedPosition || this.selectedPosition.x !== x || this.selectedPosition.y !== y)) {
                    this._drawHover(x, y);
                }
                
                // 選択表示
                if (this.selectedPosition && this.selectedPosition.x === x && this.selectedPosition.y === y) {
                    this._drawSelection(x, y);
                }
            }
        }
        
        // 変換を元に戻す
        this.ctx.restore();
    }
    
    /**
     * グリッドを描画する
     * @private
     */
    _drawGrid() {
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.mapSize; i++) {
            // 縦線
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.tileSize, 0);
            this.ctx.lineTo(i * this.tileSize, this.mapSize * this.tileSize);
            this.ctx.stroke();
            
            // 横線
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.tileSize);
            this.ctx.lineTo(this.mapSize * this.tileSize, i * this.tileSize);
            this.ctx.stroke();
        }
    }
    
    /**
     * タイルを描画する
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {string} type - タイルタイプ
     * @private
     */
    _drawTile(x, y, type) {
        if (!this.sprites.tiles.complete) {
            // スプライト未ロード時のフォールバック
            this.ctx.fillStyle = this._getTileColor(type);
            this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
            return;
        }
        
        const tileType = this.tileTypes[type] || this.tileTypes.empty;
        this._drawSprite(
            this.sprites.tiles, 
            tileType.x, 
            tileType.y, 
            x * this.tileSize, 
            y * this.tileSize,
            this.tileSize, 
            this.tileSize
        );
    }
    
    /**
     * 地区の建物を描画する
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {Object} district - 地区
     * @private
     */
    _drawDistrictBuildings(x, y, district) {
        if (!this.sprites.buildings.complete || !district.buildings) return;
        
        // 建物数に基づいて配置を決定
        const buildingCounts = Object.entries(district.buildings)
            .filter(([type, count]) => count > 0)
            .sort((a, b) => b[1] - a[1]); // 数が多い順にソート
        
        if (buildingCounts.length === 0) return;
        
        // 最大3種類まで表示
        const maxBuildingTypes = Math.min(3, buildingCounts.length);
        
        for (let i = 0; i < maxBuildingTypes; i++) {
            const [type, count] = buildingCounts[i];
            const sprite = this.buildingSprites[type];
            
            if (!sprite) continue;
            
            // 位置を計算（2x2グリッドに分割して配置）
            const gridX = i % 2;
            const gridY = Math.floor(i / 2);
            const buildingSize = this.tileSize / 2 - 4; // 少し余白を取る
            
            this._drawSprite(
                this.sprites.buildings,
                sprite.x,
                sprite.y,
                x * this.tileSize + gridX * (this.tileSize/2) + 2,
                y * this.tileSize + gridY * (this.tileSize/2) + 2,
                buildingSize,
                buildingSize
            );
            
            // 建物数を表示
            if (count > 1) {
                this.ctx.fillStyle = 'white';
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 1;
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                
                const textX = x * this.tileSize + gridX * (this.tileSize/2) + buildingSize;
                const textY = y * this.tileSize + gridY * (this.tileSize/2) + buildingSize;
                
                this.ctx.strokeText(count, textX, textY);
                this.ctx.fillText(count, textX, textY);
            }
        }
    }
    
    /**
     * 地区レベルを描画する
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} level - 地区レベル
     * @private
     */
    _drawDistrictLevel(x, y, level) {
        // レベル表示（右上）
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 1;
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // レベルバッジ背景
        this.ctx.beginPath();
        this.ctx.arc(
            x * this.tileSize + this.tileSize - 12, 
            y * this.tileSize + 12, 
            10, 
            0, 
            Math.PI * 2
        );
        this.ctx.fillStyle = '#333';
        this.ctx.fill();
        this.ctx.stroke();
        
        // レベルテキスト
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(
            level, 
            x * this.tileSize + this.tileSize - 12, 
            y * this.tileSize + 12
        );
    }
    
    /**
     * テキストを描画する
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {string} text - 表示テキスト
     * @param {string} position - 表示位置（'top'/'bottom'）
     * @private
     */
    _drawText(x, y, text, position = 'bottom') {
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = position === 'top' ? 'top' : 'bottom';
        
        const textX = x * this.tileSize + this.tileSize / 2;
        const textY = position === 'top' 
            ? y * this.tileSize + 4
            : y * this.tileSize + this.tileSize - 4;
        
        // 背景を描画して可読性を高める
        const textWidth = this.ctx.measureText(text).width + 6;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(
            textX - textWidth / 2,
            textY - (position === 'top' ? 0 : 10),
            textWidth,
            12
        );
        
        // テキストを描画
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(text, textX, textY);
    }
    
    /**
     * 選択表示を描画する
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @private
     */
    _drawSelection(x, y) {
        const padding = 2;
        
        // スプライトがロードされていない場合のフォールバック
        if (!this.sprites.ui.complete) {
            this.ctx.strokeStyle = '#ffcc00';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(
                x * this.tileSize + padding, 
                y * this.tileSize + padding, 
                this.tileSize - padding * 2, 
                this.tileSize - padding * 2
            );
            return;
        }
        
        // 選択表示スプライトを描画
        this._drawSprite(
            this.sprites.ui,
            this.uiSprites.selected.x,
            this.uiSprites.selected.y,
            x * this.tileSize,
            y * this.tileSize,
            this.tileSize,
            this.tileSize
        );
    }
    
    /**
     * ホバー表示を描画する
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @private
     */
    _drawHover(x, y) {
        const padding = 2;
        
        // スプライトがロードされていない場合のフォールバック
        if (!this.sprites.ui.complete) {
            this.ctx.strokeStyle = '#aaaaff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                x * this.tileSize + padding, 
                y * this.tileSize + padding, 
                this.tileSize - padding * 2, 
                this.tileSize - padding * 2
            );
            return;
        }
        
        // ホバー表示スプライトを描画
        this._drawSprite(
            this.sprites.ui,
            this.uiSprites.highlight.x,
            this.uiSprites.highlight.y,
            x * this.tileSize,
            y * this.tileSize,
            this.tileSize,
            this.tileSize
        );
    }
    
    /**
     * スプライトを描画する
     * @param {Image} spriteSheet - スプライトシート
     * @param {number} sx - スプライトX座標
     * @param {number} sy - スプライトY座標
     * @param {number} dx - 描画先X座標
     * @param {number} dy - 描画先Y座標
     * @param {number} dw - 描画先幅
     * @param {number} dh - 描画先高さ
     * @private
     */
    _drawSprite(spriteSheet, sx, sy, dx, dy, dw, dh) {
        const spriteSize = 64; // スプライトシートの1タイルサイズ
        this.ctx.drawImage(
            spriteSheet,
            sx * spriteSize,
            sy * spriteSize,
            spriteSize,
            spriteSize,
            dx,
            dy,
            dw,
            dh
        );
    }
    
    /**
     * タイルタイプに応じた色を取得する（フォールバック用）
     * @param {string} type - タイルタイプ
     * @returns {string} - 色コード
     * @private
     */
    _getTileColor(type) {
        switch (type) {
            case 'residential': return '#3498db';
            case 'commercial': return '#f39c12';
            case 'industrial': return '#e74c3c';
            case 'education': return '#9b59b6';
            case 'eco': return '#2ecc71';
            default: return '#f0f0f0';
        }
    }
    
    /**
     * マップをリサイズする
     * @param {number} width - 新しい幅
     * @param {number} height - 新しい高さ
     */
    resize(width, height) {
        if (!this.canvas) return;
        
        this.canvas.width = width;
        this.canvas.height = height;
        this.render();
    }
    
    /**
     * タイルクリックのコールバックを設定する
     * @param {Function} callback - コールバック関数(x, y, district)
     */
    setTileClickCallback(callback) {
        this.onTileClick = callback;
    }
    
    /**
     * タイルホバーのコールバックを設定する
     * @param {Function} callback - コールバック関数(x, y, district)
     */
    setTileHoverCallback(callback) {
        this.onTileHover = callback;
    }
    
    /**
     * マップを更新する
     */
    update() {
        this.render();
    }
}