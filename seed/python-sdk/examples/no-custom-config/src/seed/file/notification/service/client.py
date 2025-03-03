# This file was auto-generated by Fern from our API Definition.

import typing
import urllib.parse
from json.decoder import JSONDecodeError

from ....core.api_error import ApiError
from ....core.client_wrapper import AsyncClientWrapper, SyncClientWrapper
from ....core.jsonable_encoder import jsonable_encoder
from ....core.pydantic_utilities import pydantic_v1
from ....core.remove_none_from_dict import remove_none_from_dict
from ....core.request_options import RequestOptions
from ....types.types.exception import Exception


class ServiceClient:
    def __init__(self, *, client_wrapper: SyncClientWrapper):
        self._client_wrapper = client_wrapper

    def get_exception(
        self, notification_id: str, *, request_options: typing.Optional[RequestOptions] = None
    ) -> Exception:
        """
        Parameters:
            - notification_id: str.

            - request_options: typing.Optional[RequestOptions]. Request-specific configuration.
        ---
        from seed.client import SeedExamples
        from seed.environment import SeedExamplesEnvironment

        client = SeedExamples(
            token="YOUR_TOKEN",
            environment=SeedExamplesEnvironment.PRODUCTION,
        )
        client.file.notification.service.get_exception(
            notification_id="notification-hsy129x",
        )
        """
        _response = self._client_wrapper.httpx_client.request(
            "GET",
            urllib.parse.urljoin(
                f"{self._client_wrapper.get_base_url()}/", f"file/notification/{jsonable_encoder(notification_id)}"
            ),
            params=jsonable_encoder(
                request_options.get("additional_query_parameters") if request_options is not None else None
            ),
            headers=jsonable_encoder(
                remove_none_from_dict(
                    {
                        **self._client_wrapper.get_headers(),
                        **(request_options.get("additional_headers", {}) if request_options is not None else {}),
                    }
                )
            ),
            timeout=request_options.get("timeout_in_seconds")
            if request_options is not None and request_options.get("timeout_in_seconds") is not None
            else self._client_wrapper.get_timeout(),
            retries=0,
            max_retries=request_options.get("max_retries") if request_options is not None else 0,  # type: ignore
        )
        if 200 <= _response.status_code < 300:
            return pydantic_v1.parse_obj_as(Exception, _response.json())  # type: ignore
        try:
            _response_json = _response.json()
        except JSONDecodeError:
            raise ApiError(status_code=_response.status_code, body=_response.text)
        raise ApiError(status_code=_response.status_code, body=_response_json)


class AsyncServiceClient:
    def __init__(self, *, client_wrapper: AsyncClientWrapper):
        self._client_wrapper = client_wrapper

    async def get_exception(
        self, notification_id: str, *, request_options: typing.Optional[RequestOptions] = None
    ) -> Exception:
        """
        Parameters:
            - notification_id: str.

            - request_options: typing.Optional[RequestOptions]. Request-specific configuration.
        ---
        from seed.client import AsyncSeedExamples
        from seed.environment import SeedExamplesEnvironment

        client = AsyncSeedExamples(
            token="YOUR_TOKEN",
            environment=SeedExamplesEnvironment.PRODUCTION,
        )
        await client.file.notification.service.get_exception(
            notification_id="notification-hsy129x",
        )
        """
        _response = await self._client_wrapper.httpx_client.request(
            "GET",
            urllib.parse.urljoin(
                f"{self._client_wrapper.get_base_url()}/", f"file/notification/{jsonable_encoder(notification_id)}"
            ),
            params=jsonable_encoder(
                request_options.get("additional_query_parameters") if request_options is not None else None
            ),
            headers=jsonable_encoder(
                remove_none_from_dict(
                    {
                        **self._client_wrapper.get_headers(),
                        **(request_options.get("additional_headers", {}) if request_options is not None else {}),
                    }
                )
            ),
            timeout=request_options.get("timeout_in_seconds")
            if request_options is not None and request_options.get("timeout_in_seconds") is not None
            else self._client_wrapper.get_timeout(),
            retries=0,
            max_retries=request_options.get("max_retries") if request_options is not None else 0,  # type: ignore
        )
        if 200 <= _response.status_code < 300:
            return pydantic_v1.parse_obj_as(Exception, _response.json())  # type: ignore
        try:
            _response_json = _response.json()
        except JSONDecodeError:
            raise ApiError(status_code=_response.status_code, body=_response.text)
        raise ApiError(status_code=_response.status_code, body=_response_json)
