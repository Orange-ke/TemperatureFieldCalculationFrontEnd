import Vue from 'vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import VueWorker from 'vue-worker'
import App from './App.vue'

Vue.use(ElementUI)
Vue.use(VueWorker)

new Vue({
  render: h => h(App),
}).$mount('#app')
