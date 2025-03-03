# This file was auto-generated by Fern from our API Definition.

from __future__ import annotations

import typing

from ...core.pydantic_utilities import pydantic_v1
from .initialize_problem_request import InitializeProblemRequest
from .stop_request import StopRequest
from .submit_request_v_2 import SubmitRequestV2
from .workspace_submit_request import WorkspaceSubmitRequest


class SubmissionRequest_InitializeProblemRequest(InitializeProblemRequest):
    type: typing.Literal["initializeProblemRequest"] = "initializeProblemRequest"

    class Config:
        allow_population_by_field_name = True
        populate_by_name = True


class SubmissionRequest_InitializeWorkspaceRequest(pydantic_v1.BaseModel):
    type: typing.Literal["initializeWorkspaceRequest"] = "initializeWorkspaceRequest"


class SubmissionRequest_SubmitV2(SubmitRequestV2):
    type: typing.Literal["submitV2"] = "submitV2"

    class Config:
        allow_population_by_field_name = True
        populate_by_name = True


class SubmissionRequest_WorkspaceSubmit(WorkspaceSubmitRequest):
    type: typing.Literal["workspaceSubmit"] = "workspaceSubmit"

    class Config:
        allow_population_by_field_name = True
        populate_by_name = True


class SubmissionRequest_Stop(StopRequest):
    type: typing.Literal["stop"] = "stop"

    class Config:
        allow_population_by_field_name = True
        populate_by_name = True


SubmissionRequest = typing.Union[
    SubmissionRequest_InitializeProblemRequest,
    SubmissionRequest_InitializeWorkspaceRequest,
    SubmissionRequest_SubmitV2,
    SubmissionRequest_WorkspaceSubmit,
    SubmissionRequest_Stop,
]
