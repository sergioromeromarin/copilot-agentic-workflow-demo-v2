import { canExec, canWrite } from '../policy.js';
import { exec } from '../tools/exec.js';
import { readText, writeText } from '../tools/fs.js';
/**
 * Unit Test Generator Agent
 *
 * WHY A CUSTOM RUNNER?
 * This agent demonstrates why we use a custom runner instead of native GitHub Copilot:
 *
 * 1. AUTOMATED EXECUTION: Runs in GitHub Actions on every PR without human intervention
 * 2. POLICY-BASED CONTROL: Respects policy.canWrite and policy.canExec for safe operations
 * 3. STRUCTURED OUTPUT: Returns AgentResult with findings, artifacts, and handoff support
 * 4. CROSS-AGENT COORDINATION: Receives tasks from other agents via receivedHandoffs
 * 5. TOOL INTEGRATION: Uses custom tools (exec, readText, writeText) with error handling
 * 6. CI/CD NATIVE: Designed for automated testing in pipelines (dotnet test with TRX output)
 *
 * Native GitHub Copilot cannot provide:
 * - Multi-agent orchestration with handoffs
 * - Policy-based execution restrictions
 * - Automated CI/CD integration
 * - Structured, programmatic result aggregation
 */
export async function runUnitTestGenerator(policy, repoRoot, receivedHandoffs = []) {
    const findings = [];
    if (receivedHandoffs.length > 0) {
        findings.push({ level: 'info', code: 'tests.handoffs.received', message: `Received ${receivedHandoffs.length} handoff task(s).` });
    }
    const slnPath = 'copilot-agentic-workflow-demo-v2.sln';
    const testProjectPath = 'CopilotDemo.Api.v2.Tests/CopilotDemo.Api.v2.Tests.csproj';
    try {
        await readText(repoRoot, slnPath);
    }
    catch {
        findings.push({ level: 'warn', code: 'tests.sln.missing', message: `Solution file not found: ${slnPath}` });
    }
    try {
        await readText(repoRoot, testProjectPath);
    }
    catch {
        findings.push({ level: 'warn', code: 'tests.project.missing', message: `Test project not found: ${testProjectPath}` });
    }
    if (canWrite(policy)) {
        const generatedTestPath = 'CopilotDemo.Api.v2.Tests/Generated/DragonBallApiService.GeneratedTests.cs';
        const content = `using System.Net;
using System.Text;
using CopilotDemo.Api.v2.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace CopilotDemo.Api.v2.Tests.Generated;

public class DragonBallApiServiceGeneratedTests
{
    [Fact]
    public async Task SearchCharactersAsync_WhenApiReturnsPagedObject_MapsItems()
    {
        var handler = new StubHttpMessageHandler(_ =>
        {
            var json = "{" +
                       "\\\"items\\\":[{" +
                       "\\\"id\\\":3,\\\"name\\\":\\\"Piccolo\\\"" +
                       "}]," +
                       "\\\"meta\\\":{" +
                       "\\\"totalItems\\\":1,\\\"itemCount\\\":1,\\\"itemsPerPage\\\":10,\\\"totalPages\\\":1,\\\"currentPage\\\":1" +
                       "}" +
                       "}";

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
        });

        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://example.test/") };
        var cache = new MemoryCache(new MemoryCacheOptions());
        var config = new ConfigurationBuilder().AddInMemoryCollection().Build();
        var service = new DragonBallApiService(httpClient, cache, NullLogger<DragonBallApiService>.Instance, config);

        var result = await service.SearchCharactersAsync("Piccolo");

        Assert.Single(result);
        Assert.Equal("Piccolo", result[0].Name);
    }

    private sealed class StubHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _handler;

        public StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> handler)
        {
            _handler = handler;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(_handler(request));
        }
    }
}
`;
        try {
            await writeText(policy, repoRoot, generatedTestPath, content);
            findings.push({ level: 'info', code: 'tests.generated.written', message: `Wrote ${generatedTestPath}` });
        }
        catch (e) {
            findings.push({ level: 'warn', code: 'tests.generated.failed', message: String(e?.message ?? e) });
        }
    }
    else {
        findings.push({ level: 'info', code: 'tests.generated.skipped', message: 'Skipping test generation (write disabled by policy).' });
    }
    if (canExec(policy)) {
        try {
            const cmd = `dotnet test ${slnPath} -c Release --logger trx --results-directory artifacts/agent/test-results`;
            const r = await exec(policy, cmd, repoRoot);
            await writeText(policy, repoRoot, 'artifacts/agent/dotnet-test.stdout.log', r.stdout);
            await writeText(policy, repoRoot, 'artifacts/agent/dotnet-test.stderr.log', r.stderr);
            if (r.exitCode === 0) {
                findings.push({ level: 'info', code: 'tests.dotnet.passed', message: `dotnet test passed in ${r.durationMs}ms` });
            }
            else {
                findings.push({ level: 'error', code: 'tests.dotnet.failed', message: `dotnet test failed (exit ${r.exitCode})` });
            }
        }
        catch (e) {
            findings.push({ level: 'error', code: 'tests.dotnet.exec_failed', message: String(e?.message ?? e) });
        }
    }
    else {
        findings.push({ level: 'info', code: 'tests.dotnet.skipped', message: 'Skipping dotnet test (exec disabled by policy).' });
    }
    return {
        name: 'unit-tests',
        summary: 'Unit test generator completed',
        findings,
        proposedEdits: [],
        commands: [],
        artifacts: [
            { path: 'artifacts/agent/test-results', description: 'dotnet test TRX results (if executed)' },
            { path: 'artifacts/agent/dotnet-test.stdout.log', description: 'dotnet test stdout (if executed)' },
            { path: 'artifacts/agent/dotnet-test.stderr.log', description: 'dotnet test stderr (if executed)' }
        ],
        receivedHandoffs
    };
}
