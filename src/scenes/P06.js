import {panel,btn,choices,feedback} from '../components.js'; import {content} from '../content.js';
export default ()=>panel('观白 · 文字钥匙',`<p class="subtitle">第三层 · 上下一白</p><p class="prompt sentence">雾凇沆砀，天与云与山与水，______。</p>${choices(content.white,'white',true)}${feedback()}`,`${btn('收起','home','secondary')}${btn('完成观白','placeholder','primary')}`,'tall');



