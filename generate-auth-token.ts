import jwt from "jsonwebtoken";
const token = jwt.sign({ sub: "12345", customerId: "1c222d5c-2f11-4684-96fb-5447abe186a3" }, "most-secret-token", { expiresIn: "1h" });
console.log(token);