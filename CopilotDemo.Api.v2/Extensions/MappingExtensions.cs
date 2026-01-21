using CopilotDemo.Api.v2.Models;

namespace CopilotDemo.Api.v2.Extensions;

public static class MappingExtensions
{
    public static CharacterDto ToDto(this Character character)
    {
        return new CharacterDto
        {
            Id = character.Id,
            Name = character.Name,
            Ki = character.Ki,
            MaxKi = character.MaxKi,
            Race = character.Race,
            Gender = character.Gender,
            Description = character.Description,
            Image = character.Image,
            Affiliation = character.Affiliation,
            OriginPlanet = character.OriginPlanet?.ToDto(),
            Transformations = character.Transformations?.Select(t => t.ToDto()).ToList() ?? new List<TransformationDto>()
        };
    }

    public static PlanetDto ToDto(this Planet planet)
    {
        return new PlanetDto
        {
            Id = planet.Id,
            Name = planet.Name,
            IsDestroyed = planet.IsDestroyed,
            Description = planet.Description,
            Image = planet.Image,
            Characters = planet.Characters?.Select(c => c.ToSummaryDto()).ToList() ?? new List<CharacterSummaryDto>()
        };
    }

    public static CharacterSummaryDto ToSummaryDto(this Character character)
    {
        return new CharacterSummaryDto
        {
            Id = character.Id,
            Name = character.Name,
            Race = character.Race,
            Affiliation = character.Affiliation
        };
    }

    public static TransformationDto ToDto(this Transformation transformation)
    {
        return new TransformationDto
        {
            Id = transformation.Id,
            Name = transformation.Name,
            Image = transformation.Image,
            Ki = transformation.Ki
        };
    }

    public static CharacterDto ToDetailDto(this Character character)
    {
        return new CharacterDto
        {
            Id = character.Id,
            Name = character.Name,
            Ki = character.Ki,
            MaxKi = character.MaxKi,
            Race = character.Race,
            Gender = character.Gender,
            Description = character.Description,
            Image = character.Image,
            Affiliation = character.Affiliation,
            OriginPlanet = character.OriginPlanet?.ToDto(),
            Transformations = character.Transformations?.Select(t => t.ToDto()).ToList() ?? new List<TransformationDto>()
        };
    }
}