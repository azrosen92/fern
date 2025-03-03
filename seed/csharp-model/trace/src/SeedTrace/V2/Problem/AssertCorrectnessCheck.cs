using SeedTrace.V2;
using System.Text.Json.Serialization;

namespace SeedTrace.V2;

public class AssertCorrectnessCheck
{
    public class _DeepEquality : DeepEqualityCorrectnessCheck
    {
        [JsonPropertyName("type")]
        public string Type { get; } = "deepEquality";
    }
    public class _Custom : VoidFunctionDefinitionThatTakesActualResult
    {
        [JsonPropertyName("type")]
        public string Type { get; } = "custom";
    }
}
