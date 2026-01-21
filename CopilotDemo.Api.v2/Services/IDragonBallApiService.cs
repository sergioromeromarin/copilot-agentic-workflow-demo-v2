using CopilotDemo.Api.v2.Models;

namespace CopilotDemo.Api.v2.Services;

public interface IDragonBallApiService
{
    Task<PagedResponse<Character>> GetCharactersAsync(CharacterFilterRequest request);
    Task<Character?> GetCharacterAsync(int id);
    Task<List<Planet>> GetPlanetsAsync();
    Task<Planet?> GetPlanetAsync(int id);
    Task<List<Character>> SearchCharactersAsync(string query);
}