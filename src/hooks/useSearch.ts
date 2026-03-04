import { useState, useMemo, useCallback } from 'react'
import { sections } from '../data/sections'

export interface SearchResult {
  sectionId: string
  sectionTitle: string
  sectionIcon: string
  cardTitle: string
  cardSubtitle: string
  cardIndex: number
  cardLevel: string
  cardIcon: string
  snippet: string
  score: number
  matchType: 'exact' | 'synonym' | 'intent' | 'fuzzy'
}

export interface Suggestion {
  query: string
  label: string
  icon: string
}

// ── Popular suggestions shown on focus ──────────────────────

export const popularSuggestions: Suggestion[] = [
  { query: 'petição', label: 'Petições e Peças', icon: 'file-text' },
  { query: 'contrato', label: 'Análise de Contratos', icon: 'file-check' },
  { query: 'como começar', label: 'Primeiros Passos', icon: 'rocket' },
  { query: 'jurisprudência', label: 'Pesquisa Jurídica', icon: 'search' },
  { query: 'prazo', label: 'Controle de Prazos', icon: 'clock' },
  { query: 'gpts', label: 'GPTs Personalizados', icon: 'plug' },
  { query: 'canvas', label: 'ChatGPT Canvas', icon: 'handshake' },
  { query: 'economizar tokens', label: 'Otimização de Uso', icon: 'trending-up' },
  { query: 'prompt perfeito', label: 'Framework CONTEXTO', icon: 'target' },
  { query: 'marketing', label: 'Marketing Jurídico', icon: 'trending-up' },
]

// ── Normalization ───────────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Fuzzy matching (Levenshtein distance) ───────────────────

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  const m: number[][] = []
  for (let i = 0; i <= b.length; i++) m[i] = [i]
  for (let j = 0; j <= a.length; j++) m[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] = Math.min(
        m[i - 1][j] + 1,
        m[i][j - 1] + 1,
        m[i - 1][j - 1] + (b[i - 1] === a[j - 1] ? 0 : 1)
      )
    }
  }
  return m[b.length][a.length]
}

function fuzzyMatchScore(query: string, target: string): number {
  if (query.length < 4) return 0
  const targetWords = target.split(' ')
  let bestScore = 0
  for (const word of targetWords) {
    if (word.length < 3) continue
    const dist = levenshtein(query, word)
    const maxLen = Math.max(query.length, word.length)
    if (dist <= Math.floor(maxLen * 0.3) && dist > 0) {
      bestScore = Math.max(bestScore, 1 - dist / maxLen)
    }
  }
  return bestScore
}

// ── Synonym map (expanded for 103+ cards) ───────────────────

const synonyms: Record<string, string[]> = {
  // Custos e tokens
  'economizar': ['token', 'otimizar', 'economia', 'gastar menos', 'uso maximo', 'limite', 'gratuitas'],
  'barato': ['token', 'economia', 'custo', 'preco', 'plano'],
  'gratis': ['gratuito', 'free', 'custo', 'economia'],
  'gasto': ['token', 'consumo', 'limite', 'uso'],
  'limite': ['token', 'limite', 'cota', 'resetar', 'plano'],
  'caro': ['token', 'plano', 'preco', 'custo', 'max'],
  'token': ['token', 'tokens', 'limite', 'economia', 'otimizar', 'uso maximo', 'gratuitas'],
  'tokens': ['token', 'tokens', 'limite', 'economia', 'otimizar', 'uso maximo', 'gratuitas'],

  // Primeiros passos
  'comecar': ['primeiros passos', 'instalar', 'configurar', 'inicio', 'basico', 'iniciante'],
  'inicio': ['primeiros passos', 'instalar', 'configurar', 'comecar'],
  'instalar': ['instalacao', 'download', 'baixar', 'configurar', 'desktop'],
  'baixar': ['download', 'instalacao', 'instalar', 'desktop'],
  'configurar': ['configuracao', 'personalizar', 'setup', 'instrucoes globais'],

  // Ferramentas jurídicas
  'contrato': ['contrato', 'clausula', 'review contract', 'analise', 'revisao', 'nda', 'due diligence'],
  'peticao': ['peticao', 'peca', 'processual', 'trabalhista', 'inicial', 'visual law'],
  'prazo': ['prazo', 'deadline', 'vencimento', 'controle', 'calendario', 'prazos'],
  'pesquisa': ['pesquisa', 'jurisprudencia', 'jurimetria', 'busca', 'search', 'precedente'],
  'jurisprudencia': ['jurisprudencia', 'precedente', 'tribunal', 'stj', 'stf', 'vinculante', 'sumula', 'triagem'],
  'precedente': ['jurisprudencia', 'precedente', 'vinculante', 'orientadora', 'sumula'],
  'parecer': ['parecer', 'opiniao', 'analise juridica', 'viabilidade'],
  'audiencia': ['audiencia', 'preparacao', 'testemunha', 'depoimento', 'conciliacao'],
  'acordo': ['acordo', 'negociacao', 'mediacao', 'conciliacao', 'batna', 'zopa'],

  // Peças processuais estratégicas
  'replica': ['replica', 'contestacao', 'diagnostico', 'desconstrucao', 'tatico'],
  'contestacao': ['contestacao', 'replica', 'defesa', 'impugnacao'],
  'contrarrazoes': ['contrarrazoes', 'recurso', 'apelacao', 'agravo', 'sentenca', 'blindar'],
  'recurso': ['recurso', 'apelacao', 'agravo', 'resp', 'contrarrazoes', 'recursal'],
  'apelacao': ['apelacao', 'recurso', 'contrarrazoes', 'sentenca', 'tribunal'],
  'sentenca': ['sentenca', 'contrarrazoes', 'recurso', 'decisao'],

  // Áreas do direito
  'trabalhista': ['trabalhista', 'clt', 'tst', 'rescisao', 'reclamatoria'],
  'consumidor': ['consumidor', 'cdc', 'defesa', 'relacao de consumo'],
  'previdenciario': ['previdenciario', 'inss', 'aposentadoria', 'beneficio', 'tnu'],
  'empresarial': ['empresarial', 'societario', 'contrato', 'due diligence', 'm a'],
  'imobiliario': ['imobiliario', 'usucapiao', 'locacao', 'imovel'],
  'tributario': ['tributario', 'imposto', 'carf', 'fiscal', 'tributaria'],
  'familia': ['familia', 'divorcio', 'guarda', 'alimentos', 'pensao'],
  'penal': ['penal', 'criminal', 'crime', 'habeas corpus', 'dosimetria', 'pena', 'prisao'],
  'criminal': ['criminal', 'penal', 'crime', 'defesa', 'reu', 'flagrante', 'preventiva'],
  'habeas corpus': ['habeas corpus', 'liberdade', 'prisao', 'preventiva', 'flagrante', 'hc'],
  'dosimetria': ['dosimetria', 'pena', 'sentenca', 'regime', 'agravante', 'atenuante'],
  'prisao': ['prisao', 'preventiva', 'flagrante', 'liberdade', 'habeas corpus', 'cautelar'],
  'deep research': ['deep research', 'pesquisa', 'autonoma', 'relatorio', 'fontes'],

  // Ecossistema ChatGPT
  'ia': ['chatgpt', 'inteligencia artificial', 'ai', 'modelo'],
  'claude': ['chatgpt', 'claude', 'gpt', 'comparacao', 'alternativa', 'anthropic'],
  'gpt': ['chatgpt', 'gpt', 'openai', 'modelo'],
  'gemini': ['gemini', 'google', 'alternativa', 'comparacao'],
  'assistente': ['chatgpt', 'canvas', 'chat', 'gpts'],
  'automatizar': ['automacao', 'automatizar', 'actions', 'workflow', 'agendar', 'recorrente'],
  'automacao': ['automacao', 'automatizar', 'actions', 'workflow', 'agendar', 'recorrente'],
  'navegar': ['browsing', 'navegador', 'extensao', 'web', 'site'],

  // Ferramentas office
  'planilha': ['excel', 'spreadsheet', 'xlsx', 'tabela', 'dados'],
  'excel': ['excel', 'planilha', 'spreadsheet', 'xlsx', 'formatacao condicional', 'powerpoint'],
  'powerpoint': ['powerpoint', 'pptx', 'apresentacao', 'slides', 'sustentacao'],
  'word': ['word', 'docx', 'documento', 'formatacao'],
  'slides': ['powerpoint', 'apresentacao', 'slides', 'sustentacao oral'],
  'apresentacao': ['powerpoint', 'slides', 'apresentacao', 'sustentacao'],

  // Comunicação
  'email': ['gmail', 'email', 'e mail', 'correio', 'comunicacao'],
  'gmail': ['gmail', 'email', 'e mail', 'conector'],
  'drive': ['google drive', 'drive', 'documentos', 'conector', 'nuvem'],

  // Componentes ChatGPT
  'gpts': ['gpts', 'gpt', 'assistente', 'personalizado', 'custom gpt'],
  'custom instructions': ['custom instructions', 'instrucoes', 'personalizar', 'perfil'],
  'actions': ['actions', 'acoes', 'api', 'integracao', 'conexao'],
  'canvas': ['canvas', 'editor', 'documento', 'colaborativo'],
  'memoria': ['memoria', 'memory', 'lembrar', 'contexto', 'persistente'],
  'projeto': ['projeto', 'projects', 'pasta', 'knowledge base', 'contexto'],
  'mencao': ['mencao', 'arroba', 'at', 'gpt', 'atalho'],
  'estilo': ['estilo', 'estilos', 'escrita', 'tom', 'formal', 'conciso', 'style'],
  'code interpreter': ['code interpreter', 'codigo', 'analise dados', 'python', 'advanced data'],

  // Modelos
  'gpt5': ['gpt 5', 'gpt5', 'modelo', 'raciocinio', 'premium', 'qual modelo'],
  'gpt 5.2': ['gpt 5.2', 'gpt5.2', 'modelo', 'padrao', 'default', 'qual modelo'],
  'gpt5.2': ['gpt 5.2', 'modelo', 'padrao', 'rapido', 'default'],
  'qual modelo': ['gpt 5', 'gpt 5.2', 'modelo', 'escolher'],

  // Ética e regulamentação
  'etica': ['etica', 'oab', 'cnj', 'regulamentacao', 'resolucao', 'regras'],
  'oab': ['oab', 'etica', 'regulamentacao', 'recomendacao', 'disciplinar'],
  'cnj': ['cnj', 'resolucao 615', 'regulamentacao', 'judiciario'],
  'lgpd': ['lgpd', 'protecao de dados', 'privacidade', 'seguranca', 'sigilo'],
  'sigilo': ['sigilo', 'confidencialidade', 'seguranca', 'enterprise', 'team', 'privilegio'],
  'seguranca': ['seguranca', 'sigilo', 'lgpd', 'dados', 'privacidade', 'protecao'],

  // Negociação e estratégia
  'negociacao': ['negociacao', 'mediacao', 'acordo', 'conciliacao', 'batna', 'zopa'],
  'mediacao': ['mediacao', 'negociacao', 'acordo', 'conciliacao'],
  'conciliacao': ['conciliacao', 'acordo', 'mediacao', 'negociacao', 'audiencia'],
  'estrategia': ['estrategia', 'caso', 'tese', 'risco', 'cenario', 'viabilidade', 'tatico'],
  'viabilidade': ['viabilidade', 'estrategia', 'risco', 'parecer', 'analise', 'aceitar caso'],

  // Implementação
  'implementar': ['implementar', 'escritorio', 'adocao', 'roadmap', 'fase'],
  'roadmap': ['roadmap', 'implementar', 'escritorio', 'fase', 'adocao', 'plano'],
  'escritorio': ['escritorio', 'implementar', 'equipe', 'roadmap', 'gestao'],

  // Visual Law
  'visual law': ['visual law', 'legal design', 'quadro resumo', 'timeline', 'tabela', 'visual'],
  'legal design': ['legal design', 'visual law', 'visual', 'formatacao'],

  // Comparação e análise
  'comparar': ['comparacao', 'multi documentos', 'diferenca', 'clausula', 'lado a lado'],
  'comparacao': ['comparacao', 'multi documentos', 'diferenca', 'comparar', 'versus'],

  // Outras IAs
  'lovable': ['lovable', 'tokens', 'economia', 'alternativa', 'gratuitas'],
  'perplexity': ['perplexity', 'pesquisa', 'alternativa', 'tokens', 'gratuitas'],
  'deepseek': ['deepseek', 'alternativa', 'tokens', 'economia', 'gratuitas'],
  'notebooklm': ['notebooklm', 'notebook', 'resumir', 'google', 'gratuitas', 'pre processar'],
  'ai studio': ['google ai studio', 'gemini', 'testar', 'prompt', 'gratuitas'],
  'ilovepdf': ['ilovepdf', 'pdf', 'converter', 'txt', 'gratuitas'],
  'gratuita': ['gratuitas', 'gratis', 'free', 'notebooklm', 'perplexity', 'deepseek', 'ilovepdf'],
  'gratuitas': ['gratuitas', 'gratis', 'free', 'notebooklm', 'perplexity', 'deepseek', 'ilovepdf'],

  // DataJud e APIs
  'datajud': ['datajud', 'cnj', 'api', 'processo', 'consulta', 'mcp'],
  'pje': ['pje', 'processo eletronico', 'download', 'comunica', 'mni'],
  'processo': ['processo', 'processual', 'numero', 'consulta', 'datajud', 'acompanhamento'],

  // Framework CONTEXTO e técnicas de prompt
  'contexto': ['contexto', 'framework', 'prompt', 'cargo', 'objetivo', 'narrativa', 'exclusoes'],
  'framework': ['contexto', 'framework', 'prompt perfeito', 'estrutura', 'metodologia'],
  'prompt': ['prompt', 'contexto', 'framework', 'tecnica', 'instrucao', 'pedido'],
  'xml': ['xml', 'tags', 'tecnica', 'prompt avancado', 'estruturar'],
  'chain of thought': ['cadeia pensamento', 'raciocinio', 'passo a passo', 'cot'],
  'iteracao': ['iteracao', 'refinamento', 'rodada', 'melhorar', 'versao'],
  'refinamento': ['refinamento', 'iteracao', 'melhorar', 'reforcar', 'revisar'],

  // Anti-alucinação
  'alucinacao': ['alucinacao', 'fabricacao', 'inventar', 'verificar', 'blindagem', 'conferir'],
  'fabricacao': ['fabricacao', 'alucinacao', 'inventar', 'falso', 'verificacao'],
  'verificar': ['verificar', 'conferir', 'checar', 'alucinacao', 'blindagem'],
  'blindagem': ['blindagem', 'anti alucinacao', 'verificacao', 'protecao', 'conferir'],

  // Marketing jurídico
  'marketing': ['marketing', 'instagram', 'linkedin', 'reels', 'conteudo', 'rede social', 'carrossel'],
  'instagram': ['instagram', 'carrossel', 'reels', 'stories', 'marketing', 'rede social'],
  'linkedin': ['linkedin', 'thread', 'profissional', 'marketing', 'post'],
  'carrossel': ['carrossel', 'instagram', 'slides', 'marketing', 'conteudo'],
  'reels': ['reels', 'tiktok', 'video', 'roteiro', 'instagram'],
  'rede social': ['rede social', 'marketing', 'instagram', 'linkedin', 'conteudo'],
  'conteudo': ['conteudo', 'marketing', 'publicacao', 'post', 'artigo'],

  // Comunicação com cliente
  'whatsapp': ['whatsapp', 'mensagem', 'comunicacao', 'cliente', 'resposta'],
  'comunicacao': ['comunicacao', 'email', 'whatsapp', 'mensagem', 'cliente', 'carta'],
  'cliente': ['cliente', 'comunicacao', 'atendimento', 'reuniao', 'orientacao'],
  'cobranca': ['cobranca', 'honorario', 'pagamento', 'inadimplencia', 'comunicacao'],

  // Fluxo de trabalho
  'fluxo': ['fluxo', 'workflow', 'processo', 'etapa', 'passo a passo'],
  'workflow': ['workflow', 'fluxo', 'automacao', 'processo', 'etapa'],
  'atendimento': ['atendimento', 'reuniao', 'cliente', 'caso', 'consulta'],

  // Prompts prontos / biblioteca
  'biblioteca': ['biblioteca', 'colecao', 'prompts prontos', 'template', 'modelo'],
  'template': ['template', 'modelo', 'pronto', 'biblioteca', 'formulario'],
  'modelo': ['modelo', 'template', 'pronto', 'exemplo', 'referencia'],
}

// ── Intent map (expanded for 103 cards) ─────────────────────

const intentMap: Record<string, string[]> = {
  // Primeiros passos
  'como comecar': ['O que e o ChatGPT', 'Instalacao do ChatGPT Desktop', 'Escolhendo seu Plano', 'Glossario'],
  'quanto custa': ['Escolhendo seu Plano'],
  'qual plano': ['Escolhendo seu Plano', 'Sigilo Profissional'],
  'como instalar': ['Instalacao do ChatGPT Desktop', 'Extensoes e Ferramentas'],
  'como usar': ['Chat vs Canvas', 'O que e o Canvas', 'Personalizar'],

  // Modelos
  'qual modelo': ['Qual Modelo Usar', 'GPT-5.2', 'GPT-5'],
  'gpt5 ou gpt5.2': ['Qual Modelo Usar'],
  'modelo mais rapido': ['Qual Modelo Usar', 'GPT-5.2'],
  'modelo mais inteligente': ['Qual Modelo Usar', 'GPT-5'],

  // Comparações
  'claude ou chatgpt': ['ChatGPT vs Claude vs Gemini'],
  'melhor ia': ['ChatGPT vs Claude vs Gemini'],
  'qual ia usar': ['ChatGPT vs Claude vs Gemini'],
  'comparar ia': ['ChatGPT vs Claude vs Gemini'],
  'chatgpt ou gemini': ['ChatGPT vs Claude vs Gemini'],

  // Funcionalidades
  'como personalizar': ['Personalizar', 'Custom Instructions'],
  'estilo escrita': ['Custom Instructions'],
  'como lembrar': ['Memory'],
  'memoria': ['Memory'],
  'importar dados': ['Memory'],

  // Jurídico
  'revisar contrato': ['Analise de Contratos', 'Plugin Legal', 'Comparacao Multi documentos'],
  'fazer peticao': ['Peticoes', 'Visual Law', 'Criando Skills'],
  'pesquisar jurisprudencia': ['Pesquisa Juridica', 'Jurisprudencia Estrategica', 'Deep Research', 'Chrome'],
  'deep research': ['Deep Research'],
  'pesquisa autonoma': ['Deep Research'],
  'habeas corpus': ['Habeas Corpus e Liberdade Provisoria'],
  'dosimetria': ['Dosimetria da Pena e Memoriais Criminais'],
  'memoriais': ['Dosimetria da Pena e Memoriais Criminais'],
  'alegacoes finais': ['Dosimetria da Pena e Memoriais Criminais'],
  'direito penal': ['Habeas Corpus e Liberdade Provisoria', 'Dosimetria da Pena e Memoriais Criminais'],
  'criminal': ['Habeas Corpus e Liberdade Provisoria', 'Dosimetria da Pena e Memoriais Criminais'],
  'preso': ['Habeas Corpus e Liberdade Provisoria'],
  'prisao preventiva': ['Habeas Corpus e Liberdade Provisoria'],
  'controle prazo': ['Controle de Prazos', 'Calendario', 'Automacao Recorrente'],
  'parecer': ['Parecer Juridico'],
  'relatorio': ['Relatorio para Cliente'],
  'due diligence': ['Due Diligence', 'Analise de Contratos', 'Comparacao Multi documentos'],

  // Peças estratégicas
  'fazer replica': ['Custom Instructions de Replica Estrategica', 'GPT Contencioso'],
  'contrarrazoes': ['Custom Instructions de Contrarrazoes Recursais', 'GPT Contencioso'],
  'recurso': ['Custom Instructions de Contrarrazoes Recursais', 'Contrarrazoes'],
  'estrategia caso': ['Custom Instructions de Estrategia de Caso'],
  'analisar caso': ['Custom Instructions de Estrategia de Caso'],
  'viabilidade': ['Custom Instructions de Estrategia de Caso'],

  // Negociação
  'preparar negociacao': ['Preparacao para Negociacao'],
  'mediacao': ['Preparacao para Negociacao', 'Mediacao'],
  'acordo': ['Preparacao para Negociacao', 'Mediacao'],
  'batna': ['Preparacao para Negociacao'],

  // Office
  'criar planilha': ['Excel e PowerPoint Juridico'],
  'criar apresentacao': ['Excel e PowerPoint Juridico'],
  'excel': ['Excel e PowerPoint Juridico', 'Calculos Juridicos'],
  'powerpoint': ['Excel e PowerPoint Juridico'],
  'comparar documentos': ['Comparacao Multi documentos'],
  'comparar contratos': ['Comparacao Multi documentos', 'Analise de Contratos'],

  // Tokens e economia
  'economizar token': ['Economize com IAs Gratuitas', 'Entendendo Tokens', 'Pre processe Documentos'],
  'gastar menos': ['Economize com IAs Gratuitas', 'Entendendo Tokens', 'Pre processe Documentos'],
  'uso maximo': ['Economize com IAs Gratuitas', 'Tecnicas Expert'],
  'outra ia': ['Economize com IAs Gratuitas', 'Pre processe Documentos'],
  'ferramenta gratuita': ['Economize com IAs Gratuitas', 'Pre processe Documentos'],
  'pre processar': ['Pre processe Documentos', 'Economize com IAs Gratuitas'],

  // Automação
  'agendar tarefa': ['Automacao Recorrente'],
  'tarefa recorrente': ['Automacao Recorrente'],
  'automatizar escritorio': ['Automacao de Escritorio', 'Automacao Recorrente'],
  'automacao semanal': ['Automacao Recorrente'],

  // Ética e regulamentação
  'etica ia': ['Etica e IA na Advocacia'],
  'regras oab': ['Etica e IA na Advocacia'],
  'cnj 615': ['Etica e IA na Advocacia'],
  'sigilo': ['Sigilo Profissional', 'LGPD'],
  'dados sensiveis': ['Sigilo Profissional', 'Protecao de Dados', 'LGPD'],
  'confidencialidade': ['Sigilo Profissional'],
  'plano seguro': ['Sigilo Profissional'],

  // Implementação
  'implementar ia': ['Roadmap Implementando IA'],
  'adotar ia escritorio': ['Roadmap Implementando IA'],
  'comecar escritorio': ['Roadmap Implementando IA'],

  // Componentes
  'o que e canvas': ['O que e o Canvas', 'Chat vs Canvas'],
  'o que e gpt': ['O que sao GPTs', 'GPTs'],
  'o que e custom instructions': ['Custom Instructions', 'Personalizar'],
  'o que e actions': ['Actions e Integracoes', 'API'],
  'como conectar': ['Actions', 'Integracoes'],
  'extensao': ['Extensoes e Ferramentas', 'Pesquisa', 'Browsing'],
  'criar pasta': ['Organizando seus Projetos', 'Projects'],
  'organizar': ['Organizando seus Projetos', 'Projects'],
  'visual law': ['Visual Law', 'Canvas'],
  'apresentacao': ['Code Interpreter', 'Slides'],

  // Framework CONTEXTO e prompts
  'como fazer prompt': ['Framework CONTEXTO', 'Tecnicas Expert de Prompt'],
  'prompt perfeito': ['Framework CONTEXTO'],
  'prompt juridico': ['Framework CONTEXTO', 'Biblioteca de Prompts'],
  'como pedir ao chatgpt': ['Framework CONTEXTO', 'Tecnicas Expert de Prompt'],
  'chain of thought': ['Tecnicas Expert de Prompt'],
  'melhorar resultado': ['Tecnicas Expert de Prompt', 'Framework CONTEXTO'],
  'refinar peticao': ['Tecnicas Expert de Prompt'],
  'prompts prontos': ['Biblioteca de Prompts Juridicos'],
  'modelo de prompt': ['Biblioteca de Prompts Juridicos'],
  'template prompt': ['Biblioteca de Prompts Juridicos'],

  // Anti-alucinação
  'jurisprudencia falsa': ['Anti Alucinacao'],
  'verificar jurisprudencia': ['Anti Alucinacao'],
  'alucinacao': ['Anti Alucinacao'],
  'inventar': ['Anti Alucinacao'],
  'fabricar': ['Anti Alucinacao'],
  'conferir citacao': ['Anti Alucinacao'],
  'como evitar erro': ['Anti Alucinacao'],

  // Fluxo de trabalho
  'fluxo peticao': ['Fluxo Do Cliente a Peticao'],
  'passo a passo peticao': ['Fluxo Do Cliente a Peticao'],
  'workflow peticao': ['Fluxo Do Cliente a Peticao'],
  'reuniao cliente': ['Fluxo Do Cliente a Peticao'],
  'atendimento inicial': ['Fluxo Do Cliente a Peticao'],
  'aceitar caso': ['Analise de Viabilidade de Tese'],
  'caso viavel': ['Analise de Viabilidade de Tese'],
  'risco do caso': ['Analise de Viabilidade de Tese'],

  // Marketing
  'marketing juridico': ['Marketing Juridico Etico', 'Custom Instructions de Marketing Juridico'],
  'conteudo instagram': ['Marketing Juridico Etico', 'Custom Instructions de Marketing Juridico'],
  'carrossel instagram': ['Marketing Juridico Etico', 'Custom Instructions de Marketing Juridico'],
  'rede social advogado': ['Marketing Juridico Etico', 'Custom Instructions de Marketing Juridico'],
  'publicar conteudo': ['Marketing Juridico Etico'],
  'criar carrossel': ['Marketing Juridico Etico', 'Custom Instructions de Marketing Juridico'],

  // Custom Instructions de criação
  'criar instrucao peticao': ['Custom Instructions de Peticao Universal'],
  'instrucao para peticao': ['Custom Instructions de Peticao Universal'],
  'instrucao comunicacao': ['Custom Instructions de Comunicacao com Cliente'],
  'email cliente': ['Custom Instructions de Comunicacao com Cliente', 'E mails Juridicos'],
  'whatsapp cliente': ['Custom Instructions de Comunicacao com Cliente'],
  'cobranca honorario': ['Custom Instructions de Comunicacao com Cliente'],
  'instrucao marketing': ['Custom Instructions de Marketing Juridico'],
}

// ── Multi-field weighted scoring ────────────────────────────

interface FieldScore {
  text: string
  weight: number
}

function buildSearchFields(card: typeof sections[0]['cards'][0]): FieldScore[] {
  return [
    { text: normalize(card.title), weight: 25 },
    { text: normalize(card.subtitle || ''), weight: 15 },
    { text: normalize(card.analogy?.text || ''), weight: 8 },
    { text: normalize(card.content), weight: 4 },
    { text: normalize((card.tips || []).join(' ')), weight: 3 },
    { text: normalize((card.steps || []).join(' ')), weight: 3 },
    { text: normalize(card.prompt || ''), weight: 5 },
    { text: normalize((card.commandList || []).map(c => `${c.command} ${c.description}`).join(' ')), weight: 7 },
    { text: normalize((card.flowSteps || []).map(f => `${f.title} ${f.description}`).join(' ')), weight: 4 },
    { text: normalize((card.elementGrid || []).map(e => `${e.name} ${e.description} ${e.whenToUse || ''}`).join(' ')), weight: 5 },
    { text: normalize((card.links || []).map(l => l.label).join(' ')), weight: 2 },
    { text: normalize((card.checklist || []).map(g => `${g.title} ${g.items.join(' ')}`).join(' ')), weight: 3 },
    { text: normalize(card.relationship?.title || ''), weight: 3 },
    { text: normalize((card.relationship?.items || []).map(r => `${r.label} ${r.value} ${r.sub || ''}`).join(' ')), weight: 3 },
    { text: normalize((card.refTable || []).map(r => `${r.element} ${r.analogy}`).join(' ')), weight: 3 },
  ]
}

// ── Synonym expansion ───────────────────────────────────────

function getExpandedTerms(query: string): { original: string[], expanded: string[] } {
  const normalized = normalize(query)
  const words = normalized.split(' ').filter(w => w.length >= 2)
  const original = [normalized, ...words]
  const expanded: string[] = []

  for (const word of words) {
    for (const [key, alts] of Object.entries(synonyms)) {
      const normKey = normalize(key)
      if (word === normKey || normKey.startsWith(word) || word.startsWith(normKey)) {
        expanded.push(...alts.map(normalize))
      }
    }
  }

  // Also check the full query as a synonym key
  for (const [key, alts] of Object.entries(synonyms)) {
    const normKey = normalize(key)
    if (normalized.includes(normKey) || normKey.includes(normalized)) {
      expanded.push(...alts.map(normalize))
    }
  }

  return {
    original: [...new Set(original)],
    expanded: [...new Set(expanded)],
  }
}

// ── Intent detection ────────────────────────────────────────

function getIntentBoosts(query: string): string[] {
  const normalized = normalize(query)
  const boosts: string[] = []

  for (const [intent, titles] of Object.entries(intentMap)) {
    const normIntent = normalize(intent)
    const intentWords = normIntent.split(' ')
    const queryWords = normalized.split(' ')

    // Check if query matches intent (50%+ word overlap)
    const matchCount = intentWords.filter(iw =>
      queryWords.some(qw => qw.includes(iw) || iw.includes(qw))
    ).length

    if (matchCount >= Math.ceil(intentWords.length * 0.5)) {
      boosts.push(...titles.map(normalize))
    }
  }

  return [...new Set(boosts)]
}

// ── Snippet extraction with context ─────────────────────────

function extractSnippet(fields: FieldScore[], queryNorm: string, card: typeof sections[0]['cards'][0]): string {
  // Try to find match in content fields for a relevant snippet
  const allText = fields.map(f => f.text).join(' ')
  const idx = allText.indexOf(queryNorm)

  if (idx >= 0) {
    const start = Math.max(0, idx - 30)
    const end = Math.min(allText.length, idx + queryNorm.length + 70)
    const raw = allText.slice(start, end).trim()
    return (start > 0 ? '...' : '') + raw + (end < allText.length ? '...' : '')
  }

  // Try individual query words
  const words = queryNorm.split(' ').filter(w => w.length >= 3)
  for (const word of words) {
    const wIdx = allText.indexOf(word)
    if (wIdx >= 0) {
      const start = Math.max(0, wIdx - 25)
      const end = Math.min(allText.length, wIdx + word.length + 75)
      const raw = allText.slice(start, end).trim()
      return (start > 0 ? '...' : '') + raw + (end < allText.length ? '...' : '')
    }
  }

  return card.subtitle || card.content.slice(0, 100).trim() + '...'
}

// ── Main scoring function ───────────────────────────────────

function scoreCard(
  fields: FieldScore[],
  original: string[],
  expanded: string[],
  intentBoosts: string[],
  queryNorm: string,
): { score: number; matchType: SearchResult['matchType'] } {
  let score = 0
  let matchType: SearchResult['matchType'] = 'exact'
  let hasExact = false
  let hasSynonym = false
  let hasIntent = false
  let hasFuzzy = false

  const titleField = fields[0]
  const subtitleField = fields[1]

  // 1. Original terms — direct matches (highest value)
  for (const term of original) {
    for (const field of fields) {
      if (!field.text) continue
      // Exact word boundary match (more precise)
      if (field.text.includes(term)) {
        score += field.weight
        hasExact = true
        // Bonus for exact word match at start of title
        if (field === titleField && field.text.startsWith(term)) {
          score += 10
        }
      }
    }
  }

  // 2. Phrase match bonus (multi-word query matched in sequence)
  if (queryNorm.includes(' ') && queryNorm.length >= 5) {
    if (titleField.text.includes(queryNorm)) {
      score += 30
      hasExact = true
    } else if (subtitleField.text.includes(queryNorm)) {
      score += 20
      hasExact = true
    }
  }

  // 3. Expanded terms — synonym matches (medium value)
  for (const term of expanded) {
    if (titleField.text.includes(term)) {
      score += 8
      hasSynonym = true
    }
    if (subtitleField.text.includes(term)) {
      score += 5
      hasSynonym = true
    }
    // Only check content for expanded terms if there's no title match
    if (!hasExact && !hasSynonym) {
      for (const field of fields.slice(2)) {
        if (field.text && field.text.includes(term)) {
          score += Math.min(field.weight, 3)
          hasSynonym = true
          break
        }
      }
    }
  }

  // 4. Intent boost
  for (const boost of intentBoosts) {
    if (titleField.text.includes(boost) || subtitleField.text.includes(boost)) {
      score += 15
      hasIntent = true
    }
  }

  // 5. Fuzzy matching on title (typo tolerance)
  if (score === 0) {
    for (const term of original) {
      const fuzzyScore = fuzzyMatchScore(term, titleField.text)
      if (fuzzyScore > 0) {
        score += Math.round(fuzzyScore * 12)
        hasFuzzy = true
      }
      const fuzzySubScore = fuzzyMatchScore(term, subtitleField.text)
      if (fuzzySubScore > 0) {
        score += Math.round(fuzzySubScore * 6)
        hasFuzzy = true
      }
    }
  }

  // 6. Multi-word coverage bonus
  if (original.length > 1) {
    const words = queryNorm.split(' ').filter(w => w.length >= 2)
    const allFieldText = fields.map(f => f.text).join(' ')
    const matchedWords = words.filter(w => allFieldText.includes(w))
    if (matchedWords.length > 1) {
      score += matchedWords.length * 4 // Bonus per matched word
    }
  }

  // Determine primary match type
  if (hasExact) matchType = 'exact'
  else if (hasIntent) matchType = 'intent'
  else if (hasSynonym) matchType = 'synonym'
  else if (hasFuzzy) matchType = 'fuzzy'

  return { score, matchType }
}

// ── Related content suggestions ─────────────────────────────

const relatedMap: Record<string, string[]> = {
  'Análise de Contratos': ['GPT Jurídico', 'Comparação Multi-documentos', 'Due Diligence'],
  'Petições e Peças Processuais': ['Custom Instructions de Visual Law', 'Custom Instructions de Estratégia de Caso'],
  'Custom Instructions de Réplica Estratégica': ['Custom Instructions de Contrarrazões Recursais', 'Custom Instructions de Jurisprudência Estratégica', 'GPT Contencioso'],
  'Custom Instructions de Contrarrazões Recursais': ['Custom Instructions de Réplica Estratégica', 'Custom Instructions de Jurisprudência Estratégica'],
  'Custom Instructions de Jurisprudência Estratégica': ['Custom Instructions de Réplica Estratégica', 'Pesquisa Jurídica Avançada'],
  'Custom Instructions de Estratégia de Caso': ['Preparação para Negociação', 'Parecer Jurídico'],
  'Preparação para Negociação e Mediação': ['Custom Instructions de Estratégia de Caso'],
  'Custom Instructions Jurídicas': ['Personalizar', 'Custom Instructions de Visual Law'],
  'Memory do ChatGPT': ['Personalizar', 'Projects'],
  'Code Interpreter Jurídico': ['Cálculos Jurídicos', 'Relatório para Cliente'],
  'Ética e IA na Advocacia: OAB e CNJ': ['Sigilo Profissional', 'Proteção de Dados e LGPD'],
  'Sigilo Profissional: Qual Plano Escolher?': ['Ética e IA na Advocacia', 'Escolhendo seu Plano'],
  'Roadmap: Implementando IA no Escritório': ['Automação Recorrente', 'Automação de Escritório'],
  'Framework CONTEXTO: Prompt Jurídico Perfeito': ['Técnicas Expert de Prompt Jurídico', 'Biblioteca de Prompts Jurídicos'],
  'Técnicas Expert de Prompt Jurídico': ['Framework CONTEXTO: Prompt Jurídico Perfeito', 'Raciocínio Avançado (GPT-5)'],
  'Biblioteca de Prompts Jurídicos': ['Framework CONTEXTO: Prompt Jurídico Perfeito', 'Custom Instructions de Petição Universal'],
  'Fluxo: Do Cliente à Petição em 10 Passos': ['Framework CONTEXTO: Prompt Jurídico Perfeito', 'Petições e Peças Processuais'],
  'Análise de Viabilidade de Tese': ['Custom Instructions de Estratégia de Caso', 'Parecer Jurídico'],
  'Marketing Jurídico Ético com ChatGPT': ['Custom Instructions de Marketing Jurídico', 'Canvas'],
  'Custom Instructions de Petição Universal': ['Criando Custom Instructions Jurídicas', 'Petições e Peças Processuais', 'Framework CONTEXTO'],
  'Custom Instructions de Comunicação com Cliente': ['E-mails Jurídicos Profissionais', 'Criando Custom Instructions Jurídicas'],
  'Custom Instructions de Marketing Jurídico': ['Marketing Jurídico Ético com ChatGPT', 'Criando Custom Instructions Jurídicas'],
  'Anti-Alucinação: Blindagem do Advogado': ['Ética e IA na Advocacia', 'Pesquisa Jurídica Avançada'],
  'Deep Research: Pesquisa Autônoma': ['Pesquisa Jurídica Avançada no Chat', 'Anti-Alucinação: Blindagem do Advogado', 'Instrução de Jurisprudência Estratégica'],
  'Habeas Corpus e Liberdade Provisória': ['Dosimetria da Pena e Memoriais Criminais', 'Instrução de Estratégia de Caso'],
  'Dosimetria da Pena e Memoriais Criminais': ['Habeas Corpus e Liberdade Provisória', 'Code Interpreter Jurídico'],
  'Pesquisa Jurídica Avançada no Chat': ['Deep Research: Pesquisa Autônoma', 'Instrução de Jurisprudência Estratégica'],
}

export function getRelatedCards(cardTitle: string): string[] {
  return relatedMap[cardTitle] || []
}

// ── Main hook ───────────────────────────────────────────────

export function useSearch() {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  // Pre-build search fields for all cards (memoized)
  const searchIndex = useMemo(() => {
    return sections.map(section => ({
      section,
      cards: section.cards.map((card, idx) => ({
        card,
        index: idx,
        fields: buildSearchFields(card),
      })),
    }))
  }, [])

  const results = useMemo<SearchResult[]>(() => {
    if (query.length < 2) return []

    const queryNorm = normalize(query)
    const { original, expanded } = getExpandedTerms(query)
    const intentBoosts = getIntentBoosts(query)
    const found: SearchResult[] = []

    for (const { section, cards } of searchIndex) {
      for (const { card, index, fields } of cards) {
        const { score, matchType } = scoreCard(fields, original, expanded, intentBoosts, queryNorm)

        if (score > 0) {
          found.push({
            sectionId: section.id,
            sectionTitle: section.title,
            sectionIcon: section.icon,
            cardTitle: card.title,
            cardSubtitle: card.subtitle || '',
            cardIndex: index,
            cardLevel: card.level,
            cardIcon: card.icon,
            snippet: extractSnippet(fields, queryNorm, card),
            score,
            matchType,
          })
        }
      }
    }

    found.sort((a, b) => b.score - a.score)
    return found.slice(0, 15)
  }, [query, searchIndex])

  const handleFocus = useCallback(() => setIsFocused(true), [])
  const handleBlur = useCallback(() => {
    // Delay to allow click on results
    setTimeout(() => setIsFocused(false), 200)
  }, [])

  return { query, setQuery, results, isFocused, handleFocus, handleBlur }
}
