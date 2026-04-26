import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export const Route = createFileRoute('/client/contract')({
  component: ContractPage,
});

function ContractPage() {
  const { allowed, isLoading: guardLoading } = useAuthGuard('client');
  if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [contract, setContract] = useState({
    contract_id: 'c-1',
    title: isRTL ? 'عقد تصميم فيلا سكنية' : 'Residential Villa Design Contract',
    description: isRTL
      ? 'عقد بين صاحب المشروع والمكتب الهندسي لتنفيذ التصميم المعماري والإنشائي للفيلا السكنية بمساحة 500 متر مربع في حي النرجس بالرياض.'
      : 'Contract between the project owner and the engineering office for architectural and structural design of a 500 sqm residential villa in Al Narjis district, Riyadh.',
    created_at: '2025-01-10',
    is_client_signed: false,
    is_office_signed: true,
    client_id: 'u1',
    office_id: 'u2',
  });

  const handleSign = () => {
    setContract(prev => ({ ...prev, is_client_signed: true }));
    toast.success(isRTL ? 'تم توقيع العقد بنجاح' : 'Contract signed successfully');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-black">{isRTL ? 'العقد' : 'Contract'}</h1>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-gold" />
            <CardTitle>{contract.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/20 p-6 text-sm leading-relaxed whitespace-pre-line">
            {contract.description}
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{isRTL ? 'توقيع العميل:' : 'Client Signature:'}</span>
              {contract.is_client_signed
                ? <Badge className="bg-success text-success-foreground"><Check className="me-1 h-3 w-3" />{isRTL ? 'تم التوقيع' : 'Signed'}</Badge>
                : <Badge variant="secondary">{isRTL ? 'بانتظار التوقيع' : 'Pending'}</Badge>
              }
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{isRTL ? 'توقيع المكتب:' : 'Office Signature:'}</span>
              {contract.is_office_signed
                ? <Badge className="bg-success text-success-foreground"><Check className="me-1 h-3 w-3" />{isRTL ? 'تم التوقيع' : 'Signed'}</Badge>
                : <Badge variant="secondary">{isRTL ? 'بانتظار التوقيع' : 'Pending'}</Badge>
              }
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{isRTL ? 'تاريخ الإنشاء:' : 'Created:'} {contract.created_at}</p>

          {!contract.is_client_signed && (
            <Button size="lg" className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90" onClick={handleSign}>
              <Check className="me-2 h-5 w-5" />
              {isRTL ? 'توقيع العقد' : 'Sign Contract'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
