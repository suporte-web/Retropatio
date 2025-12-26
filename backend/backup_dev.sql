--
-- PostgreSQL database dump
--

\restrict wQGS8nqR88edIhMy8fIcnomuulkK9h3SPFaNu0DQt0rkctLo6JBQFyRVfo3IFry

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Entrada; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Entrada" (
    id integer NOT NULL,
    "filialId" text NOT NULL,
    "vagaId" integer NOT NULL,
    "placaCavalo" text NOT NULL,
    "placaCarreta" text,
    motorista text NOT NULL,
    proprietario text,
    tipo text NOT NULL,
    "tipoVeiculoCategoria" text,
    "tipoProprietario" text,
    cliente text,
    transportadora text,
    "statusCarga" text,
    doca text,
    valor double precision,
    cte text,
    nf text,
    lacre text,
    "cpfMotorista" text,
    observacoes text,
    multi boolean DEFAULT false,
    status text DEFAULT 'ativo'::text,
    "dataEntrada" timestamp(3) without time zone DEFAULT now(),
    "dataSaida" timestamp(3) without time zone,
    "veiculoId" text
);


ALTER TABLE public."Entrada" OWNER TO postgres;

--
-- Name: Entrada_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Entrada_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Entrada_id_seq" OWNER TO postgres;

--
-- Name: Entrada_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Entrada_id_seq" OWNED BY public."Entrada".id;


--
-- Name: Filial; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Filial" (
    id text NOT NULL,
    nome text NOT NULL,
    codigo text NOT NULL,
    endereco text NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Filial" OWNER TO postgres;

--
-- Name: Fornecedor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Fornecedor" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    cnpj text NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."Fornecedor" OWNER TO postgres;

--
-- Name: TipoVaga; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TipoVaga" (
    "Id" integer NOT NULL,
    "Nome" character varying(100) NOT NULL
);


ALTER TABLE public."TipoVaga" OWNER TO postgres;

--
-- Name: TipoVaga_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."TipoVaga_Id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."TipoVaga_Id_seq" OWNER TO postgres;

--
-- Name: TipoVaga_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."TipoVaga_Id_seq" OWNED BY public."TipoVaga"."Id";


--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role text NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    "filialId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    nome text
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: UserFilial; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserFilial" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "filialId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."UserFilial" OWNER TO postgres;

--
-- Name: Vaga; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Vaga" (
    id integer NOT NULL,
    "filialId" text NOT NULL,
    "tipoVagaId" integer NOT NULL,
    "NomeVaga" character varying(50) NOT NULL,
    status text DEFAULT 'livre'::text
);


ALTER TABLE public."Vaga" OWNER TO postgres;

--
-- Name: Vaga_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Vaga_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Vaga_id_seq" OWNER TO postgres;

--
-- Name: Vaga_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Vaga_id_seq" OWNED BY public."Vaga".id;


--
-- Name: Veiculo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Veiculo" (
    id text NOT NULL,
    placa text NOT NULL,
    motorista text NOT NULL,
    tipo text NOT NULL,
    status text NOT NULL,
    "filialId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "vagaId" integer
);


ALTER TABLE public."Veiculo" OWNER TO postgres;

--
-- Name: Visitante; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Visitante" (
    id integer NOT NULL,
    nome text NOT NULL,
    cpf text NOT NULL,
    empresa text,
    "tipoVisita" text NOT NULL,
    "motivoVisita" text,
    status text DEFAULT 'aguardando'::text,
    "dataEntrada" timestamp without time zone,
    "dataSaida" timestamp without time zone,
    "filialId" text NOT NULL
);


ALTER TABLE public."Visitante" OWNER TO postgres;

--
-- Name: Visitante_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Visitante_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Visitante_id_seq" OWNER TO postgres;

--
-- Name: Visitante_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Visitante_id_seq" OWNED BY public."Visitante".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: Entrada id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Entrada" ALTER COLUMN id SET DEFAULT nextval('public."Entrada_id_seq"'::regclass);


--
-- Name: TipoVaga Id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TipoVaga" ALTER COLUMN "Id" SET DEFAULT nextval('public."TipoVaga_Id_seq"'::regclass);


--
-- Name: Vaga id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Vaga" ALTER COLUMN id SET DEFAULT nextval('public."Vaga_id_seq"'::regclass);


--
-- Name: Visitante id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Visitante" ALTER COLUMN id SET DEFAULT nextval('public."Visitante_id_seq"'::regclass);


--
-- Data for Name: Entrada; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Entrada" (id, "filialId", "vagaId", "placaCavalo", "placaCarreta", motorista, proprietario, tipo, "tipoVeiculoCategoria", "tipoProprietario", cliente, transportadora, "statusCarga", doca, valor, cte, nf, lacre, "cpfMotorista", observacoes, multi, status, "dataEntrada", "dataSaida", "veiculoId") FROM stdin;
5	3fd9eb7b-84b9-4ff9-9431-889ca37b13c0	1	ABC1234	XYZ9876	João Santos	Translog	entrada	carreta	transportadora	Cliente X	Jamef	Carregado	02	250.99	123456789	987654321	556677	12345678911	Nenhuma observação	f	finalizado	2025-12-04 13:01:22.214	2025-12-04 14:37:53.562	\N
7	3fd9eb7b-84b9-4ff9-9431-889ca37b13c0	1	ABC1234	XYZ9876	João Santos	Translog	entrada	carreta	transportadora	Cliente X	Jamef	Carregado	02	250.99	123456789	987654321	556677	12345678911	Nenhuma observação	f	finalizado	2025-12-04 15:03:48.058	2025-12-04 17:14:18.603	\N
10	3fd9eb7b-84b9-4ff9-9431-889ca37b13c0	3	ABC1234	XYZ9876	João Santos	Translog	entrada	carreta	transportadora	Cliente X	Jamef	Carregado	02	250.99	123456789	987654321	556677	12345678911	Nenhuma observação	f	cancelado	2025-12-04 15:14:09.309	2025-12-04 17:33:22.686	\N
12	3fd9eb7b-84b9-4ff9-9431-889ca37b13c0	3	ABC1237	XYZ9876	Manoel silva	Translog	entrada	carreta	transportadora	Cliente X	Jamef	Carregado	02	250.99	123456789	987654321	556677	12345678911	Nenhuma observação	f	finalizado	2025-12-05 13:54:37.752	2025-12-09 13:46:26.584	\N
14	3fd9eb7b-84b9-4ff9-9431-889ca37b13c0	1	ABC1234	DEF5678	João da Silva	Translog	entrada	carreta	transportadora	Cliente XPTO	Jamef	Carregado	06	150.5	99887766	123456	778899	12345678911	Nenhuma observação	f	finalizado	2025-12-09 20:17:38.128	2025-12-15 14:44:18.418	3e58a545-7ab8-4be6-a23e-0ddf4784ed1d
13	3fd9eb7b-84b9-4ff9-9431-889ca37b13c0	1	ABC1234	DEF5678	João da Silva	Translog	entrada	carreta	transportadora	Cliente XPTO	Jamef	Carregado	06	150.5	99887766	123456	778899	12345678911	Nenhuma observação	f	finalizado	2025-12-09 18:39:18.329	2025-12-15 14:44:20.424	\N
6	3fd9eb7b-84b9-4ff9-9431-889ca37b13c0	1	ABC1234	XYZ9876	João Santos	Translog	entrada	carreta	transportadora	Cliente X	Jamef	Carregado	02	250.99	123456789	987654321	556677	12345678911	Nenhuma observação	f	finalizado	2025-12-04 14:38:03.878	2025-12-15 14:44:22.2	\N
11	3fd9eb7b-84b9-4ff9-9431-889ca37b13c0	1	ABC1234	DEF5678	João da Silva	Translog	entrada	carreta	transportadora	Cliente XPTO	Jamef	Carregado	06	150.5	99887766	123456	778899	12345678911	Nenhuma observação	f	finalizado	2025-12-04 18:38:23.056	2025-12-15 14:44:26.174	\N
\.


--
-- Data for Name: Filial; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Filial" (id, nome, codigo, endereco, ativo, "createdAt", "updatedAt") FROM stdin;
92429396-42e8-41bf-bace-68d2eb250492	Araraquara	ARARAQUARA	Av. João Baptista Mendes Feraz, 2851 - Portal das Laranjeiras	t	2025-12-03 14:48:55.682	2025-12-03 14:48:55.682
3fd9eb7b-84b9-4ff9-9431-889ca37b13c0	Costeira	COSTEIRA	R. do Colono, 2146 - Jurema, São José dos Pinhais - PR	t	2025-12-03 14:50:35.459	2025-12-03 19:23:51.072
f1f2ce2b-c329-4323-a29b-2b29af29d329	Guarulhos	GUARULHOS	Estrada Velha, 100 - Cumbica, Guarulhos - SP, 07231-010	t	2025-12-03 14:49:36.527	2025-12-05 15:10:40.096
\.


--
-- Data for Name: Fornecedor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Fornecedor" (id, nome, cnpj, ativo, "createdAt", "updatedAt") FROM stdin;
f99c8a81-82c4-4656-95c6-5c485d1a317f	Fornecedor XPTO	12.345.678/0001-99	t	2025-12-04 19:43:58.119	2025-12-04 19:43:58.119
\.


--
-- Data for Name: TipoVaga; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TipoVaga" ("Id", "Nome") FROM stdin;
1	Retropatio
2	Interno Pzt
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, username, email, password, role, ativo, "filialId", "createdAt", "updatedAt", nome) FROM stdin;
99d448e1-52d3-44dc-a128-d9548e4d5c30	caroline	carol@empresa.com	$2b$10$WaFeEypj53O746XFKOktleKzB74xZeucICekRhyvk90WJ7JM2.fVG	gestor	t	\N	2025-12-03 14:03:32.378	2025-12-03 19:03:10.967	Caroline Augusto Santos
b0e0fe39-c9cb-4570-b676-6a7180d97c42	jose.carlos	jose.carlos@pizzattolog.com	$2b$10$BODp1yP7Zx9ZyR7ST3OYAet0dhXuLi80ys9Ez3uL6NyNv.cH40hvm	porteiro	t	\N	2025-12-09 13:43:35.082	2025-12-09 17:20:50.244	José Carlos
bfef9540-dd55-48b3-9aee-6862a013ebe5	boticario.teste	boticario.pp@cliente.com	$2b$10$sQMSCWoeeqpGY8vicVd12eIsIROW852REJSB6IOXRoHwaMH3Nng3e	cliente	t	\N	2025-12-09 18:21:42.676	2025-12-09 18:21:42.676	Cliente Boticario 
\.


--
-- Data for Name: UserFilial; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserFilial" (id, "userId", "filialId", "createdAt") FROM stdin;
584bc4f4-9f5a-470a-acb1-04eb4aa52aef	99d448e1-52d3-44dc-a128-d9548e4d5c30	92429396-42e8-41bf-bace-68d2eb250492	2025-12-03 18:41:32.05
b1e601f6-0943-4e0c-a7e1-ef51a62a72bb	99d448e1-52d3-44dc-a128-d9548e4d5c30	f1f2ce2b-c329-4323-a29b-2b29af29d329	2025-12-03 19:10:08.036
499bf644-b6ea-4ab4-a535-9eead243e40b	99d448e1-52d3-44dc-a128-d9548e4d5c30	3fd9eb7b-84b9-4ff9-9431-889ca37b13c0	2025-12-03 19:10:12.208
fb3988a7-be53-4158-a89a-8d74861bacbf	b0e0fe39-c9cb-4570-b676-6a7180d97c42	92429396-42e8-41bf-bace-68d2eb250492	2025-12-09 13:43:47.539
ba35bad7-d8c7-4cda-905f-e46c3bf90742	bfef9540-dd55-48b3-9aee-6862a013ebe5	3fd9eb7b-84b9-4ff9-9431-889ca37b13c0	2025-12-09 18:22:53.962
\.


--
-- Data for Name: Vaga; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Vaga" (id, "filialId", "tipoVagaId", "NomeVaga", status) FROM stdin;
4	92429396-42e8-41bf-bace-68d2eb250492	2	A05	livre
3	3fd9eb7b-84b9-4ff9-9431-889ca37b13c0	2	R002	livre
5	f1f2ce2b-c329-4323-a29b-2b29af29d329	2	A03	livre
6	f1f2ce2b-c329-4323-a29b-2b29af29d329	2	A5	livre
1	3fd9eb7b-84b9-4ff9-9431-889ca37b13c0	1	R001	livre
\.


--
-- Data for Name: Veiculo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Veiculo" (id, placa, motorista, tipo, status, "filialId", "createdAt", "updatedAt", "vagaId") FROM stdin;
3e58a545-7ab8-4be6-a23e-0ddf4784ed1d	ABC1234	João da Silva	cavalo	ativo	3fd9eb7b-84b9-4ff9-9431-889ca37b13c0	2025-12-09 20:17:38.112	2025-12-09 20:17:38.112	1
\.


--
-- Data for Name: Visitante; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Visitante" (id, nome, cpf, empresa, "tipoVisita", "motivoVisita", status, "dataEntrada", "dataSaida", "filialId") FROM stdin;
2	Carlos Almeida	12345678900	MetalX	Coleta	Retirar Documentos	aguardando	\N	\N	3fd9eb7b-84b9-4ff9-9431-889ca37b13c0
3	Caroline Augusto 	10124123598	Deltron	visitante	Teste infra	saiu	\N	2025-12-10 11:41:16.603	92429396-42e8-41bf-bace-68d2eb250492
4	Carlos Almeida	12345678900	MetalX	Coleta	Retirar Documentos	aguardando	\N	\N	3fd9eb7b-84b9-4ff9-9431-889ca37b13c0
1	Carlos Almeida	12345678900	MetalX	Coleta	Retirar Documentos	dentro	2025-12-10 11:56:49.312	2025-12-10 11:40:38.35	3fd9eb7b-84b9-4ff9-9431-889ca37b13c0
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
186fe687-4509-4487-a5c9-6b3fecb5e1a2	46d637da7e2085cc5ef93eadb79dc93f7861d4639b5d46a3ba802c7357ea7fd8	2025-12-03 10:47:58.198659-03	20251112142802_init	\N	\N	2025-12-03 10:47:58.173494-03	1
f3d4bd7d-caa8-4b40-b4fb-91ec3e99d273	58289936561f5216ecd8f40189070f2fd41667d790ad2da1f61ec4504f82fc47	2025-12-03 10:47:58.226724-03	20251118130042_setup_vagas_final	\N	\N	2025-12-03 10:47:58.199335-03	1
b3de4901-3930-4d53-9f89-aa0eb9ab1ed9	7fc78ca69f909e258a9de918a186d1f26793a666e9843498531fa757778f20c1	2025-12-03 10:47:58.265455-03	20251118184330_add_unique_tipovaga_nome	\N	\N	2025-12-03 10:47:58.227994-03	1
\.


--
-- Name: Entrada_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Entrada_id_seq"', 17, true);


--
-- Name: TipoVaga_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."TipoVaga_Id_seq"', 2, true);


--
-- Name: Vaga_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Vaga_id_seq"', 6, true);


--
-- Name: Visitante_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Visitante_id_seq"', 4, true);


--
-- Name: Entrada Entrada_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Entrada"
    ADD CONSTRAINT "Entrada_pkey" PRIMARY KEY (id);


--
-- Name: Filial Filial_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Filial"
    ADD CONSTRAINT "Filial_pkey" PRIMARY KEY (id);


--
-- Name: Fornecedor Fornecedor_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Fornecedor"
    ADD CONSTRAINT "Fornecedor_cnpj_key" UNIQUE (cnpj);


--
-- Name: Fornecedor Fornecedor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Fornecedor"
    ADD CONSTRAINT "Fornecedor_pkey" PRIMARY KEY (id);


--
-- Name: TipoVaga TipoVaga_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TipoVaga"
    ADD CONSTRAINT "TipoVaga_pkey" PRIMARY KEY ("Id");


--
-- Name: UserFilial UserFilial_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserFilial"
    ADD CONSTRAINT "UserFilial_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Vaga Vaga_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Vaga"
    ADD CONSTRAINT "Vaga_pkey" PRIMARY KEY (id);


--
-- Name: Veiculo Veiculo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Veiculo"
    ADD CONSTRAINT "Veiculo_pkey" PRIMARY KEY (id);


--
-- Name: Visitante Visitante_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Visitante"
    ADD CONSTRAINT "Visitante_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Filial_codigo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Filial_codigo_key" ON public."Filial" USING btree (codigo);


--
-- Name: TipoVaga_Nome_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TipoVaga_Nome_key" ON public."TipoVaga" USING btree ("Nome");


--
-- Name: UserFilial_userId_filialId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserFilial_userId_filialId_key" ON public."UserFilial" USING btree ("userId", "filialId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: Veiculo_placa_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Veiculo_placa_key" ON public."Veiculo" USING btree (placa);


--
-- Name: idx_visitante_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visitante_cpf ON public."Visitante" USING btree (cpf);


--
-- Name: idx_visitante_filial; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visitante_filial ON public."Visitante" USING btree ("filialId");


--
-- Name: Entrada Entrada_filialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Entrada"
    ADD CONSTRAINT "Entrada_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES public."Filial"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Entrada Entrada_vagaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Entrada"
    ADD CONSTRAINT "Entrada_vagaId_fkey" FOREIGN KEY ("vagaId") REFERENCES public."Vaga"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Entrada Entrada_veiculoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Entrada"
    ADD CONSTRAINT "Entrada_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES public."Veiculo"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserFilial UserFilial_filialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserFilial"
    ADD CONSTRAINT "UserFilial_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES public."Filial"(id) ON DELETE CASCADE;


--
-- Name: UserFilial UserFilial_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserFilial"
    ADD CONSTRAINT "UserFilial_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;


--
-- Name: User User_filialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES public."Filial"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Vaga Vaga_filialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Vaga"
    ADD CONSTRAINT "Vaga_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES public."Filial"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Vaga Vaga_tipoVagaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Vaga"
    ADD CONSTRAINT "Vaga_tipoVagaId_fkey" FOREIGN KEY ("tipoVagaId") REFERENCES public."TipoVaga"("Id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Veiculo Veiculo_filialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Veiculo"
    ADD CONSTRAINT "Veiculo_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES public."Filial"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Veiculo Veiculo_vagaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Veiculo"
    ADD CONSTRAINT "Veiculo_vagaId_fkey" FOREIGN KEY ("vagaId") REFERENCES public."Vaga"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Visitante fk_visitante_filial; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Visitante"
    ADD CONSTRAINT fk_visitante_filial FOREIGN KEY ("filialId") REFERENCES public."Filial"(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict wQGS8nqR88edIhMy8fIcnomuulkK9h3SPFaNu0DQt0rkctLo6JBQFyRVfo3IFry

