import bcrypt from "bcrypt";
import readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const hash = "test0001@students.asems.local";

rl.question("XL32KN8H: ", async (password) => {
  try {
    console.log(
      "Password match:",
      await bcrypt.compare(password, hash)
    );
  } catch (error) {
    console.error("Verification failed:", error.message);
  } finally {
    rl.close();
  }
});