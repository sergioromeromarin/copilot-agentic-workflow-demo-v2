// Global state management
let currentSection = 'characters';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dragon Ball Explorer iniciado');
    
    // Load initial data
    characterManager.loadCharacters();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('Aplicación inicializada correctamente');
});

function setupEventListeners() {
    // Setup search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchCharacters();
            }
        });
    }

    // Setup filter change events
    const filters = ['race-filter', 'affiliation-filter', 'gender-filter'];
    filters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.addEventListener('change', searchCharacters);
        }
    });
}

function showSection(sectionName) {
    // Hide all sections
    const sections = ['characters-section', 'planets-section', 'comparison-section'];
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            element.style.display = 'none';
        }
    });

    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.style.display = 'block';
        currentSection = sectionName;
    }

    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Load section data
    switch (sectionName) {
        case 'characters':
            if (characterManager.currentPage === 0) {
                characterManager.loadCharacters();
            }
            break;
        case 'planets':
            if (planetManager.planets.length === 0) {
                planetManager.loadPlanets();
            }
            break;
        case 'comparison':
            comparisonManager.loadComparison();
            break;
    }
}

// Utility functions
function formatNumber(num) {
    if (!num) return 'Desconocido';
    return new Intl.NumberFormat('es-ES').format(num);
}

function formatPower(power) {
    if (!power) return 'Desconocido';
    return power.toLocaleString('es-ES');
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('Error global:', e.error);
    characterManager.showError('Ha ocurrido un error inesperado');
});

// Service worker registration (for offline support - optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}

console.log('Dragon Ball Explorer - Scripts cargados');