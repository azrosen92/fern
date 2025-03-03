using System.Text.Json.Serialization;
using SeedExamples;

namespace SeedExamples;

public class Migration
{
    [JsonPropertyName("name")]
    public string Name { get; init; }

    [JsonPropertyName("status")]
    public MigrationStatus Status { get; init; }
}
