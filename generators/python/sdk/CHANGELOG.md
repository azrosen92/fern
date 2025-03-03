# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0-rc3] - 2024-04-04

- Fix: There are a number of fixes to the skip validation code as well as tests to reflect those updates.

## [1.1.0-rc2] - 2024-04-04

- Fix: The generator now writes the skipped-validation `cast` with a suffixing new line so that the code compiles.

## [1.1.0-rc1] - 2024-04-04

- Fix: The generator no longer attempts to create a version file if Fern does not own generating the full package (e.g. in local generation). It's too confusing for to make the relevant changes to the package set up, and is also arguably not even needed in local generation.

## [1.1.0-rc0] - 2024-04-03

- [EXPERIMENTAL] Feature: The python SDK now includes a configuration option to skip pydantic validation. This ensures that Pydantic does not immediately fail if the model being returned from an API does not exactly match the Pydantic model. This is meant to add flexibility, should your SDK fall behind your API, but should be used sparringly, as the type-hinting for users will still reflect the Pydantic model exactly.

  ```yaml
  generators:
    - name: fernapi/fern-python-sdk
      ...
      config:
        pydantic_config:
          skip_validation: true
  ```

## [1.0.1] - 2024-04-03

- Fix: Pydantic introduced a "break" to their 1.x libs by adding in a .v1 submodule that does not mirror the one that comes with pydantic v2. To get around this we now force the usage of the v1 submodule only if the pydantic version is v2.

## [1.0.0] - 2024-04-02

- Break: The python SDK now defaults new (breaking configuration) to introduce general improvements.

  In order to revert to the previous configuration flags and avoid the break, please leverage the below configuration:

  ```yaml
  generators:
    - name: fernapi/fern-python-sdk
      config:
        improved_imports: false
        pydantic_config:
          require_optional_fields: true
          use_str_enums: false
          extra_fields: "forbid"
  ```

- Improvement: The python SDK now supports specifying whether or not to follow redirects in requests by default, and exposes an option to override that functionality for consumers.

  ```yaml
  generators:
    - name: fernapi/fern-python-sdk
      config:
        follow_redirects_by_default: true
  ```

  which then just instantiates the client like so:

  ```python
  client = SeedExhaustive(
        token="YOUR_TOKEN",
        follow_redirects=True  # This is defaulted to the value passed into follow_redirects_by_default, and ignored if not specified
  )
  ```

## [0.13.4] - 2024-04-03

- Fix: revert the change from 0.13.2, the stream call returns a context manager, which is not awaited. The issue that this was meant to solve was actually fixed in version `0.12.2`.

## [0.13.3] - 2024-03-28

- Fix: Github workflows for publishing now work again (previously the trigger was incorrect).

## [0.13.2] - 2024-03-28

- Fix: Asynchronous calls to `httpx.stream` are now awaited. This is applicable to any file download or
  JSON streaming (chat completion) endpoints.

  ```python
  # Before
  async with httpx.stream

  # After
  async with await httpx.stream
  ```

## [0.13.1] - 2024-03-26

- Improvement: discriminant values in unions are now defaulted such that callers no longer need to specify the discriminant:

  ```python
  # Before
  shape = Circle(discriminant="circle", radius=2.0)

  # After
  shape = Circle(radius=2.0)
  ```

## [0.13.0] - 2024-03-25

- Improvement: the python SDK now exposes it's version through `__version__` to match module standards and expectations.

```python
import seed

print(seed.__version__)  # prints 0.0.1 or whatever version is contained within the pyproject.toml
```

## [0.12.5] - 2024-03-22

- Fix: the python SDK uses the timeout provided to the top level client as the default per-request, previously if there was no timeout override in the RequestOptions, we'd default to 60s, even if a timeout was provided at the client level.

## [0.12.4] - 2024-03-19

- Improvement: Allow full forward compat with enums while keeping intellisense by unioning enum literals with `typing.AnyStr`.

  Before:

  ```python
  Operand = typing.Union[typing.AnyStr, typing.Literal[">", "=", "less_than"]]
  ```

  After:

  ```python
  Operand = typing.Literal[">", "=", "less_than"]
  ```

## [0.12.3] - 2024-03-18

- Improvement: Allow bytes requests to take in iterators of bytes, mirroring the types allowed by HTTPX.

## [0.12.2] - 2024-03-18

- Fix: Fix the returned type and value contained within the retrying wrapper for the HTTPX client (http_client.py).

## [0.12.1] - 2024-03-14

- Improves example generation and snippets for union types, as well as multi-url environments.
- Fix: Stringifies header arguments, HTTPX was previously hard failing for certain types

## [0.12.0] - 2024-03-11

- Beta, feature: The SDK now generates tests leveraging auto-generated data to test typing, as well as wire-formatting (e.g. the SDKs are sending and receiving data as expected). This comes out of the box within the generated github workflow, as well as through the fern cli: `fern test --command "your test command"`.
  **Note**: You must be on the enterprise tier to enable this mode.

## [0.11.10] - 2024-03-08

- feature: Expose a feature flag to pass through additional properties not specified within your pydantic model from your SDK. This allows for easier forward compatibility should your SDK drift behind your spec.

  Config:

  ```yaml
  generators:
    - name: fernapi/fern-python-sdk
      ...
      config:
        pydantic_config:
          extra_fields: "allow"
  ```

  Example generated code:

  ```python
  # my_object.py
  class MyObject(pydantic.BaseModel):
      string: typing.Optional[str] = None
      ...

  # main.py
  o = pydantic.parse_obj_as(MyObject, {"string": "string", "my_new_property": "custom_value"})

  print(o.my_new_property) # <--- "custom_value"
  ```

## [0.11.9] - 2024-03-04

- chore: Use docstrings instead of Pydantic field descriptions. This is meant to be a cleanliness change.
  This goes from:

  ```python
  field: Optional[str] = pydantic.Field(default=None, description="This is the description.")
  ```

  to:

  ```python
  field: Optional[str] = pydantic.Field(default=None)
  """This is the description."""
  ```

## [0.11.8-rc1] - 2024-03-02

- Beta, Improvement: Introduces a `max_retries` parameter to the RequestOptions dict accepted by all requests. This parameter will retry requests automatically, with exponential backoff and a jitter. The client will automatically retry requests of a 5XX status code, or certain 4XX codes (429, 408, 409).

  ```python
    client\
      .imdb\
      .create_movie(
        request=CreateMovieRequest(title="title", rating=4.3),
        request_options={
          "max_retries": 5,
        }
      )
  ```

## [0.11.8-rc0] - 2024-02-27

- Beta: Introduce a `client` custom config that allows you to specify class_name and
  filename for the client. This configuration can be used in several ways:

  1. Rename your client class:

     ```yml
     config:
       client:
         class_name: Imdb
     ```

  2. Add custom functions to your generated SDK:

     ```yml
     config:
       client:
         class_name: BaseImdb
         filename: base_client.py
         exported_class_name: Imdb
         exported_filename: client.py
     ```

     Often times you may want to add additional methods or utilites to the
     generated client. The easiest way to do this is to configure Fern to write
     the autogenerated client in another file and extend it on your own.

     With the configuration above, Fern's Python SDK generator will create a
     class called `BaseImdb` and `AsyncBaseImdb` and put them in a file called
     `base_client.py`. As a user, you can extend both these classes with
     custom utilities.

     To make sure the code snippets in the generated SDK are accurate you can
     specify `exported_class_name` and `exported_filename`.

## [0.11.7] - 2024-02-27

- Improvement: Introduces a flag `use_str_enums` to swap from using proper Enum classes to using Literals to represent enums. This change allows for forward compatibility of enums, since the user will receive the string back.

  ```
  config:
    pydantic_config:
      use_str_enums: true
  ```

  generates enums as:

  ```
  Operand = typing.Literal[">", "=", "less_than"]
  ```

## [0.11.6] - 2024-02-26

- Improvement: You can now specify envvars to scan for headers, not just auth scheme headers.

  ```
  # OpenAPI
  x-fern-global-headers:
   - header: x-api-key
     name: api_key
     optional: true
     env: MY_API_KEY
  ```

  ... or ...

  ```
  # Fern Definition
  getAllUsers:
    method: GET
    path: /all
    request:
      name: GetAllUsersRequest
      headers:
        X-API-KEY: string
        env: MY_API_KEY
  ```

  the generated client will look like

  ```python
  import os

  class Client:

    def __init__(self, *, apiKey: str = os.getenv("MY_API_KEY"))
  ```

## [0.11.5] - 2024-02-23

- Fix: Fix the usage of ApiError when leveraging auth envvars, when the schema for ApiError was changed, this usage was missed in the update.

## [0.11.4] - 2024-02-23

- Fix: We now grab enum values appropriately when enums are within unions.

## [0.11.3] - 2024-02-22

- Fix: Transition from lists to sequences within function calls, this is a fix as a result of how mypy handles type variance.
  This fix is only for function calls as testing shows that we do not hit the same issue within mypy with list[union[*]] fields on pydantic objects.
  This issue outlines it well: https://stackoverflow.com/questions/76138438/incompatible-types-in-assignment-expression-has-type-liststr-variable-has

- Improvement: The Python SDK generator now defaults to `require_optional_fields = False`. This means that any requests that have optional fields no longer require a user to input data (or a `None` value) in.
  Example:

  ```python
  # Previously:
  def my_function(my_parameter: typing.Optional[str]):
    pass

  my_function()  # <--- This fails mypy
  my_function(None)  # <--- This is necessary
  my_function("I work in both cases!")
  ...
  # Now:
  def my_function():
    pass

  my_function()  # <--- I no longer fail mypy
  my_function(None)  # <--- I still work
  my_function("I work in both cases!")
  ```

## [0.11.2] - 2024-02-21

- Improvement (Beta): The Python generator now supports a configuration option called `improved_imports`. To enable
  this configuration, just add the following to your generators.yml

  ```yaml
  generators:
    - name: fernapi/fern-python-sdk
      ...
      config:
        improved_imports: true
  ```

  Enabling improved imports will remove the verbose `resources` directory in the SDK and make the imports
  shorter. This will also improve the imports from Pylance and Pyright that are automaticaly generated

  ```python
  # Before
  from sdk.resources.fhir import Paient

  # After
  from sdk.fhir import Patient
  ```

## [0.11.1] - 2024-02-20

- Improvement: Python now supports specifying files to auto-export from the root `__init__.py` file, this means you can export custom classes and functions from your package for users to access like so:

  ```python
  from my_package import custom_function
  ```

  the configuration for this is:

  ```yaml
  # generators.yml
  python-sdk:
    generators:
      - name: fernapi/fern-python-sdk
        version: 0.11.1
        config:
          additional_init_exports:
            - from: file_with_custom_function
              imports:
                - custom_function
  ```

- Chore: Add a docstring for base clients to explain usage, example:

  ```python
  class SeedTest:
    """
    Use this class to access the different functions within the SDK. You can instantiate any number of clients with different configuration that will propogate to these functions.
    ---
    from seed.client import SeedTest

    client = SeedTest(
        token="YOUR_TOKEN",
        base_url="https://yourhost.com/path/to/api",
    )
    """
  ```

## [0.11.0] - 2024-02-19

- Improvement: Python now supports a wider range of types for file upload, mirroring the `httpx` library used under the hood, these are grouped under a new type `File`:

  ```python
  # core/file.py
  FileContent = typing.Union[typing.IO[bytes], bytes, str]
  File = typing.Union[
      # file (or bytes)
      FileContent,
      # (filename, file (or bytes))
      typing.Tuple[typing.Optional[str], FileContent],
      # (filename, file (or bytes), content_type)
      typing.Tuple[typing.Optional[str], FileContent, typing.Optional[str]],
      # (filename, file (or bytes), content_type, headers)
      typing.Tuple[typing.Optional[str], FileContent, typing.Optional[str], typing.Mapping[str, str]],
  ]

  ...

  # service.py
  def post(
      self,
      *,
      file: core.File,
      request_options: typing.Optional[RequestOptions] = None,
  ) -> None:
      """
      Parameters:
          - file: core.File. See core.File for more documentation
          - request_options: typing.Optional[RequestOptions]. Request-specific configuration.
      """
  ...

  # main.py
  f = open('report.xls', 'rb')
  service.post(file=f)

  # Or leveraging a tuple
  with open('largefile.zip', 'rb') as f:
    service.post(file=('largefile.zip', f))
  ...
  ```

- Fix: Python now supports API specifications that leverage lists for file upload. Previously, Fern incorrectly made all `list<file>` type requests simply `file`.

  ```python
  # service.py
  def post(
      self,
      *,
      file_list: typing.List[core.File],
      request_options: typing.Optional[RequestOptions] = None,
  ) -> None:
      """
      Parameters:
          - file_list: typing.List[core.File]. See core.File for more documentation
          - request_options: typing.Optional[RequestOptions]. Request-specific configuration.
      """
  ...

  # main.py
  f1 = open('report.xls', 'rb')
  f2 = open('page.docx', 'rb')
  service.post(file_list=[f1, f2])
  ```

## [0.10.3] - 2024-02-19

- Fix: Several bugfixes were made to related to literal properties. If a literal is
  used as a query parameeter, header, path parameter, or request parameter, the user
  no longer has to explicitly pass it in.

  For example, the following endpoint

  ```yaml
  endpoints:
    chat_stream:
      request:
        name: ListUsersRequest
        headers:
          X_API_VERSION: literal<"2022-02-02">
        body:
          properties:
            stream: literal<true>
            query: string
  ```

  would generate the following signature in Python

  ```python
  class Client:

    # The user does not have to pass in api version or stream since
    # they are literals and always the same
    def chat_stream(self, *, query: str) -> None:
  ```

## [0.10.2] - 2024-02-18

- Fix: The SDK always sends the enum wire value instead of the name of the enum. For example,
  for the following enum,

  ```python
  class Operand(str, enum.Enum):
    GREATER_THAN = ">"
    EQUAL_TO = "="
  ```

  the SDK should always be sending `>` and `=` when making a request.

  This affected enums used in path parameters, query parameters and any request body parameters at
  the first level. To fix, the SDK sends the `.value` attribute of the enum.

- Fix: Revert #2719 which introduced additional issues with circular references within our Python types.

## [0.10.1] - 2024-02-14

- Improvement: Add support for a RequestOptions object for each generated function within Python SDKs. This parameter is an optional final parameter that allows for configuring timeout, as well as pass in arbitrary data through to the request. RequestOptions is a TypedDict, with optional fields, so there's no need to instantiate an object, just pass in the relevant keys within a dict!

  - `timeout_in_seconds` overrides the timeout for this specific request
  - `additional_body_parameters` are expanded into the JSON request body
  - `additional_query_parameters` are expanded into the JSON query parameters map
  - `additional_headers` are expanded into the request's header map
  - Here's an example:

    ```python
    client\
      .imdb\
      .create_movie(
        request=CreateMovieRequest(title="title", rating=4.3),
        request_options={
          "timeout_in_seconds": 99,
          "additional_body_parameters": {"another": "body parameter"},
          "additional_headers": {"another": "header"},
        }
      )
    ```

## [0.10.0] - 2024-02-13

- Improvement: Remove support for Python 3.7. In order to support newer versions of libraries we depend on (such as typing and typing-extensions), we must move on to Python 3.8. With this change we are also able to:
  - Remove the `backports` dependency, as `cached_property` is now included within `functools`
  - Remove the upper bound dependency on Pydantic which had dropped support for Python 3.7

## [0.9.1] - 2024-02-11

- Fix: Remove literals from SDK function signatures, as they are not modifiable for end users.

  Before:

  ```python
  def get_options(self, *, dry_run: typing_extensions.Literal[True]) -> Options:
    ...
    json=jsonable_encoder({"dryRun": dry_run}),
    ...
  ```

  After:

  ```python
  def get_options(self, *) -> Options:
    ...
    json=jsonable_encoder({"dryRun": "true"}),
  ```

- Fix: Acknowledge the optionality of a `File` property, previously we were requiring all `File` type inputs, even if they were specified as optional within the OpenAPI or Fern definition. Now, we check if the parameter is required and make the parameter optional if it is not.

## [0.9.0] - 2024-02-11

- Feature: The SDK generator now supports whitelabelling. When this is turned on,
  there will be no mention of Fern in the generated code.

  **Note**: You must be on the enterprise tier to enable this mode.

## [0.8.3-rc0] - 2024-01-29

- Fix: Increase recursion depth to allow for highly nested and complex examples,
  this is a temporary solution while the example datamodel is further refined.

## [0.8.2-rc0] - 2024-01-28

- Fix: The Python SDK better handles cyclical references. In particular,
  cyclical references are tracked for undiscriminated unions,
  and update_forward_refs is always called with object references.

## [0.8.1] - 2024-01-26

- Feature: If the auth scheme has environment variables specified,
  the generated python client will scan those environment variables.

  For example, for the following Fern Definition

  ```
  auth: APIKey
  auth-schemes:
    APIKey:
      header: X-FERN-API-KEY
      type: string
      env: FERN_API_KEY
  ```

  the generated client will look like

  ```python
  import os

  class Client:

    def __init__(self, *, apiKey: str = os.getenv("FERN_API_KEY"))
  ```

## [0.8.0] - 2024-01-25

- Fix: Enums in inlined requests send the appropriate value.

  ```python
  class Operand(str, Enum):
    greater_than = ">"
    equal_to = "="

  # Previously the SDK would just send the operand directly
  def endpoint(self, *, operand: Operand):
    httpx.post(json={"operand": operand})

  # Now, the SDK will send the value of the enum
  def endpoint(self, *, operand: Operand):
    httpx.post(json={"operand": operand.value})
  ```

## [0.7.7] - 2024-01-21

- Chore: Intialize this changelog
