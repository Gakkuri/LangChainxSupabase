import React, { useState, useRef } from 'react'
import { Configuration, OpenAIApi } from 'openai'
import { useSupabaseClient } from "@supabase/auth-helpers-react";

const Embed = () => {
    const supabase = useSupabaseClient();
    const configuration = new Configuration({ apiKey: process.env.NEXT_PUBLIC_API_KEY })
    const openAi = new OpenAIApi(configuration)

    const input = useRef("");
    const [output, setOutput] = useState("");

    const onEmbed = async () => {
        const value = input.current.value;
        console.log(value)

        try {
            const input = value.replace(/\n/g, ' ')

            const embeddingResponse = await openAi.createEmbedding({
                model: 'text-embedding-ada-002',
                input,
            })

            const insert = {
                content: value,
                embedding: embeddingResponse.data.data[0].embedding
            }

            const { error } = await supabase
                .from('documents')
                .insert(insert);

            if (error) return setOutput("Something went wrong!");
            return setOutput("Success!");
        } catch (err) {
            console.error(err);
        }

    }

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <label>Input</label>
            <textarea ref={input} />
            <button onClick={onEmbed} >Submit</button>
            <br /><br /><br />
            {output}
        </div>
    )
}

export default Embed