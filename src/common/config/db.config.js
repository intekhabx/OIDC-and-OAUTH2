import mongoose from 'mongoose';


async function dbConnection() {
  try {
    const connection = await mongoose.connect(process.env.DATABASE_URI);
    console.log(`DB CONNECTED - ${connection.connection.host}`);
  } 
  catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}


export default dbConnection;