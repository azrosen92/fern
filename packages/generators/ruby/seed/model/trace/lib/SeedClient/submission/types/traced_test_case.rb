# frozen_string_literal: true

require_relative "submission/types/TestCaseResultWithStdout"
require "json"

module SeedClient
  module Submission
    class TracedTestCase
      attr_reader :result, :trace_responses_size, :additional_properties

      # @param result [Submission::TestCaseResultWithStdout]
      # @param trace_responses_size [Integer]
      # @param additional_properties [OpenStruct] Additional properties unmapped to the current class definition
      # @return [Submission::TracedTestCase]
      def initialze(result:, trace_responses_size:, additional_properties: nil)
        # @type [Submission::TestCaseResultWithStdout]
        @result = result
        # @type [Integer]
        @trace_responses_size = trace_responses_size
        # @type [OpenStruct] Additional properties unmapped to the current class definition
        @additional_properties = additional_properties
      end

      # Deserialize a JSON object to an instance of TracedTestCase
      #
      # @param json_object [JSON]
      # @return [Submission::TracedTestCase]
      def self.from_json(json_object:)
        struct = JSON.parse(json_object, object_class: OpenStruct)
        result Submission::TestCaseResultWithStdout.from_json(json_object: struct.result)
        trace_responses_size struct.traceResponsesSize
        new(result: result, trace_responses_size: trace_responses_size, additional_properties: struct)
      end

      # Serialize an instance of TracedTestCase to a JSON object
      #
      # @return [JSON]
      def to_json(*_args)
        { result: @result, traceResponsesSize: @trace_responses_size }.to_json
      end

      # Leveraged for Union-type generation, validate_raw attempts to parse the given hash and check each fields type against the current object's property definitions.
      #
      # @param obj [Object]
      # @return [Void]
      def self.validate_raw(obj:)
        TestCaseResultWithStdout.validate_raw(obj: obj.result)
        obj.trace_responses_size.is_a?(Integer) != false || raise("Passed value for field obj.trace_responses_size is not the expected type, validation failed.")
      end
    end
  end
end