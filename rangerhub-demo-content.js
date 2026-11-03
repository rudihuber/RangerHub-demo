/* Demo presentation: keep all learning content accessible without PDF files. */
(() => {
  'use strict';
  const originalStage = openStageV15;
  const originalIntro = openObserverIntro;
  openObserverIntro = function () {
    originalIntro();
    if (db.growthTasks?.Beobachter?.length) {
      document.querySelector('.observerRight')?.insertAdjacentHTML('beforeend', '<button type="button" class="btn alt" data-observer-library onclick="RangerHub.openObserverLibrary()">Weitere Beobachter-Inhalte</button>');
    }
  };
  openStageV15 = function (stage) {
    if (stage === 'Beobachter') { closeM(); openObserverIntro(); return; }
    originalStage(stage);
  };
  RangerHub.openObserverLibrary = () => originalStage('Beobachter');
  RangerHub.demoContentReady = true;
})();
