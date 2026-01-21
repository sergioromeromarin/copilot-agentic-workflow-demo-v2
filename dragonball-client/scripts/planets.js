class PlanetManager {
    constructor() {
        this.planets = [];
        this.isLoading = false;
    }

    async loadPlanets() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        characterManager.showLoading(true);
        
        try {
            this.planets = await apiService.getPlanets();
            this.renderPlanets();
        } catch (error) {
            console.error('Error loading planets:', error);
            characterManager.showError('Error al cargar planetas. Por favor intenta de nuevo.');
        } finally {
            this.isLoading = false;
            characterManager.showLoading(false);
        }
    }

    renderPlanets() {
        const grid = document.getElementById('planets-grid');
        
        if (!this.planets || this.planets.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-globe fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">No se encontraron planetas</h4>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.planets.map(planet => this.createPlanetCard(planet)).join('');
    }

    createPlanetCard(planet) {
        return `
            <div class="col-lg-4 col-md-6">
                <div class="card planet-card h-100 card-hover-effect">
                    <div class="card-body">
                        <h5 class="card-title text-white">
                            <i class="fas fa-globe"></i> ${planet.name}
                        </h5>
                        ${planet.description ? `<p class="card-text text-white-50">${planet.description}</p>` : ''}
                        ${planet.isDestroyed ? '<span class="badge bg-danger mb-2">Destruido</span>' : ''}
                        ${planet.characters && planet.characters.length > 0 ? `
                            <div class="mt-3">
                                <h6 class="text-white">Personajes de este planeta:</h6>
                                <div class="d-flex flex-wrap gap-1">
                                    ${planet.characters.slice(0, 5).map(char => 
                                        `<span class="badge bg-warning text-dark">${char.name}</span>`
                                    ).join('')}
                                    ${planet.characters.length > 5 ? `<span class="badge bg-secondary">+${planet.characters.length - 5} más</span>` : ''}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
}

// Global planet manager instance
window.planetManager = new PlanetManager();