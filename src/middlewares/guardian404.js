/**
 * 404 Guardian Middleware
 * Catches all unhandled routes and returns a descriptive 404 error with a reason.
 * 
 * - API requests (/api/* or clients expecting JSON) receive a JSON error payload with a clear reason.
 * - Browser requests (HTML clients) are redirected to the generic 404 page (/404).
 */
function guardian404(req, res, next) {
  // If the path is already /404, prevent infinite redirection loop
  if (req.path === '/404') {
    return next();
  }

  const isApiRequest = req.originalUrl.startsWith('/api') || 
                       (req.accepts('json') && !req.accepts('html'));

  if (isApiRequest) {
    return res.status(404).json({
      success: false,
      statusCode: 404,
      error: 'Not Found',
      reason: `The requested endpoint '${req.method} ${req.originalUrl}' was not found on this server. Please verify the route path and HTTP method.`,
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  // For web page requests, redirect to generic 404 page
  return res.redirect('/404');
}

module.exports = guardian404;
