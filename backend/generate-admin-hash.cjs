const bcrypt = require("bcrypt");

(async () => {
  const password = process.env.ADMIN_RESET_PASSWORD;

  if (!password || password.length < 12) {
    throw new Error("Password must contain at least 12 characters.");
  }

  console.log("BCRYPT_HASH=" + await bcrypt.hash(password, 12));
})().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
