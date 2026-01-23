class ApiService {
    constructor() {
        this.baseUrl = null;
        this._baseUrlPromise = this._initBaseUrl();
        this.cache = new Map();
        this.cacheTimeout = 15 * 60 * 1000; // 15 minutos
    }

    _normalizeApiBaseUrl(url) {
        if (typeof url !== 'string') return null;
        const trimmed = url.trim();
        if (!trimmed) return null;
        return trimmed.replace(/\/+$/, '');
    }

    _getCandidateApiBaseUrls() {
        const candidates = [];

        // 1) Explicit override from HTML: window.__API_BASE_URL = 'https://localhost:5001/api'
        const override = this._normalizeApiBaseUrl(window.__API_BASE_URL);
        if (override) {
            candidates.push(override);
            return candidates;
        }

        // 2) Same-origin (useful if the frontend is served by the API host)
        if (window.location && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
            candidates.push(`${window.location.origin}/api`);
        }

        // 3) Dev defaults, ordered to avoid mixed-content issues
        const pageIsHttps = window.location && window.location.protocol === 'https:';
        if (pageIsHttps) {
            candidates.push('https://localhost:5001/api');
            candidates.push('http://localhost:5000/api');
        } else {
            candidates.push('http://localhost:5000/api');
            candidates.push('https://localhost:5001/api');
        }

        // Deduplicate
        return [...new Set(candidates.map((c) => this._normalizeApiBaseUrl(c)).filter(Boolean))];
    }

    async _isApiReachable(apiBaseUrl) {
        try {
            const parsed = new URL(apiBaseUrl);
            const healthUrl = `${parsed.origin}/health`;
            const response = await fetch(healthUrl, { method: 'GET' });
            return response.ok;
        } catch {
            return false;
        }
    }

    async _initBaseUrl() {
        const candidates = this._getCandidateApiBaseUrls();
        for (const candidate of candidates) {
            // If we can't reach /health, try next candidate
            // (This avoids hard-failing on the wrong port / scheme.)
            // Note: if HTTPS dev cert isn't trusted, the HTTPS candidate may fail.
            // In that case, HTTP will be tried next (unless blocked by mixed-content).
            //
            // If you want to force a value, set window.__API_BASE_URL in the HTML.
            // Example: window.__API_BASE_URL = 'https://localhost:5001/api'
            //
            if (await this._isApiReachable(candidate)) {
                this.baseUrl = candidate;
                console.info('[ApiService] Using API base URL:', this.baseUrl);
                return this.baseUrl;
            }
        }

        // Fall back to first candidate so requests still attempt something,
        // and errors include a useful URL for troubleshooting.
        this.baseUrl = candidates[0] || 'http://localhost:5000/api';
        console.warn('[ApiService] Could not reach API /health. Falling back to:', this.baseUrl);
        return this.baseUrl;
    }

    async request(endpoint, options = {}) {
        if (this._baseUrlPromise) {
            await this._baseUrlPromise;
        }
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
            console.error('API request failed:', { baseUrl: this.baseUrl, endpoint, error });
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