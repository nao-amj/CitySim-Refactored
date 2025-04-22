/**
 * ClickerGameComponent - 独立した資金稼ぎモードコンポーネント
 * 他のUIと完全に分離して動作します
 * モバイル最適化対応版
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
        return (typeof window !== 'undefined' && (
            window.innerWidth <= 768 || 
            ('ontouchstart' in window) || 
            (navigator.maxTouchPoints > 0) || 
            (navigator.msMaxTouchPoints > 0)
        ));
    }
    
    /**
     * CSSが読み込まれていることを確認
     * @private
     */
    _ensureStylesLoaded() {
        // CSSファイルが既に読み込まれているか確認
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
        
        // モバイル最適化用CSSの読み込み
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
                console.log('モバイル最適化用クリッカーCSSを読み込みました');
            }
        }
    }
    
    /**
     * コンポーネントの初期化
     */
    initialize() {
        if (this.initialized) return;
        
        // モバイル向けコントローラをインポート
        if (this.isMobile) {
            // 動的インポート
            import('../controllers/EnhancedClickerController-mobile.js')
                .then(module => {
                    // モバイル最適化版コントローラを使用
                    this.controller = new module.EnhancedClickerController(this.city, this.uiController);
                    
                    // 独立したコンテナの作成
                    this._createContainerElement();
                    
                    this.initialized = true;
                })
                .catch(error => {
                    console.error('モバイル最適化コントローラの読み込みに失敗したため、標準版を使用します', error);
                    // フォールバック: 標準のコントローラを使用
                    this.controller = new EnhancedClickerController(this.city, this.uiController);
                    this._createContainerElement();
                    this.initialized = true;
                });
        } else {
            // デスクトップ向け標準コントローラ
            this.controller = new EnhancedClickerController(this.city, this.uiController);
            
            // 独立したコンテナの作成
            this._createContainerElement();
            
            this.initialized = true;
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
        this.containerElement.className = 'clicker-game-component';
        this.containerElement.style.position = 'fixed';
        this.containerElement.style.top = '0';
        this.containerElement.style.left = '0';
        this.containerElement.style.width = '100%';
        this.containerElement.style.height = '100%';
        this.containerElement.style.zIndex = '9999';
        this.containerElement.style.display = 'none';
        
        // モバイルデバイス用のクラス追加
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
            linkElement.href = 'styles/clicker-styles.css';
            iframeDoc.head.appendChild(linkElement);
            
            // モバイル最適化用CSSの読み込み
            if (this.isMobile) {
                const mobileLinkElement = document.createElement('link');
                mobileLinkElement.rel = 'stylesheet';
                mobileLinkElement.href = 'styles/clicker-mobile-optimizations.css';
                iframeDoc.head.appendChild(mobileLinkElement);
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
            
            // モバイル向けに最適化されたボディクラスを追加
            if (this.isMobile) {
                iframeDoc.body.classList.add('mobile-view');
                iframeDoc.body.classList.add('no-zoom');
                
                // iOS検出
                if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                    iframeDoc.body.classList.add('ios-device');
                }
                
                // Android検出
                if (/Android/.test(navigator.userAgent)) {
                    iframeDoc.body.classList.add('android-device');
                }
            }
            
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
            if (this.isMobile) {
                // モバイル向けタッチイベント
                clickTarget.addEventListener('touchstart', (e) => {
                    // タッチイベントをコントローラに伝える
                    if (this.controller && typeof this.controller._handleTouchStart === 'function') {
                        this.controller._handleTouchStart(e);
                    } else if (this.controller) {
                        // フォールバック
                        this.controller.handleClickFromComponent(e);
                    }
                }, { passive: false });
                
                clickTarget.addEventListener('touchend', (e) => {
                    // タッチイベントをコントローラに伝える
                    if (this.controller && typeof this.controller._handleTouchEnd === 'function') {
                        this.controller._handleTouchEnd(e);
                    }
                }, { passive: false });
            } else {
                // デスクトップ向けクリックイベント
                clickTarget.addEventListener('click', (e) => {
                    // クリックイベントをコントローラに伝える
                    if (this.controller) {
                        this.controller.handleClickFromComponent(e);
                    }
                });
            }
        }
        
        // モバイル用タブがある場合はイベントリスナーを設定
        if (this.isMobile) {
            const mobileTabs = doc.querySelectorAll('.clicker-tab');
            mobileTabs.forEach(tab => {
                tab.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    
                    // すべてのタブから active クラスを削除
                    mobileTabs.forEach(t => t.classList.remove('active'));
                    
                    // 選択されたタブに active クラスを追加
                    tab.classList.add('active');
                    
                    // セクションの表示切替
                    const sectionName = tab.getAttribute('data-section');
                    const sections = doc.querySelectorAll('.clicker-section');
                    
                    sections.forEach(section => {
                        if (section.querySelector(`.clicker-${sectionName}`)) {
                            section.style.display = 'block';
                        } else {
                            section.style.display = 'none';
                        }
                    });
                });
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