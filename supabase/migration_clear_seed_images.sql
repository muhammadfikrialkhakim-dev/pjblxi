-- Kosongkan gambar contoh (Unsplash) dari data seed, supaya gambar yang tampil
-- di homepage HANYA yang diunggah admin / super admin lewat panel.
update public.categories set image_url = null where image_url like '%images.unsplash.com%';
update public.wisata set cover_image_url = null where cover_image_url like '%images.unsplash.com%';
update public.wisata
set gallery_urls = array(
  select u from unnest(gallery_urls) u where u not like '%images.unsplash.com%'
)
where gallery_urls is not null;
