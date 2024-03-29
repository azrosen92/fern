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
        ...validateNextProperty({
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
    const violations: RuleViolation[] = [];

    const pagePropertyComponents = getRequestPropertyComponents(cursorPagination.page);
    if (pagePropertyComponents == null) {
        violations.push({
            severity: "error",
            message: `Pagination configuration for endpoint ${chalk.bold(
                endpointId
            )} must define a dot-delimited 'page' property starting with $request (e.g $request.cursor).`
        });
        return violations;
    }

    const queryPropertyName = pagePropertyComponents?.[0];
    if (queryPropertyName == null || pagePropertyComponents.length !== 1) {
        violations.push({
            severity: "error",
            message: `Pagination configuration for endpoint ${chalk.bold(
                endpointId
            )} is only compatible with 'page' properties that are defined as query parameters (e.g $request.cursor).`
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
            message: `Pagination configuration for endpoint ${chalk.bold(endpointId)} specifies 'page' ${
                cursorPagination.page
            }, but that query parameter does not exist.`
        });
        return violations;
    }

    const queryParameterType = typeof queryParameter !== "string" ? queryParameter.type : queryParameter;
    const resolvedQueryParameterType = typeResolver.resolveType({
        type: queryParameterType,
        file
    });
    if (
        !isValidCursorProperty({
            typeResolver,
            file,
            resolvedType: resolvedQueryParameterType,
            propertyComponents: pagePropertyComponents.slice(1)
        })
    ) {
        violations.push({
            severity: "error",
            message: `Pagination configuration for endpoint ${chalk.bold(endpointId)} specifies 'page' ${
                cursorPagination.page
            }, which is not a valid page type.`
        });
    }

    return violations;
}

function validateNextProperty({
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
    const violations: RuleViolation[] = [];

    const nextPropertyComponents = getResponsePropertyComponents(nextProperty);
    if (nextPropertyComponents == null) {
        violations.push({
            severity: "error",
            message: `Pagination configuration for endpoint ${chalk.bold(
                endpointId
            )} must define a dot-delimited 'next' property starting with $response (e.g $response.next).`
        });
    }

    if (
        nextPropertyComponents != null &&
        !isValidCursorProperty({
            typeResolver,
            file,
            resolvedType: resolvedResponseType,
            propertyComponents: nextPropertyComponents
        })
    ) {
        violations.push({
            severity: "error",
            message: `Pagination configuration for endpoint ${chalk.bold(
                endpointId
            )} specifies 'next' ${nextProperty}, which is not specified as a response property.`
        });
    }

    return violations;
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
    const violations: RuleViolation[] = [];

    const resultsPropertyComponents = getResponsePropertyComponents(resultsProperty);
    if (resultsPropertyComponents == null) {
        violations.push({
            severity: "error",
            message: `Pagination configuration for endpoint ${chalk.bold(
                endpointId
            )} must define a dot-delimited 'results' property starting with $response (e.g $response.results).`
        });
    }

    if (
        resultsPropertyComponents != null &&
        !isValidResultsProperty({
            typeResolver,
            file,
            resolvedType: resolvedResponseType,
            propertyComponents: resultsPropertyComponents
        })
    ) {
        violations.push({
            severity: "error",
            message: `Pagination configuration for endpoint ${chalk.bold(
                endpointId
            )} specifies 'results' ${resultsProperty}, which is not specified as a response property.`
        });
    }

    return violations;
}

function validateOffsetPagination({
    endpointId,
    typeResolver,
    file,
    offsetPagination
}: {
    endpointId: string;
    typeResolver: TypeResolver;
    file: FernFileContext;
    offsetPagination: RawSchemas.OffsetPaginationSchema;
}): RuleViolation[] {
    // TODO: Implement this.
    return [];
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
