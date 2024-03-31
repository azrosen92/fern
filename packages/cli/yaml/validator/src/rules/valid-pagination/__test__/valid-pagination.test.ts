import { AbsoluteFilePath, join, RelativeFilePath } from "@fern-api/fs-utils";
import { getViolationsForRule } from "../../../testing-utils/getViolationsForRule";
import { ValidationViolation } from "../../../ValidationViolation";
import { ValidPaginationRule } from "../valid-pagination";

describe("valid-pagination", () => {
    it("valid", async () => {
        const violations = await getViolationsForRule({
            rule: ValidPaginationRule,
            absolutePathToWorkspace: join(
                AbsoluteFilePath.of(__dirname),
                RelativeFilePath.of("fixtures"),
                RelativeFilePath.of("valid")
            )
        });
        expect(violations).toEqual([]);
    });

    it("invalid", async () => {
        const violations = await getViolationsForRule({
            rule: ValidPaginationRule,
            absolutePathToWorkspace: join(
                AbsoluteFilePath.of(__dirname),
                RelativeFilePath.of("fixtures"),
                RelativeFilePath.of("invalid")
            )
        });
        const expectedViolations: ValidationViolation[] = [
            {
                message:
                    "Pagination configuration for endpoint listWithInvalidCursorPagination specifies 'cursor' $request.typo, but that query parameter does not exist.",
                nodePath: ["service", "endpoints", "listWithInvalidCursorPagination"],
                relativeFilepath: RelativeFilePath.of("simple.yml"),
                severity: "error"
            },
            {
                message:
                    "Pagination configuration for endpoint listWithInvalidCursorPagination specifies 'next_cursor' $response.typo.next.starting_after, which is not specified as a response property.",
                nodePath: ["service", "endpoints", "listWithInvalidCursorPagination"],
                relativeFilepath: RelativeFilePath.of("simple.yml"),
                severity: "error"
            },
            {
                message:
                    "Pagination configuration for endpoint listWithInvalidCursorPagination specifies 'results' $response.typo, which is not specified as a response property.",
                nodePath: ["service", "endpoints", "listWithInvalidCursorPagination"],
                relativeFilepath: RelativeFilePath.of("simple.yml"),
                severity: "error"
            }
        ];

        expect(violations).toEqual(expectedViolations);
    });
});
