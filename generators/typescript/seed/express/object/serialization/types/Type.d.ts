/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "..";
import * as SeedObject from "../../api";
import * as core from "../../core";
export declare const Type: core.serialization.ObjectSchema<serializers.Type.Raw, SeedObject.Type>;
export declare namespace Type {
    interface Raw {
        one: number;
        two: number;
        three: string;
        four: boolean;
        five: number;
        six: string;
        seven: string;
        eight: string;
        nine: string;
        ten: number[];
        eleven: number[];
        twelve: Record<string, boolean>;
        thirteen?: number | null;
        fourteen?: unknown;
        fifteen: number[][];
        sixteen: Record<string, number>[];
        seventeen: (string | null | undefined)[];
        eighteen: "eighteen";
        nineteen: serializers.Name.Raw;
    }
}