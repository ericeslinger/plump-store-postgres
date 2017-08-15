import * as knex from 'knex';
import { Storage, IndefiniteModelData, ModelData, ModelSchema, ModelReference, RelationshipItem, TerminalStore } from 'plump';
export declare class PGStore extends Storage implements TerminalStore {
    knex: knex;
    private queryCache;
    constructor(opts?: {
        [opt: string]: any;
    });
    teardown(): Promise<void>;
    allocateId(type: string): Promise<number>;
    addSchema(t: {
        type: string;
        schema: ModelSchema;
    }): Promise<void>;
    writeAttributes(value: IndefiniteModelData): Promise<ModelData>;
    readAttributes(value: ModelReference): Promise<ModelData>;
    bulkRead(item: ModelReference): Promise<any>;
    readRelationship(value: ModelReference, relRefName: string): Promise<ModelData>;
    delete(value: ModelReference): Promise<any>;
    writeRelationshipItem(value: ModelReference, relName: string, child: RelationshipItem): Promise<any>;
    deleteRelationshipItem(value: ModelReference, relName: string, child: RelationshipItem): Promise<any>;
    query(type: string, q: any): Promise<any>;
}
