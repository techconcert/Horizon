import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `const SanctuaryContent: React.FC = () => {
  const { state, setActiveTab, showSOSModal, setShowSOSModal, getTranslation } = useSanctuary();

  if (!state.onboarded) {
    return <OnboardingView />;
  }

  const [sessionUnlocked, setSessionUnlocked] = useState(false);
  const [passcode, setPasscode] = useState<string>('');

  // Handle automatic simulated authentication on mount if lock is on
  useEffect(() => {
    if (!state.biometricLock) {
      setSessionUnlocked(true);
    } else {
      setSessionUnlocked(false);
    }
  }, [state.biometricLock]);`,
  `const SanctuaryContent: React.FC = () => {
  const { state, setActiveTab, showSOSModal, setShowSOSModal, getTranslation } = useSanctuary();

  const [sessionUnlocked, setSessionUnlocked] = useState(false);
  const [passcode, setPasscode] = useState<string>('');

  // Handle automatic simulated authentication on mount if lock is on
  useEffect(() => {
    if (!state.biometricLock) {
      setSessionUnlocked(true);
    } else {
      setSessionUnlocked(false);
    }
  }, [state.biometricLock]);

  if (!state.onboarded) {
    return <OnboardingView />;
  }`
);

fs.writeFileSync('src/App.tsx', content);
