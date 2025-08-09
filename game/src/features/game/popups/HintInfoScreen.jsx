// src/features/infoscreen/HintInfoScreen.jsx
import AnatomyInfo from './AnatomyInfo';
import LetterLensInfo from '../../skills/LetterLensInfo'; // <-- fix path
import { useSkills } from '../../../contexts/skills/SkillsContext';
import { getLetterLensHint } from '../../skills/helpers/getLetterLensHint'; // <-- compute hint upfront
import RepeaterInfo from '../../skills/RepeaterInfo';
import InsightInfo from '../../skills/InsightInfo';

export default function HintInfoScreen({ perkKey, targetWord }) {
  // --- Perk-specific block ---
  let perkContent = null;
  if (perkKey === 'Anatomy') {
    perkContent = <AnatomyInfo targetWord={targetWord} />;
  }

  // --- Skills block (decide before rendering components) ---
  const { getSkillLevel } = useSkills();
  const letterLensLevel = getSkillLevel('LetterLens');
  const letterLensHint = letterLensLevel ? getLetterLensHint(targetWord, letterLensLevel) : null;
  const showLetterLens = !!letterLensHint;

  const hasInfo = !!perkContent || showLetterLens;

  return (
    <div className="hint-info-screen">
      {hasInfo ? (
        <>
          {perkContent}
          {(showLetterLens) && (
            <div className="skills-info-block" style={{ marginTop: 12 }}>
              <LetterLensInfo targetWord={targetWord} />
              <RepeaterInfo targetWord={targetWord} />
              <InsightInfo targetWord={targetWord} />
            </div>
          )}
        </>
      ) : (
        <div className="no-info">No information available</div>
      )}
    </div>
  );
}
