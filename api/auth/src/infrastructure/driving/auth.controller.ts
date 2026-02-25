import type { Request, Response } from 'express';
import { z } from 'zod';
import type { RegisterUseCase } from '../../application/use-cases/register.use-case.js';

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  password: z.string().min(8),
});

export class AuthController {
  constructor(private readonly registerUseCase: RegisterUseCase) {}

  async register(req: Request, res: Response): Promise<void> {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ errors: z.treeifyError(parsed.error) });
      return;
    }

    const result = await this.registerUseCase.execute(parsed.data);
    res.status(201).json(result);
  }
}
