-- ==============================================================================
-- KAIROS // IRON & MIND - SCHEMA SUPABASE (POSTGRESQL)
-- 100% EM PORTUGUÊS COM RELACIONAMENTOS, RLS E TRIGGERS DE SEGURANÇA
-- ==============================================================================

-- 1. Extensão para geração de chaves primárias UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Função reutilizável para atualizar o campo 'atualizado_em' automaticamente
CREATE OR REPLACE FUNCTION public.atualizar_timestamp_modificacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- TABELA 1: perfis (1:1 com auth.users do Supabase)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL DEFAULT 'Kallani',
    idade INTEGER DEFAULT 29,
    genero TEXT CHECK (genero IN ('masculino', 'feminino')) DEFAULT 'masculino',
    altura NUMERIC(5,2) DEFAULT 180, -- cm
    peso_atual NUMERIC(5,2) DEFAULT 81.2, -- kg
    peso_alvo NUMERIC(5,2) DEFAULT 77.0, -- kg
    nivel_atividade TEXT CHECK (nivel_atividade IN ('sedentario', 'leve', 'moderado', 'intenso', 'muito_intenso')) DEFAULT 'intenso',
    tipo_objetivo TEXT CHECK (tipo_objetivo IN ('cut', 'maintain', 'bulk')) DEFAULT 'cut',
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER trigger_perfis_atualizado_em
    BEFORE UPDATE ON public.perfis
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_modificacao();

-- Trigger para criar o perfil automaticamente quando um usuário se cadastra no Supabase Auth
CREATE OR REPLACE FUNCTION public.criar_perfil_novo_usuario()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfis (id, nome)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'Kallani')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.criar_perfil_novo_usuario();

-- ==============================================================================
-- TABELA 2: historico_pesagens (N:1 com perfis)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.historico_pesagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    peso NUMERIC(5,2) NOT NULL,
    tmb NUMERIC(7,2), -- Taxa Metabólica Basal calculada
    observacao TEXT,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pesagens_usuario_data ON public.historico_pesagens(usuario_id, data DESC);

-- ==============================================================================
-- TABELA 3: metas (Corpo, Mente e Alma)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.metas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    pilar TEXT CHECK (pilar IN ('corpo', 'mente', 'alma')) NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    valor_atual NUMERIC(10,2) DEFAULT 0,
    valor_alvo NUMERIC(10,2) NOT NULL,
    unidade TEXT NOT NULL, -- 'kg', 'dias', 'páginas', etc.
    data_limite DATE,
    prioridade TEXT CHECK (prioridade IN ('alta', 'media', 'baixa')) DEFAULT 'media',
    concluido BOOLEAN DEFAULT false,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_metas_usuario_pilar ON public.metas(usuario_id, pilar);

-- ==============================================================================
-- TABELA 4: habitos (Cadastrados na rotina diária)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.habitos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    pilar TEXT CHECK (pilar IN ('corpo', 'mente', 'alma')) NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    meta_semanal INTEGER DEFAULT 7,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_habitos_usuario ON public.habitos(usuario_id);

-- ==============================================================================
-- TABELA 5: registros_diarios (Checklist diário de hábitos, álcool e dieta)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.registros_diarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    habitos_concluidos JSONB DEFAULT '{}'::jsonb, -- { "uuid-habito": true }
    consumiu_alcool BOOLEAN,
    furou_dieta BOOLEAN,
    notas_alcool TEXT,
    notas_dieta TEXT,
    notas_diario TEXT,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unico_registro_diario_por_usuario UNIQUE (usuario_id, data)
);
CREATE INDEX IF NOT EXISTS idx_registros_diarios_usuario_data ON public.registros_diarios(usuario_id, data DESC);

CREATE TRIGGER trigger_registros_diarios_atualizado_em
    BEFORE UPDATE ON public.registros_diarios
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_modificacao();

-- ==============================================================================
-- TABELA 6: praticas_mente_alma (Catálogo de rituais, leituras e orações)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.praticas_mente_alma (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    pilar TEXT CHECK (pilar IN ('mente', 'alma')) NOT NULL,
    titulo TEXT NOT NULL,
    categoria TEXT NOT NULL, -- 'Leitura', 'Oração & Fé', 'Meditação', etc.
    duracao_planejada_minutos INTEGER DEFAULT 15,
    periodo TEXT CHECK (periodo IN ('manha', 'tarde', 'noite', 'qualquer_momento')) DEFAULT 'manha',
    descricao TEXT,
    meta_semanal INTEGER DEFAULT 7,
    adicionar_rotina_diaria BOOLEAN DEFAULT true,
    dias_da_semana INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_praticas_usuario ON public.praticas_mente_alma(usuario_id);

-- ==============================================================================
-- TABELA 7: registros_mente_alma (Log diário de práticas e reflexão)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.registros_mente_alma (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    praticas_concluidas JSONB DEFAULT '{}'::jsonb, -- { "uuid-pratica": { "concluido": true, "duracaoMinutos": 30, "notas": "..." } }
    reflexao_diaria TEXT,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unico_registro_mente_alma_por_usuario UNIQUE (usuario_id, data)
);
CREATE INDEX IF NOT EXISTS idx_registros_mente_alma_usuario_data ON public.registros_mente_alma(usuario_id, data DESC);

-- ==============================================================================
-- TABELA 8: alimentos (Alimentos do sistema ou cadastrados pelo usuário)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.alimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE, -- NULL = alimento padrão global
    nome TEXT NOT NULL,
    porcao_padrao NUMERIC(7,2) NOT NULL DEFAULT 100,
    unidade_porcao TEXT NOT NULL DEFAULT 'g', -- 'g', 'ml', 'unidade', 'fatia'
    calorias NUMERIC(7,2) NOT NULL DEFAULT 0,
    proteinas NUMERIC(7,2) NOT NULL DEFAULT 0,
    carboidratos NUMERIC(7,2) NOT NULL DEFAULT 0,
    gorduras NUMERIC(7,2) NOT NULL DEFAULT 0,
    categoria TEXT, -- 'Proteínas', 'Carboidratos', 'Gorduras', 'Vegetais & Frutas', etc.
    personalizado BOOLEAN DEFAULT false,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_alimentos_usuario ON public.alimentos(usuario_id);

-- ==============================================================================
-- TABELA 9: planos_alimentares_diarios (Consumo de água e refeições do dia)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.planos_alimentares_diarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    agua_consumida_ml INTEGER DEFAULT 0,
    refeicoes JSONB DEFAULT '{"cafe": [], "almoco": [], "lanche": [], "jantar": [], "ceia": []}'::jsonb,
    observacoes TEXT,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unico_plano_alimentar_por_usuario UNIQUE (usuario_id, data)
);
CREATE INDEX IF NOT EXISTS idx_planos_alimentares_usuario_data ON public.planos_alimentares_diarios(usuario_id, data DESC);

CREATE TRIGGER trigger_planos_alimentares_atualizado_em
    BEFORE UPDATE ON public.planos_alimentares_diarios
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_modificacao();

-- ==============================================================================
-- TABELA 10: divisoes_treino (Treino A, B, C, D...)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.divisoes_treino (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    letra TEXT NOT NULL, -- 'A', 'B', 'C', 'D', 'E'
    nome TEXT NOT NULL, -- Ex: 'Treino A - Peito & Tríceps'
    musculos_alvo TEXT,
    descricao TEXT,
    ordem INTEGER DEFAULT 0,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_divisoes_treino_usuario ON public.divisoes_treino(usuario_id, ordem);

-- ==============================================================================
-- TABELA 11: exercicios_treino (Exercícios de cada divisão)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.exercicios_treino (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    divisao_id UUID NOT NULL REFERENCES public.divisoes_treino(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    grupo_muscular TEXT NOT NULL,
    series INTEGER DEFAULT 4,
    repeticoes TEXT DEFAULT '8-10',
    carga_padrao NUMERIC(6,2) DEFAULT 0, -- Carga padrão (kg)
    observacoes TEXT,
    ordem INTEGER DEFAULT 0,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_exercicios_divisao ON public.exercicios_treino(divisao_id, ordem);

-- ==============================================================================
-- TABELA 12: registros_treino_diarios (Séries dinâmicas, cargas e conclusão)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.registros_treino_diarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    divisao_id UUID REFERENCES public.divisoes_treino(id) ON DELETE SET NULL,
    concluido BOOLEAN DEFAULT false,
    exercicios_concluidos JSONB DEFAULT '{}'::jsonb, -- { "uuid-exercicio": true }
    cargas_exercicios JSONB DEFAULT '{}'::jsonb,      -- { "uuid-exercicio": 84 }
    series_dinamicas JSONB DEFAULT '{}'::jsonb,       -- { "uuid-exercicio": [{"serie": 1, "reps": 10, "carga": 84}] }
    observacoes TEXT,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unico_registro_treino_por_usuario UNIQUE (usuario_id, data)
);
CREATE INDEX IF NOT EXISTS idx_registros_treino_usuario_data ON public.registros_treino_diarios(usuario_id, data DESC);

CREATE TRIGGER trigger_registros_treino_atualizado_em
    BEFORE UPDATE ON public.registros_treino_diarios
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_modificacao();

-- ==============================================================================
-- SEGURANÇA POR LINHA (ROW LEVEL SECURITY - RLS)
-- Garante que O USUÁRIO SOMENTE VEJA E EDITE SEUS PRÓPRIOS DADOS
-- ==============================================================================

ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_pesagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_diarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.praticas_mente_alma ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_mente_alma ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_alimentares_diarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisoes_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercicios_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_treino_diarios ENABLE ROW LEVEL SECURITY;

-- 1. Políticas para 'perfis' (id = auth.uid())
DROP POLICY IF EXISTS "Usuario gerencia seu proprio perfil" ON public.perfis;
CREATE POLICY "Usuario gerencia seu proprio perfil"
    ON public.perfis FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 2. Políticas para tabelas com chave 'usuario_id'
DO $$
DECLARE
    nome_tab TEXT;
BEGIN
    FOR nome_tab IN 
        SELECT unnest(ARRAY[
            'historico_pesagens', 'metas', 'habitos', 'registros_diarios',
            'praticas_mente_alma', 'registros_mente_alma', 'planos_alimentares_diarios',
            'divisoes_treino', 'exercicios_treino', 'registros_treino_diarios'
        ])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Acesso restrito ao proprietario em %I" ON public.%I;', nome_tab, nome_tab);
        EXECUTE format('
            CREATE POLICY "Acesso restrito ao proprietario em %I" 
            ON public.%I FOR ALL 
            USING (auth.uid() = usuario_id) 
            WITH CHECK (auth.uid() = usuario_id);', nome_tab, nome_tab);
    END LOOP;
END $$;

-- 3. Políticas para 'alimentos' (leitura de globais + gerência de próprios)
DROP POLICY IF EXISTS "Leitura de alimentos globais e proprios" ON public.alimentos;
CREATE POLICY "Leitura de alimentos globais e proprios"
    ON public.alimentos FOR SELECT
    USING (usuario_id IS NULL OR auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Gerenciamento de alimentos proprios" ON public.alimentos;
CREATE POLICY "Gerenciamento de alimentos proprios"
    ON public.alimentos FOR ALL
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

-- ==============================================================================
-- CARGA INICIAL (SEED) DE ALIMENTOS LIMPOS DO SISTEMA (usuario_id = NULL)
-- ==============================================================================
INSERT INTO public.alimentos (nome, porcao_padrao, unidade_porcao, calorias, proteinas, carboidratos, gorduras, categoria, personalizado)
VALUES
    ('Peito de Frango Grelhado', 100, 'g', 165, 31.0, 0.0, 3.6, 'Proteínas', false),
    ('Patinho Bovino Moído Magro', 100, 'g', 219, 32.0, 0.0, 9.2, 'Proteínas', false),
    ('Filé de Tilápia Grelhado', 100, 'g', 128, 26.0, 0.0, 2.7, 'Proteínas', false),
    ('Ovo de Galinha Inteiro Cozido', 1, 'unidade (50g)', 74, 6.3, 0.6, 5.0, 'Proteínas', false),
    ('Clara de Ovo Pasteurizada', 100, 'ml', 52, 11.0, 0.7, 0.2, 'Proteínas', false),
    ('Whey Protein Concentrado 80%', 40, 'g (1 scoop)', 160, 32.0, 3.3, 2.4, 'Proteínas', false),
    ('Arroz Branco Cozido', 100, 'g', 130, 2.7, 28.2, 0.3, 'Carboidratos', false),
    ('Arroz Integral Cozido', 100, 'g', 112, 2.6, 23.5, 0.9, 'Carboidratos', false),
    ('Batata Doce Cozida', 100, 'g', 86, 1.6, 20.1, 0.1, 'Carboidratos', false),
    ('Batata Inglesa Cozida', 100, 'g', 77, 2.0, 17.5, 0.1, 'Carboidratos', false),
    ('Aveia em Flocos Finos', 30, 'g (2 colheres)', 110, 4.2, 18.0, 2.3, 'Carboidratos', false),
    ('Banana Prata', 1, 'unidade (80g)', 78, 1.0, 20.0, 0.2, 'Carboidratos', false),
    ('Azeite de Oliva Extra Virgem', 10, 'ml (1 colher)', 83, 0.0, 0.0, 9.2, 'Gorduras', false),
    ('Pasta de Amendoim Integral', 20, 'g (2 colheres)', 120, 5.7, 4.0, 9.7, 'Gorduras', false),
    ('Castanha-do-Pará', 10, 'g (2 unidades)', 66, 1.4, 1.2, 6.6, 'Gorduras', false),
    ('Brócolis Cozido no Vapor', 100, 'g', 35, 2.4, 7.2, 0.4, 'Vegetais & Frutas', false)
ON CONFLICT DO NOTHING;
