import {panel,btn,audio} from '../components.js';
export default ()=>panel('寻声 · 发现声境',`${audio()}<div class="sound-question"><h3>你听到了什么？</h3><p>这与张岱笔下的雪湖相符吗？</p></div>`,`${btn('寻文为钥','next','primary')}`,'sound');
