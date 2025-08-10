// src/features/infoscreen/HintInfoScreen.jsx
import AnatomyInfo from './AnatomyInfo';
import LetterLensInfo from '../../skills/LetterLensInfo'; // <-- fix path
import { useSkills } from '../../../contexts/skills/SkillsContext';
import { getLetterLensHint } from '../../skills/helpers/getLetterLensHint'; // <-- compute hint upfront
import RepeaterInfo from '../../skills/RepeaterInfo';
import AnalysisInfo from '../../skills/AnalysisInfo';

export default function HintInfoScreen({ perkKey, targetWord }) {
  // --- Perk-specific block ---
  let perkContent = null;
  if (perkKey === 'Anatomy') {
    perkContent = <AnatomyInfo targetWord={targetWord} />;
  }

  // --- Skills block ---
  const { getSkillLevel } = useSkills();

  const letterLensLevel = getSkillLevel('LetterLens');
  const repeaterLevel = getSkillLevel('Repeater');
  const analysisLevel = getSkillLevel('Analysis');

  const letterLensHint = letterLensLevel ? getLetterLensHint(targetWord, letterLensLevel) : null;

  const showLetterLens = !!letterLensHint;
  const showRepeater = repeaterLevel > 0;
  const showAnalysis = analysisLevel > 0;

  const showAnySkill = showLetterLens || showRepeater || showAnalysis;

  const hasInfo = !!perkContent || showAnySkill;

  return (
    <div className="hint-info-screen">
      {hasInfo ? (
        <>
          {perkContent}
          {showAnySkill && (
            <div className="skills-info-block" style={{ marginTop: 12 }}>
              {showLetterLens && <LetterLensInfo targetWord={targetWord} />}
              {showRepeater && <RepeaterInfo targetWord={targetWord} />}
              {showAnalysis && <AnalysisInfo targetWord={targetWord} />}
            </div>
          )}
        </>
      ) : (
        <div className="no-info">No information available</div>
      )}
    </div>
  );
}
