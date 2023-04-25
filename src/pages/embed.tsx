import React, { useState, useRef } from 'react'
import { Configuration, OpenAIApi } from 'openai'
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import BackButton from '@/components/BackButton';

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
        <div className='m-8'>
            <BackButton className="mb-4" />
            <div className='flex flex-col'>
                <label className='mb-2 font-bold'>Input</label>
                <textarea className='px-2' ref={input} />
                <button
                    className='mt-4 inline-block rounded bg-slate-600 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white shadow-[0_4px_9px_-4px_#3b71ca] transition duration-150 ease-in-out hover:bg-primary-600 hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:bg-primary-600 focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:outline-none focus:ring-0 active:bg-primary-700 active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] dark:shadow-[0_4px_9px_-4px_rgba(59,113,202,0.5)] dark:hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)]'
                    onClick={onEmbed}>
                    Submit
                </button>
                <br /><br /><br />
                {output}
            </div>
        </div>

    )
}

export default Embed