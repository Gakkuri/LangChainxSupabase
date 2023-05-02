import { createClient } from "@supabase/supabase-js";
import { Configuration, OpenAIApi } from 'openai';
import { convert } from 'html-to-text';

export default async function handler(req, res) {
  const requestMethod = req.method;

  const supabase = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_ANON_KEY ?? ''
  );

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
          if (error) res.status(error?.code || 500).json(error.message)
        })
    }
    case "POST": {
      try {
        const input = value.replace(/\n/g, ' ')

        const embeddingResponse = await openAi.createEmbedding({
          model: 'text-embedding-ada-002',
          input,
        })

        const id = Math.floor(Date.now() / 1000);

        const insert = {
          id,
          metadata: { id },
          content: convert(input),
          embedding: embeddingResponse.data.data[0].embedding,
          html_string: value
        }

        const { data, error } = await supabase
          .from('documents')
          .insert(insert)
          .select();

        if (data) res.status(200).json(data)
        if (error) res.status(error?.code || 500).json(error.message)
      } catch (error) {
        res.status(error?.code || 500).json(error.message)
      }

      return;
    }
    default: res.status(200).json("Document API")
  }
}