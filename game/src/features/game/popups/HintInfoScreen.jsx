// src/features/infoscreen/HintInfoScreen.jsx
import AnatomyInfo from './AnatomyInfo';
import LetterLensInfo from '../../skills/LetterLensInfo';
// import future skill info components here

export default function HintInfoScreen({ perkKey, targetWord }) {
  return (
    <div className="hint-info-screen">
      {/* Perk-specific info (unchanged) */}
      {(() => {
        switch (perkKey) {
          case 'Anatomy':
            return <AnatomyInfo targetWord={targetWord} />;
          // future:
          // case 'Etymology': return <EtymologyInfo targetWord={targetWord} />;
          default:
            return <div>Unknown perk info.</div>;
        }
      })()}

      {/* Skills-based info (independent of perkKey) */}
      <div className="skills-info-block" style={{ marginTop: 12 }}>
        <LetterLensInfo targetWord={targetWord} />
        {/* Add more skill info components later, or render dynamically */}
      </div>
    </div>
  );
}
