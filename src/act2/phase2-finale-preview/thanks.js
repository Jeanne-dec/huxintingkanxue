import {applyFlowMode,flowHref} from '../../flow-mode.js';
import {mountCourseProgress} from '../../progress-nav.js';
import {mountPageDots} from '../../page-dots.js';
import {mountWheelNav} from '../../wheel-nav.js';
import {installFullscreenShell,fsNavigate} from '../../fs-shell.js';

applyFlowMode();
installFullscreenShell();
mountCourseProgress(4);
mountPageDots();
mountWheelNav({prev:()=>{fsNavigate(flowHref('homework.html'));return true}});

document.body.dataset.ready='true';
