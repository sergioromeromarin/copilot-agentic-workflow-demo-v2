class CharacterManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 12;
        this.currentFilters = {};
        this.selectedCharacters = new Set();
        this.isLoading = false;
    }

    async loadCharacters(page = 1, filters = {}) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);
        
        try {
            const response = await apiService.getCharacters({
                page,
                pageSize: this.pageSize,
                ...filters
            });

            this.renderCharacters(response.data || []);
            this.renderPagination(response.pagination);
            this.currentPage = page;
            this.currentFilters = filters;
            
        } catch (error) {
            console.error('Error loading characters:', error);
            this.showError('Error al cargar personajes. Por favor intenta de nuevo.');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    renderCharacters(characters) {
        const grid = document.getElementById('characters-grid');
        
        if (!characters || characters.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">No se encontraron personajes</h4>
                    <p class="text-muted">Intenta ajustar tus filtros de búsqueda</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = characters.map(character => this.createCharacterCard(character)).join('');
    }

    createCharacterCard(character) {
        const isSelected = this.selectedCharacters.has(character.id);
        return `
            <div class="col-lg-3 col-md-4 col-sm-6">
                <div class="card character-card ${isSelected ? 'selected' : ''}" 
                     onclick="characterManager.selectCharacter(${character.id})"
                     data-character-id="${character.id}">
                    <div class="position-relative">
                        <img src="${character.image || 'https://via.placeholder.com/300x200?text=Sin+Imagen'}" 
                             class="character-image" 
                             alt="${character.name}"
                             onerror="this.src='https://via.placeholder.com/300x200?text=Sin+Imagen'">
                        ${isSelected ? '<div class="position-absolute top-0 end-0 p-2"><i class="fas fa-check-circle text-warning fs-4"></i></div>' : ''}
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${character.name}</h5>
                        <div class="character-stats">
                            <span class="stat-badge race-badge">${character.race}</span>
                            <span class="stat-badge affiliation-badge">${character.affiliation}</span>
                            ${character.ki ? `<span class="stat-badge">Ki: ${character.ki}</span>` : ''}
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-primary btn-sm me-2" 
                                    onclick="event.stopPropagation(); characterManager.showCharacterDetail(${character.id})">
                                <i class="fas fa-info-circle"></i> Detalles
                            </button>
                            <button class="btn btn-warning btn-sm" 
                                    onclick="event.stopPropagation(); characterManager.toggleComparison(${character.id})">
                                <i class="fas fa-balance-scale"></i> 
                                ${isSelected ? 'Quitar' : 'Comparar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    selectCharacter(characterId) {
        this.toggleComparison(characterId);
    }

    toggleComparison(characterId) {
        if (this.selectedCharacters.has(characterId)) {
            this.selectedCharacters.delete(characterId);
        } else {
            if (this.selectedCharacters.size >= 4) {
                alert('Máximo 4 personajes para comparar');
                return;
            }
            this.selectedCharacters.add(characterId);
        }

        this.updateComparisonCounter();
        this.updateCharacterSelection(characterId);
    }

    updateCharacterSelection(characterId) {
        const card = document.querySelector(`[data-character-id="${characterId}"]`);
        if (card) {
            const isSelected = this.selectedCharacters.has(characterId);
            card.classList.toggle('selected', isSelected);
            
            // Update selection indicator
            const indicator = card.querySelector('.position-absolute');
            if (isSelected && !indicator) {
                const img = card.querySelector('img');
                img.insertAdjacentHTML('afterend', 
                    '<div class="position-absolute top-0 end-0 p-2"><i class="fas fa-check-circle text-warning fs-4"></i></div>'
                );
            } else if (!isSelected && indicator) {
                indicator.remove();
            }

            // Update button text
            const btn = card.querySelector('.btn-warning');
            btn.innerHTML = `<i class="fas fa-balance-scale"></i> ${isSelected ? 'Quitar' : 'Comparar'}`;
        }
    }

    updateComparisonCounter() {
        const counter = document.getElementById('comparison-counter');
        const count = this.selectedCharacters.size;
        
        if (count > 0) {
            counter.textContent = `${count} seleccionados`;
            counter.style.display = 'inline';
        } else {
            counter.style.display = 'none';
        }
    }

    async showCharacterDetail(characterId) {
        this.showLoading(true);
        
        try {
            const character = await apiService.getCharacter(characterId);
            this.renderCharacterDetail(character);
            
            const modal = new bootstrap.Modal(document.getElementById('characterModal'));
            modal.show();
            
            // Setup add to comparison button
            const addBtn = document.getElementById('add-to-comparison-btn');
            addBtn.onclick = () => {
                this.toggleComparison(characterId);
                modal.hide();
            };
            
        } catch (error) {
            console.error('Error loading character detail:', error);
            this.showError('Error al cargar detalles del personaje');
        } finally {
            this.showLoading(false);
        }
    }

    renderCharacterDetail(character) {
        const content = document.getElementById('character-detail-content');
        content.innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <img src="${character.image}" class="img-fluid rounded" alt="${character.name}">
                </div>
                <div class="col-md-8">
                    <h3>${character.name}</h3>
                    <div class="character-stats mb-3">
                        <span class="stat-badge race-badge">${character.race}</span>
                        <span class="stat-badge affiliation-badge">${character.affiliation}</span>
                        <span class="stat-badge">${character.gender}</span>
                    </div>
                    
                    ${character.description ? `<p><strong>Descripción:</strong> ${character.description}</p>` : ''}
                    ${character.ki ? `<p><strong>Ki:</strong> ${character.ki}</p>` : ''}
                    ${character.maxKi ? `<p><strong>Ki Máximo:</strong> ${character.maxKi}</p>` : ''}
                    
                    ${character.originPlanet ? `
                        <div class="mb-3">
                            <h5>Planeta de Origen</h5>
                            <div class="alert alert-info">
                                <strong>${character.originPlanet.name}</strong><br>
                                ${character.originPlanet.description || 'No hay descripción disponible'}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${character.transformations && character.transformations.length > 0 ? `
                        <div class="mb-3">
                            <h5>Transformaciones</h5>
                            <div class="row g-2">
                                ${character.transformations.map(transformation => `
                                    <div class="col-6">
                                        <div class="card">
                                            <div class="card-body p-2">
                                                <h6 class="card-title mb-1">${transformation.name}</h6>
                                                ${transformation.image ? `<img src="${transformation.image}" class="img-fluid rounded mb-1" alt="${transformation.name}">` : ''}
                                                ${transformation.ki ? `<small class="text-muted">Ki: ${transformation.ki}</small>` : ''}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderPagination(pagination) {
        const paginationEl = document.getElementById('pagination');
        
        if (!pagination || pagination.totalPages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }

        const { currentPage, totalPages } = pagination;
        let html = '';

        // Previous button
        html += `
            <li class="page-item ${currentPage <= 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="characterManager.loadCharacters(${currentPage - 1}, characterManager.currentFilters)">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="characterManager.loadCharacters(${i}, characterManager.currentFilters)">${i}</a>
                </li>
            `;
        }

        // Next button
        html += `
            <li class="page-item ${currentPage >= totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="characterManager.loadCharacters(${currentPage + 1}, characterManager.currentFilters)">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        paginationEl.innerHTML = html;
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        loading.style.display = show ? 'block' : 'none';
    }

    showError(message) {
        // Create a toast or alert for error messages
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '9999';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
}

// Global character manager instance
window.characterManager = new CharacterManager();

// Search functionality
function searchCharacters() {
    const filters = {
        search: document.getElementById('search-input').value,
        race: document.getElementById('race-filter').value,
        affiliation: document.getElementById('affiliation-filter').value,
        gender: document.getElementById('gender-filter').value
    };

    // Remove empty filters
    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });

    characterManager.loadCharacters(1, filters);
}

// Add enter key support for search input
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchCharacters();
            }
        });
    }
});