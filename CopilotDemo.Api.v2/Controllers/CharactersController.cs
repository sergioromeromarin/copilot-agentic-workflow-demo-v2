using CopilotDemo.Api.v2.Extensions;
using CopilotDemo.Api.v2.Models;
using CopilotDemo.Api.v2.Services;
using Microsoft.AspNetCore.Mvc;

namespace CopilotDemo.Api.v2.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CharactersController : ControllerBase
{
    private readonly IDragonBallApiService _dragonBallService;
    private readonly ILogger<CharactersController> _logger;

    public CharactersController(
        IDragonBallApiService dragonBallService,
        ILogger<CharactersController> logger)
    {
        _dragonBallService = dragonBallService;
        _logger = logger;
    }

    /// <summary>
    /// Get paginated list of Dragon Ball characters with filtering options
    /// </summary>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Items per page (default: 12)</param>
    /// <param name="search">Search by character name</param>
    /// <param name="race">Filter by race</param>
    /// <param name="affiliation">Filter by affiliation</param>
    /// <param name="gender">Filter by gender</param>
    /// <returns>Paginated list of characters</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<CharacterDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PagedResponse<CharacterDto>>> GetCharacters(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] string? search = null,
        [FromQuery] string? race = null,
        [FromQuery] string? affiliation = null,
        [FromQuery] string? gender = null)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 50) pageSize = 12;

            var request = new CharacterFilterRequest
            {
                Page = page,
                PageSize = pageSize,
                Search = search,
                Race = race,
                Affiliation = affiliation,
                Gender = gender
            };

            _logger.LogInformation("Getting characters with filters: {Filters}", request);

            var result = await _dragonBallService.GetCharactersAsync(request);
            
            var response = new PagedResponse<CharacterDto>
            {
                Data = result.Data.Select(c => c.ToDto()).ToList(),
                Pagination = result.Pagination
            };

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Error getting characters");
            return StatusCode(500, new { message = "Error retrieving characters", detail = ex.Message });
        }
    }

    /// <summary>
    /// Get detailed information about a specific character
    /// </summary>
    /// <param name="id">Character ID</param>
    /// <returns>Character details with transformations and origin planet</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(CharacterDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<CharacterDto>> GetCharacter(int id)
    {
        try
        {
            if (id <= 0)
            {
                return BadRequest(new { message = "Invalid character ID" });
            }

            _logger.LogInformation("Getting character with ID: {Id}", id);

            var character = await _dragonBallService.GetCharacterAsync(id);
            
            if (character == null)
            {
                return NotFound(new { message = $"Character with ID {id} not found" });
            }

            return Ok(character.ToDetailDto());
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Error getting character {Id}", id);
            return StatusCode(500, new { message = "Error retrieving character", detail = ex.Message });
        }
    }

    /// <summary>
    /// Search characters by name
    /// </summary>
    /// <param name="query">Search query</param>
    /// <returns>List of matching characters</returns>
    [HttpGet("search")]
    [ProducesResponseType(typeof(List<CharacterDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<CharacterDto>>> SearchCharacters([FromQuery] string query)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(new { message = "Search query is required" });
            }

            if (query.Length < 2)
            {
                return BadRequest(new { message = "Search query must be at least 2 characters long" });
            }

            _logger.LogInformation("Searching characters with query: {Query}", query);

            var characters = await _dragonBallService.SearchCharactersAsync(query);
            var result = characters.Select(c => c.ToDto()).ToList();

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Error searching characters with query: {Query}", query);
            return StatusCode(500, new { message = "Error searching characters", detail = ex.Message });
        }
    }
}