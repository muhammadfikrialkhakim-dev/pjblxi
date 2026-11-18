import { Category } from "@/lib/types";
import { saveCategory } from "@/app/admin/categories/actions";
import ImageUploadField from "@/components/ImageUploadField";

export default function CategoryForm({ category }: { category?: Category }) {
  return (
    <form action={saveCategory} className="card space-y-5 p-6">
      {category && <input type="hidden" name="id" value={category.id} />}

      <div>
        <label className="label-field">Nama Kategori</label>
        <input name="name" required defaultValue={category?.name} className="input-field" placeholder="mis. Alam, Budaya, Kuliner" />
      </div>

      <ImageUploadField name="image_url" label="Gambar Kategori" defaultValue={category?.image_url} />

      <button type="submit" className="btn-primary">
        Simpan Kategori
      </button>
    </form>
  );
}
