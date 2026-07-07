import express from 'express';
import * as controller from './oidc.controller.js';
import { isLoggedIn } from '../auth/auth.middleware.js';
import {validate} from '../../common/middleware/validate.middleware.js'
import registerApplicationDto from './dto-validator/register-application.dto.js';
import getOrRenewTokensDto from './dto-validator/token-generation.dto.js';
import { authenticateUserWithRefreshToken, verifyOauthAccessToken } from './oidc.middleware.js';
import signOutUserDto from './dto-validator/signout-user.dto.js';


const router = express.Router();


// routes
router.get('/.well-known/openid-configuration', controller.wellKnownController);
router.get('/oidc/oauth2/authenticate', controller.renderAuthentictePage);

router.get('/api/developer-console', controller.renderRegisterApplicationPage) //isLoggedIn --token verificaiton
router.post('/oidc/oauth2/register-application',validate(registerApplicationDto), isLoggedIn, controller.registerApplication);

router.get('/oidc/oauth2/certs', controller.getPublicKey);

router.get('/oidc/oauth2/authorize', controller.showUserConsentPage);
router.get('/oidc/oauth2/consent-info', isLoggedIn, controller.getUserAndAppDetails);
router.post('/oidc/oauth2/consent/accept', authenticateUserWithRefreshToken, controller.acceptConsent);
router.post('/oidc/oauth2/consent/deny', authenticateUserWithRefreshToken, controller.denyConsent);


router.post('/oidc/oauth2/token', validate(getOrRenewTokensDto), controller.getOrRenewClientAccessAndRefreshToken);
router.get('/oidc/oauth2/userinfo', verifyOauthAccessToken, controller.getUserInfo);

router.post("/oidc/oauth2/revoke", validate(signOutUserDto), verifyOauthAccessToken, controller.signOutUser);



export default router;
