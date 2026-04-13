import { Request, Response, NextFunction } from 'express';
import { ProfileUseCase, ProfileError } from '../../../application/use-cases/ProfileUseCase';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

export class UserController {
  constructor(private profileUseCase: ProfileUseCase) {}

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const profile = await this.profileUseCase.getProfile(userId);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const { firstName, lastName, phone, avatar, currentPassword } = req.body;

      if (!currentPassword) {
        throw new AppError(400, 'Le mot de passe actuel est requis pour modifier le profil');
      }

      const profile = await this.profileUseCase.updateProfile(userId, {
        currentPassword,
        firstName,
        lastName,
        phone,
        avatar,
      });

      res.json({ success: true, data: profile });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  // ── Addresses ──────────────────────────────────────────

  getAddresses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const addresses = await this.profileUseCase.getAddresses(userId);
      res.json({ success: true, data: addresses });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  addAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const { label, street, city, postalCode, country, isDefault } = req.body;

      if (!label || !street || !city || !postalCode || !country) {
        throw new AppError(400, 'Tous les champs sont requis');
      }

      const addresses = await this.profileUseCase.addAddress(userId, {
        label: label.trim(),
        street: street.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        isDefault: !!isDefault,
      });

      res.status(201).json({ success: true, data: addresses });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  updateAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const id = req.params.id as string;

      if (!id) throw new AppError(400, "ID d'adresse requis");

      const addresses = await this.profileUseCase.updateAddress(userId, id, req.body);
      res.json({ success: true, data: addresses });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const id = req.params.id as string;

      if (!id) throw new AppError(400, "ID d'adresse requis");

      const addresses = await this.profileUseCase.deleteAddress(userId, id);
      res.json({ success: true, data: addresses });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  // ── Preferences ────────────────────────────────────────

  getPreferences = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const preferences = await this.profileUseCase.getPreferences(userId);
      res.json({ success: true, data: preferences });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  updatePreferences = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const { language, currency, notifications } = req.body;
      const preferences = await this.profileUseCase.updatePreferences(userId, {
        language,
        currency,
        notifications,
      });
      res.json({ success: true, data: preferences });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  private mapError(err: unknown): AppError | Error {
    if (err instanceof ProfileError) {
      return new AppError(err.statusCode, err.message);
    }
    if (err instanceof AppError) {
      return err;
    }
    return err as Error;
  }
}
