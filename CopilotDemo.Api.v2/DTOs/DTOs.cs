namespace CopilotDemo.Api.v2.DTOs;

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
    public PlanetSummaryDto? OriginPlanet { get; set; }
    public List<TransformationDto> Transformations { get; set; } = new();
}

public class CharacterSummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Ki { get; set; } = string.Empty;
    public string Race { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public string Affiliation { get; set; } = string.Empty;
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

public class PlanetSummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsDestroyed { get; set; }
    public string Image { get; set; } = string.Empty;
}

public class TransformationDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public string Ki { get; set; } = string.Empty;
}

public class PagedResponseDto<T>
{
    public List<T> Data { get; set; } = new();
    public PaginationInfoDto Pagination { get; set; } = new();
}

public class PaginationInfoDto
{
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
    public bool HasNext { get; set; }
    public bool HasPrevious { get; set; }
}

public class CharacterFilterDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
    public string? Race { get; set; }
    public string? Affiliation { get; set; }
    public string? Gender { get; set; }
    public string? Name { get; set; }
}

public class CharacterComparisonDto
{
    public List<CharacterDto> Characters { get; set; } = new();
    public ComparisonStatsDto Stats { get; set; } = new();
}

public class ComparisonStatsDto
{
    public Dictionary<string, object> PowerLevels { get; set; } = new();
    public Dictionary<string, int> RaceDistribution { get; set; } = new();
    public Dictionary<string, int> AffiliationDistribution { get; set; } = new();
    public Dictionary<string, int> TransformationCounts { get; set; } = new();
}

public class ApiErrorResponseDto
{
    public int StatusCode { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Details { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}