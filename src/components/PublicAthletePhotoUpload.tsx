import React, { useState } from 'react';
import { Camera, Image, Check, AlertCircle, RefreshCw, ArrowLeft, Trophy, Users } from 'lucide-react';
import { Participant } from '../types';

interface PublicAthletePhotoUploadProps {
  playerId: string;
  participants: Participant[];
  updateParticipantPhoto: (id: string, photoUrl: string | null) => Promise<boolean>;
  onBack: () => void;
}

export default function PublicAthletePhotoUpload({
  playerId,
  participants,
  updateParticipantPhoto,
  onBack,
}: PublicAthletePhotoUploadProps) {
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Find the player being modified
  const player = participants.find((p) => p.id === playerId);

  if (!player) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-gray-100 shadow-xl text-center font-sans">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
        <h2 className="text-xl font-black text-gray-800 uppercase">រកមិនឃើញទិន្នន័យកីឡាករ (Athlete Not Found)</h2>
        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
          The player reference might have been deleted or the URL parameters contain a typo. Please check with your supervisor.
        </p>
        <button
          onClick={onBack}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-extrabold text-xs uppercase tracking-wide cursor-pointer transition active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ត្រឡប់ទៅវិញ (Return Home)</span>
        </button>
      </div>
    );
  }

  // Find other instances of the same player name to also sync their photo
  const sameNamePlayers = participants.filter(
    (p) => p.name.toLowerCase().trim() === player.name.toLowerCase().trim()
  );

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setErrorMsg('រូបថតធំពេក! សូមជ្រើសរើសរូបថតដែលមានទំហំតូចជាង ៤MB (Image size should be less than 4MB)');
        return;
      }
      setErrorMsg(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!photoBase64) return;
    setIsUploading(true);
    setErrorMsg(null);

    try {
      // Sync photo across ALL registered player-sport records under the same name for perfect consistency
      let ok = true;
      for (const p of sameNamePlayers) {
        const result = await updateParticipantPhoto(p.id, photoBase64);
        if (!result) ok = false;
      }

      if (ok) {
        setIsSuccess(true);
      } else {
        setErrorMsg('មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ។ សូមព្យាយាមម្តងទៀត (Failed to write image data to backend.)');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected upload failure occurred.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 p-6 sm:p-8 bg-white rounded-3xl border-4 border-[#FFCC00] shadow-2xl font-sans relative overflow-hidden">
      
      {/* Decorative brand slant element */}
      <div className="absolute top-0 right-0 w-24 h-2 bg-[#D40511] transform rotate-45 translate-x-8 translate-y-2" />
      
      {/* Header */}
      <div className="text-center pb-4 mb-6 border-b border-gray-100">
        <div className="w-12 h-12 bg-[#FFCC00]/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Camera className="w-6 h-6 text-[#D40511]" />
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-[#D40511]/10 text-[#D40511] font-black text-[9px] uppercase tracking-wider">
          Games Day Profile Hub
        </span>
        <h2 className="font-dhl-title text-xl text-gray-950 italic mt-1 leading-tight uppercase">
          បញ្ចូលរូបថតកីឡាករ (ATHLETE PHOTO UPLOAD)
        </h2>
        <p className="text-gray-400 text-[10px] font-bold uppercase mt-0.5 tracking-wider">
          Direct secure upload without signing in
        </p>
      </div>

      {!isSuccess ? (
        <div className="space-y-6">
          
          {/* Athlete Metadata Preview Card */}
          <div className="bg-gray-50 border border-gray-150 p-4 rounded-2xl flex items-center gap-3.5 shadow-inner">
            <div className="w-12 h-12 bg-white rounded-xl border border-gray-150 flex items-center justify-center font-black text-[#D40511] text-sm font-mono shadow-sm">
              {player.sport_type.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left leading-tight">
              <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                ឈ្មោះកីឡាករ (Athlete name)
              </span>
              <h3 className="font-black text-gray-800 text-sm sm:text-base mt-0.5">
                {player.name}
              </h3>
              <div className="flex gap-1.5 mt-1">
                {sameNamePlayers.map((p) => (
                  <span
                    key={p.id}
                    className="px-1.5 py-0.5 rounded bg-[#FFCC00]/20 text-gray-950 text-[8px] font-bold uppercase tracking-wider"
                  >
                    {p.sport_type}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Upload selection container */}
          <div className="space-y-4">
            <div className="w-full aspect-square max-w-[260px] mx-auto rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden flex flex-col items-center justify-center relative group p-2">
              {photoBase64 || player.photo_url ? (
                <>
                  <img
                    src={photoBase64 || player.photo_url}
                    alt="Athlete Portrait"
                    className="w-full h-full object-cover rounded-2xl"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-x-2 bottom-2 bg-black/70 backdrop-blur-sm py-2 rounded-xl text-white text-[9px] font-bold uppercase text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    Selected Profile Shot
                  </div>
                </>
              ) : (
                <div className="text-center px-4 space-y-2">
                  <Image className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                    មិនទាន់មានរូបថត
                  </p>
                  <p className="text-[9px] text-gray-400 leading-tight">
                    Select a crisp portrait photograph of the competitor's face
                  </p>
                </div>
              )}
            </div>

            {/* Input triggers */}
            <div className="flex flex-col gap-2 max-w-[260px] mx-auto">
              <input
                type="file"
                accept="image/*"
                id="public-athlete-image"
                className="hidden"
                onChange={handlePhotoSelect}
                disabled={isUploading}
              />
              <label
                htmlFor="public-athlete-image"
                className={`w-full py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-extrabold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer select-none transition active:scale-95 ${
                  isUploading ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <Camera className="w-4 h-4 text-[#D40511]" />
                <span>ថតរូប ឬជ្រើសរើស (Capture / Pick photo)</span>
              </label>
            </div>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 text-red-700 rounded-xl border border-red-200 text-[11px] leading-relaxed flex gap-2 items-start animate-fade-in font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Back & Submit buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onBack}
              disabled={isUploading}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black uppercase text-xs tracking-wider rounded-xl transition active:scale-95 disabled:opacity-50 cursor-pointer text-center"
            >
              ត្រឡប់ទៅវិញ (Cancel)
            </button>
            <button
              onClick={handleUploadSubmit}
              disabled={!photoBase64 || isUploading}
              className={`flex-1 py-3 font-black uppercase text-xs italic tracking-wider rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                photoBase64 && !isUploading
                  ? 'bg-[#D40511] hover:bg-red-700 text-white shadow-md'
                  : 'bg-gray-150 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#FFCC00]" />
                  <span>សូមរង់ចាំ (Uploading...)</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#FFCC00]" />
                  <span>រក្សាទុក (Save Photo)</span>
                </>
              )}
            </button>
          </div>

        </div>
      ) : (
        /* SUCCESS ANIMATED CARD */
        <div className="py-8 text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-500 animate-bounce">
            <Check className="w-8 h-8 stroke-[3px]" />
          </div>
          <h3 className="font-dhl-title text-lg text-emerald-600 uppercase italic">
            ការរក្សាទុករូបថតជោគជ័យ! (Save Successful)
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
            រូបថតរបស់កីឡាករ <strong>{player.name}</strong> ត្រូវបានរក្សាទុកទៅក្នុងប្រព័ន្ធដោយជោគជ័យ និងធ្វើសមកាលកម្មទូទាំងរាល់វិញ្ញាសាដែលគាត់ចូលរួម។
            <br />
            The athlete profile picture is now live! It has synced across all divisions. Thank you for your contribution!
          </p>
          <div className="pt-3">
            <button
              onClick={onBack}
              className="w-full py-3 bg-[#FFCC00] hover:bg-[#ffe054] text-gray-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
            >
              ត្រឡប់ទៅទំព័រដើម (Back to Public Arena)
            </button>
          </div>
        </div>
      )}

      {/* Footer hint */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none flex items-center justify-center gap-1">
          <span className="text-[#FFCC00]">★</span> Excellence. Simply delivered.
        </span>
      </div>

    </div>
  );
}
