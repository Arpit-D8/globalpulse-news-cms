export function DashboardStatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: string;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-4">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-lg text-2xl ${color}`}
        >
          {icon}
        </span>
        <div>
          <p className="text-sm text-neutral-500">{title}</p>
          <p className="text-3xl font-bold text-neutral-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
