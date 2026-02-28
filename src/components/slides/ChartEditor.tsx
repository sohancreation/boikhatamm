import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BarChart3, PieChart, TrendingUp, Plus, Trash2, Upload, Table } from "lucide-react";
import { BarChart, Bar, PieChart as RechartsPie, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export interface ChartData {
  type: "bar" | "pie" | "line";
  data: { label: string; value: number; color?: string }[];
  title?: string;
}

interface ChartEditorProps {
  chart?: ChartData;
  onChange: (chart: ChartData) => void;
  accentColor: string;
}

const DEFAULT_COLORS = ["#38bdf8", "#f43f5e", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#06b6d4", "#84cc16"];

const ChartEditor = ({ chart, onChange, accentColor }: ChartEditorProps) => {
  const { t } = useLanguage();
  const [showTable, setShowTable] = useState(false);

  const data = chart?.data || [
    { label: "Item A", value: 40 },
    { label: "Item B", value: 30 },
    { label: "Item C", value: 20 },
    { label: "Item D", value: 10 },
  ];
  const chartType = chart?.type || "bar";

  const initChart = (type: "bar" | "pie" | "line") => {
    onChange({ type, data, title: chart?.title || "" });
  };

  const updateData = (idx: number, field: "label" | "value", val: string) => {
    const newData = [...data];
    if (field === "value") newData[idx] = { ...newData[idx], value: Number(val) || 0 };
    else newData[idx] = { ...newData[idx], label: val };
    onChange({ ...chart!, data: newData });
  };

  const addRow = () => {
    onChange({ ...chart!, data: [...data, { label: `Item ${data.length + 1}`, value: Math.round(Math.random() * 50) + 10 }] });
  };

  const removeRow = (idx: number) => {
    if (data.length <= 2) return;
    onChange({ ...chart!, data: data.filter((_, i) => i !== idx) });
  };

  const handleCSV = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n").slice(1);
      const parsed = lines.map(line => {
        const [label, value] = line.split(",").map(s => s.trim().replace(/"/g, ""));
        return { label: label || "Item", value: Number(value) || 0 };
      }).filter(d => d.label);
      if (parsed.length >= 2) onChange({ type: chartType, data: parsed, title: chart?.title });
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [chart, chartType, onChange]);

  const coloredData = data.map((d, i) => ({ ...d, color: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length] }));

  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("Chart Type", "চার্ট ধরন")}</p>
      <div className="flex gap-1">
        {([
          { id: "bar", icon: BarChart3, label: "Bar" },
          { id: "pie", icon: PieChart, label: "Pie" },
          { id: "line", icon: TrendingUp, label: "Line" },
        ] as const).map(ct => (
          <button key={ct.id} onClick={() => initChart(ct.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 p-2 rounded-lg border text-[9px] font-medium transition-all ${
              chartType === ct.id ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-accent"
            }`}>
            <ct.icon className="w-4 h-4" />{ct.label}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="flex items-center justify-between">
        <button onClick={() => setShowTable(!showTable)} className="flex items-center gap-1 text-[10px] font-bold text-primary">
          <Table className="w-3 h-3" /> {t("Edit Data", "ডেটা এডিট")}
        </button>
        <label className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground cursor-pointer hover:text-foreground">
          <Upload className="w-3 h-3" /> CSV
          <input type="file" accept=".csv" className="hidden" onChange={handleCSV} />
        </label>
      </div>

      {showTable && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          <div className="grid grid-cols-[1fr_60px_24px] gap-1 text-[9px] font-bold text-muted-foreground px-1">
            <span>Label</span><span>Value</span><span></span>
          </div>
          {data.map((d, i) => (
            <div key={i} className="grid grid-cols-[1fr_60px_24px] gap-1">
              <input value={d.label} onChange={e => updateData(i, "label", e.target.value)}
                className="rounded border border-border bg-background px-1.5 py-1 text-[10px] text-foreground" />
              <input type="number" value={d.value} onChange={e => updateData(i, "value", e.target.value)}
                className="rounded border border-border bg-background px-1.5 py-1 text-[10px] text-foreground" />
              <button onClick={() => removeRow(i)} disabled={data.length <= 2}
                className="p-0.5 rounded text-muted-foreground hover:text-destructive disabled:opacity-30">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button onClick={addRow} className="text-[10px] text-primary font-medium flex items-center gap-1">
            <Plus className="w-3 h-3" /> {t("Add Row", "সারি যোগ")}
          </button>
        </div>
      )}

      {/* Preview */}
      {chart && (
        <div className="h-32 w-full bg-background rounded-lg border border-border p-1">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={coloredData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3333" />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {coloredData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            ) : chartType === "pie" ? (
              <RechartsPie>
                <Pie data={coloredData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={50} label={{ fontSize: 8 }}>
                  {coloredData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
              </RechartsPie>
            ) : (
              <LineChart data={coloredData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3333" />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke={accentColor} strokeWidth={2} dot={{ fill: accentColor }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ChartEditor;

// Render chart for the slide canvas at full scale
export const SlideChartRender = ({ chart, width = 800, height = 500 }: { chart: ChartData; width?: number; height?: number }) => {
  const colors = chart.data.map((d, i) => d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]);

  return (
    <ResponsiveContainer width={width} height={height}>
      {chart.type === "bar" ? (
        <BarChart data={chart.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
          <XAxis dataKey="label" tick={{ fontSize: 18, fill: "#999" }} />
          <YAxis tick={{ fontSize: 16, fill: "#999" }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {chart.data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
          </Bar>
        </BarChart>
      ) : chart.type === "pie" ? (
        <RechartsPie>
          <Pie data={chart.data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius="80%" label={{ fontSize: 18 }}>
            {chart.data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </RechartsPie>
      ) : (
        <LineChart data={chart.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
          <XAxis dataKey="label" tick={{ fontSize: 18, fill: "#999" }} />
          <YAxis tick={{ fontSize: 16, fill: "#999" }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={3} dot={{ fill: colors[0], r: 6 }} />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
};
