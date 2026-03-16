import { Link } from 'react-router-dom';
import { CheckCircle, Coins, Gift, Lock, Type } from 'lucide-react';
import { Button } from '../ui/button';
import type { RewardItem } from '../../types/credit';

export function RewardCard({
  item,
  balance,
  onUnlock,
  onToggle,
}: {
  item: RewardItem;
  balance: number;
  onUnlock: (id: number) => void;
  onToggle: (id: number, activate: boolean) => void;
}) {
  const canAfford = balance >= item.creditCost;

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
      {/* Preview */}
      {item.previewUrl ? (
        <img
          src={item.previewUrl}
          alt={item.name}
          className="mb-3 h-20 w-20 self-center rounded-full object-cover"
        />
      ) : item.category === 'Title' ? (
        <div className="mb-3 flex h-20 w-full items-center justify-center rounded-xl bg-violet-500/5">
          <span className="text-lg font-bold text-violet-600">{item.value ?? item.name}</span>
        </div>
      ) : (
        <div className="mb-3 flex h-20 w-20 items-center justify-center self-center rounded-full bg-muted">
          <Gift className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      <h3 className="text-sm font-semibold">{item.name}</h3>
      {item.description && (
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
      )}

      <div className="mt-auto pt-3 flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <Coins className="h-3.5 w-3.5" />
          {item.creditCost.toLocaleString()}
        </span>

        {item.isUnlocked ? (
          item.category === 'NameChange' ? (
            <Link to="/dashboard">
              <Button size="sm" variant="outline" className="gap-1 rounded-full">
                <Type className="h-3.5 w-3.5" />
                Use on Profile
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              variant={item.isActive ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => onToggle(item.id, !item.isActive)}
            >
              {item.isActive ? (
                <>
                  <CheckCircle className="mr-1 h-3.5 w-3.5" />
                  Equipped
                </>
              ) : (
                'Equip'
              )}
            </Button>
          )
        ) : (
          <Button
            size="sm"
            disabled={!canAfford}
            className="rounded-full"
            onClick={() => onUnlock(item.id)}
          >
            <Lock className="mr-1 h-3.5 w-3.5" />
            Unlock
          </Button>
        )}
      </div>
    </div>
  );
}
