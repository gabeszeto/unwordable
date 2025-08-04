import AnatomyInfo from './AnatomyInfo';
// import future info perks here

export default function HintInfoScreen({ perkKey, targetWord }) {
  switch (perkKey) {
    case 'Anatomy':
      return <AnatomyInfo targetWord={targetWord} />;
    // future:
    // case 'Etymology': return <EtymologyInfo targetWord={targetWord} />;
    default:
      return <div>Unknown perk info.</div>;
  }
}
