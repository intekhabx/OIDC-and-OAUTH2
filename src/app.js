import express from 'express';
import cookieParser from 'cookie-parser';
import authRoute from './module/auth/auth.route.js';


function createApplication(){
  const app = express();

  //middlewares
  app.use(express.json());
  app.use(express.urlencoded({extended: true}));
  app.use(express.static('./public'));
  app.use(cookieParser())


  // routes
  app.use('/api/route', authRoute);
  
  app.get('/health', (req, res)=>{
    res.status(200).send({ok: true})
  })


  return app;
}


export default createApplication;