import express from 'express';
import * as controller from './oidc.controller.js';
import { isLoggedIn } from '../auth/auth.middleware.js';
import {validate} from '../../common/middleware/validate.middleware.js'
import registerApplicationDto from './dto-validator/register-application.dto.js';


const router = express.Router();


// routes
router.get('/.well-known/openid-configuration', controller.wellKnownController);
router.get('/oidc/oauth2/authenticate', controller.renderAuthentictePage);

router.get('/api/developer-console', controller.renderRegisterApplicationPage) //isLoggedIn --token verificaiton
router.post('/oidc/oauth2/register-application',validate(registerApplicationDto), isLoggedIn, controller.registerApplication);

router.get('/oidc/oauth2/certs', controller.getPublicKey);






export default router;
