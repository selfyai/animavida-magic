-- Create storage bucket for uploaded images
insert into storage.buckets (id, name, public)
values ('video-images', 'video-images', true);

-- RLS policies for video-images bucket
create policy "Anyone can upload images"
on storage.objects for insert
with check (bucket_id = 'video-images');

create policy "Images are publicly accessible"
on storage.objects for select
using (bucket_id = 'video-images');