# This file was auto-generated by Fern from our API Definition.

import datetime as dt
import typing

from ........core.datetime_utils import serialize_datetime
from ........core.pydantic_utilities import pydantic_v1
from .......commons.types.problem_id import ProblemId
from .......commons.types.variable_type import VariableType


class LightweightProblemInfoV2(pydantic_v1.BaseModel):
    problem_id: ProblemId = pydantic_v1.Field(alias="problemId")
    problem_name: str = pydantic_v1.Field(alias="problemName")
    problem_version: int = pydantic_v1.Field(alias="problemVersion")
    variable_types: typing.List[VariableType] = pydantic_v1.Field(alias="variableTypes")

    def json(self, **kwargs: typing.Any) -> str:
        kwargs_with_defaults: typing.Any = {"by_alias": True, "exclude_unset": True, **kwargs}
        return super().json(**kwargs_with_defaults)

    def dict(self, **kwargs: typing.Any) -> typing.Dict[str, typing.Any]:
        kwargs_with_defaults: typing.Any = {"by_alias": True, "exclude_unset": True, **kwargs}
        return super().dict(**kwargs_with_defaults)

    class Config:
        allow_population_by_field_name = True
        populate_by_name = True
        extra = pydantic_v1.Extra.forbid
        json_encoders = {dt.datetime: serialize_datetime}
