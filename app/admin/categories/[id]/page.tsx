import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CategoryForm from "@/components/CategoryForm";

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: category } = await supabase.from("categories").select("*").eq("id", params.id).single();

  if (!category) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-forest-900">Edit Kategori</h1>
      <div className="mt-6 max-w-lg">
        <CategoryForm category={category} />
      </div>
    </div>
  );
}
