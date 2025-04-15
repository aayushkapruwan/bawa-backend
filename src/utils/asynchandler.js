export const asyncHandler = (requestHandlerFun) => {
    return (req,res,next)=>{
        Promise.resolve(requestHandlerFun(req,res,next)).catch((error)=>next(error))
    }
};




// const asyncHandler = (fun) => async (error, req, res, next) => {
//   try {
//     fun(error, req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
