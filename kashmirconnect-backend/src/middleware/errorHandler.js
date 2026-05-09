export function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  if (res.headersSent) {
    return next(err);
  }

  const status = err.statusCode || err.status || 500;

  if (err?.name === "ZodError") {
    return res.status(400).json({ error: "Validation failed", details: err.flatten?.() || err.errors });
  }

  return res.status(status).json({
    error: err.message || "Internal server error",
    ...(isDev ? { stack: err.stack } : {}),
  });
}
