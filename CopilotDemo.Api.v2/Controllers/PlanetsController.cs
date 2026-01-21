using CopilotDemo.Api.v2.Extensions;
using CopilotDemo.Api.v2.Models;
using CopilotDemo.Api.v2.Services;
using Microsoft.AspNetCore.Mvc;

namespace CopilotDemo.Api.v2.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PlanetsController : ControllerBase
{
    private readonly IDragonBallApiService _dragonBallService;
    private readonly ILogger<PlanetsController> _logger;

    public PlanetsController(
        IDragonBallApiService dragonBallService,
        ILogger<PlanetsController> logger)
    {
        _dragonBallService = dragonBallService;
        _logger = logger;
    }

    /// <summary>
    /// Get all Dragon Ball planets
    /// </summary>
    /// <returns>List of planets with their characters</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<PlanetDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<PlanetDto>>> GetPlanets()
    {
        try
        {
            _logger.LogInformation("Getting all planets");

            var planets = await _dragonBallService.GetPlanetsAsync();
            var result = planets.Select(p => p.ToDto()).ToList();

            _logger.LogInformation("Successfully retrieved {Count} planets", result.Count);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Error getting planets");
            return StatusCode(500, new { message = "Error retrieving planets", detail = ex.Message });
        }
    }

    /// <summary>
    /// Get detailed information about a specific planet
    /// </summary>
    /// <param name="id">Planet ID</param>
    /// <returns>Planet details with associated characters</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(PlanetDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PlanetDto>> GetPlanet(int id)
    {
        try
        {
            if (id <= 0)
            {
                return BadRequest(new { message = "Invalid planet ID" });
            }

            _logger.LogInformation("Getting planet with ID: {Id}", id);

            var planet = await _dragonBallService.GetPlanetAsync(id);
            
            if (planet == null)
            {
                return NotFound(new { message = $"Planet with ID {id} not found" });
            }

            return Ok(planet.ToDto());
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Error getting planet {Id}", id);
            return StatusCode(500, new { message = "Error retrieving planet", detail = ex.Message });
        }
    }
}