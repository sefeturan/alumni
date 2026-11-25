const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const errorLogPath = path.join(logsDir, 'error.log');

/**
 * 5xx Guardian Middleware
 * Catches all unhandled server exceptions, writes detailed stack traces
 * and context to logs/error.log, and returns a safe error response with a reason.
 */
function guardian5xx(err, req, res, next) {
  const timestamp = new Date().toISOString();
  const statusCode = err.status || err.statusCode || 500;
  const method = req.method;
  const route = req.originalUrl || req.url;

  // Format error log entry
  const logEntry = `[${timestamp}] ${statusCode} ${method} ${route}\nMessage: ${err.message}\nStack: ${err.stack || 'No stack trace available'}\n${'-'.repeat(60)}\n`;

  // Append error log entry to logs/error.log
  try {
    fs.appendFileSync(errorLogPath, logEntry);
  } catch (writeErr) {
    console.error('Failed to write to logs/error.log:', writeErr);
  }

  // Log summary to terminal
  console.error(`[5xx GUARDIAN] ${timestamp} ${statusCode} ${method} ${route} - ${err.message}`);

  const isApiRequest = req.originalUrl.startsWith('/api') || 
                       (req.accepts('json') && !req.accepts('html'));

  if (isApiRequest) {
    return res.status(statusCode).json({
      success: false,
      statusCode: statusCode,
      error: 'Internal Server Error',
      reason: err.message || 'An unexpected internal server error occurred. Please try again later.',
      path: route,
      timestamp: timestamp
    });
  }

  // Web response for browser users
  res.status(statusCode).send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>500 - Sunucu Hatası</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 4rem 1rem; background: #f8fafc; color: #1e293b; }
        .card { max-width: 500px; margin: 0 auto; background: white; padding: 2.5rem; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        h1 { font-size: 2.5rem; color: #dc2626; margin-bottom: 0.5rem; }
        p { color: #64748b; margin-bottom: 1.5rem; }
        a { display: inline-block; background: #2563eb; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>500</h1>
        <h2>Sunucu Hatası Oluştu</h2>
        <p>İsteğiniz işlenirken beklenmeyen bir hata meydana geldi. Sistem yöneticileri hata kaydı (${timestamp}) üzerinden bilgilendirildi.</p>
        <a href="/">Ana Sayfaya Dön</a>
      </div>
    </body>
    </html>
  `);
}

module.exports = guardian5xx;
