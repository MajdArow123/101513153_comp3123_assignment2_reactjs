// Helper so every successful response has the same shape:
// { "status": true, "message": "...", "data": ... }
function sendSuccess(res, statusCode, message, data) {
  const body = { status: true, message };
  if (data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
}

module.exports = { sendSuccess };
