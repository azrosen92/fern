/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as FernIr from "../../..";

/**
 * If set, the endpoint will be generated with auto-pagination features.
 */
export type Pagination = FernIr.Pagination.Cursor | FernIr.Pagination.Offset;

export declare namespace Pagination {
    interface Cursor extends FernIr.CursorPagination, _Utils {
        type: "cursor";
    }

    interface Offset extends FernIr.OffsetPagination, _Utils {
        type: "offset";
    }

    interface _Utils {
        _visit: <_Result>(visitor: FernIr.Pagination._Visitor<_Result>) => _Result;
    }

    interface _Visitor<_Result> {
        cursor: (value: FernIr.CursorPagination) => _Result;
        offset: (value: FernIr.OffsetPagination) => _Result;
        _other: (value: { type: string }) => _Result;
    }
}

export const Pagination = {
    cursor: (value: FernIr.CursorPagination): FernIr.Pagination.Cursor => {
        return {
            ...value,
            type: "cursor",
            _visit: function <_Result>(this: FernIr.Pagination.Cursor, visitor: FernIr.Pagination._Visitor<_Result>) {
                return FernIr.Pagination._visit(this, visitor);
            },
        };
    },

    offset: (value: FernIr.OffsetPagination): FernIr.Pagination.Offset => {
        return {
            ...value,
            type: "offset",
            _visit: function <_Result>(this: FernIr.Pagination.Offset, visitor: FernIr.Pagination._Visitor<_Result>) {
                return FernIr.Pagination._visit(this, visitor);
            },
        };
    },

    _visit: <_Result>(value: FernIr.Pagination, visitor: FernIr.Pagination._Visitor<_Result>): _Result => {
        switch (value.type) {
            case "cursor":
                return visitor.cursor(value);
            case "offset":
                return visitor.offset(value);
            default:
                return visitor._other(value as any);
        }
    },
} as const;
