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

  const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY })
  const openAi = new OpenAIApi(configuration);
  const { id } = req.query

  switch (requestMethod) {
    case "PUT": {
      const { value } = req.body;
      try {
        const input = value.replace(/\n/g, ' ')

        const embeddingResponse = await openAi.createEmbedding({
          model: 'text-embedding-ada-002',
          input,
        })

        const updateDocument = {
          content: convert(input),
          html_string: value,
          file_type: "RICH_TEXT_EDITOR"
        }

        const updateChunks = {
          content: convert(input),
          embedding: embeddingResponse.data.data[0].embedding,
        }

        const { error: errorChunks } = await supabase
          .from('chunks')
          .update(updateChunks)
          .eq('document_id', id)
          .select();

        const { data, error } = await supabase
          .from('documents')
          .update(updateDocument)
          .eq('id', id)
          .select();

        if (data) res.status(200).json(data)
        if (error || errorChunks) res.status(500).json(error?.message || errorChunks?.message)
      } catch (error) {
        if (error instanceof Error) res.status(500).json(error.message)
      }

      return;
    }
    case "DELETE": {
      const { data, error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .select()

      if (error) res.status(500).json(error?.message)
      if (data) res.status(200).json(data)
      return;
    }
    default: res.status(200).json("Document API")
  }



}