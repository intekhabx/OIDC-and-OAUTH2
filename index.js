import 'dotenv/config';
import createApplication from './src/app.js';
import dbConnection from './src/common/config/db.config.js';


const PORT = process.env.PORT || 3000;
const app = createApplication();

(async function () {
  await dbConnection();
})();


app.listen(PORT, ()=>{
  console.log(`Server is listening on http://localhost:${PORT}`);
})

