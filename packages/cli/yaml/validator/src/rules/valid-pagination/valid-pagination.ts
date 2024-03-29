import {
    constructFernFileContext,
    FernFileContext,
    ResolvedType,
    TypeResolver,
    TypeResolverImpl
} from "@fern-api/ir-generator";
import { isRawObjectDefinition } from "@fern-api/yaml-schema";
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
                httpEndpoint: ({ endpoint }, { relativeFilepath, contents: definitionFile }) => {
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

                    const violations: RuleViolation[] = [];

                    const pagePropertyComponents = getRequestPropertyComponents(endpointPagination.page);
                    if (pagePropertyComponents == null) {
                        violations.push({
                            severity: "error",
                            message: `Pagination configuration for endpoint ${chalk.bold(
                                endpoint.path
                            )} must define a dot-delimited 'page' property starting with $request (e.g $request.cursor).`
                        });
                    }

                    let nextPropertyComponents: string[] | undefined;
                    if (endpointPagination.type === "cursor") {
                        nextPropertyComponents = getResponsePropertyComponents(endpointPagination?.next);
                        if (nextPropertyComponents == null) {
                            violations.push({
                                severity: "error",
                                message: `Pagination configuration for endpoint ${chalk.bold(
                                    endpoint.path
                                )} must define a dot-delimited 'next' property starting with $response (e.g $response.next).`
                            });
                        }
                    }

                    const resultsPropertyComponents = getResponsePropertyComponents(endpointPagination.results);
                    if (resultsPropertyComponents == null) {
                        violations.push({
                            severity: "error",
                            message: `Pagination configuration for endpoint ${chalk.bold(
                                endpoint.path
                            )} must define a dot-delimited 'results' property starting with $response (e.g $response.results).`
                        });
                    }

                    if (
                        pagePropertyComponents == null ||
                        nextPropertyComponents == null ||
                        resultsPropertyComponents == null
                    ) {
                        return violations;
                    }

                    const queryParameters =
                        typeof endpoint.request !== "string" ? endpoint.request?.["query-parameters"] : null;
                    if (queryParameters == null) {
                        violations.push({
                            severity: "error",
                            message: `Pagination configuration for endpoint ${chalk.bold(
                                endpoint.path
                            )} is only compatible with in-lined request bodies that define at least one query parameter.`
                        });
                        return violations;
                    }

                    const responseType =
                        typeof endpoint.response !== "string" ? endpoint.response?.type : endpoint.response;
                    if (responseType == null) {
                        violations.push({
                            severity: "error",
                            message: `Pagination configuration for endpoint ${chalk.bold(
                                endpoint.path
                            )} is only compatible with endpoints that define a response.`
                        });
                        return violations;
                    }
                    const resolvedResponseType = typeResolver.resolveType({
                        type: responseType,
                        file
                    });

                    if (
                        endpointPagination.type === "cursor" &&
                        !resolvedTypeHasProperty(typeResolver, file, resolvedResponseType, nextPropertyComponents)
                    ) {
                        violations.push({
                            severity: "error",
                            message: `Pagination configuration for endpoint ${chalk.bold(
                                endpoint.path
                            )} specifies next ${
                                endpointPagination.next
                            }, which is not specified as a response property.`
                        });
                    }

                    if (!resolvedTypeHasProperty(typeResolver, file, resolvedResponseType, resultsPropertyComponents)) {
                        violations.push({
                            severity: "error",
                            message: `Pagination configuration for endpoint ${chalk.bold(
                                endpoint.path
                            )} specifies results ${
                                endpointPagination.results
                            }, which is not specified as a response property.`
                        });
                    }

                    for (const [queryParameterKey, queryParameter] of Object.entries(queryParameters)) {
                        if (queryParameterKey !== pagePropertyComponents[0]) {
                            continue;
                        }
                        const queryParameterType =
                            typeof queryParameter !== "string" ? queryParameter.type : queryParameter;
                        const resolvedQueryParameterType = typeResolver.resolveType({
                            type: queryParameterType,
                            file
                        });
                        if (
                            !resolvedTypeHasProperty(
                                typeResolver,
                                file,
                                resolvedQueryParameterType,
                                pagePropertyComponents.slice(1)
                            )
                        ) {
                            violations.push({
                                severity: "error",
                                message: `Pagination configuration for endpoint ${chalk.bold(
                                    endpoint.path
                                )} specifies page ${
                                    endpointPagination.page
                                }, which is not specified as a query-parameter.`
                            });
                        }
                        break;
                    }

                    return violations;
                }
            }
        };
    }
};

function resolvedTypeHasProperty(
    typeResolver: TypeResolver,
    file: FernFileContext,
    resolvedType: ResolvedType | undefined,
    propertyComponents: string[]
): boolean {
    if (resolvedType == null) {
        return false;
    }
    if (propertyComponents.length === 0) {
        return true;
    }
    const propertyComponent = propertyComponents[0] ?? "";
    if (resolvedType._type !== "named" || !isRawObjectDefinition(resolvedType.declaration)) {
        return false;
    }
    const property = resolvedType.declaration.properties?.[propertyComponent];
    if (property == null) {
        return false;
    }
    const resolvedTypeProperty = typeResolver.resolveType({
        type: typeof property === "string" ? property : property.type,
        file
    });
    return resolvedTypeHasProperty(typeResolver, file, resolvedTypeProperty, propertyComponents.slice(1));
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
