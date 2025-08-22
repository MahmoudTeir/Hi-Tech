/**
 * Hi-Tech Internet Hotspot Portal - Dynamic Theme System
 * Copyright (c) 2025 Mahmoud. All rights reserved.
 * 
 * Developed by: Mahmoud
 * Website: Hi-Tech Internet Services
 * Description: Time-based and seasonal theme system with smooth transitions
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

// Theme configuration
const THEMES = {
    day: {
        name: 'نهار',
        primary: '#22C55E',
        secondary: '#16A34A',
        accent: '#059669',
        background: 'linear-gradient(135deg, #E0F2FE 0%, #F0F9FF 50%, #E0F7FA 100%)',
        text: '#111827',
        textLight: '#FFFFFF',
        shadow: 'rgba(34, 197, 94, 0.3)',
        particles: 'rgba(255, 255, 255, 0.6)',
        time: { start: 6, end: 18 }
    },
    night: {
        name: 'ليل',
        primary: '#6366F1',
        secondary: '#4F46E5',
        accent: '#3730A3',
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E3A8A 100%)',
        text: '#FFFFFF',
        textLight: '#E5E7EB',
        shadow: 'rgba(99, 102, 241, 0.4)',
        particles: 'rgba(99, 102, 241, 0.8)',
        time: { start: 18, end: 6 }
    },
    dawn: {
        name: 'فجر',
        primary: '#F59E0B',
        secondary: '#D97706',
        accent: '#B45309',
        background: 'linear-gradient(135deg, #FEF3C7 0%, #FCD34D 30%, #F59E0B 70%, #D97706 100%)',
        text: '#111827',
        textLight: '#FFFFFF',
        shadow: 'rgba(245, 158, 11, 0.4)',
        particles: 'rgba(252, 211, 77, 0.7)',
        time: { start: 5, end: 7 }
    },
    dusk: {
        name: 'غروب',
        primary: '#EC4899',
        secondary: '#DB2777',
        accent: '#BE185D',
        background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 30%, #F9A8D4 70%, #EC4899 100%)',
        text: '#111827',
        textLight: '#FFFFFF',
        shadow: 'rgba(236, 72, 153, 0.4)',
        particles: 'rgba(249, 168, 212, 0.7)',
        time: { start: 17, end: 19 }
    }
};

const SEASONAL_THEMES = {
    spring: {
        name: 'ربيع',
        primary: '#10B981',
        secondary: '#059669',
        accent: '#047857',
        background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 50%, #A7F3D0 100%)',
        months: [2, 3, 4] // March, April, May
    },
    summer: {
        name: 'صيف',
        primary: '#F59E0B',
        secondary: '#D97706',
        accent: '#B45309',
        background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FCD34D 100%)',
        months: [5, 6, 7] // June, July, August
    },
    autumn: {
        name: 'خريف',
        primary: '#EA580C',
        secondary: '#DC2626',
        accent: '#B91C1C',
        background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 50%, #FDBA74 100%)',
        months: [8, 9, 10] // September, October, November
    },
    winter: {
        name: 'شتاء',
        primary: '#0EA5E9',
        secondary: '#0284C7',
        accent: '#0369A1',
        background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 50%, #BAE6FD 100%)',
        months: [11, 0, 1] // December, January, February
    }
};

const WEATHER_THEMES = {
    sunny: {
        name: 'مشمس',
        background: 'linear-gradient(135deg, #FEF3C7 0%, #FCD34D 50%, #F59E0B 100%)',
        particles: 'rgba(252, 211, 77, 0.8)',
        effects: 'sunny-rays'
    },
    cloudy: {
        name: 'غائم',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 50%, #CBD5E1 100%)',
        particles: 'rgba(203, 213, 225, 0.6)',
        effects: 'floating-clouds'
    },
    rainy: {
        name: 'ممطر',
        background: 'linear-gradient(135deg, #1E293B 0%, #475569 50%, #64748B 100%)',
        particles: 'rgba(148, 163, 184, 0.8)',
        effects: 'rain-drops'
    },
    snowy: {
        name: 'ثلجي',
        background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 50%, #CBD5E1 100%)',
        particles: 'rgba(241, 245, 249, 0.9)',
        effects: 'snow-flakes'
    }
};

/**
 * Dynamic Theme Manager Class
 */
class DynamicThemeManager {
    constructor() {
        this.currentTheme = null;
        this.currentSeason = null;
        this.currentWeather = 'sunny';
        this.transitionDuration = 1000; // 1 second
        
        this.init();
    }

    /**
     * Initialize the theme system
     */
    init() {
        // Apply initial theme
        this.updateTheme();
        
        // Update theme every 30 minutes
        setInterval(() => {
            this.updateTheme();
        }, 30 * 60 * 1000);
        
        // Update date/time display every second
        setInterval(() => {
            if (this.currentTheme) {
                this.updateDateTimeDisplay(this.currentTheme);
            }
        }, 1000);
        
        // Listen for manual theme changes
        this.setupThemeControls();
        
        console.log('Dynamic Theme System initialized');
    }

    /**
     * Get current time-based theme
     */
    getTimeBasedTheme() {
        const hour = new Date().getHours();
        
        // Dawn (5-7 AM)
        if (hour >= 5 && hour < 7) {
            return THEMES.dawn;
        }
        // Day (7 AM - 5 PM)
        else if (hour >= 7 && hour < 17) {
            return THEMES.day;
        }
        // Dusk (5-7 PM)
        else if (hour >= 17 && hour < 19) {
            return THEMES.dusk;
        }
        // Night (7 PM - 5 AM)
        else {
            return THEMES.night;
        }
    }

    /**
     * Get current seasonal theme
     */
    getSeasonalTheme() {
        const month = new Date().getMonth();
        
        for (const [season, config] of Object.entries(SEASONAL_THEMES)) {
            if (config.months.includes(month)) {
                return { season, ...config };
            }
        }
        
        return { season: 'spring', ...SEASONAL_THEMES.spring };
    }

    /**
     * Merge time and seasonal themes
     */
    mergeThemes(timeTheme, seasonalTheme) {
        return {
            ...timeTheme,
            // Add seasonal influences
            accent: seasonalTheme.primary,
            seasonalBackground: seasonalTheme.background,
            season: seasonalTheme.season,
            seasonName: seasonalTheme.name
        };
    }

    /**
     * Apply theme to DOM
     */
    applyTheme(theme) {
        const root = document.documentElement;
        
        // Apply CSS custom properties
        root.style.setProperty('--dynamic-primary', theme.primary);
        root.style.setProperty('--dynamic-secondary', theme.secondary);
        root.style.setProperty('--dynamic-accent', theme.accent);
        root.style.setProperty('--dynamic-text', theme.text);
        root.style.setProperty('--dynamic-text-light', theme.textLight);
        root.style.setProperty('--dynamic-shadow', theme.shadow);
        root.style.setProperty('--dynamic-particles', theme.particles);
        
        // Apply background with smooth transition
        document.body.style.transition = `background ${this.transitionDuration}ms ease`;
        
        // Combine time and seasonal backgrounds
        const weatherBg = WEATHER_THEMES[this.currentWeather]?.background || theme.background;
        document.body.style.background = weatherBg;
        
        // Update theme class
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme.name.replace(/\s+/g, '-')}`);
        document.body.classList.add(`season-${theme.season}`);
        document.body.classList.add(`weather-${this.currentWeather}`);
        
        // Update particles
        this.updateParticles(theme);
        
        // Update date/time/weather display
        this.updateDateTimeDisplay(theme);
        
        console.log(`Applied theme: ${theme.name} (${theme.seasonName}) - ${WEATHER_THEMES[this.currentWeather].name}`);
    }

    /**
     * Update theme based on current time and season
     */
    updateTheme() {
        const timeTheme = this.getTimeBasedTheme();
        const seasonalTheme = this.getSeasonalTheme();
        const mergedTheme = this.mergeThemes(timeTheme, seasonalTheme);
        
        this.currentTheme = mergedTheme;
        this.currentSeason = seasonalTheme.season;
        
        this.applyTheme(mergedTheme);
    }

    /**
     * Update particles based on theme
     */
    updateParticles(theme) {
        const particles = document.querySelectorAll('.particle');
        particles.forEach(particle => {
            particle.style.background = theme.particles;
            particle.style.boxShadow = `0 0 10px ${theme.particles}`;
        });
        
        // Add weather effects
        this.addWeatherEffects();
    }

    /**
     * Add weather-specific visual effects
     */
    addWeatherEffects() {
        // Remove existing weather effects
        const existingEffects = document.querySelector('.weather-effects');
        if (existingEffects) {
            existingEffects.remove();
        }

        const weatherConfig = WEATHER_THEMES[this.currentWeather];
        if (!weatherConfig.effects) return;

        const effectsContainer = document.createElement('div');
        effectsContainer.className = 'weather-effects';
        effectsContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;

        // Create weather-specific effects
        switch (weatherConfig.effects) {
            case 'sunny-rays':
                this.createSunRays(effectsContainer);
                break;
            case 'rain-drops':
                this.createRainDrops(effectsContainer);
                break;
            case 'snow-flakes':
                this.createSnowFlakes(effectsContainer);
                break;
            case 'floating-clouds':
                this.createFloatingClouds(effectsContainer);
                break;
        }

        document.body.appendChild(effectsContainer);
    }

    /**
     * Create sun ray effects
     */
    createSunRays(container) {
        for (let i = 0; i < 5; i++) {
            const ray = document.createElement('div');
            ray.className = 'sun-ray';
            ray.style.cssText = `
                position: absolute;
                top: ${Math.random() * 30}%;
                right: ${Math.random() * 30}%;
                width: ${200 + Math.random() * 100}px;
                height: 2px;
                background: linear-gradient(90deg, transparent, rgba(252, 211, 77, 0.6), transparent);
                transform: rotate(${Math.random() * 45 - 22.5}deg);
                animation: fadeInOut ${3 + Math.random() * 2}s ease-in-out infinite alternate;
            `;
            container.appendChild(ray);
        }
    }

    /**
     * Create rain drop effects
     */
    createRainDrops(container) {
        for (let i = 0; i < 50; i++) {
            const drop = document.createElement('div');
            drop.className = 'rain-drop';
            drop.style.cssText = `
                position: absolute;
                left: ${Math.random() * 100}%;
                width: 2px;
                height: ${10 + Math.random() * 10}px;
                background: linear-gradient(rgba(148, 163, 184, 0.8), rgba(148, 163, 184, 0.2));
                border-radius: 0 0 50% 50%;
                animation: rainFall ${0.5 + Math.random() * 0.5}s linear infinite;
                animation-delay: ${Math.random() * 2}s;
            `;
            container.appendChild(drop);
        }
    }

    /**
     * Create snow flake effects
     */
    createSnowFlakes(container) {
        for (let i = 0; i < 30; i++) {
            const flake = document.createElement('div');
            flake.className = 'snow-flake';
            flake.innerHTML = '❄';
            flake.style.cssText = `
                position: absolute;
                left: ${Math.random() * 100}%;
                font-size: ${10 + Math.random() * 10}px;
                color: rgba(241, 245, 249, 0.8);
                animation: snowFall ${3 + Math.random() * 2}s linear infinite;
                animation-delay: ${Math.random() * 3}s;
            `;
            container.appendChild(flake);
        }
    }

    /**
     * Create floating cloud effects
     */
    createFloatingClouds(container) {
        for (let i = 0; i < 3; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'floating-cloud';
            cloud.innerHTML = '☁';
            cloud.style.cssText = `
                position: absolute;
                top: ${10 + Math.random() * 30}%;
                left: ${Math.random() * 100}%;
                font-size: ${30 + Math.random() * 20}px;
                color: rgba(203, 213, 225, 0.6);
                animation: cloudFloat ${10 + Math.random() * 5}s ease-in-out infinite;
                animation-delay: ${Math.random() * 5}s;
            `;
            container.appendChild(cloud);
        }
    }

    /**
     * Setup manual theme controls
     */
    setupThemeControls() {
        // Create theme control panel
        const controlPanel = document.createElement('div');
        controlPanel.id = 'theme-controls';
        controlPanel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 12px;
            z-index: 1000;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;

        // Weather control
        const weatherSelect = document.createElement('select');
        weatherSelect.style.cssText = `
            margin: 4px;
            padding: 6px;
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 12px;
        `;

        Object.keys(WEATHER_THEMES).forEach(weather => {
            const option = document.createElement('option');
            option.value = weather;
            option.textContent = WEATHER_THEMES[weather].name;
            option.style.color = 'black';
            weatherSelect.appendChild(option);
        });

        weatherSelect.addEventListener('change', (e) => {
            this.currentWeather = e.target.value;
            this.updateTheme();
        });

        controlPanel.appendChild(weatherSelect);
        document.body.appendChild(controlPanel);
    }

    /**
     * Update date/time/weather display on login page
     */
    /**
     * Get current theme info
     */
    getThemeInfo() {
        return {
            theme: this.currentTheme?.name,
            season: this.currentTheme?.seasonName,
            weather: WEATHER_THEMES[this.currentWeather]?.name,
            time: new Date().toLocaleTimeString('ar-EG')
        };
    }
}

// CSS animations for weather effects
const weatherAnimations = `
@keyframes fadeInOut {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
}

@keyframes rainFall {
    to { transform: translateY(100vh); }
}

@keyframes snowFall {
    to { 
        transform: translateY(100vh) rotate(360deg);
        opacity: 0;
    }
}

@keyframes cloudFloat {
    0%, 100% { transform: translateX(-20px); }
    50% { transform: translateX(20px); }
}
`;

// Add weather animations to document
const style = document.createElement('style');
style.textContent = weatherAnimations;
document.head.appendChild(style);

// Initialize dynamic theme system when DOM is loaded
let dynamicThemeManager;

function initializeDynamicThemes() {
    if (!dynamicThemeManager) {
        dynamicThemeManager = new DynamicThemeManager();
    }
}

// Auto-initialize on DOM content loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDynamicThemes);
} else {
    initializeDynamicThemes();
}

// Expose for debugging
window.themeManager = dynamicThemeManager;