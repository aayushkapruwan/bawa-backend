const asyncHandler = (requestHandler) => {
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((error)=>next(error))
    }
};
export { asyncHandler };

/*const asyncHandler = ()=>{}
const asyncHandler = (fun)=>{()=>{}}
const asyncHandler = (fun)=>()=>{}
const asyncHandler = (fun)=>async()=>{}*/

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
