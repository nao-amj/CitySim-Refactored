/**
 * ClickerGameComponent - 独立した資金稼ぎモードコンポーネント
 * モバイルデバイス向けに最適化されています
 */

import { EnhancedClickerController } from '../controllers/EnhancedClickerController-mobile.js';
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
        this.iframe = null;
        this.initialized = false;
        
        // モバイルデバイス判定
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
        // 通常のクリッカースタイルが読み込まれているか確認
        const cssLoaded = Array.from(document.styleSheets).some(styleSheet => {
            try {
                return styleSheet.href && (
                    styleSheet.href.includes('clicker-styles.css') || 
                    styleSheet.href.includes('clicker.css')
                );
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
        
        // モバイル向け最適化CSSも追加
        if (this.isMobile) {
            const mobileCssLoaded = Array.from(document.styleSheets).some(styleSheet => {
                try {
                    return styleSheet.href && styleSheet.href.includes('clicker-mobile-optimizations.css');
                } catch (e) {
                    return false;
                }
            });
            
            if (!mobileCssLoaded) {
                const mobileLinkElement = document.createElement('link');
                mobileLinkElement.rel = 'stylesheet';
                mobileLinkElement.href = 'styles/clicker-mobile-optimizations.css';
                mobileLinkElement.id = 'clicker-mobile-styles';
                document.head.appendChild(mobileLinkElement);
                console.log('クリッカーモードのモバイル最適化CSSを読み込みました');
            }
        }
    }
    
    /**
     * コンポーネントの初期化
     */
    initialize() {
        if (this.initialized) return;
        
        // コントローラの作成
        this.controller = new EnhancedClickerController(this.city, this.uiController);
        
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
        
        // モバイル向けの最適化
        if (this.isMobile) {
            this.containerElement.classList.add('mobile-view');
        }
        
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
        
        // WebKitスクロール最適化（iOSのスクロールバグ修正）
        if (this.isMobile && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
            iframe.style.webkitOverflowScrolling = 'touch';
        }
        
        this.containerElement.appendChild(iframe);
        document.body.appendChild(this.containerElement);
        this.iframe = iframe;
        
        // iframeの読み込み完了後にコンテンツを設定
        iframe.onload = () => {
            this._setupIframeContent();
        };
        
        // iframeに空のHTMLを読み込む
        iframe.srcdoc = '<!DOCTYPE html><html><head><title>クリッカーゲーム</title></head><body></body></html>';
    }
    
    /**
     * iframeのコンテンツをセットアップ
     * @private
     */
    _setupIframeContent() {
        // iframeのdocumentにアクセス
        const iframeDoc = this.iframe.contentDocument || this.iframe.contentWindow.document;
        
        // iframeのdocumentにモバイルセットアップ
        if (this.isMobile) {
            iframeDoc.documentElement.classList.add('mobile-view');
            
            // ビューポート設定をモバイル向けに調整
            const viewportMeta = document.createElement('meta');
            viewportMeta.name = 'viewport';
            viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            iframeDoc.head.appendChild(viewportMeta);
        }
        
        // CSSの読み込み
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = 'styles/clicker-styles.css';
        iframeDoc.head.appendChild(linkElement);
        
        // モバイル向け最適化CSSを読み込み
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
        this._createClickerHTML(iframeDoc);
        
        // イベントハンドラを設定
        this._setupEventListeners(iframeDoc);
        
        // コントローラにiframeのドキュメントを伝える
        if (this.controller) {
            this.controller.setDocument(iframeDoc);
        }
    }
    
    /**
     * クリッカーゲームのHTML構造を作成
     * @param {Document} doc - ターゲットドキュメント（iframe内）
     * @private
     */
    _createClickerHTML(doc) {
        // モバイル向けにHTML構造を最適化
        const mobileClass = this.isMobile ? 'mobile-view' : '';
        
        doc.body.innerHTML = `
            <div id="clicker-container" class="clicker-container ${mobileClass}">
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
                        
                        <div class="clicker-section" ${this.isMobile ? 'style="display: none;"' : ''}>
                            <h3><i class="fas fa-arrow-up"></i> アップグレード</h3>
                            <div id="clicker-upgrades" class="clicker-upgrades"></div>
                        </div>
                        
                        <div class="clicker-section" ${this.isMobile ? 'style="display: none;"' : ''}>
                            <h3><i class="fas fa-trophy"></i> 実績</h3>
                            <div id="clicker-achievements" class="clicker-achievements"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
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
                    // タップエフェクト
                    clickTarget.classList.add('clicked');
                    
                    // コントローラに伝える
                    if (this.controller) {
                        // タッチエベントはcontrollerが処理
                    }
                    
                    // パフォーマンス向上のためデフォルト動作を抑制
                    e.preventDefault();
                }, { passive: false });
                
                clickTarget.addEventListener('touchend', (e) => {
                    // タップエフェクト解除
                    clickTarget.classList.remove('clicked');
                    
                    // クリックイベントをコントローラに伝える
                    if (this.controller) {
                        this.controller.handleClickFromComponent(e);
                    }
                    
                    // パフォーマンス向上のためデフォルト動作を抑制
                    e.preventDefault();
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
        
        // モバイルタブのイベントリスナー設定
        if (this.isMobile) {
            const mobileTabs = doc.querySelectorAll('.clicker-tab');
            mobileTabs.forEach(tab => {
                tab.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    
                    // 全てのタブから active クラスを削除
                    mobileTabs.forEach(t => t.classList.remove('active'));
                    
                    // クリックされたタブに active クラスを追加
                    tab.classList.add('active');
                    
                    // セクションの表示切り替え
                    const sectionType = tab.getAttribute('data-section');
                    const sections = doc.querySelectorAll('.clicker-section');
                    
                    sections.forEach(section => {
                        const containsSection = section.querySelector(`.clicker-${sectionType}`);
                        section.style.display = containsSection ? 'block' : 'none';
                    });
                });
            });
        }
        
        // iOS向けのスクロール最適化
        if (this.isMobile && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
            const scrollElements = [
                doc.querySelector('.clicker-buildings'),
                doc.querySelector('.clicker-upgrades'),
                doc.querySelector('.clicker-achievements'),
                doc.querySelector('.clicker-content')
            ];
            
            scrollElements.forEach(el => {
                if (el) {
                    el.style.webkitOverflowScrolling = 'touch';
                    el.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
                }
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
            // モバイル向けにフェードインエフェクトを調整
            if (this.isMobile) {
                this.containerElement.style.animation = 'fadeInMobile 0.2s forwards';
            }
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
            // モバイル向けにフェードアウトエフェクトを調整
            if (this.isMobile) {
                this.containerElement.style.animation = 'fadeOutMobile 0.2s forwards';
                
                // アニメーション後に非表示
                setTimeout(() => {
                    this.containerElement.style.display = 'none';
                }, 200);
            } else {
                this.containerElement.style.display = 'none';
            }
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