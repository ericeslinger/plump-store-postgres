/// <reference types="knex" />
import Knex from 'knex';
import { Storage, IndefiniteModelData, ModelData, ModelSchema, StorageReadRequest, ModelReference, RelationshipItem, TerminalStore } from 'plump';
import { ParameterizedQuery } from './semiQuery';
export declare class PGStore extends Storage implements TerminalStore {
    knex: Knex;
    queryCache: {
        [type: string]: {
            relationships: {
                [relName: string]: ParameterizedQuery;
            };
        };
    };
    constructor(opts?: {
        [opt: string]: any;
    });
    teardown(): Promise<void>;
    allocateId(type: string): Promise<number>;
    addSchema(t: {
        type: string;
        schema: ModelSchema;
    }): Promise<void>;
    rearrangeData(req: StorageReadRequest, data: any): ModelData;
    writeAttributes(value: IndefiniteModelData): Promise<ModelData>;
    readAttributes(req: StorageReadRequest): Promise<ModelData>;
    readRelationship(req: StorageReadRequest): Promise<ModelData>;
    delete(value: ModelReference): Promise<any>;
    writeRelationshipItem(value: ModelReference, relName: string, child: RelationshipItem): Promise<any>;
    deleteRelationshipItem(value: ModelReference, relName: string, child: RelationshipItem): Promise<any>;
    query(type: string, q: any): Promise<any>;
}
