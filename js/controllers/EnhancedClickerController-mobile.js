/**
 * Enhanced CitySim - ClickerController class (Mobile Optimized)
 * Controls the clicker game mode with improved animations and feedback
 * このバージョンはモバイルデバイス向けに最適化されています
 */

import { GameConfig, GameText } from '../config/GameConfig.js';
import { EventEmitter } from '../services/EventEmitter.js';

export class EnhancedClickerController {
    /**
     * Initialize clicker controller
     * @param {City} city - City model
     * @param {UIController} uiController - UI controller
     */
    constructor(city, uiController) {
        this.city = city;
        this.uiController = uiController;
        this.events = new EventEmitter();
        
        // Document reference (default is current document, can be set for iframe usage)
        this.document = document;
        
        // モバイルデバイス判定
        this.isMobile = this._detectMobileDevice();
        
        // Detect low performance device
        this.isLowPerformance = this._detectLowPerformanceDevice();
        
        // Clicker status
        this.state = {
            totalClicks: 0,
            totalFunds: 0,
            clickValue: GameConfig.CLICKER.BASE_CLICK_VALUE,
            autoFunds: 0,
            clickMultiplier: 1,
            autoFundsMultiplier: 1,
            allMultiplier: 1,
            upgrades: {},
            buildings: {},
            achievements: {},
            unlocked: {
                COIN_MINT: false,
                BANK: false,
                INVESTMENT_FIRM: false
            }
        };
        
        // Initialization status
        this.initialized = false;
        
        // Clicker UI elements
        this.clickerElement = null;
        this.clickerTarget = null;
        this.clickerStats = null;
        this.buildingsContainer = null;
        this.upgradesContainer = null;
        this.achievementsContainer = null;
        
        // Auto income timer
        this.autoIncomeTimer = null;
        
        // Sound effects
        this.sounds = {
            click: null,
            purchase: null,
            achievement: null,
            unlock: null
        };
        
        // Particles system - モバイルでは削減
        this.particles = [];
        this.particleColors = ['#3498db', '#f39c12', '#2ecc71', '#9b59b6'];
        this.maxParticles = this.isLowPerformance ? 3 : (this.isMobile ? 6 : 15);
        
        // アニメーションフレーム管理
        this.animationFrame = null;
        
        // タッチデバイスの場合はマルチタッチやジェスチャー対応
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.multiTouchActive = false;
        this.lastTapTime = 0;
        
        // Link clicker data to city model
        if (!this.city.clickerData) {
            this.city.clickerData = this.state;
        } else {
            this.state = this.city.clickerData;
        }
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
     * 低性能デバイスかどうかを検出
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
     * Set document for iframe support
     * @param {Document} doc - Document object
     */
    setDocument(doc) {
        this.document = doc;
        this.initialized = false;
        this._initialize();
    }
    
    /**
     * Initialize clicker UI
     * @private
     */
    _initialize() {
        if (this.initialized) return;
        
        // Add mobile class if needed
        if (this.isMobile) {
            this.document.body.classList.add('mobile-view');
            
            if (this.isLowPerformance) {
                this.document.body.classList.add('low-performance-device');
            }
            
            // Load mobile-specific CSS
            this._loadMobileStyles();
        }
        
        // Create clicker UI
        this._createClickerUI();
        
        // Setup event listeners (with mobile-specific ones if needed)
        this._setupEventListeners();
        
        // Start auto income timer
        this._startAutoIncome();
        
        // Preload sounds (conditionally based on device)
        if (!this.isLowPerformance) {
            this._preloadSounds();
        }
        
        this.initialized = true;
        
        // Emit initialization completed event
        this.events.emit('clickerInitialized', {
            state: { ...this.state },
            isMobile: this.isMobile
        });
    }
    
    /**
     * モバイル用のスタイルシートを読み込む
     * @private
     */
    _loadMobileStyles() {
        // Check if the mobile styles are already loaded
        const styleLoaded = Array.from(this.document.styleSheets || []).some(sheet => {
            try {
                return sheet.href && sheet.href.includes('clicker-mobile-optimizations.css');
            } catch (e) {
                return false;
            }
        });
        
        if (!styleLoaded) {
            const linkElement = this.document.createElement('link');
            linkElement.rel = 'stylesheet';
            linkElement.href = './styles/clicker-mobile-optimizations.css';
            this.document.head.appendChild(linkElement);
        }
    }
    
    /**
     * Preload sound effects
     * @private
     */
    _preloadSounds() {
        // On mobile, don't load sound effects unless user has interacted
        if (this.isMobile) {
            const enableSounds = () => {
                // Only try to load sounds after user interaction
                // 実装省略（必要に応じて追加）
                this.document.removeEventListener('touchstart', enableSounds);
            };
            
            this.document.addEventListener('touchstart', enableSounds, { once: true });
        } else {
            // Desktop sound preloading
            // Implementation can be added here if needed
        }
    }
    
    /**
     * Create clicker UI
     * @private
     */
    _createClickerUI() {
        // Find clicker container
        this.clickerElement = this.document.getElementById('clicker-container');
        if (!this.clickerElement) {
            console.error('Clicker container not found in document');
            return;
        }
        
        // Add mobile class if needed
        if (this.isMobile) {
            this.clickerElement.classList.add('mobile-view');
            
            if (this.isLowPerformance) {
                this.clickerElement.classList.add('low-performance-device');
            }
        }
        
        // Save UI references
        this.clickerTarget = this.document.getElementById('clicker-target');
        this.clickerStats = this.document.getElementById('clicker-stats');
        this.buildingsContainer = this.document.getElementById('clicker-buildings');
        this.upgradesContainer = this.document.getElementById('clicker-upgrades');
        this.achievementsContainer = this.document.getElementById('clicker-achievements');
        
        // モバイル向けナビゲーション用タブを追加
        if (this.isMobile) {
            this._addMobileTabs();
        }
        
        // Render buildings, upgrades, and achievements
        this._renderBuildings();
        this._renderUpgrades();
        this._renderAchievements();
        this._updateStats();
        
        // Canvas for particles (with mobile optimizations)
        const particleCanvas = this.document.createElement('canvas');
        particleCanvas.id = 'particle-canvas';
        particleCanvas.style.position = 'absolute';
        particleCanvas.style.top = '0';
        particleCanvas.style.left = '0';
        particleCanvas.style.width = '100%';
        particleCanvas.style.height = '100%';
        particleCanvas.style.pointerEvents = 'none';
        particleCanvas.style.zIndex = '5';
        
        // Mobile optimization for canvas
        if (this.isMobile) {
            particleCanvas.classList.add('hardware-accelerated');
        }
        
        this.clickerElement.appendChild(particleCanvas);
        
        // Resize canvas with debouncing for mobile performance
        particleCanvas.width = this.clickerElement.offsetWidth || 800;
        particleCanvas.height = this.clickerElement.offsetHeight || 600;
        this.particleCanvas = particleCanvas;
        this.particleContext = particleCanvas.getContext('2d');
        
        // Handle window resize for canvas (with debouncing for mobile)
        const debouncedResize = this._debounce(() => {
            if (this.particleCanvas) {
                this.particleCanvas.width = this.clickerElement.offsetWidth || 800;
                this.particleCanvas.height = this.clickerElement.offsetHeight || 600;
            }
        }, this.isMobile ? 200 : 50);
        
        this.document.defaultView.addEventListener('resize', debouncedResize);
    }
    
    /**
     * モバイル向けナビゲーションタブを追加
     * @private
     */
    _addMobileTabs() {
        // モバイル向けのクイックナビゲーションを作成
        const tabsContainer = this.document.createElement('div');
        tabsContainer.className = 'clicker-mobile-tabs touch-scroll-x';
        
        tabsContainer.innerHTML = `
            <button class="clicker-tab active" data-section="buildings">
                <i class="fas fa-building"></i> 建物
            </button>
            <button class="clicker-tab" data-section="upgrades">
                <i class="fas fa-arrow-up"></i> アップグレード
            </button>
            <button class="clicker-tab" data-section="achievements">
                <i class="fas fa-trophy"></i> 実績
            </button>
        `;
        
        // セクションの前に挿入
        if (this.clickerElement.querySelector('.clicker-sections')) {
            this.clickerElement.querySelector('.clicker-sections').before(tabsContainer);
            
            // タブイベントリスナー
            tabsContainer.querySelectorAll('.clicker-tab').forEach(tab => {
                tab.addEventListener(this.isMobile ? 'touchstart' : 'click', this._onMobileTabClick.bind(this));
            });
        }
    }
    
    /**
     * モバイルタブのクリックイベント処理
     * @param {Event} e - イベントオブジェクト
     * @private
     */
    _onMobileTabClick(e) {
        e.preventDefault();
        const tab = e.currentTarget;
        const sectionId = tab.getAttribute('data-section');
        
        // 全てのタブから active クラスを削除
        this.document.querySelectorAll('.clicker-tab').forEach(t => {
            t.classList.remove('active');
        });
        
        // クリックされたタブに active クラスを追加
        tab.classList.add('active');
        
        // 対応するセクションを表示し、他を非表示に
        const sections = this.document.querySelectorAll('.clicker-section');
        sections.forEach(section => {
            if (section.querySelector(`.clicker-${sectionId}`)) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
        
        // セクションまでスクロール
        const targetSection = this.document.querySelector(`.clicker-section:not([style*="display: none"])`);
        if (targetSection) {
            setTimeout(() => {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }
    
    /**
     * Setup event listeners
     * @private
     */
    _setupEventListeners() {
        // Click/Touch target event listener
        if (this.clickerTarget) {
            // Use appropriate event based on device
            if (this.isMobile) {
                // Mobile events
                this.clickerTarget.addEventListener('touchstart', this._handleTouchStart.bind(this), { passive: false });
                this.clickerTarget.addEventListener('touchend', this._handleTouchEnd.bind(this), { passive: false });
                this.clickerTarget.addEventListener('touchcancel', this._handleTouchEnd.bind(this), { passive: true });
                
                // Double tap
                this.clickerTarget.addEventListener('touchend', this._handleDoubleTap.bind(this), { passive: false });
            } else {
                // Desktop events
                this.clickerTarget.addEventListener('click', (e) => {
                    this._handleClick(e);
                });
                
                // Click animation
                this.clickerTarget.addEventListener('mousedown', () => {
                    this.clickerTarget.classList.add('clicked');
                });
                
                this.clickerTarget.addEventListener('mouseup', () => {
                    this.clickerTarget.classList.remove('clicked');
                });
                
                this.clickerTarget.addEventListener('mouseleave', () => {
                    this.clickerTarget.classList.remove('clicked');
                });
            }
        }
        
        // Exit button event listener
        const exitButton = this.document.getElementById('clicker-exit');
        if (exitButton) {
            exitButton.addEventListener(this.isMobile ? 'touchend' : 'click', (e) => {
                if (this.isMobile) e.preventDefault();
                this.hide();
                // Emit exit clicker event
                this.events.emit('exitClicker', {
                    state: { ...this.state }
                });
            });
        }
        
        // Add keyboard shortcuts (mainly for desktop)
        if (!this.isMobile) {
            this.document.addEventListener('keydown', (e) => {
                // Only process when clicker is visible
                if (this.clickerElement && !this.clickerElement.classList.contains('hidden')) {
                    // Escape key to exit
                    if (e.key === 'Escape') {
                        this.hide();
                        this.events.emit('exitClicker', {
                            state: { ...this.state }
                        });
                    }
                    
                    // Space key to click
                    if (e.key === ' ' && this.clickerTarget) {
                        e.preventDefault();
                        this._handleClick({
                            clientX: this.clickerTarget.getBoundingClientRect().left + this.clickerTarget.offsetWidth / 2,
                            clientY: this.clickerTarget.getBoundingClientRect().top + this.clickerTarget.offsetHeight / 2
                        });
                        this.clickerTarget.classList.add('clicked');
                        setTimeout(() => {
                            this.clickerTarget.classList.remove('clicked');
                        }, 100);
                    }
                }
            });
        }
        
        // モバイルデバイスでのオリエンテーション変更リスナー
        if (this.isMobile) {
            this.document.defaultView.addEventListener('orientationchange', this._handleOrientationChange.bind(this));
            
            // iOS向けのスクロール修正
            if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                this._fixIOSScrolling();
            }
        }
    }
    
    /**
     * iOSでのスクロール問題修正
     * @private
     */
    _fixIOSScrolling() {
        const scrollElements = [
            this.buildingsContainer,
            this.upgradesContainer, 
            this.achievementsContainer
        ];
        
        scrollElements.forEach(el => {
            if (el) {
                el.style.webkitOverflowScrolling = 'touch';
                
                // スクロール中のタッチイベントを改善
                el.addEventListener('touchmove', (e) => {
                    e.stopPropagation();
                }, { passive: true });
            }
        });
    }
    
    /**
     * タッチスタートイベントハンドラ
     * @param {TouchEvent} e - タッチイベント
     * @private
     */
    _handleTouchStart(e) {
        // 複数タッチの検出
        if (e.touches.length > 1) {
            this.multiTouchActive = true;
            return;
        }
        
        this.multiTouchActive = false;
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        
        // クリックエフェクト表示
        this.clickerTarget.classList.add('clicked');
        
        // パフォーマンス向上のためデフォルトの動作をキャンセル
        e.preventDefault();
    }
    
    /**
     * タッチエンドイベントハンドラ
     * @param {TouchEvent} e - タッチイベント
     * @private
     */
    _handleTouchEnd(e) {
        // 複数タッチの場合は無視
        if (this.multiTouchActive) {
            this.clickerTarget.classList.remove('clicked');
            return;
        }
        
        // クリックエフェクト削除
        this.clickerTarget.classList.remove('clicked');
        
        // シングルタップの場合はクリック処理
        const targetRect = this.clickerTarget.getBoundingClientRect();
        const centerX = targetRect.left + targetRect.width / 2;
        const centerY = targetRect.top + targetRect.height / 2;
        
        this._handleClick({
            clientX: e.changedTouches ? e.changedTouches[0].clientX : centerX,
            clientY: e.changedTouches ? e.changedTouches[0].clientY : centerY
        });
        
        // パフォーマンス向上のためデフォルトの動作をキャンセル
        e.preventDefault();
    }
    
    /**
     * ダブルタップを検出して処理
     * @param {TouchEvent} e - タッチイベント
     * @private
     */
    _handleDoubleTap(e) {
        const now = Date.now();
        const timeSince = now - this.lastTapTime;
        
        if (timeSince < 300 && !this.multiTouchActive) {
            // ダブルタップの処理 - ボーナスクリック
            e.preventDefault();
            
            // 3回分のクリックを追加
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    const targetRect = this.clickerTarget.getBoundingClientRect();
                    const randomX = targetRect.left + Math.random() * targetRect.width;
                    const randomY = targetRect.top + Math.random() * targetRect.height;
                    
                    this._handleClick({
                        clientX: randomX,
                        clientY: randomY,
                        isBonus: true
                    });
                }, i * 100);
            }
        }
        
        this.lastTapTime = now;
    }
    
    /**
     * 画面の向き変更時の処理
     * @private
     */
    _handleOrientationChange() {
        // パーティクルキャンバスのリサイズ
        setTimeout(() => {
            if (this.particleCanvas) {
                this.particleCanvas.width = this.clickerElement.offsetWidth || 800;
                this.particleCanvas.height = this.clickerElement.offsetHeight || 600;
            }
            
            // レイアウトの調整
            this._adjustLayoutForOrientation();
        }, 300); // 向き変更の完了を待つ
    }
    
    /**
     * 画面の向きに応じたレイアウト調整
     * @private
     */
    _adjustLayoutForOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        
        // 横向きの場合は、レイアウトを調整
        if (isLandscape && this.isMobile) {
            const sections = this.document.querySelector('.clicker-sections');
            if (sections) {
                sections.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
            }
        } else {
            // 縦向きに戻す
            const sections = this.document.querySelector('.clicker-sections');
            if (sections) {
                sections.style.gridTemplateColumns = this.isMobile ? '1fr' : '';
            }
        }
    }
    
    /**
     * Handle click from component
     * @param {Event} e - Click event
     * @public - Called from ClickerGameComponent
     */
    handleClickFromComponent(e) {
        this._handleClick(e);
    }
    
    /**
     * Handle click
     * @param {Event} e - Click event
     * @private
     */
    _handleClick(e) {
        // Update click count
        this.state.totalClicks++;
        
        // Calculate earned funds
        const clickEffect = this.state.clickValue * this.state.clickMultiplier * this.state.allMultiplier;
        const fundsGained = Math.floor(clickEffect);
        
        // Add funds
        this.city.funds += fundsGained;
        this.state.totalFunds += fundsGained;
        
        // Check building unlocks
        this._checkBuildingUnlocks();
        
        // Check achievements
        this._checkAchievements();
        
        // Update UI
        this._updateStats();
        
        // Generate particles (fewer on mobile)
        if (e && e.clientX && e.clientY) {
            // モバイルではパーティクル数を制限
            const particleCount = e.isBonus ? 
                Math.min(5, this.maxParticles) : 
                Math.min(fundsGained > 10 ? 10 : fundsGained, this.maxParticles);
                
            this._createParticles(e.clientX, e.clientY, particleCount);
        } else if (this.clickerTarget) {
            const rect = this.clickerTarget.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            const particleCount = Math.min(fundsGained > 10 ? 10 : fundsGained, this.maxParticles);
            this._createParticles(x, y, particleCount);
        }
        
        // Emit click event
        this.events.emit('click', {
            totalClicks: this.state.totalClicks,
            fundsGained,
            totalFunds: this.state.totalFunds
        });
        
        // Show click effect - モバイル向けに最適化
        this._showClickEffect(fundsGained, e && e.isBonus);
    }
    
    /**
     * Create particles
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} count - Number of particles
     * @private
     */
    _createParticles(x, y, count) {
        if (!this.particleContext || this.isLowPerformance) return;
        
        // モバイルデバイスでパーティクル数を削減
        const particleCount = this.isMobile ? Math.min(count, this.maxParticles) : count;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            // モバイルでは動きを少し遅くする
            const speed = this.isMobile ? (1.5 + Math.random() * 2) : (2 + Math.random() * 3);
            const size = 4 + Math.random() * 4; // モバイルでは少し小さく
            const life = this.isMobile ? (20 + Math.random() * 20) : (30 + Math.random() * 30);
            const color = this.particleColors[Math.floor(Math.random() * this.particleColors.length)];
            
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,  // slight upward bias
                size,
                color,
                life,
                opacity: 1
            });
        }
        
        // Start animation if not already running
        if (!this.animationFrame) {
            this.animationFrame = requestAnimationFrame(() => this._animateParticles());
        }
    }
    
    /**
     * Animate particles
     * @private
     */
    _animateParticles() {
        if (!this.particleContext || !this.particleCanvas || this.isLowPerformance) {
            this.animationFrame = null;
            return;
        }
        
        // Clear canvas
        this.particleContext.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        
        // Update and draw particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;  // gravity
            p.life--;
            p.opacity = p.life / (this.isMobile ? 40 : 60);
            
            // Draw particle
            this.particleContext.beginPath();
            this.particleContext.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.particleContext.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, '0');
            this.particleContext.fill();
        }
        
        // Remove dead particles
        this.particles = this.particles.filter(p => p.life > 0);
        
        // Continue animation if there are particles
        if (this.particles.length > 0) {
            this.animationFrame = requestAnimationFrame(() => this._animateParticles());
        } else {
            this.animationFrame = null;
        }
    }
    
    /**
     * Show click effect
     * @param {number} amount - Amount gained
     * @param {boolean} isBonus - ボーナスクリックなら true
     * @private
     */
    _showClickEffect(amount, isBonus = false) {
        if (!this.clickerTarget) return;
        
        // Create effect element
        const effect = this.document.createElement('div');
        effect.className = `click-effect ${isBonus ? 'bonus-click' : ''}`;
        effect.textContent = `+¥${amount}`;
        
        // ボーナスクリックの場合は特別なスタイルを適用
        if (isBonus) {
            effect.style.color = '#f1c40f';
            effect.style.fontWeight = 'bold';
            effect.style.fontSize = '1.2em';
        }
        
        // Random position within target - モバイル向けに調整
        const targetRect = this.clickerTarget.getBoundingClientRect();
        const x = (this.isMobile ? (targetRect.width / 2) : Math.random() * (targetRect.width - 40));
        const y = (this.isMobile ? (targetRect.height / 2) : Math.random() * (targetRect.height - 20));
        
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        
        // モバイル向けに最適化されたアニメーションを適用
        if (this.isMobile) {
            effect.classList.add('mobile-optimized-animation');
        }
        
        // Add element
        this.clickerTarget.appendChild(effect);
        
        // Remove element after animation - モバイルでは早め
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, this.isMobile ? 1000 : 1500);
    }
    
    /**
     * Start auto income processing
     * @private
     */
    _startAutoIncome() {
        // Clear existing timer
        if (this.autoIncomeTimer) {
            clearInterval(this.autoIncomeTimer);
        }
        
        // Set auto income timer - モバイルでは間隔を調整
        const interval = this.isMobile && this.isLowPerformance ? 
            GameConfig.CLICKER.AUTO_FUNDS_INTERVAL * 2 : GameConfig.CLICKER.AUTO_FUNDS_INTERVAL;
            
        this.autoIncomeTimer = setInterval(() => {
            if (this.state.autoFunds > 0) {
                // Calculate auto income
                const autoIncome = Math.floor(
                    this.state.autoFunds * this.state.autoFundsMultiplier * this.state.allMultiplier
                );
                
                // Add funds
                this.city.funds += autoIncome;
                this.state.totalFunds += autoIncome;
                
                // Check building unlocks
                this._checkBuildingUnlocks();
                
                // Check achievements
                this._checkAchievements();
                
                // Update UI
                this._updateStats();
                
                // Emit auto income event
                this.events.emit('autoIncome', {
                    autoIncome,
                    totalFunds: this.state.totalFunds
                });
                
                // Show subtle auto income indicator
                this._showAutoIncomeIndicator(autoIncome);
            }
        }, interval);
    }
    
    /**
     * Show auto income indicator
     * @param {number} amount - Amount gained
     * @private
     */
    _showAutoIncomeIndicator(amount) {
        // Find auto income stat element
        const autoIncomeEl = this.document.getElementById('auto-income');
        if (!autoIncomeEl) return;
        
        // Add highlight class
        autoIncomeEl.classList.add('income-highlight');
        
        // モバイルでは視覚的なフィードバックのみ（軽量化）
        if (this.isMobile && this.isLowPerformance) {
            setTimeout(() => {
                autoIncomeEl.classList.remove('income-highlight');
            }, 500);
            return;
        }
        
        // Create mini indicator
        const indicator = this.document.createElement('div');
        indicator.className = 'mini-indicator';
        indicator.textContent = `+¥${amount}`;
        indicator.style.position = 'absolute';
        indicator.style.right = '10px';
        indicator.style.color = '#2ecc71';
        indicator.style.fontSize = '0.8rem';
        indicator.style.fontWeight = 'bold';
        indicator.style.opacity = '0';
        indicator.style.transform = 'translateY(0)';
        indicator.style.transition = 'all 1s ease-out';
        autoIncomeEl.parentNode.style.position = 'relative';
        autoIncomeEl.parentNode.appendChild(indicator);
        
        // Animate indicator
        setTimeout(() => {
            indicator.style.opacity = '1';
            indicator.style.transform = 'translateY(-15px)';
        }, 10);
        
        // Remove highlight and indicator
        setTimeout(() => {
            autoIncomeEl.classList.remove('income-highlight');
            indicator.style.opacity = '0';
            
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 1000);
        }, 1000);
    }
    
    /**
     * Check building unlock status
     * @private
     */
    _checkBuildingUnlocks() {
        // Coin Mint unlock
        if (!this.state.unlocked.COIN_MINT && this.state.totalFunds >= GameConfig.CLICKER.UNLOCK_THRESHOLDS.COIN_MINT) {
            this.state.unlocked.COIN_MINT = true;
            this._renderBuildings();
            
            // Emit unlock event
            this.events.emit('buildingUnlocked', {
                building: 'COIN_MINT',
                totalFunds: this.state.totalFunds
            });
            
            // Show notification
            this._showUnlockNotification('COIN_MINT');
        }
        
        // Bank unlock
        if (!this.state.unlocked.BANK && this.state.totalFunds >= GameConfig.CLICKER.UNLOCK_THRESHOLDS.BANK) {
            this.state.unlocked.BANK = true;
            this._renderBuildings();
            
            // Emit unlock event
            this.events.emit('buildingUnlocked', {
                building: 'BANK',
                totalFunds: this.state.totalFunds
            });
            
            // Show notification
            this._showUnlockNotification('BANK');
        }
        
        // Investment Firm unlock
        if (!this.state.unlocked.INVESTMENT_FIRM && this.state.totalFunds >= GameConfig.CLICKER.UNLOCK_THRESHOLDS.INVESTMENT_FIRM) {
            this.state.unlocked.INVESTMENT_FIRM = true;
            this._renderBuildings();
            
            // Emit unlock event
            this.events.emit('buildingUnlocked', {
                building: 'INVESTMENT_FIRM',
                totalFunds: this.state.totalFunds
            });
            
            // Show notification
            this._showUnlockNotification('INVESTMENT_FIRM');
        }
    }
    
    /**
     * Show building unlock notification
     * @param {string} buildingType - Building type
     * @private
     */
    _showUnlockNotification(buildingType) {
        // Add to game log
        this.uiController.addEventToLog({
            title: '新しい建物がアンロック',
            message: GameText.CLICKER.UNLOCK_MESSAGE.replace('{building}', GameConfig.BUILDINGS[buildingType].name),
            type: 'event-success',
            icon: 'unlock'
        });
        
        // Visual indicator in the UI
        const buildingsHeader = this.buildingsContainer?.parentElement?.querySelector('h3');
        if (buildingsHeader) {
            // Create notification indicator
            const notification = this.document.createElement('span');
            notification.className = 'unlock-notification';
            notification.innerHTML = '新着！';
            notification.style.backgroundColor = '#f39c12';
            notification.style.color = 'white';
            notification.style.padding = '0.2rem 0.5rem';
            notification.style.borderRadius = '10px';
            notification.style.fontSize = '0.7rem';
            notification.style.fontWeight = 'bold';
            notification.style.marginLeft = '10px';
            notification.style.animation = 'pulse 2s infinite';
            
            buildingsHeader.appendChild(notification);
            
            // Show the buildings tab on mobile
            if (this.isMobile) {
                const buildingsTab = this.document.querySelector('.clicker-tab[data-section="buildings"]');
                if (buildingsTab) {
                    buildingsTab.click();
                }
            }
            
            // Remove after 5 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
        }
    }
    
    /**
     * Check achievement status
     * @private
     */
    _checkAchievements() {
        // First Steps
        if (!this.state.achievements.FIRST_STEPS && this.state.totalClicks >= GameConfig.CLICKER.ACHIEVEMENTS.FIRST_STEPS.requirement.totalClicks) {
            this.state.achievements.FIRST_STEPS = true;
            
            // Apply bonus
            this.state.clickMultiplier += GameConfig.CLICKER.ACHIEVEMENTS.FIRST_STEPS.bonus.clickMultiplier;
            
            this._renderAchievements();
            
            // Emit achievement unlocked event
            this.events.emit('achievementUnlocked', {
                achievement: 'FIRST_STEPS',
                bonus: GameConfig.CLICKER.ACHIEVEMENTS.FIRST_STEPS.bonus
            });
            
            // Show notification
            this._showAchievementNotification('FIRST_STEPS');
        }
        
        // Dedicated Mayor
        if (!this.state.achievements.DEDICATED_MAYOR && this.state.totalClicks >= GameConfig.CLICKER.ACHIEVEMENTS.DEDICATED_MAYOR.requirement.totalClicks) {
            this.state.achievements.DEDICATED_MAYOR = true;
            
            // Apply bonus
            this.state.clickMultiplier += GameConfig.CLICKER.ACHIEVEMENTS.DEDICATED_MAYOR.bonus.clickMultiplier;
            
            this._renderAchievements();
            
            // Emit achievement unlocked event
            this.events.emit('achievementUnlocked', {
                achievement: 'DEDICATED_MAYOR',
                bonus: GameConfig.CLICKER.ACHIEVEMENTS.DEDICATED_MAYOR.bonus
            });
            
            // Show notification
            this._showAchievementNotification('DEDICATED_MAYOR');
        }
        
        // Financial Genius
        if (!this.state.achievements.FINANCIAL_GENIUS && this.state.totalFunds >= GameConfig.CLICKER.ACHIEVEMENTS.FINANCIAL_GENIUS.requirement.totalFunds) {
            this.state.achievements.FINANCIAL_GENIUS = true;
            
            // Apply bonus
            this.state.allMultiplier += GameConfig.CLICKER.ACHIEVEMENTS.FINANCIAL_GENIUS.bonus.fundMultiplier;
            
            this._renderAchievements();
            
            // Emit achievement unlocked event
            this.events.emit('achievementUnlocked', {
                achievement: 'FINANCIAL_GENIUS',
                bonus: GameConfig.CLICKER.ACHIEVEMENTS.FINANCIAL_GENIUS.bonus
            });
            
            // Show notification
            this._showAchievementNotification('FINANCIAL_GENIUS');
        }
    }
    
    /**
     * Show achievement notification
     * @param {string} achievementId - Achievement ID
     * @private
     */
    _showAchievementNotification(achievementId) {
        const achievement = GameConfig.CLICKER.ACHIEVEMENTS[achievementId];
        
        // Add to game log
        this.uiController.addEventToLog({
            title: '実績解除',
            message: GameText.CLICKER.ACHIEVEMENT_UNLOCKED.replace('{name}', achievement.name),
            type: 'event-success',
            icon: 'trophy'
        });
        
        // Visual effect in achievement section
        const achievementItem = this.achievementsContainer?.querySelector(`[data-achievement="${achievementId}"]`);
        if (achievementItem) {
            // Add unlocked class and animation
            achievementItem.classList.add('unlocked', 'achievement-unlocked-animation');
            
            // Show the achievements tab on mobile
            if (this.isMobile) {
                const achievementsTab = this.document.querySelector('.clicker-tab[data-section="achievements"]');
                if (achievementsTab) {
                    achievementsTab.click();
                }
            }
            
            // Remove animation class after animation completes
            setTimeout(() => {
                achievementItem.classList.remove('achievement-unlocked-animation');
            }, 2000);
        }
        
        // Mobile用は簡略化したトロフィー表示（重い演出を避ける）
        if (this.isMobile && this.isLowPerformance) {
            const simpleNotification = this.document.createElement('div');
            simpleNotification.className = 'simple-achievement-notification';
            simpleNotification.innerHTML = `
                <i class="fas fa-trophy"></i> 実績解除: ${achievement.name}
            `;
            
            Object.assign(simpleNotification.style, {
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                zIndex: '9999',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            });
            
            this.document.body.appendChild(simpleNotification);
            
            setTimeout(() => {
                simpleNotification.style.opacity = '0';
                setTimeout(() => {
                    if (simpleNotification.parentNode) {
                        simpleNotification.parentNode.removeChild(simpleNotification);
                    }
                }, 500);
            }, 3000);
            
            return;
        }
        
        // Trophy animation overlay
        const trophyOverlay = this.document.createElement('div');
        trophyOverlay.className = 'trophy-overlay';
        trophyOverlay.innerHTML = `
            <div class="trophy-container">
                <i class="fas fa-trophy"></i>
                <div class="trophy-text">
                    <h3>実績解除!</h3>
                    <p>${achievement.name}</p>
                </div>
            </div>
        `;
        
        // Style trophy overlay
        Object.assign(trophyOverlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '2000',
            opacity: '0',
            transition: 'opacity 0.5s',
            pointerEvents: 'none'
        });
        
        // Style trophy container
        const trophyContainer = trophyOverlay.querySelector('.trophy-container');
        Object.assign(trophyContainer.style, {
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            transform: 'scale(0.8)',
            transition: 'transform 0.5s',
            maxWidth: '80%'
        });
        
        // Style trophy icon
        const trophyIcon = trophyOverlay.querySelector('.fa-trophy');
        Object.assign(trophyIcon.style, {
            fontSize: '3rem',
            color: '#f39c12',
            textShadow: '0 2px 10px rgba(243, 156, 18, 0.5)'
        });
        
        // Add to body
        this.document.body.appendChild(trophyOverlay);
        
        // Animate in
        setTimeout(() => {
            trophyOverlay.style.opacity = '1';
            trophyContainer.style.transform = 'scale(1)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            trophyOverlay.style.opacity = '0';
            setTimeout(() => {
                if (trophyOverlay.parentNode) {
                    trophyOverlay.parentNode.removeChild(trophyOverlay);
                }
            }, 500);
        }, 3000);
    }
    
    /**
     * デバウンス関数
     * @param {Function} func - 実行する関数
     * @param {number} wait - 待機時間（ミリ秒）
     * @returns {Function} デバウンスされた関数
     * @private
     */
    _debounce(func, wait) {
        let timeout;
        return function(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Buy building (残りのメソッド省略 - 実際の実装時には完全にコピー)
     */
    
    /**
     * Show clicker UI
     */
    show() {
        // Show UI (initialization handled via setDocument)
        if (this.clickerElement) {
            this.clickerElement.classList.remove('hidden');
            // Add entrance animation
            this.clickerElement.style.animation = 'none';
            void this.clickerElement.offsetHeight; // Force reflow
            this.clickerElement.style.animation = this.isMobile ? 
                'fadeInMobile 0.3s forwards' : 'fadeInScale 0.3s forwards';
        }
        // Emit shown event
        this.events.emit('shown', {
            state: { ...this.state },
            isMobile: this.isMobile
        });
    }
    
    /**
     * Hide clicker UI
     */
    hide() {
        if (this.clickerElement) {
            // Add exit animation
            this.clickerElement.style.animation = this.isMobile ? 
                'fadeOutMobile 0.2s forwards' : 'fadeOutScale 0.3s forwards';
            
            // Actually hide after animation completes
            setTimeout(() => {
                this.clickerElement.classList.add('hidden');
            }, this.isMobile ? 200 : 300);
        }
        
        // Emit hidden event
        this.events.emit('hidden', {
            state: { ...this.state }
        });
    }
}