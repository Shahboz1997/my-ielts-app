import { useState } from 'react';
import toast from 'react-hot-toast';
import { createShareLink } from '@/lib/writer/writerApi';

export function useWriterShare({
  session,
  activeResult,
  activeResultT1,
  activeResultT2,
  setIsAuthOpen,
  syncBeforeShare,
}) {
  const [shareModal, setShareModal] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);

  const shareReport = async () => {
    if (!activeResult) {
      toast.error('Run an analysis first.');
      return;
    }
    if (!session?.user) {
      toast.error('Sign in to create a shareable link.');
      setIsAuthOpen(true);
      return;
    }

    const t1Id = activeResultT1?.savedId || null;
    const t2Id = activeResultT2?.savedId || null;
    const band =
      activeResult?.overall_band ??
      activeResult?.analysis?.overall_band ??
      activeResultT1?.overall_band ??
      activeResultT2?.overall_band ??
      '';

    if (!t1Id && !t2Id) {
      toast.error('No saved report found. Run Analyze again while signed in.');
      return;
    }

    setShareLoading(true);
    try {
      if (syncBeforeShare) {
        const syncRes = await syncBeforeShare();
        if (syncRes && !syncRes.ok) return;
      }

      const { ok, data } = await createShareLink({ t1Id, t2Id });
      if (!ok) {
        toast.error(data.error || 'Could not create share link.');
        return;
      }
      if (!data?.token) {
        toast.error('Share link was not returned.');
        return;
      }
      setShareModal({
        url: `${window.location.origin}/share/${data.token}`,
        band,
      });
    } catch {
      toast.error('Network error — try again.');
    } finally {
      setShareLoading(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareModal?.url) return;
    try {
      await navigator.clipboard.writeText(shareModal.url);
      toast.success('Link copied to clipboard!');
    } catch {
      window.prompt('Copy this link:', shareModal.url);
    }
  };

  const nativeShareLink = async () => {
    if (!shareModal?.url || typeof navigator.share !== 'function') return;
    const band = shareModal.band;
    try {
      await navigator.share({
        title: (band ? `IELTS Band ${band} Report` : 'IELTS Writing Report').trim(),
        text: band ? `IELTS Writing Report (Band ${band})` : 'IELTS Writing Report',
        url: shareModal.url,
      });
    } catch (err) {
      const msg = String(err?.message || '');
      if (!/abort|cancel/i.test(msg)) {
        toast.error('Sharing failed on this device.');
      }
    }
  };

  return {
    shareModal,
    setShareModal,
    shareLoading,
    shareReport,
    copyShareLink,
    nativeShareLink,
  };
}
