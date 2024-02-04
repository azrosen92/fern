/**
 * This file was auto-generated by Fern from our API Definition.
 */
package com.seed.literal.resources.literal.requests;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.seed.literal.core.ObjectMappers;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
@JsonDeserialize(builder = GetUndiscriminatedOptionsRequest.Builder.class)
public final class GetUndiscriminatedOptionsRequest {
    private final Boolean dryRun;

    private final Map<String, Object> additionalProperties;

    private GetUndiscriminatedOptionsRequest(Boolean dryRun, Map<String, Object> additionalProperties) {
        this.dryRun = dryRun;
        this.additionalProperties = additionalProperties;
    }

    @JsonProperty("dryRun")
    public Boolean getDryRun() {
        return dryRun;
    }

    @java.lang.Override
    public boolean equals(Object other) {
        if (this == other) return true;
        return other instanceof GetUndiscriminatedOptionsRequest && equalTo((GetUndiscriminatedOptionsRequest) other);
    }

    @JsonAnyGetter
    public Map<String, Object> getAdditionalProperties() {
        return this.additionalProperties;
    }

    private boolean equalTo(GetUndiscriminatedOptionsRequest other) {
        return dryRun.equals(other.dryRun);
    }

    @java.lang.Override
    public int hashCode() {
        return Objects.hash(this.dryRun);
    }

    @java.lang.Override
    public String toString() {
        return ObjectMappers.stringify(this);
    }

    public static DryRunStage builder() {
        return new Builder();
    }

    public interface DryRunStage {
        _FinalStage dryRun(Boolean dryRun);

        Builder from(GetUndiscriminatedOptionsRequest other);
    }

    public interface _FinalStage {
        GetUndiscriminatedOptionsRequest build();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static final class Builder implements DryRunStage, _FinalStage {
        private Boolean dryRun;

        @JsonAnySetter
        private Map<String, Object> additionalProperties = new HashMap<>();

        private Builder() {}

        @java.lang.Override
        public Builder from(GetUndiscriminatedOptionsRequest other) {
            dryRun(other.getDryRun());
            return this;
        }

        @java.lang.Override
        @JsonSetter("dryRun")
        public _FinalStage dryRun(Boolean dryRun) {
            this.dryRun = dryRun;
            return this;
        }

        @java.lang.Override
        public GetUndiscriminatedOptionsRequest build() {
            return new GetUndiscriminatedOptionsRequest(dryRun, additionalProperties);
        }
    }
}