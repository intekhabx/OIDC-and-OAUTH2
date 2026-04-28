import express from 'express';
import cookieParser from 'cookie-parser';


function createApplication(){
  const app = express();

  //middlewares
  app.use(express.json());
  app.use(express.urlencoded({extended: true}));
  app.use(express.static('./public'));
  app.use(cookieParser())


  // routes
  
  app.get('/health', (req, res)=>{
    res.status(200).send({ok: true})
  })


  return app;
}


export default createApplication;