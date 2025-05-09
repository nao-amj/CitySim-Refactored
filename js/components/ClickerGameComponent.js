/**
 * ClickerGameComponent - 独立した資金稼ぎモードコンポーネント
 * 他のUIと完全に分離して動作します
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
        this.isMobile = this._detectMobileDevice();
        
        // CSSが読み込まれていることを確認
        this._ensureStylesLoaded();
    }
    
    /**
     * モバイルデバイスかどうかを検出
     * @returns {boolean} モバイルデバイスならtrue
     * @private
     */
    _detectMobileDevice() {
        return (window.innerWidth <= 768) || 
               ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0) || 
               (navigator.msMaxTouchPoints > 0);
    }
    
    /**
     * CSSが読み込まれていることを確認
     * @private
     */
    _ensureStylesLoaded() {
        // CSSファイルが既に読み込まれているか確認
        const cssLoaded = Array.from(document.styleSheets).some(styleSheet => {
            try {
                return styleSheet.href && styleSheet.href.includes('clicker.css');
            } catch (e) {
                // CORS制限などでアクセスできない場合はスキップ
                return false;
            }
        });
        
        // CSSが読み込まれていない場合は追加
        if (!cssLoaded) {
            const linkElement = document.createElement('link');
            linkElement.rel = 'stylesheet';
            linkElement.href = 'styles/clicker.css';
            linkElement.id = 'clicker-styles';
            document.head.appendChild(linkElement);
            console.log('クリッカーモードのCSSを読み込みました');
        }
        
        // モバイル用のスタイルシートを読み込む
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
                console.log('モバイル最適化クリッカーモードのCSSを読み込みました');
            }
        }
    }
    
    /**
     * コンポーネントの初期化
     */
    async initialize() {
        if (this.initialized) return;
        
        // モバイルデバイスの場合は最適化されたコントローラを使用
        if (this.isMobile) {
            try {
                // 動的にモジュールをインポート
                const { EnhancedClickerController: MobileController } = await import('../controllers/EnhancedClickerController-mobile.js');
                this.controller = new MobileController(this.city, this.uiController);
                console.log('モバイル最適化クリッカーコントローラを使用します');
            } catch (error) {
                console.warn('モバイル最適化コントローラの読み込みに失敗しました。通常版を使用します', error);
                this.controller = new EnhancedClickerController(this.city, this.uiController);
            }
        } else {
            // デスクトップ向けの通常コントローラ
            this.controller = new EnhancedClickerController(this.city, this.uiController);
        }
        
        // 独立したコンテナの作成
        this._createContainerElement();
        
        this.initialized = true;
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
        this.containerElement.className = 'clicker-game-component';
        this.containerElement.style.position = 'fixed';
        this.containerElement.style.top = '0';
        this.containerElement.style.left = '0';
        this.containerElement.style.width = '100%';
        this.containerElement.style.height = '100%';
        this.containerElement.style.zIndex = '9999';
        this.containerElement.style.display = 'none';
        
        // モバイルデバイスの場合はモバイルクラスを追加
        if (this.isMobile) {
            this.containerElement.classList.add('mobile-view');
        }
        
        // iframeを使ってスタイルを完全に分離
        const iframe = document.createElement('iframe');
        iframe.id = 'clicker-game-iframe';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        
        this.containerElement.appendChild(iframe);
        document.body.appendChild(this.containerElement);
        
        // iframeの読み込み完了後にコンテンツを設定
        iframe.onload = () => {
            // iframeのdocumentにアクセス
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            // CSSの読み込み
            const linkElement = document.createElement('link');
            linkElement.rel = 'stylesheet';
            linkElement.href = 'styles/clicker.css';
            iframeDoc.head.appendChild(linkElement);
            
            // モバイル向けのCSSも読み込む
            if (this.isMobile) {
                const mobileCssLink = document.createElement('link');
                mobileCssLink.rel = 'stylesheet';
                mobileCssLink.href = 'styles/clicker-mobile-optimizations.css';
                iframeDoc.head.appendChild(mobileCssLink);
                
                // モバイルデバイス向けのメタタグ追加
                const viewportMeta = document.createElement('meta');
                viewportMeta.name = 'viewport';
                viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                iframeDoc.head.appendChild(viewportMeta);
                
                // モバイルクラスを追加
                iframeDoc.body.classList.add('mobile-view');
            }
            
            // Font Awesomeの読み込み
            const fontAwesome = document.createElement('link');
            fontAwesome.rel = 'stylesheet';
            fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
            iframeDoc.head.appendChild(fontAwesome);
            
            // クリッカーゲームのHTML構造を作成
            iframeDoc.body.innerHTML = `
                <div id="clicker-container" class="clicker-container ${this.isMobile ? 'mobile-view' : ''}">
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
            exitButton.addEventListener(this.isMobile ? 'touchend' : 'click', (e) => {
                if (this.isMobile) e.preventDefault();
                this.hide();
            });
        }
        
        // クリックターゲットのイベントリスナー
        const clickTarget = doc.getElementById('clicker-target');
        if (clickTarget) {
            // Bind desktop click only; mobile touch handled by controller
            if (!this.isMobile) {
                clickTarget.addEventListener('click', (e) => {
                    if (this.controller) {
                        this.controller.handleClickFromComponent(e);
                    }
                });
            }
        }
        
        // モバイル向けのタッチイベント最適化
        if (this.isMobile) {
            doc.addEventListener('touchmove', (e) => {
                // ターゲット上でのスクロールを防止
                if (e.target.closest('#clicker-target')) {
                    e.preventDefault();
                }
            }, { passive: false });
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
    async show() {
        if (!this.initialized) {
            await this.initialize();
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