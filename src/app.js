import express from 'express';
import cookieParser from 'cookie-parser';
import authRoute from './module/auth/auth.route.js';
import errorHandler from './common/utils/error-handler.utils.js';
import oidcRoute from './module/oidc/oidc.route.js';


function createApplication(){
  const app = express();

  //middlewares
  app.use(express.json());
  app.use(express.urlencoded({extended: true}));
  app.use(express.static('public'));
  app.use(cookieParser())


  // routes
  app.use('/api/auth', authRoute);
  app.use(oidcRoute);
  
  app.get('/health', (req, res)=>{
    res.status(200).send({ok: true})
  })



  // globally error handler
  app.use(errorHandler);

  return app;
}


export default createApplication;