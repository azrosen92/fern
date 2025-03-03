# This file was auto-generated by Fern from our API Definition.

import datetime as dt
import typing

from ...core.datetime_utils import serialize_datetime
from ...core.pydantic_utilities import pydantic_v1
from .movie import Movie


class ExtendedMovie(Movie):
    """
    from seed import ExtendedMovie

    ExtendedMovie(
        id="movie-sda231x",
        title="Pulp Fiction",
        from_="Quentin Tarantino",
        rating=8.5,
        type="movie",
        tag="tag-12efs9dv",
        cast=["John Travolta", "Samuel L. Jackson", "Uma Thurman", "Bruce Willis"],
        metadata={
            "academyAward": true,
            "releaseDate": "2023-12-08",
            "ratings": {"rottenTomatoes": 97, "imdb": 7.6},
        },
    )
    """

    cast: typing.List[str]

    def json(self, **kwargs: typing.Any) -> str:
        kwargs_with_defaults: typing.Any = {"by_alias": True, "exclude_unset": True, **kwargs}
        return super().json(**kwargs_with_defaults)

    def dict(self, **kwargs: typing.Any) -> typing.Dict[str, typing.Any]:
        kwargs_with_defaults: typing.Any = {"by_alias": True, "exclude_unset": True, **kwargs}
        return super().dict(**kwargs_with_defaults)

    class Config:
        frozen = True
        smart_union = True
        allow_population_by_field_name = True
        populate_by_name = True
        extra = pydantic_v1.Extra.allow
        json_encoders = {dt.datetime: serialize_datetime}
