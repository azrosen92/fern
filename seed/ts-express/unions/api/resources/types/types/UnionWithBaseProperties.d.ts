/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as SeedUnions from "../../..";
export declare type UnionWithBaseProperties = SeedUnions.UnionWithBaseProperties.Integer | SeedUnions.UnionWithBaseProperties.String | SeedUnions.UnionWithBaseProperties.Foo;
export declare namespace UnionWithBaseProperties {
    interface Integer extends _Base {
        type: "integer";
        value: number;
    }
    interface String extends _Base {
        type: "string";
        value: string;
    }
    interface Foo extends SeedUnions.Foo, _Base {
        type: "foo";
    }
    interface _Base {
        id: string;
    }
}
