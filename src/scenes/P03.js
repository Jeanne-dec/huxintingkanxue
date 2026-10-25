import {panel,btn,choices,feedback} from '../components.js'; import {content} from '../content.js';
export default ()=>panel('寻声 · 文字钥匙',`<p class="question">大雪三日，湖中 <span class="blank">____ ____</span>。</p><div class="group"><label>描写对象</label>${choices(content.soundObjects,'object')}</div><div class="group"><label>声音状态</label>${choices(content.soundStates,'state')}</div>${feedback()}`,`${btn('收起','home','secondary')}${btn('验证文字钥匙','placeholder','primary')}`,'key');

