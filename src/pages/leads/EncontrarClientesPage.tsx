import { useRef, useState, type FormEvent } from 'react';
import { ExternalLink, MapPin, MessageCircle, Search, Shuffle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { makeLeadQueue, takeLeadBatch } from '@/utils/leadRotation';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

type Lead = {
  id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  mapsUrl: string;
  social?: string;
  category?: string;
};

const defaultMessage = 'Olá! Tudo bem? Sou da Vibe Afiações e gostaria de apresentar nossos serviços de afiação para {empresa}.';

function whatsappNumber(phone: string) {
  const digits = phone.split(/[;,/]/)[0].replace(/\D/g, '');
  if (/^\d{10,11}$/.test(digits)) return `55${digits}`;
  if (/^55\d{10,11}$/.test(digits)) return digits;
  return null;
}

function safeUrl(url: string) {
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}

export function EncontrarClientesPage() {
  const { user, session } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [region, setRegion] = useState('');
  const [limit, setLimit] = useState(20);
  const [message, setMessage] = useLocalStorage(`vibe-leads-message-${user?.id ?? 'local'}`, defaultMessage);
  const [results, setResults] = useState<Lead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [batchQueue, setBatchQueue] = useState<Lead[]>([]);
  const [batchNextIndex, setBatchNextIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [viewed, setViewed] = useState(0);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const remainingLeads = useRef<Lead[]>([]);
  const searchLimit = useRef(limit);
  const [error, setError] = useState('');
  const googleMapsSearch = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${keyword.trim()} em ${region.trim()}`)}`;

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!keyword.trim() || !region.trim() || loading) return;
    setLoading(true);
    setError('');
    setResults([]);
    setSelectedIds(new Set());
    setBatchQueue([]);
    setBatchNextIndex(0);
    setSearched(false);
    remainingLeads.current = [];
    setRemaining(0);
    setViewed(0);
    try {
      const response = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ keyword: keyword.trim(), region: region.trim(), limit }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Não foi possível buscar os clientes.');
      const { first, remaining: rest } = makeLeadQueue<Lead>(data.places ?? [], limit);
      remainingLeads.current = rest;
      searchLimit.current = limit;
      setResults(first);
      setTotal(data.total ?? data.places?.length ?? 0);
      setRemaining(rest.length);
      setViewed(first.length);
      setSearched(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível buscar os clientes.');
    } finally {
      setLoading(false);
    }
  }

  function rotateResults() {
    if (!remainingLeads.current.length) return;
    const batch = takeLeadBatch(remainingLeads.current, searchLimit.current);
    remainingLeads.current = batch.remaining;
    setResults(batch.places);
    setSelectedIds(new Set());
    setBatchQueue([]);
    setBatchNextIndex(0);
    setViewed((count) => count + batch.places.length);
    setRemaining(batch.remaining.length);
  }

  function whatsappUrlFor(lead: Lead) {
    const phone = whatsappNumber(lead.phone);
    if (!phone) return undefined;
    const personalizedMessage = message.replaceAll('{empresa}', lead.name);
    return `https://wa.me/${phone}?text=${encodeURIComponent(personalizedMessage)}`;
  }

  function openBatchConversation(lead: Lead) {
    const url = whatsappUrlFor(lead);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  function startBatch() {
    const queue = results.filter((lead) => selectedIds.has(lead.id) && whatsappUrlFor(lead));
    if (!queue.length) return;
    setBatchQueue(queue);
    openBatchConversation(queue[0]);
    setBatchNextIndex(1);
  }

  function openNextBatchConversation() {
    const lead = batchQueue[batchNextIndex];
    if (!lead) return;
    openBatchConversation(lead);
    setBatchNextIndex((index) => index + 1);
  }

  const selectableResults = results.filter((lead) => whatsappUrlFor(lead));
  const allSelectableSelected = selectableResults.length > 0 && selectableResults.every((lead) => selectedIds.has(lead.id));

  return (
    <div className="space-y-6">
      <PageHeader title="Encontrar clientes" description="Encontre empresas por atividade e cidade para entrar em contato pelo WhatsApp." />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
        <Card>
          <CardHeader><CardTitle>Buscar estabelecimentos</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSearch}>
              <div className="space-y-2">
                <Label htmlFor="lead-keyword">O que deseja buscar?</Label>
                <Input id="lead-keyword" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Ex.: nail designer, barbeiro" maxLength={80} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-region">Região</Label>
                <Input id="lead-region" value={region} onChange={(event) => setRegion(event.target.value)} placeholder="Cidade, UF. Ex.: Campinas, SP" maxLength={120} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-limit">Quantidade máxima</Label>
                <Select id="lead-limit" value={limit} onChange={(event) => setLimit(Number(event.target.value))}>
                  {[10, 20, 40, 60].map((count) => <option key={count} value={count}>{count} resultados</option>)}
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full" disabled={loading}>
                  <Search className="mr-2 h-4 w-4" />{loading ? 'Buscando...' : 'Buscar clientes'}
                </Button>
              </div>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a href={googleMapsSearch} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-2xl bg-secondary px-3 text-sm font-medium"><ExternalLink className="mr-2 h-4 w-4" />Pesquisar no Google Maps</a>
              <span className="text-xs text-muted-foreground">A pesquisa usa dados abertos da Overture Maps. O Google Maps abre em outra aba.</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">A quantidade é um limite. Os resultados dependem dos dados disponíveis para cada cidade e atividade.</p>
            {loading ? <div className="mt-4 space-y-2" role="status" aria-live="polite">
              <p className="text-sm text-muted-foreground">Buscando estabelecimentos e verificando contatos...</p>
              <div role="progressbar" aria-label="Busca em andamento" className="h-2 overflow-hidden rounded-full bg-secondary"><div className="lead-progress-bar h-full w-1/3 rounded-full bg-primary" /></div>
            </div> : null}
            {error ? <p role="alert" className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Mensagem de WhatsApp</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="lead-message">Texto enviado ao abrir a conversa</Label>
            <Textarea id="lead-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} rows={5} />
            <p className="text-xs text-muted-foreground">Use <code>{'{empresa}'}</code> para inserir o nome encontrado. A mensagem fica salva neste navegador.</p>
          </CardContent>
        </Card>
      </div>

      {searched ? (
        <section aria-label="Resultados da busca" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">{results.length} {results.length === 1 ? 'resultado exibido' : 'resultados exibidos'}{total > results.length ? ` de ${total} encontrados` : ''}</h2>
            <a href="https://docs.overturemaps.org/attribution/" target="_blank" rel="noopener noreferrer" className="rounded-lg bg-card px-3 py-1 text-sm text-foreground shadow-sm">Dados: Overture Maps</a>
          </div>
          {total > 0 ? <div className="flex flex-wrap items-center gap-3" aria-live="polite">
            <Button type="button" variant="secondary" onClick={rotateResults} disabled={!remaining}>
              <Shuffle className="mr-2 h-4 w-4" />Mostrar novos resultados
            </Button>
            <p className="text-sm text-muted-foreground">{remaining ? `${viewed} já exibidos · ${remaining} restantes nesta busca` : 'Todos os resultados desta busca já foram exibidos.'}</p>
          </div> : null}
          {selectableResults.length > 0 ? <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
            <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedIds(allSelectableSelected ? new Set() : new Set(selectableResults.map((lead) => lead.id)))}>
              {allSelectableSelected ? 'Desmarcar todos' : 'Selecionar todos com telefone'}
            </Button>
            <span className="text-sm text-muted-foreground">{selectedIds.size} selecionado(s)</span>
            <Button type="button" size="sm" onClick={startBatch} disabled={!selectedIds.size}>
              <MessageCircle className="mr-2 h-4 w-4" />Abrir mensagens selecionadas
            </Button>
            {batchQueue.length > 0 ? <>
              {batchNextIndex < batchQueue.length ? <Button type="button" variant="secondary" size="sm" onClick={openNextBatchConversation}>Abrir próxima conversa ({batchNextIndex + 1}/{batchQueue.length})</Button> : <span className="text-sm text-muted-foreground">Todos os rascunhos foram abertos.</span>}
              <p className="basis-full text-xs text-muted-foreground">{batchNextIndex} de {batchQueue.length} conversas abertas. Revise e envie cada mensagem no WhatsApp; o envio automático não é permitido por este link.</p>
            </> : null}
          </div> : null}
          {!results.length ? <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Nenhum resultado para esta busca. Tente outra palavra-chave ou região.</p> : null}
          <div className="grid gap-4 lg:grid-cols-2">
            {results.map((lead) => {
              const phone = whatsappNumber(lead.phone);
              const whatsappUrl = whatsappUrlFor(lead);
              return (
                <Card key={lead.id} className="border-border">
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex items-start gap-3">
                      {phone ? <input type="checkbox" aria-label={`Selecionar ${lead.name} para mensagem em lote`} checked={selectedIds.has(lead.id)} onChange={(event) => setSelectedIds((current) => {
                        const next = new Set(current);
                        if (event.target.checked) next.add(lead.id);
                        else next.delete(lead.id);
                        return next;
                      })} className="mt-1 h-4 w-4 accent-primary" /> : null}
                      <div>
                      <h3 className="text-lg font-semibold">{lead.name}</h3>
                      </div>
                    </div>
                    {lead.address ? <p className="flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{lead.address}</p> : null}
                    <p className="text-sm">{lead.phone || 'Telefone não informado na fonte'}</p>
                    <div className="flex flex-wrap gap-2">
                      {whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-2xl bg-primary px-3 text-sm font-medium text-primary-foreground"><MessageCircle className="mr-2 h-4 w-4" />Abrir WhatsApp</a> : null}
                      {safeUrl(lead.mapsUrl) ? <a href={safeUrl(lead.mapsUrl)} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-2xl bg-secondary px-3 text-sm font-medium"><ExternalLink className="mr-2 h-4 w-4" />Ver no Maps</a> : null}
                      {safeUrl(lead.website) ? <a href={safeUrl(lead.website)} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-2xl bg-secondary px-3 text-sm font-medium">Site</a> : null}
                      {safeUrl(lead.social ?? '') ? <a href={safeUrl(lead.social ?? '')} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-2xl bg-secondary px-3 text-sm font-medium">Rede social</a> : null}
                    </div>
                    {phone ? <p className="text-xs text-muted-foreground">A existência de WhatsApp nesse número não é verificada.</p> : null}
                    <div className="border-t border-border pt-2"><a href="https://docs.overturemaps.org/attribution/" target="_blank" rel="noopener noreferrer" className="text-xs text-foreground">Dados: Overture Maps</a></div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

    </div>
  );
}
