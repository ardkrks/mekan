import { Smartphone, Share, PlusSquare, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

interface PWAReferredProps {
  onBack: () => void;
}

export default function PWAInstructions({ onBack }: PWAReferredProps) {
  return (
    <div className="flex flex-col h-full bg-[#0d0f17] text-slate-100 font-sans">
      {/* iOS App Navigation Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-[#0d0f17]/80 backdrop-blur-md border-b border-slate-800/80 flex-shrink-0 sticky top-0 z-30">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-indigo-400 font-bold text-sm outline-none cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span>Geri</span>
        </button>
        <span className="font-extrabold text-slate-100 text-sm">iPhone Kurulum Rehberi</span>
        <div className="w-8"></div>
      </div>

      {/* Content wrapper */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-12">
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 bg-indigo-500/10 rounded-2xl items-center justify-center text-indigo-400 border border-indigo-500/20 mx-auto">
            <Smartphone size={32} />
          </div>
          <h2 className="text-lg font-black text-slate-100 tracking-tight">Ana Ekrana Ekleyip Native App Yapın</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            Bu uygulama iOS cihazlar için tamamen optimize edilmiş bir PWA (Progressive Web App)'dir. Safari üzerinden yükleyerek tam ekran, native hisli bir mobil uygulama yapabilirsiniz.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {/* Step 1 */}
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-start gap-4 p-4 bg-[#131726]/80 rounded-2xl border border-slate-800/60 shadow-md"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 flex items-center justify-center font-bold text-sm flex-shrink-0">
              1
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-200 text-sm">Safari Tarayıcıyı Kullanın</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                iPhone cihazınızda varsayılan **Safari** tarayıcısından bu site adresini açın. (Diğer tarayıcılar ana ekrana eklemeyi kısıtlar)
              </p>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-start gap-4 p-4 bg-[#131726]/80 rounded-2xl border border-slate-800/60 shadow-md"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 flex items-center justify-center font-bold text-sm flex-shrink-0">
              2
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-200 text-sm">Paylaş Menüsünü Açın</h3>
                <Share size={16} className="text-indigo-400 animate-pulse" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Safari ekranının altındaki gezinti çubuğunda ortada bulunan **Paylaş (Share)** butonuna tıklayın.
              </p>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-4 p-4 bg-[#131726]/80 rounded-2xl border border-slate-800/60 shadow-md"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 flex items-center justify-center font-bold text-sm flex-shrink-0">
              3
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-200 text-sm">Ana Ekrana Ekle Butonuna Basın</h3>
                <PlusSquare size={16} className="text-indigo-400" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Açılan menüde aşağı kaydırarak **Ana Ekrana Ekle (Add to Home Screen)** satırını bulun ve dokunun.
              </p>
            </div>
          </motion.div>

          {/* Step 4 */}
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-start gap-4 p-4 bg-[#131726]/80 rounded-2xl border border-slate-800/60 shadow-md"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 flex items-center justify-center font-bold text-sm flex-shrink-0">
              4
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-200 text-sm">Kurulumu Tamamlayın</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sağ üst köşedeki **Ekle (Add)** butonuna tıklayın. **Ardanın Mekanı** artık telefonunuzun ana ekranında bağımsız bir uygulama olarak yer alacaktır!
              </p>
            </div>
          </motion.div>
        </div>

        {/* Benefits banner */}
        <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/15 text-slate-100 space-y-2">
          <h4 className="font-extrabold text-xs uppercase tracking-widest text-[#a5b4fc]">Peki Ne Kazanacaksınız?</h4>
          <ul className="text-xs text-slate-300 list-disc list-inside space-y-1 leading-relaxed">
            <li>Üst ve alt tarayıcı çubukları gizlenir, tam ekran açılır.</li>
            <li>Çok daha hızlı ve akıcı performans sağlar.</li>
            <li>Gerçek iMessage hissi veren native mobil deneyim sunar.</li>
            <li>Arkadaşlarınızla dilediğiniz gibi grupta sohbet edebilirsiniz.</li>
          </ul>
        </div>

        {/* App link sharing helper */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-400">
            Dilerseniz bu rehberi veya bu adresi WhatsApp/iMessage ile arkadaşlarınıza gönderip onların da anında katılmasını sağlayabilirsiniz!
          </p>
        </div>
      </div>
    </div>
  );
}
