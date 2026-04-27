import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Building2, Search, FileText, Home, Building, Store, Landmark } from 'lucide-react';
import { SAUDI_CITIES } from '@/types';

export const Route = createFileRoute('/estimator')({
  component: CostEstimatorPage,
  head: () => ({
    meta: [
      { title: 'حاسبة تكلفة المشروع — عمران' },
      { name: 'description', content: 'احسب تكلفة مشروعك الهندسي مجاناً. تقدير استرشادي واقعي موجّه للسوق السعودي.' },
    ],
  }),
});

type ProjectType = 'villa' | 'rest_house' | 'apartment' | 'commercial' | 'mixed_use' | 'other';
type FinishLevel = 'skeleton' | 'standard' | 'commercial' | 'luxury' | 'super_luxury' | 'high_luxury';
type Complexity = 'low' | 'medium' | 'high';

type CostLine = {
  key: string;
  labelAr: string;
  labelEn: string;
  min: number;
  max: number;
};

type EstimationResult = {
  projectLabelAr: string;
  projectLabelEn: string;
  builtArea: number;
  lines: CostLine[];
  totalMin: number;
  totalMax: number;
  sqmMin: number;
  sqmMax: number;
};

const PROJECT_TYPES: Array<{ key: ProjectType; ar: string; en: string; descAr: string; descEn: string; icon: any }> = [
  { key: 'villa', ar: 'فيلا', en: 'Villa', descAr: 'سكن خاص متعدد الأدوار', descEn: 'Private multi-floor residence', icon: Home },
  { key: 'rest_house', ar: 'استراحة', en: 'Rest House / Istiraha', descAr: 'مشروع ترفيهي سكني خفيف', descEn: 'Leisure-oriented low-rise project', icon: Landmark },
  { key: 'apartment', ar: 'عمارة شقق', en: 'Apartment Building', descAr: 'مبنى سكني متعدد الوحدات', descEn: 'Multi-unit residential building', icon: Building2 },
  { key: 'commercial', ar: 'مبنى تجاري', en: 'Commercial Building', descAr: 'معارض ومكاتب ومحلات', descEn: 'Shops, offices, and commercial spaces', icon: Store },
  { key: 'mixed_use', ar: 'سكني تجاري مختلط', en: 'Residential-Commercial Mixed', descAr: 'محلات مع وحدات سكنية', descEn: 'Shops + residential units', icon: Building },
  { key: 'other', ar: 'أخرى', en: 'Other', descAr: 'مشروع خاص بحالة مختلفة', descEn: 'Custom project scenario', icon: Calculator },
];

const CITY_MULTIPLIER: Record<string, number> = {
  'الرياض': 1.08,
  'جدة': 1.1,
  'مكة المكرمة': 1.12,
  'المدينة المنورة': 1.06,
  'الدمام': 1.02,
  'الخبر': 1.04,
  'الظهران': 1.04,
  'ينبع': 1.0,
  'أبها': 0.95,
};
const DEFAULT_CITY_MULTIPLIER = 0.96;

const FINISHING_MULTIPLIER: Record<FinishLevel, [number, number]> = {
  skeleton: [0, 0],
  standard: [1.0, 1.15],
  commercial: [1.15, 1.3],
  luxury: [1.3, 1.55],
  super_luxury: [1.55, 1.85],
  high_luxury: [1.85, 2.2],
};

const PROJECT_BASE_RATES: Record<ProjectType, { structure: [number, number]; finishingBase: [number, number] }> = {
  villa: { structure: [1350, 1750], finishingBase: [420, 650] },
  rest_house: { structure: [1150, 1450], finishingBase: [350, 560] },
  apartment: { structure: [1500, 2000], finishingBase: [480, 760] },
  commercial: { structure: [1700, 2350], finishingBase: [560, 980] },
  mixed_use: { structure: [1650, 2250], finishingBase: [540, 920] },
  other: { structure: [1400, 1950], finishingBase: [430, 720] },
};

const PROJECT_DENSITY_FACTOR: Record<ProjectType, number> = {
  villa: 0.62,
  rest_house: 0.42,
  apartment: 0.78,
  commercial: 0.82,
  mixed_use: 0.85,
  other: 0.6,
};

const fmt = (value: number) => Math.round(value).toLocaleString();
const toNumber = (value: string, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

function CostEstimatorPage() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const sar = isRTL ? 'ر.س' : 'SAR';

  const [projectType, setProjectType] = useState<ProjectType | null>(null);
  const [city, setCity] = useState('');
  const [landArea, setLandArea] = useState('');
  const [builtUpArea, setBuiltUpArea] = useState('');

  const [floors, setFloors] = useState('1');
  const [facades, setFacades] = useState('1');
  const [apartments, setApartments] = useState('6');
  const [elevators, setElevators] = useState('1');
  const [shops, setShops] = useState(false);
  const [basement, setBasement] = useState(false);
  const [annex, setAnnex] = useState(false);
  const [roofRooms, setRoofRooms] = useState(false);
  const [pools, setPools] = useState(false);
  const [landscape, setLandscape] = useState(false);
  const [finishLevel, setFinishLevel] = useState<FinishLevel>('standard');
  const [complexity, setComplexity] = useState<Complexity>('medium');

  const [result, setResult] = useState<EstimationResult | null>(null);

  const selectedTypeMeta = useMemo(
    () => PROJECT_TYPES.find((p) => p.key === projectType) ?? null,
    [projectType],
  );

  const calculate = () => {
    if (!projectType) return;

    const land = toNumber(landArea);
    const floorsNum = Math.max(1, toNumber(floors, 1));
    const cityMul = CITY_MULTIPLIER[city] ?? DEFAULT_CITY_MULTIPLIER;

    if (land <= 0) return;

    const manualBuilt = toNumber(builtUpArea);
    // When built_area is empty/0, default to land area instead of guessing via
    // density × floors (which can exceed the land itself for multi-storey input).
    const effectiveBuilt = manualBuilt > 0 ? manualBuilt : land;

    const rates = PROJECT_BASE_RATES[projectType];
    const [structureMinRate, structureMaxRate] = rates.structure;
    const [finishBaseMin, finishBaseMax] = rates.finishingBase;
    const [finishMulMin, finishMulMax] = FINISHING_MULTIPLIER[finishLevel];

    const complexityMultiplier = complexity === 'low' ? [0.94, 0.98] : complexity === 'high' ? [1.08, 1.16] : [1, 1.08];

    const structureLine: CostLine = {
      key: 'construction',
      labelAr: projectType === 'villa' ? 'تكلفة الهيكل (الأرضي + المتكرر)' : 'تكلفة الإنشاء الأساسية',
      labelEn: projectType === 'villa' ? 'Structural Works (Ground + Repeated Floors)' : 'Base Structural Works',
      min: effectiveBuilt * structureMinRate * cityMul * complexityMultiplier[0],
      max: effectiveBuilt * structureMaxRate * cityMul * complexityMultiplier[1],
    };

    const finishingLine: CostLine = {
      key: 'finishing',
      labelAr: 'تكلفة التشطيب',
      labelEn: 'Finishing Cost',
      min: effectiveBuilt * finishBaseMin * finishMulMin * cityMul,
      max: effectiveBuilt * finishBaseMax * finishMulMax * cityMul,
    };

    const perimeter = 4 * Math.sqrt(Math.max(land, 1));
    const facadeFactor = 1 + (Math.max(1, toNumber(facades, 1)) - 1) * 0.045;

    const wallFenceLine: CostLine = {
      key: 'wall_fence',
      labelAr: 'تكلفة السور الخارجي',
      labelEn: 'Boundary Wall / Fence Cost',
      min: perimeter * 2.8 * 260 * cityMul,
      max: perimeter * 3.1 * 390 * cityMul,
    };

    const roofFenceLine: CostLine = {
      key: 'roof_fence',
      labelAr: 'تكلفة دروة السطح',
      labelEn: 'Roof Parapet Cost',
      min: effectiveBuilt * 0.055 * 220 * cityMul,
      max: effectiveBuilt * 0.08 * 360 * cityMul,
    };

    const waterTankLine: CostLine = {
      key: 'water_tank',
      labelAr: 'تكلفة خزان المياه',
      labelEn: 'Water Tank Cost',
      min: projectType === 'apartment' || projectType === 'commercial' || projectType === 'mixed_use' ? 14000 * cityMul : 9000 * cityMul,
      max: projectType === 'apartment' || projectType === 'commercial' || projectType === 'mixed_use' ? 32000 * cityMul : 18000 * cityMul,
    };

    const septicApplicable = projectType === 'villa' || projectType === 'rest_house' || projectType === 'other';
    const septicLine: CostLine = {
      key: 'septic',
      labelAr: 'تكلفة البيارة/الصرف',
      labelEn: 'Septic / Drainage Pit Cost',
      min: septicApplicable ? 8500 * cityMul : 0,
      max: septicApplicable ? 21000 * cityMul : 0,
    };

    const annexLine: CostLine = {
      key: 'annex',
      labelAr: 'تكلفة الملحق',
      labelEn: 'Annex Cost',
      min: annex ? (land * 0.12) * 1100 * cityMul : 0,
      max: annex ? (land * 0.2) * 1750 * cityMul : 0,
    };

    const optionalItems: CostLine[] = [];

    if (basement) {
      optionalItems.push({
        key: 'basement',
        labelAr: 'إضافة القبو/مواقف القبو',
        labelEn: 'Basement / Underground Parking',
        min: (land * 0.55) * 1000 * cityMul,
        max: (land * 0.7) * 1650 * cityMul,
      });
    }

    if (roofRooms) {
      optionalItems.push({
        key: 'roof_rooms',
        labelAr: 'غرف السطح',
        labelEn: 'Roof Rooms',
        min: 30000 * cityMul,
        max: 76000 * cityMul,
      });
    }

    if (pools) {
      optionalItems.push({
        key: 'pool',
        labelAr: 'حوض السباحة',
        labelEn: 'Swimming Pool',
        min: 52000 * cityMul,
        max: 165000 * cityMul,
      });
    }

    if (landscape) {
      optionalItems.push({
        key: 'landscape',
        labelAr: 'جلسات خارجية وتنسيق الموقع',
        labelEn: 'Landscape and Outdoor Seating',
        min: (land * 0.18) * 160 * cityMul,
        max: (land * 0.35) * 360 * cityMul,
      });
    }

    const elevatorCount = Math.max(0, toNumber(elevators, 0));
    if (projectType === 'apartment' || projectType === 'commercial' || projectType === 'mixed_use') {
      optionalItems.push({
        key: 'elevators',
        labelAr: 'المصاعد',
        labelEn: 'Elevators',
        min: elevatorCount * 95000 * cityMul,
        max: elevatorCount * 185000 * cityMul,
      });
    }

    if (projectType === 'apartment') {
      const units = Math.max(1, toNumber(apartments, 1));
      optionalItems.push({
        key: 'services_core',
        labelAr: 'نواة الخدمات المشتركة',
        labelEn: 'Shared Services Core',
        min: units * 4500 * cityMul,
        max: units * 9000 * cityMul,
      });
    }

    if ((projectType === 'apartment' || projectType === 'mixed_use') && shops) {
      optionalItems.push({
        key: 'shops',
        labelAr: 'تهيئة محلات الدور الأرضي',
        labelEn: 'Ground-Floor Shop Enablement',
        min: 85000 * cityMul,
        max: 260000 * cityMul,
      });
    }

    const optionsSubtotal: CostLine = {
      key: 'optional_subtotal',
      labelAr: 'إجمالي الإضافات الاختيارية',
      labelEn: 'Optional Additions Subtotal',
      min: optionalItems.reduce((sum, line) => sum + line.min, 0),
      max: optionalItems.reduce((sum, line) => sum + line.max, 0),
    };

    const baseLines = [structureLine, finishingLine, optionsSubtotal, wallFenceLine, roofFenceLine, waterTankLine, septicLine, annexLine]
      .map((line) => ({
        ...line,
        min: line.min * facadeFactor,
        max: line.max * facadeFactor,
      }));

    const detailLines = [...baseLines, ...optionalItems];

    const totalMin = detailLines.reduce((sum, line) => sum + line.min, 0);
    const totalMax = detailLines.reduce((sum, line) => sum + line.max, 0);
    const sqmMin = totalMin / Math.max(effectiveBuilt, 1);
    const sqmMax = totalMax / Math.max(effectiveBuilt, 1);

    setResult({
      projectLabelAr: selectedTypeMeta?.ar || 'مشروع',
      projectLabelEn: selectedTypeMeta?.en || 'Project',
      builtArea: effectiveBuilt,
      lines: detailLines,
      totalMin,
      totalMax,
      sqmMin,
      sqmMax,
    });
  };

  const toggleField = (value: boolean, setter: (next: boolean) => void) => (
    <div className="flex gap-2">
      <Button type="button" variant={value ? 'default' : 'outline'} size="sm" onClick={() => setter(true)}>
        {isRTL ? 'نعم' : 'Yes'}
      </Button>
      <Button type="button" variant={!value ? 'default' : 'outline'} size="sm" onClick={() => setter(false)}>
        {isRTL ? 'لا' : 'No'}
      </Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="text-center mb-8">
        <Calculator className="mx-auto h-12 w-12 text-gold mb-3" />
        <h1 className="text-3xl font-black md:text-4xl">{isRTL ? 'حاسبة تكلفة المشروع' : 'Project Cost Estimator'}</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          {isRTL
            ? 'نموذج تقديري موجّه للسوق السعودي لتكوين صورة أولية قبل العروض التنفيذية.'
            : 'A Saudi-oriented preliminary estimate model to give you an initial cost picture before final quotations.'}
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{isRTL ? '1) اختر نوع المشروع' : '1) Choose Project Type'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {PROJECT_TYPES.map((type) => {
              const Icon = type.icon;
              const selected = projectType === type.key;
              return (
                <button
                  key={type.key}
                  type="button"
                  onClick={() => setProjectType(type.key)}
                  className={`rounded-xl border p-4 text-start transition-all ${selected ? 'border-gold bg-gold/10 shadow-sm' : 'hover:border-gold/40'}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-gold" />
                    <p className="font-bold">{isRTL ? type.ar : type.en}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{isRTL ? type.descAr : type.descEn}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {projectType && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{isRTL ? '2) أدخل بيانات المشروع' : '2) Enter Project Details'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>{isRTL ? 'المدينة' : 'City'}</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر المدينة' : 'Select city'} /></SelectTrigger>
                  <SelectContent>
                    {SAUDI_CITIES.map((c) => (
                      <SelectItem key={c.ar} value={c.ar}>{isRTL ? c.ar : c.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isRTL ? 'مساحة الأرض (م²)' : 'Land Area (m²)'}</Label>
                <Input type="number" dir="ltr" value={landArea} onChange={(e) => setLandArea(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{isRTL ? 'المساحة المبنية (اختياري)' : 'Built-up Area (optional)'}</Label>
                <Input type="number" dir="ltr" value={builtUpArea} onChange={(e) => setBuiltUpArea(e.target.value)} />
              </div>
            </div>

            {(projectType === 'villa' || projectType === 'apartment' || projectType === 'commercial' || projectType === 'mixed_use' || projectType === 'other') && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{isRTL ? 'عدد الأدوار' : 'Floors'}</Label>
                  <Input type="number" dir="ltr" min="1" value={floors} onChange={(e) => setFloors(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? 'عدد الواجهات' : 'Street Facades'}</Label>
                  <Select value={facades} onValueChange={setFacades}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? 'مرحلة/مستوى التشطيب' : 'Construction Stage / Finish Level'}</Label>
                  <Select value={finishLevel} onValueChange={(v) => setFinishLevel(v as FinishLevel)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skeleton">{isRTL ? 'هيكل فقط' : 'Skeleton only'}</SelectItem>
                      <SelectItem value="standard">{isRTL ? 'تشطيب قياسي' : 'Standard finishing'}</SelectItem>
                      <SelectItem value="commercial">{isRTL ? 'تشطيب تجاري' : 'Commercial finishing'}</SelectItem>
                      <SelectItem value="luxury">{isRTL ? 'فاخر' : 'Luxury'}</SelectItem>
                      <SelectItem value="super_luxury">{isRTL ? 'فاخر جداً' : 'Super luxury'}</SelectItem>
                      <SelectItem value="high_luxury">{isRTL ? 'هاي لوكس' : 'High luxury'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {(projectType === 'villa' || projectType === 'rest_house' || projectType === 'apartment' || projectType === 'commercial' || projectType === 'mixed_use') && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{isRTL ? 'قبو؟' : 'Basement?'}</Label>
                  {toggleField(basement, setBasement)}
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? 'ملحق؟' : 'Annex?'}</Label>
                  {toggleField(annex, setAnnex)}
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? 'غرف سطح؟' : 'Roof rooms?'}</Label>
                  {toggleField(roofRooms, setRoofRooms)}
                </div>
              </div>
            )}

            {projectType === 'apartment' && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{isRTL ? 'عدد الشقق' : 'Number of Apartments'}</Label>
                  <Input type="number" dir="ltr" min="1" value={apartments} onChange={(e) => setApartments(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? 'عدد المصاعد' : 'Elevator Count'}</Label>
                  <Input type="number" dir="ltr" min="0" value={elevators} onChange={(e) => setElevators(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? 'محلات أرضي؟' : 'Ground Floor Shops?'}</Label>
                  {toggleField(shops, setShops)}
                </div>
              </div>
            )}

            {(projectType === 'commercial' || projectType === 'mixed_use') && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{isRTL ? 'عدد المصاعد' : 'Elevator Count'}</Label>
                  <Input type="number" dir="ltr" min="0" value={elevators} onChange={(e) => setElevators(e.target.value)} />
                </div>
                {projectType === 'mixed_use' && (
                  <div className="space-y-2">
                    <Label>{isRTL ? 'محلات أرضي؟' : 'Ground Floor Shops?'}</Label>
                    {toggleField(shops, setShops)}
                  </div>
                )}
              </div>
            )}

            {projectType === 'rest_house' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{isRTL ? 'مسبح؟' : 'Pool?'}</Label>
                  {toggleField(pools, setPools)}
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? 'جلسات/تنسيق خارجي؟' : 'Landscape / Outdoor seating?'}</Label>
                  {toggleField(landscape, setLandscape)}
                </div>
              </div>
            )}

            {projectType === 'other' && (
              <div className="space-y-2 max-w-sm">
                <Label>{isRTL ? 'تعقيد المشروع' : 'Project Complexity'}</Label>
                <Select value={complexity} onValueChange={(v) => setComplexity(v as Complexity)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{isRTL ? 'منخفض' : 'Low'}</SelectItem>
                    <SelectItem value="medium">{isRTL ? 'متوسط' : 'Medium'}</SelectItem>
                    <SelectItem value="high">{isRTL ? 'مرتفع' : 'High'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90" onClick={calculate} disabled={!city || !landArea}>
              {isRTL ? 'احسب التقدير' : 'Calculate Estimate'}
            </Button>
          </CardContent>
        </Card>
      )}

      {result && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {isRTL ? '3) نتيجة التقدير التفصيلية' : '3) Detailed Estimate Result'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/20 p-4 text-sm">
                <p>
                  <span className="font-bold">{isRTL ? 'نوع المشروع:' : 'Project type:'}</span> {isRTL ? result.projectLabelAr : result.projectLabelEn}
                </p>
                <p>
                  <span className="font-bold">{isRTL ? 'المساحة المبنية التقديرية:' : 'Estimated built-up area:'}</span> {fmt(result.builtArea)} {isRTL ? 'م²' : 'm²'}
                </p>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <div className="grid grid-cols-3 bg-muted/40 px-4 py-2 text-xs font-bold uppercase tracking-wide">
                  <span>{isRTL ? 'البند' : 'Line Item'}</span>
                  <span>{isRTL ? 'الحد الأدنى' : 'Min'}</span>
                  <span>{isRTL ? 'الحد الأعلى' : 'Max'}</span>
                </div>
                {result.lines.map((line) => (
                  <div key={line.key} className="grid grid-cols-3 px-4 py-2 text-sm border-t">
                    <span>{isRTL ? line.labelAr : line.labelEn}</span>
                    <span>{fmt(line.min)} {sar}</span>
                    <span>{fmt(line.max)} {sar}</span>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
                  <p className="text-xs text-muted-foreground">{isRTL ? 'إجمالي التكلفة التقديرية' : 'Estimated Total Cost'}</p>
                  <p className="text-lg font-black text-gold">{fmt(result.totalMin)} - {fmt(result.totalMax)} {sar}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">{isRTL ? 'السعر التقديري لكل م²' : 'Estimated Price per m²'}</p>
                  <p className="text-lg font-bold">{fmt(result.sqmMin)} - {fmt(result.sqmMax)} {sar}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">{isRTL ? 'ملاحظة' : 'Notice'}</p>
                  <p className="text-sm">
                    {isRTL
                      ? 'هذا التقدير استرشادي وغير ملزم تعاقدياً. السعر النهائي يعتمد على المخططات النهائية والعروض التنفيذية.'
                      : 'This is a preliminary non-binding estimate. Final pricing depends on final drawings and execution quotations.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Link to="/client/catalog">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6 text-center">
                  <Search className="mx-auto h-8 w-8 text-gold mb-2" />
                  <p className="font-bold">{isRTL ? 'تصفح خدمات المكاتب وابدأ فوراً' : 'Browse office services and start instantly'}</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/client/submit-request">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6 text-center">
                  <FileText className="mx-auto h-8 w-8 text-gold mb-2" />
                  <p className="font-bold">{isRTL ? 'انشر طلبك واستلم عروضاً' : 'Post your request and receive bids'}</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/register">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6 text-center">
                  <Building2 className="mx-auto h-8 w-8 text-gold mb-2" />
                  <p className="font-bold">{isRTL ? 'سجّل وابدأ مع المقاولين والمكاتب بضغطة زر' : 'Register and start with contractors and engineering offices in one click'}</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
