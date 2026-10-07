import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare class RequestIdMiddleware implements NestMiddleware {
    private readonly logger;
    use(req: Request & {
        id?: string;
    }, res: Response, next: NextFunction): void;
}
export declare function requestIdMiddleware(req: Request & {
    id?: string;
}, res: Response, next: NextFunction): void;
