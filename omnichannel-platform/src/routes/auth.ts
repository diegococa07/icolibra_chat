import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();

/**
 * @route POST /api/auth/login
 * @desc Realizar login com email e senha
 * @access Public
 * @body { email: string, password: string }
 * @returns { 
 *   message: string, 
 *   requiresSetup2FA?: boolean, 
 *   requires2FA?: boolean,
 *   temporaryToken?: string,
 *   userId?: string 
 * }
 */
router.post('/login', AuthController.login);

/**
 * @route POST /api/auth/2fa/generate
 * @desc Gerar configuração 2FA (QR Code e segredo)
 * @access Private (requer token temporário)
 * @headers { Authorization: "Bearer <temporary_token>" }
 * @returns { 
 *   message: string, 
 *   qrCode: string, 
 *   secret: string, 
 *   authURL: string 
 * }
 */
router.post('/2fa/generate', AuthController.generate2FA);

/**
 * @route POST /api/auth/2fa/activate
 * @desc Ativar 2FA após verificação do token
 * @access Private (requer token temporário)
 * @headers { Authorization: "Bearer <temporary_token>" }
 * @body { token: string }
 * @returns { 
 *   message: string, 
 *   token: string, 
 *   expiresIn: string, 
 *   user: object 
 * }
 */
router.post('/2fa/activate', AuthController.activate2FA);

/**
 * @route POST /api/auth/2fa/verify
 * @desc Verificar 2FA em login normal
 * @access Public
 * @body { email: string, password: string, token: string }
 * @returns { 
 *   message: string, 
 *   token: string, 
 *   expiresIn: string, 
 *   user: object 
 * }
 */
router.post('/2fa/verify', AuthController.verify2FA);

/**
 * @route POST /api/auth/logout
 * @desc Realizar logout
 * @access Private
 * @headers { Authorization: "Bearer <token>" }
 * @returns { message: string }
 */
router.post('/logout', AuthController.logout);

/**
 * @route GET /api/auth/me
 * @desc Obter dados do usuário atual
 * @access Private (requer token completo)
 * @headers { Authorization: "Bearer <full_token>" }
 * @returns { user: object }
 */
router.get('/me', AuthController.getCurrentUser);

/**
 * @route POST /api/auth/refresh
 * @desc Renovar token de acesso
 * @access Private (requer token completo)
 * @headers { Authorization: "Bearer <full_token>" }
 * @returns { 
 *   message: string, 
 *   token: string, 
 *   expiresIn: string, 
 *   user: object 
 * }
 */
router.post('/refresh', AuthController.refreshToken);

export default router;

