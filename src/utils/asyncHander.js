
const asyncHandler = (requestHnadler) => {
   return (req,res,next) => {
        Promise.resolve(requestHnadler(req,res,next))
        .catch((err) => next(err));
    }
 };

export {asyncHandler}



// const asyncHandler = (fn) => async(req,res,next) => {
//     try{
//         await fn(req,res,next);

//     }catch(err){
//         res.status(err.code || 500).json({"success":failed, "message":err.message});
//     }
// };
