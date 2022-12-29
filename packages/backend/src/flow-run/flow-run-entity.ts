import {EntitySchema} from "typeorm"
import {ApIdSchema, BaseColumnSchemaPart} from "../helper/base-entity";
import {Collection, CollectionVersion, Instance, FlowRun, Project} from "shared";

interface FlowRunSchema extends FlowRun {
    project: Project,
    collection: Collection,
    collectionVersion: CollectionVersion,
    instance: Instance,
}

export const FlowRunEntity = new EntitySchema<FlowRunSchema>({
    name: "flow_run",
    columns: {
        ...BaseColumnSchemaPart,
        instanceId: {...ApIdSchema, nullable: true},
        projectId: ApIdSchema,
        collectionId: ApIdSchema,
        flowVersionId: ApIdSchema,
        collectionVersionId: ApIdSchema,
        flowDisplayName: {
            type: String,
        },
        collectionDisplayName: {
            type: String,
        },
        logsFileId: {...ApIdSchema, nullable: true},
        status: {
            type: String,
        },
        startTime: {
            type: "timestamp with time zone",
        },
        finishTime: {
            nullable: true,
            type: "timestamp with time zone",
        },
    },
    indices: [
        {
            name: 'idx_run_project_id',
            columns: ['projectId'],
            unique: false,
        },
        {
            name: 'idx_run_instance_id',
            columns: ['instanceId'],
            unique: true,
        }
    ],
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: "fk_flow_run_project_id",
            },
        },
        collection: {
            type: 'many-to-one',
            target: 'collection',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'collectionId',
                foreignKeyConstraintName: "fk_flow_run_collection_id",
            },
        },
        collectionVersion: {
            type: 'many-to-one',
            target: 'collection_version',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'collectionVersionId',
                foreignKeyConstraintName: "fk_flow_run_collection_version_id",
            },
        },
        instance: {
            type: 'many-to-one',
            target: 'instance',
            cascade: true,
            nullable: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'instanceId',
                foreignKeyConstraintName: "fk_flow_run_instance_id",
            },
        },
    },
})