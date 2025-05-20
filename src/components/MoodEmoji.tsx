
import React from 'react';
import { Smile, Frown, Meh, Laugh, Angry, Heart } from 'lucide-react';

interface MoodEmojiProps {
  score: number;
  size?: number;
  className?: string;
  type?: 'general' | 'stress' | 'social' | 'energy' | 'satisfaction';
}

const MoodEmoji: React.FC<MoodEmojiProps> = ({ 
  score, 
  size = 32, 
  className = '', 
  type = 'general' 
}) => {
  const getMoodInfo = (score: number, type: string) => {
    // Base mood info with standard emojis
    if (score >= 8) {
      return { icon: <Laugh size={size} className="text-mood-great" />, label: 'Great' };
    } else if (score >= 6) {
      return { icon: <Smile size={size} className="text-mood-good" />, label: 'Good' };
    } else if (score >= 4) {
      return { icon: <Meh size={size} className="text-mood-okay" />, label: 'Okay' };
    } else if (score >= 2) {
      return { icon: <Frown size={size} className="text-mood-bad" />, label: 'Bad' };
    } else {
      return { icon: <Angry size={size} className="text-mood-terrible" />, label: 'Terrible' };
    }
  };

  const moodInfo = getMoodInfo(score, type);

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div className="transition-all duration-300 hover:scale-110">
        {moodInfo.icon}
      </div>
      <span className="text-sm font-medium text-primary dark:text-primary-foreground">{moodInfo.label}</span>
    </div>
  );
};

export default MoodEmoji;
