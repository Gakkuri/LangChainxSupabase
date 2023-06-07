// import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Configuration, OpenAIApi } from "openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { convert } from "html-to-text";
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import cheerio from "cheerio";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const requestMethod = req.method;

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

  const userId = session.user.id;
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openAi = new OpenAIApi(configuration);
  const { value, id, isUrl } = req.body;

  switch (requestMethod) {
    case "GET": {
      return supabase
        .from("documents")
        .select()
        .then(({ data, error }) => {
          if (data) res.status(200).json(data);
          if (error) res.status(500).json(error.message);
        });
    }
    case "POST": {
      try {
        const embeddings = new OpenAIEmbeddings();
        const splitter = new RecursiveCharacterTextSplitter();
        let input = "";
        let embeddingResponse;
        let docs;
        if (isUrl) {
          const response = await axios.get(value);
          const $ = cheerio.load(response.data);

          // Function to extract all text from an element and its children recursively
          function extractTextFromElement(element) {
            let text = "";

            element.contents().each((index, el) => {
              if (el.type === "text") {
                text += $(el).text().trim() + " ";
              } else if (el.type === "tag") {
                text += extractTextFromElement($(el));
              }
            });

            return text;
          }

          input = extractTextFromElement($("body"));
          docs = await splitter.createDocuments([input]);
          embeddingResponse = await embeddings.embedDocuments(
            docs.map((doc) => doc.pageContent.replace(/[\r\n]+/g, " "))
          );
        } else {
          input = value.replace(/\n/g, " ");
          docs = await splitter.createDocuments([convert(input)]);
          embeddingResponse = await embeddings.embedDocuments(
            docs.map((doc) => doc.pageContent.replace(/[\r\n]+/g, " "))
          );
        }

        let insertDocument = {};

        if (isUrl) {
          insertDocument = {
            user_id: userId,
            content: value,
            html_string: input,
            file_type: "URL",
          };
        } else {
          insertDocument = {
            user_id: userId,
            content: convert(input),
            html_string: value,
            file_type: "RICH_TEXT_EDITOR",
          };
        }

        const { data, error } = await supabase
          .from("documents")
          .insert(insertDocument)
          .select();

        const document_id = data?.[0].id;

        const { error: errorChunk } = await supabase.from("chunks").insert(
          docs
            .map((doc, i) => ({
              user_id: userId,
              content: (doc.pageContent || "").replace(/\u0000/g, ""),
              embedding: embeddingResponse[i],
              document_id,
              metadata: {
                ...doc.metadata,
                document_id,
                url: isUrl && value,
                sourceType: isUrl ? "URL" : "Text",
              },
            }))
            .filter((doc) => !!doc)
        );

        if (data) res.status(200).json(data);
        else if (error || errorChunk)
          res.status(500).json(error?.message || errorChunk?.message);
      } catch (error) {
        if (error instanceof Error) res.status(500).json(error.message);
      }

      return;
    }
    default:
      res.status(200).json("Document API");
  }
}
