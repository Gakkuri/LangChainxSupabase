// import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Configuration, OpenAIApi } from "openai";
import { convert } from "html-to-text";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const requestMethod = req.method;

  // const supabase = createClient(
  //   process.env.SUPABASE_URL ?? '',
  //   process.env.SUPABASE_ANON_KEY ?? ''
  // );

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

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openAi = new OpenAIApi(configuration);
  const userId = session.user.id;
  const { id } = req.query;

  switch (requestMethod) {
    case "PUT": {
      const { value } = req.body;
      try {
        const embeddings = new OpenAIEmbeddings();
        const splitter = new RecursiveCharacterTextSplitter();

        const input = value.replace(/\n/g, " ");
        const docs = await splitter.createDocuments([convert(input)]);
        const embeddingResponse = await embeddings.embedDocuments(
          docs.map((doc) => doc.pageContent.replace(/[\r\n]+/g, " "))
        );

        const updateDocument = {
          content: convert(input),
          html_string: value,
          file_type: "RICH_TEXT_EDITOR",
        };

        //Remove Existing Chunks
        const { error: errorDelete } = await supabase
          .from("chunks")
          .delete()
          .eq("document_id", id)
          .select();

        //Add new splitted chunks
        const { error: errorChunks } = await supabase.from("chunks").insert(
          docs
            .map((doc, i) => ({
              user_id: userId,
              content: (doc.pageContent || "").replace(/\u0000/g, ""),
              embedding: embeddingResponse[i],
              document_id: id,
              metadata: {
                ...doc.metadata,
                document_id: id,
              },
            }))
            .filter((doc) => !!doc)
        );

        const { data, error } = await supabase
          .from("documents")
          .update(updateDocument)
          .eq("id", id)
          .select();

        if (data) res.status(200).json(data);
        else if (error || errorChunks || errorDelete)
          res
            .status(500)
            .json(
              error?.message || errorChunks?.message || errorDelete?.message
            );
      } catch (error) {
        if (error instanceof Error) res.status(500).json(error.message);
      }

      return;
    }
    case "DELETE": {
      const { data, error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id)
        .select();

      if (error) res.status(500).json(error?.message);
      if (data) res.status(200).json(data);
      return;
    }
    default:
      res.status(200).json("Document API");
  }
}
