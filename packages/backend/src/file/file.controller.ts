import {FastifyInstance, FastifyPluginOptions, FastifyRequest} from "fastify"
import {ActivepiecesError, ErrorCode} from "../helper/activepieces-error";
import {FileId} from "shared";
import {fileService} from "./file.service";
import {StatusCodes} from "http-status-codes";

export const fileController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {


    fastify.get('/:fileId', async (_request: FastifyRequest<
        {
            Params: {
                fileId: FileId
            }
        }>, _reply) => {
        let file = await fileService.getOne(_request.params.fileId);
        if(file === null){
            throw new ActivepiecesError({ code: ErrorCode.FILE_NOT_FOUND, params: {id: _request.params.fileId}});
        }
        _reply.type("application/zip").status(StatusCodes.OK).send(file.data);
    })


};
