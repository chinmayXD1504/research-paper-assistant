import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  badgeColor?: string;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: StatsCardProps) {
  return (
    <div className="p-5 rounded-3xl bg-[#FAF7F2] border border-[#D3C4BE] hover:border-[#C4BDAC] transition-all duration-300 hover:-translate-y-1 hover:shadow-paper-lg relative overflow-hidden group shadow-paper-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-extrabold text-[#57534e] uppercase tracking-widest">{title}</p>
          <h3 className="text-3xl font-black mt-2 tracking-tight text-[#1c1917] group-hover:scale-105 transition-transform origin-left">
            {value}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-[#57534e] mt-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        <div className="p-3.5 rounded-2xl bg-[#E9CCB1] border border-[#D3C4BE] text-[#1c1917] shadow-sm transition-transform group-hover:rotate-12 group-hover:scale-110">
          <Icon className="w-5 h-5 text-[#1c1917]" />
        </div>
      </div>

      {trend && (
        <div className="mt-3.5 pt-2.5 border-t border-[#D3C4BE]/60 flex items-center justify-between">
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md border bg-[#E8E6D9] border-[#C4BDAC] text-[#1c1917]">
            {trend}
          </span>
        </div>
      )}
    </div>
  );
}
