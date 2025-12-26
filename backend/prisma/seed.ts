import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed das vagas...");

  const filialCosteiraId = "efe1960b-53fd-4e5a-adb4-d71b9d3f2984";
  const tipoRetropatioId = 1; // Retropatio
  const tipoInternoId = 2;    // Interno Pzt

  // ============================
  // LISTA DE VAGAS RETROPATIO 
  // ============================
  const vagasRetropatio = [
    "R NA","R001","R002","R003","R004","R005","R006","R007","R008","R009",
    "R010","R011","R012","R013","R014","R015","R016","R017","R018","R019",
    "R020","R021","R022","R023","R024","R025","R026","R027","R028","R029",
    "R030","R031","R032","R033","R034","R035","R036","R037","R038","R039",
    "R040","R041","R042","R043","R044","R045","R046","R047","R048","R049",
    "R050","R051","R052","R053","R054","R055","R056","R057","R058","R059",
    "R060","R061","R062","R063","R064","R065","R066","R067","R068","R069",
    "R070","R071","R072","R073","R074","R075","R076","R077","R078","R079",
    "R080","R081","R082","R083","R084","R085","R086","R087","R088","R089",
    "R090","R091","R092","R093","R094","R095","R096","R097","R098","R099",
    "R100","R101","R102","R103","R104","R105","R106","R107","R108","R109",
    "R110","R111","R112","R113","R114","R115","R116","R117","R118","R119",
    "R120","R121","R122","R123","R124","R125","R126","R127","R128","R129",
    "R130","R131","R132","R133","R134","R135","R136","R137","R138","R139",
    "R140","R141","R142","R143","R144","R145","R146","R147","R148","R149",
    "R150","RESERVADA"
  ];

  // ============================
  // LISTA DE VAGAS INTERNO PZT
  // ============================
  const vagasInterno = [
    "V001","V002","V003","V004","V005","V006","V007","V008","V009","V010",
    "V011","V012","V013","V014","V015","V016","V017","V018","V019","V020",
    "V021","V022","V023","V024","V025","V026","V027","V028","V029","V030",
    "V031","V032","V033","V034","V035","V036","V037","V039","V040","V041",
    "V042","V043","V044","V045","V046","V047","V048","V049","V050","V051",
    "V052","V053","V054","V055","V056","V057","V058","V059","V060","V061",
    "V062","V063","V064","V065","V066","V067","V068","V069","V070",
    "VE01","VE02","VE03","VE04","VE05","VE06","VE07",
    "VE27","VE63","VE66",
    "VE92","VE93","VE94","VE95","VE96","VE97","VE98","VE99"
  ];

  // Converte para objetos de criação
  const dadosRetropatio = vagasRetropatio.map((nome) => ({
    NomeVaga: nome,
    filialId: filialCosteiraId,
    tipoVagaId: tipoRetropatioId,
  }));

  const dadosInterno = vagasInterno.map((nome) => ({
    NomeVaga: nome,
    filialId: filialCosteiraId,
    tipoVagaId: tipoInternoId,
  }));

  // ============================
  // Enviar para o banco
  // ============================
  await prisma.vaga.createMany({
    data: [...dadosRetropatio, ...dadosInterno],
    skipDuplicates: true,
  });

  console.log("✅ SEED COMPLETO! Todas as vagas foram inseridas.");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
