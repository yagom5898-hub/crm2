export default async function handler(req, res) {
  const hasUrl = !!process.env.LIBSQL_URL
  const hasToken = !!process.env.LIBSQL_AUTH_TOKEN
  res.status(200).json({ ok: true, env: { LIBSQL_URL: hasUrl, LIBSQL_AUTH_TOKEN: hasToken } })
}
