import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/AuthContext';
import { formatearFechaHora } from '@/features/reservas/format';
import {
  cerrarConversacion,
  enviarMensaje,
  fetchConversaciones,
  fetchMensajes,
  marcarLeidos,
  subirAdjuntos,
} from './api';

export function ChatPage() {
  const { id } = useParams();
  const idConversacion = Number(id);
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const [texto, setTexto] = useState('');
  const [archivos, setArchivos] = useState<FileList | null>(null);
  const [error, setError] = useState('');

  const conversacionesQuery = useQuery({
    queryKey: ['conversaciones'],
    queryFn: fetchConversaciones,
    refetchInterval: 5000,
  });

  const mensajesQuery = useQuery({
    queryKey: ['mensajes', idConversacion],
    queryFn: () => fetchMensajes(idConversacion),
    enabled: Number.isInteger(idConversacion) && idConversacion > 0,
    refetchInterval: 5000,
  });

  const marcarMutation = useMutation({
    mutationFn: () => marcarLeidos(idConversacion),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversaciones'] }),
  });

  useEffect(() => {
    if (!Number.isInteger(idConversacion) || idConversacion <= 0) return;
    if (!mensajesQuery.isSuccess) return;
    marcarMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idConversacion, mensajesQuery.isSuccess, mensajesQuery.data?.length]);

  const enviarMutation = useMutation({
    mutationFn: async () => {
      const mensaje = await enviarMensaje(idConversacion, texto);
      if (archivos && archivos.length > 0) {
        await subirAdjuntos(idConversacion, mensaje.id, archivos);
      }
      return mensaje;
    },
    onSuccess: () => {
      setTexto('');
      setArchivos(null);
      setError('');
      queryClient.invalidateQueries({ queryKey: ['mensajes', idConversacion] });
      queryClient.invalidateQueries({ queryKey: ['conversaciones'] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'No se pudo enviar.'),
  });

  const cerrarMutation = useMutation({
    mutationFn: () => cerrarConversacion(idConversacion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversaciones'] });
      queryClient.invalidateQueries({ queryKey: ['mensajes', idConversacion] });
    },
  });

  const conversacion = conversacionesQuery.data?.find((c) => c.id === idConversacion);

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Conversaciones</CardTitle>
          <CardDescription>Mensajes con clientes y proveedores.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {conversacionesQuery.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
          {conversacionesQuery.isError && (
            <p className="text-sm text-red-600">No se pudieron cargar las conversaciones.</p>
          )}
          {conversacionesQuery.data?.length === 0 && (
            <p className="text-sm text-slate-500">
              No tienes conversaciones. Puedes iniciar una desde el detalle de un vehiculo.
            </p>
          )}
          {conversacionesQuery.data?.map((conv) => (
            <Link
              key={conv.id}
              to={`/chat/${conv.id}`}
              className={`block rounded-lg border p-3 text-sm transition-colors ${
                conv.id === idConversacion
                  ? 'border-brand bg-teal-50'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{conv.proveedor}</span>
                {conv.noLeidos > 0 && (
                  <span className="rounded-full bg-brand px-2 py-0.5 text-xs text-white">
                    {conv.noLeidos}
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                {conv.ultimoMensaje ?? 'Sin mensajes'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {conv.activa ? 'Activa' : 'Cerrada'}
              </p>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>{conversacion?.proveedor ?? 'Chat'}</CardTitle>
            <CardDescription>
              {conversacion ? (conversacion.activa ? 'Conversacion activa' : 'Conversacion cerrada') : 'Selecciona una conversacion'}
            </CardDescription>
          </div>
          {conversacion?.activa && (
            <Button
              variant="outline"
              size="sm"
              disabled={cerrarMutation.isPending}
              onClick={() => cerrarMutation.mutate()}
            >
              Cerrar
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!Number.isInteger(idConversacion) || idConversacion <= 0 ? (
            <p className="text-sm text-slate-500">Selecciona una conversacion del listado.</p>
          ) : (
            <>
              <div className="max-h-[55dvh] space-y-3 overflow-y-auto pr-1">
                {mensajesQuery.isLoading && <p className="text-sm text-slate-500">Cargando mensajes…</p>}
                {mensajesQuery.isError && (
                  <p className="text-sm text-red-600">No se pudieron cargar los mensajes.</p>
                )}
                {mensajesQuery.data?.length === 0 && (
                  <p className="text-sm text-slate-500">Aun no hay mensajes.</p>
                )}
                {mensajesQuery.data?.map((mensaje) => {
                  const propio = mensaje.idEmisor === usuario?.id;
                  return (
                    <div
                      key={mensaje.id}
                      className={`flex ${propio ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          propio ? 'bg-brand text-white' : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{mensaje.contenido}</p>
                        {mensaje.adjuntos?.map((adjunto) => (
                          <a
                            key={adjunto.id}
                            href={adjunto.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block break-all text-xs underline"
                          >
                            {adjunto.nombre}
                          </a>
                        ))}
                        <p
                          className={`mt-1 text-xs ${
                            propio ? 'text-teal-100' : 'text-slate-500'
                          }`}
                        >
                          {formatearFechaHora(mensaje.fecha)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {conversacion?.activa ? (
                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (texto.trim().length === 0) return;
                    enviarMutation.mutate();
                  }}
                >
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="mensaje" className="sr-only">
                      Mensaje
                    </Label>
                    <Input
                      id="mensaje"
                      value={texto}
                      maxLength={2000}
                      placeholder="Escribe un mensaje…"
                      onChange={(event) => setTexto(event.target.value)}
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <Label htmlFor="adjuntos" className="sr-only">
                      Adjuntos
                    </Label>
                    <input
                      id="adjuntos"
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={(event) => setArchivos(event.target.files)}
                      className="w-36 text-xs text-slate-600"
                    />
                  </div>
                  <Button type="submit" disabled={enviarMutation.isPending || !texto.trim()}>
                    {enviarMutation.isPending ? 'Enviando…' : 'Enviar'}
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-slate-500">La conversacion esta cerrada.</p>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
