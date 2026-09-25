import type { Request, Response } from 'express';
import { sendSuccess } from '../../lib/api-response.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';
import { getCurrentUser, login, registerPassenger } from './auth.service.js';

export async function registerController(request: Request, response: Response) {
  const result = await registerPassenger(request.body as RegisterInput);
  sendSuccess(response, result, { statusCode: 201, message: 'Passenger account created' });
}

export async function loginController(request: Request, response: Response) {
  const result = await login(request.body as LoginInput);
  sendSuccess(response, result, { message: 'Signed in successfully' });
}

export async function meController(request: Request, response: Response) {
  const user = await getCurrentUser(request.user!.id);
  sendSuccess(response, user, { message: 'Current user loaded' });
}
