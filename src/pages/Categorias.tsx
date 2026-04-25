import { useState } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import { useCategories } from "@/hooks/useStorage";
import { storage, uid } from "@/lib/storage";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Categorias() {
  const cats = useCategories();
  const [name, setName] = useState("");

  const add = () => {
    if (!name.trim()) return;
    storage.setCategories([
      { id: uid(), name: name.trim(), createdAt: new Date().toISOString() },
      ...storage.getCategories(),
    ]);
    setName("");
    toast.success("Categoria adicionada");
  };

  const remove = (id: string) => {
    storage.setCategories(storage.getCategories().filter((c) => c.id !== id));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader title="Categorias" description="Organize seus produtos." />

      <Card className="p-4 mb-4 shadow-elegant-sm">
        <div className="flex gap-2">
          <Input
            placeholder="Nome da categoria"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Button onClick={add} className="gap-1">
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>
      </Card>

      {cats.length === 0 ? (
        <Card className="shadow-elegant-sm">
          <EmptyState icon={Tag} title="Nenhuma categoria" />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2">
          {cats.map((c) => (
            <Card key={c.id} className="p-3 flex items-center justify-between shadow-elegant-sm">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <span className="font-medium">{c.name}</span>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(c.id)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}