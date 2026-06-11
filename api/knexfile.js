export default {
  client: 'pg',
  connection: {
    host:     process.env.DB_HOST || 'localhost',
    port:     process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'buvette',
    user:     process.env.DB_USER || 'buvette',
    password: process.env.DB_PASS || 'buvette',
  },
  migrations: {
    directory: './migrations',
    extension: 'js',
  },
  seeds: {
    directory: './seeds',
    extension: 'js',
  },
}
