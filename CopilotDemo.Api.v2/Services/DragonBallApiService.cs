using CopilotDemo.Api.v2.Models;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

namespace CopilotDemo.Api.v2.Services;

public class DragonBallApiService : IDragonBallApiService
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly ILogger<DragonBallApiService> _logger;
    private readonly IConfiguration _configuration;

    public DragonBallApiService(
        HttpClient httpClient,
        IMemoryCache cache,
        ILogger<DragonBallApiService> logger,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _cache = cache;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<PagedResponse<Character>> GetCharactersAsync(CharacterFilterRequest request)
    {
        var cacheKey = $"characters_{request.GetCacheKey()}";
        if (_cache.TryGetValue(cacheKey, out PagedResponse<Character>? cachedResult))
        {
            _logger.LogInformation("Returning cached characters for key: {CacheKey}", cacheKey);
            return cachedResult!;
        }

        try
        {
            var queryString = BuildCharacterQueryString(request);
            var endpoint = $"characters?{queryString}";
            
            _logger.LogInformation("Fetching characters from: {Endpoint}", endpoint);
            
            var response = await _httpClient.GetAsync(endpoint);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("External API returned {StatusCode} for {Endpoint}", (int)response.StatusCode, endpoint);
                return new PagedResponse<Character>
                {
                    Data = new List<Character>(),
                    Pagination = new PaginationInfo
                    {
                        CurrentPage = request.Page,
                        PageSize = request.PageSize,
                        TotalItems = 0,
                        TotalPages = 0
                    }
                };
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var trimmed = responseContent.TrimStart();

            PagedResponse<Character> result;

            if (trimmed.StartsWith("["))
            {
                var listResponse = JsonSerializer.Deserialize<List<DragonBallCharacter>>(responseContent,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<DragonBallCharacter>();

                var totalItems = listResponse.Count;
                var pageSize = request.PageSize > 0 ? request.PageSize : 12;
                var currentPage = request.Page > 0 ? request.Page : 1;
                var totalPages = pageSize > 0 ? (int)Math.Ceiling(totalItems / (double)pageSize) : 0;

                var pagedItems = listResponse
                    .Skip((currentPage - 1) * pageSize)
                    .Take(pageSize)
                    .Select(MapToCharacter)
                    .ToList();

                result = new PagedResponse<Character>
                {
                    Data = pagedItems,
                    Pagination = new PaginationInfo
                    {
                        CurrentPage = currentPage,
                        PageSize = pageSize,
                        TotalItems = totalItems,
                        TotalPages = totalPages
                    }
                };
            }
            else
            {
                var apiResponse = JsonSerializer.Deserialize<DragonBallApiResponse<DragonBallCharacter>>(responseContent,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (apiResponse == null)
                {
                    throw new InvalidOperationException("Failed to deserialize API response");
                }

                result = new PagedResponse<Character>
                {
                    Data = apiResponse.Items.Select(MapToCharacter).ToList(),
                    Pagination = new PaginationInfo
                    {
                        CurrentPage = apiResponse.Meta.CurrentPage,
                        PageSize = apiResponse.Meta.ItemsPerPage,
                        TotalItems = apiResponse.Meta.TotalItems,
                        TotalPages = apiResponse.Meta.TotalPages
                    }
                };
            }

            // Cache for 15 minutes
            _cache.Set(cacheKey, result, TimeSpan.FromMinutes(15));
            
            _logger.LogInformation("Successfully fetched {Count} characters", result.Data.Count);
            return result;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error when fetching characters");
            throw new InvalidOperationException("Failed to fetch characters from external API", ex);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "JSON deserialization error when fetching characters");
            throw new InvalidOperationException("Failed to parse characters response", ex);
        }
    }

    public async Task<Character?> GetCharacterAsync(int id)
    {
        var cacheKey = $"character_{id}";
        if (_cache.TryGetValue(cacheKey, out Character? cachedCharacter))
        {
            _logger.LogInformation("Returning cached character for ID: {Id}", id);
            return cachedCharacter;
        }

        try
        {
            _logger.LogInformation("Fetching character with ID: {Id}", id);
            
            var response = await _httpClient.GetStringAsync($"characters/{id}");
            var character = JsonSerializer.Deserialize<DragonBallCharacter>(response, 
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (character == null)
            {
                _logger.LogWarning("Character with ID {Id} not found", id);
                return null;
            }

            var result = MapToCharacter(character);
            
            // Cache for 1 hour
            _cache.Set(cacheKey, result, TimeSpan.FromHours(1));
            
            _logger.LogInformation("Successfully fetched character: {Name}", result.Name);
            return result;
        }
        catch (HttpRequestException ex) when (ex.Message.Contains("404"))
        {
            _logger.LogWarning("Character with ID {Id} not found", id);
            return null;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error when fetching character {Id}", id);
            throw new InvalidOperationException($"Failed to fetch character {id} from external API", ex);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "JSON deserialization error when fetching character {Id}", id);
            throw new InvalidOperationException($"Failed to parse character {id} response", ex);
        }
    }

    public async Task<List<Planet>> GetPlanetsAsync()
    {
        var cacheKey = "planets_all";
        if (_cache.TryGetValue(cacheKey, out List<Planet>? cachedPlanets))
        {
            _logger.LogInformation("Returning cached planets");
            return cachedPlanets!;
        }

        try
        {
            _logger.LogInformation("Fetching planets from API");
            
            var response = await _httpClient.GetStringAsync("planets");
            var apiResponse = JsonSerializer.Deserialize<DragonBallApiResponse<DragonBallPlanet>>(response, 
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (apiResponse == null)
            {
                throw new InvalidOperationException("Failed to deserialize planets API response");
            }

            var result = apiResponse.Items.Select(MapToPlanet).ToList();
            
            // Cache for 30 minutes
            _cache.Set(cacheKey, result, TimeSpan.FromMinutes(30));
            
            _logger.LogInformation("Successfully fetched {Count} planets", result.Count);
            return result;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error when fetching planets");
            throw new InvalidOperationException("Failed to fetch planets from external API", ex);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "JSON deserialization error when fetching planets");
            throw new InvalidOperationException("Failed to parse planets response", ex);
        }
    }

    public async Task<Planet?> GetPlanetAsync(int id)
    {
        var cacheKey = $"planet_{id}";
        if (_cache.TryGetValue(cacheKey, out Planet? cachedPlanet))
        {
            _logger.LogInformation("Returning cached planet for ID: {Id}", id);
            return cachedPlanet;
        }

        try
        {
            _logger.LogInformation("Fetching planet with ID: {Id}", id);
            
            var response = await _httpClient.GetStringAsync($"planets/{id}");
            var planet = JsonSerializer.Deserialize<DragonBallPlanet>(response, 
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (planet == null)
            {
                _logger.LogWarning("Planet with ID {Id} not found", id);
                return null;
            }

            var result = MapToPlanet(planet);
            
            // Cache for 1 hour
            _cache.Set(cacheKey, result, TimeSpan.FromHours(1));
            
            _logger.LogInformation("Successfully fetched planet: {Name}", result.Name);
            return result;
        }
        catch (HttpRequestException ex) when (ex.Message.Contains("404"))
        {
            _logger.LogWarning("Planet with ID {Id} not found", id);
            return null;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error when fetching planet {Id}", id);
            throw new InvalidOperationException($"Failed to fetch planet {id} from external API", ex);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "JSON deserialization error when fetching planet {Id}", id);
            throw new InvalidOperationException($"Failed to parse planet {id} response", ex);
        }
    }

    public async Task<List<Character>> SearchCharactersAsync(string query)
    {
        var cacheKey = $"search_{query}";
        if (_cache.TryGetValue(cacheKey, out List<Character>? cachedResults))
        {
            _logger.LogInformation("Returning cached search results for query: {Query}", query);
            return cachedResults!;
        }

        try
        {
            _logger.LogInformation("Searching characters with query: {Query}", query);
            
            var response = await _httpClient.GetAsync($"characters?name={Uri.EscapeDataString(query)}");
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("External API returned {StatusCode} for search query: {Query}", (int)response.StatusCode, query);
                return new List<Character>();
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var trimmed = responseContent.TrimStart();

            List<Character> result;

            if (trimmed.StartsWith("["))
            {
                var listResponse = JsonSerializer.Deserialize<List<DragonBallCharacter>>(responseContent,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<DragonBallCharacter>();

                result = listResponse.Select(MapToCharacter).ToList();
            }
            else
            {
                var apiResponse = JsonSerializer.Deserialize<DragonBallApiResponse<DragonBallCharacter>>(responseContent,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (apiResponse == null)
                {
                    throw new InvalidOperationException("Failed to deserialize search API response");
                }

                result = apiResponse.Items.Select(MapToCharacter).ToList();
            }
            
            // Cache search results for 10 minutes
            _cache.Set(cacheKey, result, TimeSpan.FromMinutes(10));
            
            _logger.LogInformation("Search returned {Count} characters for query: {Query}", result.Count, query);
            return result;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error when searching characters with query: {Query}", query);
            throw new InvalidOperationException($"Failed to search characters with query '{query}' from external API", ex);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "JSON deserialization error when searching characters with query: {Query}", query);
            throw new InvalidOperationException($"Failed to parse search results for query '{query}'", ex);
        }
    }

    private string BuildCharacterQueryString(CharacterFilterRequest request)
    {
        var queryParams = new List<string>();

        if (request.Page > 0)
            queryParams.Add($"page={request.Page}");
            
        if (request.PageSize > 0)
            queryParams.Add($"limit={request.PageSize}");

        if (!string.IsNullOrWhiteSpace(request.Search))
            queryParams.Add($"name={Uri.EscapeDataString(request.Search)}");

        if (!string.IsNullOrWhiteSpace(request.Race))
            queryParams.Add($"race={Uri.EscapeDataString(request.Race)}");

        if (!string.IsNullOrWhiteSpace(request.Affiliation))
            queryParams.Add($"affiliation={Uri.EscapeDataString(request.Affiliation)}");

        if (!string.IsNullOrWhiteSpace(request.Gender))
            queryParams.Add($"gender={Uri.EscapeDataString(request.Gender)}");

        return string.Join("&", queryParams);
    }

    private Character MapToCharacter(DragonBallCharacter dbCharacter)
    {
        return new Character
        {
            Id = dbCharacter.Id,
            Name = dbCharacter.Name,
            Ki = dbCharacter.Ki,
            MaxKi = dbCharacter.MaxKi,
            Race = dbCharacter.Race,
            Gender = dbCharacter.Gender,
            Description = dbCharacter.Description,
            Image = dbCharacter.Image,
            Affiliation = dbCharacter.Affiliation,
            OriginPlanet = dbCharacter.OriginPlanet != null ? MapToPlanet(dbCharacter.OriginPlanet) : null,
            Transformations = dbCharacter.Transformations?.Select(MapToTransformation).ToList() ?? new List<Transformation>()
        };
    }

    private Planet MapToPlanet(DragonBallPlanet dbPlanet)
    {
        return new Planet
        {
            Id = dbPlanet.Id,
            Name = dbPlanet.Name,
            IsDestroyed = dbPlanet.IsDestroyed,
            Description = dbPlanet.Description,
            Image = dbPlanet.Image,
            Characters = dbPlanet.Characters?.Select(MapToCharacter).ToList() ?? new List<Character>()
        };
    }

    private Transformation MapToTransformation(DragonBallTransformation dbTransformation)
    {
        return new Transformation
        {
            Id = dbTransformation.Id,
            Name = dbTransformation.Name,
            Image = dbTransformation.Image,
            Ki = dbTransformation.Ki
        };
    }
}