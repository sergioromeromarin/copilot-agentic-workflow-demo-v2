class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:5000/api'; // Usamos HTTP port 5000
        this.cache = new Map();
        this.cacheTimeout = 15 * 60 * 1000; // 15 minutos
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        // Check cache first
        const cacheKey = url + JSON.stringify(options);
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Cache the response
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async getCharacters(filters = {}) {
        const queryParams = new URLSearchParams();
        
        if (filters.page) queryParams.append('page', filters.page);
        if (filters.pageSize) queryParams.append('pageSize', filters.pageSize);
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.race) queryParams.append('race', filters.race);
        if (filters.affiliation) queryParams.append('affiliation', filters.affiliation);
        if (filters.gender) queryParams.append('gender', filters.gender);

        const endpoint = `/characters?${queryParams.toString()}`;
        return await this.request(endpoint);
    }

    async getCharacter(id) {
        return await this.request(`/characters/${id}`);
    }

    async getPlanets() {
        return await this.request('/planets');
    }

    async compareCharacters(characterIds) {
        const characters = [];
        for (const id of characterIds) {
            try {
                const character = await this.getCharacter(id);
                characters.push(character);
            } catch (error) {
                console.error(`Error fetching character ${id}:`, error);
            }
        }
        return characters;
    }

    clearCache() {
        this.cache.clear();
    }
}

// Global API instance
window.apiService = new ApiService();