import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { Alert } from '../../types';

const styles = {
  critical: { bg: 'bg-danger/10 border-danger/30', icon: AlertTriangle, color: 'text-danger' },
  warning: { bg: 'bg-warning/10 border-warning/30', icon: AlertCircle, color: 'text-warning' },
  info: { bg: 'bg-primary/10 border-primary/30', icon: Info, color: 'text-primary' },
};

export function AlertBanner({ alert }: { alert: Alert }) {
  const style = styles[alert.severity];
  const Icon = style.icon;

  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg border ${style.bg}`}>
      <Icon size={16} className={`${style.color} mt-0.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${style.color}`}>{alert.title}</p>
        <p className="text-xs text-muted mt-0.5">{alert.message}</p>
      </div>
    </div>
  );
}
