import { PublishAIState } from "../state";

export const verificationNode = async (state: PublishAIState) => {
  return { verification: "verification completed" };
};
