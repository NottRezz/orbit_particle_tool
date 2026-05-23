import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './global.scss'
import 'animate.css'

createApp(App).use(createPinia()).mount('#app')
