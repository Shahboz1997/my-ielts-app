import { useEffect, useRef, useState } from 'react';
import { SUPPORT_EMAIL, buildFeedbackMailto } from '@/lib/support';
import { scrollToFeedbackForm } from '@/lib/writer/editorUi';

export function useWriterFeedback() {
  const [feedbackBanner, setFeedbackBanner] = useState(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const supportFirstFieldRef = useRef(null);

  useEffect(() => {
    if (!showSupportModal) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const t = window.setTimeout(() => {
      supportFirstFieldRef.current?.focus?.();
    }, 50);

    const onKeyDown = (ev) => {
      if (ev.key === 'Escape') setShowSupportModal(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [showSupportModal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedbackBanner(null);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const message = String(formData.get('message') ?? '').trim();

    if (!name || !email || !message) return;

    window.location.href = buildFeedbackMailto({ name, email, message });
    e.currentTarget.reset();
    setFeedbackBanner({
      kind: 'success',
      message: `Your email app should open with a draft to ${SUPPORT_EMAIL}. If it does not, email us directly.`,
    });
    if (showSupportModal) {
      window.setTimeout(() => setShowSupportModal(false), 1200);
    }
    window.setTimeout(() => {
      setFeedbackBanner((b) => (b?.kind === 'success' ? null : b));
    }, 10000);
  };

  return {
    feedbackBanner,
    setFeedbackBanner,
    showSupportModal,
    setShowSupportModal,
    supportFirstFieldRef,
    handleSubmit,
    scrollToFeedbackForm,
  };
}
