import type { ChatMessage } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const aiService = {
 // README: generateProjectDescription(input) — FR-31
 async generateProjectDescription(input: string, language: 'ar' | 'en' = 'ar'): Promise<string> {
 return this.generateDescription(input, language);
 },

 // README: onboardClient(message) — FR-30
 async onboardClient(message: string, language: 'ar' | 'en' = 'ar'): Promise<string> {
 return this.chat([{ role: 'user', content: message, timestamp: new Date() }], language);
 },

 // README: compareBids(bids) — FR-32
 async compareBids(bids: Array<{ price: number; timeline: number; office_id: string }>, language: 'ar' | 'en' = 'ar'): Promise<string> {
 try {
 const { data, error } = await supabase.functions.invoke('ai-chat', {
 body: {
 messages: [{ role: 'user', content: JSON.stringify(bids) }],
 language,
 action: 'compare_bids',
 },
 });
 if (error) throw error;
 return data?.content || '';
 } catch {
 const sorted = [...bids].sort((a, b) => a.price - b.price);
 const best = sorted[0];
 if (language === 'ar') {
 return ` العرض الأفضل: السعر ${best.price.toLocaleString()} ر.س — المدة ${best.timeline} يوم. نوصي بهذا العرض لأنه يقدم أفضل قيمة مقابل السعر.`;
 }
 return ` Best Bid: Price ${best.price.toLocaleString()} SAR — Timeline ${best.timeline} days. We recommend this bid for the best value.`;
 }
 },

 async chat(messages: ChatMessage[], language: 'ar' | 'en'): Promise<string> {
 try {
 const { data, error } = await supabase.functions.invoke('ai-chat', {
 body: {
 messages: messages.map(m => ({ role: m.role, content: m.content })),
 language,
 action: 'chat',
 },
 });
 if (error) throw error;
 return data?.content || (language === 'ar' ? 'عذراً، لم أتمكن من الرد.' : 'Sorry, I could not respond.');
 } catch {
 return this._mockChat(messages, language);
 }
 },

 async generateDescription(projectTitle: string, language: 'ar' | 'en'): Promise<string> {
 try {
 const { data, error } = await supabase.functions.invoke('ai-chat', {
 body: {
 messages: [{ role: 'user', content: projectTitle }],
 language,
 action: 'generate_description',
 },
 });
 if (error) throw error;
 return data?.content || '';
 } catch {
 if (language === 'ar') {
 return `مشروع ${projectTitle}: يتضمن تصميم وتنفيذ جميع الأعمال الهندسية المطلوبة وفقاً للمعايير السعودية.`;
 }
 return `Project ${projectTitle}: Design and execution of all required engineering works per Saudi standards.`;
 }
 },

 _mockChat(messages: ChatMessage[], language: 'ar' | 'en'): string {
 const last = messages[messages.length - 1]?.content || '';
 if (language === 'ar') {
 if (last.includes('مشروع')) return 'يمكنني مساعدتك في إنشاء طلب مشروع جديد. ما نوع المشروع الذي تريده؟';
 if (last.includes('عرض')) return 'لمقارنة العروض، يمكنك الذهاب إلى صفحة مقارنة العروض.';
 if (last.includes('تكلفة') || last.includes('سعر')) return 'يمكنك استخدام حاسبة التكاليف للحصول على تقدير فوري لتكلفة مشروعك.';
 return 'مرحباً! أنا مساعد عمران الذكي. كيف يمكنني مساعدتك؟';
 }
 if (last.includes('project')) return 'I can help you create a new project request. What type of project?';
 if (last.includes('bid')) return 'Visit the bid comparison page to analyze offers.';
 if (last.includes('cost') || last.includes('price')) return 'Use the cost estimator for an instant estimate.';
 return "Hello! I'm the Omran AI Assistant. How can I help you?";
 },
};
