'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Users, TrendingUp, Shield, Lock } from 'lucide-react';

interface ProFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProFeatureDialog({ open, onOpenChange }: ProFeatureDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0f] border-cyan-500/30 text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg">
              <Crown className="h-6 w-6 text-yellow-400" />
            </div>
            <DialogTitle className="text-2xl">Доступно в Pro версии</DialogTitle>
          </div>
          <DialogDescription className="text-cyan-500/60">
            Семейный бюджет с расширенными возможностями
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-green-500/10 rounded-lg">
                <Users className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Совместное ведение бюджета</h4>
                <p className="text-sm text-cyan-500/60">
                  Приглашайте супруга/супругу и ведите семейные финансы вместе в реальном времени
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Аналитика семьи</h4>
                <p className="text-sm text-cyan-500/60">
                  Общие графики расходов, доходов и прогнозы для всей семьи
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-purple-500/10 rounded-lg">
                <Shield className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Безопасность и контроль</h4>
                <p className="text-sm text-cyan-500/60">
                  Ролевая система доступа, история изменений и уведомления
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-cyan-500/20">
            <div className="bg-gradient-to-r from-cyan-500/10 to-pink-500/10 rounded-lg p-4">
              <p className="text-sm text-cyan-400 text-center">
                🎉 Скоро! Мы готовим запуск Pro версии
              </p>
              <p className="text-xs text-cyan-500/60 text-center mt-1">
                Оставайтесь на связи - не пропустите обновление
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            Закрыть
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-cyan-600 to-pink-600 hover:from-cyan-700 hover:to-pink-700"
            onClick={() => {
              // TODO: Redirect to waitlist or signup page
              onOpenChange(false);
            }}
          >
            Узнать больше
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
