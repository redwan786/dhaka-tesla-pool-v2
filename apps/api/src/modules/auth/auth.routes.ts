import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { validate } from '../../middleware/validate.js';
import { loginController, meController, registerController } from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schemas.js';

export const authRouter = Router();

authRouter.post('/register', validate({ body: registerSchema }), asyncHandler(registerController));
authRouter.post('/login', validate({ body: loginSchema }), asyncHandler(loginController));
authRouter.get('/me', authenticate, asyncHandler(meController));
