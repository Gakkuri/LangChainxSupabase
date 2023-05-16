-- Enable the pgvector extension to work with embedding vectors
create extension vector;

-- Create a table to store your users
create table users (
  id uuid not null references auth.users on delete cascade,
  name text,
  email text,
  primary key (id)
);

-- Create a table to store your documents
create table documents (
  id bigserial primary key,
  user_id uuid not null references users on delete cascade, -- foreign key that reference user table
  html_string text,
  content text,
  file_type text,
  file_path text
);

-- Create a table to store your chunks
create table chunks (
  id bigserial primary key,
  document_id bigserial not null references documents on delete cascade, -- foreign key that reference documents table
  content text,  -- corresponds to Document.pageContent
  metadata jsonb,  -- corresponds to Document.metadata
  embedding vector(1536)  -- 1536 works for OpenAI embeddings, change if needed
);

-- Altering table to enable RLS
alter table users enable row level security;
alter table documents enable row level security;
alter table chunks enable row level security;


-- Creating policies for documents
create policy "Documents are viewable by users who created them."
on documents for select
using ( auth.uid() = user_id );

create policy "Users can only insert their own documents"
on documents for insert
with check ( auth.uid() = user_id );

create policy "Users can only update their own documents"
on documents for update
using ( auth.uid() = user_id );

create policy "Users can only delete their own documents"
on documents for delete
using ( auth.uid() = user_id );

-- Creating policies for chunks
create policy "Chunks are viewable by users who created them."
on chunks for select
using ( auth.uid() = user_id );

create policy "Users can only insert their own chunks"
on chunks for insert
with check ( auth.uid() = user_id );

create policy "Users can only update their own chunks"
on chunks for update
using ( auth.uid() = user_id );

create policy "Users can only delete their own chunks"
on chunks for delete
using ( auth.uid() = user_id );

-- Create a function to search for documents
create function match_documents(query_embedding vector(1536), match_count int)
returns table(id bigint, content text, metadata jsonb, similarity float)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from chunks
  order by chunks.embedding <=> query_embedding
  limit match_count;
end;
$$
;

-- Create a function to keyword search for documents
create function kw_match_documents(query_text text, match_count int)
returns table (id bigint, content text, metadata jsonb, similarity real)
as $$

begin
return query execute
format('select id, content, metadata, ts_rank(to_tsvector(content), plainto_tsquery($1)) as similarity
from chunks
where to_tsvector(content) @@ plainto_tsquery($1)
order by similarity desc
limit $2')
using query_text, match_count;
end;
$$ language plpgsql;

-- Create a trigger function that automatically populate user db
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into users (id, name, email)
  values (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'email');
  return new;
end;
$$;

-- trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Use Postgres to create a bucket.
insert into storage.buckets
  (id, name)
values
  ('pdf_documents', 'pdf_documents');

-- CREATE POLICY "Allow All 137q3l7_0" ON storage.objects FOR SELECT USING (bucket_id = 'pdf_documents' AND auth.uid);
-- CREATE POLICY "Allow All 137q3l7_1" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pdf_documents');
-- CREATE POLICY "Allow All 137q3l7_2" ON storage.objects FOR UPDATE USING (bucket_id = 'pdf_documents');
-- CREATE POLICY "Allow All 137q3l7_3" ON storage.objects FOR DELETE USING (bucket_id = 'pdf_documents');

CREATE POLICY "Give access to authenticated users 137q3l7_0" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'pdf_documents');
CREATE POLICY "Give access to authenticated users 137q3l7_1" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pdf_documents');
CREATE POLICY "Give access to authenticated users 137q3l7_2" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'pdf_documents');
CREATE POLICY "Give access to authenticated users 137q3l7_3" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'pdf_documents');