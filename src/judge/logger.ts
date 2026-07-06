// Simple logger with fallback if pino is unavailable
let logger: any;
try {
  // Dynamically require pino to avoid build-time errors if missing
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pino = require('pino');
  logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
  });
} catch (e) {
  // Fallback to console based logger
  const level = process.env.LOG_LEVEL || 'info';
  const noop = () => {};
  const methods = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  const consoleLogger: any = {};
  for (const m of methods) {
    if (methods.indexOf(m) >= methods.indexOf(level)) {
      // @ts-ignore
      consoleLogger[m] = console[m]?.bind(console) ?? noop;
    } else {
      consoleLogger[m] = noop;
    }
  }
  logger = consoleLogger;
}
export default logger;
