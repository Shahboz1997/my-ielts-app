"use client";

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import LandingPageLazy from '@/components/lazy/LandingPageLazy';
import GlowFollow from '@/components/GlowFollow';
import ChatAssistantLazy from '@/components/lazy/ChatAssistantLazy';
import { BankProvider } from '@/context/BankContext';
import WritingBankLazy from '@/components/lazy/WritingBankLazy';
import TaskEditorToolbar from '@/components/writer/TaskEditorToolbar';
import Task1Editor from '@/components/writer/Task1Editor';
import Task2Editor from '@/components/writer/Task2Editor';
import EssayEditor from '@/components/writer/EssayEditor';
import TaskEditorActions from '@/components/writer/TaskEditorActions';
import WriterHomeLabs from '@/components/writer/WriterHomeLabs';
import WriterResultsPanel from '@/components/writer/WriterResultsPanel';
import WriterDetailedAnalysisLazy from '@/components/lazy/WriterDetailedAnalysisLazy';
import WriterArchivePanel from '@/components/writer/WriterArchivePanel';
import WriterComparisonSection from '@/components/writer/WriterComparisonSection';
import WriterFeedbackBanner from '@/components/writer/WriterFeedbackBanner';
import WriterFooter from '@/components/writer/WriterFooter';
import { useWriterWorkspace } from '@/hooks/useWriterWorkspace';
import 'react-medium-image-zoom/dist/styles.css';

export default function WriterShell() {
  const {
    session,
    sessionStatus,
    forceLanding,
    isAuthOpen,
    setIsAuthOpen,
    authModalMessage,
    setAuthModalMessage,
    feedbackBanner,
    setFeedbackBanner,
    scrollToFeedbackForm,
    activeTab,
    setActiveTab,
    isMenuOpen,
    setIsMenuOpen,
    isLoggedIn,
    setIsLoggedIn,
    credits,
    darkMode,
    scrollToEditor,
    isGenLoadingT1,
    generateTask1Data,
    isGenLoadingLetter,
    generateLetterTask,
    customKeyword,
    setCustomKeyword,
    setGenTopicError,
    genTopicError,
    genLoading,
    handleGenerateTask2,
    task1Kind,
    setTask1Kind,
    setImageUploadError,
    resetTask1,
    resetTask2,
    timeLeft,
    timerActive,
    setTimerActive,
    isGtLetter,
    letterMeta,
    setLetterMeta,
    image,
    isDescribing,
    imageUploadError,
    handleImageUpload,
    currentTopic,
    isPromptOpen,
    setIsPromptOpen,
    promptT1Active,
    promptT2,
    setPromptT1Letter,
    setPromptT1Academic,
    setPromptT2,
    essayT1,
    essayT2,
    setEssayT1,
    setEssayT2,
    currentWordCount,
    targetWords,
    highlightRef,
    editorRef,
    handleScroll,
    renderColoredText,
    setIsFocused,
    playClickSound,
    saveCurrentToArchive,
    activeResult,
    isSaved,
    isSavingArchive,
    error,
    errorIs401,
    setError,
    setErrorIs401,
    handleAnalyze,
    loadingT1,
    loadingT2,
    activeResultsRef,
    downloadReport,
    shareReport,
    shareLoading,
    handleCriteriaScoreChange,
    handleResetToAiScores,
    activeResultT1,
    activeResultT2,
    activeAnalyzeLoading,
    appliedCorrections,
    handleReplaceWord,
    speak,
    triggerHighlight,
    insertLinkingWord,
    searchState,
    replaceNext,
    mergedLexicalUpgrade,
    handleApplyAllUpgrades,
    showCreditsExhausted,
    setShowSupportModal,
    karaokeAudio,
    archive,
    clearArchive,
    handleDeleteArchiveEntry,
    handleReviewArchiveEntry,
    handleSubmit,
    shareModal,
    setShareModal,
    copyShareLink,
    nativeShareLink,
    showSupportModal,
    supportFirstFieldRef,
    showScrollTop,
    scrollProgress,
    handleScrollToTop,
  } = useWriterWorkspace();

  const openLogin = (message) => {
    setAuthModalMessage(typeof message === 'string' && message.trim() ? message.trim() : null);
    setIsAuthOpen(true);
  };

  const showMarketingLanding = sessionStatus === 'unauthenticated' || forceLanding;

  if (showMarketingLanding) {
    return (
      <div className="relative min-h-[100dvh] bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300 overflow-y-auto overflow-x-hidden pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-0">
        <GlowFollow />
        <div className="relative z-0 min-h-[100dvh]">
          <LandingPageLazy
            onLoginClick={openLogin}
            onFullAnalysisClick={() => {
              setAuthModalMessage('Sign up to see your Band Score');
              setIsAuthOpen(true);
            }}
            isLoggedIn={sessionStatus === 'authenticated'}
          />
          <WriterFooter
            darkMode={darkMode}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLoginClick={openLogin}
            onSubmitFeedback={handleSubmit}
            feedbackBanner={feedbackBanner}
            shareModal={shareModal}
            setShareModal={setShareModal}
            copyShareLink={copyShareLink}
            nativeShareLink={nativeShareLink}
            showSupportModal={showSupportModal}
            setShowSupportModal={setShowSupportModal}
            supportFirstFieldRef={supportFirstFieldRef}
            showScrollTop={showScrollTop}
            scrollProgress={scrollProgress}
            onScrollToTop={handleScrollToTop}
          />
          <AnimatePresence>
            {isAuthOpen && (
              <AuthModal
                isOpen={isAuthOpen}
                onClose={() => {
                  setIsAuthOpen(false);
                  setAuthModalMessage(null);
                }}
                onLoginSuccess={() => {
                  setIsAuthOpen(false);
                  setAuthModalMessage(null);
                }}
                message={authModalMessage}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto overflow-x-hidden transition-colors duration-300 pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-0">
      <GlowFollow />
      <WriterFeedbackBanner
        feedbackBanner={feedbackBanner}
        onDismiss={() => setFeedbackBanner(null)}
        onGoToForm={() => {
          scrollToFeedbackForm();
          setFeedbackBanner(null);
        }}
      />
      <div className="relative z-0 flex flex-col flex-1 min-h-[100dvh]">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          isLoggedIn={isLoggedIn}
          credits={credits}
          onLoginClick={openLogin}
        />
        <AnimatePresence>
          {isAuthOpen && (
            <AuthModal
              isOpen={isAuthOpen}
              onClose={() => {
                setIsAuthOpen(false);
                setAuthModalMessage(null);
              }}
              onLoginSuccess={() => {
                setIsLoggedIn(true);
                setIsAuthOpen(false);
                setAuthModalMessage(null);
              }}
              message={authModalMessage}
            />
          )}
        </AnimatePresence>

        <div className="flex flex-1">
          <main className="flex-1 min-w-0 w-full max-w-7xl xl:max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 pt-4 md:pt-8 pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-8 bg-white dark:bg-slate-950 transition-colors duration-300">
            {activeTab === 'Home' && (
              <WriterHomeLabs
                darkMode={darkMode}
                onScrollToEditor={scrollToEditor}
                isGenLoadingT1={isGenLoadingT1}
                onGenerateTask1Chart={generateTask1Data}
                isGenLoadingLetter={isGenLoadingLetter}
                onGenerateLetterTask={generateLetterTask}
                customKeyword={customKeyword}
                onCustomKeywordChange={(value) => {
                  setCustomKeyword(value);
                  setGenTopicError(null);
                }}
                genTopicError={genTopicError}
                genLoading={genLoading}
                onGenerateTask2={handleGenerateTask2}
              />
            )}
            {(activeTab === 'Task 1' || activeTab === 'Task 2') && (
              <>
                <div className="flex flex-col gap-6 lg:gap-8">
                  <div className="flex flex-col gap-6 lg:gap-8 xl:grid xl:grid-cols-[1fr_min(380px,32%)] xl:items-start xl:gap-6">
                    <div className="order-1 flex min-w-0 w-full flex-col gap-6 lg:gap-8 xl:col-start-1 xl:row-start-1">
                      <div className="p-4 sm:p-6 xl:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <TaskEditorToolbar
                          activeTab={activeTab}
                          setActiveTab={setActiveTab}
                          task1Kind={task1Kind}
                          setTask1Kind={setTask1Kind}
                          setImageUploadError={setImageUploadError}
                          onClearDraft={() => (activeTab === 'Task 1' ? resetTask1() : resetTask2())}
                          timeLeft={timeLeft}
                          timerActive={timerActive}
                          setTimerActive={setTimerActive}
                        />
                        {activeTab === 'Task 1' && (
                          <Task1Editor
                            isGtLetter={isGtLetter}
                            darkMode={darkMode}
                            letterMeta={letterMeta}
                            setLetterMeta={setLetterMeta}
                            image={image}
                            isDescribing={isDescribing}
                            imageUploadError={imageUploadError}
                            onImageUpload={handleImageUpload}
                          />
                        )}
                        {activeTab === 'Task 2' && <Task2Editor currentTopic={currentTopic} />}
                        <EssayEditor
                          activeTab={activeTab}
                          darkMode={darkMode}
                          isGtLetter={isGtLetter}
                          isPromptOpen={isPromptOpen}
                          setIsPromptOpen={setIsPromptOpen}
                          promptValue={activeTab === 'Task 1' ? promptT1Active : promptT2}
                          onPromptChange={(value) => {
                            if (activeTab === 'Task 1') {
                              if (task1Kind === 'gt_letter') setPromptT1Letter(value);
                              else setPromptT1Academic(value);
                            } else setPromptT2(value);
                          }}
                          essayValue={activeTab === 'Task 1' ? essayT1 : essayT2}
                          onEssayChange={(value) => {
                            if (activeTab === 'Task 1') setEssayT1(value);
                            else setEssayT2(value);
                          }}
                          currentWordCount={currentWordCount}
                          targetWords={targetWords}
                          highlightRef={highlightRef}
                          editorRef={editorRef}
                          onScroll={handleScroll}
                          renderColoredText={renderColoredText}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          playClickSound={playClickSound}
                        />
                        <TaskEditorActions
                          onSave={saveCurrentToArchive}
                          saveDisabled={!activeResult}
                          isSaved={isSaved}
                          isSaving={isSavingArchive}
                          error={error}
                          errorIs401={errorIs401}
                          onDismissError={() => {
                            setError(null);
                            setErrorIs401(false);
                          }}
                          onAnalyze={() => {
                            if (typeof window !== 'undefined' && typeof window.gtagSendEvent === 'function') {
                              window.gtagSendEvent();
                            }
                            handleAnalyze(activeTab === 'Task 1' ? 'task1' : 'task2');
                          }}
                          analyzeLoading={activeTab === 'Task 1' ? loadingT1 : loadingT2}
                          analyzeDisabled={credits <= 0}
                        />
                      </div>
                    </div>

                    <WriterResultsPanel
                      resultsRef={activeResultsRef}
                      loading={activeTab === 'Task 1' ? loadingT1 : loadingT2}
                      activeResult={activeResult}
                      darkMode={darkMode}
                      onDownloadReport={downloadReport}
                      onShareReport={shareReport}
                      shareLoading={shareLoading}
                      hasSavedAnalysis={Boolean(activeResultT1?.savedId || activeResultT2?.savedId)}
                      onCriteriaScoreChange={handleCriteriaScoreChange}
                      onResetToAiScores={handleResetToAiScores}
                    />

                    <WriterDetailedAnalysisLazy
                      activeTab={activeTab}
                      darkMode={darkMode}
                      activeResult={activeResult}
                      activeAnalyzeLoading={activeAnalyzeLoading}
                      loadingT1={loadingT1}
                      loadingT2={loadingT2}
                      isGtLetter={isGtLetter}
                      appliedCorrections={appliedCorrections}
                      handleReplaceWord={handleReplaceWord}
                      speak={speak}
                      triggerHighlight={triggerHighlight}
                      insertLinkingWord={insertLinkingWord}
                      playClickSound={playClickSound}
                      searchState={searchState}
                      replaceNext={replaceNext}
                      mergedLexicalUpgrade={mergedLexicalUpgrade}
                      handleApplyAllUpgrades={handleApplyAllUpgrades}
                      setEssayT1={setEssayT1}
                      setEssayT2={setEssayT2}
                      essayT1={essayT1}
                      essayT2={essayT2}
                    />
                  </div>

                  <WriterComparisonSection
                    activeResult={activeResult}
                    activeAnalyzeLoading={activeAnalyzeLoading}
                    activeTab={activeTab}
                    darkMode={darkMode}
                    showCreditsExhausted={showCreditsExhausted}
                    onContactSupport={() => {
                      setShowSupportModal(false);
                      scrollToFeedbackForm();
                    }}
                    karaokeAudio={karaokeAudio}
                  />
                </div>
              </>
            )}
            {activeTab === 'Archive' && (
              <WriterArchivePanel
                darkMode={darkMode}
                archive={archive}
                onClearArchive={clearArchive}
                onDownloadEntry={downloadReport}
                onDeleteEntry={handleDeleteArchiveEntry}
                onReviewEntry={handleReviewArchiveEntry}
                onGoToTask1={() => {
                  setActiveTab('Task 1');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
            {activeTab === 'Bank' && (
              <BankProvider>
                <WritingBankLazy darkMode={darkMode} />
              </BankProvider>
            )}
          </main>
        </div>
        <WriterFooter
          darkMode={darkMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLoginClick={openLogin}
          onSubmitFeedback={handleSubmit}
          feedbackBanner={feedbackBanner}
          shareModal={shareModal}
          setShareModal={setShareModal}
          copyShareLink={copyShareLink}
          nativeShareLink={nativeShareLink}
          showSupportModal={showSupportModal}
          setShowSupportModal={setShowSupportModal}
          supportFirstFieldRef={supportFirstFieldRef}
          showScrollTop={showScrollTop}
          scrollProgress={scrollProgress}
          onScrollToTop={handleScrollToTop}
        />

        {(activeTab === 'Task 1' || activeTab === 'Task 2') && (
          <ChatAssistantLazy onSignIn={openLogin} />
        )}
      </div>
    </div>
  );
}
