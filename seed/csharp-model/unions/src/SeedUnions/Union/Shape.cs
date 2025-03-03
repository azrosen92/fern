using SeedUnions;
using System.Text.Json.Serialization;

namespace SeedUnions;

public class Shape
{
    public class _Circle : Circle, _IBase
    {
        [JsonPropertyName("type")]
        public string Type { get; } = "circle";
    }
    public class _Square : Square, _IBase
    {
        [JsonPropertyName("type")]
        public string Type { get; } = "square";
    }
    namespace SeedUnions;

    private interface _IBase
    {
        [JsonPropertyName("id")]
        public string Id { get; init; }
    }
}
