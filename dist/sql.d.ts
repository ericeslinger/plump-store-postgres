import { Storage, IndefiniteModelData, ModelData, ModelSchema, ModelReference, RelationshipItem, TerminalStore } from 'plump';
export declare class PGStore extends Storage implements TerminalStore {
    knex: any;
    private queryCache;
    constructor(opts?: {
        [opt: string]: any;
    });
    teardown(): any;
    allocateId(type: string): Promise<number>;
    addSchema(t: {
        type: string;
        schema: ModelSchema;
    }): Promise<void>;
    writeAttributes(value: IndefiniteModelData): Promise<ModelData>;
    readAttributes(value: ModelReference): Promise<ModelData>;
    bulkRead(item: ModelReference): any;
    readRelationship(value: ModelReference, relRefName: string): Promise<ModelData>;
    delete(value: ModelReference): any;
    writeRelationshipItem(value: ModelReference, relName: string, child: RelationshipItem): any;
    deleteRelationshipItem(value: ModelReference, relName: string, child: RelationshipItem): any;
    query(q: any): Promise<any>;
}
