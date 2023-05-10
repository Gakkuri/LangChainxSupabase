// import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { Configuration, OpenAIApi } from 'openai';
import { convert } from 'html-to-text';
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestMethod = req.method;

  // const supabase = createClient(
  //   process.env.SUPABASE_URL ?? '',
  //   process.env.SUPABASE_ANON_KEY ?? ''
  // );

  const supabase = createServerSupabaseClient({
    req, res
  })

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session)
    return res.status(401).json({
      error: 'not_authenticated',
      description: 'The user does not have an active session or is not authenticated',
    })


  const userId = session.user.id;
  const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY })
  const openAi = new OpenAIApi(configuration);
  const { value, id } = req.body;

  switch (requestMethod) {
    case "GET": {
      return supabase
        .from('documents')
        .select()
        .then(({ data, error }) => {
          if (data) res.status(200).json(data)
          if (error) res.status(500).json(error.message)
        })
    }
    case "POST": {
      try {

        const input = value.replace(/\n/g, ' ')

        const embeddingResponse = await openAi.createEmbedding({
          model: 'text-embedding-ada-002',
          input,
        })

        const insertDocument = {
          user_id: userId,
          content: convert(input),
          html_string: value,
          file_type: "RICH_TEXT_EDITOR"
        }

        const insertChunks = {
          user_id: userId,
          content: convert(input),
          embedding: embeddingResponse.data.data[0].embedding,
        }

        const { data, error } = await supabase
          .from('documents')
          .insert(insertDocument)
          .select();

        console.log(error);

        const document_id = data?.[0].id;
        const { error: errorUpdate } = await supabase
          .from('chunks')
          .insert({ ...insertChunks, document_id, metadata: { document_id: document_id } })
          .select();

        if (data) res.status(200).json(data)
        if (error || errorUpdate) res.status(500).json(error?.message || errorUpdate?.message)
      } catch (error) {
        if (error instanceof Error) res.status(500).json(error.message)
      }

      return;
    }
    default: res.status(200).json("Document API")
  }
}