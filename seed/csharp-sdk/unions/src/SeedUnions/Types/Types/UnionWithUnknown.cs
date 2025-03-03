using SeedUnions;
using System.Text.Json.Serialization;

namespace SeedUnions;

public class UnionWithUnknown
{
    public class _Foo : Foo
    {
        [JsonPropertyName("type")]
        public string Type { get; } = "foo";
    }
    public class _Unknown
    {
        [JsonPropertyName("type")]
        public string Type { get; } = "unknown";
    }
}
