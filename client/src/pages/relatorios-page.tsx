import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown, FileText, Loader2, Search } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Veiculo } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function RelatoriosPage() {
  const filialId = localStorage.getItem("selected_filial");
  const [filters, setFilters] = useState({
    dataInicio: "",
    dataFim: "",
    cliente: "",
    transportadora: "",
    situacao: "",
  });
  const [isExporting, setIsExporting] = useState(false);

  const { data: veiculos, isLoading } = useQuery<Veiculo[]>({
    queryKey: ["/api/veiculos", filialId],
    enabled: !!filialId,
  });

  const filteredVeiculos = veiculos?.filter((v) => {
    if (filters.dataInicio && new Date(v.dataEntrada) < new Date(filters.dataInicio)) return false;
    if (filters.dataFim && new Date(v.dataEntrada) > new Date(filters.dataFim)) return false;
    if (filters.cliente && !v.cliente?.toLowerCase().includes(filters.cliente.toLowerCase())) return false;
    if (filters.transportadora && !v.transportadora?.toLowerCase().includes(filters.transportadora.toLowerCase())) return false;
    if (filters.situacao && v.situacao !== filters.situacao) return false;
    return true;
  });

  const exportToCSV = () => {
    if (!filteredVeiculos) return;
    
    setIsExporting(true);
    try {
      const headers = ["Placa Cavalo", "Placa Carreta", "Motorista", "CPF", "Transportadora", "Cliente", "Doca", "Situação", "Entrada", "Saída"];
      const rows = filteredVeiculos.map((v) => [
        v.placaCavalo,
        v.placaCarreta || "",
        v.motorista,
        v.cpfMotorista || "",
        v.transportadora || "",
        v.cliente || "",
        v.doca || "",
        v.situacao,
        format(new Date(v.dataEntrada), "dd/MM/yyyy HH:mm"),
        v.dataSaida ? format(new Date(v.dataSaida), "dd/MM/yyyy HH:mm") : "",
      ]);

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio-veiculos-${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    if (!filteredVeiculos) return;

    setIsExporting(true);
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Header
      doc.setFontSize(18);
      doc.text("Relatório de Movimentação de Veículos", 14, 15);
      
      doc.setFontSize(10);
      doc.text(`Data: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 22);
      doc.text(`Total de Registros: ${filteredVeiculos.length}`, 14, 27);

      // Table
      const headers = [
        "Placa Cavalo",
        "Placa Carreta",
        "Motorista",
        "CPF",
        "Transportadora",
        "Cliente",
        "Doca",
        "Situação",
        "Entrada",
        "Saída"
      ];

      const rows = filteredVeiculos.map((v) => [
        v.placaCavalo,
        v.placaCarreta || "-",
        v.motorista,
        v.cpfMotorista || "-",
        v.transportadora || "-",
        v.cliente || "-",
        v.doca || "-",
        v.situacao,
        format(new Date(v.dataEntrada), "dd/MM/yyyy HH:mm"),
        v.dataSaida ? format(new Date(v.dataSaida), "dd/MM/yyyy HH:mm") : "-",
      ]);

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 32,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [59, 130, 246], // Primary blue color
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 32 },
      });

      doc.save(`relatorio-veiculos-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground">Consulte e exporte relatórios de movimentação</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refine sua busca</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                data-testid="input-data-inicio"
                value={filters.dataInicio}
                onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                data-testid="input-data-fim"
                value={filters.dataFim}
                onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="situacao">Situação</Label>
              <Select
                value={filters.situacao}
                onValueChange={(value) => setFilters({ ...filters, situacao: value })}
              >
                <SelectTrigger id="situacao" data-testid="select-situacao">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="aguardando">Aguardando</SelectItem>
                  <SelectItem value="docado">Docado</SelectItem>
                  <SelectItem value="carregando">Carregando</SelectItem>
                  <SelectItem value="descarregando">Descarregando</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Input
                id="cliente"
                placeholder="Filtrar por cliente"
                data-testid="input-cliente-filter"
                value={filters.cliente}
                onChange={(e) => setFilters({ ...filters, cliente: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transportadora">Transportadora</Label>
              <Input
                id="transportadora"
                placeholder="Filtrar por transportadora"
                data-testid="input-transportadora-filter"
                value={filters.transportadora}
                onChange={(e) => setFilters({ ...filters, transportadora: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setFilters({
                  dataInicio: "",
                  dataFim: "",
                  cliente: "",
                  transportadora: "",
                  situacao: "",
                })}
                data-testid="button-limpar-filtros"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Resultados</CardTitle>
              <CardDescription>{filteredVeiculos?.length || 0} registros encontrados</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={exportToCSV}
                disabled={!filteredVeiculos || filteredVeiculos.length === 0 || isExporting}
                data-testid="button-export-csv"
                variant="outline"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportar CSV
                  </>
                )}
              </Button>
              <Button
                onClick={exportToPDF}
                disabled={!filteredVeiculos || filteredVeiculos.length === 0 || isExporting}
                data-testid="button-export-pdf"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredVeiculos && filteredVeiculos.length > 0 ? (
            <div className="space-y-2">
              {filteredVeiculos.map((veiculo) => (
                <div
                  key={veiculo.id}
                  className="p-4 border rounded-lg hover-elevate"
                  data-testid={`relatorio-veiculo-${veiculo.placaCavalo}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{veiculo.placaCavalo}</span>
                        {veiculo.placaCarreta && (
                          <span className="text-sm text-muted-foreground">+ {veiculo.placaCarreta}</span>
                        )}
                        <StatusBadge status={veiculo.situacao} type="veiculo" />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Motorista: {veiculo.motorista}
                      </div>
                      {veiculo.transportadora && (
                        <div className="text-sm text-muted-foreground">
                          Transportadora: {veiculo.transportadora}
                        </div>
                      )}
                      {veiculo.cliente && (
                        <div className="text-sm text-muted-foreground">
                          Cliente: {veiculo.cliente}
                        </div>
                      )}
                      {veiculo.doca && (
                        <div className="text-sm text-muted-foreground">
                          Doca: {veiculo.doca}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>Entrada: {format(new Date(veiculo.dataEntrada), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
                      {veiculo.dataSaida && (
                        <div>Saída: {format(new Date(veiculo.dataSaida), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhum resultado encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
