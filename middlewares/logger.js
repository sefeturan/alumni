/**
 * Logger Middleware
 * Logs incoming HTTP requests and response metrics to the terminal.
 * Output format: [raw time] [method] [route] [status] [res type] [duration]
 * Example: [2026-11-21T17:15:30.123Z] GET /api/users 200 application/json; charset=utf-8 12.35ms
 */
function logger(req, res, next) {
  const startTime = process.hrtime();
  const rawTime = new Date().toISOString();
  const method = req.method;
  const route = req.originalUrl || req.url;

  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const durationMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);
    const resType = res.get('Content-Type') || '-';
    const statusCode = res.statusCode;

    // Terminal log line: raw time | method | route | status | res type | duration
    console.log(`[${rawTime}] ${method} ${route} ${statusCode} ${resType} ${durationMs}ms`);
  });

  next();
}

module.exports = logger;
