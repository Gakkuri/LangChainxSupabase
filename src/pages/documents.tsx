import React, { useEffect, useState, useCallback } from 'react';
import dynamic from "next/dynamic";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from 'next/router';
import { convert } from 'html-to-text';
import { Configuration, OpenAIApi } from 'openai'

import BackButton from '@/components/BackButton';
import Loader from '@/components/Loader';

import 'react-quill/dist/quill.snow.css';
import 'quill-mention/dist/quill.mention.css';

const QuillMention = dynamic(import('quill-mention'), { ssr: false });
const ReactQuill = dynamic(import('react-quill'), { ssr: false });

type Documents = {
	id: number
	content: string
	metadata?: { id: number }
	embedding: [number]
	htmlString: string
}

const atValues = [
	{ id: 1, value: "At Value 1" },
	{ id: 2, value: "At Value 2" },
];
const hashValues = [
	{ id: 3, value: "Hash Value 1" },
	{ id: 4, value: "Hash Value 2" },
	{ id: 5, value: "Story" },
];

const Documents = () => {
	const router = useRouter();
	const supabase = useSupabaseClient();
	const configuration = new Configuration({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY })
	const openAi = new OpenAIApi(configuration)

	const [loading, setLoading] = useState(false);
	const [documents, setDocuments] = useState<Array<Documents>>([]);
	const [selectedDocument, setSelectedDocument] = useState<Documents>();
	const [value, setValue] = useState("");
	const [confirmDelete, setConfirmDelete] = useState(false);

	useEffect(() => {
		supabase
			.from('documents')
			.select()
			.then(({ data, error }) => {
				setDocuments(data?.map((d) => ({ ...d, htmlString: d.html_string })));
			})
	}, [])

	useEffect(() => {
		if (router.query.id && documents.length > 0) {
			const foundDoc = documents.find((d) => d.id === parseInt(router.query.id));
			if (foundDoc) {
				setSelectedDocument(foundDoc);
				setValue(foundDoc.htmlString);
			}
		}
	}, [router.query, documents])

	useEffect(() => {
		window.addEventListener('mention-hovered', (event) => { console.log('hovered: ', event) }, false);
		window.addEventListener('mention-clicked', (event) => { console.log('clicked: ', event) }, false);
		return () => {
			window.removeEventListener('mention-hovered', (event) => { console.log('hovered: ', event) });
			window.removeEventListener('mention-clicked', (event) => { console.log('clicked: ', event) });
		}
	}, [])


	const goToDocument = (id: number | null) => {
		if (!id) {
			setSelectedDocument(undefined);
			setValue("");
			return;
		}
		const document = documents.find(d => id === d.id);
		if (document) {
			setSelectedDocument(document);
			setValue(document.htmlString);
		}
	}

	const onDeleteDocument = async () => {
		if (confirmDelete && selectedDocument) {
			setLoading(true);
			const { data, error } = await supabase
				.from('documents')
				.delete()
				.eq('id', selectedDocument.id)
				.select()

			setConfirmDelete(false);
			setSelectedDocument(undefined);
			setValue("");

			if (data) {
				const newDocuments = [...documents];
				newDocuments.splice(newDocuments.findIndex(d => d.id === data[0].id), 1)
				setDocuments(newDocuments);
			}

			if (error) {
				console.error("Something went wrong!", error);
				setLoading(false);
				return;
			}
			setLoading(false);
			return console.log("Success!");
		}
		return setConfirmDelete(true);
	}

	const onAddDocument = async () => {
		setLoading(true);
		try {
			const input = value.replace(/\n/g, ' ')

			const embeddingResponse = await openAi.createEmbedding({
				model: 'text-embedding-ada-002',
				input,
			})

			if (selectedDocument) {
				const updates = {
					content: convert(input),
					embedding: embeddingResponse.data.data[0].embedding,
					html_string: value
				}

				const { data, error } = await supabase
					.from('documents')
					.update(updates)
					.eq('id', selectedDocument.id)
					.select();

				if (data) {
					const newDocuments = [...documents];
					newDocuments.splice(newDocuments.findIndex(d => d.id === data[0].id), 1, data[0])
					setDocuments(newDocuments);

					setValue("");
					setSelectedDocument(undefined);
				}

				if (error) {
					console.error("Something went wrong!", error);
					setLoading(false);
					return;
				}
			} else {
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

				if (data) {
					setDocuments([...documents, data[0]]);
					setValue("");
				}

				if (error) {
					console.error("Something went wrong!", error);
					setLoading(false);
					return;
				}
			}

			setLoading(false);
			return console.log("Success!");

		} catch (err) {
			console.error(err);
		}
	}

	const mentionModule = {
		allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
		mentionDenotationChars: ['@', '#'],
		source: useCallback(
			(
				searchTerm: string,
				renderItem: (
					arg0: { id: number; value: string }[] | undefined,
					arg1: any
				) => void,
				mentionChar: string
			) => {
				let values;

				if (mentionChar === '@') {
					values = atValues;
				} else if (mentionChar === '#') {
					values = hashValues;
				}

				if (searchTerm.length === 0) {
					renderItem(values, searchTerm);
				} else if (values) {
					const matches = [];
					for (let i = 0; i < values.length; i += 1)
						if (
							values[i].value.toLowerCase().indexOf(searchTerm.toLowerCase())
						)
							matches.push(values[i]);
					renderItem(matches, searchTerm);
				}
			},
			[]
		),
	}

	return (
		<div className="m-8">
			<div className="flex justify-between mb-4">
				<BackButton />
				{/* <button
					type="button"
					className="inline-block rounded bg-slate-600 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white shadow-[0_4px_9px_-4px_#3b71ca] transition duration-150 ease-in-out hover:bg-primary-600 hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:bg-primary-600 focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:outline-none focus:ring-0 active:bg-primary-700 active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] dark:shadow-[0_4px_9px_-4px_rgba(59,113,202,0.5)] dark:hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)]"
					onClick={() => router.push("/embed")}>
					Create Document
				</button> */}
			</div>

			<div className="flex flex-1 items-stretch">
				<div className='w-300 border-r-2 border-slate-400 p-4'>
					<h1 className="text-lg font-bold mb-3"> Document List</h1>
					<ul>
						<li className={`border-l-2 pl-2 py-1 hover:border-cyan-300 hover:text-cyan-300 ${!selectedDocument?.id && "border-cyan-500 text-cyan-500"}`}>
							<a onClick={() => goToDocument(null)} className="whitespace-nowrap cursor-pointer">
								{`+ Create New Document`}
							</a>
						</li>
						{
							documents.map((d) =>
								<li key={d.id} className={`border-l-2 pl-2 py-1 hover:border-cyan-300 hover:text-cyan-300 ${selectedDocument?.id === d.id && "border-cyan-500 text-cyan-500"}`}>
									<a onClick={() => goToDocument(d.id)} className="whitespace-nowrap cursor-pointer">
										<label className='mr-2'>{`${d.id} ~`}</label>
										{d.content.length > 20 ? `${d.content.substring(0, 20)}...` : d.content}
									</a>
								</li>
							)
						}
					</ul>
				</div>
				<div className='p-4 w-full'>
					<ReactQuill
						bounds=".quill"
						theme="snow"
						value={value}
						onChange={setValue}
						modules={{
							mention: mentionModule
						}}
					/>
					<div>
						{
							selectedDocument &&
							(
								confirmDelete ?
									<div className='float-left block'>
										<span className='text-red-600'> Are you sure you want to delete? </span>
										<button className={`mt-2 block rounded bg-red-500 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white shadow-[0_4px_9px_-4px_#3b71ca] transition duration-150 ease-in-out hover:bg-primary-600 hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:bg-primary-600 focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:outline-none focus:ring-0 active:bg-primary-700 active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] dark:shadow-[0_4px_9px_-4px_rgba(59,113,202,0.5)] dark:hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] ${loading && "cursor-not-allowed"}`}
											onClick={onDeleteDocument}>
											<span className='flex items-center'>
												{
													loading ? <><Loader className="mr-2" /> Processing...</> : "Confirm Delete"
												}
											</span>
										</button>
									</div>
									:
									<button className="mt-2 float-left inline-block rounded bg-red-500 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white shadow-[0_4px_9px_-4px_#3b71ca] transition duration-150 ease-in-out hover:bg-primary-600 hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:bg-primary-600 focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:outline-none focus:ring-0 active:bg-primary-700 active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] dark:shadow-[0_4px_9px_-4px_rgba(59,113,202,0.5)] dark:hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)]"
										onClick={onDeleteDocument}>
										Delete
									</button>
							)
						}

						<button className={`mt-2 float-right inline-block rounded bg-slate-600 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white shadow-[0_4px_9px_-4px_#3b71ca] transition duration-150 ease-in-out hover:bg-primary-600 hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:bg-primary-600 focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:outline-none focus:ring-0 active:bg-primary-700 active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] dark:shadow-[0_4px_9px_-4px_rgba(59,113,202,0.5)] dark:hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] ${loading && "cursor-not-allowed"}`}
							disabled={loading}
							onClick={onAddDocument}>
							<span className='flex items-center'>
								{
									loading ? <><Loader className="mr-2" /> Processing...</> : "Submit"
								}
							</span>

						</button>
					</div>

				</div>
			</div>

		</div >
	)
}

export default Documents