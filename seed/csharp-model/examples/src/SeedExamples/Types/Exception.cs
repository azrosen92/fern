using SeedExamples;
using System.Text.Json.Serialization;

namespace SeedExamples;

public class Exception
{
    public class _Generic : ExceptionInfo
    {
        [JsonPropertyName("type")]
        public string Type { get; } = "generic";
    }
    public class _Timeout
    {
        [JsonPropertyName("type")]
        public string Type { get; } = "timeout";
    }
}
