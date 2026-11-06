'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Cliente {
  id: string;
  nombre_empresa: string;
  estado: string;
  presupuesto_mensual: number;
  creado_en: string;
  calificacion?: string;
}

interface LogActividad {
  id: string;
  nombre_agente: string;
  tarea_ejecutada: string;
  estado_tarea: string;
  fecha_ejecucion: string;
}

export default function Home() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [logs, setLogs] = useState<LogActividad[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const { data: clientsData } = await supabase
      .from('agency_clients')
      .select('*')
      .order('creado_en', { ascending: false });

    const { data: logsData } = await supabase
      .from('agent_activity_logs')
      .select('*')
      .order('fecha_ejecucion', { ascending: false });

    if (clientsData) setClientes(clientsData);
    if (logsData) setLogs(logsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Escuchador en tiempo real de Supabase (sin necesidad de F5)
    const channelClients = supabase
      .channel('realtime_clients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agency_clients' }, () => fetchData())
      .subscribe();

    const channelLogs = supabase
      .channel('realtime_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_activity_logs' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channelClients);
      supabase.removeChannel(channelLogs);
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Encabezado */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-emerald-400">Agency OS - Command Center</h1>
            <p className="text-slate-400 text-sm mt-1">Panel de Control & Auditoría de Agentes IA</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Realtime Sync Activo 24/7
          </div>
        </header>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">Clientes Captados</p>
            <p className="text-3xl font-bold mt-2 text-white">{clientes.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">Presupuesto Gestionado</p>
            <p className="text-3xl font-bold mt-2 text-emerald-400">
              ${clientes.reduce((acc, c) => acc + (Number(c.presupuesto_mensual) || 0), 0).toLocaleString()} USD
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">Tareas Auditadas</p>
            <p className="text-3xl font-bold mt-2 text-blue-400">{logs.length}</p>
          </div>
        </div>

        {/* Tabla de Clientes */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-200">Clientes en Base de Datos (Supabase)</h2>
          {loading ? (
            <p className="text-slate-500 text-sm">Cargando registros...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-xs border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Empresa</th>
                    <th className="py-3 px-4">Presupuesto</th>
                    <th className="py-3 px-4">Estado Lead</th>
                    <th className="py-3 px-4">Fecha Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {clientes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-medium text-white">{c.nombre_empresa}</td>
                      <td className="py-3 px-4 text-emerald-400 font-mono">${c.presupuesto_mensual} USD</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2.5 py-0.5 rounded border ${
                          c.presupuesto_mensual >= 5000 
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}>
                          {c.presupuesto_mensual >= 5000 ? 'Calificado IA' : 'Por Revisar'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {new Date(c.creado_en).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Logs de Actividad de Agentes */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-200">Historial de Auditoría de Agentes IA</h2>
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex items-start justify-between">
                <div>
                  <span className="bg-blue-950 text-blue-300 border border-blue-800 text-xs px-2 py-0.5 rounded font-mono">
                    {log.nombre_agente}
                  </span>
                  <p className="text-sm text-slate-300 mt-2">{log.tarea_ejecutada}</p>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(log.fecha_ejecucion).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}