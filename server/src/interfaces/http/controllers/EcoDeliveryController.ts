import { Request, Response, NextFunction } from 'express';
import {
  EcoDeliveryUseCase,
  EcoDeliveryError,
} from '../../../application/use-cases/EcoDeliveryUseCase';
import { EcoDeliveryOptionIdEntity } from '../../../domain/entities/EcoDeliveryOption';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

const VALID_OPTION_IDS = new Set<string>(Object.values(EcoDeliveryOptionIdEntity));

export class EcoDeliveryController {
  constructor(private useCase: EcoDeliveryUseCase) {}

  listOptions = (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ success: true, data: this.useCase.listOptions() });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  previewImpact = (req: Request, res: Response, next: NextFunction) => {
    try {
      const optionId = req.query.optionId;
      if (typeof optionId !== 'string' || !VALID_OPTION_IDS.has(optionId)) {
        throw new AppError(400, 'Invalid optionId');
      }
      const impact = this.useCase.computeImpact(optionId as EcoDeliveryOptionIdEntity);
      res.json({ success: true, data: impact });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  recordChoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const orderId = req.params.orderId as string;
      const optionId = req.body?.optionId;
      if (typeof optionId !== 'string' || !VALID_OPTION_IDS.has(optionId)) {
        throw new AppError(400, 'Invalid optionId');
      }
      // donateTree is optional — coerce to boolean, anything truthy turns the
      // pledge on (the use case caps it at one tree per order).
      const donateTree = Boolean(req.body?.donateTree);
      const result = await this.useCase.recordChoice(userId, orderId, {
        optionId: optionId as EcoDeliveryOptionIdEntity,
        donateTree,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  treesPlanted = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.useCase.getTreesPlantedSummary();
      res.json({ success: true, data });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  getForOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const orderId = req.params.orderId as string;
      const result = await this.useCase.getForOrder(userId, orderId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  private mapError(err: unknown): AppError | Error {
    if (err instanceof EcoDeliveryError) return new AppError(err.statusCode, err.message);
    if (err instanceof AppError) return err;
    return err as Error;
  }
}
