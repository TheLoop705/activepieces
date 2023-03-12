import { FastifyInstance, FastifyRequest } from "fastify";
import {
    Action,
    CreateFlowRequest,
    FlowId,
    FlowOperationRequest,
    FlowOperationType,
    StepLocationRelativeToParent,
    FlowVersionId,
    ListFlowsRequest,
    Trigger,
} from "@activepieces/shared";
import { StatusCodes } from "http-status-codes";
import { ActivepiecesError, ErrorCode } from "@activepieces/shared";
import { flowService } from "./flow.service";
import { GuessFlowRequest } from "../../../../shared/src/lib/flows/dto/create-flow-request";
import { guessTrigger } from "../helper/openai";
import { logger } from "../helper/logger";

const DEFUALT_PAGE_SIZE = 10;

export const flowController = async (fastify: FastifyInstance) => {
    fastify.post(
        "/guess",
        {
            schema: {
                body: GuessFlowRequest
            },
        },
        async (
            request: FastifyRequest<{
                Body: GuessFlowRequest;
            }>
        ) => {
            const trigger = await guessTrigger(request.body.prompt);
            const flow = await flowService.create({
                projectId: request.principal.projectId, request: {
                    displayName: request.body.displayName,
                    collectionId: request.body.collectionId
                }
            });
            console.log(trigger);
            logger.info("flow created", flow);
            trigger.name = "trigger";
            flowService.update({
                flowId: flow.id,
                projectId: request.principal.projectId,
                request: {
                    type: FlowOperationType.UPDATE_TRIGGER,
                    request: trigger
                }
            });
            logger.info("trigger updated", trigger);
            let parentStep = trigger.name;
            let currentStep = trigger.nextAction;
            let count = 0;
            while (currentStep !== undefined) {
                logger.info("action added");
                console.log(currentStep);
                count++;
                currentStep.name = `step-${count}`;
                currentStep.settings.input = {};
                await flowService.update({
                    flowId: flow.id,
                    projectId: request.principal.projectId,
                    request: {
                        type: FlowOperationType.ADD_ACTION,
                        request: {
                            parentStep: parentStep,
                            action: currentStep
                        }
                    }
                });
                if (currentStep.type === "BRANCH") {
                    if (currentStep.onSuccessAction) {
                        currentStep.onSuccessAction.name = `step-${count}-success`;
                        currentStep.onSuccessAction.settings.input = {};
                        await flowService.update({
                            flowId: flow.id,
                            projectId: request.principal.projectId,
                            request: {
                                type: FlowOperationType.ADD_ACTION,
                                request: {
                                    parentStep: currentStep.name,
                                    stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_TRUE_BRANCH,
                                    action: currentStep.onSuccessAction
                                }
                            }
                        });
                    }
                    if(currentStep.onFailureAction) {
                        currentStep.onFailureAction.name = `step-${count}-failure`;
                        currentStep.onFailureAction.settings.input = {};
                        await flowService.update({
                            flowId: flow.id,
                            projectId: request.principal.projectId,
                            request: {
                                type: FlowOperationType.ADD_ACTION,
                                request: {
                                    parentStep: currentStep.name,
                                    stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_FALSE_BRANCH,
                                    action: currentStep.onFailureAction
                                }
                            }
                        });
                    }
                }
                parentStep = currentStep.name;
                currentStep = currentStep.nextAction;
            }
            return flowService.getOne({ id: flow.id, versionId: undefined, projectId: request.principal.projectId, includeArtifacts: false });
        }
    );

    fastify.post(
        "/",
        {
            schema: {
                body: CreateFlowRequest
            },
        },
        async (
            request: FastifyRequest<{
                Body: CreateFlowRequest;
            }>
        ) => {
            return await flowService.create({ projectId: request.principal.projectId, request: request.body });
        }
    );

    fastify.post(
        "/:flowId",
        {
            schema: {
                body: FlowOperationRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Params: {
                    flowId: FlowId;
                };
                Body: FlowOperationRequest;
            }>
        ) => {
            const flow = await flowService.getOne({ id: request.params.flowId, versionId: undefined, projectId: request.principal.projectId, includeArtifacts: false });
            if (flow === null) {
                throw new ActivepiecesError({ code: ErrorCode.FLOW_NOT_FOUND, params: { id: request.params.flowId } });
            }
            return await flowService.update({ flowId: request.params.flowId, request: request.body, projectId: request.principal.projectId });
        }
    );

    fastify.get(
        "/",
        {
            schema: {
                querystring: ListFlowsRequest
            },
        },
        async (
            request: FastifyRequest<{
                Querystring: ListFlowsRequest;
            }>
        ) => {
            return await flowService.list({ projectId: request.principal.projectId, collectionId: request.query.collectionId, cursorRequest: request.query.cursor ?? null, limit: request.query.limit ?? DEFUALT_PAGE_SIZE });
        }
    );

    fastify.get(
        "/:flowId",
        async (
            request: FastifyRequest<{
                Params: {
                    flowId: FlowId;
                };
                Querystring: {
                    versionId: FlowVersionId | undefined;
                    includeArtifacts: boolean | undefined;
                };
            }>
        ) => {
            const versionId: FlowVersionId | undefined = request.query.versionId;
            const includeArtifacts = request.query.includeArtifacts ?? false;
            const flow = await flowService.getOne({ id: request.params.flowId, versionId: versionId, projectId: request.principal.projectId, includeArtifacts });
            if (flow === null) {
                throw new ActivepiecesError({ code: ErrorCode.FLOW_NOT_FOUND, params: { id: request.params.flowId } });
            }
            return flow;
        }
    );

    fastify.delete(
        "/:flowId",
        async (
            request: FastifyRequest<{
                Params: {
                    flowId: FlowId;
                };
            }>,
            _reply
        ) => {
            await flowService.delete({ projectId: request.principal.projectId, flowId: request.params.flowId });
            _reply.status(StatusCodes.OK).send();
        }
    );
};
