import {applyFlowMode,flowHref} from '../../flow-mode.js';
import {mountCourseProgress} from '../../progress-nav.js';
import {mountPageDots} from '../../page-dots.js';
import {mountWheelNav} from '../../wheel-nav.js';
import {installFullscreenShell,fsNavigate} from '../../fs-shell.js';

applyFlowMode();
installFullscreenShell();
mountCourseProgress(4);
mountPageDots();
mountWheelNav({next:()=>{fsNavigate(flowHref('thanks.html'));return true}});

const prevLink=document.querySelector('[data-prev]');
if(prevLink)prevLink.href=flowHref('scroll.html');

document.body.dataset.ready='true';
