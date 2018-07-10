const pool = require('../config/dbPool.js');

module.exports = {
  queryParam_None : async function(...args){ 
    const query = args[0];
    let result;

    try {
      var connection = await pool.getConnection();
      result = await connection.query(query) || null; 
    }catch(err){
      next(err); 
    }finally{
      connection.release();
      return result; 
    }
  },


  queryParam_Arr : async function(...args){
    const query = args[0];
    const value = args[1]; 
    let result;

    try {
      var connection = await pool.getConnection();
      result = await connection.query(query, value) || null; 
    }catch(err){
      next(err); 
    }finally{
      connection.release();
      return result; 
    }
  }
};
