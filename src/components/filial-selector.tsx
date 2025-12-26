import { useFilial } from "@/contexts/FilialContext";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export function FilialSelector() {
  const { filialId, setFilialId, filiaisPermitidas } = useFilial();

  if (!filiaisPermitidas) {
    return <p>Carregando filiais...</p>;
  }

  if (filiaisPermitidas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma filial encontrada para seu usuário
      </p>
    );
  }

  return (
    <Select value={filialId ?? ""} onValueChange={setFilialId}>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="Selecionar Filial" />
      </SelectTrigger>

      <SelectContent>
        {filiaisPermitidas.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            {f.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
