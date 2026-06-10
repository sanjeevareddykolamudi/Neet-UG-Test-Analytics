"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { subject: "Physics", accuracy: 0 },
  { subject: "Chemistry", accuracy: 0 },
  { subject: "Botany", accuracy: 0 },
  { subject: "Zoology", accuracy: 0 }
];

export function SubjectAccuracyChart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -24, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="subject" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
          <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
          <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
