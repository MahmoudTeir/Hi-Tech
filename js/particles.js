/**
 * Hi-Tech Internet Hotspot Portal - Animated Particles System
 * Copyright (c) 2025 Mahmoud. All rights reserved.
 * 
 * Developed by: Mahmoud
 * Website: Hi-Tech Internet Services
 * Description: Animated background particles for visual enhancement
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

/**
 * Configuration object for particle system
 */
const PARTICLE_CONFIG = {
    count: 50,
    minSize: 2,
    maxSize: 6,
    minOpacity: 0.3,
    maxOpacity: 0.7,
    minDuration: 15,
    maxDuration: 25,
    regenerationInterval: 60000 // 1 minute
};

/**
 * Generate and display animated particles in the background
 * Creates floating particles with randomized properties for visual appeal
 * 
 * @param {number} [count=50] - Number of particles to generate
 */
function generateParticles(count = PARTICLE_CONFIG.count) {
    const particlesContainer = document.getElementById('particles');
    
    // Check if particles container exists
    if (!particlesContainer) {
        console.warn('Particles container not found');
        return;
    }
    
    // Clear existing particles to prevent accumulation
    particlesContainer.innerHTML = '';
    
    // Generate specified number of particles
    for (let i = 0; i < count; i++) {
        const particle = createParticle();
        particlesContainer.appendChild(particle);
    }
}

/**
 * Create a single particle element with randomized properties
 * 
 * @returns {HTMLElement} Configured particle element
 */
function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Randomize horizontal position
    particle.style.left = Math.random() * 100 + '%';
    
    // Randomize animation timing
    particle.style.animationDelay = Math.random() * 20 + 's';
    particle.style.animationDuration = (
        PARTICLE_CONFIG.minDuration + 
        Math.random() * (PARTICLE_CONFIG.maxDuration - PARTICLE_CONFIG.minDuration)
    ) + 's';
    
    // Randomize particle size for visual variety
    const size = PARTICLE_CONFIG.minSize + Math.random() * (PARTICLE_CONFIG.maxSize - PARTICLE_CONFIG.minSize);
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    
    // Randomize opacity for depth effect
    const opacity = PARTICLE_CONFIG.minOpacity + Math.random() * (PARTICLE_CONFIG.maxOpacity - PARTICLE_CONFIG.minOpacity);
    particle.style.opacity = opacity;
    
    return particle;
}

/**
 * Initialize particle system and set up regeneration
 * Automatically regenerates particles periodically to maintain the effect
 */
function initParticleSystem() {
    // Initial particle generation
    generateParticles();
    
    // Set up periodic regeneration to maintain effect
    setInterval(function() {
        if (document.getElementById('particles')) {
            generateParticles();
        }
    }, PARTICLE_CONFIG.regenerationInterval);
}

// Auto-initialize if DOM is already loaded, otherwise wait for load event
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticleSystem);
} else {
    initParticleSystem();
}