import CareSceneIllustration from '../../components/CareSceneIllustration.jsx';
export default function AuthCareDoodle({ together = false }) {
  return <CareSceneIllustration scene={together ? 'home' : 'welcome'} className="auth-care-doodle"/>;
}
