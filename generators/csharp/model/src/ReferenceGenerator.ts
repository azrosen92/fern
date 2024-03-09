import { csharp } from "@fern-api/csharp-codegen";
import {
    ContainerType,
    DeclaredTypeName,
    Literal,
    MapType,
    PrimitiveType,
    TypeDeclaration,
    TypeId,
    TypeReference
} from "@fern-fern/ir-sdk/api";

export class ReferenceGenerator {
    private types: Map<TypeId, TypeDeclaration>;
    private references: Map<TypeReference, csharp.Type>;
    public classReferences: Map<TypeId, csharp.ClassReference>;

    constructor(types: Map<TypeId, TypeDeclaration>) {
        this.types = types;
        this.references = new Map();
        this.classReferences = new Map();
    }

    private typeFromContainerReference(rootModule: string, containerType: ContainerType): csharp.Type {
        return containerType._visit<csharp.Type>({
            list: (value: TypeReference) => csharp.Type.list(this.typeFromTypeReference(rootModule, value)),
            map: (value: MapType) =>
                csharp.Type.map(
                    this.typeFromTypeReference(rootModule, value.keyType),
                    this.typeFromTypeReference(rootModule, value.valueType)
                ),
            set: (value: TypeReference) => csharp.Type.set(this.typeFromTypeReference(rootModule, value)),
            optional: (value: TypeReference) => csharp.Type.optional(this.typeFromTypeReference(rootModule, value)),
            literal: (value: Literal) =>
                value._visit<csharp.Type>({
                    string: () => csharp.Type.string(),
                    boolean: () => csharp.Type.boolean(),
                    _other: () => csharp.Type.object()
                }),
            _other: () => csharp.Type.object()
        });
    }

    public typeFromTypeReference(rootModule: string, typeReference: TypeReference): csharp.Type {
        if (this.references.has(typeReference)) {
            return this.references.get(typeReference)!;
        }
        const type = typeReference._visit<csharp.Type>({
            container: (value: ContainerType) => this.typeFromContainerReference(rootModule, value),
            named: (value: DeclaredTypeName) => {
                // If it's an alias resolve the reference, otherwise get the type from the reference
                const underlyingType = this.types.get(value.typeId);
                if (underlyingType == null) {
                    throw new Error(`Type ${value.name.pascalCase.safeName} not found`);
                }

                // TODO: For enums we want to make a new Type, to include the StringEnum<ActualEnum>
                // situation, similar to oneOfs below
                const objectClassReference = new csharp.ClassReference({
                    name: value.name.pascalCase.safeName,
                    namespace: csharp.Class.getNamespaceFromFernFilepath(rootModule, value.fernFilepath)
                });
                const objectReference = csharp.Type.reference(objectClassReference);
                this.classReferences.set(value.typeId, objectClassReference);

                return underlyingType.shape._visit({
                    alias: (alias) => this.typeFromTypeReference(rootModule, alias.aliasOf),
                    object: () => objectReference,
                    enum: () => objectReference,
                    union: (union) =>
                        // TODO: Actually get the union types, since we'll need to create new classes like we do in Typescript
                        csharp.Type.oneOf(
                            union.types.map((member) => this.typeFromTypeReference(rootModule, member.shape))
                        ),
                    undiscriminatedUnion: (union) =>
                        csharp.Type.oneOf(
                            union.members.map((member) => this.typeFromTypeReference(rootModule, member.type))
                        ),
                    _other: () => objectReference
                });
            },
            primitive: (value: PrimitiveType) =>
                PrimitiveType._visit<csharp.Type>(value, {
                    integer: () => csharp.Type.integer(),
                    double: () => csharp.Type.double(),
                    string: () => csharp.Type.string(),
                    boolean: () => csharp.Type.boolean(),
                    long: () => csharp.Type.long(),
                    date: () => csharp.Type.date(),
                    dateTime: () => csharp.Type.dateTime(),
                    uuid: () => csharp.Type.uuid(),
                    // https://learn.microsoft.com/en-us/dotnet/api/system.convert.tobase64string?view=net-8.0
                    base64: () => csharp.Type.string(),
                    _other: () => csharp.Type.object()
                }),
            unknown: () => csharp.Type.object(),
            _other: () => csharp.Type.object()
        });
        this.references.set(typeReference, type);
        return type;
    }
}