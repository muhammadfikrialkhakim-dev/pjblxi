import CategoryForm from "@/components/CategoryForm";

export default function NewCategoryPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-forest-900">Tambah Kategori</h1>
      <div className="mt-6 max-w-lg">
        <CategoryForm />
      </div>
    </div>
  );
}
