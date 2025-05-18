/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable arrow-body-style */
import crypto from "crypto";

const cryptoToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export default cryptoToken;
