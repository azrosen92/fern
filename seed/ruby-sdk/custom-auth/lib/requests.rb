# frozen_string_literal: true

require "faraday"
require "async/http/faraday"

module SeedCustomAuthClient
  class RequestClient
    attr_reader :headers, :base_url, :conn

    # @param environment [String]
    # @param max_retries [Long] The number of times to retry a failed request, defaults to 2.
    # @param timeout_in_seconds [Long]
    # @param custom_auth_scheme [String]
    # @return [RequestClient]
    def initialize(environment: nil, max_retries: nil, timeout_in_seconds: nil, custom_auth_scheme: nil)
      @base_url = environment
      @headers = {
        "X-Fern-Language": "Ruby",
        "X-Fern-SDK-Name": "SeedCustomAuthClient",
        "X-API-KEY": " #{custom_auth_scheme.to_json}"
      }
      @conn = Faraday.new(@base_url, headers: @headers) do |faraday|
        faraday.request :json
        faraday.request :retry, { max: max_retries }
        faraday.options.timeout = timeout_in_seconds
      end
    end
  end

  class AsyncRequestClient
    attr_reader :headers, :base_url, :conn

    # @param environment [String]
    # @param max_retries [Long] The number of times to retry a failed request, defaults to 2.
    # @param timeout_in_seconds [Long]
    # @param custom_auth_scheme [String]
    # @return [AsyncRequestClient]
    def initialize(environment: nil, max_retries: nil, timeout_in_seconds: nil, custom_auth_scheme: nil)
      @base_url = environment
      @headers = {
        "X-Fern-Language": "Ruby",
        "X-Fern-SDK-Name": "SeedCustomAuthClient",
        "X-API-KEY": " #{custom_auth_scheme.to_json}"
      }
      @conn = Faraday.new(@base_url, headers: @headers) do |faraday|
        faraday.request :json
        faraday.request :retry, { max: max_retries }
        faraday.options.timeout = timeout_in_seconds
        faraday.adapter = :async_http
      end
    end
  end

  # Additional options for request-specific configuration when calling APIs via the SDK.
  class RequestOptions
    attr_reader :max_retries, :timeout_in_seconds, :custom_auth_scheme, :additional_headers,
                :additional_query_parameters, :additional_body_parameters

    # @param max_retries [Long] The number of times to retry a failed request, defaults to 2.
    # @param timeout_in_seconds [Long]
    # @param custom_auth_scheme [String]
    # @param additional_headers [Hash{String => Object}]
    # @param additional_query_parameters [Hash{String => Object}]
    # @param additional_body_parameters [Hash{String => Object}]
    # @return [RequestOptions]
    def initialize(max_retries: nil, timeout_in_seconds: nil, custom_auth_scheme: nil, additional_headers: nil,
                   additional_query_parameters: nil, additional_body_parameters: nil)
      # @type [Long] The number of times to retry a failed request, defaults to 2.
      @max_retries = max_retries
      # @type [Long]
      @timeout_in_seconds = timeout_in_seconds
      # @type [String]
      @custom_auth_scheme = custom_auth_scheme
      # @type [Hash{String => Object}]
      @additional_headers = additional_headers
      # @type [Hash{String => Object}]
      @additional_query_parameters = additional_query_parameters
      # @type [Hash{String => Object}]
      @additional_body_parameters = additional_body_parameters
    end
  end
end