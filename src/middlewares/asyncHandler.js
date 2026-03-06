const asyncHandler = (handler) => async (req, res, next) => {
  try {
    return await handler(req, res, next);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  asyncHandler
};