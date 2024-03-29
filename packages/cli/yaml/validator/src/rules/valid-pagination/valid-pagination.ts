import {
    constructFernFileContext,
    FernFileContext,
    ResolvedType,
    TypeResolver,
    TypeResolverImpl
} from "@fern-api/ir-generator";
import { isRawObjectDefinition, RawSchemas } from "@fern-api/yaml-schema";
import chalk from "chalk";
import { Rule, RuleViolation } from "../../Rule";
import { CASINGS_GENERATOR } from "../../utils/casingsGenerator";

const REQUEST_PREFIX = "$request.";
const RESPONSE_PREFIX = "$response.";

// TODO: Update these IDs to match the latest schema.
const CURSOR_ID = "page";
const OFFSET_ID = "page";
const NEXT_CURSOR_ID = "next";
const RESULTS_ID = "results";

type PropertyValidatorFunc = ({
    typeResolver,
    file,
    resolvedType,
    propertyComponents
}: {
    typeResolver: TypeResolver;
    file: FernFileContext;
    resolvedType: ResolvedType | undefined;
    propertyComponents: string[];
}) => boolean;

export const ValidPaginationRule: Rule = {
    name: "valid-pagination",
    create: ({ workspace }) => {
        const typeResolver = new TypeResolverImpl(workspace);
        const defaultPagination = workspace.definition.rootApiFile.contents.pagination;

        return {
            definitionFile: {
                httpEndpoint: ({ endpointId, endpoint }, { relativeFilepath, contents: definitionFile }) => {
                    const endpointPagination =
                        typeof endpoint.pagination === "boolean" ? defaultPagination : endpoint.pagination;
                    if (!endpointPagination) {
                        return [];
                    }

                    const file = constructFernFileContext({
                        relativeFilepath,
                        definitionFile,
                        casingsGenerator: CASINGS_GENERATOR,
                        rootApiFile: workspace.definition.rootApiFile.contents
                    });

                    switch (endpointPagination.type) {
                        case "cursor": {
                            return validateCursorPagination({
                                endpointId,
                                endpoint,
                                typeResolver,
                                file,
                                cursorPagination: endpointPagination
                            });
                        }
                        case "offset": {
                            return validateOffsetPagination({
                                endpointId,
                                endpoint,
                                typeResolver,
                                file,
                                offsetPagination: endpointPagination
                            });
                        }
                    }
                }
            }
        };
    }
};

function validateCursorPagination({
    endpointId,
    endpoint,
    typeResolver,
    file,
    cursorPagination
}: {
    endpointId: string;
    endpoint: RawSchemas.HttpEndpointSchema;
    typeResolver: TypeResolver;
    file: FernFileContext;
    cursorPagination: RawSchemas.CursorPaginationSchema;
}): RuleViolation[] {
    const violations: RuleViolation[] = [];

    violations.push(
        ...validatePageProperty({
            endpointId,
            endpoint,
            typeResolver,
            file,
            cursorPagination
        })
    );

    const resolvedResponseType = resolveResponseType({ endpoint, typeResolver, file });
    if (resolvedResponseType == null) {
        violations.push({
            severity: "error",
            message: `Pagination configuration for endpoint ${chalk.bold(endpointId)} must define a response type.`
        });
        return violations;
    }

    violations.push(
        ...validateNextCursorProperty({
            endpointId,
            typeResolver,
            file,
            resolvedResponseType,
            nextProperty: cursorPagination.next
        })
    );

    violations.push(
        ...validateResultsProperty({
            endpointId,
            typeResolver,
            file,
            resolvedResponseType,
            resultsProperty: cursorPagination.results
        })
    );

    return violations;
}

function validateOffsetPagination({
    endpointId,
    endpoint,
    typeResolver,
    file,
    offsetPagination
}: {
    endpointId: string;
    endpoint: RawSchemas.HttpEndpointSchema;
    typeResolver: TypeResolver;
    file: FernFileContext;
    offsetPagination: RawSchemas.OffsetPaginationSchema;
}): RuleViolation[] {
    const violations: RuleViolation[] = [];

    violations.push(
        ...validateOffsetProperty({
            endpointId,
            endpoint,
            typeResolver,
            file,
            offsetPagination
        })
    );

    const resolvedResponseType = resolveResponseType({ endpoint, typeResolver, file });
    if (resolvedResponseType == null) {
        violations.push({
            severity: "error",
            message: `Pagination configuration for endpoint ${chalk.bold(endpointId)} must define a response type.`
        });
        return violations;
    }

    violations.push(
        ...validateResultsProperty({
            endpointId,
            typeResolver,
            file,
            resolvedResponseType,
            resultsProperty: offsetPagination.results
        })
    );

    return violations;
}

function validatePageProperty({
    endpointId,
    endpoint,
    typeResolver,
    file,
    cursorPagination
}: {
    endpointId: string;
    endpoint: RawSchemas.HttpEndpointSchema;
    typeResolver: TypeResolver;
    file: FernFileContext;
    cursorPagination: RawSchemas.CursorPaginationSchema;
}): RuleViolation[] {
    return validateQueryParameterProperty({
        endpointId,
        endpoint,
        typeResolver,
        file,
        queryParameterProperty: cursorPagination.page,
        queryParameterPropertyID: CURSOR_ID,
        validateProperty: isValidCursorProperty
    });
}

function validateOffsetProperty({
    endpointId,
    endpoint,
    typeResolver,
    file,
    offsetPagination
}: {
    endpointId: string;
    endpoint: RawSchemas.HttpEndpointSchema;
    typeResolver: TypeResolver;
    file: FernFileContext;
    offsetPagination: RawSchemas.OffsetPaginationSchema;
}): RuleViolation[] {
    return validateQueryParameterProperty({
        endpointId,
        endpoint,
        typeResolver,
        file,
        queryParameterProperty: offsetPagination.page,
        queryParameterPropertyID: OFFSET_ID,
        validateProperty: isValidOffsetProperty
    });
}

function validateNextCursorProperty({
    endpointId,
    typeResolver,
    file,
    resolvedResponseType,
    nextProperty
}: {
    endpointId: string;
    typeResolver: TypeResolver;
    file: FernFileContext;
    resolvedResponseType: ResolvedType;
    nextProperty: string;
}): RuleViolation[] {
    return validateResponseProperty({
        endpointId,
        typeResolver,
        file,
        resolvedResponseType,
        responseProperty: nextProperty,
        responsePropertyID: NEXT_CURSOR_ID,
        validateProperty: isValidCursorProperty
    });
}

function validateResultsProperty({
    endpointId,
    typeResolver,
    file,
    resolvedResponseType,
    resultsProperty
}: {
    endpointId: string;
    typeResolver: TypeResolver;
    file: FernFileContext;
    resolvedResponseType: ResolvedType;
    resultsProperty: string;
}): RuleViolation[] {
    return validateResponseProperty({
        endpointId,
        typeResolver,
        file,
        resolvedResponseType,
        responseProperty: resultsProperty,
        responsePropertyID: RESULTS_ID,
        validateProperty: isValidResultsProperty
    });
}

function validateQueryParameterProperty({
    endpointId,
    endpoint,
    typeResolver,
    file,
    queryParameterProperty,
    queryParameterPropertyID,
    validateProperty
}: {
    endpointId: string;
    endpoint: RawSchemas.HttpEndpointSchema;
    typeResolver: TypeResolver;
    file: FernFileContext;
    queryParameterProperty: string;
    queryParameterPropertyID: string;
    validateProperty: PropertyValidatorFunc;
}): RuleViolation[] {
    const violations: RuleViolation[] = [];

    const queryPropertyComponents = getRequestPropertyComponents(queryParameterProperty);
    if (queryPropertyComponents == null) {
        violations.push({
            severity: "error",
            message: `Pagination configuration for endpoint ${chalk.bold(
                endpointId
            )} must define a dot-delimited '${queryParameterPropertyID}' property starting with $request (e.g $request.${queryParameterPropertyID}).`
        });
        return violations;
    }

    const queryPropertyName = queryPropertyComponents?.[0];
    if (queryPropertyName == null || queryPropertyComponents.length !== 1) {
        violations.push({
            severity: "error",
            message: `Pagination configuration for endpoint ${chalk.bold(
                endpointId
            )} is only compatible with '${queryParameterPropertyID}' properties that are defined as query parameters (e.g $request.${queryParameterPropertyID}).`
        });
        return violations;
    }

    const queryParameters = typeof endpoint.request !== "string" ? endpoint.request?.["query-parameters"] : null;
    if (queryParameters == null) {
        violations.push({
            severity: "error",
            message: `Pagination configuration for endpoint ${chalk.bold(
                endpointId
            )} is only compatible with in-lined request bodies that define at least one query parameter.`
        });
        return violations;
    }

    const queryParameter = queryParameters[queryPropertyName];
    if (queryParameter == null) {
        violations.push({
            severity: "error",
            message: `Pagination configuration for endpoint ${chalk.bold(
                endpointId
            )} specifies '${queryParameterPropertyID}' ${queryParameterProperty}, but that query parameter does not exist.`
        });
        return violations;
    }

    const queryParameterType = typeof queryParameter !== "string" ? queryParameter.type : queryParameter;
    const resolvedQueryParameterType = typeResolver.resolveType({
        type: queryParameterType,
        file
    });
    if (
        !validateProperty({
            typeResolver,
            file,
            resolvedType: resolvedQueryParameterType,
            propertyComponents: queryPropertyComponents.slice(1)
        })
    ) {
        violations.push({
            severity: "error",
            message: `Pagination configuration for endpoint ${chalk.bold(
                endpointId
            )} specifies '${queryParameterPropertyID}' ${queryParameterProperty}, which is not a valid ${queryParameterPropertyID} type.`
        });
    }

    return violations;
}

function validateResponseProperty({
    endpointId,
    typeResolver,
    file,
    resolvedResponseType,
    responseProperty,
    responsePropertyID,
    validateProperty
}: {
    endpointId: string;
    typeResolver: TypeResolver;
    file: FernFileContext;
    resolvedResponseType: ResolvedType;
    responseProperty: string;
    responsePropertyID: string;
    validateProperty: PropertyValidatorFunc;
}): RuleViolation[] {
    const violations: RuleViolation[] = [];

    const responsePropertyComponents = getResponsePropertyComponents(responseProperty);
    if (responsePropertyComponents == null) {
        violations.push({
            severity: "error",
            message: `Pagination configuration for endpoint ${chalk.bold(
                endpointId
            )} must define a dot-delimited '${responsePropertyID}' property starting with $response (e.g $response.${responsePropertyID}).`
        });
    }

    if (
        responsePropertyComponents != null &&
        !validateProperty({
            typeResolver,
            file,
            resolvedType: resolvedResponseType,
            propertyComponents: responsePropertyComponents
        })
    ) {
        violations.push({
            severity: "error",
            message: `Pagination configuration for endpoint ${chalk.bold(
                endpointId
            )} specifies '${responsePropertyID}' ${responseProperty}, which is not specified as a response property.`
        });
    }

    return violations;
}

function isValidResultsProperty({
    typeResolver,
    file,
    resolvedType,
    propertyComponents
}: {
    typeResolver: TypeResolver;
    file: FernFileContext;
    resolvedType: ResolvedType | undefined;
    propertyComponents: string[];
}): boolean {
    return resolvedTypeHasProperty({
        typeResolver,
        file,
        resolvedType,
        propertyComponents,
        validator: () => true
    });
}

function isValidOffsetProperty({
    typeResolver,
    file,
    resolvedType,
    propertyComponents
}: {
    typeResolver: TypeResolver;
    file: FernFileContext;
    resolvedType: ResolvedType | undefined;
    propertyComponents: string[];
}): boolean {
    return resolvedTypeHasProperty({
        typeResolver,
        file,
        resolvedType,
        propertyComponents,
        validator: isValidOffsetType
    });
}

function isValidCursorProperty({
    typeResolver,
    file,
    resolvedType,
    propertyComponents
}: {
    typeResolver: TypeResolver;
    file: FernFileContext;
    resolvedType: ResolvedType | undefined;
    propertyComponents: string[];
}): boolean {
    return resolvedTypeHasProperty({
        typeResolver,
        file,
        resolvedType,
        propertyComponents,
        validator: isValidCursorType
    });
}

function resolvedTypeHasProperty({
    typeResolver,
    file,
    resolvedType,
    propertyComponents,
    validator
}: {
    typeResolver: TypeResolver;
    file: FernFileContext;
    resolvedType: ResolvedType | undefined;
    propertyComponents: string[];
    validator: (resolvedType: ResolvedType | undefined) => boolean;
}): boolean {
    if (propertyComponents.length === 0) {
        return validator(resolvedType);
    }
    const objectSchema = maybeObjectSchema(resolvedType);
    if (objectSchema == null) {
        return false;
    }
    const property = objectSchema.properties?.[propertyComponents[0] ?? ""];
    if (property == null) {
        return false;
    }
    const resolvedTypeProperty = typeResolver.resolveType({
        type: typeof property === "string" ? property : property.type,
        file
    });
    return resolvedTypeHasProperty({
        typeResolver,
        file,
        resolvedType: resolvedTypeProperty,
        propertyComponents: propertyComponents.slice(1),
        validator
    });
}

function resolveResponseType({
    endpoint,
    typeResolver,
    file
}: {
    endpoint: RawSchemas.HttpEndpointSchema;
    typeResolver: TypeResolver;
    file: FernFileContext;
}): ResolvedType | undefined {
    const responseType = typeof endpoint.response !== "string" ? endpoint.response?.type : endpoint.response;
    if (responseType == null) {
        return undefined;
    }
    return typeResolver.resolveType({
        type: responseType,
        file
    });
}

function isValidCursorType(resolvedType: ResolvedType | undefined): boolean {
    const primitiveType = maybePrimitiveType(resolvedType);
    if (primitiveType == null) {
        return false;
    }
    return primitiveType !== "BOOLEAN";
}

function isValidOffsetType(resolvedType: ResolvedType | undefined): boolean {
    return (
        resolvedType?._type === "primitive" &&
        (resolvedType.primitive === "INTEGER" ||
            resolvedType.primitive === "LONG" ||
            resolvedType.primitive === "DOUBLE")
    );
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

function maybePrimitiveType(resolvedType: ResolvedType | undefined): string | undefined {
    if (resolvedType?._type === "primitive") {
        return resolvedType.primitive;
    }
    if (resolvedType?._type === "container" && resolvedType.container._type === "optional") {
        return maybePrimitiveType(resolvedType.container.itemType);
    }
    return undefined;
}

function getRequestPropertyComponents(value: string): string[] | undefined {
    const trimmed = trimPrefix(value, REQUEST_PREFIX);
    return trimmed?.split(".");
}

function getResponsePropertyComponents(value: string): string[] | undefined {
    const trimmed = trimPrefix(value, RESPONSE_PREFIX);
    return trimmed?.split(".");
}

function trimPrefix(value: string, prefix: string): string | null {
    if (value.startsWith(prefix)) {
        return value.substring(prefix.length);
    }
    return null;
}
