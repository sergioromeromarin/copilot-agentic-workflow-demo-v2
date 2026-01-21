using CopilotDemo.Api.v2.Extensions;
using CopilotDemo.Api.v2.Models;
using CopilotDemo.Api.v2.Services;
using Microsoft.AspNetCore.Mvc;

namespace CopilotDemo.Api.v2.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ComparisonController : ControllerBase
{
    private readonly IDragonBallApiService _dragonBallService;
    private readonly ILogger<ComparisonController> _logger;

    public ComparisonController(
        IDragonBallApiService dragonBallService,
        ILogger<ComparisonController> logger)
    {
        _dragonBallService = dragonBallService;
        _logger = logger;
    }

    /// <summary>
    /// Compare multiple Dragon Ball characters
    /// </summary>
    /// <param name="request">Character IDs to compare</param>
    /// <returns>List of characters for comparison</returns>
    [HttpPost]
    [ProducesResponseType(typeof(List<CharacterDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<CharacterDto>>> CompareCharacters([FromBody] ComparisonRequest request)
    {
        try
        {
            if (request?.CharacterIds == null || !request.CharacterIds.Any())
            {
                return BadRequest(new { message = "At least one character ID is required" });
            }

            if (request.CharacterIds.Count > 5)
            {
                return BadRequest(new { message = "Maximum 5 characters can be compared" });
            }

            if (request.CharacterIds.Any(id => id <= 0))
            {
                return BadRequest(new { message = "All character IDs must be positive numbers" });
            }

            _logger.LogInformation("Comparing characters: {Ids}", string.Join(", ", request.CharacterIds));

            var characters = new List<Character>();
            var notFoundIds = new List<int>();

            foreach (var id in request.CharacterIds.Distinct())
            {
                var character = await _dragonBallService.GetCharacterAsync(id);
                if (character != null)
                {
                    characters.Add(character);
                }
                else
                {
                    notFoundIds.Add(id);
                }
            }

            if (notFoundIds.Any())
            {
                return BadRequest(new 
                { 
                    message = "Some characters were not found", 
                    notFoundIds = notFoundIds,
                    foundCharacters = characters.Select(c => c.ToDto()).ToList()
                });
            }

            var result = characters.Select(c => c.ToDetailDto()).ToList();

            _logger.LogInformation("Successfully compared {Count} characters", result.Count);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Error comparing characters");
            return StatusCode(500, new { message = "Error comparing characters", detail = ex.Message });
        }
    }

    /// <summary>
    /// Get characters by IDs via GET method (alternative to POST)
    /// </summary>
    /// <param name="ids">Comma-separated character IDs</param>
    /// <returns>List of characters for comparison</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<CharacterDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<CharacterDto>>> GetCharactersForComparison([FromQuery] string ids)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(ids))
            {
                return BadRequest(new { message = "Character IDs parameter is required" });
            }

            var characterIds = ids.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                 .Select(id => int.TryParse(id.Trim(), out var parsedId) ? parsedId : -1)
                                 .Where(id => id > 0)
                                 .Distinct()
                                 .ToList();

            if (!characterIds.Any())
            {
                return BadRequest(new { message = "Valid character IDs are required" });
            }

            if (characterIds.Count > 5)
            {
                return BadRequest(new { message = "Maximum 5 characters can be compared" });
            }

            var request = new ComparisonRequest { CharacterIds = characterIds };
            return await CompareCharacters(request);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing character IDs for comparison");
            return BadRequest(new { message = "Invalid character IDs format" });
        }
    }
}

public class ComparisonRequest
{
    public List<int> CharacterIds { get; set; } = new();
}