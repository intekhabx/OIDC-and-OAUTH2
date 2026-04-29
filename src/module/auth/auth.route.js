import express from 'express';
import * as controller from './auth.controller.js';
import {validate} from '../../common/middleware/validate.middleware.js';
import registerDto from './dto-validator/register.dto.js';
import loginDto from './dto-validator/login.dto.js';


const router = express.Router();


// routes
router.post('/register', validate(registerDto) , controller.register);
router.post('/login', validate(loginDto), controller.login);
router.post('/logout', controller.logout);
router.post('/refresh-token', controller.renewToken);




export default router;
