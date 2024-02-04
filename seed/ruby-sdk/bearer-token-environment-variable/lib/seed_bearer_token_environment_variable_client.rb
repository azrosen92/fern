# frozen_string_literal: true

require "faraday"
require_relative "seed_bearer_token_environment_variable_client/service/client"
require "async/http/faraday"

module SeedBearerTokenEnvironmentVariableClient
  class Client
    # @param max_retries [Long] The number of times to retry a failed request, defaults to 2.
    # @param timeout_in_seconds [Long]
    # @param api_key [String]
    # @return []
    def initialize(max_retries: nil, timeout_in_seconds: nil, api_key: nil)
      request_client = RequestClient.initialize(headers: headers, base_url: base_url, conn: conn)
      @service_client = ServiceClient.initialize(request_client: request_client)
    end
  end

  class AsyncClient
    # @param max_retries [Long] The number of times to retry a failed request, defaults to 2.
    # @param timeout_in_seconds [Long]
    # @param api_key [String]
    # @return []
    def initialize(max_retries: nil, timeout_in_seconds: nil, api_key: nil)
      AsyncRequestClient.initialize(headers: headers, base_url: base_url, conn: conn)
      @async_service_client = AsyncServiceClient.initialize(request_client: request_client)
    end
  end
end