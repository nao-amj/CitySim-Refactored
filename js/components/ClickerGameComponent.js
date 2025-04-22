/**
 * ClickerGameComponent - 独立した資金稼ぎモードコンポーネント
 * 他のUIと完全に分離して動作します
 * モバイルデバイス検出と自動最適化機能を追加
 */

import { EnhancedClickerController } from '../controllers/EnhancedClickerController.js';
import { GameConfig, GameText } from '../config/GameConfig.js';

export class ClickerGameComponent {
    /**
     * クリッカーゲームコンポーネントの初期化
     * @param {City} city - 都市モデル
     * @param {UIController} uiController - UIコントローラ
     */
    constructor(city, uiController) {
        this.city = city;
        this.uiController = uiController;
        this.controller = null;
        this.containerElement = null;
        this.initialized = false;
        
        // モバイルデバイス判定
        this.isMobile = this._detectMobileDevice();
        
        // 低性能デバイス判定
        this.isLowPerformance = this._detectLowPerformanceDevice();
        
        // CSSが読み込まれていることを確認
        this._ensureStylesLoaded();
    }
    
    /**
     * モバイルデバイスを検出
     * @returns {boolean} モバイルデバイスならtrue
     * @private
     */
    _detectMobileDevice() {
        return (typeof window !== 'undefined' && (
            window.innerWidth <= 768 || 
            ('ontouchstart' in window) || 
            (navigator.maxTouchPoints > 0) || 
            (navigator.msMaxTouchPoints > 0)
        ));
    }
    
    /**
     * 低性能デバイスを検出
     * @returns {boolean} 低性能デバイスならtrue
     * @private
     */
    _detectLowPerformanceDevice() {
        // デバイスの性能を判定する簡易的な方法
        const isOldIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && 
                       !window.MSStream && 
                       (/OS [1-9]_\d/.test(navigator.userAgent) || /OS [1-9]_1[0-2]/.test(navigator.userAgent));
        
        const isOldAndroid = /Android/.test(navigator.userAgent) && 
                           parseFloat(navigator.userAgent.slice(navigator.userAgent.indexOf("Android")+8)) < 7.0;
                           
        // CPUコア数が少ないと判断できる場合
        const hasLowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
        
        return isOldIOS || isOldAndroid || hasLowCPU;
    }
    
    /**
     * CSSが読み込まれていることを確認
     * @private
     */
    _ensureStylesLoaded() {
        // 基本的なクリッカーCSSファイルがすでに読み込まれているか確認
        const cssLoaded = Array.from(document.styleSheets).some(styleSheet => {
            try {
                return styleSheet.href && styleSheet.href.includes('clicker-styles.css');
            } catch (e) {
                // CORS制限などでアクセスできない場合はスキップ
                return false;
            }
        });
        
        // CSSが読み込まれていない場合は追加
        if (!cssLoaded) {
            const linkElement = document.createElement('link');
            linkElement.rel = 'stylesheet';
            linkElement.href = 'styles/clicker-styles.css';
            linkElement.id = 'clicker-styles';
            document.head.appendChild(linkElement);
            console.log('クリッカーモードのCSSを読み込みました');
        }
        
        // モバイル向けの追加CSSを読み込み
        if (this.isMobile) {
            const mobileCssLoaded = Array.from(document.styleSheets).some(styleSheet => {
                try {
                    return styleSheet.href && styleSheet.href.includes('clicker-mobile-optimizations.css');
                } catch (e) {
                    return false;
                }
            });
            
            if (!mobileCssLoaded) {
                const mobileLink = document.createElement('link');
                mobileLink.rel = 'stylesheet';
                mobileLink.href = 'styles/clicker-mobile-optimizations.css';
                mobileLink.id = 'clicker-mobile-styles';
                document.head.appendChild(mobileLink);
                console.log('モバイル向けクリッカーCSSを読み込みました');
            }
        }
    }
    
    /**
     * コンポーネントの初期化
     */
    initialize() {
        if (this.initialized) return;
        
        // デバイスタイプに応じたコントローラーの動的ロード
        this._loadClickerController().then(ControllerClass => {
            // コントローラの作成
            this.controller = new ControllerClass(this.city, this.uiController);
            
            // 独立したコンテナの作成
            this._createContainerElement();
            
            this.initialized = true;
        });
    }
    
    /**
     * デバイスタイプに応じたクリッカーコントローラをロード
     * @returns {Promise<Function>} コントローラークラス
     * @private
     */
    async _loadClickerController() {
        try {
            if (this.isMobile) {
                // モバイル向け最適化コントローラーを動的ロード
                const module = await import('../controllers/EnhancedClickerController-mobile.js');
                console.log('モバイル向け最適化コントローラーを読み込みました');
                return module.EnhancedClickerController;
            } else {
                // 通常のコントローラーを使用
                return EnhancedClickerController;
            }
        } catch (error) {
            console.error('コントローラーの読み込みに失敗しました:', error);
            // エラー時は標準コントローラーにフォールバック
            return EnhancedClickerController;
        }
    }
    
    /**
     * 独立したコンテナ要素を作成
     * @private
     */
    _createContainerElement() {
        // 既存のコンテナを削除
        if (this.containerElement) {
            this.containerElement.remove();
        }
        
        // コンテナ要素の作成
        this.containerElement = document.createElement('div');
        this.containerElement.id = 'clicker-game-component';
        this.containerElement.className = `clicker-game-component ${this.isMobile ? 'mobile-view' : ''}`;
        this.containerElement.style.position = 'fixed';
        this.containerElement.style.top = '0';
        this.containerElement.style.left = '0';
        this.containerElement.style.width = '100%';
        this.containerElement.style.height = '100%';
        this.containerElement.style.zIndex = '9999';
        this.containerElement.style.display = 'none';
        
        // iframeを使ってスタイルを完全に分離
        const iframe = document.createElement('iframe');
        iframe.id = 'clicker-game-iframe';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        
        // モバイル向け最適化
        if (this.isMobile) {
            iframe.style.overflowY = 'auto';
            iframe.style.webkitOverflowScrolling = 'touch';
            
            // ハードウェアアクセラレーションの有効化
            iframe.style.transform = 'translateZ(0)';
            iframe.style.backfaceVisibility = 'hidden';
        }
        
        this.containerElement.appendChild(iframe);
        document.body.appendChild(this.containerElement);
        
        // iframeの読み込み完了後にコンテンツを設定
        iframe.onload = () => {
            // iframeのdocumentにアクセス
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            // モバイル向けメタタグを追加
            if (this.isMobile) {
                const viewportMeta = document.createElement('meta');
                viewportMeta.name = 'viewport';
                viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                iframeDoc.head.appendChild(viewportMeta);
                
                // iOS向け追加設定
                if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                    const appleMeta = document.createElement('meta');
                    appleMeta.name = 'apple-mobile-web-app-capable';
                    appleMeta.content = 'yes';
                    iframeDoc.head.appendChild(appleMeta);
                }
            }
            
            // CSSの読み込み
            const linkElement = document.createElement('link');
            linkElement.rel = 'stylesheet';
            linkElement.href = 'styles/clicker-styles.css';
            iframeDoc.head.appendChild(linkElement);
            
            // モバイル向けCSSを追加
            if (this.isMobile) {
                const mobileCss = document.createElement('link');
                mobileCss.rel = 'stylesheet';
                mobileCss.href = 'styles/clicker-mobile-optimizations.css';
                iframeDoc.head.appendChild(mobileCss);
            }
            
            // Font Awesomeの読み込み
            const fontAwesome = document.createElement('link');
            fontAwesome.rel = 'stylesheet';
            fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
            iframeDoc.head.appendChild(fontAwesome);
            
            // モバイルクラス追加
            if (this.isMobile) {
                iframeDoc.body.classList.add('mobile-view');
                
                if (this.isLowPerformance) {
                    iframeDoc.body.classList.add('low-performance-device');
                }
            }
            
            // クリッカーゲームのHTML構造を作成
            iframeDoc.body.innerHTML = `
                <div id="clicker-container" class="clicker-container${this.isMobile ? ' mobile-view' : ''}">
                    <div class="clicker-header">
                        <h2><i class="fas fa-coins"></i> ${GameText.CLICKER.TITLE}</h2>
                        <p>${GameText.CLICKER.DESCRIPTION}</p>
                        <button id="clicker-exit" class="clicker-exit-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="clicker-content">
                        <div class="clicker-main">
                            <div class="clicker-target-container hardware-accelerated">
                                <div id="clicker-target" class="clicker-target">
                                    <i class="fas fa-city"></i>
                                </div>
                            </div>
                            
                            <div id="clicker-stats" class="clicker-stats">
                                <div class="clicker-stat">
                                    <i class="fas fa-hand-pointer"></i>
                                    <span id="click-value">クリック価値: ¥1</span>
                                </div>
                                <div class="clicker-stat">
                                    <i class="fas fa-hourglass-half"></i>
                                    <span id="auto-income">自動収入: ¥0/秒</span>
                                </div>
                                <div class="clicker-stat">
                                    <i class="fas fa-coins"></i>
                                    <span id="total-earned">総獲得資金: ¥0</span>
                                </div>
                                <div class="clicker-stat">
                                    <i class="fas fa-mouse-pointer"></i>
                                    <span id="total-clicks">総クリック数: 0回</span>
                                </div>
                            </div>
                        </div>
                        
                        ${this.isMobile ? `
                        <!-- モバイル向けナビゲーションタブ -->
                        <div class="clicker-mobile-tabs touch-scroll-x">
                            <button class="clicker-tab active" data-section="buildings">
                                <i class="fas fa-building"></i> 建物
                            </button>
                            <button class="clicker-tab" data-section="upgrades">
                                <i class="fas fa-arrow-up"></i> アップグレード
                            </button>
                            <button class="clicker-tab" data-section="achievements">
                                <i class="fas fa-trophy"></i> 実績
                            </button>
                        </div>
                        ` : ''}
                        
                        <div class="clicker-sections">
                            <div class="clicker-section">
                                <h3><i class="fas fa-building"></i> 建物</h3>
                                <div id="clicker-buildings" class="clicker-buildings">
                                    <div class="clicker-empty">
                                        <p>まだ建物はアンロックされていません。</p>
                                        <p>資金を稼いで新しい建物をアンロックしましょう！</p>
                                    </div>
                                </div>
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
                </div>
            `;
            
            // イベントハンドラを設定
            this._setupEventListeners(iframeDoc);
            
            // コントローラにiframeのドキュメントを伝える
            if (this.controller) {
                this.controller.setDocument(iframeDoc);
            }
        };
        
        // iframeに空のHTMLを読み込む
        iframe.srcdoc = '<!DOCTYPE html><html><head><title>クリッカーゲーム</title></head><body></body></html>';
    }
    
    /**
     * イベントリスナーの設定
     * @param {Document} doc - ターゲットドキュメント（iframe内）
     * @private
     */
    _setupEventListeners(doc) {
        // 閉じるボタンのイベントリスナー
        const exitButton = doc.getElementById('clicker-exit');
        if (exitButton) {
            // モバイル向けにタッチイベントを使い分け
            const eventType = this.isMobile ? 'touchend' : 'click';
            
            exitButton.addEventListener(eventType, (e) => {
                if (this.isMobile) e.preventDefault();
                this.hide();
            });
        }
        
        // クリックターゲットのイベントリスナー
        const clickTarget = doc.getElementById('clicker-target');
        if (clickTarget) {
            if (this.isMobile) {
                // モバイル向けタッチイベント
                clickTarget.addEventListener('touchstart', (e) => {
                    // タッチイベントの処理
                    clickTarget.classList.add('clicked');
                    e.preventDefault(); // スクロール防止
                }, { passive: false });
                
                clickTarget.addEventListener('touchend', (e) => {
                    // クリックイベントをコントローラに伝える
                    if (this.controller) {
                        // タッチ座標を取得
                        const touch = e.changedTouches[0];
                        this.controller.handleClickFromComponent({
                            clientX: touch.clientX,
                            clientY: touch.clientY
                        });
                    }
                    
                    clickTarget.classList.remove('clicked');
                    e.preventDefault();
                }, { passive: false });
            } else {
                // デスクトップ向けマウスイベント
                clickTarget.addEventListener('click', (e) => {
                    // クリックイベントをコントローラに伝える
                    if (this.controller) {
                        this.controller.handleClickFromComponent(e);
                    }
                });
            }
        }
        
        // モバイル向けのタブ切り替え
        if (this.isMobile) {
            const tabs = doc.querySelectorAll('.clicker-tab');
            tabs.forEach(tab => {
                tab.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    
                    // すべてのタブから active クラスを削除
                    tabs.forEach(t => t.classList.remove('active'));
                    
                    // クリックされたタブを active に
                    tab.classList.add('active');
                    
                    // セクションの表示/非表示を切り替え
                    const sectionType = tab.getAttribute('data-section');
                    const sections = doc.querySelectorAll('.clicker-section');
                    
                    sections.forEach(section => {
                        if (section.querySelector(`.clicker-${sectionType}`)) {
                            section.style.display = 'block';
                        } else {
                            section.style.display = 'none';
                        }
                    });
                }, { passive: false });
            });
        }
    }

    /**
     * Application lifecycle init
     * @param {Application} app
     */
    init(app) {
        this.initialize();
    }

    /**
     * コンポーネントを表示
     */
    show() {
        if (!this.initialized) {
            this.initialize();
        }
        
        if (this.containerElement) {
            this.containerElement.style.display = 'block';
        }
        
        if (this.controller) {
            this.controller.show();
        }
    }
    
    /**
     * コンポーネントを非表示
     */
    hide() {
        if (this.containerElement) {
            this.containerElement.style.display = 'none';
        }
        
        if (this.controller) {
            this.controller.hide();
        }
    }
    
    /**
     * 状態を保存
     * @param {SaveManager} saveManager - セーブマネージャー
     */
    saveState(saveManager) {
        if (this.controller) {
            this.controller.saveState(saveManager);
        }
    }
    
    /**
     * 状態を読み込み
     * @param {SaveManager} saveManager - セーブマネージャー
     */
    loadState(saveManager) {
        if (this.controller) {
            this.controller.loadState(saveManager);
        }
    }
}