using System.Net;
using System.Text;
using CopilotDemo.Api.v2.Models;
using CopilotDemo.Api.v2.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace CopilotDemo.Api.v2.Tests;

public class DragonBallApiServiceTests
{
    [Fact]
    public async Task GetCharactersAsync_WhenApiReturnsArray_PaginatesLocally()
    {
        var handler = new StubHttpMessageHandler(request =>
        {
            var json = "[" +
                       "{\"id\":1,\"name\":\"Goku\",\"ki\":\"9000\",\"maxKi\":\"10000\",\"race\":\"Saiyan\",\"gender\":\"Male\"}," +
                       "{\"id\":2,\"name\":\"Gohan\",\"ki\":\"5000\",\"maxKi\":\"7000\",\"race\":\"Saiyan\",\"gender\":\"Male\"}" +
                       "]";

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
        });

        var service = CreateService(handler);

        var request = new CharacterFilterRequest
        {
            Page = 1,
            PageSize = 1,
            Search = "Goku"
        };

        var result = await service.GetCharactersAsync(request);

        Assert.Single(result.Data);
        Assert.Equal("Goku", result.Data[0].Name);
        Assert.Equal(2, result.Pagination.TotalItems);
        Assert.Equal(2, result.Pagination.TotalPages);

        var uri = handler.Requests.Single().RequestUri?.ToString();
        Assert.NotNull(uri);
        Assert.Contains("characters?", uri);
        Assert.Contains("page=1", uri);
        Assert.Contains("limit=1", uri);
        Assert.Contains("name=Goku", uri);
    }

    [Fact]
    public async Task GetCharactersAsync_WhenApiReturnsPagedObject_UsesMetaPagination()
    {
        var handler = new StubHttpMessageHandler(request =>
        {
            var json = "{" +
                       "\"items\":[{" +
                       "\"id\":10,\"name\":\"Vegeta\",\"ki\":\"8000\",\"maxKi\":\"9000\",\"race\":\"Saiyan\",\"gender\":\"Male\"" +
                       "}]," +
                       "\"meta\":{" +
                       "\"totalItems\":123,\"itemCount\":1,\"itemsPerPage\":10,\"totalPages\":13,\"currentPage\":2" +
                       "}" +
                       "}";

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
        });

        var service = CreateService(handler);

        var request = new CharacterFilterRequest
        {
            Page = 2,
            PageSize = 10
        };

        var result = await service.GetCharactersAsync(request);

        Assert.Single(result.Data);
        Assert.Equal("Vegeta", result.Data[0].Name);
        Assert.Equal(2, result.Pagination.CurrentPage);
        Assert.Equal(10, result.Pagination.PageSize);
        Assert.Equal(123, result.Pagination.TotalItems);
        Assert.Equal(13, result.Pagination.TotalPages);
    }

    [Fact]
    public async Task SearchCharactersAsync_WhenApiReturnsArray_MapsAllItems()
    {
        var handler = new StubHttpMessageHandler(request =>
        {
            var json = "[" +
                       "{\"id\":1,\"name\":\"Goku\"}," +
                       "{\"id\":2,\"name\":\"Gohan\"}" +
                       "]";

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
        });

        var service = CreateService(handler);

        var result = await service.SearchCharactersAsync("Goku");

        Assert.Equal(2, result.Count);
        Assert.Contains(result, c => c.Name == "Goku");
        Assert.Contains(result, c => c.Name == "Gohan");

        var uri = handler.Requests.Single().RequestUri?.ToString();
        Assert.NotNull(uri);
        Assert.Contains("characters?name=Goku", uri);
    }

    private static DragonBallApiService CreateService(StubHttpMessageHandler handler)
    {
        var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://example.test/")
        };

        var cache = new MemoryCache(new MemoryCacheOptions());
        var config = new ConfigurationBuilder().AddInMemoryCollection().Build();

        return new DragonBallApiService(
            httpClient,
            cache,
            NullLogger<DragonBallApiService>.Instance,
            config);
    }

    private sealed class StubHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _handler;

        public List<HttpRequestMessage> Requests { get; } = new();

        public StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> handler)
        {
            _handler = handler;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests.Add(request);
            return Task.FromResult(_handler(request));
        }
    }
}