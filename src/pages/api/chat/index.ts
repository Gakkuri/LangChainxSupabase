// import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";

import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { SupabaseHybridSearch } from "langchain/retrievers/supabase";
import { OpenAI } from "langchain/llms/openai";
import { ConversationalRetrievalQAChain } from "langchain/chains";

import { CallbackManager } from "langchain/callbacks";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createServerSupabaseClient({
    req,
    res,
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session)
    return res.status(401).json({
      error: "not_authenticated",
      description:
        "The user does not have an active session or is not authenticated",
    });

  try {
    const { input } = req.body;
    const formattedInput = input.replace(/\n/g, " ");
    const embeddings = new OpenAIEmbeddings();

    const retriever = new SupabaseHybridSearch(embeddings, {
      client: supabase,
      similarityK: 2,
      keywordK: 2,
      tableName: "chunks",
      similarityQueryName: "match_documents",
      keywordQueryName: "kw_match_documents",
    });

    /* Initialize the LLM to use to answer the question */
    const model = new OpenAI({
      modelName: "gpt-3.5-turbo",
    });

    /* Create the chain */
    const chain = ConversationalRetrievalQAChain.fromLLM(model, retriever, {
      returnSourceDocuments: true,
    });

    /* Ask it a question */
    const question = formattedInput;
    console.log("TEST Question", question);
    const data = await chain.call({ question, chat_history: [] });
    console.log("TEST Data", data);
    if (data) res.status(200).json(data);
  } catch (error) {
    if (error instanceof Error) {
      res.status(error?.response?.status || 500).json(error.message);
    }
  }
}
