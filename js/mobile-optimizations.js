/**
 * CitySim Mobile Optimizations
 * モバイルデバイス向けの最適化とジェスチャー対応の実装
 */

document.addEventListener('DOMContentLoaded', () => {
    // モバイルデバイス判定
    const isMobileDevice = () => {
        return (window.innerWidth <= 768) || 
               ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0) || 
               (navigator.msMaxTouchPoints > 0);
    };

    const isMobile = isMobileDevice();
    
    if (isMobile) {
        // モバイルデバイス向けの最適化を適用
        applyMobileOptimizations();
    }
    
    // モバイルメニュー切り替えボタンのイベントリスナー
    const toggleMenuBtn = document.getElementById('mobile-menu-toggle');
    if (toggleMenuBtn) {
        toggleMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // ヘッダーのメニュー切り替えボタン
    const headerMenuBtn = document.getElementById('toggle-menu');
    if (headerMenuBtn) {
        headerMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // ウィンドウのリサイズ時にモバイル最適化を再適用
    window.addEventListener('resize', debounce(() => {
        const newIsMobile = isMobileDevice();
        if (newIsMobile !== isMobile) {
            location.reload(); // 表示モード変更時はリロード
        }
    }, 250));
    
    // パッシブイベントリスナーの最適化
    addPassiveEventListeners();
});

/**
 * モバイル最適化を適用
 */
function applyMobileOptimizations() {
    document.body.classList.add('mobile-view');
    
    // iOS固有の問題への対応
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        document.body.classList.add('ios-device');
        fixIOSInputZoom();
        fixIOSScrolling();
    }
    
    // Androidの特定の問題への対応
    if (/Android/.test(navigator.userAgent)) {
        document.body.classList.add('android-device');
        fixAndroidSpecificIssues();
    }
    
    // モバイル用フォーカスの強化
    enhanceTouchTargets();
    
    // スクロールとスワイプの最適化
    optimizeScrolling();
    
    // クリッカーゲームの最適化
    optimizeClickerGame();
    
    // 都市マップビューの最適化
    optimizeCityMapView();
    
    // モバイル向けレイアウト調整
    adjustLayoutForMobile();
}

/**
 * iOSでのフォーム要素ズーム問題を修正
 */
function fixIOSInputZoom() {
    // 入力フィールドにタッチ時のズームを防止
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        let content = viewport.getAttribute('content');
        if (!content.includes('maximum-scale')) {
            content += ', maximum-scale=1.0';
            viewport.setAttribute('content', content);
        }
    }
    
    // フォーム要素に大きめのフォントサイズを適用
    const formElements = document.querySelectorAll('input, select, textarea');
    formElements.forEach(el => {
        if (getComputedStyle(el).fontSize.replace('px', '') < 16) {
            el.style.fontSize = '16px';
        }
    });
}

/**
 * iOSでのスクロール問題を修正
 */
function fixIOSScrolling() {
    // オーバースクロールを制御
    document.body.style.overscrollBehavior = 'none';
    
    // スクロール可能な要素にバウンススクロール防止
    const scrollableElements = document.querySelectorAll('.game-log, .districts-list, .city-stats, .chart-tabs');
    scrollableElements.forEach(el => {
        el.style.webkitOverflowScrolling = 'touch';
        el.style.overflowScrolling = 'touch';
    });
}

/**
 * Android特有の問題を修正
 */
function fixAndroidSpecificIssues() {
    // 一部の古いAndroidブラウザでのフレキシブルボックスの問題を修正
    const flexContainers = document.querySelectorAll('.dashboard, .game-actions, .city-overview');
    flexContainers.forEach(container => {
        const children = container.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.style.flex) {
                // AndroidブラウザでのFlex Bugの回避策
                child.style.WebkitFlex = child.style.flex;
            }
        }
    });
}

/**
 * タッチターゲットを拡大して使いやすくする
 */
function enhanceTouchTargets() {
    // 小さすぎるタッチターゲットを探して拡大
    const smallTouchTargets = document.querySelectorAll('button, .tab-btn, .action-btn, .chart-tab');
    smallTouchTargets.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
            // W3C推奨のタッチターゲットサイズは最小44x44px
            el.style.minWidth = '44px';
            el.style.minHeight = '44px';
        }
    });
}

/**
 * スクロールとタッチ操作を最適化
 */
function optimizeScrolling() {
    // スクロール要素のパフォーマンス最適化
    const scrollContainers = document.querySelectorAll('.game-log, .districts-list');
    scrollContainers.forEach(container => {
        container.classList.add('hardware-accelerated');
        
        // タッチスクロールの最適化
        container.addEventListener('touchstart', () => {}, { passive: true });
        container.addEventListener('touchmove', () => {}, { passive: true });
    });
    
    // 水平スクロールの最適化
    const horizontalScroll = document.querySelectorAll('.touch-scroll-x');
    horizontalScroll.forEach(container => {
        enableHorizontalSwipeScroll(container);
    });
}

/**
 * クリッカーゲームをモバイル向けに最適化
 */
function optimizeClickerGame() {
    // クリッカーゲームのコンテナを監視して動的に最適化
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    if (node.id === 'clicker-game-component' || 
                        (node.querySelector && node.querySelector('#clicker-game-component'))) {
                        enhanceClickerGameForMobile();
                        break;
                    }
                }
            }
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * クリッカーゲームのモバイル最適化を強化
 */
function enhanceClickerGameForMobile() {
    // iframeの中身にアクセス
    const iframe = document.querySelector('#clicker-game-iframe');
    if (!iframe || !iframe.contentDocument) return;
    
    const iDoc = iframe.contentDocument;
    
    // モバイル最適化用のクラスをボディに追加
    iDoc.body.classList.add('mobile-view');
    
    // クリッカーゲームの要素
    const clickerContainer = iDoc.querySelector('.clicker-container');
    if (!clickerContainer) return;
    
    // タッチ操作の最適化
    clickerContainer.addEventListener('touchstart', () => {}, { passive: true });
    clickerContainer.addEventListener('touchmove', (e) => {
        // メインのクリックターゲット上ではスクロールを防止
        const target = e.target;
        if (target.closest('.clicker-target')) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // クリックターゲットの強化
    const clickTarget = iDoc.querySelector('.clicker-target');
    if (clickTarget) {
        // クリックアニメーションの改善
        clickTarget.addEventListener('touchstart', () => {
            clickTarget.classList.add('clicked');
        }, { passive: true });
        
        clickTarget.addEventListener('touchend', () => {
            clickTarget.classList.remove('clicked');
            setTimeout(() => {
                clickTarget.classList.remove('clicked');
            }, 100);
        }, { passive: true });
    }
    
    // スクロール可能なセクションの最適化
    const scrollableSections = iDoc.querySelectorAll('.clicker-buildings, .clicker-upgrades, .clicker-achievements');
    scrollableSections.forEach(section => {
        section.classList.add('hardware-accelerated');
        section.addEventListener('touchstart', () => {}, { passive: true });
    });
}

/**
 * 都市マップビューの最適化
 */
function optimizeCityMapView() {
    // マップコンテナを監視して動的に最適化
    const cityMapContainer = document.getElementById('city-map');
    if (!cityMapContainer) return;
    
    // マップの表示をモバイル向けに調整
    cityMapContainer.addEventListener('click', optimizeMapOnFirstInteraction, { once: true });
    
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                if (cityMapContainer.style.display !== 'none') {
                    setTimeout(adjustMapForMobile, 100);
                }
            }
        });
    });
    
    observer.observe(cityMapContainer, { attributes: true });
}

/**
 * 最初のインタラクション時にマップを最適化
 */
function optimizeMapOnFirstInteraction() {
    adjustMapForMobile();
}

/**
 * モバイル向けにマップを調整
 */
function adjustMapForMobile() {
    const mapGrid = document.querySelector('.city-map-grid');
    if (!mapGrid) return;
    
    // スマホ画面ではマップグリッドを5x5に調整
    if (window.innerWidth <= 480) {
        mapGrid.style.gridTemplateColumns = 'repeat(5, 1fr)';
    } else if (window.innerWidth <= 768) {
        mapGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
    }
    
    // マップセルのタップ領域拡大
    const mapCells = document.querySelectorAll('.map-cell');
    mapCells.forEach(cell => {
        cell.style.minWidth = '44px';
        cell.style.minHeight = '44px';
    });
}

/**
 * モバイル向けにレイアウトを調整
 */
function adjustLayoutForMobile() {
    // ダッシュボードをモバイル向けに調整
    const dashboard = document.querySelector('.dashboard');
    if (dashboard) {
        // デフォルトでは都市統計を非表示にしてタップで表示切り替え
        const cityStats = document.querySelector('.city-stats');
        if (cityStats) {
            cityStats.classList.add('mobile-collapsible');
            if (!sessionStorage.getItem('stats-expanded')) {
                cityStats.classList.add('collapsed');
                const contents = cityStats.querySelectorAll('.stats-group');
                contents.forEach(content => {
                    content.style.display = 'none';
                });
            }
            
            // タップで開閉する
            const statsHeader = cityStats.querySelector('h2');
            if (statsHeader) {
                statsHeader.addEventListener('click', toggleStatsSection);
            }
        }
    }
    
    // 横向き/縦向きの調整
    adjustForOrientation();
    window.addEventListener('orientationchange', adjustForOrientation);
}

/**
 * 画面の向きに応じてレイアウトを調整
 */
function adjustForOrientation() {
    const isLandscape = window.innerWidth > window.innerHeight;
    
    if (isLandscape && window.innerHeight < 500) {
        // 横向きの小さな画面（多くの場合、スマホ横向き）
        document.body.classList.add('landscape-mobile');
        
        // タブレイアウトの調整
        const actionPanel = document.querySelector('.action-panel');
        if (actionPanel) {
            actionPanel.style.maxHeight = '80px';
        }
    } else {
        document.body.classList.remove('landscape-mobile');
        
        // リセット
        const actionPanel = document.querySelector('.action-panel');
        if (actionPanel) {
            actionPanel.style.maxHeight = '';
        }
    }
}

/**
 * 都市統計セクションの表示/非表示を切り替え
 */
function toggleStatsSection() {
    const cityStats = document.querySelector('.city-stats');
    if (!cityStats) return;
    
    const isCollapsed = cityStats.classList.contains('collapsed');
    const contents = cityStats.querySelectorAll('.stats-group');
    
    if (isCollapsed) {
        // 展開
        cityStats.classList.remove('collapsed');
        contents.forEach(content => {
            content.style.display = 'block';
            // アニメーション
            content.style.opacity = '0';
            setTimeout(() => {
                content.style.opacity = '1';
            }, 10);
        });
        sessionStorage.setItem('stats-expanded', 'true');
    } else {
        // 折りたたむ
        cityStats.classList.add('collapsed');
        contents.forEach(content => {
            content.style.opacity = '0';
            setTimeout(() => {
                content.style.display = 'none';
            }, 200);
        });
        sessionStorage.removeItem('stats-expanded');
    }
}

/**
 * 都市統計の表示/非表示を切り替え（ヘッダーメニューボタン用）
 */
function toggleStats() {
    const cityStats = document.querySelector('.city-stats');
    if (!cityStats) return;
    
    if (cityStats.style.display === 'none') {
        cityStats.style.display = 'block';
    } else {
        cityStats.style.display = 'none';
    }
}

/**
 * モバイルメニューの表示/非表示を切り替え
 */
function toggleMobileMenu() {
    // 既存のメニューがあれば削除
    let mobileMenu = document.getElementById('mobile-quick-menu');
    if (mobileMenu) {
        mobileMenu.remove();
        return;
    }
    
    // 新しいモバイルメニューを作成
    mobileMenu = document.createElement('div');
    mobileMenu.id = 'mobile-quick-menu';
    mobileMenu.className = 'mobile-quick-menu';
    
    // メニューのスタイル設定（位置はあとで計算）
    Object.assign(mobileMenu.style, {
        position: 'absolute',
        zIndex: '1000',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    });
    
    // クイックアクセスボタンを追加
    const quickActions = [
        { icon: 'fa-coins', text: 'クリッカー', action: 'clicker_mode' },
        { icon: 'fa-forward', text: '次の年', action: 'next_year' },
        { icon: 'fa-city', text: '地区作成', action: 'create_district' },
        { icon: 'fa-map', text: 'マップ', action: 'show_city_map' },
        { icon: 'fa-chart-line', text: '統計', action: 'show_stats_charts' }
    ];
    
    quickActions.forEach(action => {
        const button = document.createElement('button');
        button.className = 'mobile-menu-btn tap-highlight';
        button.innerHTML = `<i class="fas ${action.icon}"></i> ${action.text}`;
        
        // スタイル設定
        Object.assign(button.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'transparent',
            border: 'none',
            padding: '8px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            fontSize: '0.9rem'
        });
        
        // クリックイベント
        button.addEventListener('click', () => {
            // イベントをディスパッチして対応するアクションを実行
            document.dispatchEvent(new CustomEvent('mobileAction', { 
                detail: { action: action.action }
            }));
            
            // 一部のアクションは直接UIControllerに通知する必要がある
            const actionButton = document.querySelector(`[data-action="${action.action}"]`);
            if (actionButton) {
                actionButton.click();
            }
            
            mobileMenu.remove();
        });
        
        mobileMenu.appendChild(button);
    });
    
    document.body.appendChild(mobileMenu);
    
    // メニューをトグルボタンの上に配置（モバイルボタンかヘッダーボタンがアンカー）
    let anchorBtn = document.getElementById('mobile-menu-toggle') || document.getElementById('toggle-menu');
    if (anchorBtn) {
        const btnRect = anchorBtn.getBoundingClientRect();
        const menuRect = mobileMenu.getBoundingClientRect();
        // 中央揃えで上に配置
        const leftPos = btnRect.left + (btnRect.width / 2) - (menuRect.width / 2);
        const topPos = btnRect.top - menuRect.height - 8;
        mobileMenu.style.left = `${Math.max(8, leftPos)}px`;
        mobileMenu.style.top = `${Math.max(8, topPos)}px`;
    }
    
    // 画面外タップでメニューを閉じる
    setTimeout(() => {
        const closeOnClickOutside = (e) => {
            if (!mobileMenu.contains(e.target) && e.target.id !== 'mobile-menu-toggle') {
                mobileMenu.remove();
                document.removeEventListener('click', closeOnClickOutside);
            }
        };
        document.addEventListener('click', closeOnClickOutside);
    }, 10);
}

/**
 * 水平スワイプスクロールを有効化
 * @param {HTMLElement} element - 水平スクロールを有効にする要素
 */
function enableHorizontalSwipeScroll(element) {
    let startX, startScrollLeft;
    
    element.addEventListener('touchstart', (e) => {
        startX = e.touches[0].pageX - element.offsetLeft;
        startScrollLeft = element.scrollLeft;
    }, { passive: true });
    
    element.addEventListener('touchmove', (e) => {
        const x = e.touches[0].pageX - element.offsetLeft;
        const walk = (x - startX);
        element.scrollLeft = startScrollLeft - walk;
    }, { passive: true });
}

/**
 * パッシブイベントリスナーを追加して最適化
 */
function addPassiveEventListeners() {
    // 通常のスクロールはパッシブに
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
    
    // クリックフィードバックのリップルエフェクト
    const tapElements = document.querySelectorAll('.tap-highlight');
    tapElements.forEach(element => {
        element.addEventListener('touchstart', addTapRipple, { passive: true });
    });
}

/**
 * タップ時のリップルエフェクトを追加
 * @param {Event} e - タッチイベント
 */
function addTapRipple(e) {
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    
    // スタイル設定
    Object.assign(ripple.style, {
        position: 'absolute',
        top: `${y}px`,
        left: `${x}px`,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: '50%',
        transform: 'scale(0)',
        pointerEvents: 'none',
        width: '5px',
        height: '5px'
    });
    
    // リップルアニメーション
    element.appendChild(ripple);
    
    // アニメーション
    ripple.animate([
        { transform: 'scale(0)', opacity: 1 },
        { transform: 'scale(40)', opacity: 0 }
    ], {
        duration: 600,
        easing: 'ease-out'
    }).onfinish = () => ripple.remove();
}

/**
 * デバウンス関数
 * @param {Function} func - 実行する関数
 * @param {number} wait - 待機時間（ミリ秒）
 * @returns {Function} - デバウンスされた関数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}