import { assertNever } from "@fern-api/core-utils";
import {
    HttpEndpoint,
    HttpHeader,
    HttpMethod,
    HttpService,
    ObjectProperty,
    Pagination,
    PathParameter,
    PathParameterLocation,
    QueryParameter,
    ResponseErrors,
    TypeReference
} from "@fern-api/ir-sdk";
import { FernWorkspace } from "@fern-api/workspace-loader";
import { isRawObjectDefinition, isVariablePathParameter, RawSchemas } from "@fern-api/yaml-schema";
import urlJoin from "url-join";
import { FernFileContext } from "../../FernFileContext";
import { IdGenerator } from "../../IdGenerator";
import { ErrorResolver } from "../../resolvers/ErrorResolver";
import { ExampleResolver } from "../../resolvers/ExampleResolver";
import { ResolvedType } from "../../resolvers/ResolvedType";
import { TypeResolver } from "../../resolvers/TypeResolver";
import { VariableResolver } from "../../resolvers/VariableResolver";
import { convertAvailability, convertDeclaration } from "../convertDeclaration";
import { constructHttpPath } from "./constructHttpPath";
import { convertExampleEndpointCall } from "./convertExampleEndpointCall";
import { convertHttpRequestBody } from "./convertHttpRequestBody";
import { convertHttpResponse } from "./convertHttpResponse";
import { convertHttpSdkRequest } from "./convertHttpSdkRequest";
import { convertResponseErrors } from "./convertResponseErrors";
import { getObjectPropertyFromResolvedType } from "./getObjectPropertyFromResolvedType";

export async function convertHttpService({
    rootPathParameters,
    serviceDefinition,
    file,
    errorResolver,
    typeResolver,
    exampleResolver,
    variableResolver,
    globalErrors,
    workspace
}: {
    rootPathParameters: PathParameter[];
    serviceDefinition: RawSchemas.HttpServiceSchema;
    file: FernFileContext;
    errorResolver: ErrorResolver;
    typeResolver: TypeResolver;
    exampleResolver: ExampleResolver;
    variableResolver: VariableResolver;
    globalErrors: ResponseErrors;
    workspace: FernWorkspace;
}): Promise<HttpService> {
    const servicePathParameters = await convertPathParameters({
        pathParameters: serviceDefinition["path-parameters"],
        location: PathParameterLocation.Service,
        file,
        variableResolver
    });

    const serviceName = { fernFilepath: file.fernFilepath };
    const service: HttpService = {
        availability: convertAvailability(serviceDefinition.availability),
        name: serviceName,
        displayName: serviceDefinition["display-name"] ?? undefined,
        basePath: constructHttpPath(serviceDefinition["base-path"]),
        headers:
            serviceDefinition.headers != null
                ? await Promise.all(
                      Object.entries(serviceDefinition.headers).map(([headerKey, header]) =>
                          convertHttpHeader({ headerKey, header, file })
                      )
                  )
                : [],
        pathParameters: servicePathParameters,
        endpoints: await Promise.all(
            Object.entries(serviceDefinition.endpoints).map(async ([endpointKey, endpoint]): Promise<HttpEndpoint> => {
                const endpointPathParameters = await convertPathParameters({
                    pathParameters: endpoint["path-parameters"],
                    location: PathParameterLocation.Endpoint,
                    file,
                    variableResolver
                });
                const httpEndpoint: HttpEndpoint = {
                    ...(await convertDeclaration(endpoint)),
                    id: "",
                    name: file.casingsGenerator.generateName(endpointKey),
                    displayName: endpoint["display-name"],
                    auth: endpoint.auth ?? serviceDefinition.auth,
                    idempotent: endpoint.idempotent ?? serviceDefinition.idempotent ?? false,
                    baseUrl: endpoint.url ?? serviceDefinition.url,
                    method: endpoint.method != null ? convertHttpMethod(endpoint.method) : HttpMethod.Post,
                    path: constructHttpPath(endpoint.path),
                    fullPath: constructHttpPath(
                        file.rootApiFile["base-path"] != null
                            ? urlJoin(file.rootApiFile["base-path"], serviceDefinition["base-path"], endpoint.path)
                            : urlJoin(serviceDefinition["base-path"], endpoint.path)
                    ),
                    pathParameters: endpointPathParameters,
                    allPathParameters: [...rootPathParameters, ...servicePathParameters, ...endpointPathParameters],
                    queryParameters:
                        typeof endpoint.request !== "string" && endpoint.request?.["query-parameters"] != null
                            ? await Promise.all(
                                  Object.entries(endpoint.request["query-parameters"]).map(
                                      async ([queryParameterKey, queryParameter]) => {
                                          return await convertQueryParameter({
                                              file,
                                              queryParameterKey,
                                              queryParameter
                                          });
                                      }
                                  )
                              )
                            : [],
                    headers:
                        typeof endpoint.request !== "string" && endpoint.request?.headers != null
                            ? await Promise.all(
                                  Object.entries(endpoint.request.headers).map(([headerKey, header]) =>
                                      convertHttpHeader({ headerKey, header, file })
                                  )
                              )
                            : [],
                    requestBody: convertHttpRequestBody({ request: endpoint.request, file }),
                    sdkRequest: convertHttpSdkRequest({
                        service: serviceDefinition,
                        request: endpoint.request,
                        file,
                        typeResolver
                    }),
                    response: await convertHttpResponse({ endpoint, file, typeResolver }),
                    errors: [...convertResponseErrors({ errors: endpoint.errors, file }), ...globalErrors],
                    examples:
                        endpoint.examples != null
                            ? endpoint.examples.map((example) =>
                                  convertExampleEndpointCall({
                                      service: serviceDefinition,
                                      endpoint,
                                      example,
                                      typeResolver,
                                      errorResolver,
                                      exampleResolver,
                                      variableResolver,
                                      file,
                                      workspace
                                  })
                              )
                            : [],
                    pagination: undefined
                };
                httpEndpoint.id = IdGenerator.generateEndpointId(serviceName, httpEndpoint);
                httpEndpoint.pagination = await convertPagination({
                    typeResolver,
                    file,
                    endpointSchema: endpoint,
                    endpoint: httpEndpoint
                });
                return httpEndpoint;
            })
        )
    };
    return service;
}

async function convertQueryParameter({
    file,
    queryParameterKey,
    queryParameter
}: {
    file: FernFileContext;
    queryParameterKey: string;
    queryParameter: RawSchemas.HttpQueryParameterSchema;
}): Promise<QueryParameter> {
    const { name } = getQueryParameterName({ queryParameterKey, queryParameter });
    const valueType = file.parseTypeReference(queryParameter);
    return {
        ...(await convertDeclaration(queryParameter)),
        name: file.casingsGenerator.generateNameAndWireValue({
            wireValue: queryParameterKey,
            name
        }),
        valueType,
        allowMultiple:
            typeof queryParameter !== "string" && queryParameter["allow-multiple"] != null
                ? queryParameter["allow-multiple"]
                : false
    };
}

export async function convertPathParameters({
    pathParameters,
    location,
    file,
    variableResolver
}: {
    pathParameters: Record<string, RawSchemas.HttpPathParameterSchema> | undefined;
    location: PathParameterLocation;
    file: FernFileContext;
    variableResolver: VariableResolver;
}): Promise<PathParameter[]> {
    if (pathParameters == null) {
        return [];
    }
    return await Promise.all(
        Object.entries(pathParameters).map(([parameterName, parameter]) =>
            convertPathParameter({
                parameterName,
                parameter,
                location,
                file,
                variableResolver
            })
        )
    );
}

async function convertPathParameter({
    parameterName,
    parameter,
    location,
    file,
    variableResolver
}: {
    parameterName: string;
    parameter: RawSchemas.HttpPathParameterSchema;
    location: PathParameterLocation;
    file: FernFileContext;
    variableResolver: VariableResolver;
}): Promise<PathParameter> {
    return {
        ...(await convertDeclaration(parameter)),
        name: file.casingsGenerator.generateName(parameterName),
        valueType: getPathParameterType({ parameter, variableResolver, file }),
        location,
        variable: isVariablePathParameter(parameter)
            ? variableResolver.getVariableIdOrThrow(typeof parameter === "string" ? parameter : parameter.variable)
            : undefined
    };
}

function getPathParameterType({
    parameter,
    variableResolver,
    file
}: {
    parameter: RawSchemas.HttpPathParameterSchema;
    variableResolver: VariableResolver;
    file: FernFileContext;
}): TypeReference {
    const parsed = resolvePathParameterOrThrow({
        parameter,
        variableResolver,
        file
    });
    return parsed.file.parseTypeReference(parsed.rawType);
}

export function resolvePathParameterOrThrow({
    parameter,
    variableResolver,
    file
}: {
    parameter: RawSchemas.HttpPathParameterSchema;
    variableResolver: VariableResolver;
    file: FernFileContext;
}): { rawType: string; file: FernFileContext } {
    const resolved = resolvePathParameter({
        parameter,
        variableResolver,
        file
    });
    if (resolved == null) {
        throw new Error("Cannot resolve path parameter");
    }
    return resolved;
}

export function resolvePathParameter({
    parameter,
    variableResolver,
    file
}: {
    parameter: RawSchemas.HttpPathParameterSchema;
    variableResolver: VariableResolver;
    file: FernFileContext;
}): { rawType: string; file: FernFileContext } | undefined {
    if (isVariablePathParameter(parameter)) {
        const variable = typeof parameter === "string" ? parameter : parameter.variable;

        const resolvedVariable = variableResolver.getDeclaration(variable, file);
        if (resolvedVariable == null) {
            return undefined;
        }

        const rawType =
            typeof resolvedVariable.declaration === "string"
                ? resolvedVariable.declaration
                : resolvedVariable.declaration.type;

        return {
            rawType,
            file: resolvedVariable.file
        };
    } else {
        return {
            file,
            rawType: typeof parameter === "string" ? parameter : parameter.type
        };
    }
}

export function getQueryParameterName({
    queryParameterKey,
    queryParameter
}: {
    queryParameterKey: string;
    queryParameter: RawSchemas.HttpQueryParameterSchema;
}): { name: string; wasExplicitlySet: boolean } {
    if (typeof queryParameter !== "string") {
        if (queryParameter.name != null) {
            return { name: queryParameter.name, wasExplicitlySet: true };
        }
    }
    return { name: queryParameterKey, wasExplicitlySet: false };
}

function convertHttpMethod(method: Exclude<RawSchemas.HttpEndpointSchema["method"], null | undefined>): HttpMethod {
    switch (method) {
        case "GET":
            return HttpMethod.Get;
        case "POST":
            return HttpMethod.Post;
        case "PUT":
            return HttpMethod.Put;
        case "PATCH":
            return HttpMethod.Patch;
        case "DELETE":
            return HttpMethod.Delete;
        default:
            assertNever(method);
    }
}

export async function convertHttpHeader({
    headerKey,
    header,
    file
}: {
    headerKey: string;
    header: RawSchemas.HttpHeaderSchema;
    file: FernFileContext;
}): Promise<HttpHeader> {
    const { name } = getHeaderName({ headerKey, header });
    return {
        ...(await convertDeclaration(header)),
        name: file.casingsGenerator.generateNameAndWireValue({
            wireValue: headerKey,
            name
        }),
        valueType: file.parseTypeReference(header),
        env: typeof header === "string" ? undefined : header.env
    };
}

export function getHeaderName({ headerKey, header }: { headerKey: string; header: RawSchemas.HttpHeaderSchema }): {
    name: string;
    wasExplicitlySet: boolean;
} {
    if (typeof header !== "string") {
        if (header.name != null) {
            return {
                name: header.name,
                wasExplicitlySet: true
            };
        }
    }
    return {
        name: headerKey,
        wasExplicitlySet: false
    };
}

async function convertPagination({
    typeResolver,
    file,
    endpointSchema,
    endpoint
}: {
    typeResolver: TypeResolver;
    file: FernFileContext;
    endpointSchema: RawSchemas.HttpEndpointSchema;
    endpoint: HttpEndpoint;
}): Promise<Pagination | undefined> {
    const endpointPagination =
        typeof endpointSchema.pagination === "boolean" ? file.rootApiFile.pagination : endpointSchema.pagination;
    if (!endpointPagination) {
        return undefined;
    }
    const paginationPropertyComponents = getPaginationPropertyComponents(endpointPagination);
    switch (paginationPropertyComponents.type) {
        case "cursor":
            return await convertCursorPagination({
                typeResolver,
                file,
                endpointSchema,
                endpoint,
                paginationPropertyComponents
            });
        case "offset":
            return convertOffsetPagination({
                typeResolver,
                file,
                endpointSchema,
                endpoint,
                paginationPropertyComponents
            });
        default:
            assertNever(paginationPropertyComponents);
    }
}

async function convertCursorPagination({
    typeResolver,
    file,
    endpointSchema,
    endpoint,
    paginationPropertyComponents
}: {
    typeResolver: TypeResolver;
    file: FernFileContext;
    endpointSchema: RawSchemas.HttpEndpointSchema;
    endpoint: HttpEndpoint;
    paginationPropertyComponents: CursorPaginationPropertyComponents;
}): Promise<Pagination | undefined> {
    const queryParameter = endpoint.queryParameters.find(
        (queryParameter) => queryParameter.name.name.originalName === paginationPropertyComponents.cursor
    );
    if (queryParameter == null || endpointSchema.response == null) {
        return undefined;
    }
    const resolvedResponseType = resolveResponseType({
        typeResolver,
        file,
        endpoint: endpointSchema
    });
    const nextCursorObjectProperty = await getNestedObjectPropertyFromResolvedType({
        typeResolver,
        file,
        resolvedType: resolvedResponseType,
        propertyComponents: paginationPropertyComponents.next
    });
    if (nextCursorObjectProperty == null) {
        return undefined;
    }
    const resultsObjectProperty = await getNestedObjectPropertyFromResolvedType({
        typeResolver,
        file,
        resolvedType: resolvedResponseType,
        propertyComponents: paginationPropertyComponents.results
    });
    if (resultsObjectProperty == null) {
        return undefined;
    }
    return Pagination.cursor({
        page: queryParameter,
        next: {
            propertyPath: paginationPropertyComponents.next.map((property) =>
                file.casingsGenerator.generateName(property)
            ),
            property: nextCursorObjectProperty
        },
        results: {
            propertyPath: paginationPropertyComponents.results.map((property) =>
                file.casingsGenerator.generateName(property)
            ),
            property: resultsObjectProperty
        }
    });
}

async function convertOffsetPagination({
    typeResolver,
    file,
    endpointSchema,
    endpoint,
    paginationPropertyComponents
}: {
    typeResolver: TypeResolver;
    file: FernFileContext;
    endpointSchema: RawSchemas.HttpEndpointSchema;
    endpoint: HttpEndpoint;
    paginationPropertyComponents: OffsetPaginationPropertyComponents;
}): Promise<Pagination | undefined> {
    const queryParameter = endpoint.queryParameters.find(
        (queryParameter) => queryParameter.name.name.originalName === paginationPropertyComponents.offset
    );
    if (queryParameter == null) {
        return undefined;
    }
    const resolvedResponseType = resolveResponseType({
        typeResolver,
        file,
        endpoint: endpointSchema
    });
    const resultsObjectProperty = await getNestedObjectPropertyFromResolvedType({
        typeResolver,
        file,
        resolvedType: resolvedResponseType,
        propertyComponents: paginationPropertyComponents.results
    });
    if (resultsObjectProperty == null) {
        return undefined;
    }
    return Pagination.offset({
        page: queryParameter,
        results: {
            propertyPath: paginationPropertyComponents.results.map((property) =>
                file.casingsGenerator.generateName(property)
            ),
            property: resultsObjectProperty
        }
    });
}

async function getNestedObjectPropertyFromResolvedType({
    typeResolver,
    file,
    resolvedType,
    propertyComponents
}: {
    typeResolver: TypeResolver;
    file: FernFileContext;
    resolvedType: ResolvedType;
    propertyComponents: string[];
}): Promise<ObjectProperty | undefined> {
    if (propertyComponents.length === 0) {
        return undefined;
    }
    if (propertyComponents.length === 1) {
        return await getObjectPropertyFromResolvedType({
            typeResolver,
            file,
            resolvedType,
            property: propertyComponents[0] ?? ""
        });
    }
    const objectSchema = maybeObjectSchema(resolvedType);
    if (objectSchema == null) {
        return undefined;
    }
    const propertyType = await getPropertyTypeFromObjectSchema({
        typeResolver,
        file,
        objectSchema,
        property: propertyComponents[0] ?? ""
    });
    const resolvedTypeProperty = typeResolver.resolveTypeOrThrow({
        type: propertyType,
        file
    });
    return getNestedObjectPropertyFromResolvedType({
        typeResolver,
        file,
        resolvedType: resolvedTypeProperty,
        propertyComponents: propertyComponents.slice(1)
    });
}

async function getPropertyTypeFromObjectSchema({
    typeResolver,
    file,
    objectSchema,
    property
}: {
    typeResolver: TypeResolver;
    file: FernFileContext;
    objectSchema: RawSchemas.ObjectSchema;
    property: string;
}): Promise<string> {
    const properties = await getAllPropertiesForRawObjectSchema(objectSchema, file, typeResolver);
    const propertyType = properties[property];
    if (propertyType == null) {
        throw new Error(`Response does not have a property named ${property}.`);
    }
    return propertyType;
}

async function getAllPropertiesForRawObjectSchema(
    objectSchema: RawSchemas.ObjectSchema,
    file: FernFileContext,
    typeResolver: TypeResolver
): Promise<Record<string, string>> {
    let extendedTypes: string[] = [];
    if (typeof objectSchema.extends === "string") {
        extendedTypes = [objectSchema.extends];
    } else if (Array.isArray(objectSchema.extends)) {
        extendedTypes = objectSchema.extends;
    }

    const properties: Record<string, string> = {};
    for (const extendedType of extendedTypes) {
        const extendedProperties = await getAllPropertiesForExtendedType(extendedType, file, typeResolver);
        Object.entries(extendedProperties).map(([propertyKey, propertyType]) => {
            properties[propertyKey] = propertyType;
        });
    }

    if (objectSchema.properties != null) {
        Object.entries(objectSchema.properties).map(([propertyKey, propertyType]) => {
            properties[propertyKey] = typeof propertyType === "string" ? propertyType : propertyType.type;
        });
    }

    return properties;
}

async function getAllPropertiesForExtendedType(
    extendedType: string,
    file: FernFileContext,
    typeResolver: TypeResolver
): Promise<Record<string, string>> {
    const resolvedType = typeResolver.resolveNamedTypeOrThrow({
        referenceToNamedType: extendedType,
        file
    });
    if (resolvedType._type === "named" && isRawObjectDefinition(resolvedType.declaration)) {
        return await getAllPropertiesForRawObjectSchema(resolvedType.declaration, file, typeResolver);
    }
    // This should be unreachable; extended types must be named objects.
    throw new Error(`Extended type ${extendedType} must be another named type`);
}

function resolveResponseType({
    endpoint,
    typeResolver,
    file
}: {
    endpoint: RawSchemas.HttpEndpointSchema;
    typeResolver: TypeResolver;
    file: FernFileContext;
}): ResolvedType {
    return typeResolver.resolveTypeOrThrow({
        type: (typeof endpoint.response !== "string" ? endpoint.response?.type : endpoint.response) ?? "",
        file
    });
}

function maybeObjectSchema(resolvedType: ResolvedType | undefined): RawSchemas.ObjectSchema | undefined {
    if (resolvedType == null) {
        return undefined;
    }
    if (resolvedType._type === "named" && isRawObjectDefinition(resolvedType.declaration)) {
        return resolvedType.declaration;
    }
    if (resolvedType._type === "container" && resolvedType.container._type === "optional") {
        return maybeObjectSchema(resolvedType.container.itemType);
    }
    return undefined;
}

type PaginationPropertyComponents = CursorPaginationPropertyComponents | OffsetPaginationPropertyComponents;

interface CursorPaginationPropertyComponents {
    type: "cursor";
    cursor: string;
    next: string[];
    results: string[];
}

interface OffsetPaginationPropertyComponents {
    type: "offset";
    offset: string;
    results: string[];
}

function getPaginationPropertyComponents(
    endpointPagination: RawSchemas.PaginationSchema
): PaginationPropertyComponents {
    switch (endpointPagination.type) {
        case "cursor":
            return {
                type: "cursor",
                cursor: getRequestProperty(endpointPagination.page),
                next: getResponsePropertyComponents(endpointPagination.next),
                results: getResponsePropertyComponents(endpointPagination.results)
            };
        case "offset":
            return {
                type: "offset",
                offset: getRequestProperty(endpointPagination.page),
                results: getResponsePropertyComponents(endpointPagination.results)
            };
        default:
            assertNever(endpointPagination);
    }
}

function getRequestProperty(value: string): string {
    return value.substring("$request.".length);
}

function getResponsePropertyComponents(value: string): string[] {
    const trimmed = value.substring("$response.".length);
    return trimmed?.split(".") ?? [];
}
