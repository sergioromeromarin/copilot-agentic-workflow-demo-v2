namespace CopilotDemo.Api.v2.Models;

// External API Models (Dragon Ball API structure)
public class DragonBallCharacter
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Ki { get; set; } = string.Empty;
    public string MaxKi { get; set; } = string.Empty;
    public string Race { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public string Affiliation { get; set; } = string.Empty;
    public DragonBallPlanet? OriginPlanet { get; set; }
    public List<DragonBallTransformation> Transformations { get; set; } = new();
}

public class DragonBallPlanet
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsDestroyed { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public List<DragonBallCharacter> Characters { get; set; } = new();
}

public class DragonBallTransformation
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public string Ki { get; set; } = string.Empty;
}

// API Response Models
public class DragonBallApiResponse<T>
{
    public List<T> Items { get; set; } = new();
    public DragonBallMeta Meta { get; set; } = new();
}

public class DragonBallMeta
{
    public int TotalItems { get; set; }
    public int ItemCount { get; set; }
    public int ItemsPerPage { get; set; }
    public int TotalPages { get; set; }
    public int CurrentPage { get; set; }
}

// Internal Models for our API
public class Character
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Ki { get; set; } = string.Empty;
    public string MaxKi { get; set; } = string.Empty;
    public string Race { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public string Affiliation { get; set; } = string.Empty;
    public Planet? OriginPlanet { get; set; }
    public List<Transformation> Transformations { get; set; } = new();
}

public class Planet
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsDestroyed { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public List<Character> Characters { get; set; } = new();
}

public class Transformation
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public string Ki { get; set; } = string.Empty;
}

// DTOs for API responses
public class CharacterDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Ki { get; set; } = string.Empty;
    public string MaxKi { get; set; } = string.Empty;
    public string Race { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public string Affiliation { get; set; } = string.Empty;
    public PlanetDto? OriginPlanet { get; set; }
    public List<TransformationDto> Transformations { get; set; } = new();
}

public class PlanetDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsDestroyed { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public List<CharacterSummaryDto> Characters { get; set; } = new();
}

public class CharacterSummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Race { get; set; } = string.Empty;
    public string Affiliation { get; set; } = string.Empty;
}

public class TransformationDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public string Ki { get; set; } = string.Empty;
}

public class PagedResponse<T>
{
    public List<T> Data { get; set; } = new();
    public PaginationInfo Pagination { get; set; } = new();
}

public class PaginationInfo
{
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}

public class CharacterFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Search { get; set; }
    public string? Race { get; set; }
    public string? Affiliation { get; set; }
    public string? Gender { get; set; }

    public string GetCacheKey()
    {
        return $"{Page}_{PageSize}_{Search}_{Race}_{Affiliation}_{Gender}";
    }
}