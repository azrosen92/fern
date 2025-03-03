using System.Text.Json.Serialization;
using SeedTrace.V2.V3;
using OneOf;

namespace SeedTrace.V2.V3;

public class TestCaseWithActualResultImplementation
{
    [JsonPropertyName("getActualResult")]
    public NonVoidFunctionDefinition GetActualResult { get; init; }

    [JsonPropertyName("assertCorrectnessCheck")]
    public OneOf<AssertCorrectnessCheck._DeepEquality, AssertCorrectnessCheck._Custom> AssertCorrectnessCheck { get; init; }
}
