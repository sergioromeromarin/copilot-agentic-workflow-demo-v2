class ComparisonManager {
    constructor() {
        this.comparisonCharacters = [];
    }

    async loadComparison() {
        const selectedIds = Array.from(characterManager.selectedCharacters);
        
        if (selectedIds.length === 0) {
            this.renderEmptyComparison();
            return;
        }

        characterManager.showLoading(true);
        
        try {
            this.comparisonCharacters = await apiService.compareCharacters(selectedIds);
            this.renderComparison();
        } catch (error) {
            console.error('Error loading comparison:', error);
            characterManager.showError('Error al cargar comparación');
        } finally {
            characterManager.showLoading(false);
        }
    }

    renderEmptyComparison() {
        const area = document.getElementById('comparison-area');
        area.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-balance-scale fa-3x text-muted mb-3"></i>
                <h4 class="text-muted">No hay personajes seleccionados</h4>
                <p class="text-muted">Ve a la sección de personajes y selecciona algunos para compararlos aquí.</p>
                <button class="btn btn-primary" onclick="showSection('characters')">
                    <i class="fas fa-users"></i> Ir a Personajes
                </button>
            </div>
        `;
    }

    renderComparison() {
        const area = document.getElementById('comparison-area');
        
        if (this.comparisonCharacters.length === 0) {
            this.renderEmptyComparison();
            return;
        }

        area.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center">
                        <h4><i class="fas fa-balance-scale"></i> Comparando ${this.comparisonCharacters.length} personajes</h4>
                        <button class="btn btn-outline-danger" onclick="comparisonManager.clearComparison()">
                            <i class="fas fa-trash"></i> Limpiar Comparación
                        </button>
                    </div>
                </div>
            </div>

            <!-- Character Images Row -->
            <div class="row mb-4">
                ${this.comparisonCharacters.map(char => `
                    <div class="col">
                        <div class="text-center">
                            <img src="${char.image}" class="img-fluid rounded mb-2" style="height: 200px; object-fit: cover;" alt="${char.name}">
                            <h5>${char.name}</h5>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Comparison Table -->
            <div class="comparison-table">
                <div class="comparison-header">
                    Comparación Detallada
                </div>
                
                ${this.createComparisonRow('Raza', this.comparisonCharacters.map(c => c.race))}
                ${this.createComparisonRow('Género', this.comparisonCharacters.map(c => c.gender))}
                ${this.createComparisonRow('Afiliación', this.comparisonCharacters.map(c => c.affiliation))}
                ${this.createComparisonRow('Ki', this.comparisonCharacters.map(c => c.ki || 'Desconocido'))}
                ${this.createComparisonRow('Ki Máximo', this.comparisonCharacters.map(c => c.maxKi || 'Desconocido'))}
                ${this.createComparisonRow('Planeta de Origen', this.comparisonCharacters.map(c => c.originPlanet?.name || 'Desconocido'))}
                ${this.createComparisonRow('Transformaciones', this.comparisonCharacters.map(c => c.transformations?.length || 0))}
            </div>

            <!-- Transformations Details -->
            ${this.renderTransformationsComparison()}

            <!-- Actions -->
            <div class="row mt-4">
                <div class="col-12 text-center">
                    <button class="btn btn-warning me-2" onclick="comparisonManager.exportComparison()">
                        <i class="fas fa-download"></i> Exportar Comparación
                    </button>
                    <button class="btn btn-info" onclick="comparisonManager.shareComparison()">
                        <i class="fas fa-share"></i> Compartir
                    </button>
                </div>
            </div>
        `;
    }

    createComparisonRow(label, values) {
        return `
            <div class="comparison-row">
                <div class="comparison-cell comparison-label">${label}</div>
                ${values.map(value => `<div class="comparison-cell">${value}</div>`).join('')}
            </div>
        `;
    }

    renderTransformationsComparison() {
        const hasTransformations = this.comparisonCharacters.some(char => 
            char.transformations && char.transformations.length > 0
        );

        if (!hasTransformations) return '';

        return `
            <div class="mt-4">
                <h5><i class="fas fa-magic"></i> Transformaciones</h5>
                <div class="row">
                    ${this.comparisonCharacters.map(char => `
                        <div class="col">
                            <div class="card">
                                <div class="card-header">
                                    <strong>${char.name}</strong>
                                </div>
                                <div class="card-body">
                                    ${char.transformations && char.transformations.length > 0 ? 
                                        char.transformations.map(trans => `
                                            <div class="mb-2">
                                                <div class="d-flex align-items-center">
                                                    ${trans.image ? `<img src="${trans.image}" style="width: 40px; height: 40px; object-fit: cover;" class="rounded me-2" alt="${trans.name}">` : ''}
                                                    <div>
                                                        <strong>${trans.name}</strong><br>
                                                        ${trans.ki ? `<small class="text-muted">Ki: ${trans.ki}</small>` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        `).join('') 
                                        : '<p class="text-muted">Sin transformaciones</p>'
                                    }
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    clearComparison() {
        characterManager.selectedCharacters.clear();
        characterManager.updateComparisonCounter();
        this.renderEmptyComparison();
        
        // Update character cards if in characters section
        document.querySelectorAll('.character-card.selected').forEach(card => {
            card.classList.remove('selected');
            const indicator = card.querySelector('.position-absolute');
            if (indicator) indicator.remove();
            
            const btn = card.querySelector('.btn-warning');
            btn.innerHTML = '<i class="fas fa-balance-scale"></i> Comparar';
        });
    }

    exportComparison() {
        const data = this.comparisonCharacters.map(char => ({
            name: char.name,
            race: char.race,
            gender: char.gender,
            affiliation: char.affiliation,
            ki: char.ki,
            maxKi: char.maxKi,
            originPlanet: char.originPlanet?.name,
            transformations: char.transformations?.length || 0
        }));

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dragon-ball-comparison.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    shareComparison() {
        const characterNames = this.comparisonCharacters.map(c => c.name).join(', ');
        const shareText = `Estoy comparando estos personajes de Dragon Ball: ${characterNames}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Comparación Dragon Ball',
                text: shareText,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Texto copiado al portapapeles');
            });
        }
    }
}

// Global comparison manager instance
window.comparisonManager = new ComparisonManager();