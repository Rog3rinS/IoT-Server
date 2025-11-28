import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Lightbulb, Thermometer, Droplets, Wind, Gauge, AlertCircle, Loader2 } from 'lucide-react';

const SensorDashboard = () => {
  const [filter, setFilter] = useState('all');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["data"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8080/readings?limit=50");
      if (!res.ok) throw new Error("Falha ao buscar dados da API.");
      return res.json();
    },
    refetchInterval: 3600000
  });

  const sensorConfig = {
    motion: { icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Movimento' },
    light: { icon: Lightbulb, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Luminosidade' },
    temperature: { icon: Thermometer, color: 'text-red-500', bg: 'bg-red-50', label: 'Temperatura' },
    humidity: { icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Umidade' },
    pressure: { icon: Gauge, color: 'text-green-500', bg: 'bg-green-50', label: 'Press�o' },
    wind: { icon: Wind, color: 'text-cyan-500', bg: 'bg-cyan-50', label: 'Vento' },
  };

  const groupedData = useMemo(() => {
    if (!data) return {};
    const groups = {};
    data.forEach(reading => {
      if (!groups[reading.sensor_type]) {
        groups[reading.sensor_type] = [];
      }
      groups[reading.sensor_type].push(reading);
    });
    return groups;
  }, [data]);

  const stats = useMemo(() => {
    return Object.keys(groupedData).map(type => {
      const readings = groupedData[type];
      const latest = readings[0];
      const values = readings.map(r => r.value).filter(v => typeof v === 'number');
      const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : 'N/A';
      
      return {
        type,
        count: readings.length,
        latest: latest.value,
        average: avg,
        unit: latest.unit || '',
        timestamp: latest.timestamp,
      };
    });
  }, [groupedData]);

  const filteredReadings = useMemo(() => {
    if (!data) return [];
    if (filter === 'all') return data;
    return data.filter(r => r.sensor_type === filter);
  }, [data, filter]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Carregando dados dos sensores...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">Erro ao carregar dados</h2>
          <p className="text-slate-600 text-center mb-6">{error.message}</p>
          <button 
            onClick={() => refetch()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Dashboard IoT</h1>
            <p className="text-slate-600">Monitoramento em tempo real dos sensores</p>
          </div>
          <button 
            onClick={() => refetch()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Atualizar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {stats.map(stat => {
            const config = sensorConfig[stat.type] || { icon: Activity, color: 'text-gray-500', bg: 'bg-gray-50', label: stat.type };
            const Icon = config.icon;
            
            return (
              <div key={stat.type} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${config.bg} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${config.color}`} />
                  </div>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    {stat.count} leituras
                  </span>
                </div>
                <h3 className="text-sm font-medium text-slate-600 mb-2">{config.label}</h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xl font-bold text-slate-800">
                    {stat.type === 'motion' ? (stat.latest === 1 ? 'Ativo' : 'Inativo') : stat.latest}
                  </span>
                  {stat.unit && <span className="text-sm text-slate-500">{stat.unit}</span>}
                </div>
                <p className="text-xs text-slate-500">
                  Mdia: {stat.average} {stat.unit}
                </p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todos ({data?.length || 0})
            </button>
            {Object.keys(groupedData).map(type => {
              const config = sensorConfig[type] || { label: type };
              return (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === type 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {config.label} ({groupedData[type].length})
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">ID</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Tipo</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Valor</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Unidade</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReadings.map(reading => {
                  const config = sensorConfig[reading.sensor_type] || { color: 'text-gray-500', label: reading.sensor_type };
                  const Icon = config.icon || Activity;
                  
                  return (
                    <tr key={reading.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 text-sm text-slate-600">{reading.id}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${config.color}`} />
                          <span className="text-sm font-medium text-slate-700">{config.label}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm font-semibold text-slate-800">
                          {reading.sensor_type === 'motion' 
                            ? (reading.value === 1 ? 'Ativo' : 'Inativo')
                            : reading.value}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">{reading.unit || '-'}</td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-slate-700">{formatTime(reading.timestamp)}</div>
                        <div className="text-xs text-slate-500">{formatDate(reading.timestamp)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorDashboard;