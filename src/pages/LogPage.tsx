import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { useCheckIn } from '../hooks/useCheckIn';
import { useNutrition } from '../hooks/useNutrition';
import { PageHeader } from '../components/layout/PageHeader';
import { ClipboardCheck, Utensils, Scale, Dumbbell, Activity, TestTube2, CheckCircle2 } from 'lucide-react';

export function LogPage() {
  const navigate = useNavigate();
  const { todayEntry: todayCheckIn } = useCheckIn();
  const { todayEntry: todayNutrition } = useNutrition();

  const items = [
    {
      icon: ClipboardCheck,
      label: 'Daily Check-In',
      desc: 'Sleep, energy, recovery, training',
      done: !!todayCheckIn,
      route: '/log/check-in',
    },
    {
      icon: Utensils,
      label: 'Nutrition',
      desc: 'Log your macros for today',
      done: !!todayNutrition,
      route: '/log/nutrition',
    },
    {
      icon: Scale,
      label: 'Body Composition',
      desc: 'Weight, muscle, body fat, ECW',
      done: false,
      route: '/log/body-comp',
    },
    {
      icon: Activity,
      label: 'Sprint Session',
      desc: 'Echo bike intervals',
      done: false,
      route: '/log/performance',
    },
    {
      icon: Dumbbell,
      label: 'Training',
      desc: 'Resistance or cardio session',
      done: false,
      route: '/log/performance',
    },
    {
      icon: TestTube2,
      label: 'Bloodwork',
      desc: 'Lab results',
      done: false,
      route: '/log/bloodwork',
    },
  ];

  return (
    <div>
      <PageHeader title="Log" />
      <div className="px-4 py-4 space-y-2">
        {items.map(item => (
          <Card key={item.label} onClick={() => navigate(item.route)} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
              <item.icon size={20} className="text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted truncate">{item.desc}</p>
            </div>
            {item.done && <CheckCircle2 size={18} className="text-success shrink-0" />}
          </Card>
        ))}
      </div>
    </div>
  );
}
