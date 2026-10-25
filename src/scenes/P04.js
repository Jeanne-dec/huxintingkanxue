import {panel,btn,choices,feedback} from '../components.js'; import {content} from '../content.js';
export default ({whiteReady=false}={})=>panel('观白 · 文字钥匙',`<p class="subtitle">第一层 · 雾凇沆砀</p><p class="prompt">雪后，天地间呈现怎样的景象？</p>${choices(content.frost,'frost',true)}${feedback()}`,`${btn('收起','home','secondary')}${whiteReady?btn('下一个','next-white','primary'):btn('确认','placeholder','primary')}`,'tall');


