import { PublishAIState } from "../state";

export const qaNode = async (state: PublishAIState) => {
  return { qa: "qa completed" };
};
