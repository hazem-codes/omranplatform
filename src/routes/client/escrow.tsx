import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export const Route = createFileRoute('/client/escrow')({
  component: EscrowDepositPage,
});

function EscrowDepositPage() {
  const { allowed, isLoading: guardLoading } = useAuthGuard('client');
  if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const sar = isRTL ? 'ر.س' : 'SAR';

  const [escrow] = useState({ total_amount: 50000, released_amount: 15000, status: 'held' });
  const [amount, setAmount] = useState('');

  const handleDeposit = () => {
    if (!amount || Number(amount) <= 0) return;
    toast.success(isRTL ? `تم إيداع ${amount} ${sar} بنجاح` : `${amount} ${sar} deposited successfully`);
    setAmount('');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-black">{isRTL ? 'الضمان المالي' : 'Escrow'}</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <Wallet className="mx-auto h-8 w-8 text-gold mb-2" />
            <p className="text-2xl font-bold">{escrow.total_amount.toLocaleString()} {sar}</p>
            <p className="text-sm text-muted-foreground">{isRTL ? 'إجمالي المبلغ' : 'Total Amount'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="mx-auto h-8 w-8 text-success mb-2" />
            <p className="text-2xl font-bold">{escrow.released_amount.toLocaleString()} {sar}</p>
            <p className="text-sm text-muted-foreground">{isRTL ? 'المبلغ المحرر' : 'Released'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="mx-auto h-8 w-8 text-warning mb-2" />
            <p className="text-2xl font-bold">{(escrow.total_amount - escrow.released_amount).toLocaleString()} {sar}</p>
            <p className="text-sm text-muted-foreground">{isRTL ? 'الرصيد المحتجز' : 'Held Balance'}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader><CardTitle>{isRTL ? 'إيداع مبلغ' : 'Deposit Funds'}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{isRTL ? 'المبلغ' : 'Amount'} ({sar})</Label>
            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="mt-1" />
          </div>
          <Button className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90" onClick={handleDeposit}>
            {isRTL ? 'إيداع' : 'Deposit'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
